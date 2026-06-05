from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from enum import Enum
import uuid

class TaskOwner(str, Enum):
    AI = "ai"
    HUMAN = "human"

class TaskStatus(str, Enum):
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    CANCELLED = "cancelled"
    FAILED = "failed"

class Task(BaseModel):
    id: str = None
    case_id: str
    owner: TaskOwner
    assigned_to: Optional[str]      # user_id if human
    title: str
    description: Optional[str]
    status: TaskStatus = TaskStatus.PENDING
    due_at: Optional[datetime]
    completed_at: Optional[datetime]
    created_at: datetime = None

    def __init__(self, **data):
        if not data.get("id"):
            data["id"] = str(uuid.uuid4())
        if not data.get("created_at"):
            data["created_at"] = datetime.utcnow()
        super().__init__(**data)
