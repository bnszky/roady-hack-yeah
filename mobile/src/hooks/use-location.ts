import * as Location from 'expo-location';
import { useSyncExternalStore } from 'react';

import { distanceM, type LatLng } from '@/lib/format';

/** Kraków city centre: where the backend seed puts demo problems. */
export const FALLBACK_LOCATION: LatLng = { latitude: 50.0647, longitude: 19.945 };

type State = {
  location: LatLng;
  /** false while waiting for the first fix, or when permission was denied. */
  hasFix: boolean;
  /** Horizontal accuracy of the current fix in meters (Infinity without one). */
  accuracy: number;
  label: string | null;
};

/** A cached last-known fix is only trusted when it is this fresh and this accurate. */
const LAST_KNOWN_MAX_AGE_MS = 2 * 60_000;
const LAST_KNOWN_MAX_ACCURACY_M = 100;
/** Once we have a decent fix, ignore readings this much worse (indoor cell jumps). */
const MAX_ACCURACY_M = 150;
/** Re-geocode the street label only after moving this far. */
const RELABEL_DISTANCE_M = 50;

// One app-wide location store: the map's dot, the address label, "Moja lokalizacja"
// and new reports all read the same fix, so they can never disagree.
let state: State = { location: FALLBACK_LOCATION, hasFix: false, accuracy: Infinity, label: null };
let labeledAt: LatLng | null = null;
let started = false;
const listeners = new Set<() => void>();

function emit(next: State) {
  state = next;
  listeners.forEach((l) => l());
}

async function relabel(point: LatLng) {
  if (labeledAt && distanceM(labeledAt, point) < RELABEL_DISTANCE_M) return;
  labeledAt = point;
  const label = await reverseGeocode(point);
  if (label) emit({ ...state, label });
}

function accept(pos: Location.LocationObject) {
  const accuracy = pos.coords.accuracy ?? MAX_ACCURACY_M;
  if (state.hasFix && accuracy > MAX_ACCURACY_M && accuracy > state.accuracy) return;
  const location = { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
  emit({ ...state, location, hasFix: true, accuracy });
  relabel(location);
}

async function start() {
  const { granted } = await Location.requestForegroundPermissionsAsync();
  if (!granted) return;

  const last = await Location.getLastKnownPositionAsync({
    maxAge: LAST_KNOWN_MAX_AGE_MS,
    requiredAccuracy: LAST_KNOWN_MAX_ACCURACY_M,
  });
  if (last) accept(last);

  await Location.watchPositionAsync(
    { accuracy: Location.Accuracy.High, distanceInterval: 10, timeInterval: 5000 },
    accept,
  );
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  if (!started) {
    started = true;
    start().catch(() => {
      started = false;
    });
  }
  return () => {
    listeners.delete(listener);
  };
}

/** Live position (GPS watch shared by the whole app) plus a short street label. */
export function useLocation(): State {
  return useSyncExternalStore(subscribe, () => state);
}

/** Current fix without subscribing (e.g. when starting a report). */
export function getCurrentLocation(): State {
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
