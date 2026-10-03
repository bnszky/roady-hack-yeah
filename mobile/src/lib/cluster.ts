import type { Problem } from '@/api/types';
import type { Viewport } from '@/components/roady/map';

export type Cluster = {
  id: string;
  latitude: number;
  longitude: number;
  members: Problem[];
};

/** Grid cells across the visible width; problems sharing a cell collapse into a cluster. */
const CELLS_ACROSS = 7;

/**
 * Cheap client-side grid clustering: good enough for the few hundred problems a
 * bbox query returns. Returns single problems and clusters (2+ members) separately.
 */
export function clusterProblems(
  problems: Problem[],
  region: Viewport,
): { singles: Problem[]; clusters: Cluster[] } {
  const cellLng = region.longitudeDelta / CELLS_ACROSS;
  const cellLat = cellLng; // roughly square cells, good enough at city scale
  const cells = new Map<string, Problem[]>();

  for (const p of problems) {
    const key = `${Math.floor(p.longitude / cellLng)}:${Math.floor(p.latitude / cellLat)}`;
    const cell = cells.get(key);
    if (cell) cell.push(p);
    else cells.set(key, [p]);
  }

  const singles: Problem[] = [];
  const clusters: Cluster[] = [];
  for (const [key, members] of cells) {
    if (members.length === 1) {
      singles.push(members[0]);
      continue;
    }
    clusters.push({
      id: key,
      latitude: members.reduce((s, m) => s + m.latitude, 0) / members.length,
      longitude: members.reduce((s, m) => s + m.longitude, 0) / members.length,
      members,
    });
  }
  return { singles, clusters };
}

export function regionToBbox(region: Viewport) {
  return {
    min_lat: region.latitude - region.latitudeDelta / 2,
    max_lat: region.latitude + region.latitudeDelta / 2,
    min_lng: region.longitude - region.longitudeDelta / 2,
    max_lng: region.longitude + region.longitudeDelta / 2,
  };
}
