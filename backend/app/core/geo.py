import math
from collections.abc import Sequence

from sqlalchemy import ColumnElement, func

EARTH_RADIUS_M = 6_371_008.8
METERS_PER_DEG_LAT = 111_320.0

LatLngTuple = tuple[float, float]


def haversine_m(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    p1, p2 = math.radians(lat1), math.radians(lat2)
    dp = p2 - p1
    dl = math.radians(lng2 - lng1)
    a = math.sin(dp / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dl / 2) ** 2
    return 2 * EARTH_RADIUS_M * math.asin(min(1.0, math.sqrt(a)))


def haversine_sql(
    lat_col: ColumnElement[float], lng_col: ColumnElement[float], lat: float, lng: float
) -> ColumnElement[float]:
    """Great-circle distance in meters, evaluated in Postgres (no PostGIS needed)."""
    a = func.power(func.sin(func.radians(lat_col - lat) / 2), 2) + func.cos(
        math.radians(lat)
    ) * func.cos(func.radians(lat_col)) * func.power(func.sin(func.radians(lng_col - lng) / 2), 2)
    return 2 * EARTH_RADIUS_M * func.asin(func.least(1.0, func.sqrt(a)))


def bbox_around(lat: float, lng: float, radius_m: float) -> tuple[float, float, float, float]:
    """(min_lat, max_lat, min_lng, max_lng) of a box containing the circle - for index prefilter."""
    dlat = radius_m / METERS_PER_DEG_LAT
    dlng = radius_m / (METERS_PER_DEG_LAT * max(math.cos(math.radians(lat)), 1e-6))
    return lat - dlat, lat + dlat, lng - dlng, lng + dlng


def bbox_of_line(
    points: Sequence[LatLngTuple], buffer_m: float
) -> tuple[float, float, float, float]:
    lats = [p[0] for p in points]
    lngs = [p[1] for p in points]
    mid_lat = (min(lats) + max(lats)) / 2
    dlat = buffer_m / METERS_PER_DEG_LAT
    dlng = buffer_m / (METERS_PER_DEG_LAT * max(math.cos(math.radians(mid_lat)), 1e-6))
    return min(lats) - dlat, max(lats) + dlat, min(lngs) - dlng, max(lngs) + dlng


def distance_to_polyline(point: LatLngTuple, line: Sequence[LatLngTuple]) -> tuple[float, float]:
    """Return (distance from the line, distance along the line to the closest point), in meters.

    Uses a local equirectangular projection - accurate enough at city scale.
    """
    if not line:
        return math.inf, 0.0
    ref_lat = math.radians(point[0])
    kx = METERS_PER_DEG_LAT * math.cos(ref_lat)
    ky = METERS_PER_DEG_LAT

    def project(p: LatLngTuple) -> tuple[float, float]:
        return (p[1] - point[1]) * kx, (p[0] - point[0]) * ky

    if len(line) == 1:
        x, y = project(line[0])
        return math.hypot(x, y), 0.0

    best_dist = math.inf
    best_along = 0.0
    walked = 0.0
    ax, ay = project(line[0])
    for nxt in line[1:]:
        bx, by = project(nxt)
        sx, sy = bx - ax, by - ay
        seg_len_sq = sx * sx + sy * sy
        t = 0.0 if seg_len_sq == 0 else max(0.0, min(1.0, -(ax * sx + ay * sy) / seg_len_sq))
        cx, cy = ax + t * sx, ay + t * sy
        dist = math.hypot(cx, cy)
        seg_len = math.sqrt(seg_len_sq)
        if dist < best_dist:
            best_dist = dist
            best_along = walked + t * seg_len
        walked += seg_len
        ax, ay = bx, by
    return best_dist, best_along
