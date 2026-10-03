import { StarIcon } from 'phosphor-react-native';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Colors, Fonts, Shadows } from '@/constants/theme';

type Option<T> = { label: string; value: T };

type Props<T> = {
  options: Option<T>[];
  value: T;
  onChange: (value: T) => void;
  /** Prefix each option with a small star (severity filter). */
  withStar?: boolean;
};

export function Segmented<T extends string | number>({
  options,
  value,
  onChange,
  withStar,
}: Props<T>) {
  return (
    <View style={styles.track}>
      {options.map((o) => {
        const selected = o.value === value;
        return (
          <Pressable
            key={String(o.value)}
            onPress={() => onChange(o.value)}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            style={[styles.option, selected && styles.selected]}
          >
            {withStar && (
              <StarIcon
                size={13}
                weight={selected ? 'fill' : 'regular'}
                color={selected ? Colors.text : Colors.neutral800}
              />
            )}
            <ThemedText
              type="small"
              numberOfLines={1}
              style={{
                color: selected ? Colors.text : Colors.neutral800,
                fontFamily: selected ? Fonts.semibold : Fonts.regular,
              }}
            >
              {o.label}
            </ThemedText>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    flexDirection: 'row',
    gap: 6,
    padding: 4,
    borderRadius: 16,
    backgroundColor: Colors.neutral200,
  },
  option: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingHorizontal: 4,
  },
  selected: {
    backgroundColor: Colors.neutral100,
    ...Shadows.sm,
  },
});
