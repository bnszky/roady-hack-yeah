import uuid
from datetime import datetime
from enum import StrEnum
from typing import Annotated

from pydantic import BaseModel, Field, model_validator

from app.models.enums import ProblemStatus, ReportSource
from app.schemas.category import CategoryBrief, CategoryProposal
from app.schemas.common import ORMModel, SortOrder

ImportanceLevel = Annotated[int | None, Field(ge=1, le=5, description="Severity 1-5")]


class ProblemSortField(StrEnum):
    CONFIRMATIONS = "confirmations_count"
    IMPORTANCE = "importance_level_average"
    REPORTS = "reports_count"
    LAST_REPORTED = "last_reported_at"
    FIRST_REPORTED = "first_reported_at"


class ProblemFilters(BaseModel):
    """Filters shared by map/list, nearby and route queries."""

    category_ids: list[uuid.UUID] | None = None
    statuses: list[ProblemStatus] | None = None
    is_observable: bool | None = Field(
        default=None, description="true = only problems that still exist"
    )
    min_confirmations: int | None = Field(default=None, ge=0)
    min_importance: float | None = Field(default=None, ge=1, le=5)
    include_pending_categories: bool = Field(
        default=False, description="Include problems in categories awaiting admin approval"
    )


class ProblemListParams(ProblemFilters):
    min_lat: float | None = Field(default=None, ge=-90, le=90)
    max_lat: float | None = Field(default=None, ge=-90, le=90)
    min_lng: float | None = Field(default=None, ge=-180, le=180)
    max_lng: float | None = Field(default=None, ge=-180, le=180)
    q: str | None = Field(default=None, description="Search in description")
    sort_by: ProblemSortField = ProblemSortField.LAST_REPORTED
    order: SortOrder = SortOrder.DESC
    limit: int = Field(default=50, ge=1, le=1000)
    offset: int = Field(default=0, ge=0)


class ProblemNearbyParams(ProblemFilters):
    latitude: float = Field(ge=-90, le=90)
    longitude: float = Field(ge=-180, le=180)
    radius_m: float | None = Field(default=None, gt=0, le=5000, description="Defaults to settings")
    is_observable: bool | None = True
    limit: int = Field(default=20, ge=1, le=200)


class ProblemReportRead(ORMModel):
    id: uuid.UUID
    problem_id: uuid.UUID
    is_observable: bool
    importance_level: int | None
    description: str | None
    latitude: float | None
    longitude: float | None
    source: ReportSource
    transcript: str | None
    reported_at: datetime
    created_at: datetime


class ProblemRead(ORMModel):
    id: uuid.UUID
    category_id: uuid.UUID
    category: CategoryBrief
    latitude: float
    longitude: float
    description: str | None
    status: ProblemStatus
    status_note: str | None
    is_observable: bool
    reports_count: int
    confirmations_count: int = Field(description="YES reports, including the initial one")
    denials_count: int = Field(description="'Problem no longer exists' answers")
    consecutive_denials: int = Field(description="NO answers since the last YES")
    importance_level_average: float | None
    first_reported_at: datetime
    last_reported_at: datetime
    created_at: datetime
    updated_at: datetime


class ProblemDetail(ProblemRead):
    reports: list[ProblemReportRead]


class ProblemWithDistance(ProblemRead):
    distance_m: float


class ProblemCreate(BaseModel):
    """New report from the form or the voice assistant.

    Provide exactly one of `category_id` / `new_category`. If an observable problem of the same
    category exists within the dedupe radius, the report is attached to it instead.
    """

    category_id: uuid.UUID | None = None
    new_category: CategoryProposal | None = None
    description: str | None = None
    importance_level: ImportanceLevel = None
    latitude: float = Field(ge=-90, le=90)
    longitude: float = Field(ge=-180, le=180)
    reported_at: datetime | None = Field(default=None, description="Defaults to now")
    source: ReportSource = ReportSource.FORM
    transcript: str | None = Field(default=None, description="Raw voice transcript")
    attach_to_problem_id: uuid.UUID | None = Field(
        default=None, description="Force attaching to this problem (e.g. from assistant draft)"
    )

    @model_validator(mode="after")
    def _one_category_source(self) -> "ProblemCreate":
        if (self.category_id is None) == (self.new_category is None):
            raise ValueError("Provide exactly one of category_id or new_category")
        return self


class ProblemResponseCreate(BaseModel):
    """Answer to 'Does the problem still exist?' (proximity popup or voice)."""

    is_observable: bool
    importance_level: ImportanceLevel = None
    description: str | None = None
    latitude: float | None = Field(default=None, ge=-90, le=90)
    longitude: float | None = Field(default=None, ge=-180, le=180)
    reported_at: datetime | None = None
    source: ReportSource = ReportSource.PROXIMITY_PROMPT
    transcript: str | None = None


class ProblemUpdate(BaseModel):
    """Admin edit."""

    category_id: uuid.UUID | None = None
    description: str | None = None
    status: ProblemStatus | None = None
    status_note: str | None = None
    latitude: float | None = Field(default=None, ge=-90, le=90)
    longitude: float | None = Field(default=None, ge=-180, le=180)


class ProblemReportResult(BaseModel):
    problem: ProblemRead
    report: ProblemReportRead
    attached_to_existing: bool = Field(
        description="True if the report was merged into an already known problem"
    )
