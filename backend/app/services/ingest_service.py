import io
import pandas as pd
from app.db.client import get_supabase
from app.services.exception_detector import ExceptionDetector

COLUMN_MAP = {
    "load id": "load_id", "load #": "load_id", "load number": "load_id",
    "customer": "customer_name", "shipper": "customer_name",
    "carrier": "carrier_name",
    "origin": "origin", "pickup city": "origin",
    "destination": "destination", "delivery city": "destination",
    "pickup date": "pickup_scheduled", "sched pickup": "pickup_scheduled",
    "delivery date": "delivery_scheduled", "sched delivery": "delivery_scheduled",
    "status": "status",
}

class IngestService:
    def __init__(self):
        self.db = get_supabase()
        self.detector = ExceptionDetector()

    async def process_csv(self, content: bytes) -> dict:
        df = pd.read_csv(io.BytesIO(content))
        df.columns = [COLUMN_MAP.get(c.strip().lower(), c.strip().lower()) for c in df.columns]
        created, skipped, cases_opened = 0, 0, 0

        for _, row in df.iterrows():
            data = self._row_to_shipment(row)
            if not data.get("load_id"):
                skipped += 1
                continue
            existing = self.db.table("shipments").select("id").eq("load_id", data["load_id"]).execute()
            if existing.data:
                skipped += 1
                continue
            result = self.db.table("shipments").insert(data).execute()
            shipment = result.data[0]
            created += 1
            new_cases = await self.detector.evaluate(shipment)
            cases_opened += len(new_cases)

        return {"shipments_created": created, "shipments_skipped": skipped, "cases_opened": cases_opened}

    def _row_to_shipment(self, row) -> dict:
        def safe(key):
            val = row.get(key)
            return None if pd.isna(val) else str(val).strip()
        return {
            "load_id": safe("load_id"),
            "customer_name": safe("customer_name") or "Unknown",
            "carrier_name": safe("carrier_name") or "Unknown",
            "origin": safe("origin") or "",
            "destination": safe("destination") or "",
            "pickup_scheduled": safe("pickup_scheduled"),
            "delivery_scheduled": safe("delivery_scheduled"),
            "status": safe("status") or "pending",
            "raw_data": row.to_dict(),
        }
