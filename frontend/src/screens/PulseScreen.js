import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { colors, fonts, spacing, shape, glow } from '../theme/theme';
import ProfileModal from '../components/ProfileModal';
import useHabitStore from '../store/habitStore';
import useRealmStore from '../store/realmStore';
import useAuthStore from '../store/authStore';

const HABIT_ICONS = {
  github: '💻',
  leetcode: '🧠',
  strava: '🏃',
  custom: '⚡',
};

export default function PulseScreen() {
  const { habits, fetchHabits, toggleHabit, isLoading } = useHabitStore();
  const realm = useRealmStore((s) => s.realm);
  const user = useAuthStore((s) => s.user);
  const [showProfile, setShowProfile] = useState(false);

  // Fetch habits from Firestore when realm/user are available
  useEffect(() => {
    if (realm?.id && user?.uid) {
      fetchHabits(realm.id, user.uid);
    }
  }, [realm?.id, user?.uid]);

  // Contribution calculation
  const totalHabits = habits.length;
  const completedHabits = habits.filter((h) => h.completed).length;
  const contribution = totalHabits > 0 ? Math.round((completedHabits / totalHabits) * 100) : 0;

  return (
    <SafeAreaView style={s.safe}>
      {/* Top Bar */}
      <View style={s.topBar}>
        <View style={s.topBarLeft}>
          <Text style={s.topBarGrid}>◎</Text>
          <Text style={s.topBarTitle}>MAIN_QUESTS</Text>
        </View>
        <TouchableOpacity onPress={() => setShowProfile(true)} style={s.avatar}>
          <Text style={s.avatarText}>🧙</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={s.scroll} showsVerticalScrollIndicator={false}>
        <Text style={s.sectionLabel}>{'> '}QUEST_LOG:</Text>
        <Text style={s.sectionDesc}>Complete your daily habits to contribute to Village HP</Text>

        {isLoading ? (
          <ActivityIndicator color={colors.secondary} style={{ padding: 20 }} />
        ) : habits.length === 0 ? (
          <View style={s.emptyBox}>
            <Text style={s.emptyText}>NO HABITS FOUND FOR THIS REALM</Text>
            <Text style={s.emptySubtext}>Create or join a realm and select habits to get started.</Text>
          </View>
        ) : (
          habits.map((h) => {
            const icon = HABIT_ICONS[h.type] || '⚡';

            if (h.isIntegrated) {
              // Integrated habit — non-checkable, shows message
              return (
                <View key={h.id} style={[s.habitRow, h.completed && s.habitRowDone]}>
                  <View style={s.habitIconBox}>
                    <Text style={s.habitIconText}>{icon}</Text>
                  </View>
                  <View style={s.habitInfo}>
                    <Text style={s.habitName}>{h.title.toUpperCase()}</Text>
                    {h.completed ? (
                      <Text style={s.habitCompleteMsg}>✓ VERIFIED • +{h.xp} XP</Text>
                    ) : (
                      <Text style={s.habitPendingMsg}>FINISH YOUR HABIT TO EARN +{h.xp} XP</Text>
                    )}
                  </View>
                  <View style={[s.statusIndicator, h.completed && s.statusVerified]}>
                    <Text style={[s.statusIndicatorText, h.completed && { color: colors.secondary }]}>
                      {h.completed ? '✓' : '⏳'}
                    </Text>
                  </View>
                </View>
              );
            }

            // Custom habit — checkable
            return (
              <TouchableOpacity
                key={h.id}
                style={[s.habitRow, h.completed && s.habitRowDone]}
                onPress={() => toggleHabit(h.id)}
                activeOpacity={0.7}
              >
                <View style={s.habitIconBox}>
                  <Text style={s.habitIconText}>{icon}</Text>
                </View>
                <View style={s.habitInfo}>
                  <Text style={s.habitName}>{h.title.toUpperCase()}</Text>
                  <Text style={s.habitXP}>+{h.xp} XP</Text>
                </View>
                <View style={[s.checkCircle, h.completed && s.checkCircleDone]}>
                  {h.completed && <Text style={s.checkMark}>✓</Text>}
                </View>
              </TouchableOpacity>
            );
          })
        )}

        {/* Contribution Level */}
        <View style={s.contribBox}>
          <Text style={s.contribLabel}>{'> '}CONTRIBUTION_LEVEL:</Text>
          <View style={s.sliderRow}>
            <Text style={s.sliderEnd}>MIN</Text>
            <View style={s.sliderTrack}>
              <View style={[s.sliderFill, { width: `${contribution}%` }]} />
            </View>
            <Text style={s.sliderEnd}>MAX</Text>
          </View>
          <View style={s.contribRow}>
            <Text style={s.contribValue}>{contribution}%</Text>
            <Text style={s.contribXP}>{completedHabits}/{totalHabits} COMPLETED</Text>
          </View>
        </View>

        {/* Warning Box */}
        {realm && realm.health < 95 && (
          <View style={s.warningBox}>
            <Text style={s.warningTitle}>⚠ DECAY WARNING: VILLAGE AT RISK</Text>
            <Text style={s.warningText}>
              Global activity is <Text style={{ fontWeight: 'bold' }}>LOW</Text>. Habit failure in 4 hours will result in <Text style={{ fontWeight: 'bold' }}>-200 Village HP</Text>.
            </Text>
          </View>
        )}

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
  topBarLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  topBarGrid: { color: colors.onSurface, fontSize: 18 },
  topBarTitle: { fontFamily: fonts.headline, fontSize: 13, color: colors.onSurface, letterSpacing: 2 },
  avatar: {
    width: 30, height: 30, backgroundColor: colors.surfaceContainer, borderWidth: 1,
    borderColor: colors.primaryContainer, alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { fontSize: 16 },
  scroll: { flex: 1, paddingHorizontal: 14 },

  // Sections
  sectionLabel: { fontFamily: fonts.label, fontSize: 11, color: colors.secondary, letterSpacing: 2, marginTop: 16, marginBottom: 6 },
  sectionDesc: { fontFamily: fonts.body, fontSize: 11, color: colors.onSurfaceVariant, marginBottom: 12 },

  // Empty state
  emptyBox: {
    borderWidth: 1, borderColor: colors.outlineVariant, borderStyle: 'dashed',
    backgroundColor: colors.surface, padding: 24, alignItems: 'center', marginBottom: 12,
  },
  emptyText: { fontFamily: fonts.headline, fontSize: 12, color: colors.onSurface, letterSpacing: 1.5, marginBottom: 6 },
  emptySubtext: { fontFamily: fonts.body, fontSize: 11, color: colors.onSurfaceVariant, textAlign: 'center' },

  // Habit rows
  habitRow: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface,
    borderWidth: 1, borderColor: colors.outlineVariant, padding: 12, marginBottom: 8, gap: 12,
  },
  habitRowDone: { borderLeftWidth: 3, borderLeftColor: colors.secondary, opacity: 0.8 },
  habitIconBox: {
    width: 44, height: 44, backgroundColor: colors.surfaceContainer,
    borderWidth: 1, borderColor: colors.outline, alignItems: 'center', justifyContent: 'center',
  },
  habitIconText: { fontSize: 24 },
  habitInfo: { flex: 1 },
  habitName: { fontFamily: fonts.headline, fontSize: 13, color: colors.onSurface, letterSpacing: 1.5 },
  habitXP: { fontFamily: fonts.label, fontSize: 10, color: colors.secondary, letterSpacing: 1, marginTop: 2 },
  habitPendingMsg: { fontFamily: fonts.label, fontSize: 9, color: colors.tertiary, letterSpacing: 1, marginTop: 3 },
  habitCompleteMsg: { fontFamily: fonts.label, fontSize: 9, color: colors.secondary, letterSpacing: 1, marginTop: 3 },

  // Checkable circle for custom habits
  checkCircle: {
    width: 24, height: 24, borderWidth: 2, borderColor: colors.outline,
    borderRadius: 12, alignItems: 'center', justifyContent: 'center',
  },
  checkCircleDone: { borderColor: colors.secondary, backgroundColor: colors.secondaryContainer },
  checkMark: { color: '#fff', fontSize: 14, fontWeight: 'bold' },

  // Status indicator for integrated habits
  statusIndicator: {
    width: 28, height: 28, borderWidth: 1, borderColor: colors.outline,
    alignItems: 'center', justifyContent: 'center',
  },
  statusVerified: { borderColor: colors.secondary, backgroundColor: 'rgba(76,227,70,0.1)' },
  statusIndicatorText: { fontFamily: fonts.label, fontSize: 14, color: colors.onSurfaceVariant },

  // Contribution
  contribBox: {
    marginTop: 16, borderWidth: 1, borderColor: colors.outlineVariant,
    backgroundColor: colors.surface, padding: 14,
  },
  contribLabel: { fontFamily: fonts.label, fontSize: 11, color: colors.primaryDim, letterSpacing: 2, marginBottom: 10 },
  sliderRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sliderEnd: { fontFamily: fonts.label, fontSize: 9, color: colors.onSurfaceVariant, letterSpacing: 1 },
  sliderTrack: {
    flex: 1, height: 8, backgroundColor: colors.surfaceContainerHighest,
    borderRadius: shape.radius, overflow: 'hidden',
  },
  sliderFill: { height: 8, backgroundColor: colors.secondary },
  contribRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginTop: 10 },
  contribValue: { fontFamily: fonts.headline, fontSize: 32, color: colors.onSurface },
  contribXP: { fontFamily: fonts.label, fontSize: 9, color: colors.onSurfaceVariant, letterSpacing: 1 },

  // Warning
  warningBox: {
    marginTop: 14, borderWidth: 1, borderColor: colors.error,
    backgroundColor: colors.errorContainer, padding: 12,
  },
  warningTitle: { fontFamily: fonts.headline, fontSize: 12, color: colors.error, letterSpacing: 1, marginBottom: 4 },
  warningText: { fontFamily: fonts.body, fontSize: 11, color: colors.onSurface, lineHeight: 16 },
});
