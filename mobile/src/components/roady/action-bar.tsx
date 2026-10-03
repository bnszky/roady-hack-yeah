import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Colors, Radius } from '@/constants/theme';

/** Near-black bottom bar holding a screen's main actions (details, confirmation). */
export function ActionBar({ children }: { children: ReactNode }) {
  const insets = useSafeAreaInsets();
  return <View style={[styles.bar, { paddingBottom: 18 + insets.bottom }]}>{children}</View>;
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    gap: 10,
    paddingTop: 18,
    paddingHorizontal: 20,
    backgroundColor: Colors.actionBar,
    borderTopLeftRadius: Radius.sheet,
    borderTopRightRadius: Radius.sheet,
  },
});
