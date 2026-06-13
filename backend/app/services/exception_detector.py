from datetime import datetime, timedelta, timezone
from app.db.client import get_supabase

# Grace periods — how long past a threshold before we fire an exception
PICKUP_GRACE_HOURS = 2       # missed pickup: 2h past scheduled time
POD_GRACE_DAYS = 3           # missing POD: 3 days after delivery_actual


class ExceptionDetector:
    def __init__(self):
        self.db = get_supabase()

    async def evaluate(self, shipment: dict) -> list:
        """
        Evaluate a shipment for exceptions. Returns list of case IDs opened.
        Safe to call repeatedly — will not open duplicate cases for the same
        exception type on the same shipment.
        """
        exceptions = self._detect(shipment)
        if not exceptions:
            return []

        # Filter out exception types that already have an open case
        new_exceptions = self._filter_existing(shipment["id"], exceptions)
        if not new_exceptions:
            return []

        case = self._open_case(shipment, new_exceptions)
        return [case["id"]]

    # ------------------------------------------------------------------
    # Detection logic
    # ------------------------------------------------------------------

    def _detect(self, s: dict) -> list:
        detected = []
        now = datetime.now(timezone.utc)

        pickup_sched  = self._parse_dt(s.get("pickup_scheduled"))
        delivery_sched = self._parse_dt(s.get("delivery_scheduled"))
        delivery_actual = self._parse_dt(s.get("delivery_actual"))
        status = (s.get("status") or "").lower()
        pod_received = s.get("pod_received") or False

        # Missed pickup: scheduled time + grace period passed, not yet picked up
        if pickup_sched:
            grace_cutoff = pickup_sched + timedelta(hours=PICKUP_GRACE_HOURS)
            if grace_cutoff < now and status in ("pending", "booked", "dispatched", ""):
                detected.append({"type": "missed_pickup", "severity": "high"})

        # Late delivery: delivery window passed, not delivered
        if delivery_sched and delivery_sched < now and status not in ("delivered", "cancelled"):
            detected.append({"type": "late_delivery", "severity": "high"})

        # Delayed transit: carrier has explicitly reported a delay
        if status == "delayed":
            detected.append({"type": "delayed_transit", "severity": "medium"})

        # Missing POD: delivered but no POD after grace period
        if delivery_actual:
            pod_cutoff = delivery_actual + timedelta(days=POD_GRACE_DAYS)
            if pod_cutoff < now and not pod_received and status == "delivered":
                detected.append({"type": "missing_pod", "severity": "medium"})

        return detected

    def _filter_existing(self, shipment_id: str, exceptions: list) -> list:
        """
        Remove exception types that already have an open/active case on this shipment.
        Prevents duplicate cases on repeated detection runs.
        """
        existing = self.db.table("exceptions") \
            .select("exception_type") \
            .eq("shipment_id", shipment_id) \
            .eq("resolved", False) \
            .execute()

        existing_types = {r["exception_type"] for r in (existing.data or [])}
        return [e for e in exceptions if e["type"] not in existing_types]

    # ------------------------------------------------------------------
    # Case creation
    # ------------------------------------------------------------------

    def _open_case(self, shipment: dict, exceptions: list) -> dict:
        priority = "high" if any(e["severity"] == "high" for e in exceptions) else "medium"
        types = [e["type"] for e in exceptions]
        title = f"{shipment.get('load_id')} — {', '.join(types).replace('_', ' ').title()}"

        case_result = self.db.table("cases").insert({
            "organization_id": shipment.get("organization_id"),
            "shipment_id": shipment["id"],
            "title": title,
            "status": "open",
            "priority": priority,
            "assigned_to": "ai",
        }).execute()
        case = case_result.data[0]

        for exc in exceptions:
            self.db.table("exceptions").insert({
                "case_id": case["id"],
                "shipment_id": shipment["id"],
                "exception_type": exc["type"],
                "detected_by": "system",
            }).execute()

            self.db.table("events").insert({
                "case_id": case["id"],
                "shipment_id": shipment["id"],
                "event_type": f"exception.{exc['type']}",
                "actor": "system",
                "summary": f"Exception detected: {exc['type'].replace('_', ' ').title()}",
                "payload": exc,
            }).execute()

        return case

    # ------------------------------------------------------------------
    # Helpers
    # ------------------------------------------------------------------

    def _parse_dt(self, value) -> datetime | None:
        if not value:
            return None
        try:
            dt = datetime.fromisoformat(str(value))
            if dt.tzinfo is None:
                dt = dt.replace(tzinfo=timezone.utc)
            return dt
        except Exception:
            return None
