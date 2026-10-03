import { StyleSheet, Text, View } from 'react-native';

import { Colors, Fonts, Shadows } from '@/constants/theme';
import { CategoryIcon } from '@/lib/category-icons';
import type { Severity } from '@/lib/format';

const TIER = {
  low: {
    size: 30,
    icon: 17,
    border: 1.5,
    bg: Colors.neutral100,
    ring: Colors.neutral500,
    fg: Colors.neutral800,
  },
  mid: {
    size: 35,
    icon: 19,
    border: 2.5,
    bg: Colors.neutral100,
    ring: Colors.accent,
    fg: Colors.accent700,
  },
  high: {
    size: 41,
    icon: 22,
    border: 2.5,
    bg: Colors.accent2_600,
    ring: Colors.neutral100,
    fg: Colors.neutral100,
  },
} as const;

type ProblemMarkerProps = {
  icon: string;
  tier: Severity;
  severity: number;
  selected?: boolean;
};

/**
 * Map marker: the icon shows the type; severity is carried by size, fill and a
 * number badge (4-5), so it never depends on color alone.
 */
export function ProblemMarker({ icon, tier, severity, selected }: ProblemMarkerProps) {
  const t = TIER[tier];
  return (
    <View style={styles.box}>
      {selected && <View style={styles.selection} />}
      <View
        style={[
          styles.disc,
          tier === 'low' ? Shadows.sm : Shadows.md,
          {
            width: t.size,
            height: t.size,
            borderRadius: t.size / 2,
            borderWidth: t.border,
            borderColor: t.ring,
            backgroundColor: t.bg,
          },
        ]}
      >
        <CategoryIcon name={icon} size={t.icon} color={t.fg} weight="duotone" />
        {tier === 'high' && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{severity}</Text>
          </View>
        )}
      </View>
    </View>
  );
}

/** Ink disc with a count, so clusters don't read as incidents. */
export function ClusterMarker({ count }: { count: number }) {
  return (
    <View style={styles.clusterHalo}>
      <View style={styles.cluster}>
        <Text style={styles.clusterText}>{count}</Text>
      </View>
    </View>
  );
}

type CategoryDiscProps = {
  icon: string;
  tier: Severity | 'neutral';
  size?: number;
};

/** Larger category disc used in sheets, details and lists. */
export function CategoryDisc({ icon, tier, size = 52 }: CategoryDiscProps) {
  const style = {
    high: { backgroundColor: Colors.accent2_600, color: Colors.neutral100 },
    mid: {
      backgroundColor: Colors.accent100,
      borderWidth: 2.5,
      borderColor: Colors.accent,
      color: Colors.accent700,
    },
    low: {
      backgroundColor: Colors.neutral200,
      borderWidth: 1.5,
      borderColor: Colors.neutral500,
      color: Colors.neutral800,
    },
    neutral: { backgroundColor: Colors.neutral200, color: Colors.neutral800 },
  }[tier];
  const { color, ...bg } = style;
  return (
    <View style={[styles.categoryDisc, bg, { width: size, height: size, borderRadius: size / 2 }]}>
      <CategoryIcon name={icon} size={Math.round(size * 0.54)} color={color} weight="duotone" />
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    width: 52,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selection: {
    position: 'absolute',
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 2.5,
    borderColor: Colors.text,
    backgroundColor: 'rgba(14, 21, 20, 0.1)',
  },
  disc: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: -6,
    right: -8,
    minWidth: 19,
    height: 19,
    paddingHorizontal: 4,
    borderRadius: 10,
    backgroundColor: Colors.text,
    borderWidth: 1.5,
    borderColor: Colors.neutral100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    color: Colors.neutral100,
    fontSize: 11,
    fontFamily: Fonts.semibold,
    lineHeight: 14,
  },
  clusterHalo: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: 'rgba(14, 21, 20, 0.14)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cluster: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.text,
    borderWidth: 2,
    borderColor: Colors.neutral100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clusterText: {
    color: Colors.bg,
    fontFamily: Fonts.semibold,
    fontSize: 16,
  },
  categoryDisc: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
