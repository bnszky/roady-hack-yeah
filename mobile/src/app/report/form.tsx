import { useRouter } from 'expo-router';
import {
  CheckCircleIcon,
  CrosshairSimpleIcon,
  InfoIcon,
  MapPinIcon,
  PaperPlaneTiltIcon,
  SparkleIcon,
  type Icon,
} from 'phosphor-react-native';
import { Camera, MarkerView } from '@rnmapbox/maps';
import { useRef } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/roady/button';
import { InlineError } from '@/components/roady/inline-error';
import { RoadyMap, toPosition } from '@/components/roady/map';
import { ScreenHeader } from '@/components/roady/screen-header';
import { Stars } from '@/components/roady/stars';
import { ThemedText } from '@/components/themed-text';
import { Colors, Fonts, Radius } from '@/constants/theme';
import { missingField, useReportDraft } from '@/context/report-draft';
import { usePlaceLabel } from '@/hooks/use-place-label';
import { useDraftCategory, usePublishDraft } from '@/hooks/use-publish-draft';
import { categoryIcon } from '@/lib/category-icons';
import { SEVERITY_LABELS } from '@/lib/format';

function CategoryTile({
  name,
  icon: IconCmp,
  selected,
  onPress,
}: {
  name: string;
  icon: Icon;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      style={({ pressed }) => [
        styles.tile,
        selected ? styles.tileOn : styles.tileOff,
        !selected && pressed && { backgroundColor: Colors.neutral200 },
      ]}
    >
      <IconCmp size={26} color={selected ? Colors.accent800 : Colors.neutral800} />
      <ThemedText
        type="caption"
        numberOfLines={3}
        adjustsFontSizeToFit
        minimumFontScale={0.8}
        style={[styles.tileText, { color: selected ? Colors.accent800 : Colors.text }]}
      >
        {name}
      </ThemedText>
      {selected && (
        <View style={styles.tileCheck}>
          <CheckCircleIcon size={15} weight="fill" color={Colors.accent800} />
        </View>
      )}
    </Pressable>
  );
}

