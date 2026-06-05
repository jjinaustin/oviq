from fastapi import APIRouter, HTTPException
from app.db.client import get_supabase

router = APIRouter()

@router.get("/")
async def list_shipments():
    db = get_supabase()
    result = db.table("shipments").select("*").order("created_at", desc=True).execute()
    return result.data

@router.get("/{shipment_id}")
async def get_shipment(shipment_id: str):
    db = get_supabase()
    result = db.table("shipments").select("*, cases(*)").eq("id", shipment_id).single().execute()
    if not result.data:
        raise HTTPException(404, "Shipment not found")
    return result.data
