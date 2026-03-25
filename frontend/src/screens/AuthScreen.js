import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, SafeAreaView, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { colors, fonts, spacing, shape } from '../theme/theme';
import useAuthStore from '../store/authStore';

export default function AuthScreen({ navigation }) {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [focusField, setFocusField] = useState(null);
  const login = useAuthStore((s) => s.login);

  const handleSubmit = () => {
    if (!username.trim() || !password.trim()) return;
    login(username.trim(), password);
    navigation.replace('RealmHub');
  };

  return (
    <SafeAreaView style={s.safe}>
      {/* System Top Bar */}
      <View style={s.topBar}>
        <View style={s.topBarLeft}>
          <Text style={s.topBarIcon}>⬡</Text>
          <Text style={s.topBarTitle}>HABITOPIA_SYS</Text>
        </View>
        <TouchableOpacity><Text style={s.topBarIcon}>⏻</Text></TouchableOpacity>
      </View>

      <KeyboardAvoidingView style={s.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        {/* Hero */}
        <Text style={s.hero}>HABITOPIA</Text>
        <Text style={s.heroSub}>SYSTEM_INIT // AUTHENTICATION</Text>

        {/* Auth Card — purple dashed border */}
        <View style={s.authCard}>
          <Text style={s.accessTitle}>ACCESS YOUR SYSTEM</Text>
          <Text style={s.accessDesc}>Continue your streak. Rebuild your village.</Text>

          <Text style={s.inputLabel}>{'> '}USER_ID / EMAIL</Text>
          <TextInput
            style={[s.input, focusField === 'user' && s.inputFocus]}
            value={username}
            onChangeText={setUsername}
            placeholder="commander@habitopia.sys"
            placeholderTextColor={colors.onSurfaceVariant}
            onFocus={() => setFocusField('user')}
            onBlur={() => setFocusField(null)}
            selectionColor={colors.secondary}
          />

          <Text style={s.inputLabel}>{'> '}PASS_CODE</Text>
          <TextInput
            style={[s.input, focusField === 'pass' && s.inputFocus]}
            value={password}
            onChangeText={setPassword}
            placeholder="********"
            placeholderTextColor={colors.onSurfaceVariant}
            secureTextEntry
            onFocus={() => setFocusField('pass')}
            onBlur={() => setFocusField(null)}
            selectionColor={colors.secondary}
          />

          {/* Submit */}
          <TouchableOpacity style={s.submitBtn} onPress={handleSubmit} activeOpacity={0.8}>
            <Text style={s.submitText}>INITIALIZE SESSION</Text>
          </TouchableOpacity>

          {/* Toggle */}
          <TouchableOpacity onPress={() => setIsLogin(!isLogin)}>
            <Text style={s.toggleText}>
              {isLogin ? 'NO SQUAD? [ ' : 'HAVE ACCOUNT? [ '}
              <Text style={s.toggleBold}>{isLogin ? 'CREATE ONE' : 'LOGIN'}</Text>
              {' ]'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Footer Status */}
        <View style={s.footer}>
          <View style={s.statusDots}>
            <View style={s.dot} />
            <View style={s.dot} />
            <View style={[s.dot, s.dotActive]} />
          </View>
          <Text style={s.footerText}>
            DATA_LINK: <Text style={s.footerGreen}>ACTIVE</Text> SECURED_BY_HABIT_PROTOCOL_V4
          </Text>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  topBar: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: colors.outline,
  },
  topBarLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  topBarIcon: { color: colors.secondary, fontSize: 16 },
  topBarTitle: { fontFamily: fonts.headline, fontSize: 13, color: colors.secondary, letterSpacing: 2 },
  container: { flex: 1, justifyContent: 'center', paddingHorizontal: 20 },
  hero: { fontFamily: fonts.headline, fontSize: 38, color: colors.secondary, textAlign: 'center', letterSpacing: 4 },
  heroSub: {
    fontFamily: fonts.label, fontSize: 11, color: colors.secondary, textAlign: 'center',
    letterSpacing: 3, marginTop: 4, marginBottom: 24,
  },
  authCard: {
    borderWidth: 2, borderColor: colors.primaryContainer, borderStyle: 'dashed',
    borderRadius: shape.radius, backgroundColor: colors.surface, padding: 20,
  },
  accessTitle: { fontFamily: fonts.headline, fontSize: 18, color: colors.onSurface, marginBottom: 6 },
  accessDesc: { fontFamily: fonts.body, fontSize: 13, color: colors.onSurfaceVariant, marginBottom: 20, lineHeight: 18 },
  inputLabel: { fontFamily: fonts.label, fontSize: 11, color: colors.secondary, letterSpacing: 2, marginBottom: 5 },
  input: {
    backgroundColor: colors.surfaceContainerLowest, borderWidth: 1, borderColor: colors.outline,
    borderRadius: shape.radius, paddingVertical: 12, paddingHorizontal: 14,
    fontFamily: fonts.body, fontSize: 14, color: colors.onSurface, marginBottom: 16,
  },
  inputFocus: { borderColor: colors.secondary, borderWidth: 2 },
  submitBtn: {
    backgroundColor: colors.secondary, paddingVertical: 14, alignItems: 'center',
    borderRadius: shape.radius, marginTop: 4, marginBottom: 16,
  },
  submitText: { fontFamily: fonts.headline, fontSize: 15, color: '#000000', letterSpacing: 3 },
  toggleText: { fontFamily: fonts.label, fontSize: 11, color: colors.onSurfaceVariant, textAlign: 'center', letterSpacing: 1 },
  toggleBold: { color: colors.onSurface, textDecorationLine: 'underline' },
  footer: { alignItems: 'center', marginTop: 30, gap: 6 },
  statusDots: { flexDirection: 'row', gap: 4 },
  dot: { width: 8, height: 8, backgroundColor: colors.outline, borderRadius: 0 },
  dotActive: { backgroundColor: colors.secondary },
  footerText: { fontFamily: fonts.label, fontSize: 9, color: colors.onSurfaceVariant, letterSpacing: 1.5 },
  footerGreen: { color: colors.secondary },
});
