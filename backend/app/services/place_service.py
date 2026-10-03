import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import NotFoundError
from app.models.place import Place
from app.schemas.place import PlaceCreate


class PlaceService:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def list(self) -> list[Place]:
        result = await self.session.execute(select(Place).order_by(Place.created_at))
        return list(result.scalars().all())

    async def get(self, place_id: uuid.UUID) -> Place:
        place = await self.session.get(Place, place_id)
        if place is None:
            raise NotFoundError("Place not found")
        return place

    async def create(self, payload: PlaceCreate) -> Place:
        place = Place(**payload.model_dump())
        self.session.add(place)
        await self.session.commit()
        await self.session.refresh(place)
        return place
