import uuid
from datetime import datetime

from pydantic import BaseModel, Field

from app.models.enums import CategoryStatus
from app.schemas.common import ORMModel


class CategoryBase(BaseModel):
    name: str = Field(min_length=2, max_length=120)
    icon: str = Field(default="circle-alert", max_length=64, description="Lucide icon name")
    description: str | None = None
    is_importance_level_required: bool = Field(
        default=False, description="Whether users are asked how severe the problem is (1-5)"
    )


class CategoryCreate(CategoryBase):
    """Created by an admin - approved immediately."""


class CategoryProposal(CategoryBase):
    """Proposed by a user when no existing category fits - awaits admin approval."""


class CategoryUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=2, max_length=120)
    icon: str | None = Field(default=None, max_length=64)
    description: str | None = None
    is_importance_level_required: bool | None = None
    status: CategoryStatus | None = None


class CategoryReject(BaseModel):
    reassign_to_category_id: uuid.UUID | None = Field(
        default=None,
        description="Move problems to this category; otherwise they are marked as rejected",
    )


class CategoryBrief(ORMModel):
    id: uuid.UUID
    name: str
    icon: str
    is_importance_level_required: bool
    status: CategoryStatus


class CategoryRead(ORMModel):
    id: uuid.UUID
    name: str
    icon: str
    description: str | None
    is_importance_level_required: bool
    status: CategoryStatus
    problems_count: int = 0
    created_at: datetime
    updated_at: datetime
