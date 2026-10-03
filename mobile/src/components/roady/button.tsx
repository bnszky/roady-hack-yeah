import type { Icon } from 'phosphor-react-native';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Colors, Fonts, Radius } from '@/constants/theme';

type Variant = 'primary' | 'secondary' | 'dark' | 'disabled';

type Props = {
  label: string;
  onPress?: () => void;
  variant?: Variant;
  icon?: Icon;
  iconRight?: Icon;
  height?: number;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
};

const BG: Record<Variant, { idle: string; pressed: string }> = {
  primary: { idle: Colors.accent, pressed: Colors.accent700 },
  secondary: { idle: 'transparent', pressed: Colors.neutral200 },
  dark: { idle: Colors.text, pressed: Colors.neutral800 },
  disabled: { idle: Colors.neutral300, pressed: Colors.neutral300 },
};

const FG: Record<Variant, string> = {
  primary: Colors.neutral100,
  secondary: Colors.text,
  dark: Colors.neutral100,
  disabled: Colors.neutral800,
};

export function Button({
  label,
  onPress,
  variant = 'primary',
  icon: IconLeft,
  iconRight: IconRight,
  height = 54,
  loading,
  style,
  accessibilityLabel,
}: Props) {
  const disabled = variant === 'disabled' || loading;
  const color = FG[variant];

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      style={({ pressed }) => [
        styles.base,
        { height, backgroundColor: pressed ? BG[variant].pressed : BG[variant].idle },
        variant === 'secondary' && styles.outline,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={color} />
      ) : (
        <>
          {IconLeft && <IconLeft size={22} color={color} />}
          <ThemedText
            type="button"
            style={[{ color }, variant === 'secondary' && { fontFamily: Fonts.regular }]}
          >
            {label}
          </ThemedText>
          {IconRight && <IconRight size={20} color={color} weight="regular" />}
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 16,
    borderRadius: Radius.lg,
  },
  outline: {
    borderWidth: 1,
    borderColor: Colors.divider,
  },
});
