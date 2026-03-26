import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity } from 'react-native';
import { colors, fonts, spacing, shape, glow } from '../theme/theme';
import useAuthStore from '../store/authStore';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';

export default function RealmHubScreen({ navigation }) {
  const user = useAuthStore((s) => s.user);
  const displayName = user?.displayName || 'COMMANDER';

  const options = [
    { title: 'CREATE REALM', icon: '🏰', desc: 'Forge a new village. You are the architect.', screen: 'CreateRealm' },
    { title: 'JOIN REALM', icon: '🗝️', desc: 'Enter an existing village with an invite code.', screen: 'JoinRealm' },
    { title: 'ACCESS REALM', icon: '⚡', desc: 'Return to your active village.', variant: 'primary', screen: 'AccessRealm' },
  ];

  return (
    <SafeAreaView style={s.safe}>
      {/* Top Bar — no power button */}
      <View style={s.topBar}>
        <View style={s.topBarLeft}>
          <Text style={s.topBarIcon}>⬡</Text>
          <Text style={s.topBarTitle}>HABITOPIA_SYS</Text>
        </View>
      </View>

      <View style={s.container}>
        <Text style={s.greeting}>WELCOME BACK,</Text>
        <Text style={s.username}>{displayName.toUpperCase()}</Text>
        <Text style={s.sectionLabel}>{'> '}SELECT_ACTION:</Text>

        <View style={s.cardStack}>
          {options.map((opt, i) => (
            <TouchableOpacity
              key={i}
              style={[s.optionCard, opt.variant === 'primary' && s.optionActive]}
              onPress={() => navigation.navigate(opt.screen)}
              activeOpacity={0.7}
            >
              <View style={s.optionIconBox}><Text style={s.optionIcon}>{opt.icon}</Text></View>
              <View style={s.optionInfo}>
                <Text style={s.optionTitle}>{opt.title}</Text>
                <Text style={s.optionDesc}>{opt.desc}</Text>
              </View>
              <Text style={s.optionArrow}>→</Text>
            </TouchableOpacity>
          ))}
        </View>
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
  container: { flex: 1, paddingHorizontal: 20, paddingTop: 30, alignItems: 'center' },
  greeting: { fontFamily: fonts.label, fontSize: 11, color: colors.onSurfaceVariant, letterSpacing: 3, alignSelf: 'flex-start' },
  username: { fontFamily: fonts.headline, fontSize: 24, color: colors.secondary, letterSpacing: 2, marginBottom: 20, alignSelf: 'flex-start' },
  sectionLabel: { fontFamily: fonts.label, fontSize: 11, color: colors.secondary, letterSpacing: 2, marginBottom: 16, alignSelf: 'flex-start' },
  cardStack: { width: '100%', maxWidth: 340, gap: 12 },
  optionCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16,
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.outlineVariant,
    borderRadius: shape.radius,
  },
  optionActive: { borderWidth: 2 },
  optionIconBox: {
    width: 44, height: 44, backgroundColor: colors.surfaceContainer,
    borderWidth: 1, borderColor: colors.outline, alignItems: 'center', justifyContent: 'center',
  },
  optionIcon: { fontSize: 22 },
  optionInfo: { flex: 1 },
  optionTitle: { fontFamily: fonts.headline, fontSize: 14, color: colors.onSurface, letterSpacing: 2 },
  optionDesc: { fontFamily: fonts.body, fontSize: 11, color: colors.onSurfaceVariant, marginTop: 2 },
  optionArrow: { fontFamily: fonts.headline, fontSize: 18, color: colors.secondary },
});
