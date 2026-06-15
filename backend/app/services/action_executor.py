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

# Carrier comms are routine and high-volume — Haiku is plenty.
# Customer-facing apology/complaint emails carry more relationship risk —
# use Sonnet for those so tone stays sharp.
DRAFT_MODEL = {
    "carrier_missed_pickup":       "claude-haiku-4-5-20251001",
    "carrier_eta_request":         "claude-haiku-4-5-20251001",
    "carrier_pod_request":         "claude-haiku-4-5-20251001",
    "carrier_urgent_contact":      "claude-haiku-4-5-20251001",
    "customer_delay_notification": "claude-sonnet-4-6",
    "customer_delay_apology":      "claude-sonnet-4-6",
    "customer_acknowledgement":    "claude-sonnet-4-6",
}
DEFAULT_DRAFT_MODEL = "claude-haiku-4-5-20251001"

FALLBACK_EMAIL_FROM = "ops@oviq.io"
SENDING_DOMAIN = "notify.oviq.io"


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

        org_id = shipment.get("organization_id") or case.get("organization_id")
        from_address, from_display = self._resolve_sender(org_id)

        action_id = self._log_ai_action(case_id, "email_drafted", {"template": template, "recipient_type": participant_type})

        model = self._resolve_model(template)
        draft = await self._draft_email(template, shipment, exception_type, recipient_name, model)
        subject = draft.get("subject", f"Shipment {shipment.get('load_id')} — Update Required")
        body = draft.get("body", "")
        confidence = draft.get("confidence", 0.85)

        self._update_ai_action(action_id, "executed", {"subject": subject, "confidence": confidence}, confidence, model)

        sent = False
        if recipient_email and settings.RESEND_API_KEY and not settings.RESEND_API_KEY.startswith("re_..."):
            try:
                resend.Emails.send({
                    "from": f"{from_display} <{from_address}>",
                    "to": recipient_email,
                    "reply_to": from_address,
                    "subject": subject,
                    "text": body,
                })
                sent = True
            except Exception as e:
                logger.warning(f"Email send failed: {e}")

        self.db.table("communications").insert({
            "case_id": case_id, "direction": "outbound",
            "participant_type": participant_type, "channel": "email",
            "recipient_email": recipient_email, "recipient_name": recipient_name,
            "sender_email": from_address, "subject": subject, "body": body,
            "sent_at": datetime.now(timezone.utc).isoformat() if sent else None,
            "status": "sent" if sent else "drafted",
        }).execute()

        action_label = self._template_to_label(template)
        self.db.table("events").insert({
            "case_id": case_id, "shipment_id": shipment["id"],
            "event_type": f"email.{participant_type}", "actor": "ai",
            "summary": f"{action_label} — {subject}",
            "payload": {"template": template, "sent": sent, "confidence": confidence, "model": model},
        }).execute()

    # ------------------------------------------------------------------
    # Sender resolution
    # ------------------------------------------------------------------

    def _resolve_sender(self, org_id: Optional[str]) -> tuple[str, str]:
        """
        Resolve the From address and display name for a given org.

        Returns (from_address, display_name).
        Falls back to FALLBACK_EMAIL_FROM if no org_id or no slug configured —
        e.g. mail.oviq.com isn't verified yet, or org has no email_slug set.
        """
        if not org_id:
            return FALLBACK_EMAIL_FROM, "Oviq Operations"

        try:
            result = self.db.table("organizations") \
                .select("name, email_slug") \
                .eq("id", org_id) \
                .single() \
                .execute()
        except Exception as e:
            logger.warning(f"Could not resolve org for sender address: {e}")
            return FALLBACK_EMAIL_FROM, "Oviq Operations"

        org = result.data or {}
        slug = org.get("email_slug")
        name = org.get("name", "Operations")

        if not slug:
            return FALLBACK_EMAIL_FROM, "Oviq Operations"

        from_address = f"{slug}@{SENDING_DOMAIN}"
        display_name = f"{name} Operations via Oviq"
        return from_address, display_name

    def _resolve_model(self, template: str) -> str:
        return DRAFT_MODEL.get(template, DEFAULT_DRAFT_MODEL)

    # ------------------------------------------------------------------
    # Drafting
    # ------------------------------------------------------------------

    async def _draft_email(self, template, shipment, exception_type, recipient_name, model):
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
                model=model, max_tokens=600,
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

    # ------------------------------------------------------------------
    # Logging helpers
    # ------------------------------------------------------------------

    def _log_ai_action(self, case_id, action_type, input_data):
        r = self.db.table("ai_actions").insert({
            "case_id": case_id, "action_type": action_type,
            "status": "pending", "input_data": input_data,
        }).execute()
        return r.data[0]["id"]

    def _update_ai_action(self, action_id, status, output_data, confidence, model):
        self.db.table("ai_actions").update({
            "status": status,
            "executed_at": datetime.now(timezone.utc).isoformat(),
            "output_data": output_data, "confidence_score": confidence,
            "model_used": model,
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
