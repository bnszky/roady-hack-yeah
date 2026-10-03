import { StyleSheet } from 'react-native';

import { Button } from '@/components/roady/button';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';

type Props = {
  message: string;
  onRetry?: () => void;
};

export function ErrorState({ message, onRetry }: Props) {
  return (
    <ThemedView style={styles.container}>
      <ThemedText type="heading">Coś poszło nie tak</ThemedText>
      <ThemedText type="caption" style={styles.message}>
        {message}
      </ThemedText>
      {onRetry && <Button variant="secondary" label="Spróbuj ponownie" onPress={onRetry} />}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    padding: Spacing.four,
  },
  message: {
    textAlign: 'center',
    marginBottom: Spacing.two,
  },
});
