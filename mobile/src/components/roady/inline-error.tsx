import { ArrowClockwiseIcon, WarningCircleIcon } from 'phosphor-react-native';
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Colors, Shadows } from '@/constants/theme';

type Props = {
  message: string;
  onRetry?: () => void;
  /** "floating" = card over the map, "inline" = flat block inside a form or sheet. */
  variant?: 'floating' | 'inline';
  style?: StyleProp<ViewStyle>;
};

/** A failed request made visible, instead of an empty list that looks like "no data". */
export function InlineError({ message, onRetry, variant = 'inline', style }: Props) {
  return (
    <View style={[styles.box, variant === 'floating' && styles.floating, style]}>
      <WarningCircleIcon size={20} color={Colors.accent2_700} />
      <ThemedText type="small" style={styles.text}>
        {message}
      </ThemedText>
      {onRetry && (
        <Pressable
          onPress={onRetry}
          accessibilityRole="button"
          accessibilityLabel="Spróbuj ponownie"
          hitSlop={8}
          style={({ pressed }) => [styles.retry, pressed && { backgroundColor: Colors.neutral200 }]}
        >
          <ArrowClockwiseIcon size={20} color={Colors.accent700} weight="regular" />
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 14,
    backgroundColor: Colors.accent2_100,
  },
  floating: {
    backgroundColor: Colors.neutral100,
    ...Shadows.md,
  },
  text: { flex: 1, color: Colors.text },
  retry: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
