import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, Alert, Platform, TouchableOpacity, ActivityIndicator, Image } from 'react-native';
import { colors, fonts, spacing, shape, glow } from '../theme/theme';
import ProgressBar from '../components/ProgressBar';
import RPGButton from '../components/RPGButton';
import ProfileModal from '../components/ProfileModal';
import useRealmStore from '../store/realmStore';
import useHabitStore from '../store/habitStore';
import useAuthStore from '../store/authStore';

// Castle Assets
const CASTLE_1 = require('../../assets/castle-1.png');
const CASTLE_2 = require('../../assets/castle-2.png');
const CASTLE_3 = require('../../assets/castle-3.png');
const CASTLE_4 = require('../../assets/castle-4.png');
const CASTLE_5 = require('../../assets/castle-5.png');

function getVillageState(health) {
  if (health >= 80) return { asset: CASTLE_1, label: 'THRIVING', tier: 5 };
  if (health >= 60) return { asset: CASTLE_2, label: 'STRONG', tier: 4 };
  if (health >= 40) return { asset: CASTLE_3, label: 'STABLE', tier: 3 };
  if (health >= 20) return { asset: CASTLE_4, label: 'WEAK', tier: 2 };
  return { asset: CASTLE_5, label: 'DECAYED', tier: 1 };
}


export default function VillageScreen({ navigation }) {
  const { realm, memberProfiles, inviteCode, generateInviteCode, isLoading } = useRealmStore();
  const habits = useHabitStore((s) => s.habits);
  const user = useAuthStore((s) => s.user);
  const [showLink, setShowLink] = useState(false);
  const [showProfile, setShowProfile] = useState(false);

  const completedCount = habits.filter((h) => h.completed).length;
  const totalXP = habits.filter((h) => h.completed).reduce((s, h) => s + h.xp, 0);

  const handleInvite = () => {
    const code = generateInviteCode();
    setShowLink(true);
    if (Platform.OS === 'web') alert(`Invite Code:\n${code}`);
    else Alert.alert('Invite Code', code, [{ text: 'OK' }]);
  };

  if (isLoading || !realm) {
    return (
      <SafeAreaView style={[s.safe, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={colors.secondary} />
        <Text style={{ fontFamily: fonts.label, color: colors.secondary, marginTop: 12, letterSpacing: 2 }}>ESTABLISHING_LINK...</Text>
      </SafeAreaView>
    );
  }

  const healthVal = typeof realm.health === 'number' ? realm.health : 0;
  const villageState = getVillageState(healthVal);
  const healthColor = healthVal >= 70 ? colors.secondary : healthVal >= 40 ? colors.tertiary : colors.error;
  const rName = realm.names || realm.name || 'UNKNOWN REALM';
  const membersCount = Array.isArray(realm.members) ? realm.members.length : 0;

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
          <Image source={villageState.asset} style={s.villageIcon} resizeMode="cover" />

          <Text style={s.realmName}>{rName.toUpperCase()}</Text>
          <Text style={s.realmId}>REALM_ID: {realm.id.toUpperCase()} // {membersCount} MEMBERS</Text>
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
            <Text style={[s.healthValue, { color: healthColor }]}>{healthVal}</Text>
            <Text style={s.healthMax}>/100 HP</Text>
          </View>
          <View style={s.healthTrack}>
            <View style={[s.healthFill, { width: `${Math.min(100, Math.max(0, healthVal))}%`, backgroundColor: healthColor }]} />
          </View>
          <Text style={s.healthStatus}>
            STATUS: {villageState.label}
          </Text>
        </View>

        {/* Today's Contributions */}
        <View style={s.panel}>
          <Text style={s.panelLabel}>{'> '}TODAY'S_CONTRIBUTIONS:</Text>
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
              <Text style={s.memberIcon}>{m.id === user?.uid ? '🧙' : '🗡️'}</Text>
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
        {showLink && inviteCode && (
          <View style={s.linkBox}>
            <Text style={s.linkLabel}>{'> '}INVITE_CODE:</Text>
            <Text style={s.linkText} selectable>{inviteCode}</Text>
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
  realmHeader: { alignItems: 'center', justifyContent: 'center', borderBottomWidth: 1, borderBottomColor: colors.outlineVariant, overflow: 'hidden' },
  villageIcon: { width: 200, height: 200, marginTop: 50 },




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
  linkText: { fontFamily: fonts.headline, fontSize: 18, color: colors.primaryDim, letterSpacing: 4 },

  // Wrapped Button
  wrappedBtn: {
    marginTop: 16, borderWidth: 1, borderColor: colors.primaryContainer,
    backgroundColor: colors.surface, padding: 14, alignItems: 'center',
  },
  wrappedBtnText: { fontFamily: fonts.label, fontSize: 10, color: colors.primaryDim, letterSpacing: 2 },
});
