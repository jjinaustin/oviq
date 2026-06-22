"""
ReportMonitor — checks daily that expected TMS reports have arrived.

Runs every hour via APScheduler. For each active report_expectation:
- If today's report hasn't arrived by expected_by_hour + grace_period_hours
  AND we haven't already alerted today → send alert email to operator
  AND notify the customer contact if configured.

This is the safety net that prevents Oviq from going blind if a TMS
report stops arriving (TMS update, email bounced, forwarding rule broken).
"""

import logging
from datetime import datetime, timezone, timedelta

import resend

from app.core.config import settings
from app.db.client import get_supabase

logger = logging.getLogger(__name__)

# Operator alert email — where monitoring alerts go
OPERATOR_EMAIL = "johnston@oviq.io"
OPERATOR_NAME  = "Johnston"


class ReportMonitor:
    def __init__(self):
        self.db = get_supabase()
        resend.api_key = settings.RESEND_API_KEY

    def run(self):
        """Check all active report expectations. Called hourly by scheduler."""
        now_utc = datetime.now(timezone.utc)
        logger.info(f"[monitor] Running report check at {now_utc.strftime('%H:%M UTC')}")

        try:
            result = self.db.table("report_expectations") \
                .select("*, organizations(name)") \
                .eq("active", True) \
                .execute()
            expectations = result.data or []
        except Exception as e:
            logger.error(f"[monitor] Failed to fetch expectations: {e}")
            return

        alerted = 0
        for exp in expectations:
            try:
                if self._should_alert(exp, now_utc):
                    self._send_alert(exp, now_utc)
                    self._mark_alerted(exp["id"], now_utc)
                    alerted += 1
            except Exception as e:
                logger.error(f"[monitor] Error checking expectation {exp.get('id')}: {e}")

        logger.info(f"[monitor] Check complete — {len(expectations)} orgs checked, {alerted} alerts sent")

    def _should_alert(self, exp: dict, now_utc: datetime) -> bool:
        """
        Returns True if:
        1. We're past the expected_by_hour + grace_period_hours in the org's timezone
        2. No report has arrived today (in org timezone)
        3. We haven't already alerted today
        """
        # Convert now to org's timezone (simplified — use UTC offset approximation)
        # For full tz support this should use pytz/zoneinfo
        tz_offset = self._tz_offset_hours(exp.get("expected_timezone", "America/Chicago"))
        now_local = now_utc + timedelta(hours=tz_offset)

        expected_by = exp.get("expected_by_hour", 10)
        grace = exp.get("grace_period_hours", 2)
        cutoff_hour = expected_by + grace

        # Not past cutoff yet — too early to alert
        if now_local.hour < cutoff_hour:
            return False

        # Check if report arrived today (local time)
        last_received = exp.get("last_received_at")
        if last_received:
            try:
                lr = datetime.fromisoformat(last_received)
                if lr.tzinfo is None:
                    lr = lr.replace(tzinfo=timezone.utc)
                lr_local = lr + timedelta(hours=tz_offset)
                # Report arrived today — no alert needed
                if lr_local.date() == now_local.date():
                    return False
            except Exception:
                pass

        # Check if we already alerted today
        last_alerted = exp.get("last_alerted_at")
        if last_alerted:
            try:
                la = datetime.fromisoformat(last_alerted)
                if la.tzinfo is None:
                    la = la.replace(tzinfo=timezone.utc)
                la_local = la + timedelta(hours=tz_offset)
                if la_local.date() == now_local.date():
                    return False
            except Exception:
                pass

        return True

    def _send_alert(self, exp: dict, now_utc: datetime):
        """Send alert email to operator."""
        org_name = (exp.get("organizations") or {}).get("name", "Unknown org")
        email_local = exp.get("email_local", "")
        ingest_address = f"{email_local}@ingest.oviq.io"
        expected_by = exp.get("expected_by_hour", 10)
        grace = exp.get("grace_period_hours", 2)

        subject = f"⚠️ Missing TMS report — {org_name}"
        body = f"""Hi {OPERATOR_NAME},

Oviq hasn't received today's TMS report from {org_name}.

Details:
- Ingest address: {ingest_address}
- Expected by: {expected_by}:00 local time
- Grace period: {grace} hours
- Current time (UTC): {now_utc.strftime('%Y-%m-%d %H:%M UTC')}

This means Oviq may not have detected today's exceptions for this customer.

What to check:
1. Log into {org_name}'s TMS and verify the scheduled report is still configured
2. Check that the report is set to email {ingest_address}
3. Check Postmark inbound activity for any bounced emails
4. Contact the customer if the issue persists

You can view their ingest history in Supabase → ingest_files table.

— Oviq Monitoring
"""

        try:
            resend.Emails.send({
                "from": f"Oviq Monitoring <ops@notify.oviq.io>",
                "to": OPERATOR_EMAIL,
                "subject": subject,
                "text": body,
            })
            logger.warning(f"[monitor] Alert sent for {org_name} — report overdue")
        except Exception as e:
            logger.error(f"[monitor] Failed to send alert email: {e}")

    def _mark_alerted(self, expectation_id: str, now_utc: datetime):
        """Record that we sent an alert so we don't spam."""
        try:
            self.db.table("report_expectations").update({
                "last_alerted_at": now_utc.isoformat(),
            }).eq("id", expectation_id).execute()
        except Exception as e:
            logger.error(f"[monitor] Failed to mark alerted: {e}")

    def update_last_received(self, org_id: str, email_local: str):
        """
        Called by ingest pipeline when a report arrives.
        Updates last_received_at so the monitor knows coverage is current.
        """
        try:
            now = datetime.now(timezone.utc).isoformat()
            # Try to find by email_local first
            result = self.db.table("report_expectations") \
                .select("id") \
                .eq("organization_id", org_id) \
                .eq("email_local", email_local) \
                .eq("active", True) \
                .limit(1) \
                .execute()

            if result.data:
                self.db.table("report_expectations").update({
                    "last_received_at": now,
                }).eq("id", result.data[0]["id"]).execute()
            else:
                # Auto-create an expectation if one doesn't exist yet
                self.db.table("report_expectations").insert({
                    "organization_id": org_id,
                    "email_local": email_local,
                    "label": "TMS report (auto-created)",
                    "last_received_at": now,
                    "active": True,
                }).execute()
                logger.info(f"[monitor] Auto-created expectation for {email_local}")

        except Exception as e:
            logger.error(f"[monitor] Failed to update last_received: {e}")

    def _tz_offset_hours(self, tz_name: str) -> int:
        """
        Simple timezone offset lookup.
        For full accuracy, replace with pytz or zoneinfo.
        """
        offsets = {
            "America/New_York":    -4,  # EDT
            "America/Chicago":     -5,  # CDT
            "America/Denver":      -6,  # MDT
            "America/Phoenix":     -7,  # MST (no DST)
            "America/Los_Angeles": -7,  # PDT
            "UTC": 0,
        }
        return offsets.get(tz_name, -5)  # Default to CDT
