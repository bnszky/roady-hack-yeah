from typing import Annotated

from fastapi import Depends, Header, HTTPException, status

from app.core.config import settings
from app.core.security import SupabaseAuthError, get_supabase_user


async def get_current_user(
    authorization: Annotated[str | None, Header()] = None,
) -> dict:
    """Resolve the current Supabase user from the Bearer token.

    Set AUTH_REQUIRED=false (env) to skip validation while prototyping.
    """
    if not settings.auth_required:
        return {
            "id": "anonymous",
            "email": "anonymous@local",
            "app_metadata": {},
            "user_metadata": {},
        }

    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing bearer token")

    token = authorization.split(" ", 1)[1].strip()
    try:
        return await get_supabase_user(token)
    except SupabaseAuthError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired token"
        ) from exc


CurrentUser = Annotated[dict, Depends(get_current_user)]
