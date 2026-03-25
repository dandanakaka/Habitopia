import React, { useState } from 'react';
import { View, TextInput, Text, StyleSheet } from 'react-native';
import { colors, fonts, shape } from '../theme/theme';

export default function RPGInput({ label, value, onChangeText, placeholder, secureTextEntry = false, style }) {
  const [focused, setFocused] = useState(false);

  return (
    <View style={[styles.container, style]}>
      {label && <Text style={styles.label}>{'> '}{label}</Text>}
      <TextInput
        style={[styles.input, focused && styles.inputFocused]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.onSurfaceVariant}
        secureTextEntry={secureTextEntry}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        selectionColor={colors.secondary}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: 14 },
  label: {
    fontFamily: fonts.label,
    fontSize: 11,
    color: colors.secondary,
    marginBottom: 5,
    letterSpacing: 2,
  },
  input: {
    backgroundColor: colors.surfaceContainerLowest,
    borderWidth: shape.borderWidth,
    borderColor: colors.outline,
    borderRadius: shape.radius,
    paddingVertical: 12,
    paddingHorizontal: 14,
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.onSurface,
  },
  inputFocused: {
    borderColor: colors.secondary,
    borderWidth: 2,
  },
});
