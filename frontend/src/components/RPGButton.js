import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { colors, fonts, shape } from '../theme';

export default function RPGButton({ title, onPress, variant = 'primary', style, disabled = false }) {
  const variants = {
    primary: { bg: colors.secondary, text: '#000000', border: colors.secondary },
    accent: { bg: colors.primaryContainer, text: '#ffffff', border: colors.primary },
    ghost: { bg: 'transparent', text: colors.onSurfaceVariant, border: colors.outline },
    danger: { bg: colors.errorContainer, text: colors.error, border: colors.error },
  };
  const v = variants[variant] || variants.primary;

  return (
    <TouchableOpacity
      style={[
        styles.button,
        { backgroundColor: v.bg, borderColor: v.border },
        disabled && styles.disabled,
        style,
      ]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.7}
    >
      <Text style={[styles.text, { color: v.text }]}>{title}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: shape.radius,
    borderWidth: shape.borderWidthThick,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontFamily: fonts.headline,
    fontSize: 14,
    letterSpacing: 2,
  },
  disabled: { opacity: 0.35 },
});
