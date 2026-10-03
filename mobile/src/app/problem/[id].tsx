import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  ArrowLeftIcon,
  CheckCircleIcon,
  FlagIcon,
  ShareNetworkIcon,
  SparkleIcon,
} from 'phosphor-react-native';
import { Camera, MarkerView } from '@rnmapbox/maps';
import { ScrollView, Share, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { ProblemReport } from '@/api/types';
import { ErrorState } from '@/components/error-state';
import { Loading } from '@/components/loading';
import { ActionBar } from '@/components/roady/action-bar';
import { ConfirmActions } from '@/components/roady/confirm-actions';
import { IconButton } from '@/components/roady/icon-button';
import { RoadyMap, toPosition } from '@/components/roady/map';
import { CategoryDisc } from '@/components/roady/markers';
import { Stars } from '@/components/roady/stars';
import { StatusPill } from '@/components/roady/status';
import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/theme';
import { useLocation } from '@/hooks/use-location';
import { usePlaceLabel } from '@/hooks/use-place-label';
import { useProblem } from '@/hooks/use-problems';
import { CategoryIcon } from '@/lib/category-icons';
import {
  ago,
  countLabel,
  distanceM,
  formatDate,
  formatDistance,
  problemTitle,
  SEVERITY_LABELS,
  severityOf,
  severityTier,
} from '@/lib/format';

const HERO_HEIGHT = 250;

function activityItem(report: ProblemReport, isFirst: boolean) {
  if (isFirst) return { icon: FlagIcon, text: 'Zgłoszenie utworzone' };
  if (report.is_observable) return { icon: CheckCircleIcon, text: 'Potwierdzone: nadal występuje' };
  return { icon: SparkleIcon, text: 'Zgłoszone: już naprawione' };
}

export default function ProblemDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { location } = useLocation();
  const { data: problem, isPending, isError, error, refetch } = useProblem(id);
  const place = usePlaceLabel(problem);

  if (isPending) return <Loading />;
  if (isError || !problem) {
    return (
      <ErrorState
        message={(error as Error)?.message ?? 'Nie znaleziono zgłoszenia'}
        onRetry={refetch}
      />
    );
  }

  const sev = severityOf(problem);
  const avg = problem.importance_level_average;
  const lastConfirm = problem.reports.find((r) => r.is_observable);
  const oldestId = problem.reports[problem.reports.length - 1]?.id;

  const share = () =>
    Share.share({
      message:
        `${problemTitle(problem)}${place.data ? ` – ${place.data}` : ''}: ${problem.description ?? ''}`.trim(),
    });

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.hero}>
          <RoadyMap
            style={StyleSheet.absoluteFill}
            scrollEnabled={false}
            zoomEnabled={false}
            logoEnabled={false}
            attributionPosition={{ bottom: 32, right: 8 }}
          >
            <Camera
              defaultSettings={{ centerCoordinate: toPosition(problem), zoomLevel: 16 }}
              animationMode="none"
            />
            <MarkerView coordinate={toPosition(problem)} anchor={{ x: 0.5, y: 0.5 }} allowOverlap>
              <CategoryDisc icon={problem.category.icon} tier={severityTier(sev)} size={50} />
            </MarkerView>
          </RoadyMap>
          <IconButton
            icon={ArrowLeftIcon}
            variant="floating"
            accessibilityLabel="Wróć"
            onPress={() => router.back()}
            style={[styles.heroBtn, { top: insets.top + 8, left: 14 }]}
          />
          <IconButton
            icon={ShareNetworkIcon}
            variant="floating"
            weight="duotone"
            accessibilityLabel="Udostępnij"
            onPress={share}
            style={[styles.heroBtn, { top: insets.top + 8, right: 14 }]}
          />
        </View>

        <View style={styles.body}>
          <View style={styles.kicker}>
            <CategoryIcon name={problem.category.icon} size={18} color={Colors.neutral700} />
            <ThemedText type="kicker">{problem.category.name}</ThemedText>
          </View>
          <ThemedText type="display" style={styles.title}>
            {problemTitle(problem)}
          </ThemedText>

          <View style={styles.badges}>
            <StatusPill status={problem.status} />
            {avg != null && (
              <View style={styles.sev}>
                <Stars value={avg} />
                <ThemedText type="small" themeColor="neutral800">
                  {SEVERITY_LABELS[sev]}
                </ThemedText>
              </View>
            )}
          </View>

          {problem.description && (
            <ThemedText type="bodyLarge" style={styles.desc}>
              {problem.description}
            </ThemedText>
          )}

          <View style={styles.grid}>
            <Meta label="Lokalizacja" value={place.data ?? '—'} />
            <Meta
              label="Odległość"
              value={`${formatDistance(distanceM(location, problem))} od Ciebie`}
            />
            <Meta label="Zgłoszone" value={formatDate(problem.first_reported_at)} />
            <Meta
              label="Ostatnio potwierdzone"
              value={lastConfirm ? ago(lastConfirm.reported_at) : '—'}
            />
          </View>

          <ThemedText type="heading" style={styles.sectionTitle}>
            Aktywność społeczności
          </ThemedText>
          <ThemedText type="small" themeColor="neutral700">
            {countLabel(problem.reports_count, 'zgłoszenie', 'zgłoszenia', 'zgłoszeń')} społeczności
            ·{' '}
            {countLabel(
              problem.confirmations_count,
              'potwierdzenie',
              'potwierdzenia',
              'potwierdzeń',
            )}
          </ThemedText>
          <View style={styles.activity}>
            {problem.reports.slice(0, 8).map((r) => {
              const item = activityItem(r, r.id === oldestId);
              const ItemIcon = item.icon;
              return (
                <View key={r.id} style={styles.activityRow}>
                  <View style={styles.activityIcon}>
                    <ItemIcon size={20} color={Colors.neutral800} />
                  </View>
                  <View style={styles.activityText}>
                    <ThemedText type="body" style={{ fontSize: 15 }}>
                      {item.text}
                    </ThemedText>
                    <ThemedText type="caption">
                      {r.source === 'voice' ? 'Głosowo' : 'Anonimowo'} · {ago(r.reported_at)}
                    </ThemedText>
                  </View>
                </View>
              );
            })}
          </View>
        </View>
      </ScrollView>

      <ActionBar>
        <ConfirmActions problemId={problem.id} variant="details" />
      </ActionBar>
    </View>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.metaCell}>
      <ThemedText type="caption">{label}</ThemedText>
      <ThemedText type="small" style={{ marginTop: 2 }}>
        {value}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.bg },
  hero: { height: HERO_HEIGHT, backgroundColor: Colors.neutral200 },
  heroBtn: { position: 'absolute' },
  body: {
    marginTop: -24,
    backgroundColor: Colors.bg,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 24,
    paddingHorizontal: 22,
  },
  kicker: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  title: { marginTop: 8 },
  badges: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 10, marginTop: 14 },
  sev: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  desc: { marginTop: 18 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', rowGap: 14, marginTop: 24 },
  metaCell: { width: '50%', paddingRight: 16 },
  sectionTitle: { marginTop: 30 },
  activity: { gap: 14, marginTop: 14 },
  activityRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  activityIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.neutral200,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activityText: { flex: 1, minWidth: 0 },
});
