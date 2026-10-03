import { useQuery } from '@tanstack/react-query';

import { reverseGeocode } from '@/hooks/use-location';
import type { LatLng } from '@/lib/format';

/** Street name for a coordinate, cached per ~10 m. Problems have no address field. */
export function usePlaceLabel(point: LatLng | null | undefined) {
  const key = point ? [point.latitude.toFixed(4), point.longitude.toFixed(4)] : [];
  return useQuery({
    queryKey: ['place-label', ...key],
    queryFn: () => reverseGeocode(point!),
    enabled: !!point,
    staleTime: Infinity,
  });
}
