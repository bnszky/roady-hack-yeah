import * as Location from 'expo-location';
import { useEffect, useState } from 'react';

import type { LatLng } from '@/lib/format';

/** Kraków city centre: where the backend seed puts demo problems. */
export const FALLBACK_LOCATION: LatLng = { latitude: 50.0647, longitude: 19.945 };

type State = {
  location: LatLng;
  /** false while waiting for the first fix, or when permission was denied. */
  hasFix: boolean;
  label: string | null;
};

let cached: State | null = null;
// Shared by every hook instance so the permission prompt and GPS fix happen once.
let pending: Promise<State | null> | null = null;

async function locate(): Promise<State | null> {
  const { granted } = await Location.requestForegroundPermissionsAsync();
  if (!granted) return null;
  const pos =
    (await Location.getLastKnownPositionAsync()) ??
    (await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }));
  const location = { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
  cached = { location, hasFix: true, label: await reverseGeocode(location) };
  return cached;
}

/** Current position (one fix per app session) plus a short street label for the UI. */
export function useLocation() {
  const [state, setState] = useState<State>(
    cached ?? { location: FALLBACK_LOCATION, hasFix: false, label: null },
  );

  useEffect(() => {
    if (cached) return;
    let alive = true;
    pending ??= locate().catch(() => null);
    pending.then((next) => {
      if (alive && next) setState(next);
    });
    return () => {
      alive = false;
    };
  }, []);

  return state;
}

export async function reverseGeocode(point: LatLng): Promise<string | null> {
  try {
    const [address] = await Location.reverseGeocodeAsync(point);
    if (!address) return null;
    if (address.street) {
      return address.streetNumber ? `${address.street} ${address.streetNumber}` : address.street;
    }
    return address.name ?? address.district ?? address.city ?? null;
  } catch {
    return null;
  }
}
