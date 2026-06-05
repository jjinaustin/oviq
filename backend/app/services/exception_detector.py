from datetime import datetime, timezone
from app.db.client import get_supabase

class ExceptionDetector:
    def __init__(self):
        self.db = get_supabase()

    async def evaluate(self, shipment: dict) -> list:
        cases = []
        exceptions = self._detect(shipment)
        if not exceptions:
            return cases
        case = self._open_case(shipment, exceptions)
        cases.append(case["id"])
        return cases

    def _detect(self, s: dict) -> list:
        detected = []
        now = datetime.now(timezone.utc)
        pickup = self._parse_dt(s.get("pickup_scheduled"))
        delivery = self._parse_dt(s.get("delivery_scheduled"))
        status = (s.get("status") or "").lower()

        if pickup and pickup < now and status in ("pending", ""):
            detected.append({"type": "missed_pickup", "severity": "high"})
        if delivery and delivery < now and status not in ("delivered",):
            detected.append({"type": "late_delivery", "severity": "high"})
        if status == "delayed":
            detected.append({"type": "delayed_transit", "severity": "medium"})

        return detected

    def _open_case(self, shipment: dict, exceptions: list) -> dict:
        priority = "high" if any(e["severity"] == "high" for e in exceptions) else "medium"
        types = [e["type"] for e in exceptions]
        title = f"{shipment.get('load_id')} — {', '.join(types).replace('_', ' ').title()}"

        case_result = self.db.table("cases").insert({
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
