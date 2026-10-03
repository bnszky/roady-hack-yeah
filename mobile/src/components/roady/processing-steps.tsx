import { CheckCircleIcon, CircleIcon } from 'phosphor-react-native';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/theme';

const STEPS = ['Rozpoznaję kategorię', 'Ustalam lokalizację', 'Oceniam utrudnienie'];
const STEP_MS = 650;

/**
 * The AI call is a single request, so the steps advance on a timer while it runs
 * and all tick off once it resolves (`done`).
 */
export function ProcessingSteps({
  done,
  size = 'large',
}: {
  done: boolean;
  size?: 'large' | 'small';
}) {
  const [step, setStep] = useState(1);

  useEffect(() => {
    const iv = setInterval(() => setStep((s) => Math.min(s + 1, STEPS.length - 1)), STEP_MS);
    return () => clearInterval(iv);
  }, []);

  const reached = done ? STEPS.length : step;
  const iconSize = size === 'large' ? 22 : 19;

  return (
    <View style={{ gap: size === 'large' ? 12 : 10 }}>
      {STEPS.map((label, i) => {
        const isDone = i < reached;
        return (
          <View key={label} style={styles.row}>
            {isDone ? (
              <CheckCircleIcon size={iconSize} color={Colors.accent700} weight="duotone" />
            ) : (
              <CircleIcon size={iconSize} color={Colors.neutral400} weight="regular" />
            )}
            <ThemedText
              type={size === 'large' ? 'body' : 'small'}
              themeColor={isDone ? 'text' : 'neutral700'}
            >
              {label}
            </ThemedText>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
});
