import { Pressable, StyleSheet, View } from 'react-native';

import { Button } from '@/components/roady/button';
import { Chip } from '@/components/roady/chip';
import { InlineError } from '@/components/roady/inline-error';
import { Segmented } from '@/components/roady/segmented';
import { ModalSheet } from '@/components/roady/sheet';
import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/theme';
import { useCategories } from '@/hooks/use-categories';
import { categoryIcon } from '@/lib/category-icons';
import { countLabel } from '@/lib/format';

export type Recency = '24h' | '7d' | 'all';

export type MapFilters = {
  categoryIds: string[];
  minSeverity: 1 | 3 | 4;
  recency: Recency;
};

export const DEFAULT_FILTERS: MapFilters = { categoryIds: [], minSeverity: 1, recency: 'all' };

export function filtersActive(f: MapFilters) {
  return f.categoryIds.length > 0 || f.minSeverity > 1 || f.recency !== 'all';
}

/** Recency has no backend filter; it is applied to `last_reported_at` on the client. */
export function passesRecency(lastReportedAt: string, recency: Recency, now = Date.now()) {
  if (recency === 'all') return true;
  const maxAge = recency === '24h' ? 24 * 3600_000 : 7 * 24 * 3600_000;
  return now - new Date(lastReportedAt).getTime() <= maxAge;
}

type Props = {
  visible: boolean;
  onClose: () => void;
  filters: MapFilters;
  onChange: (f: MapFilters) => void;
  resultCount: number;
};

export function FiltersSheet({ visible, onClose, filters, onChange, resultCount }: Props) {
  const categories = useCategories();

  const toggle = (id: string) =>
    onChange({
      ...filters,
      categoryIds: filters.categoryIds.includes(id)
        ? filters.categoryIds.filter((c) => c !== id)
        : [...filters.categoryIds, id],
    });

  return (
    <ModalSheet visible={visible} onClose={onClose}>
      <View style={styles.header}>
        <ThemedText type="title" style={styles.title}>
          Filtry
        </ThemedText>
        <Pressable
          onPress={() => onChange(DEFAULT_FILTERS)}
          accessibilityRole="button"
          style={({ pressed }) => [styles.reset, pressed && { backgroundColor: Colors.accent100 }]}
        >
          <ThemedText type="body" themeColor="accent700" style={styles.resetText}>
            Wyczyść wszystko
          </ThemedText>
        </Pressable>
      </View>

      <ThemedText type="kicker" style={styles.section}>
        Kategoria
      </ThemedText>
      {categories.isError && (
        <InlineError
          message={categories.error.message}
          onRetry={() => categories.refetch()}
          style={styles.error}
        />
      )}
      <View style={styles.chips}>
        {(categories.data ?? []).map((c) => (
          <Chip
            key={c.id}
            label={c.name}
            icon={categoryIcon(c.icon)}
            selected={filters.categoryIds.includes(c.id)}
            onPress={() => toggle(c.id)}
          />
        ))}
      </View>

      <ThemedText type="kicker" style={styles.sectionLarge}>
        Ważność
      </ThemedText>
      <Segmented
        withStar
        value={filters.minSeverity}
        onChange={(minSeverity) => onChange({ ...filters, minSeverity })}
        options={[
          { label: 'Wszystkie', value: 1 },
          { label: '3 i więcej', value: 3 },
          { label: '4 i więcej', value: 4 },
        ]}
      />

      <ThemedText type="kicker" style={styles.sectionLarge}>
        Kiedy zgłoszone
      </ThemedText>
      <Segmented
        value={filters.recency}
        onChange={(recency) => onChange({ ...filters, recency })}
        options={[
          { label: 'Ostatnie 24 h', value: '24h' },
          { label: 'Ostatni tydzień', value: '7d' },
          { label: 'Wszystkie', value: 'all' },
        ]}
      />

      <Button
        label={`Pokaż ${countLabel(resultCount, 'zgłoszenie', 'zgłoszenia', 'zgłoszeń')}`}
        style={styles.submit}
        onPress={onClose}
      />
    </ModalSheet>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { fontSize: 24 },
  reset: { height: 44, paddingHorizontal: 10, borderRadius: 10, justifyContent: 'center' },
  resetText: { fontSize: 15 },
  section: { marginTop: 14, marginBottom: 10 },
  sectionLarge: { marginTop: 22, marginBottom: 10 },
  error: { marginBottom: 10 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  submit: { marginTop: 26 },
});
