from fastapi import APIRouter
from app.db.client import get_supabase

router = APIRouter()

@router.get("/")
async def list_playbooks():
    db = get_supabase()
    result = db.table("playbooks").select("*").eq("enabled", True).execute()
    return result.data
