import type { Icon } from 'phosphor-react-native';
import { Pressable, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';

import { Colors, Shadows } from '@/constants/theme';

type Props = {
  icon: Icon;
  onPress?: () => void;
  accessibilityLabel: string;
  /** "floating" = paper disc with shadow (over a map), "plain" = transparent. */
  variant?: 'floating' | 'plain';
  size?: number;
  weight?: 'regular' | 'duotone' | 'fill';
  color?: string;
  style?: StyleProp<ViewStyle>;
};

export function IconButton({
  icon: IconCmp,
  onPress,
  accessibilityLabel,
  variant = 'plain',
  size = 48,
  weight = 'regular',
  color = Colors.text,
  style,
}: Props) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      hitSlop={4}
      style={({ pressed }) => [
        styles.base,
        { width: size, height: size, borderRadius: size / 2 },
        variant === 'floating' && styles.floating,
        pressed && { backgroundColor: Colors.neutral200 },
        style,
      ]}
    >
      <IconCmp size={22} color={color} weight={weight} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  floating: {
    backgroundColor: Colors.neutral100,
    ...Shadows.md,
  },
});
