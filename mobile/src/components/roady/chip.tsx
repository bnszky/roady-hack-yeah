import { CheckIcon, type Icon } from 'phosphor-react-native';
import { Pressable, StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Colors, Fonts } from '@/constants/theme';

type Props = {
  label: string;
  icon?: Icon;
  selected: boolean;
  onPress: () => void;
  height?: number;
};

/** Toggle chip: selected = cyan tint with a check (never color alone). */
export function Chip({ label, icon: IconCmp, selected, onPress, height = 40 }: Props) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      style={({ pressed }) => [
        styles.chip,
        { height, borderRadius: height / 2 },
        selected ? styles.on : styles.off,
        !selected && pressed && { backgroundColor: Colors.neutral200 },
      ]}
    >
      {IconCmp && <IconCmp size={18} color={selected ? Colors.accent800 : Colors.neutral700} />}
      <ThemedText
        type="small"
        style={[
          { color: selected ? Colors.accent800 : Colors.text },
          selected && { fontFamily: Fonts.semibold },
        ]}
      >
        {label}
      </ThemedText>
      {selected && <CheckIcon size={14} color={Colors.accent800} weight="regular" />}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingLeft: 10,
    paddingRight: 14,
  },
  on: {
    borderWidth: 1.5,
    borderColor: Colors.accent700,
    backgroundColor: Colors.accent100,
  },
  off: {
    borderWidth: 1,
    borderColor: Colors.divider,
  },
});
