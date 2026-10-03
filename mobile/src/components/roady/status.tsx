import {
  CheckCircleIcon,
  ProhibitIcon,
  WarningCircleIcon,
  WrenchIcon,
  type Icon,
} from 'phosphor-react-native';
import { StyleSheet, View } from 'react-native';

import type { ProblemStatus } from '@/api/types';
import { ThemedText } from '@/components/themed-text';
import { Colors, Fonts } from '@/constants/theme';
import { STATUS_LABELS } from '@/lib/format';

export const STATUS_ICONS: Record<ProblemStatus, Icon> = {
  new: WarningCircleIcon,
  in_progress: WrenchIcon,
  resolved: CheckCircleIcon,
  rejected: ProhibitIcon,
};

/** Magenta pill for open problems, cyan once resolved. */
export function StatusPill({ status }: { status: ProblemStatus }) {
  const IconCmp = STATUS_ICONS[status];
  const resolved = status === 'resolved';
  const fg = resolved ? Colors.accent800 : Colors.accent2_800;
  return (
    <View
      style={[styles.pill, { backgroundColor: resolved ? Colors.accent100 : Colors.accent2_100 }]}
    >
      <IconCmp size={18} color={fg} />
      <ThemedText type="small" style={{ color: fg, fontFamily: Fonts.semibold }}>
        {STATUS_LABELS[status]}
      </ThemedText>
    </View>
  );
}

/** Inline status line used in the preview sheet. */
export function StatusLine({ status }: { status: ProblemStatus }) {
  const IconCmp = STATUS_ICONS[status];
  return (
    <View style={styles.line}>
      <IconCmp size={20} color={Colors.accent2_700} />
      <ThemedText type="body" bold style={{ fontSize: 15 }}>
        {STATUS_LABELS[status]}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 34,
    paddingHorizontal: 12,
    borderRadius: 17,
    alignSelf: 'flex-start',
  },
  line: { flexDirection: 'row', alignItems: 'center', gap: 10 },
});