export default function ReportFormScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { draft, update } = useReportDraft();
  const { categories } = useDraftCategory();
  const { publish, isPending, error } = usePublishDraft();
  const place = usePlaceLabel(draft.location);
  const missing = missingField(draft);
  const scrollRef = useRef<ScrollView>(null);

  // Edge-to-edge Android ignores adjustResize, so the screen pads itself above the keyboard
  // and scrolls the description into view once the keyboard is up.
  const revealDescription = () =>
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 300);

  return (
    <KeyboardAvoidingView style={styles.screen} behavior="padding">
      <ScreenHeader
        title={draft.source === 'form' ? 'Nowe zgłoszenie' : 'Popraw zgłoszenie'}
        kind={draft.source === 'form' ? 'close' : 'back'}
        onBack={() => router.back()}
      />

      <ScrollView
        ref={scrollRef}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <ThemedText type="subheading">Kategoria</ThemedText>
        {categories.isError && (
          <InlineError
            message={categories.error.message}
            onRetry={() => categories.refetch()}
            style={styles.categoriesState}
          />
        )}
        {categories.isPending && (
          <ActivityIndicator color={Colors.accent} style={styles.categoriesState} />
        )}
        <View style={styles.grid}>
          {draft.proposedCategory && (
            <CategoryTile
              name={draft.proposedCategory.name}
              icon={SparkleIcon}
              selected={!draft.categoryId}
              onPress={() => update({ categoryId: null, existingProblem: null })}
            />
          )}
          {(categories.data ?? []).map((c) => (
            <CategoryTile
              key={c.id}
              name={c.name}
              icon={categoryIcon(c.icon)}
              selected={draft.categoryId === c.id}
              onPress={() => update({ categoryId: c.id, existingProblem: null })}
            />
          ))}
        </View>

        <ThemedText type="subheading" style={styles.section}>
          Jak poważny jest problem?
        </ThemedText>
        <View style={styles.stars}>
          <Stars
            value={draft.importance ?? 0}
            size={40}
            onChange={(importance) => update({ importance })}
          />
        </View>
        <ThemedText type="body" bold style={styles.sevLabel}>
          {SEVERITY_LABELS[draft.importance ?? 0]}
        </ThemedText>
        <View style={styles.sevScale}>
          <ThemedText type="caption" style={styles.scaleText}>
            1 · drobna niedogodność
          </ThemedText>
          <ThemedText type="caption" style={styles.scaleText}>
            5 · całkowita blokada
          </ThemedText>
        </View>

        <ThemedText type="subheading" style={styles.section}>
          Lokalizacja
        </ThemedText>
        <View style={styles.map}>
          <RoadyMap
            style={StyleSheet.absoluteFill}
            logoEnabled={false}
            attributionPosition={{ top: 8, right: 8 }}
            onPress={(feature) => {
              const [longitude, latitude] = feature.geometry.coordinates;
              update({ location: { latitude, longitude }, locationManual: true });
            }}
          >
            <Camera
              defaultSettings={{ centerCoordinate: toPosition(draft.location), zoomLevel: 16.5 }}
            />
            <MarkerView
              coordinate={toPosition(draft.location)}
              anchor={{ x: 0.5, y: 1 }}
              allowOverlap
            >
              <View pointerEvents="none">
                <MapPinIcon size={40} weight="fill" color={Colors.accent2_600} />
              </View>
            </MarkerView>
          </RoadyMap>
          <View style={styles.mapHint} pointerEvents="none">
            <ThemedText type="caption" style={styles.mapHintText}>
              Stuknij mapę, aby przesunąć znacznik
            </ThemedText>
          </View>
        </View>
        <View style={styles.placeRow}>
          <CrosshairSimpleIcon size={18} color={Colors.accent700} />
          <ThemedText type="small">
            {place.data ?? 'Wybrane miejsce'} ·{' '}
            {draft.locationManual ? 'ustawione ręcznie' : 'Twoja lokalizacja'}
          </ThemedText>
        </View>

        <ThemedText type="subheading" style={styles.section}>
          Opis{' '}
          <ThemedText type="small" themeColor="neutral700">
            opcjonalnie
          </ThemedText>
        </ThemedText>
        <TextInput
          style={styles.textarea}
          multiline
          value={draft.description}
          onChangeText={(description) => update({ description })}
          placeholder="Krótko: co widzisz, komu to przeszkadza?"
          placeholderTextColor={Colors.neutral600}
          textAlignVertical="top"
          onFocus={revealDescription}
        />
        {error && (
          <ThemedText type="small" style={styles.error}>
            Nie udało się opublikować: {error.message}
          </ThemedText>
        )}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: 14 + insets.bottom }]}>
        {missing ? (
          <Button variant="disabled" label={missing} icon={InfoIcon} height={58} />
        ) : (
          <Button
            label="Opublikuj zgłoszenie"
            icon={PaperPlaneTiltIcon}
            height={58}
            loading={isPending}
            onPress={publish}
          />
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.bg },
  content: { paddingHorizontal: 20, paddingTop: 6, paddingBottom: 24 },
  categoriesState: { marginTop: 10 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 },
  tile: {
    width: '31.8%',
    minHeight: 92,
    paddingVertical: 10,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingHorizontal: 3,
  },
  tileOn: { borderWidth: 2, borderColor: Colors.accent700, backgroundColor: Colors.accent100 },
  tileOff: { borderWidth: 1, borderColor: Colors.divider, backgroundColor: Colors.neutral100 },
  tileText: { fontSize: 13, lineHeight: 16, textAlign: 'center' },
  tileCheck: { position: 'absolute', top: 5, right: 5 },
  section: { marginTop: 28 },
  stars: { marginTop: 8 },
  sevLabel: { fontSize: 15, marginTop: 4, minHeight: 22 },
  sevScale: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
  scaleText: { fontSize: 12 },
  map: {
    height: 150,
    marginTop: 10,
    borderRadius: Radius.lg,
    overflow: 'hidden',
    backgroundColor: Colors.neutral200,
  },
  mapHint: {
    position: 'absolute',
    left: 10,
    bottom: 10,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 10,
    backgroundColor: Colors.neutral100,
  },
  mapHintText: { fontSize: 12, color: Colors.text },
  placeRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 10 },
  textarea: {
    marginTop: 10,
    minHeight: 88,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.divider,
    backgroundColor: Colors.neutral100,
    paddingVertical: 12,
    paddingHorizontal: 14,
    fontFamily: Fonts.regular,
    fontSize: 16,
    color: Colors.text,
  },
  error: { color: Colors.accent2_700, marginTop: 10 },
  footer: {
    paddingTop: 12,
    paddingHorizontal: 20,
    backgroundColor: Colors.bg,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.divider,
  },
});
