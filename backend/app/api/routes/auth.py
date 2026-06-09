from fastapi import APIRouter
from pydantic import BaseModel
from app.db.client import get_supabase
import re

router = APIRouter()

class SetupRequest(BaseModel):
    user_id: str
    email: str
    full_name: str
    company_name: str

@router.post("/setup")
async def setup_user(req: SetupRequest):
    db = get_supabase()

    existing = db.table("users").select("id").eq("id", req.user_id).execute()
    if existing.data:
        return {"status": "already_setup"}

    slug = re.sub(r'[^a-z0-9]', '-', req.company_name.lower()).strip('-')
    slug = re.sub(r'-+', '-', slug)

    existing_org = db.table("organizations").select("id").eq("slug", slug).execute()
    if existing_org.data:
        slug = f"{slug}-{req.user_id[:6]}"

    org_result = db.table("organizations").insert({
        "name": req.company_name,
        "slug": slug,
    }).execute()
    org = org_result.data[0]

    db.table("users").insert({
        "id": req.user_id,
        "organization_id": org["id"],
        "email": req.email,
        "full_name": req.full_name,
        "role": "admin",
    }).execute()

    return {"status": "ok", "org_id": org["id"], "slug": slug}

@router.get("/me")
async def get_me(user_id: str):
    db = get_supabase()
    result = db.table("users").select("*, organizations(*)").eq("id", user_id).single().execute()
    return result.data
