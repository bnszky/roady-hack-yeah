import { useRouter } from 'expo-router';
import { ArrowRightIcon, ClockIcon, MapPinIcon, XIcon } from 'phosphor-react-native';
import { StyleSheet, View } from 'react-native';

import type { Problem } from '@/api/types';
import { Button } from '@/components/roady/button';
import { ConfirmActions } from '@/components/roady/confirm-actions';
import { IconButton } from '@/components/roady/icon-button';
import { CategoryDisc } from '@/components/roady/markers';
import { FloatingSheet, useSheetClose } from '@/components/roady/sheet';
import { Stars } from '@/components/roady/stars';
import { StatusLine } from '@/components/roady/status';
import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/theme';
import { useLocation } from '@/hooks/use-location';
import { usePlaceLabel } from '@/hooks/use-place-label';
import {
  ago,
  countLabel,
  distanceM,
  formatDistance,
  problemTitle,
  severityOf,
  severityTier,
} from '@/lib/format';

/** Inside the sheet so the X slides the card out like a swipe does. */
function CloseButton() {
  const close = useSheetClose();
  return (
    <IconButton
      icon={XIcon}
      size={44}
      color={Colors.neutral700}
      onPress={close}
      accessibilityLabel="Zamknij"
      style={styles.close}
    />
  );
}

type Props = {
  problem: Problem;
  onClose: () => void;
  bottom: number;
};

export function ProblemPreview({ problem, onClose, bottom }: Props) {
  const router = useRouter();
  const { location } = useLocation();
  const place = usePlaceLabel(problem);
  const sev = severityOf(problem);
  const avg = problem.importance_level_average;

  return (
    <FloatingSheet style={{ bottom }} onClose={onClose}>
      <View style={styles.head}>
        <CategoryDisc icon={problem.category.icon} tier={severityTier(sev)} />
        <View style={styles.headText}>
          <ThemedText type="kicker" style={styles.kicker} numberOfLines={1}>
            {problem.category.name} · {formatDistance(distanceM(location, problem))}
          </ThemedText>
          <ThemedText type="title" style={styles.title} numberOfLines={2}>
            {problem.description || problemTitle(problem)}
          </ThemedText>
          {avg != null && (
            <View style={styles.stars}>
              <Stars value={avg} />
              <ThemedText type="caption">{avg.toFixed(1).replace('.', ',')}/5</ThemedText>
            </View>
          )}
        </View>
        <CloseButton />
      </View>

      <View style={styles.rows}>
        <StatusLine status={problem.status} />
        <View style={styles.row}>
          <MapPinIcon size={20} color={Colors.neutral800} />
          <ThemedText type="body" themeColor="neutral800" style={styles.rowText} numberOfLines={1}>
            {place.data ?? 'Ustalam adres…'}
          </ThemedText>
        </View>
        <View style={styles.row}>
          <ClockIcon size={20} color={Colors.neutral800} />
          <ThemedText type="body" themeColor="neutral800" style={styles.rowText} numberOfLines={1}>
            Zgłoszone {ago(problem.first_reported_at)} ·{' '}
            {countLabel(
              problem.confirmations_count,
              'potwierdzenie',
              'potwierdzenia',
              'potwierdzeń',
            )}
          </ThemedText>
        </View>
      </View>

      <View style={styles.actions}>
        <ConfirmActions problemId={problem.id} variant="preview" />
        <Button
          label="Zobacz szczegóły"
          iconRight={ArrowRightIcon}
          height={52}
          style={styles.details}
          onPress={() => router.push(`/problem/${problem.id}`)}
        />
      </View>
    </FloatingSheet>
  );
}

const styles = StyleSheet.create({
  head: { flexDirection: 'row', gap: 14, alignItems: 'flex-start' },
  headText: { flex: 1, minWidth: 0 },
  kicker: { fontSize: 12 },
  title: { fontSize: 22, lineHeight: 25, marginTop: 2 },
  stars: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 },
  close: { marginTop: -6, marginRight: -10 },
  rows: { gap: 8, marginTop: 14 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  rowText: { fontSize: 15, flex: 1 },
  actions: { marginTop: 16, gap: 8 },
  details: { borderRadius: 14 },
});
