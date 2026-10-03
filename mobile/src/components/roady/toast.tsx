import { CheckCircleIcon } from 'phosphor-react-native';
import { StyleSheet } from 'react-native';
import Animated, { FadeOut, SlideInUp } from 'react-native-reanimated';

import { ThemedText } from '@/components/themed-text';
import { Colors, Shadows } from '@/constants/theme';

export function Toast({ message, top }: { message: string; top: number }) {
  return (
    <Animated.View
      entering={SlideInUp.duration(300)}
      exiting={FadeOut}
      style={[styles.toast, { top }]}
      accessibilityLiveRegion="polite"
    >
      <CheckCircleIcon size={22} color={Colors.accent300} weight="duotone" />
      <ThemedText type="body" style={styles.text}>
        {message}
      </ThemedText>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  toast: {
    position: 'absolute',
    alignSelf: 'center',
    zIndex: 30,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 14,
    backgroundColor: Colors.text,
    ...Shadows.lg,
  },
  text: { color: Colors.neutral100, fontSize: 15 },
});
