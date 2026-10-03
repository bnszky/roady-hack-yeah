from fastapi import APIRouter

from app.api.deps import DbSession
from app.schemas.route import RouteProblemsRequest, RouteProblemsResponse
from app.services.routing_service import RoutingService

router = APIRouter(prefix="/routes", tags=["routes"])


@router.post(
    "/problems", response_model=RouteProblemsResponse, summary="Problems along a walking route"
)
async def problems_on_route(data: RouteProblemsRequest, db: DbSession) -> RouteProblemsResponse:
    """Computes a walking route A -> B (OSRM) and returns problems within `buffer_m` of it."""
    return await RoutingService(db).problems_on_route(data)
