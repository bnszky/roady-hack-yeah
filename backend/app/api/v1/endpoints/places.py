import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import CurrentUser
from app.db.session import get_db
from app.schemas.place import PlaceCreate, PlaceRead
from app.services.place_service import PlaceService

router = APIRouter(prefix="/places", tags=["places"])


@router.get("", response_model=list[PlaceRead])
async def list_places(
    db: Annotated[AsyncSession, Depends(get_db)],
    _user: CurrentUser,
) -> list[PlaceRead]:
    return await PlaceService(db).list()


@router.post("", response_model=PlaceRead, status_code=status.HTTP_201_CREATED)
async def create_place(
    payload: PlaceCreate,
    db: Annotated[AsyncSession, Depends(get_db)],
    _user: CurrentUser,
) -> PlaceRead:
    return await PlaceService(db).create(payload)


@router.get("/{place_id}", response_model=PlaceRead)
async def get_place(
    place_id: uuid.UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
    _user: CurrentUser,
) -> PlaceRead:
    return await PlaceService(db).get(place_id)
