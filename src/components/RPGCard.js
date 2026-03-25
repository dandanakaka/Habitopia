import React from 'react';
import { View, StyleSheet } from 'react-native';
import { colors, shape } from '../theme/theme';

export default function RPGCard({ children, style, variant = 'default' }) {
  const variantStyles = {
    default: { backgroundColor: colors.surface, borderColor: colors.outlineVariant },
    elevated: { backgroundColor: colors.surfaceContainer, borderColor: colors.outline },
    purple: { backgroundColor: colors.surface, borderColor: colors.primaryContainer, borderWidth: 2 },
    warning: { backgroundColor: colors.errorContainer, borderColor: colors.error, borderWidth: 1 },
  };
  const v = variantStyles[variant] || variantStyles.default;

  return (
    <View style={[styles.card, v, style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: shape.borderWidth,
    borderRadius: shape.radius,
    padding: 12,
  },
});
