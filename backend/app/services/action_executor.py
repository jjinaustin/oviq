import json
import logging
from datetime import datetime, timezone
from typing import Optional

import anthropic
import resend

from app.core.config import settings
from app.db.client import get_supabase

logger = logging.getLogger(__name__)

SYSTEM_PROMPT = """You are Oviq, an AI operations coordinator for a freight logistics company.
You handle shipment exceptions professionally and efficiently.
Be concise, factual, and action-oriented. Always return valid JSON only — no preamble, no markdown."""

TEMPLATES = {
    "carrier_missed_pickup":       "carrier_missed_pickup",
    "carrier_eta_request":         "carrier_eta_request",
    "carrier_delivery_status":     "carrier_eta_request",
    "carrier_pod_request":         "carrier_pod_request",
    "carrier_urgent_contact":      "carrier_urgent_contact",
    "customer_delay_notification": "customer_delay_notification",
    "customer_delay_apology":      "customer_delay_apology",
    "customer_acknowledgement":    "customer_acknowledgement",
}


class ActionExecutor:
    def __init__(self):
        self.db = get_supabase()
        self.ai = anthropic.Anthropic(api_key=settings.ANTHROPIC_API_KEY)
        resend.api_key = settings.RESEND_API_KEY

    async def send_email(self, case_id, case, shipment, exceptions, template):
        is_customer = "customer" in template
        participant_type = "customer" if is_customer else "carrier"
        recipient_email = shipment.get("customer_email") if is_customer else shipment.get("carrier_email")
        recipient_name = shipment.get("customer_name") if is_customer else shipment.get("carrier_name")
        exception_type = exceptions[0]["exception_type"] if exceptions else "unknown"

        action_id = self._log_ai_action(case_id, "email_drafted", {"template": template, "recipient_type": participant_type})

        draft = await self._draft_email(template, shipment, exception_type, recipient_name)
        subject = draft.get("subject", f"Shipment {shipment.get('load_id')} — Update Required")
        body = draft.get("body", "")
        confidence = draft.get("confidence", 0.85)

        self._update_ai_action(action_id, "executed", {"subject": subject, "confidence": confidence}, confidence)

        sent = False
        if recipient_email and settings.RESEND_API_KEY and not settings.RESEND_API_KEY.startswith("re_..."):
            try:
                resend.Emails.send({"from": settings.EMAIL_FROM, "to": recipient_email, "subject": subject, "text": body})
                sent = True
            except Exception as e:
                logger.warning(f"Email send failed: {e}")

        self.db.table("communications").insert({
            "case_id": case_id, "direction": "outbound",
            "participant_type": participant_type, "channel": "email",
            "recipient_email": recipient_email, "recipient_name": recipient_name,
            "sender_email": settings.EMAIL_FROM, "subject": subject, "body": body,
            "sent_at": datetime.now(timezone.utc).isoformat() if sent else None,
            "status": "sent" if sent else "drafted",
        }).execute()

        action_label = self._template_to_label(template)
        self.db.table("events").insert({
            "case_id": case_id, "shipment_id": shipment["id"],
            "event_type": f"email.{participant_type}", "actor": "ai",
            "summary": f"{action_label} — {subject}",
            "payload": {"template": template, "sent": sent, "confidence": confidence},
        }).execute()

    async def _draft_email(self, template, shipment, exception_type, recipient_name):
        prompts = {
            "carrier_missed_pickup": f"""Draft a professional email to a carrier about a missed pickup.
Load ID: {shipment.get('load_id')} | Carrier: {shipment.get('carrier_name')}
Route: {shipment.get('origin')} to {shipment.get('destination')}
Request immediate status update and revised ETA.
Return JSON: {{"subject": "...", "body": "...", "confidence": 0.0}}""",

            "carrier_eta_request": f"""Draft a professional email to a carrier requesting an updated ETA.
Load ID: {shipment.get('load_id')} | Carrier: {shipment.get('carrier_name')}
Route: {shipment.get('origin')} to {shipment.get('destination')} | Issue: {exception_type.replace('_',' ')}
Return JSON: {{"subject": "...", "body": "...", "confidence": 0.0}}""",

            "carrier_pod_request": f"""Draft a professional email requesting proof of delivery.
Load ID: {shipment.get('load_id')} | Carrier: {shipment.get('carrier_name')}
Destination: {shipment.get('destination')}
Return JSON: {{"subject": "...", "body": "...", "confidence": 0.0}}""",

            "carrier_urgent_contact": f"""Draft an urgent follow-up email to an unresponsive carrier.
Load ID: {shipment.get('load_id')} | Carrier: {shipment.get('carrier_name')}
Route: {shipment.get('origin')} to {shipment.get('destination')}
Return JSON: {{"subject": "...", "body": "...", "confidence": 0.0}}""",

            "customer_delay_notification": f"""Draft a professional customer notification about a shipment delay.
Load ID: {shipment.get('load_id')} | Customer: {shipment.get('customer_name')}
Route: {shipment.get('origin')} to {shipment.get('destination')} | Issue: {exception_type.replace('_',' ')}
Be empathetic and set clear expectations.
Return JSON: {{"subject": "...", "body": "...", "confidence": 0.0}}""",

            "customer_delay_apology": f"""Draft an apology email for a missed delivery window.
Load ID: {shipment.get('load_id')} | Customer: {shipment.get('customer_name')}
Route: {shipment.get('origin')} to {shipment.get('destination')}
Return JSON: {{"subject": "...", "body": "...", "confidence": 0.0}}""",

            "customer_acknowledgement": f"""Draft a complaint acknowledgement email.
Load ID: {shipment.get('load_id')} | Customer: {shipment.get('customer_name')}
Acknowledge receipt, express empathy, confirm follow-up.
Return JSON: {{"subject": "...", "body": "...", "confidence": 0.0}}""",
        }

        prompt_key = TEMPLATES.get(template, "carrier_eta_request")
        prompt = prompts.get(prompt_key, prompts["carrier_eta_request"])

        try:
            response = self.ai.messages.create(
                model="claude-opus-4-5", max_tokens=600,
                system=SYSTEM_PROMPT,
                messages=[{"role": "user", "content": prompt}]
            )
            text = response.content[0].text.strip()
            if text.startswith("```"):
                text = text.split("```")[1]
                if text.startswith("json"):
                    text = text[4:]
            return json.loads(text)
        except Exception as e:
            logger.error(f"AI draft failed: {e}")
            return {
                "subject": f"Shipment {shipment.get('load_id')} — Action Required",
                "body": f"Automated notification for shipment {shipment.get('load_id')} ({shipment.get('origin')} to {shipment.get('destination')}). Please respond with an update.",
                "confidence": 0.5,
            }

    def _log_ai_action(self, case_id, action_type, input_data):
        r = self.db.table("ai_actions").insert({
            "case_id": case_id, "action_type": action_type,
            "status": "pending", "input_data": input_data,
        }).execute()
        return r.data[0]["id"]

    def _update_ai_action(self, action_id, status, output_data, confidence):
        self.db.table("ai_actions").update({
            "status": status,
            "executed_at": datetime.now(timezone.utc).isoformat(),
            "output_data": output_data, "confidence_score": confidence,
            "model_used": "claude-opus-4-5",
        }).eq("id", action_id).execute()

    def _template_to_label(self, template):
        labels = {
            "carrier_missed_pickup":       "Carrier contacted — missed pickup",
            "carrier_eta_request":         "ETA requested from carrier",
            "carrier_delivery_status":     "Delivery status requested from carrier",
            "carrier_pod_request":         "POD requested from carrier",
            "carrier_urgent_contact":      "Urgent follow-up sent to carrier",
            "customer_delay_notification": "Customer notified of delay",
            "customer_delay_apology":      "Customer apology sent",
            "customer_acknowledgement":    "Customer complaint acknowledged",
        }
        return labels.get(template, f"Email sent ({template})")
