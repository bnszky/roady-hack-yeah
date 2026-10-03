import { ActivityIndicator, StyleSheet } from 'react-native';

import { ThemedView } from '@/components/themed-view';
import { Colors, Spacing } from '@/constants/theme';

export function Loading() {
  return (
    <ThemedView style={styles.container}>
      <ActivityIndicator size="large" color={Colors.accent} />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.four,
  },
});
