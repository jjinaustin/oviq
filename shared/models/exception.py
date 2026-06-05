from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from enum import Enum
import uuid

class ExceptionType(str, Enum):
    MISSED_PICKUP = "missed_pickup"
    DELAYED_TRANSIT = "delayed_transit"
    LATE_DELIVERY = "late_delivery"
    MISSING_POD = "missing_pod"
    CARRIER_UNRESPONSIVE = "carrier_unresponsive"
    CUSTOMER_COMPLAINT = "customer_complaint"

class ExceptionRecord(BaseModel):
    id: str = None
    case_id: str
    shipment_id: str
    exception_type: ExceptionType
    detected_at: datetime = None
    detected_by: str = "system"     # system | user_id
    notes: Optional[str]
    resolved: bool = False
    resolved_at: Optional[datetime]

    def __init__(self, **data):
        if not data.get("id"):
            data["id"] = str(uuid.uuid4())
        if not data.get("detected_at"):
            data["detected_at"] = datetime.utcnow()
        super().__init__(**data)
