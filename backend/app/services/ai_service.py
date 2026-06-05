import json
import anthropic
from app.core.config import settings

client = anthropic.Anthropic(api_key=settings.ANTHROPIC_API_KEY)

SYSTEM = """You are an AI operations coordinator for a freight logistics company.
Be concise, factual, and action-oriented. Always return valid JSON."""

async def draft_carrier_email(shipment: dict, exception_type: str) -> dict:
    prompt = f"""Draft a professional email to a carrier about a shipment exception.
Load ID: {shipment.get('load_id')} | Carrier: {shipment.get('carrier_name')}
Route: {shipment.get('origin')} → {shipment.get('destination')}
Exception: {exception_type.replace('_', ' ')}
Return JSON with keys: subject, body"""

    r = client.messages.create(model="claude-opus-4-5", max_tokens=500,
        system=SYSTEM, messages=[{"role": "user", "content": prompt}])
    try:
        return json.loads(r.content[0].text)
    except Exception:
        return {"subject": f"Load {shipment.get('load_id')} — Status Update Required", "body": r.content[0].text}

async def draft_customer_notification(shipment: dict, exception_type: str) -> dict:
    prompt = f"""Draft a customer notification email about a shipment issue.
Load ID: {shipment.get('load_id')} | Customer: {shipment.get('customer_name')}
Route: {shipment.get('origin')} → {shipment.get('destination')}
Issue: {exception_type.replace('_', ' ')}
Return JSON with keys: subject, body"""

    r = client.messages.create(model="claude-opus-4-5", max_tokens=500,
        system=SYSTEM, messages=[{"role": "user", "content": prompt}])
    try:
        return json.loads(r.content[0].text)
    except Exception:
        return {"subject": f"Update on Shipment {shipment.get('load_id')}", "body": r.content[0].text}

async def classify_exception(description: str) -> dict:
    prompt = f"""Classify this logistics exception:
"{description}"
Types: missed_pickup, delayed_transit, late_delivery, missing_pod, carrier_unresponsive, customer_complaint
Return JSON: exception_type, severity (low/medium/high/critical), confidence (0.0-1.0), reasoning"""

    r = client.messages.create(model="claude-opus-4-5", max_tokens=200,
        system=SYSTEM, messages=[{"role": "user", "content": prompt}])
    try:
        return json.loads(r.content[0].text)
    except Exception:
        return {"exception_type": "delayed_transit", "severity": "medium", "confidence": 0.5}
