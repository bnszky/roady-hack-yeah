import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  useWindowDimensions,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { scheduleOnRN } from 'react-native-worklets';

import { Colors, Radius, Shadows } from '@/constants/theme';

/** Drag distance or fling speed past which releasing a sheet dismisses it. */
const DISMISS_DISTANCE = 80;
const DISMISS_VELOCITY = 800;
const OPEN = { duration: 260, easing: Easing.out(Easing.cubic) };
const CLOSE = { duration: 200, easing: Easing.in(Easing.cubic) };

const SheetCloseContext = createContext<() => void>(() => {});

/** Closes the surrounding sheet with its slide-out animation (e.g. "Pokaż X zgłoszeń"). */
export function useSheetClose() {
  return useContext(SheetCloseContext);
}

function Handle() {
  return <View style={styles.handle} />;
}

/** Pan that drags the sheet down and dismisses it past the threshold. */
function useDismissPan(translateY: { set: (v: number) => void }, dismiss: () => void) {
  return Gesture.Pan()
    .activeOffsetY(10)
    .failOffsetX([-20, 20])
    .onUpdate((e) => {
      translateY.set(Math.max(0, e.translationY));
    })
    .onEnd((e) => {
      if (e.translationY > DISMISS_DISTANCE || e.velocityY > DISMISS_VELOCITY) {
        scheduleOnRN(dismiss);
      } else {
        translateY.set(withSpring(0, { damping: 22, stiffness: 240 }));
      }
    });
}

type ModalSheetProps = {
  visible: boolean;
  onClose: () => void;
  children: ReactNode;
};

/**
 * Bottom sheet over a dimmed scrim (filters, report method). Stays mounted until its
 * slide-out finishes, closes on scrim tap, back button, swipe down or `useSheetClose()`.
 */
export function ModalSheet({ visible, onClose, children }: ModalSheetProps) {
  const [mounted, setMounted] = useState(visible);
  if (visible && !mounted) setMounted(true);
  const closeRef = useRef<() => void>(onClose);
  const hide = useCallback(() => setMounted(false), []);

  return (
    <Modal
      visible={mounted}
      transparent
      animationType="none"
      statusBarTranslucent
      navigationBarTranslucent
      onRequestClose={() => closeRef.current()}
    >
      {mounted && (
        // The modal is a separate native window: it needs its own gesture root, and
        // its own safe-area provider so the bottom inset is measured in this window.
        <SafeAreaProvider>
          <GestureHandlerRootView style={styles.fill}>
            <SheetBody visible={visible} onClose={onClose} onHidden={hide} closeRef={closeRef}>
              {children}
            </SheetBody>
          </GestureHandlerRootView>
        </SafeAreaProvider>
      )}
    </Modal>
  );
}

function SheetBody({
  visible,
  onClose,
  onHidden,
  closeRef,
  children,
}: {
  visible: boolean;
  onClose: () => void;
  onHidden: () => void;
  closeRef: { current: () => void };
  children: ReactNode;
}) {
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const translateY = useSharedValue(height);
  const scrim = useSharedValue(0);

  const slideOut = useCallback(
    (after: () => void) => {
      scrim.set(withTiming(0, CLOSE));
      translateY.set(
        withTiming(height, CLOSE, (finished) => {
          if (finished) scheduleOnRN(after);
        }),
      );
    },
    [height, scrim, translateY],
  );

  // Closed from inside (scrim, swipe, back, button): animate, then tell the parent.
  const requestClose = useCallback(
    () =>
      slideOut(() => {
        onHidden();
        onClose();
      }),
    [slideOut, onHidden, onClose],
  );

  useEffect(() => {
    closeRef.current = requestClose;
  }, [closeRef, requestClose]);

  // Opened by the parent, or closed by it (e.g. after navigating away).
  useEffect(() => {
    if (visible) {
      scrim.set(withTiming(1, OPEN));
      translateY.set(withTiming(0, OPEN));
    } else {
      slideOut(onHidden);
    }
  }, [visible, scrim, translateY, slideOut, onHidden]);

  const pan = useDismissPan(translateY, requestClose);
  const sheetStyle = useAnimatedStyle(() => ({ transform: [{ translateY: translateY.get() }] }));
  const scrimStyle = useAnimatedStyle(() => ({ opacity: scrim.get() }));

  return (
    <View style={styles.fill}>
      <Animated.View style={[styles.scrim, scrimStyle]}>
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={requestClose}
          accessibilityLabel="Zamknij"
        />
      </Animated.View>
      <GestureDetector gesture={pan}>
        <Animated.View
          style={[
            styles.modal,
            { paddingBottom: 16 + insets.bottom, maxHeight: height * 0.9 },
            sheetStyle,
          ]}
        >
          <Handle />
          <SheetCloseContext.Provider value={requestClose}>{children}</SheetCloseContext.Provider>
        </Animated.View>
      </GestureDetector>
    </View>
  );
}

type FloatingSheetProps = {
  children: ReactNode;
  onClose: () => void;
  style?: StyleProp<ViewStyle>;
};

/** Card that floats above the tab bar without blocking the map (issue preview). */
export function FloatingSheet({ children, onClose, style }: FloatingSheetProps) {
  const translateY = useSharedValue(400);

  useEffect(() => {
    translateY.set(withTiming(0, OPEN));
  }, [translateY]);

  const dismiss = useCallback(
    () =>
      translateY.set(
        withTiming(400, CLOSE, (finished) => {
          if (finished) scheduleOnRN(onClose);
        }),
      ),
    [translateY, onClose],
  );

  const pan = useDismissPan(translateY, dismiss);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.get() }],
  }));

  return (
    <GestureDetector gesture={pan}>
      <Animated.View style={[styles.floating, style, animatedStyle]}>
        <Handle />
        <SheetCloseContext.Provider value={dismiss}>{children}</SheetCloseContext.Provider>
      </Animated.View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
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
