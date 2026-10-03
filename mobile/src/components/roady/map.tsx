import Mapbox, { MapView, type MapState } from '@rnmapbox/maps';
import type { ComponentProps } from 'react';

import { env } from '@/lib/env';

/** Muted, paper-like basemap so the markers carry the color. */
export const MAP_STYLE = 'mapbox://styles/mapbox/light-v11';

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
      styleURL={MAP_STYLE}
      compassEnabled={false}
      scaleBarEnabled={false}
      pitchEnabled={false}
      rotateEnabled={false}
      {...props}
    />
  );
}
