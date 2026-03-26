import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, Alert, Platform, TouchableOpacity } from 'react-native';
import { colors, fonts, spacing, shape, glow } from '../theme/theme';
import ProgressBar from '../components/ProgressBar';
import RPGButton from '../components/RPGButton';
import ProfileModal from '../components/ProfileModal';
import useRealmStore from '../store/realmStore';
import useHabitStore from '../store/habitStore';
import useAuthStore from '../store/authStore';

function getVillageState(health) {
  if (health >= 80) return { icon: '🏰✨', label: 'THRIVING', tier: 5 };
  if (health >= 60) return { icon: '🏰', label: 'STRONG', tier: 4 };
  if (health >= 40) return { icon: '🏠', label: 'STABLE', tier: 3 };
  if (health >= 20) return { icon: '🏗️', label: 'WEAK', tier: 2 };
  return { icon: '🏚️', label: 'DECAYED', tier: 1 };
}

export default function VillageScreen({ navigation }) {
  const { realm, memberProfiles, inviteLink, generateInviteLink } = useRealmStore();
  const habits = useHabitStore((s) => s.habits);
  const user = useAuthStore((s) => s.user);
  const [showLink, setShowLink] = useState(false);
  const [showProfile, setShowProfile] = useState(false);

  const completedCount = habits.filter((h) => h.completed).length;
  const totalXP = habits.filter((h) => h.completed).reduce((s, h) => s + h.xp, 0);
  const villageState = getVillageState(realm.health);

  const handleInvite = () => {
    const link = generateInviteLink();
    setShowLink(true);
    if (Platform.OS === 'web') alert(`Invite Link:\n${link}`);
    else Alert.alert('Invite Link', link, [{ text: 'OK' }]);
  };

  const healthColor = realm.health >= 70 ? colors.secondary : realm.health >= 40 ? colors.tertiary : colors.error;

  return (
    <SafeAreaView style={s.safe}>
      {/* Top Bar — compact invite left, profile icon right */}
      <View style={s.topBar}>
        <TouchableOpacity onPress={handleInvite} style={s.inviteTopBtn} activeOpacity={0.7}>
          <Text style={s.inviteTopText}>⚡ INVITE</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setShowProfile(true)} style={s.avatar}>
          <Text style={s.avatarText}>🧙</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={s.scroll} showsVerticalScrollIndicator={false}>
        {/* Realm Header with Village State */}
        <View style={s.realmHeader}>
          <Text style={s.villageIcon}>{villageState.icon}</Text>
          <Text style={s.realmName}>{realm.name.toUpperCase()}</Text>
          <Text style={s.realmId}>REALM_ID: {realm.id.toUpperCase()} // {realm.members.length} MEMBERS</Text>
        </View>

        {/* Village State Indicator */}
        <View style={s.stateRow}>
          {[1, 2, 3, 4, 5].map((tier) => (
            <View key={tier} style={[s.stateTick, villageState.tier >= tier && { backgroundColor: healthColor }]} />
          ))}
          <Text style={[s.stateLabel, { color: healthColor }]}>{villageState.label}</Text>
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
            STATUS: {villageState.label}
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

        {/* Invite Link Box */}
        {showLink && inviteLink && (
          <View style={s.linkBox}>
            <Text style={s.linkLabel}>{'> '}INVITE_LINK:</Text>
            <Text style={s.linkText} selectable>{inviteLink}</Text>
          </View>
        )}

        {/* Habit Wrapped Button */}
        <TouchableOpacity
          style={s.wrappedBtn}
          onPress={() => navigation.navigate('HabitWrapped')}
          activeOpacity={0.7}
        >
          <Text style={s.wrappedBtnText}>📊 REALM_REPORT // MONTHLY_SUMMARY</Text>
        </TouchableOpacity>

        <View style={{ height: 20 }} />
      </ScrollView>

      <ProfileModal visible={showProfile} onClose={() => setShowProfile(false)} />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  topBar: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 14, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colors.outline,
  },
  inviteTopBtn: {
    borderWidth: 1, borderColor: colors.secondary, paddingHorizontal: 10, paddingVertical: 6,
    backgroundColor: 'rgba(76,227,70,0.08)',
  },
  inviteTopText: { fontFamily: fonts.label, fontSize: 10, color: colors.secondary, letterSpacing: 2 },
  avatar: {
    width: 30, height: 30, backgroundColor: colors.surfaceContainer, borderWidth: 1,
    borderColor: colors.primaryContainer, alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { fontSize: 16 },
  scroll: { flex: 1, paddingHorizontal: 14 },

  // Realm Header
  realmHeader: { alignItems: 'center', paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: colors.outlineVariant },
  villageIcon: { fontSize: 40, marginBottom: 4 },
  realmName: { fontFamily: fonts.headline, fontSize: 22, color: colors.secondary, letterSpacing: 3 },
  realmId: { fontFamily: fonts.label, fontSize: 9, color: colors.onSurfaceVariant, letterSpacing: 2, marginTop: 2 },

  // Village State Indicator
  stateRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 10, paddingHorizontal: 4 },
  stateTick: { width: 24, height: 6, backgroundColor: colors.surfaceContainerHighest },
  stateLabel: { fontFamily: fonts.label, fontSize: 9, letterSpacing: 2, marginLeft: 8 },

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

  // Link Box
  linkBox: {
    marginTop: 8, borderWidth: 1, borderColor: colors.outlineVariant,
    backgroundColor: colors.surface, padding: 10,
  },
  linkLabel: { fontFamily: fonts.label, fontSize: 9, color: colors.secondary, letterSpacing: 1.5, marginBottom: 4 },
  linkText: { fontFamily: fonts.body, fontSize: 11, color: colors.primaryDim },

  // Wrapped Button
  wrappedBtn: {
    marginTop: 16, borderWidth: 1, borderColor: colors.primaryContainer,
    backgroundColor: colors.surface, padding: 14, alignItems: 'center',
  },
  wrappedBtnText: { fontFamily: fonts.label, fontSize: 10, color: colors.primaryDim, letterSpacing: 2 },
});
