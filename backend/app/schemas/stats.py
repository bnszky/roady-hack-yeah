import uuid

from pydantic import BaseModel

from app.models.enums import ProblemStatus


class CategoryStats(BaseModel):
    category_id: uuid.UUID
    name: str
    icon: str
    problems_count: int


class StatsSummary(BaseModel):
    problems_total: int
    problems_observable: int
    problems_by_status: dict[ProblemStatus, int]
    reports_total: int
    reports_last_7_days: int
    pending_categories: int
    top_categories: list[CategoryStats]
