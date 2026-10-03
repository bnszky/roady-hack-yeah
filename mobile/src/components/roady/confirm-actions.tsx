import { CheckCircleIcon, CheckIcon, SparkleIcon } from 'phosphor-react-native';
import { useSyncExternalStore } from 'react';
import { StyleSheet, View } from 'react-native';

import { Button } from '@/components/roady/button';
import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/theme';
import { useLocation } from '@/hooks/use-location';
import { useRespondToProblem } from '@/hooks/use-problems';

type Answer = 'still' | 'resolved';

// Per-session memory of what this user answered, shared by the preview sheet and details.
const answers = new Map<string, Answer>();
const listeners = new Set<() => void>();
const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};

function useAnswer(problemId: string) {
  return useSyncExternalStore(subscribe, () => answers.get(problemId));
}

type Props = {
  problemId: string;
  /** preview: two equal outline buttons; details: outline + primary. */
  variant: 'preview' | 'details';
};

/** "Nadal jest" / "Już naprawione" -> POST /problems/{id}/responses. */
export function ConfirmActions({ problemId, variant }: Props) {
  const answer = useAnswer(problemId);
  const respond = useRespondToProblem(problemId);
  const { location, hasFix } = useLocation();

  const send = (value: Answer) => {
    respond.mutate(
      { is_observable: value === 'still', ...(hasFix ? location : {}) },
      {
        onSuccess: () => {
          answers.set(problemId, value);
          listeners.forEach((l) => l());
        },
      },
    );
  };

  const height = variant === 'preview' ? 46 : 54;

  if (answer) {
    return (
      <View style={[styles.thanks, { height }]}>
        <CheckCircleIcon size={20} color={Colors.accent800} />
        <ThemedText type="body" style={styles.thanksText}>
          {answer === 'still' ? 'Dzięki, potwierdzenie dodane' : 'Dzięki, sprawdzimy to z innymi'}
        </ThemedText>
      </View>
    );
  }

  if (variant === 'preview') {
    return (
      <View style={styles.row}>
        <Button
          variant="secondary"
          label="Nadal jest"
          icon={CheckIcon}
          height={height}
          style={styles.flex}
          onPress={() => send('still')}
          loading={respond.isPending && respond.variables?.is_observable === true}
        />
        <Button
          variant="secondary"
          label="Już naprawione"
          icon={SparkleIcon}
          height={height}
          style={styles.flex}
          onPress={() => send('resolved')}
          loading={respond.isPending && respond.variables?.is_observable === false}
        />
      </View>
    );
  }

  return (
    <View style={styles.row}>
      <Button
        variant="secondary"
        label="Już naprawione"
        icon={SparkleIcon}
        height={height}
        style={styles.flex}
        onPress={() => send('resolved')}
        loading={respond.isPending && respond.variables?.is_observable === false}
      />
      <Button
        label="Nadal jest"
        icon={CheckCircleIcon}
        height={height}
        style={{ flex: 1.3 }}
        onPress={() => send('still')}
        loading={respond.isPending && respond.variables?.is_observable === true}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 8 },
  flex: { flex: 1, borderRadius: 14 },
  thanks: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 14,
    backgroundColor: Colors.accent100,
  },
  thanksText: { color: Colors.accent800, fontSize: 15 },
});
