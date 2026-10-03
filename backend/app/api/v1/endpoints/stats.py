from fastapi import APIRouter

from app.api.deps import DbSession
from app.schemas.stats import StatsSummary
from app.services.stats_service import StatsService

router = APIRouter(prefix="/stats", tags=["stats"])


@router.get("/summary", response_model=StatsSummary, summary="Dashboard summary")
async def summary(db: DbSession) -> StatsSummary:
    return await StatsService(db).summary()
