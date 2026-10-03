import {
  CrosshairSimpleIcon,
  MagnifyingGlassIcon,
  MapPinIcon,
  PlusCircleIcon,
  SlidersHorizontalIcon,
} from 'phosphor-react-native';
import { Camera, CustomLocationProvider, LocationPuck } from '@rnmapbox/maps';
import { useEffect, useEffectEvent, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  DEFAULT_FILTERS,
  FiltersSheet,
  filtersActive,
  passesRecency,
  type MapFilters,
} from '@/components/roady/filters-sheet';
import { IconButton } from '@/components/roady/icon-button';
import { InlineError } from '@/components/roady/inline-error';
import { RoadyMap, toPosition, viewportFromState, type Viewport } from '@/components/roady/map';
import { ClusterMapMarker, ProblemMapMarker } from '@/components/roady/map-markers';
import { ProblemPreview } from '@/components/roady/problem-preview';
import { Toast } from '@/components/roady/toast';
import { ThemedText } from '@/components/themed-text';
import { Colors, Fonts, Shadows } from '@/constants/theme';
import { useReportDraft } from '@/context/report-draft';
import { useOpenReportSheet } from '@/context/report-sheet';
import { useLocation } from '@/hooks/use-location';
import { useProblems } from '@/hooks/use-problems';
import { clusterProblems, regionToBbox, type Cluster } from '@/lib/cluster';
import { countLabel } from '@/lib/format';

/** Roughly a district: what the first bbox query covers before the map reports its bounds. */
const CITY_DELTA = 0.03;
const CITY_ZOOM = 13.5;
const STREET_ZOOM = 15.5;

