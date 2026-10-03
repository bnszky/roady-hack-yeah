import type { ReactNode } from 'react';
import { Modal, Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { FadeIn, FadeOut, SlideInDown, SlideOutDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Colors, Radius, Shadows } from '@/constants/theme';

function Handle() {
  return <View style={styles.handle} />;
}

type ModalSheetProps = {
  visible: boolean;
  onClose: () => void;
  children: ReactNode;
};

/** Bottom sheet over a dimmed scrim (filters, report method). */
export function ModalSheet({ visible, onClose, children }: ModalSheetProps) {
  const insets = useSafeAreaInsets();
  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      navigationBarTranslucent
      onRequestClose={onClose}
    >
      {visible && (
        <View style={StyleSheet.absoluteFill}>
          <Animated.View entering={FadeIn.duration(200)} exiting={FadeOut} style={styles.scrim}>
            <Pressable
              style={StyleSheet.absoluteFill}
              onPress={onClose}
              accessibilityLabel="Zamknij"
            />
          </Animated.View>
          <Animated.View
            entering={SlideInDown.duration(250)}
            exiting={SlideOutDown.duration(200)}
            style={[styles.modal, { paddingBottom: 24 + insets.bottom }]}
          >
            <Handle />
            {children}
          </Animated.View>
        </View>
      )}
    </Modal>
  );
}

type FloatingSheetProps = {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
};

/** Card that floats above the tab bar without blocking the map (issue preview). */
export function FloatingSheet({ children, style }: FloatingSheetProps) {
  return (
    <Animated.View
      entering={SlideInDown.duration(250)}
      exiting={SlideOutDown.duration(200)}
      style={[styles.floating, style]}
    >
      <Handle />
      {children}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  scrim: {
    ...StyleSheet.absoluteFill,
    backgroundColor: Colors.scrim,
  },
  modal: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: Colors.neutral100,
    borderTopLeftRadius: Radius.sheet,
    borderTopRightRadius: Radius.sheet,
    paddingTop: 10,
    paddingHorizontal: 20,
    ...Shadows.lg,
  },
  floating: {
    position: 'absolute',
    left: 8,
    right: 8,
    zIndex: 20,
    backgroundColor: Colors.neutral100,
    borderRadius: 24,
    paddingTop: 10,
    paddingHorizontal: 20,
    paddingBottom: 20,
    ...Shadows.lg,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.neutral400,
    alignSelf: 'center',
    marginBottom: 12,
  },
});
