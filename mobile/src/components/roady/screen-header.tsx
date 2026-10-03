import { ArrowLeftIcon, XIcon } from 'phosphor-react-native';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { IconButton } from '@/components/roady/icon-button';
import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/theme';

type Props = {
  title: string;
  onBack: () => void;
  /** "close" for modal flows (X), "back" for a step back (arrow). */
  kind?: 'back' | 'close';
};

export function ScreenHeader({ title, onBack, kind = 'back' }: Props) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
      <IconButton
        icon={kind === 'close' ? XIcon : ArrowLeftIcon}
        onPress={onBack}
        accessibilityLabel={kind === 'close' ? 'Zamknij' : 'Wróć'}
      />
      <ThemedText type="subheading">{title}</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingBottom: 6,
    backgroundColor: Colors.bg,
  },
});