export default function MapScreen() {
  const insets = useSafeAreaInsets();
  const cameraRef = useRef<Camera>(null);
  const openReportSheet = useOpenReportSheet();
  const { location, hasFix, label } = useLocation();
  const { published, setPublished } = useReportDraft();

  const [region, setRegion] = useState<Viewport>({
    ...location,
    latitudeDelta: CITY_DELTA,
    longitudeDelta: CITY_DELTA,
  });
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filters, setFilters] = useState<MapFilters>(DEFAULT_FILTERS);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const [toast, setToast] = useState<string | null>(null);

  const problems = useProblems({
    ...regionToBbox(region),
    category_ids: filters.categoryIds.length ? filters.categoryIds : undefined,
    min_importance: filters.minSeverity > 1 ? filters.minSeverity : undefined,
    q: query || undefined,
  });

  const visible = useMemo(
    () =>
      (problems.data?.items ?? []).filter((p) =>
        passesRecency(p.last_reported_at, filters.recency),
      ),
    [problems.data, filters.recency],
  );
  const { singles, clusters } = useMemo(() => {
    const grouped = clusterProblems(visible, region);
    // Never fold the selected problem into a cluster.
    const sel = visible.find((p) => p.id === selectedId);
    if (!sel || grouped.singles.includes(sel)) return grouped;
    return {
      singles: [...grouped.singles, sel],
      clusters: grouped.clusters
        .map((c) => ({ ...c, members: c.members.filter((m) => m.id !== sel.id) }))
        .filter((c) => c.members.length > 1),
    };
  }, [visible, region, selectedId]);
  const selected = visible.find((p) => p.id === selectedId) ?? null;

  const flyTo = (point: { latitude: number; longitude: number }, zoomLevel: number) =>
    cameraRef.current?.setCamera({
      centerCoordinate: toPosition(point),
      zoomLevel,
      animationMode: 'flyTo',
      animationDuration: 800,
    });

  // Centre on the user once, when the first GPS fix arrives (later fixes only move the dot).
  const centerOnUser = useEffectEvent(() => flyTo(location, CITY_ZOOM));
  useEffect(() => {
    if (hasFix) centerOnUser();
  }, [hasFix]);

  // After publishing: select the new marker and show a toast...
  const [handled, setHandled] = useState(published);
  if (published && published !== handled) {
    setHandled(published);
    setSelectedId(published.problemId);
    setToast(
      published.attached ? 'Dołączono do istniejącego zgłoszenia' : 'Zgłoszenie opublikowane',
    );
  }
  // ...then fly to it and let the toast fade.
  useEffect(() => {
    if (!handled) return;
    cameraRef.current?.setCamera({
      centerCoordinate: toPosition(handled.location),
      zoomLevel: STREET_ZOOM,
      animationMode: 'flyTo',
      animationDuration: 800,
    });
    const t = setTimeout(() => {
      setToast(null);
      setPublished(null);
    }, 3200);
    return () => clearTimeout(t);
  }, [handled, setPublished]);

  const zoomToCluster = (cluster: Cluster) => {
    setSelectedId(null);
    const lats = cluster.members.map((m) => m.latitude);
    const lngs = cluster.members.map((m) => m.longitude);
    cameraRef.current?.fitBounds(
      [Math.max(...lngs), Math.max(...lats)],
      [Math.min(...lngs), Math.min(...lats)],
      [insets.top + 160, 80, 220, 80],
      600,
    );
  };

  const recenter = () => flyTo(location, STREET_ZOOM);

  return (
    <View style={styles.container}>
      <RoadyMap
        style={StyleSheet.absoluteFill}
        onMapIdle={(state) => setRegion(viewportFromState(state))}
        onPress={() => setSelectedId(null)}
        logoPosition={{ bottom: 8, left: 8 }}
        attributionPosition={{ bottom: 8, left: 96 }}
      >
        <Camera
          ref={cameraRef}
          defaultSettings={{ centerCoordinate: toPosition(location), zoomLevel: CITY_ZOOM }}
        />
        {/* The dot shows our own expo-location fix, the same one used for the address and reports. */}
        {hasFix && <CustomLocationProvider coordinate={toPosition(location)} heading={0} />}
        {hasFix && <LocationPuck puckBearingEnabled={false} />}
        {clusters.map((c) => (
          <ClusterMapMarker key={`c-${c.id}`} cluster={c} onPress={() => zoomToCluster(c)} />
        ))}
        {singles.map((p) => (
          <ProblemMapMarker
            key={p.id}
            problem={p}
            selected={p.id === selectedId}
            onPress={() => setSelectedId(p.id)}
          />
        ))}
      </RoadyMap>

      <View style={[styles.search, { top: insets.top + 10 }]}>
        <MagnifyingGlassIcon size={22} color={Colors.neutral700} />
        <TextInput
          style={styles.searchInput}
          placeholder="Szukaj w zgłoszeniach"
          placeholderTextColor={Colors.neutral600}
          value={search}
          onChangeText={(t) => {
            setSearch(t);
            if (!t) setQuery('');
          }}
          onSubmitEditing={() => setQuery(search.trim())}
          returnKeyType="search"
        />
        <Pressable
          onPress={() => setFiltersOpen(true)}
          accessibilityRole="button"
          accessibilityLabel="Filtry"
          style={({ pressed }) => [
            styles.filterBtn,
            pressed && { backgroundColor: Colors.neutral300 },
          ]}
        >
          <SlidersHorizontalIcon size={22} />
          {filtersActive(filters) && <View style={styles.filterDot} />}
        </Pressable>
      </View>

      <View style={[styles.area, { top: insets.top + 76 }]}>
        <MapPinIcon size={15} color={Colors.accent700} />
        <ThemedText type="caption" themeColor="neutral800">
          {label ?? 'Twoja okolica'} ·{' '}
          {countLabel(visible.length, 'zgłoszenie', 'zgłoszenia', 'zgłoszeń')}
        </ThemedText>
      </View>

      {problems.isError && (
        <InlineError
          variant="floating"
          message={problems.error.message}
          onRetry={() => problems.refetch()}
          style={[styles.error, { top: insets.top + 114 }]}
        />
      )}

      {toast && <Toast message={toast} top={insets.top + 76} />}

      {selected ? (
        <ProblemPreview problem={selected} onClose={() => setSelectedId(null)} bottom={8} />
      ) : (
        <>
          <IconButton
            icon={CrosshairSimpleIcon}
            variant="floating"
            size={50}
            weight="duotone"
            color={Colors.accent700}
            accessibilityLabel="Moja lokalizacja"
            onPress={recenter}
            style={styles.locate}
          />
          <Pressable
            onPress={openReportSheet}
            accessibilityRole="button"
            style={({ pressed }) => [styles.fab, pressed && { backgroundColor: Colors.accent700 }]}
          >
            <PlusCircleIcon size={26} color={Colors.neutral100} />
            <ThemedText type="button" style={styles.fabText}>
              Zgłoś problem
            </ThemedText>
          </Pressable>
        </>
      )}

      <FiltersSheet
        visible={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        filters={filters}
        onChange={setFilters}
        resultCount={visible.length}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.neutral200 },
  search: {
    position: 'absolute',
    left: 14,
    right: 14,
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingLeft: 16,
    paddingRight: 6,
    borderRadius: 18,
    backgroundColor: Colors.neutral100,
    ...Shadows.md,
  },
  searchInput: {
    flex: 1,
    minWidth: 0,
    height: 44,
    fontFamily: Fonts.regular,
    fontSize: 16,
    color: Colors.text,
  },
  filterBtn: {
    width: 44,
    height: 44,
    borderRadius: 13,
    backgroundColor: Colors.neutral200,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterDot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.accent,
    borderWidth: 2,
    borderColor: Colors.neutral200,
  },
  area: {
    position: 'absolute',
    left: 14,
    height: 30,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    borderRadius: 15,
    backgroundColor: Colors.neutral100,
    ...Shadows.sm,
  },
  error: { position: 'absolute', left: 14, right: 14 },
  locate: { position: 'absolute', right: 16, bottom: 86 },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 14,
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingLeft: 18,
    paddingRight: 24,
    borderRadius: 30,
    backgroundColor: Colors.accent,
    ...Shadows.lg,
  },
  fabText: { color: Colors.neutral100, fontSize: 17 },
});
