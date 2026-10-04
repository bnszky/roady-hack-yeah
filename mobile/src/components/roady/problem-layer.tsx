import { CircleLayer, Image, Images, ShapeSource, SymbolLayer, type Camera } from '@rnmapbox/maps';
import { useMemo, useRef, type ComponentProps, type ReactNode, type RefObject } from 'react';
import { StyleSheet, View } from 'react-native';

import type { Problem } from '@/api/types';
import { toPosition } from '@/components/roady/map';
import { ProblemMarker } from '@/components/roady/markers';
import { Colors } from '@/constants/theme';
import { severityOf, severityTier, type Severity } from '@/lib/format';

// Markers are drawn by Mapbox itself (GPU symbols + native clustering) rather than as
// React Native views, so they follow zoom and pan instantly. Our existing marker views
// are rendered once into map images and reused by every feature that needs them.

const CLUSTER_IMAGE = 'roady-cluster';

type OnPressEvent = Parameters<NonNullable<ComponentProps<typeof ShapeSource>['onPress']>>[0];

/** Image key per look: category icon + severity tier (+ the badge number for 4-5). */
function imageKey(icon: string, tier: Severity, sev: number) {
  return tier === 'high' ? `${icon}-high${sev}` : `${icon}-${tier}`;
}

type Look = { key: string; icon: string; tier: Severity; sev: number };

/**
 * A map Image must have exactly one native child. Fabric flattens layout-only views
 * (like the marker's sizing box), which would hand it several, so pin one view in place.
 * It must also hug its content: a full-width root would make the image screen-wide and
 * shift the drawn marker away from its point.
 */
function ImageRoot({ children }: { children: ReactNode }) {
  return (
    <View collapsable={false} style={styles.imageRoot}>
      {children}
    </View>
  );
}

/** The ink disc without its count: the number is drawn by the layer as text. */
function ClusterDisc() {
  return (
    <View style={styles.clusterHalo}>
      <View style={styles.cluster} />
    </View>
  );
}

type Props = {
  problems: Problem[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  /** Called on any tap that hit a marker or cluster (the map gets the same tap too). */
  onFeaturePress?: () => void;
  cameraRef: RefObject<Camera | null>;
};

export function ProblemLayer({ problems, selectedId, onSelect, onFeaturePress, cameraRef }: Props) {
  const sourceRef = useRef<ShapeSource>(null);

  const { shape, looks } = useMemo(() => {
    const byKey = new Map<string, Look>();
    const features = problems.map((p) => {
      const sev = severityOf(p);
      const tier = severityTier(sev);
      const key = imageKey(p.category.icon, tier, sev);
      if (!byKey.has(key)) byKey.set(key, { key, icon: p.category.icon, tier, sev });
      return {
        type: 'Feature' as const,
        id: p.id,
        geometry: { type: 'Point' as const, coordinates: toPosition(p) },
        properties: { id: p.id, image: key, sev },
      };
    });
    return {
      shape: { type: 'FeatureCollection' as const, features },
      looks: [...byKey.values()],
    };
  }, [problems]);

  const onPress = async (e: OnPressEvent) => {
    const feature = e.features[0];
    if (!feature) return;
    onFeaturePress?.();
    if (feature.properties?.cluster) {
      const zoom = await sourceRef.current?.getClusterExpansionZoom(feature);
      if (zoom == null || feature.geometry.type !== 'Point') return;
      cameraRef.current?.setCamera({
        centerCoordinate: feature.geometry.coordinates,
        zoomLevel: zoom + 0.5,
        animationMode: 'easeTo',
        animationDuration: 450,
      });
      return;
    }
    const id = feature.properties?.id;
    if (typeof id === 'string') onSelect(id);
  };

  return (
    <>
      <Images>
        <Image name={CLUSTER_IMAGE}>
          <ImageRoot>
            <ClusterDisc />
          </ImageRoot>
        </Image>
        {looks.map((look) => (
          <Image key={look.key} name={look.key}>
            <ImageRoot>
              <ProblemMarker icon={look.icon} tier={look.tier} severity={look.sev} />
            </ImageRoot>
          </Image>
        ))}
      </Images>

      <ShapeSource
        id="problems"
        ref={sourceRef}
        shape={shape}
        cluster
        clusterRadius={50}
        clusterMaxZoomLevel={15}
        onPress={onPress}
        hitbox={{ width: 44, height: 44 }}
      >
        {/* Selection ring under the selected marker (same look as before). */}
        <CircleLayer
          id="problem-selection"
          filter={['==', ['get', 'id'], selectedId ?? '']}
          style={{
            circleRadius: 26,
            circleColor: 'rgba(14, 21, 20, 0.1)',
            circleStrokeWidth: 2.5,
            circleStrokeColor: Colors.text,
          }}
        />
        <SymbolLayer
          id="problem-clusters"
          filter={['has', 'point_count']}
          style={{
            iconImage: CLUSTER_IMAGE,
            iconAllowOverlap: true,
            textField: ['get', 'point_count_abbreviated'],
            // Mapbox-hosted glyphs (the app font, see scripts/build-map-style.mjs).
            textFont: ['Montserrat SemiBold', 'Arial Unicode MS Bold'],
            textSize: 16,
            textColor: Colors.neutral100,
            textAllowOverlap: true,
            textIgnorePlacement: true,
          }}
        />
        <SymbolLayer
          id="problem-markers"
          filter={['!', ['has', 'point_count']]}
          style={{
            iconImage: ['get', 'image'],
            iconAllowOverlap: true,
            iconIgnorePlacement: true,
            symbolSortKey: ['get', 'sev'],
          }}
        />
      </ShapeSource>
    </>
  );
}

const styles = StyleSheet.create({
  imageRoot: { alignSelf: 'flex-start' },
  clusterHalo: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: 'rgba(14, 21, 20, 0.14)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cluster: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.text,
    borderWidth: 2,
    borderColor: Colors.neutral100,
  },
});
