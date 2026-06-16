"""
IngestService — core data ingestion pipeline for Oviq.

Handles two input paths:
  1. process_csv(content, org_id)        — scheduled TMS report (email or direct upload)
  2. process_inbound_email(payload, org_id) — forwarded ops inbox message

Mapping profiles are stored in Supabase so they persist across deploys.
First file from a new org goes through LLM-assisted column mapping;
every subsequent file parses deterministically against the saved profile.
"""

import io
import json
import logging
import re
from datetime import datetime, timezone
from typing import Optional

import anthropic
import pandas as pd

from app.core.config import settings
from app.db.client import get_supabase
from app.services.exception_detector import ExceptionDetector

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Canonical field list — what we want every shipment row to contain
# ---------------------------------------------------------------------------

CANONICAL_FIELDS = [
    "load_id",
    "customer_name",
    "customer_email",
    "carrier_name",
    "carrier_email",
    "carrier_phone",
    "origin",
    "destination",
    "pickup_scheduled",
    "delivery_scheduled",
    "pickup_actual",
    "delivery_actual",
    "status",
    "pod_received",
]

# Statuses we recognise as "delivered" for POD / late-delivery logic
DELIVERED_STATUSES = {"delivered", "del", "dlv", "complete", "completed"}

# ---------------------------------------------------------------------------
# Status normalisation — raw TMS value → canonical
# ---------------------------------------------------------------------------

STATUS_NORMALISATION: dict[str, str] = {
    # pending / booked
    "pending": "pending", "new": "pending", "booked": "pending",
    "scheduled": "pending", "confirmed": "pending",
    # dispatched
    "dispatched": "dispatched", "disp": "dispatched", "assigned": "dispatched",
    "tendered": "dispatched",
    # at pickup
    "at pickup": "at_pickup", "at_pu": "at_pickup", "arrived pickup": "at_pickup",
    # in transit
    "in transit": "in_transit", "intransit": "in_transit", "picked up": "in_transit",
    "pu": "in_transit", "loaded": "in_transit", "en route": "in_transit",
    # delayed
    "delayed": "delayed", "late": "delayed", "delay": "delayed",
    # at delivery
    "at delivery": "at_delivery", "at del": "at_delivery", "arrived delivery": "at_delivery",
    # delivered
    "delivered": "delivered", "del": "delivered", "dlv": "delivered",
    "complete": "delivered", "completed": "delivered", "pod": "delivered",
    # cancelled
    "cancelled": "cancelled", "canceled": "cancelled", "void": "cancelled",
    "voided": "cancelled",
}


def normalise_status(raw: Optional[str]) -> str:
    if not raw:
        return "pending"
    return STATUS_NORMALISATION.get(raw.strip().lower(), "unknown")


# ---------------------------------------------------------------------------
# IngestService
# ---------------------------------------------------------------------------


