from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from enum import Enum
import uuid

class CaseStatus(str, Enum):
    OPEN = "open"
    AI_RESOLVING = "ai_resolving"
    PENDING_HUMAN = "pending_human"
    ESCALATED = "escalated"
    RESOLVED = "resolved"
    CLOSED = "closed"

class CasePriority(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"

class Case(BaseModel):
    id: str = None
    organization_id: str
    shipment_id: str
    playbook_id: Optional[str]
    title: str
    status: CaseStatus = CaseStatus.OPEN
    priority: CasePriority = CasePriority.MEDIUM
    assigned_to: Optional[str]      # user_id or "ai"
    opened_at: datetime = None
    resolved_at: Optional[datetime]
    resolution_notes: Optional[str]
    sla_deadline: Optional[datetime]
    created_at: datetime = None
    updated_at: datetime = None

    def __init__(self, **data):
        if not data.get("id"):
            data["id"] = str(uuid.uuid4())
        now = datetime.utcnow()
        if not data.get("opened_at"):
            data["opened_at"] = now
        if not data.get("created_at"):
            data["created_at"] = now
        data["updated_at"] = now
        super().__init__(**data)
