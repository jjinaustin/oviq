from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional
import resend
from app.core.config import settings

router = APIRouter()

class ContactRequest(BaseModel):
    first_name: str
    last_name: str
    email: str
    company: str
    load_volume: Optional[str] = ""
    tms: Optional[str] = ""
    notes: Optional[str] = ""

@router.post("/contact")
async def submit_contact(req: ContactRequest):
    resend.api_key = settings.RESEND_API_KEY
    body = f"""New demo request from oviq.io

Name: {req.first_name} {req.last_name}
Email: {req.email}
Company: {req.company}
Monthly load volume: {req.load_volume or 'Not specified'}
TMS: {req.tms or 'Not specified'}

Notes:
{req.notes or 'None'}

---
Reply directly to this email to respond to {req.first_name}.
"""
    try:
        resend.Emails.send({
            "from": "Oviq <ops@notify.oviq.io>",
            "to": "hello@oviq.io",
            "reply_to": req.email,
            "subject": f"Demo request — {req.company} ({req.first_name} {req.last_name})",
            "text": body,
        })
    except Exception as e:
        print(f"Contact email failed: {e}")
    return {"status": "ok"}