class IngestService:
    def __init__(self):
        self.db = get_supabase()
        self.detector = ExceptionDetector()
        self.ai = anthropic.Anthropic(api_key=settings.ANTHROPIC_API_KEY)

    # -----------------------------------------------------------------------
    # Path 1 — CSV / XLSX report
    # -----------------------------------------------------------------------

    async def process_csv(
        self,
        content: bytes,
        org_id: str,
        filename: str = "report.csv",
        source_file_id: Optional[str] = None,
    ) -> dict:
        """
        Parse a TMS report and upsert shipments for the given org.
        Returns a summary dict suitable for returning from the API or logging.
        """
        # --- Parse raw file -------------------------------------------------
        try:
            df = self._read_file(content, filename)
        except Exception as e:
            logger.error(f"[ingest] Failed to parse file for org {org_id}: {e}")
            return {"error": f"Could not parse file: {e}", "shipments_created": 0,
                    "shipments_updated": 0, "shipments_skipped": 0, "cases_opened": 0}

        if df.empty:
            return {"error": "File contained no rows", "shipments_created": 0,
                    "shipments_updated": 0, "shipments_skipped": 0, "cases_opened": 0}

        # --- Resolve or create mapping profile ------------------------------
        profile = self._get_mapping_profile(org_id)

        if profile is None:
            # First file — ask Claude to propose a mapping
            profile = await self._propose_mapping(df, org_id)
            if profile is None:
                return {"error": "Could not generate column mapping — check file format",
                        "shipments_created": 0, "shipments_updated": 0,
                        "shipments_skipped": 0, "cases_opened": 0,
                        "needs_mapping_review": True}

        # --- Drift detection ------------------------------------------------
        current_headers = list(df.columns)
        saved_headers = profile.get("file_signature", [])
        if saved_headers and set(current_headers) != set(saved_headers):
            logger.warning(f"[ingest] Column drift detected for org {org_id}")
            self._quarantine_file(org_id, content, filename, "column_drift")
            return {"error": "Report columns have changed since last mapping. "
                             "Quarantined for review.", "needs_mapping_review": True,
                    "shipments_created": 0, "shipments_updated": 0,
                    "shipments_skipped": 0, "cases_opened": 0}

        # --- Map columns to canonical names ---------------------------------
        column_map: dict = profile.get("column_map", {})
        df = df.rename(columns={k: v for k, v in column_map.items() if k in df.columns})

        # --- Process rows ---------------------------------------------------
        created = updated = skipped = cases_opened = errors = 0

        for _, row in df.iterrows():
            try:
                data = self._row_to_shipment(row, org_id, source_file_id, profile)
                if not data.get("load_id"):
                    skipped += 1
                    continue

                result, action = self._upsert_shipment(data)
                if action == "created":
                    created += 1
                elif action == "updated":
                    updated += 1
                else:
                    skipped += 1
                    continue

               new_cases = await self.detector.evaluate(result)
                cases_opened += len(new_cases)
                for case_id in new_cases:
                    from app.services.playbook_runner import PlaybookRunner
                    await PlaybookRunner().run_for_case(case_id)

            except Exception as e:
                logger.error(f"[ingest] Row error for org {org_id}: {e}")
                errors += 1

        return {
            "shipments_created": created,
            "shipments_updated": updated,
            "shipments_skipped": skipped,
            "cases_opened": cases_opened,
            "row_errors": errors,
        }

    # -----------------------------------------------------------------------
    # Path 2 — Inbound email (forwarded ops inbox or carrier reply)
    # -----------------------------------------------------------------------

    async def process_inbound_email(self, payload: dict, org_id: str) -> dict:
        """
        Process an email received at the org's ingest address.
        Classifies, extracts entities, links to shipment, and triggers detection.
        """
        subject = payload.get("Subject", "") or ""
        body = payload.get("TextBody", "") or payload.get("HtmlBody", "") or ""
        from_email = payload.get("From", "") or ""
        attachments = payload.get("Attachments", []) or []

        # --- Classify -------------------------------------------------------
        classification = await self._classify_message(subject, body)

        if not classification.get("relevant", False):
            # Discard irrelevant content — log metadata only
            self.db.table("ingest_message_log").insert({
                "organization_id": org_id,
                "from_email": from_email,
                "subject": subject[:200],
                "category": classification.get("category", "irrelevant"),
                "relevant": False,
                "discarded_at": datetime.now(timezone.utc).isoformat(),
            }).execute()
            return {"relevant": False, "category": classification.get("category")}

        # --- Extract entities -----------------------------------------------
        extraction = await self._extract_entities(subject, body)
        load_ids: list = extraction.get("load_ids", [])
        event_type: str = extraction.get("event_type", "unknown")
        summary: str = extraction.get("summary", subject[:200])

        # --- Link to shipment -----------------------------------------------
        shipment = None
        for load_id in load_ids:
            shipment = self._find_shipment(org_id, load_id)
            if shipment:
                break

        # --- Handle POD attachments -----------------------------------------
        pod_received = False
        for attachment in attachments:
            name = (attachment.get("Name") or "").lower()
            if any(kw in name for kw in ("pod", "proof", "delivery", "bol", "bill")):
                pod_received = True
                if shipment:
                    self.db.table("shipments").update({
                        "pod_received": True,
                        "updated_at": datetime.now(timezone.utc).isoformat(),
                    }).eq("id", shipment["id"]).execute()
                break

        # --- Store communication --------------------------------------------
        case_id = self._find_open_case(shipment["id"]) if shipment else None

        comm_data = {
            "direction": "inbound",
            "participant_type": self._classify_sender(from_email, shipment),
            "channel": "email",
            "subject": subject[:500],
            "body": body[:10000],
            "sender_email": from_email[:200],
            "status": "received",
        }
        if case_id:
            comm_data["case_id"] = case_id

        if case_id:
            # communications has no shipment_id column — only insert if linked to a case
            self.db.table("communications").insert(comm_data).execute()

        # --- Re-run detection -----------------------------------------------
        cases_opened = 0
        if shipment:
            refreshed = self.db.table("shipments").select("*") \
                .eq("id", shipment["id"]).single().execute()
            if refreshed.data:
                new_cases = await self.detector.evaluate(refreshed.data)
                cases_opened = len(new_cases)
                for case_id in new_cases:
                    from app.services.playbook_runner import PlaybookRunner
                    await PlaybookRunner().run_for_case(case_id)

        return {
            "relevant": True,
            "category": classification.get("category"),
            "load_ids": load_ids,
            "event_type": event_type,
            "shipment_linked": shipment is not None,
            "pod_received": pod_received,
            "cases_opened": cases_opened,
        }

    # -----------------------------------------------------------------------
    # Mapping profile management
    # -----------------------------------------------------------------------

    def _get_mapping_profile(self, org_id: str) -> Optional[dict]:
        result = self.db.table("mapping_profiles") \
            .select("*") \
            .eq("organization_id", org_id) \
            .eq("active", True) \
            .limit(1) \
            .execute()
        return result.data[0] if result.data else None

    async def _propose_mapping(self, df: pd.DataFrame, org_id: str) -> Optional[dict]:
        """
        Ask Claude to map the file's columns to canonical fields.
        Saves the profile as active=False (pending human review).
        For pilot onboarding we auto-confirm it; later we'll add a review UI.
        """
        headers = list(df.columns)
        sample = df.head(3).to_dict(orient="records")

        prompt = f"""You are helping configure a freight logistics system.

Map these CSV column headers to canonical field names.

CSV headers: {json.dumps(headers)}

Sample rows (first 3):
{json.dumps(sample, default=str, indent=2)}

Canonical fields to map TO (only map what you're confident about):
{json.dumps(CANONICAL_FIELDS, indent=2)}

Also identify:
- datetime_format: the format string for date/time columns (e.g. "%m/%d/%Y" or "%Y-%m-%d %H:%M:%S")
- timezone: the timezone of datetime values (e.g. "America/Chicago") — default "UTC" if unknown

Return ONLY valid JSON, no preamble:
{{
  "column_map": {{"CSV Header": "canonical_field", ...}},
  "datetime_format": "...",
  "timezone": "..."
}}"""

        try:
            response = self.ai.messages.create(
                model="claude-haiku-4-5-20251001",
                max_tokens=800,
                messages=[{"role": "user", "content": prompt}],
            )
            text = response.content[0].text.strip()
            # Strip markdown fences if present
            if text.startswith("```"):
                text = re.sub(r"^```[a-z]*\n?", "", text)
                text = re.sub(r"\n?```$", "", text)
            mapping = json.loads(text)
        except Exception as e:
            logger.error(f"[ingest] Claude mapping failed for org {org_id}: {e}")
            return None

        profile = {
            "organization_id": org_id,
            "file_signature": headers,
            "column_map": mapping.get("column_map", {}),
            "datetime_format": mapping.get("datetime_format", "%Y-%m-%d"),
            "timezone": mapping.get("timezone", "UTC"),
            "active": True,  # auto-confirm for now; add review UI in Phase B
            "created_at": datetime.now(timezone.utc).isoformat(),
        }

        result = self.db.table("mapping_profiles").insert(profile).execute()
        if result.data:
            profile["id"] = result.data[0]["id"]
            logger.info(f"[ingest] Mapping profile created for org {org_id}")
        return profile

    # -----------------------------------------------------------------------
    # Row processing
    # -----------------------------------------------------------------------

    def _row_to_shipment(
        self,
        row: pd.Series,
        org_id: str,
        source_file_id: Optional[str],
        profile: dict,
    ) -> dict:
        def safe(key) -> Optional[str]:
            val = row.get(key)
            if val is None or (isinstance(val, float) and pd.isna(val)):
                return None
            return str(val).strip() or None

        def safe_dt(key) -> Optional[str]:
            val = safe(key)
            if not val:
                return None
            try:
                fmt = profile.get("datetime_format", "%Y-%m-%d")
                dt = datetime.strptime(val, fmt)
                tz_name = profile.get("timezone", "UTC")
                # Simple UTC offset — for full tz support add pytz/zoneinfo later
                if tz_name == "UTC" or not tz_name:
                    dt = dt.replace(tzinfo=timezone.utc)
                return dt.isoformat()
            except Exception:
                # Fall back to ISO parse
                try:
                    dt = datetime.fromisoformat(val)
                    if dt.tzinfo is None:
                        dt = dt.replace(tzinfo=timezone.utc)
                    return dt.isoformat()
                except Exception:
                    return None

        raw_status = safe("status")
        pod_val = safe("pod_received")
        pod_received = False
        if pod_val:
            pod_received = pod_val.lower() in ("true", "yes", "1", "y", "x")

        return {
            "organization_id": org_id,
            "load_id": safe("load_id"),
            "customer_name": safe("customer_name") or "Unknown",
            "customer_email": safe("customer_email"),
            "carrier_name": safe("carrier_name") or "Unknown",
            "carrier_email": safe("carrier_email"),
            "carrier_phone": safe("carrier_phone"),
            "origin": safe("origin") or "",
            "destination": safe("destination") or "",
            "pickup_scheduled": safe_dt("pickup_scheduled"),
            "delivery_scheduled": safe_dt("delivery_scheduled"),
            "pickup_actual": safe_dt("pickup_actual"),
            "delivery_actual": safe_dt("delivery_actual"),
            "status": normalise_status(raw_status),
            "pod_received": pod_received,
            "source_file_id": source_file_id,
            "raw_data": row.to_dict(),
            "updated_at": datetime.now(timezone.utc).isoformat(),
        }

    def _upsert_shipment(self, data: dict) -> tuple[dict, str]:
        """
        Upsert on (organization_id, load_id).
        Returns (shipment_row, action) where action is 'created'|'updated'|'skipped'.
        """
        org_id = data["organization_id"]
        load_id = data["load_id"]

        existing = self.db.table("shipments") \
            .select("*") \
            .eq("organization_id", org_id) \
            .eq("load_id", load_id) \
            .execute()

        if existing.data:
            shipment_id = existing.data[0]["id"]
            result = self.db.table("shipments") \
                .update(data) \
                .eq("id", shipment_id) \
                .execute()
            return result.data[0], "updated"
        else:
            result = self.db.table("shipments").insert(data).execute()
            return result.data[0], "created"

    # -----------------------------------------------------------------------
    # Email classification and extraction (message pipeline)
    # -----------------------------------------------------------------------

    async def _classify_message(self, subject: str, body: str) -> dict:
        prompt = f"""Classify this email for a freight logistics operations team.

Subject: {subject[:300]}
Body (first 500 chars): {body[:500]}

Is this email relevant to shipment exception management?
Relevant categories: delay_notice, pod_received, pickup_issue, delivery_issue,
carrier_update, customer_inquiry, eta_update

Return ONLY valid JSON:
{{"relevant": true/false, "category": "...", "confidence": 0.0}}"""

        try:
            response = self.ai.messages.create(
                model="claude-haiku-4-5-20251001",
                max_tokens=150,
                messages=[{"role": "user", "content": prompt}],
            )
            text = response.content[0].text.strip()
            if text.startswith("```"):
                text = re.sub(r"^```[a-z]*\n?", "", text)
                text = re.sub(r"\n?```$", "", text)
            return json.loads(text)
        except Exception as e:
            logger.error(f"[ingest] Classification failed: {e}")
            return {"relevant": True, "category": "unknown", "confidence": 0.5}

    async def _extract_entities(self, subject: str, body: str) -> dict:
        prompt = f"""Extract logistics entities from this email.

Subject: {subject[:300]}
Body: {body[:1000]}

Return ONLY valid JSON:
{{
  "load_ids": ["list of load/order/shipment numbers found"],
  "carrier_name": "carrier name if mentioned",
  "event_type": "one of: eta_update|delay_notice|pickup_confirmed|delivery_confirmed|pod_attached|carrier_update|customer_inquiry|unknown",
  "eta": "ISO datetime string if a new ETA is mentioned, else null",
  "summary": "one sentence summary of what this email says"
}}"""

        try:
            response = self.ai.messages.create(
                model="claude-haiku-4-5-20251001",
                max_tokens=300,
                messages=[{"role": "user", "content": prompt}],
            )
            text = response.content[0].text.strip()
            if text.startswith("```"):
                text = re.sub(r"^```[a-z]*\n?", "", text)
                text = re.sub(r"\n?```$", "", text)
            return json.loads(text)
        except Exception as e:
            logger.error(f"[ingest] Extraction failed: {e}")
            return {"load_ids": [], "event_type": "unknown", "summary": subject[:200]}

    # -----------------------------------------------------------------------
    # Helpers
    # -----------------------------------------------------------------------

    def _read_file(self, content: bytes, filename: str) -> pd.DataFrame:
        if filename.lower().endswith((".xlsx", ".xls")):
            df = pd.read_excel(io.BytesIO(content))
        else:
            # Try common delimiters
            for sep in (",", "\t", "|"):
                try:
                    df = pd.read_csv(io.BytesIO(content), sep=sep)
                    if len(df.columns) > 1:
                        break
                except Exception:
                    continue
        # Normalise column names: strip whitespace
        df.columns = [str(c).strip() for c in df.columns]
        return df

    def _find_shipment(self, org_id: str, load_id: str) -> Optional[dict]:
        result = self.db.table("shipments") \
            .select("*") \
            .eq("organization_id", org_id) \
            .eq("load_id", load_id) \
            .limit(1) \
            .execute()
        return result.data[0] if result.data else None

    def _find_open_case(self, shipment_id: str) -> Optional[str]:
        result = self.db.table("cases") \
            .select("id") \
            .eq("shipment_id", shipment_id) \
            .in_("status", ["open", "ai_resolving", "pending_human"]) \
            .limit(1) \
            .execute()
        return result.data[0]["id"] if result.data else None

    def _classify_sender(self, from_email: str, shipment: Optional[dict]) -> str:
        if not shipment:
            return "unknown"
        carrier_email = (shipment.get("carrier_email") or "").lower()
        customer_email = (shipment.get("customer_email") or "").lower()
        from_lower = from_email.lower()
        if carrier_email and carrier_email in from_lower:
            return "carrier"
        if customer_email and customer_email in from_lower:
            return "customer"
        return "carrier"  # most inbound ops email is carrier comms

    def _apply_event_to_shipment(self, shipment: dict, extraction: dict):
        updates: dict = {"updated_at": datetime.now(timezone.utc).isoformat()}
        event_type = extraction.get("event_type")
        if event_type == "pickup_confirmed":
            updates["pickup_actual"] = datetime.now(timezone.utc).isoformat()
            updates["status"] = "in_transit"
        elif event_type == "delivery_confirmed":
            updates["delivery_actual"] = datetime.now(timezone.utc).isoformat()
            updates["status"] = "delivered"
        elif event_type == "delay_notice":
            updates["status"] = "delayed"
        if updates:
            self.db.table("shipments").update(updates).eq("id", shipment["id"]).execute()

    def _quarantine_file(self, org_id: str, content: bytes, filename: str, reason: str):
        try:
            self.db.table("ingest_quarantine").insert({
                "organization_id": org_id,
                "filename": filename,
                "reason": reason,
                "created_at": datetime.now(timezone.utc).isoformat(),
            }).execute()
        except Exception as e:
            logger.error(f"[ingest] Quarantine log failed: {e}")
