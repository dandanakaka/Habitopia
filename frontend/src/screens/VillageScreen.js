import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, Alert, Platform, TouchableOpacity } from 'react-native';
import { colors, fonts, spacing, shape, glow } from '../theme/theme';
import ProgressBar from '../components/ProgressBar';
import RPGButton from '../components/RPGButton';
import useRealmStore from '../store/realmStore';
import useHabitStore from '../store/habitStore';

export default function VillageScreen() {
  const { realm, memberProfiles, inviteLink, generateInviteLink } = useRealmStore();
  const habits = useHabitStore((s) => s.habits);
  const [showLink, setShowLink] = useState(false);

  const completedCount = habits.filter((h) => h.completed).length;
  const totalXP = habits.filter((h) => h.completed).reduce((s, h) => s + h.xp, 0);

  const handleInvite = () => {
    const link = generateInviteLink();
    setShowLink(true);
    if (Platform.OS === 'web') alert(`Invite Link:\n${link}`);
    else Alert.alert('Invite Link', link, [{ text: 'OK' }]);
  };

  const healthColor = realm.health >= 70 ? colors.secondary : realm.health >= 40 ? colors.tertiary : colors.error;

  return (
    <SafeAreaView style={s.safe}>
      {/* Top Bar */}
      <View style={s.topBar}>
        <View style={s.topBarLeft}>
          <Text style={s.topBarGrid}>⊞</Text>
          <Text style={s.topBarTitle}>HABIT_VILLAGE_V1.0</Text>
        </View>
        <View style={s.avatar}><Text style={s.avatarText}>🧙</Text></View>
      </View>

      <ScrollView style={s.scroll} showsVerticalScrollIndicator={false}>
        {/* Realm Header */}
        <View style={s.realmHeader}>
          <Text style={s.realmIcon}>🏰</Text>
          <Text style={s.realmName}>{realm.name.toUpperCase()}</Text>
          <Text style={s.realmId}>REALM_ID: {realm.id.toUpperCase()} // {realm.members.length} MEMBERS</Text>
        </View>

        {/* Health Panel */}
        <View style={s.panel}>
          <Text style={s.panelLabel}>{'> '}VILLAGE_HEALTH:</Text>
          <View style={s.healthRow}>
            <Text style={[s.healthValue, { color: healthColor }]}>{realm.health}</Text>
            <Text style={s.healthMax}>/100 HP</Text>
          </View>
          <View style={s.healthTrack}>
            <View style={[s.healthFill, { width: `${realm.health}%`, backgroundColor: healthColor }]} />
          </View>
          <Text style={s.healthStatus}>
            {realm.health >= 70 ? 'STATUS: STABLE' : realm.health >= 40 ? 'STATUS: DECLINING' : 'STATUS: CRITICAL'}
          </Text>
        </View>

        {/* Session Stats */}
        <View style={s.panel}>
          <Text style={s.panelLabel}>{'> '}SESSION_STATS:</Text>
          <View style={s.statsGrid}>
            <View style={s.statBox}>
              <Text style={s.statValue}>{completedCount}</Text>
              <Text style={s.statLabel}>COMPLETED</Text>
            </View>
            <View style={s.statDivider} />
            <View style={s.statBox}>
              <Text style={[s.statValue, { color: colors.secondary }]}>{totalXP}</Text>
              <Text style={s.statLabel}>XP EARNED</Text>
            </View>
            <View style={s.statDivider} />
            <View style={s.statBox}>
              <Text style={s.statValue}>{habits.length}</Text>
              <Text style={s.statLabel}>TOTAL</Text>
            </View>
          </View>
        </View>

        {/* Members */}
        <Text style={s.sectionLabel}>{'> '}MEMBER_LOG:</Text>
        {memberProfiles.map((m) => (
          <View key={m.id} style={s.memberRow}>
            <View style={s.memberIconBox}>
              <Text style={s.memberIcon}>{m.id === 'u1' ? '🧙' : '🗡️'}</Text>
            </View>
            <View style={s.memberInfo}>
              <Text style={s.memberName}>{m.username.toUpperCase()}</Text>
              <Text style={s.memberMeta}>XP: {m.xp} // STREAK: {m.streak}d // DONE: {m.habitsCompleted}</Text>
            </View>
            <View style={s.memberXPBadge}>
              <Text style={s.memberXPText}>{m.xp}</Text>
            </View>
          </View>
        ))}

        {/* Invite */}
        <RPGButton title="⚡ GENERATE_INVITE_LINK" variant="accent" onPress={handleInvite} style={s.inviteBtn} />

        {showLink && inviteLink && (
          <View style={s.linkBox}>
            <Text style={s.linkLabel}>{'> '}INVITE_LINK:</Text>
            <Text style={s.linkText} selectable>{inviteLink}</Text>
          </View>
        )}
        <View style={{ height: 20 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  topBar: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 14, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colors.outline,
  },
  topBarLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  topBarGrid: { color: colors.onSurface, fontSize: 18 },
  topBarTitle: { fontFamily: fonts.headline, fontSize: 13, color: colors.onSurface, letterSpacing: 2 },
  avatar: {
    width: 30, height: 30, backgroundColor: colors.surfaceContainer, borderWidth: 1,
    borderColor: colors.primaryContainer, alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { fontSize: 16 },
  scroll: { flex: 1, paddingHorizontal: 14 },

  // Realm Header
  realmHeader: { alignItems: 'center', paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: colors.outlineVariant },
  realmIcon: { fontSize: 32, marginBottom: 4 },
  realmName: { fontFamily: fonts.headline, fontSize: 22, color: colors.secondary, letterSpacing: 3 },
  realmId: { fontFamily: fonts.label, fontSize: 9, color: colors.onSurfaceVariant, letterSpacing: 2, marginTop: 2 },

  // Panels
  panel: {
    marginTop: 12, borderWidth: 1, borderColor: colors.outlineVariant,
    backgroundColor: colors.surface, padding: 12,
  },
  panelLabel: { fontFamily: fonts.label, fontSize: 11, color: colors.secondary, letterSpacing: 2, marginBottom: 8 },
  healthRow: { flexDirection: 'row', alignItems: 'baseline', marginBottom: 6 },
  healthValue: { fontFamily: fonts.headline, fontSize: 36 },
  healthMax: { fontFamily: fonts.label, fontSize: 13, color: colors.onSurfaceVariant, marginLeft: 2 },
  healthTrack: { height: 6, backgroundColor: colors.surfaceContainerHighest, overflow: 'hidden' },
  healthFill: { height: 6 },
  healthStatus: { fontFamily: fonts.label, fontSize: 9, color: colors.onSurfaceVariant, letterSpacing: 2, marginTop: 6 },

  // Stats
  statsGrid: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  statBox: { flex: 1, alignItems: 'center' },
  statValue: { fontFamily: fonts.headline, fontSize: 20, color: colors.onSurface },
  statLabel: { fontFamily: fonts.label, fontSize: 8, color: colors.onSurfaceVariant, letterSpacing: 1.5, marginTop: 2 },
  statDivider: { width: 1, height: 28, backgroundColor: colors.outlineVariant },

  // Section
  sectionLabel: { fontFamily: fonts.label, fontSize: 11, color: colors.secondary, letterSpacing: 2, marginTop: 14, marginBottom: 8 },

  // Members
  memberRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.outlineVariant,
    padding: 10, marginBottom: 6,
  },
  memberIconBox: {
    width: 36, height: 36, backgroundColor: colors.surfaceContainer,
    borderWidth: 1, borderColor: colors.outline, alignItems: 'center', justifyContent: 'center',
  },
  memberIcon: { fontSize: 18 },
  memberInfo: { flex: 1 },
  memberName: { fontFamily: fonts.headline, fontSize: 12, color: colors.onSurface, letterSpacing: 1.5 },
  memberMeta: { fontFamily: fonts.label, fontSize: 9, color: colors.onSurfaceVariant, letterSpacing: 1, marginTop: 1 },
  memberXPBadge: {
    backgroundColor: colors.surfaceContainer, borderWidth: 1, borderColor: colors.secondary,
    paddingHorizontal: 8, paddingVertical: 3,
  },
  memberXPText: { fontFamily: fonts.headline, fontSize: 12, color: colors.secondary },

  // Invite
  inviteBtn: { marginTop: 16 },
  linkBox: {
    marginTop: 8, borderWidth: 1, borderColor: colors.outlineVariant,
    backgroundColor: colors.surface, padding: 10,
  },
  linkLabel: { fontFamily: fonts.label, fontSize: 9, color: colors.secondary, letterSpacing: 1.5, marginBottom: 4 },
  linkText: { fontFamily: fonts.body, fontSize: 11, color: colors.primaryDim },
});
