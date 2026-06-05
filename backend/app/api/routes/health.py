from fastapi import APIRouter
from app.db.client import get_supabase

router = APIRouter()

@router.get("/health")
async def health():
    """Basic liveness check."""
    return {"status": "ok", "version": "0.1.0"}

@router.get("/health/db")
async def health_db():
    """Tests Supabase connectivity — useful for deploy verification."""
    try:
        db = get_supabase()
        result = db.table("organizations").select("id").limit(1).execute()
        return {"status": "ok", "db": "connected"}
    except Exception as e:
        return {"status": "error", "db": str(e)}
