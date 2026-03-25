import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, fonts, shape } from '../theme/theme';

export default function ProgressBar({ value = 0, max = 100, label, color, height = 6 }) {
  const pct = Math.min(Math.max((value / max) * 100, 0), 100);
  const barColor = color || colors.secondary;

  return (
    <View style={styles.container}>
      {label && (
        <View style={styles.labelRow}>
          <Text style={styles.label}>{label}</Text>
          <Text style={[styles.value, { color: barColor }]}>{value}/{max}</Text>
        </View>
      )}
      <View style={[styles.track, { height }]}>
        <View style={[styles.fill, { width: `${pct}%`, backgroundColor: barColor, height }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { width: '100%' },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  label: {
    fontFamily: fonts.label,
    fontSize: 10,
    color: colors.onSurfaceVariant,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  value: {
    fontFamily: fonts.headline,
    fontSize: 12,
    color: colors.secondary,
  },
  track: {
    backgroundColor: colors.surfaceContainerHighest,
    borderRadius: shape.radius,
    overflow: 'hidden',
  },
  fill: {
    borderRadius: shape.radius,
  },
});
