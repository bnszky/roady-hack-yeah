from datetime import UTC, datetime, timedelta

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Category, CategoryStatus, Problem, ProblemReport, ProblemStatus
from app.schemas.stats import CategoryStats, StatsSummary


class StatsService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def summary(self) -> StatsSummary:
        async def scalar(stmt) -> int:
            return (await self.db.execute(stmt)).scalar_one()

        by_status_rows = (
            await self.db.execute(select(Problem.status, func.count()).group_by(Problem.status))
        ).all()
        by_status = {status: 0 for status in ProblemStatus}
        by_status.update({status: count for status, count in by_status_rows})

        top_rows = (
            await self.db.execute(
                select(Category.id, Category.name, Category.icon, func.count(Problem.id))
                .join(Problem, Problem.category_id == Category.id)
                .group_by(Category.id)
                .order_by(func.count(Problem.id).desc())
                .limit(5)
            )
        ).all()

        week_ago = datetime.now(UTC) - timedelta(days=7)
        return StatsSummary(
            problems_total=await scalar(select(func.count(Problem.id))),
            problems_observable=await scalar(
                select(func.count(Problem.id)).where(Problem.is_observable.is_(True))
            ),
            problems_by_status=by_status,
            reports_total=await scalar(select(func.count(ProblemReport.id))),
            reports_last_7_days=await scalar(
                select(func.count(ProblemReport.id)).where(ProblemReport.reported_at >= week_ago)
            ),
            pending_categories=await scalar(
                select(func.count(Category.id)).where(Category.status == CategoryStatus.PENDING)
            ),
            top_categories=[
                CategoryStats(category_id=cid, name=name, icon=icon, problems_count=count)
                for cid, name, icon, count in top_rows
            ],
        )
