import { StarIcon } from 'phosphor-react-native';
import { useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { Colors } from '@/constants/theme';

/** Interactive star cell: 56px tap target, 4px gap (design: 40px stars). */
const CELL = 56;
const GAP = 4;
const MAX = 5;
/** Cascade step between stars when the rating jumps by more than one. */
const STAGGER_ON_MS = 40;
const STAGGER_OFF_MS = 30;

type Props = {
  value: number;
  size?: number;
  /** Makes the row an input: tap a star or swipe across the stars to set the value. */
  onChange?: (value: number) => void;
};

function Star({ on, size }: { on: boolean; size: number }) {
  return (
    <StarIcon
      size={size}
      weight={on ? 'fill' : 'regular'}
      color={on ? Colors.text : Colors.neutral500}
    />
  );
}

export function Stars({ value, size = 17, onChange }: Props) {
  const rounded = Math.round(value);

  if (!onChange) {
    return (
      <View style={styles.row}>
        {[1, 2, 3, 4, 5].map((k) => (
          <Star key={k} on={k <= rounded} size={size} />
        ))}
      </View>
    );
  }

  return <StarInput value={rounded} size={size} onChange={onChange} />;
}

/** A star that pops (1 → 1.3 → 1) when lit and shrinks briefly when turned off. */
function AnimatedStar({ on, size, delay }: { on: boolean; size: number; delay: number }) {
  const scale = useSharedValue(1);
  const reduceMotion = useReducedMotion();
  const mounted = useRef(false);

  useEffect(() => {
    // No animation for the initial value (e.g. a rating suggested by the AI).
    if (!mounted.current) {
      mounted.current = true;
      return;
    }
    if (reduceMotion) return;
    scale.set(
      withDelay(
        delay,
        on
          ? withSequence(
              withTiming(1.3, { duration: 110 }),
              withSpring(1, { damping: 9, stiffness: 260 }),
            )
          : withSequence(
              withTiming(0.85, { duration: 90 }),
              withSpring(1, { damping: 14, stiffness: 300 }),
            ),
      ),
    );
    // `delay` is read when `on` flips; changing it alone must not replay the pop.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [on]);

  const style = useAnimatedStyle(() => ({ transform: [{ scale: scale.get() }] }));

  return (
    <Animated.View style={style}>
      <Star on={on} size={size} />
    </Animated.View>
  );
}

function StarInput({
  value,
  size,
  onChange,
}: {
  value: number;
  size: number;
  onChange: (value: number) => void;
}) {
  // Previous rating, so a jump (e.g. 1 → 4) lights the stars as a left-to-right wave.
  const [anim, setAnim] = useState({ value, from: value });
  if (anim.value !== value) setAnim({ value, from: anim.value });
  const delayFor = (k: number) => {
    if (k > anim.from && k <= value) return (k - anim.from - 1) * STAGGER_ON_MS;
    if (k <= anim.from && k > value) return (anim.from - k) * STAGGER_OFF_MS;
    return 0;
  };

  const set = (next: number) => {
    if (next !== value) onChange(next);
  };

  // Touch x -> 1..5. Anything left of the first star still counts as 1, so a swipe
  // that overshoots either end lands on the extreme instead of being ignored.
  const starAt = (x: number) => {
    'worklet';
    return Math.min(MAX, Math.max(1, Math.floor(x / (CELL + GAP)) + 1));
  };

  // Horizontal drags only, so a vertical swipe over the stars still scrolls the form.
  const pan = Gesture.Pan()
    .activeOffsetX([-6, 6])
    .failOffsetY([-14, 14])
    .onStart((e) => scheduleOnRN(set, starAt(e.x)))
    .onUpdate((e) => scheduleOnRN(set, starAt(e.x)));
  const tap = Gesture.Tap().onEnd((e) => scheduleOnRN(set, starAt(e.x)));

  return (
    <GestureDetector gesture={Gesture.Race(pan, tap)}>
      <View
        style={[styles.row, styles.rowLarge]}
        accessible
        accessibilityRole="adjustable"
        accessibilityLabel="Ważność problemu"
        accessibilityValue={{ min: 0, max: MAX, now: value, text: `${value} z ${MAX}` }}
        accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
        onAccessibilityAction={(e) => {
          if (e.nativeEvent.actionName === 'increment') set(Math.min(MAX, value + 1));
          if (e.nativeEvent.actionName === 'decrement') set(Math.max(1, value - 1));
        }}
      >
        {[1, 2, 3, 4, 5].map((k) => (
          <View key={k} style={styles.cell}>
            <AnimatedStar on={k <= value} size={size} delay={delayFor(k)} />
          </View>
        ))}
      </View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 1 },
  rowLarge: { gap: GAP, alignSelf: 'flex-start' },
  cell: {
    width: CELL,
    height: CELL,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
