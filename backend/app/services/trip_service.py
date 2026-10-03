import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import NotFoundError
from app.models.trip import Trip
from app.schemas.trip import TripCreate


class TripService:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def list(self) -> list[Trip]:
        result = await self.session.execute(select(Trip).order_by(Trip.created_at))
        return list(result.scalars().all())

    async def get(self, trip_id: uuid.UUID) -> Trip:
        trip = await self.session.get(Trip, trip_id)
        if trip is None:
            raise NotFoundError("Trip not found")
        return trip

    async def create(self, payload: TripCreate) -> Trip:
        trip = Trip(**payload.model_dump())
        self.session.add(trip)
        await self.session.commit()
        await self.session.refresh(trip)
        return trip
