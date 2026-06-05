from pydantic import BaseModel
from typing import Optional
from datetime import datetime
import uuid

class Resolution(BaseModel):
    id: str = None
    case_id: str
    resolved_by: str                # user_id or "ai"
    resolution_type: str            # "auto" | "manual" | "escalated"
    summary: str
    time_to_resolve_minutes: Optional[int]
    created_at: datetime = None

    def __init__(self, **data):
        if not data.get("id"):
            data["id"] = str(uuid.uuid4())
        if not data.get("created_at"):
            data["created_at"] = datetime.utcnow()
        super().__init__(**data)
