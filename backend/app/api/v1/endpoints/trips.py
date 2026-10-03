import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import CurrentUser
from app.db.session import get_db
from app.schemas.trip import TripCreate, TripRead
from app.services.trip_service import TripService

router = APIRouter(prefix="/trips", tags=["trips"])


@router.get("", response_model=list[TripRead])
async def list_trips(
    db: Annotated[AsyncSession, Depends(get_db)],
    _user: CurrentUser,
) -> list[TripRead]:
    return await TripService(db).list()


@router.post("", response_model=TripRead, status_code=status.HTTP_201_CREATED)
async def create_trip(
    payload: TripCreate,
    db: Annotated[AsyncSession, Depends(get_db)],
    _user: CurrentUser,
) -> TripRead:
    return await TripService(db).create(payload)


@router.get("/{trip_id}", response_model=TripRead)
async def get_trip(
    trip_id: uuid.UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
    _user: CurrentUser,
) -> TripRead:
    return await TripService(db).get(trip_id)
