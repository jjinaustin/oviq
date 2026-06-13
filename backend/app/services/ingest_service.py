"""
Ingest routes — two endpoints:

  POST /api/v1/ingest/csv      — manual or scheduled TMS report upload
  POST /api/v1/ingest/email    — Postmark inbound webhook (forwarded ops inbox)

Both resolve the org from the request and delegate to IngestService.
"""

import hashlib
import hmac
import logging
from typing import Optional

from fastapi import APIRouter, File, Header, HTTPException, Request, UploadFile
from fastapi.responses import JSONResponse

from app.core.config import settings
from app.db.client import get_supabase
from app.services.ingest_service import IngestService

router = APIRouter()
logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _resolve_org_from_token(token: Optional[str]) -> Optional[str]:
    """
    Resolve an org_id from a bearer token or ingest token.
    For now uses the ingest_tokens table; later can use JWT.
    Returns org_id string or None.
    """
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


# ---------------------------------------------------------------------------
# CSV / XLSX upload
# ---------------------------------------------------------------------------


ALLOWED_EXTENSIONS = (".csv", ".xlsx", ".xls")


@router.post("/csv")
async def ingest_csv(
    file: UploadFile = File(...),
    authorization: Optional[str] = Header(None),
    x_org_id: Optional[str] = Header(None),  # dev shortcut: pass org id directly
):
    """
    Accept a TMS report (CSV or XLSX) and process it.

    Auth options (checked in order):
      1. X-Org-Id header — development only (bypassed in production)
      2. Authorization: Bearer <ingest_token> — production
    """
    # --- Resolve org --------------------------------------------------------
    org_id = None

    if settings.ENVIRONMENT == "development" and x_org_id:
        org_id = x_org_id
    else:
        org_id = _resolve_org_from_token(authorization)

    if not org_id:
        raise HTTPException(401, "Could not resolve organization. Provide a valid ingest token.")

    # --- Validate file ------------------------------------------------------
    filename = file.filename or "report.csv"
    if not any(filename.lower().endswith(ext) for ext in ALLOWED_EXTENSIONS):
        raise HTTPException(400, f"Unsupported file type. Accepted: {', '.join(ALLOWED_EXTENSIONS)}")

    content = await file.read()
    if len(content) == 0:
        raise HTTPException(400, "File is empty.")

    if len(content) > 20 * 1024 * 1024:  # 20MB hard limit
        raise HTTPException(400, "File exceeds 20MB limit.")

    # --- Log ingest file ----------------------------------------------------
    db = get_supabase()
    file_log = db.table("ingest_files").insert({
        "organization_id": org_id,
        "filename": filename,
        "file_size": len(content),
        "status": "processing",
    }).execute()
    source_file_id = file_log.data[0]["id"] if file_log.data else None

    # --- Process ------------------------------------------------------------
    service = IngestService()
    result = await service.process_csv(
        content=content,
        org_id=org_id,
        filename=filename,
        source_file_id=source_file_id,
    )

    # --- Update file log status ---------------------------------------------
    if source_file_id:
        status = "error" if result.get("error") else "complete"
        db.table("ingest_files").update({
            "status": status,
            "result": result,
        }).eq("id", source_file_id).execute()

    if result.get("error"):
        return JSONResponse(status_code=422, content=result)

    return result


# ---------------------------------------------------------------------------
# Email webhook (Postmark inbound)
# ---------------------------------------------------------------------------


@router.post("/email")
async def ingest_email(request: Request):
    """
    Postmark inbound email webhook.

    Each org gets a unique ingest address: {slug}-{token}@ingest.oviq.com
    Postmark POSTs the parsed email JSON here.
    We resolve the org from the To address token.
    """
    # --- Parse body ---------------------------------------------------------
    try:
        payload = await request.json()
    except Exception:
        raise HTTPException(400, "Invalid JSON payload.")

    # --- Resolve org from To address ----------------------------------------
    # Postmark puts the recipient in "To" or "ToFull"
    to_address = ""
    to_full = payload.get("ToFull", [])
    if to_full and isinstance(to_full, list):
        to_address = to_full[0].get("Email", "")
    if not to_address:
        to_address = payload.get("To", "")

    org_id = _resolve_org_from_email_address(to_address)

    if not org_id:
        # Unknown recipient — log and return 200 so Postmark doesn't retry
        logger.warning(f"[ingest/email] Unknown recipient: {to_address}")
        return {"status": "ignored", "reason": "unknown recipient"}

    # --- Sender verification ------------------------------------------------
    from_email = payload.get("From", "")
    if not _verify_sender(org_id, from_email):
        logger.warning(f"[ingest/email] Unverified sender {from_email} for org {org_id}")
        return {"status": "ignored", "reason": "unverified sender"}

    # --- Process ------------------------------------------------------------
    service = IngestService()
    result = await service.process_inbound_email(payload, org_id)

    return result


# ---------------------------------------------------------------------------
# Email routing helpers
# ---------------------------------------------------------------------------


def _resolve_org_from_email_address(to_address: str) -> Optional[str]:
    """
    Extract the token from the ingest address and look up the org.
    Address format: {slug}-{token}@ingest.oviq.com
                or: {slug}-inbox-{token}@ingest.oviq.com
    """
    if not to_address or "@" not in to_address:
        return None

    local = to_address.split("@")[0].lower()

    db = get_supabase()
    result = db.table("ingest_tokens") \
        .select("organization_id") \
        .eq("email_local", local) \
        .eq("active", True) \
        .limit(1) \
        .execute()
    return result.data[0]["organization_id"] if result.data else None


def _verify_sender(org_id: str, from_email: str) -> bool:
    """
    Check that the sender is registered for this org.
    Returns True if no restrictions are configured (open during dev).
    """
    db = get_supabase()
    result = db.table("ingest_allowed_senders") \
        .select("id") \
        .eq("organization_id", org_id) \
        .execute()

    if not result.data:
        # No restrictions configured — allow during onboarding / dev
        return True

    allowed = [r.get("email", "").lower() for r in result.data]
    from_lower = from_email.lower()
    return any(a in from_lower or from_lower.endswith(a) for a in allowed)