import Mapbox, { MapView, type MapState } from '@rnmapbox/maps';
import type { ComponentProps } from 'react';

import mapStyle from '@/components/roady/map-style.json';
import { env } from '@/lib/env';

/**
 * Mapbox "light-v11" recolored to the app palette (white-grey ground, turquoise-tinted
 * water and greens, grey labels in Montserrat) so the markers carry the color.
 * Regenerate with `node scripts/build-map-style.mjs` after palette changes.
 */
const MAP_STYLE_JSON = JSON.stringify(mapStyle);

/** Call once at startup, before the first map renders. */
export function initMapbox() {
  if (env.mapboxToken) Mapbox.setAccessToken(env.mapboxToken);
}

/** Visible map area, in the shape the clustering and bbox helpers expect. */
export type Viewport = {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
};

export function viewportFromState(state: MapState): Viewport {
  const [neLng, neLat] = state.properties.bounds.ne;
  const [swLng, swLat] = state.properties.bounds.sw;
  return {
    latitude: (neLat + swLat) / 2,
    longitude: (neLng + swLng) / 2,
    latitudeDelta: Math.abs(neLat - swLat),
    longitudeDelta: Math.abs(neLng - swLng),
  };
}

/** Mapbox expects `[longitude, latitude]`. */
export function toPosition(p: { latitude: number; longitude: number }): [number, number] {
  return [p.longitude, p.latitude];
}

/** MapView with the Roady style and the chrome the design hides (compass, scale bar). */
export function RoadyMap(props: ComponentProps<typeof MapView>) {
  return (
    <MapView
      styleJSON={MAP_STYLE_JSON}
      compassEnabled={false}
      scaleBarEnabled={false}
      pitchEnabled={false}
      rotateEnabled={false}
      {...props}
    />
  );
}
