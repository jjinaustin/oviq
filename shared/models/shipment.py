from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from enum import Enum
import uuid

class ShipmentStatus(str, Enum):
    PENDING = "pending"
    IN_TRANSIT = "in_transit"
    DELIVERED = "delivered"
    DELAYED = "delayed"
    EXCEPTION = "exception"
    CANCELLED = "cancelled"

class Shipment(BaseModel):
    id: str = None
    organization_id: str
    load_id: str                    # TMS/CSV reference
    customer_name: str
    customer_email: Optional[str]
    carrier_name: str
    carrier_email: Optional[str]
    carrier_phone: Optional[str]
    origin: str
    destination: str
    pickup_scheduled: Optional[datetime]
    delivery_scheduled: Optional[datetime]
    pickup_actual: Optional[datetime]
    delivery_actual: Optional[datetime]
    status: ShipmentStatus = ShipmentStatus.PENDING
    raw_data: Optional[dict] = {}   # original CSV row preserved
    created_at: datetime = None
    updated_at: datetime = None

    def __init__(self, **data):
        if not data.get("id"):
            data["id"] = str(uuid.uuid4())
        if not data.get("created_at"):
            data["created_at"] = datetime.utcnow()
        data["updated_at"] = datetime.utcnow()
        super().__init__(**data)
