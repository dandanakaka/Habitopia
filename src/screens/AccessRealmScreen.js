import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity } from 'react-native';
import { colors, fonts, spacing, shape, glow } from '../theme/theme';

const MOCK_REALMS = [
  { id: 'r1', name: 'The Iron Village', health: 85, members: 2, status: 'STABLE' },
  { id: 'r2', name: 'Shadow Forge', health: 42, members: 4, status: 'DECLINING' },
  { id: 'r3', name: 'Neon Citadel', health: 96, members: 3, status: 'THRIVING' },
];

function getHealthColor(health) {
  if (health >= 70) return colors.secondary;
  if (health >= 40) return colors.tertiary;
  return colors.error;
}

export default function AccessRealmScreen({ navigation }) {
  const handleSelect = (realmId) => {
    navigation.replace('MainTabs');
  };

  return (
    <SafeAreaView style={s.safe}>
      {/* Top Bar */}
      <View style={s.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
          <Text style={s.backText}>← BACK</Text>
        </TouchableOpacity>
        <Text style={s.topBarTitle}>ACCESS_REALM</Text>
      </View>

      <ScrollView style={s.scroll} showsVerticalScrollIndicator={false}>
        <Text style={s.sectionLabel}>{'> '}YOUR_REALMS:</Text>
        <Text style={s.desc}>Select a realm to enter. Active realms are listed below.</Text>

        {MOCK_REALMS.map((realm) => {
          const healthColor = getHealthColor(realm.health);
          return (
            <TouchableOpacity
              key={realm.id}
              style={s.realmCard}
              onPress={() => handleSelect(realm.id)}
              activeOpacity={0.7}
            >
              <View style={s.realmRow}>
                <View style={s.realmIconBox}>
                  <Text style={s.realmIcon}>{realm.health >= 70 ? '🏰' : realm.health >= 40 ? '🏗️' : '🏚️'}</Text>
                </View>
                <View style={s.realmInfo}>
                  <Text style={s.realmName}>{realm.name.toUpperCase()}</Text>
                  <Text style={s.realmMeta}>{realm.members} MEMBERS // {realm.status}</Text>
                </View>
                <View style={s.healthBadge}>
                  <Text style={[s.healthText, { color: healthColor }]}>{realm.health}</Text>
                  <Text style={s.healthUnit}>HP</Text>
                </View>
              </View>
              <View style={s.healthTrack}>
                <View style={[s.healthFill, { width: `${realm.health}%`, backgroundColor: healthColor }]} />
              </View>
            </TouchableOpacity>
          );
        })}

        <View style={s.emptyNotice}>
          <Text style={s.emptyText}>{'>'} NO MORE REALMS FOUND</Text>
        </View>
        <View style={{ height: 30 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  topBar: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 16, paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: colors.outline,
  },
  backBtn: { paddingVertical: 4, paddingRight: 8 },
  backText: { fontFamily: fonts.label, fontSize: 11, color: colors.secondary, letterSpacing: 2 },
  topBarTitle: { fontFamily: fonts.headline, fontSize: 13, color: colors.onSurface, letterSpacing: 2 },
  scroll: { flex: 1, paddingHorizontal: 16, paddingTop: 20 },
  sectionLabel: { fontFamily: fonts.label, fontSize: 11, color: colors.secondary, letterSpacing: 2, marginBottom: 6 },
  desc: { fontFamily: fonts.body, fontSize: 12, color: colors.onSurfaceVariant, lineHeight: 18, marginBottom: 20 },
  realmCard: {
    borderWidth: 1, borderColor: colors.outlineVariant, backgroundColor: colors.surface,
    padding: 14, marginBottom: 10,
  },
  realmRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10 },
  realmIconBox: {
    width: 40, height: 40, backgroundColor: colors.surfaceContainer,
    borderWidth: 1, borderColor: colors.outline, alignItems: 'center', justifyContent: 'center',
  },
  realmIcon: { fontSize: 20 },
  realmInfo: { flex: 1 },
  realmName: { fontFamily: fonts.headline, fontSize: 13, color: colors.onSurface, letterSpacing: 2 },
  realmMeta: { fontFamily: fonts.label, fontSize: 9, color: colors.onSurfaceVariant, letterSpacing: 1.5, marginTop: 2 },
  healthBadge: { alignItems: 'center' },
  healthText: { fontFamily: fonts.headline, fontSize: 18 },
  healthUnit: { fontFamily: fonts.label, fontSize: 8, color: colors.onSurfaceVariant, letterSpacing: 1 },
  healthTrack: { height: 4, backgroundColor: colors.surfaceContainerHighest, overflow: 'hidden' },
  healthFill: { height: 4 },
  emptyNotice: {
    borderWidth: 1, borderColor: colors.outlineVariant, borderStyle: 'dashed',
    padding: 16, alignItems: 'center', marginTop: 10,
  },
  emptyText: { fontFamily: fonts.label, fontSize: 10, color: colors.onSurfaceVariant, letterSpacing: 2 },
});
