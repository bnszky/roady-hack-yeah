import { StarIcon } from 'phosphor-react-native';
import { Pressable, StyleSheet, View } from 'react-native';

import { Colors } from '@/constants/theme';

type Props = {
  value: number;
  size?: number;
  /** Makes each star a tap target that sets the value (form). */
  onChange?: (value: number) => void;
};

export function Stars({ value, size = 17, onChange }: Props) {
  const rounded = Math.round(value);
  return (
    <View style={[styles.row, onChange && styles.rowLarge]}>
      {[1, 2, 3, 4, 5].map((k) => {
        const on = k <= rounded;
        const star = (
          <StarIcon
            size={size}
            weight={on ? 'fill' : 'regular'}
            color={on ? Colors.text : Colors.neutral500}
          />
        );
        if (!onChange) return <View key={k}>{star}</View>;
        return (
          <Pressable
            key={k}
            onPress={() => onChange(k)}
            accessibilityRole="button"
            accessibilityLabel={`Ocena ${k} z 5`}
            accessibilityState={{ selected: on }}
            style={({ pressed }) => [styles.tap, pressed && { backgroundColor: Colors.neutral200 }]}
          >
            {star}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 1 },
  rowLarge: { gap: 4 },
  tap: {
    width: 56,
    height: 56,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
