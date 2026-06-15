"""
Ingest routes — two endpoints:

  POST /api/v1/ingest/csv      — manual or scheduled TMS report upload
  POST /api/v1/ingest/email    — Postmark inbound webhook (forwarded ops inbox
                                  or scheduled TMS report with attachment)

Email routing:
  - Token type "report" (no "inbox" in email_local) + CSV/XLSX attachment
    → fetch attachment content from Postmark API → process_csv
  - Token type "inbox" ("inbox" in email_local) or no attachment
    → process_inbound_email (classification + extraction + case linking)
"""

import base64
import logging
from typing import Optional

import httpx
from fastapi import APIRouter, File, Header, HTTPException, Request, UploadFile
from fastapi.responses import JSONResponse

from app.core.config import settings
from app.db.client import get_supabase
from app.services.ingest_service import IngestService

router = APIRouter()
logger = logging.getLogger(__name__)

REPORT_EXTENSIONS = (".csv", ".xlsx", ".xls")
ALLOWED_EXTENSIONS = REPORT_EXTENSIONS


def _resolve_org_from_token(token: Optional[str]) -> Optional[str]:
    if not token:
        return None
    token = token.replace("Bearer ", "").strip()
    db = get_supabase()
    result = db.table("ingest_tokens") \
        .select("organization_id") \
        .eq("token", token) \
        .eq("active", True) \
        .limit(1) \
        .execute()
    return result.data[0]["organization_id"] if result.data else None


def _resolve_token_record(email_local: str) -> Optional[dict]:
    db = get_supabase()
    result = db.table("ingest_tokens") \
        .select("organization_id, label, email_local") \
        .eq("email_local", email_local) \
        .eq("active", True) \
        .limit(1) \
        .execute()
    return result.data[0] if result.data else None


def _verify_sender(org_id: str, from_email: str) -> bool:
    db = get_supabase()
    result = db.table("ingest_allowed_senders") \
        .select("id") \
        .eq("organization_id", org_id) \
        .execute()
    if not result.data:
        return True
    allowed = [r.get("email", "").lower() for r in result.data]
    from_lower = from_email.lower()
    return any(a in from_lower or from_lower.endswith(a) for a in allowed)


def _is_report_token(token_record: dict) -> bool:
    return "inbox" not in (token_record.get("email_local") or "").lower()


def _find_report_attachment(attachments: list) -> Optional[dict]:
    for att in attachments:
        name = (att.get("Name") or "").lower()
        if any(name.endswith(ext) for ext in REPORT_EXTENSIONS):
            return att
    return None


async def _fetch_attachment_content(message_id: str, attachment: dict) -> Optional[bytes]:
    if attachment.get("Content"):
        try:
            return base64.b64decode(attachment["Content"])
        except Exception:
            pass

    token = settings.POSTMARK_SERVER_TOKEN
    if not token:
        logger.error("[ingest] POSTMARK_SERVER_TOKEN not configured")
        return None

    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.get(
                f"https://api.postmarkapp.com/messages/inbound/{message_id}/details",
                headers={
                    "Accept": "application/json",
                    "X-Postmark-Server-Token": token,
                },
            )
            resp.raise_for_status()
            data = resp.json()
            for att in data.get("Attachments", []):
                if att.get("Name") == attachment.get("Name"):
                    content = att.get("Content")
                    if content:
                        return base64.b64decode(content)
            logger.warning(f"[ingest] Attachment not found in Postmark details for {message_id}")
            return None
    except Exception as e:
        logger.error(f"[ingest] Failed to fetch attachment from Postmark: {e}")
        return None


@router.post("/csv")
async def ingest_csv(
    file: UploadFile = File(...),
    authorization: Optional[str] = Header(None),
    x_org_id: Optional[str] = Header(None),
):
    org_id = None
    if settings.ENVIRONMENT == "development" and x_org_id:
        org_id = x_org_id
    else:
        org_id = _resolve_org_from_token(authorization)

    if not org_id:
        raise HTTPException(401, "Could not resolve organization.")

    filename = file.filename or "report.csv"
    if not any(filename.lower().endswith(ext) for ext in ALLOWED_EXTENSIONS):
        raise HTTPException(400, f"Unsupported file type.")

    content = await file.read()
    if not content:
        raise HTTPException(400, "File is empty.")
    if len(content) > 20 * 1024 * 1024:
        raise HTTPException(400, "File exceeds 20MB limit.")

    return await _run_csv_ingest(content, filename, org_id)


@router.post("/email")
async def ingest_email(request: Request):
    try:
        payload = await request.json()
    except Exception:
        raise HTTPException(400, "Invalid JSON payload.")

    to_address = ""
    to_full = payload.get("ToFull", [])
    if to_full and isinstance(to_full, list):
        to_address = to_full[0].get("Email", "")
    if not to_address:
        to_address = payload.get("To", "")

    if not to_address or "@" not in to_address:
        return {"status": "ignored", "reason": "no recipient"}

    local = to_address.split("@")[0].lower()
    token_record = _resolve_token_record(local)

    if not token_record:
        logger.warning(f"[ingest/email] Unknown recipient: {to_address}")
        return {"status": "ignored", "reason": "unknown recipient"}

    org_id = token_record["organization_id"]
    from_email = payload.get("From", "")

    if not _verify_sender(org_id, from_email):
        logger.warning(f"[ingest/email] Unverified sender {from_email} for org {org_id}")
        return {"status": "ignored", "reason": "unverified sender"}

    attachments = payload.get("Attachments", []) or []
    report_attachment = _find_report_attachment(attachments)
    is_report = _is_report_token(token_record) and report_attachment is not None

    service = IngestService()

    if is_report:
        logger.info(f"[ingest/email] Report email for org {org_id}, "
                    f"attachment: {report_attachment.get('Name')}")
        message_id = payload.get("MessageID", "")
        content = await _fetch_attachment_content(message_id, report_attachment)

        if not content:
            logger.error(f"[ingest/email] Could not fetch attachment for {message_id}")
            return {"status": "error", "reason": "could not fetch attachment content"}

        filename = report_attachment.get("Name", "report.csv")
        result = await _run_csv_ingest(content, filename, org_id)
        result["source"] = "email_attachment"
        return result
    else:
        logger.info(f"[ingest/email] Inbox email for org {org_id}")
        result = await service.process_inbound_email(payload, org_id)
        return result


async def _run_csv_ingest(content: bytes, filename: str, org_id: str) -> dict:
    db = get_supabase()
    file_log = db.table("ingest_files").insert({
        "organization_id": org_id,
        "filename": filename,
        "file_size": len(content),
        "status": "processing",
    }).execute()
    source_file_id = file_log.data[0]["id"] if file_log.data else None

    service = IngestService()
    result = await service.process_csv(
        content=content,
        org_id=org_id,
        filename=filename,
        source_file_id=source_file_id,
    )

    if source_file_id:
        db.table("ingest_files").update({
            "status": "error" if result.get("error") else "complete",
            "result": result,
        }).eq("id", source_file_id).execute()

    if result.get("error"):
        return JSONResponse(status_code=422, content=result)

    return result
