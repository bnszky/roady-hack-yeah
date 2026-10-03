import httpx

from app.core.config import settings


class SupabaseAuthError(Exception):
    pass


async def get_supabase_user(access_token: str) -> dict:
    """Validate a Supabase JWT by calling the Auth server and return the user."""
    url = f"{settings.supabase_url.rstrip('/')}/auth/v1/user"
    headers = {
        "Authorization": f"Bearer {access_token}",
        "apikey": settings.supabase_anon_key,
    }

    async with httpx.AsyncClient(timeout=10.0) as client:
        response = await client.get(url, headers=headers)

    if response.status_code != 200:
        raise SupabaseAuthError(f"Supabase auth returned {response.status_code}")

    return response.json()
