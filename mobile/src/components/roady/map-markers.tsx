import { MarkerView } from '@rnmapbox/maps';
import { Pressable } from 'react-native';

import type { Problem } from '@/api/types';
import { toPosition } from '@/components/roady/map';
import { ClusterMarker, ProblemMarker } from '@/components/roady/markers';
import type { Cluster } from '@/lib/cluster';
import { severityOf, severityTier } from '@/lib/format';

// MarkerView renders plain React Native views over the map, so the SVG icons and
// selection ring update live (no bitmap snapshots as with Google Maps markers).

export function ProblemMapMarker({
  problem,
  selected,
  onPress,
}: {
  problem: Problem;
  selected: boolean;
  onPress: () => void;
}) {
  const sev = severityOf(problem);
  return (
    <MarkerView coordinate={toPosition(problem)} anchor={{ x: 0.5, y: 0.5 }} allowOverlap>
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={`${problem.category.name}, ważność ${sev || 'brak'} na 5`}
      >
        <ProblemMarker
          icon={problem.category.icon}
          tier={severityTier(sev)}
          severity={sev}
          selected={selected}
        />
      </Pressable>
    </MarkerView>
  );
}

export function ClusterMapMarker({ cluster, onPress }: { cluster: Cluster; onPress: () => void }) {
  return (
    <MarkerView coordinate={toPosition(cluster)} anchor={{ x: 0.5, y: 0.5 }} allowOverlap>
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={`${cluster.members.length} zgłoszenia w pobliżu, powiększ`}
      >
        <ClusterMarker count={cluster.members.length} />
      </Pressable>
    </MarkerView>
  );
}
