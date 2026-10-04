import type { Viewport } from '@/components/roady/map';
import type { LatLng } from '@/lib/format';

// Clustering itself is done natively by Mapbox (see components/roady/problem-layer.tsx);
// these helpers decide which area of problems to fetch and what is on screen.

export type Bounds = {
  min_lat: number;
  max_lat: number;
  min_lng: number;
  max_lng: number;
};

/** Half-size of the fetched neighbourhood (~15 km) and the grid it snaps to. */
const AREA_HALF_DEG = 0.15;
const AREA_GRID_DEG = 0.1;

/**
 * The neighbourhood fetched around a point, snapped to a 0.1° grid so small moves
 * (or the first GPS fix near the fallback position) keep the same query.
 */
export function areaAround(p: LatLng): Bounds {
  const lat = Math.round(p.latitude / AREA_GRID_DEG) * AREA_GRID_DEG;
  const lng = Math.round(p.longitude / AREA_GRID_DEG) * AREA_GRID_DEG;
  return {
    min_lat: lat - AREA_HALF_DEG,
    max_lat: lat + AREA_HALF_DEG,
    min_lng: lng - AREA_HALF_DEG,
    max_lng: lng + AREA_HALF_DEG,
  };
}

/** Whether a point lies inside the bounds, optionally shrunk by `inset` degrees. */
export function isInside(b: Bounds, p: LatLng, inset = 0): boolean {
  return (
    p.latitude >= b.min_lat + inset &&
    p.latitude <= b.max_lat - inset &&
    p.longitude >= b.min_lng + inset &&
    p.longitude <= b.max_lng - inset
  );
}

/** Exact bounds of the visible map. */
export function viewportBounds(v: Viewport): Bounds {
  return {
    min_lat: v.latitude - v.latitudeDelta / 2,
    max_lat: v.latitude + v.latitudeDelta / 2,
    min_lng: v.longitude - v.longitudeDelta / 2,
    max_lng: v.longitude + v.longitudeDelta / 2,
  };
}
