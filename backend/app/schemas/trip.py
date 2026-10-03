import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class TripBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    description: str | None = None


class TripCreate(TripBase):
    pass


class TripRead(TripBase):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    created_at: datetime
