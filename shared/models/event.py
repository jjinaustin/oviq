from pydantic import BaseModel
from typing import Optional, Any, Dict
from datetime import datetime
from enum import Enum
import uuid

class EventActor(str, Enum):
    SYSTEM = "system"
    AI = "ai"
    HUMAN = "human"

class Event(BaseModel):
    """Append-only timeline entry. Never mutate, never delete."""
    id: str = None
    case_id: str
    shipment_id: Optional[str]
    event_type: str                 # free-form: "shipment.delayed", "carrier.emailed", etc.
    actor: EventActor
    actor_id: Optional[str]        # user_id if human
    payload: Optional[Dict[str, Any]] = {}
    summary: str                   # human-readable description for timeline UI
    created_at: datetime = None

    def __init__(self, **data):
        if not data.get("id"):
            data["id"] = str(uuid.uuid4())
        if not data.get("created_at"):
            data["created_at"] = datetime.utcnow()
        super().__init__(**data)
