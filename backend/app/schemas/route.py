from pydantic import BaseModel, Field

from app.schemas.common import LatLng
from app.schemas.problem import ProblemFilters, ProblemRead


class RouteProblemsRequest(BaseModel):
    start: LatLng
    end: LatLng
    buffer_m: float | None = Field(
        default=None, ge=1, le=500, description="Max distance from the route; defaults to settings"
    )
    filters: ProblemFilters = Field(default_factory=lambda: ProblemFilters(is_observable=True))


class RouteProblem(ProblemRead):
    distance_from_route_m: float
    distance_along_route_m: float = Field(description="How far from the start along the route")


class RouteProblemsResponse(BaseModel):
    distance_m: float
    duration_s: float
    geometry: list[LatLng] = Field(description="Route polyline")
    problems: list[RouteProblem] = Field(description="Sorted by distance along the route")
