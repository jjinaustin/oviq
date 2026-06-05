from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from enum import Enum
import uuid

class ParticipantType(str, Enum):
    CARRIER = "carrier"
    CUSTOMER = "customer"
    INTERNAL = "internal"
    VENDOR = "vendor"

class CommunicationDirection(str, Enum):
    OUTBOUND = "outbound"
    INBOUND = "inbound"

class Communication(BaseModel):
    id: str = None
    case_id: str
    direction: CommunicationDirection
    participant_type: ParticipantType
    channel: str = "email"
    recipient_email: Optional[str]
    recipient_name: Optional[str]
    sender_email: Optional[str]
    subject: Optional[str]
    body: str
    sent_at: Optional[datetime]
    status: str = "pending"         # pending | sent | delivered | replied | failed
    external_message_id: Optional[str]
    created_at: datetime = None

    def __init__(self, **data):
        if not data.get("id"):
            data["id"] = str(uuid.uuid4())
        if not data.get("created_at"):
            data["created_at"] = datetime.utcnow()
        super().__init__(**data)
