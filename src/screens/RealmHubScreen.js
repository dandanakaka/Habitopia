import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity } from 'react-native';
import { colors, fonts, spacing, shape } from '../theme/theme';
import RPGButton from '../components/RPGButton';
import useAuthStore from '../store/authStore';

export default function RealmHubScreen({ navigation }) {
  const username = useAuthStore((s) => s.user?.username);

  const options = [
    { title: 'CREATE REALM', icon: '🏰', desc: 'Forge a new village. You are the architect.', onPress: () => navigation.replace('MainTabs') },
    { title: 'JOIN REALM', icon: '🗝️', desc: 'Enter an existing village with an invite code.', onPress: () => navigation.replace('MainTabs') },
    { title: 'ACCESS REALM', icon: '⚡', desc: 'Return to your active village.', variant: 'primary', onPress: () => navigation.replace('MainTabs') },
  ];

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.topBar}>
        <View style={s.topBarLeft}>
          <Text style={s.topBarIcon}>⬡</Text>
          <Text style={s.topBarTitle}>HABITOPIA_SYS</Text>
        </View>
        <Text style={s.topBarIcon}>⏻</Text>
      </View>

      <View style={s.container}>
        <Text style={s.greeting}>WELCOME BACK,</Text>
        <Text style={s.username}>{username?.toUpperCase() || 'COMMANDER'}</Text>
        <Text style={s.sectionLabel}>{'> '}SELECT_ACTION:</Text>

        {options.map((opt, i) => (
          <TouchableOpacity key={i} style={[s.optionCard, opt.variant === 'primary' && s.optionActive]} onPress={opt.onPress} activeOpacity={0.7}>
            <View style={s.optionIconBox}><Text style={s.optionIcon}>{opt.icon}</Text></View>
            <View style={s.optionInfo}>
              <Text style={s.optionTitle}>{opt.title}</Text>
              <Text style={s.optionDesc}>{opt.desc}</Text>
            </View>
            <Text style={s.optionArrow}>→</Text>
          </TouchableOpacity>
        ))}
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  topBar: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.outline,
  },
  topBarLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  topBarIcon: { color: colors.secondary, fontSize: 16 },
  topBarTitle: { fontFamily: fonts.headline, fontSize: 13, color: colors.secondary, letterSpacing: 2 },
  container: { flex: 1, paddingHorizontal: 16, paddingTop: 30 },
  greeting: { fontFamily: fonts.label, fontSize: 11, color: colors.onSurfaceVariant, letterSpacing: 3 },
  username: { fontFamily: fonts.headline, fontSize: 24, color: colors.secondary, letterSpacing: 2, marginBottom: 20 },
  sectionLabel: { fontFamily: fonts.label, fontSize: 11, color: colors.secondary, letterSpacing: 2, marginBottom: 12 },
  optionCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14,
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.outlineVariant,
    borderRadius: shape.radius, marginBottom: 10,
  },
  optionActive: { borderColor: colors.secondary, borderWidth: 2 },
  optionIconBox: {
    width: 42, height: 42, backgroundColor: colors.surfaceContainer,
    borderWidth: 1, borderColor: colors.outline, alignItems: 'center', justifyContent: 'center',
  },
  optionIcon: { fontSize: 20 },
  optionInfo: { flex: 1 },
  optionTitle: { fontFamily: fonts.headline, fontSize: 14, color: colors.onSurface, letterSpacing: 2 },
  optionDesc: { fontFamily: fonts.body, fontSize: 11, color: colors.onSurfaceVariant, marginTop: 2 },
  optionArrow: { fontFamily: fonts.headline, fontSize: 18, color: colors.secondary },
});
