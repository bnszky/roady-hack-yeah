import { StyleSheet, View } from 'react-native';

import { Colors } from '@/constants/theme';

/** Bars from live mic levels (0..1 each), centered like the design's hybrid voice screen. */
export function Waveform({ levels, height = 120 }: { levels: number[]; height?: number }) {
  return (
    <View style={[styles.row, { height }]} accessibilityElementsHidden>
      {levels.map((ratio, i) => (
        <View
          key={i}
          style={[
            styles.bar,
            { height: Math.max(6, ratio * height), opacity: 0.35 + ratio * 0.65 },
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  bar: {
    width: 6,
    borderRadius: 3,
    backgroundColor: Colors.text,
  },
});
