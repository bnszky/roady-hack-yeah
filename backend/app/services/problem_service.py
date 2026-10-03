import uuid
from datetime import UTC, datetime

from sqlalchemy import Select, and_, case, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import contains_eager, selectinload

from app.core.config import settings
from app.core.exceptions import NotFoundError, ValidationError
from app.core.geo import bbox_around, haversine_sql
from app.models import Category, CategoryStatus, Problem, ProblemReport, ProblemStatus
from app.schemas.common import Page, SortOrder
from app.schemas.problem import (
    ProblemCreate,
    ProblemFilters,
    ProblemListParams,
    ProblemRead,
    ProblemReportRead,
    ProblemReportResult,
    ProblemResponseCreate,
    ProblemUpdate,
    ProblemWithDistance,
)
from app.services.category_service import CategoryService

CLOSED_STATUSES = (ProblemStatus.RESOLVED, ProblemStatus.REJECTED)


class ProblemService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.categories = CategoryService(db)

    # ---------- queries ----------

    @staticmethod
    def _base_query() -> Select[tuple[Problem]]:
        return select(Problem).join(Problem.category).options(contains_eager(Problem.category))

    @staticmethod
    def _apply_filters(stmt: Select, filters: ProblemFilters) -> Select:
        if filters.category_ids:
            stmt = stmt.where(Problem.category_id.in_(filters.category_ids))
        if filters.statuses:
            stmt = stmt.where(Problem.status.in_(filters.statuses))
        if filters.is_observable is not None:
            stmt = stmt.where(Problem.is_observable == filters.is_observable)
        if filters.min_confirmations is not None:
            stmt = stmt.where(Problem.confirmations_count >= filters.min_confirmations)
        if filters.min_importance is not None:
            stmt = stmt.where(Problem.importance_level_average >= filters.min_importance)
        allowed = [CategoryStatus.APPROVED]
        if filters.include_pending_categories:
            allowed.append(CategoryStatus.PENDING)
        return stmt.where(Category.status.in_(allowed))

    @staticmethod
    def _apply_bbox(
        stmt: Select, min_lat: float, max_lat: float, min_lng: float, max_lng: float
    ) -> Select:
        return stmt.where(
            Problem.latitude.between(min_lat, max_lat),
            Problem.longitude.between(min_lng, max_lng),
        )

    async def search(self, params: ProblemListParams) -> Page[ProblemRead]:
        stmt = self._apply_filters(self._base_query(), params)
        if None not in (params.min_lat, params.max_lat, params.min_lng, params.max_lng):
            stmt = self._apply_bbox(
                stmt, params.min_lat, params.max_lat, params.min_lng, params.max_lng
            )
        if params.q:
            stmt = stmt.where(Problem.description.ilike(f"%{params.q}%"))

        total = (
            await self.db.execute(select(func.count()).select_from(stmt.subquery()))
        ).scalar_one()

        sort_col = getattr(Problem, params.sort_by.value)
        ordering = sort_col.asc() if params.order == SortOrder.ASC else sort_col.desc()
        stmt = (
            stmt.order_by(ordering.nulls_last(), Problem.id)
            .limit(params.limit)
            .offset(params.offset)
        )
        problems = (await self.db.execute(stmt)).scalars().all()
        return Page[ProblemRead](
            items=[ProblemRead.model_validate(p) for p in problems],
            total=total,
            limit=params.limit,
            offset=params.offset,
        )

    async def list_in_bbox(
        self, bbox: tuple[float, float, float, float], filters: ProblemFilters, limit: int = 5000
    ) -> list[Problem]:
        stmt = self._apply_bbox(self._apply_filters(self._base_query(), filters), *bbox)
        return list((await self.db.execute(stmt.limit(limit))).scalars().all())

    async def get(self, problem_id: uuid.UUID, with_reports: bool = False) -> Problem:
        stmt = (
            self._base_query()
            .where(Problem.id == problem_id)
            .execution_options(populate_existing=True)
        )
        if with_reports:
            stmt = stmt.options(selectinload(Problem.reports))
        problem = (await self.db.execute(stmt)).unique().scalar_one_or_none()
        if problem is None:
            raise NotFoundError("Problem not found")
        return problem

    async def nearby(
        self,
        latitude: float,
        longitude: float,
        radius_m: float,
        filters: ProblemFilters,
        limit: int = 20,
    ) -> list[ProblemWithDistance]:
        distance = haversine_sql(Problem.latitude, Problem.longitude, latitude, longitude)
        stmt = self._apply_bbox(
            self._apply_filters(self._base_query(), filters),
            *bbox_around(latitude, longitude, radius_m),
        )
        stmt = (
            stmt.add_columns(distance.label("distance_m"))
            .where(distance <= radius_m)
            .order_by(distance)
            .limit(limit)
        )
        rows = (await self.db.execute(stmt)).all()
        return [
            ProblemWithDistance(
                **ProblemRead.model_validate(p).model_dump(), distance_m=round(d, 1)
            )
            for p, d in rows
        ]

    async def find_duplicate(
        self, category_id: uuid.UUID, latitude: float, longitude: float
    ) -> Problem | None:
        """Closest still-open problem of the same category within the dedupe radius."""
        radius = settings.problem_dedupe_radius_m
        distance = haversine_sql(Problem.latitude, Problem.longitude, latitude, longitude)
        stmt = self._apply_bbox(self._base_query(), *bbox_around(latitude, longitude, radius))
        stmt = (
            stmt.where(
                Problem.category_id == category_id,
                Problem.is_observable.is_(True),
                Problem.status.not_in(CLOSED_STATUSES),
                distance <= radius,
            )
            .order_by(distance)
            .limit(1)
        )
        return (await self.db.execute(stmt)).scalars().first()

    # ---------- commands ----------

    async def create_report(self, data: ProblemCreate) -> ProblemReportResult:
        if data.new_category is not None:
            category = await self.categories.find_by_name(data.new_category.name)
            if category is None:
                category = await self.categories.create(
                    data.new_category, status=CategoryStatus.PENDING
                )
        else:
            category = await self.categories.get(data.category_id)
        if category.status == CategoryStatus.REJECTED:
            raise ValidationError("This category was rejected - choose another one")

        if category.is_importance_level_required and data.importance_level is None:
            raise ValidationError("importance_level (1-5) is required for this category")
        importance = data.importance_level if category.is_importance_level_required else None

        if data.attach_to_problem_id is not None:
            problem = await self.get(data.attach_to_problem_id)
            if problem.category_id != category.id:
                raise ValidationError("attach_to_problem_id belongs to a different category")
        else:
            problem = await self.find_duplicate(category.id, data.latitude, data.longitude)

        reported_at = data.reported_at or datetime.now(UTC)
        attached = problem is not None
        if problem is None:
            problem = Problem(
                category_id=category.id,
                latitude=data.latitude,
                longitude=data.longitude,
                description=data.description,
                status=ProblemStatus.NEW,
                first_reported_at=reported_at,
                last_reported_at=reported_at,
            )
            self.db.add(problem)
            await self.db.flush()
        elif not problem.description and data.description:
            problem.description = data.description

        report = ProblemReport(
            problem_id=problem.id,
            is_observable=True,
            importance_level=importance,
            description=data.description,
            latitude=data.latitude,
            longitude=data.longitude,
            source=data.source,
            transcript=data.transcript,
            reported_at=reported_at,
        )
        return await self._save_report(problem.id, report, attached)

    async def add_response(
        self, problem_id: uuid.UUID, data: ProblemResponseCreate
    ) -> ProblemReportResult:
        problem = await self.get(problem_id)
        keep_importance = data.is_observable and problem.category.is_importance_level_required
        report = ProblemReport(
            problem_id=problem.id,
            is_observable=data.is_observable,
            importance_level=data.importance_level if keep_importance else None,
            description=data.description,
            latitude=data.latitude,
            longitude=data.longitude,
            source=data.source,
            transcript=data.transcript,
            reported_at=data.reported_at or datetime.now(UTC),
        )
        return await self._save_report(problem.id, report, attached=True)

    async def update(self, problem_id: uuid.UUID, data: ProblemUpdate) -> Problem:
        problem = await self.get(problem_id)
        changes = data.model_dump(exclude_unset=True)
        if changes.get("category_id") is not None:
            await self.categories.get(changes["category_id"])
        for field, value in changes.items():
            setattr(problem, field, value)
        await self.db.commit()
        return await self.get(problem_id, with_reports=True)

    async def delete(self, problem_id: uuid.UUID) -> None:
        problem = await self.get(problem_id)
        await self.db.delete(problem)
        await self.db.commit()

    async def _save_report(
        self, problem_id: uuid.UUID, report: ProblemReport, attached: bool
    ) -> ProblemReportResult:
        self.db.add(report)
        await self.db.flush()
        await self._recompute(problem_id)
        await self.db.commit()
        await self.db.refresh(report)
        problem = await self.get(problem_id)
        return ProblemReportResult(
            problem=ProblemRead.model_validate(problem),
            report=ProblemReportRead.model_validate(report),
            attached_to_existing=attached,
        )

    async def _recompute(self, problem_id: uuid.UUID) -> None:
        """Rebuild cached aggregates on the problem from all its reports."""
        r = ProblemReport
        last_yes = (
            select(func.max(r.reported_at))
            .where(r.problem_id == problem_id, r.is_observable.is_(True))
            .scalar_subquery()
        )
        stmt = select(
            func.count(r.id),
            func.count(r.id).filter(r.is_observable.is_(True)),
            func.count(r.id).filter(r.is_observable.is_(False)),
            func.avg(case((r.is_observable.is_(True), r.importance_level))),
            func.min(r.reported_at),
            func.max(r.reported_at),
            func.count(r.id).filter(
                and_(
                    r.is_observable.is_(False),
                    or_(last_yes.is_(None), r.reported_at > last_yes),
                )
            ),
        ).where(r.problem_id == problem_id)
        total, yes, no, avg_importance, first_at, last_at, consecutive_no = (
            await self.db.execute(stmt)
        ).one()

        problem = await self.db.get(Problem, problem_id)
        problem.reports_count = total
        problem.confirmations_count = yes
        problem.denials_count = no
        problem.consecutive_denials = consecutive_no
        problem.importance_level_average = (
            round(float(avg_importance), 2) if avg_importance is not None else None
        )
        problem.first_reported_at = first_at
        problem.last_reported_at = last_at
        problem.is_observable = consecutive_no < settings.problem_denial_threshold
