import type { BottomTabBarProps } from 'expo-router/js-tabs';
import { MapTrifoldIcon, PlusSquareIcon, UserCircleIcon, type Icon } from 'phosphor-react-native';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/theme';

export const TAB_BAR_HEIGHT = 66;

const TABS: Record<string, { label: string; icon: Icon }> = {
  index: { label: 'Mapa', icon: MapTrifoldIcon },
  activity: { label: 'Aktywność', icon: UserCircleIcon },
};

function TabButton({
  label,
  icon: IconCmp,
  active,
  onPress,
}: {
  label: string;
  icon: Icon;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="tab"
      accessibilityState={{ selected: active }}
      style={styles.tab}
    >
      <View style={[styles.indicator, active && styles.indicatorActive]}>
        <IconCmp size={23} color={active ? Colors.neutral100 : Colors.neutral700} />
      </View>
      <ThemedText type="caption" style={styles.label}>
        {label}
      </ThemedText>
    </Pressable>
  );
}

/** Mapa · Zgłoś · Aktywność. "Zgłoś" is an action (opens the method sheet), not a route. */
export function TabBar({
  state,
  navigation,
  onReport,
}: BottomTabBarProps & { onReport: () => void }) {
  const insets = useSafeAreaInsets();
  const go = (name: string) => navigation.navigate(name as never);
  const current = state.routes[state.index]?.name;

  return (
    <View
      style={[styles.bar, { height: TAB_BAR_HEIGHT + insets.bottom, paddingBottom: insets.bottom }]}
    >
      <TabButton {...TABS.index} active={current === 'index'} onPress={() => go('index')} />
      <TabButton label="Zgłoś" icon={PlusSquareIcon} active={false} onPress={onReport} />
      <TabButton
        {...TABS.activity}
        active={current === 'activity'}
        onPress={() => go('activity')}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'stretch',
    backgroundColor: Colors.neutral100,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.divider,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  },
  indicator: {
    width: 60,
    height: 32,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  indicatorActive: {
    backgroundColor: Colors.accent,
    borderRadius: 50,
  },
  label: {
    fontSize: 12,
    color: Colors.text,
  },
});
