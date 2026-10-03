import uuid
from typing import Annotated

from fastapi import APIRouter, Query, status

from app.api.deps import DbSession
from app.core.config import settings
from app.schemas.common import Page
from app.schemas.problem import (
    ProblemCreate,
    ProblemDetail,
    ProblemListParams,
    ProblemNearbyParams,
    ProblemRead,
    ProblemReportResult,
    ProblemResponseCreate,
    ProblemUpdate,
    ProblemWithDistance,
)
from app.services.problem_service import ProblemService

router = APIRouter(prefix="/problems", tags=["problems"])


@router.get("", response_model=Page[ProblemRead], summary="List / map of problems")
async def list_problems(
    params: Annotated[ProblemListParams, Query()], db: DbSession
) -> Page[ProblemRead]:
    """Map and admin list. E.g. well-confirmed only: `min_confirmations=5&is_observable=true`.

    Pass all four `min_lat/max_lat/min_lng/max_lng` to restrict to the visible map area.
    """
    return await ProblemService(db).search(params)


@router.get(
    "/nearby",
    response_model=list[ProblemWithDistance],
    summary="Problems near the user (proximity popup)",
)
async def nearby_problems(
    params: Annotated[ProblemNearbyParams, Query()], db: DbSession
) -> list[ProblemWithDistance]:
    radius = params.radius_m or settings.nearby_default_radius_m
    return await ProblemService(db).nearby(
        params.latitude, params.longitude, radius, params, params.limit
    )


@router.post(
    "",
    response_model=ProblemReportResult,
    status_code=status.HTTP_201_CREATED,
    summary="Report a problem",
)
async def create_problem(data: ProblemCreate, db: DbSession) -> ProblemReportResult:
    """Creates a new problem, or attaches the report to an existing one of the same category
    nearby (`attached_to_existing=true`). With `new_category` a pending category is proposed.
    """
    return await ProblemService(db).create_report(data)


@router.get("/{problem_id}", response_model=ProblemDetail, summary="Problem details with reports")
async def get_problem(problem_id: uuid.UUID, db: DbSession) -> ProblemDetail:
    return ProblemDetail.model_validate(await ProblemService(db).get(problem_id, with_reports=True))


@router.patch("/{problem_id}", response_model=ProblemDetail, summary="Update problem (admin)")
async def update_problem(
    problem_id: uuid.UUID, data: ProblemUpdate, db: DbSession
) -> ProblemDetail:
    return ProblemDetail.model_validate(await ProblemService(db).update(problem_id, data))


@router.delete(
    "/{problem_id}", status_code=status.HTTP_204_NO_CONTENT, summary="Delete problem (admin)"
)
async def delete_problem(problem_id: uuid.UUID, db: DbSession) -> None:
    await ProblemService(db).delete(problem_id)


@router.post(
    "/{problem_id}/responses",
    response_model=ProblemReportResult,
    status_code=status.HTTP_201_CREATED,
    summary="Answer 'does the problem still exist?'",
)
async def respond_to_problem(
    problem_id: uuid.UUID, data: ProblemResponseCreate, db: DbSession
) -> ProblemReportResult:
    """YES confirms (optionally with severity 1-5), NO counts towards hiding the problem."""
    return await ProblemService(db).add_response(problem_id, data)
