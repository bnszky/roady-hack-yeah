import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class PlaceBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    category: str = Field(..., min_length=1, max_length=100)
    latitude: float = Field(..., ge=-90, le=90)
    longitude: float = Field(..., ge=-180, le=180)


class PlaceCreate(PlaceBase):
    pass


class PlaceRead(PlaceBase):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    created_at: datetime
