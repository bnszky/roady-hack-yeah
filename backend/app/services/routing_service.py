import httpx
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.exceptions import ExternalServiceError, ValidationError
from app.core.geo import LatLngTuple, bbox_of_line, distance_to_polyline
from app.schemas.common import LatLng
from app.schemas.problem import ProblemRead
from app.schemas.route import RouteProblem, RouteProblemsRequest, RouteProblemsResponse
from app.services.problem_service import ProblemService


class RoutingService:
    def __init__(self, db: AsyncSession):
        self.problems = ProblemService(db)

    async def fetch_route(
        self, start: LatLng, end: LatLng
    ) -> tuple[list[LatLngTuple], float, float]:
        """Return (polyline as (lat, lng) list, distance_m, duration_s) from OSRM."""
        coords = f"{start.longitude},{start.latitude};{end.longitude},{end.latitude}"
        url = f"{settings.osrm_base_url.rstrip('/')}/route/v1/{settings.osrm_profile}/{coords}"
        params = {"overview": "full", "geometries": "geojson"}
        try:
            async with httpx.AsyncClient(timeout=settings.osrm_timeout_s) as client:
                response = await client.get(url, params=params)
        except httpx.HTTPError as exc:
            raise ExternalServiceError(f"Routing service unavailable: {exc}") from exc

        payload = response.json() if response.content else {}
        code = payload.get("code")
        if code in ("NoRoute", "NoSegment"):
            raise ValidationError("No route found between the given points")
        if response.status_code != 200 or code != "Ok" or not payload.get("routes"):
            raise ExternalServiceError(f"Routing service error: {payload.get('message', code)}")

        route = payload["routes"][0]
        line = [(lat, lng) for lng, lat in route["geometry"]["coordinates"]]
        return line, float(route["distance"]), float(route["duration"])

    async def problems_on_route(self, data: RouteProblemsRequest) -> RouteProblemsResponse:
        buffer_m = data.buffer_m or settings.route_default_buffer_m
        line, distance_m, duration_s = await self.fetch_route(data.start, data.end)

        candidates = await self.problems.list_in_bbox(bbox_of_line(line, buffer_m), data.filters)
        on_route: list[RouteProblem] = []
        for problem in candidates:
            dist, along = distance_to_polyline((problem.latitude, problem.longitude), line)
            if dist <= buffer_m:
                on_route.append(
                    RouteProblem(
                        **ProblemRead.model_validate(problem).model_dump(),
                        distance_from_route_m=round(dist, 1),
                        distance_along_route_m=round(along, 1),
                    )
                )
        on_route.sort(key=lambda p: p.distance_along_route_m)

        return RouteProblemsResponse(
            distance_m=distance_m,
            duration_s=duration_s,
            geometry=[LatLng(latitude=lat, longitude=lng) for lat, lng in line],
            problems=on_route,
        )
