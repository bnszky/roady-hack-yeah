import uuid
from datetime import datetime

from pydantic import BaseModel, Field

from app.schemas.category import CategoryProposal, CategoryRead
from app.schemas.problem import ProblemRead


class ReportDraftRequest(BaseModel):
    text: str = Field(min_length=3, description="Transcribed user speech")
    latitude: float = Field(ge=-90, le=90)
    longitude: float = Field(ge=-180, le=180)


class ReportDraft(BaseModel):
    """Not persisted. Show to the user; on confirmation submit as `POST /problems`."""

    category: CategoryRead | None = Field(description="Matched existing category")
    proposed_category: CategoryProposal | None = Field(
        description="Suggested new category when nothing matched (needs admin approval)"
    )
    description: str | None
    importance_level: int | None = Field(ge=1, le=5)
    latitude: float
    longitude: float
    reported_at: datetime
    existing_problem: ProblemRead | None = Field(
        description="Nearby problem of the same category the report will be attached to"
    )
    missing_fields: list[str] = Field(
        description="Fields the user still has to provide, e.g. importance_level"
    )
    confidence: float = Field(ge=0, le=1)
    transcript: str


class ResponseDraftRequest(BaseModel):
    text: str = Field(min_length=1, description="Transcribed answer to the proximity popup")
    problem_id: uuid.UUID | None = None


class ResponseDraft(BaseModel):
    """Not persisted. On confirmation submit as `POST /problems/{id}/responses`."""

    is_observable: bool | None = Field(description="null = could not understand")
    importance_level: int | None = Field(ge=1, le=5)
    missing_fields: list[str]
    confidence: float = Field(ge=0, le=1)
    transcript: str
