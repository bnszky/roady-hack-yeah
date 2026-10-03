import { useRouter } from 'expo-router';
import {
  CrosshairSimpleIcon,
  EyeIcon,
  LinkIcon,
  PaperPlaneTiltIcon,
  PencilSimpleIcon,
  SparkleIcon,
} from 'phosphor-react-native';
import type { ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { ActionBar } from '@/components/roady/action-bar';
import { Button } from '@/components/roady/button';
import { CategoryDisc } from '@/components/roady/markers';
import { ScreenHeader } from '@/components/roady/screen-header';
import { Stars } from '@/components/roady/stars';
import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/theme';
import { missingField, useReportDraft } from '@/context/report-draft';
import { usePlaceLabel } from '@/hooks/use-place-label';
import { useDraftCategory, usePublishDraft } from '@/hooks/use-publish-draft';
import { countLabel, SEVERITY_LABELS } from '@/lib/format';

function EditRow({
  label,
  children,
  onPress,
}: {
  label: string;
  children: ReactNode;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Edytuj: ${label}`}
      style={({ pressed }) => [styles.row, pressed && { backgroundColor: Colors.neutral200 }]}
    >
      <View style={styles.rowBody}>
        <ThemedText type="caption">{label}</ThemedText>
        {children}
      </View>
      <PencilSimpleIcon size={20} color={Colors.accent700} />
    </Pressable>
  );
}

export default function ReportConfirmScreen() {
  const router = useRouter();
  const { draft } = useReportDraft();
  const { category, proposal, needsImportance } = useDraftCategory();
  const { publish, isPending, error } = usePublishDraft();
  const place = usePlaceLabel(draft.location);

  const name = category?.name ?? proposal?.name ?? 'Wybierz kategorię';
  const icon = category?.icon ?? proposal?.icon ?? 'circle-alert';
  const missing = missingField(draft, needsImportance);
  const edit = () => router.push('/report/form');

  return (
    <View style={styles.screen}>
      <ScreenHeader title="Sprawdź zgłoszenie" kind="close" onBack={() => router.dismissTo('/')} />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.sourcePill}>
          <SparkleIcon size={16} color={Colors.accent800} />
          <ThemedText type="caption" style={{ color: Colors.accent800 }}>
            {draft.source === 'voice'
              ? 'Rozpoznane z nagrania głosowego'
              : 'Rozpoznane z Twojego opisu'}
          </ThemedText>
        </View>

        <View style={styles.head}>
          <CategoryDisc icon={icon} tier="high" size={60} />
          <View style={{ flex: 1 }}>
            <ThemedText type="kicker">
              {proposal && !category ? 'Nowa kategoria' : 'Kategoria'}
            </ThemedText>
            <ThemedText type="title" style={styles.title}>
              {name}
            </ThemedText>
          </View>
        </View>

        {proposal && !category && (
          <ThemedText type="caption" style={styles.note}>
            Nie znaleźliśmy pasującej kategorii. Zaproponujemy nową, a administrator ją sprawdzi.
          </ThemedText>
        )}

        <View style={styles.rows}>
          {needsImportance && (
            <EditRow label="Ważność" onPress={edit}>
              {draft.importance ? (
                <View style={styles.sevRow}>
                  <Stars value={draft.importance} size={20} />
                  <ThemedText type="small" themeColor="neutral800">
                    {SEVERITY_LABELS[draft.importance]}
                  </ThemedText>
                </View>
              ) : (
                <ThemedText type="bodyLarge" bold style={{ color: Colors.accent2_700 }}>
                  Oceń ważność
                </ThemedText>
              )}
            </EditRow>
          )}
          <EditRow label="Lokalizacja" onPress={edit}>
            <ThemedText type="bodyLarge">{place.data ?? 'Twoja lokalizacja'}</ThemedText>
            <View style={styles.auto}>
              <CrosshairSimpleIcon size={14} color={Colors.neutral700} />
              <ThemedText type="caption">
                {draft.locationManual ? 'Ustawiono ręcznie' : 'Wykryto automatycznie'}
              </ThemedText>
            </View>
          </EditRow>
          <EditRow label="Opis" onPress={edit}>
            <ThemedText type="body" style={{ marginTop: 2 }}>
              {draft.description || '—'}
            </ThemedText>
          </EditRow>
        </View>

        {draft.existingProblem && !draft.locationManual && (
          <View style={styles.info}>
            <LinkIcon size={16} color={Colors.neutral700} style={{ marginTop: 2 }} />
            <ThemedText type="caption" style={{ flex: 1 }}>
              W pobliżu jest już takie zgłoszenie (
              {countLabel(
                draft.existingProblem.confirmations_count,
                'potwierdzenie',
                'potwierdzenia',
                'potwierdzeń',
              )}
              ). Twoje zgłoszenie je potwierdzi.
            </ThemedText>
          </View>
        )}
        <View style={styles.info}>
          <EyeIcon size={16} color={Colors.neutral700} style={{ marginTop: 2 }} />
          <ThemedText type="caption" style={{ flex: 1 }}>
            Po publikacji znacznik pojawi się na mapie dla wszystkich w okolicy.
          </ThemedText>
        </View>
        {error && (
          <ThemedText type="small" style={styles.error}>
            Nie udało się opublikować: {error.message}
          </ThemedText>
        )}
      </ScrollView>

      <ActionBar>
        <Button
          variant="danger"
          label="Edytuj"
          icon={PencilSimpleIcon}
          height={58}
          style={{ flex: 1 }}
          onPress={edit}
        />
        <Button
          label={missing ? 'Uzupełnij' : 'Opublikuj'}
          icon={missing ? PencilSimpleIcon : PaperPlaneTiltIcon}
          height={58}
          style={{ flex: 1.6 }}
          loading={isPending}
          onPress={missing ? edit : publish}
        />
      </ActionBar>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.bg },
  content: { paddingHorizontal: 22, paddingTop: 8, paddingBottom: 20 },
  sourcePill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    height: 30,
    paddingHorizontal: 12,
    borderRadius: 15,
    backgroundColor: Colors.accent100,
  },
  head: { flexDirection: 'row', alignItems: 'center', gap: 14, marginTop: 18 },
  title: { fontSize: 28, lineHeight: 35 },
  note: { marginTop: 10 },
  rows: {
    marginTop: 22,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.divider,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    minHeight: 64,
    paddingVertical: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.divider,
  },
  rowBody: { flex: 1, gap: 2 },
  sevRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  auto: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  info: { flexDirection: 'row', gap: 6, marginTop: 14 },
  error: { color: Colors.accent2_700, marginTop: 10 },
});
