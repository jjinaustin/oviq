from functools import lru_cache
from supabase import create_client, Client
from app.core.config import settings

@lru_cache(maxsize=1)
def get_supabase() -> Client:
    """
    Returns a cached Supabase client using the service role key.
    Service role bypasses RLS — for server-side use only.
    """
    if not settings.SUPABASE_URL or not settings.SUPABASE_SERVICE_KEY:
        raise RuntimeError(
            "SUPABASE_URL and SUPABASE_SERVICE_KEY must be set in .env"
        )
    return create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_KEY)
