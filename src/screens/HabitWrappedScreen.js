import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity } from 'react-native';
import { colors, fonts, spacing, shape, glow } from '../theme/theme';
import ProgressBar from '../components/ProgressBar';

// Mock data for the monthly summary
const WRAPPED_DATA = {
  totalQuests: 127,
  topContributor: { name: 'PLAYER_ONE', xp: 1250 },
  groupConsistency: 72,
  villageGrowth: { start: 45, end: 85 },
  bestDay: { day: 'MARCH 14', quests: 18 },
  failurePoint: { day: 'MARCH 03', quests: 2 },
};

export default function HabitWrappedScreen({ navigation }) {
  return (
    <SafeAreaView style={s.safe}>
      {/* Top Bar */}
      <View style={s.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
          <Text style={s.backText}>← BACK</Text>
        </TouchableOpacity>
        <Text style={s.topBarTitle}>REALM_REPORT</Text>
      </View>

      <ScrollView style={s.scroll} showsVerticalScrollIndicator={false}>
        {/* Title */}
        <View style={s.titleBlock}>
          <Text style={s.titleLabel}>SYSTEM_REPORT // GENERATED</Text>
          <Text style={s.title}>REALM_REPORT</Text>
          <Text style={s.titleSub}>MONTHLY_SUMMARY</Text>
        </View>

        {/* Stat 1: Total Quests */}
        <View style={s.statCard}>
          <Text style={s.statHeader}>{'> '}01 // TOTAL_QUESTS_COMPLETED</Text>
          <Text style={s.bigNumber}>{WRAPPED_DATA.totalQuests}</Text>
          <Text style={s.statFooter}>QUESTS COMPLETED THIS MONTH</Text>
          <ProgressBar value={WRAPPED_DATA.totalQuests} max={200} label="PROGRESS" color={colors.secondary} height={6} />
        </View>

        {/* Stat 2: Top Contributor */}
        <View style={s.statCard}>
          <Text style={s.statHeader}>{'> '}02 // TOP_CONTRIBUTOR</Text>
          <View style={s.contributorRow}>
            <View style={s.contributorIconBox}><Text style={s.contributorIcon}>🧙</Text></View>
            <View style={s.contributorInfo}>
              <Text style={s.contributorName}>{WRAPPED_DATA.topContributor.name}</Text>
              <Text style={s.contributorXP}>{WRAPPED_DATA.topContributor.xp} XP TOTAL</Text>
            </View>
            <View style={s.crownBadge}><Text style={s.crownText}>👑</Text></View>
          </View>
        </View>

        {/* Stat 3: Group Consistency */}
        <View style={s.statCard}>
          <Text style={s.statHeader}>{'> '}03 // GROUP_CONSISTENCY</Text>
          <View style={s.consistencyRow}>
            <Text style={[s.bigNumber, { color: WRAPPED_DATA.groupConsistency >= 70 ? colors.secondary : colors.tertiary }]}>
              {WRAPPED_DATA.groupConsistency}%
            </Text>
          </View>
          <ProgressBar value={WRAPPED_DATA.groupConsistency} max={100} label="CONSISTENCY" color={WRAPPED_DATA.groupConsistency >= 70 ? colors.secondary : colors.tertiary} height={6} />
        </View>

        {/* Stat 4: Village Growth */}
        <View style={s.statCard}>
          <Text style={s.statHeader}>{'> '}04 // VILLAGE_GROWTH</Text>
          <View style={s.growthRow}>
            <View style={s.growthPoint}>
              <Text style={s.growthLabel}>START</Text>
              <Text style={[s.growthValue, { color: colors.error }]}>{WRAPPED_DATA.villageGrowth.start} HP</Text>
            </View>
            <View style={s.growthArrow}>
              <Text style={s.arrowText}>→→→</Text>
            </View>
            <View style={s.growthPoint}>
              <Text style={s.growthLabel}>END</Text>
              <Text style={[s.growthValue, { color: colors.secondary }]}>{WRAPPED_DATA.villageGrowth.end} HP</Text>
            </View>
          </View>
          <View style={s.growthBar}>
            <View style={[s.growthBarStart, { width: `${WRAPPED_DATA.villageGrowth.start}%` }]} />
            <View style={[s.growthBarEnd, { width: `${WRAPPED_DATA.villageGrowth.end}%` }]} />
          </View>
          <Text style={s.growthDelta}>
            +{WRAPPED_DATA.villageGrowth.end - WRAPPED_DATA.villageGrowth.start} HP GAINED
          </Text>
        </View>

        {/* Stat 5: Best Day */}
        <View style={s.statCard}>
          <Text style={s.statHeader}>{'> '}05 // BEST_DAY</Text>
          <View style={s.dayRow}>
            <View style={s.dayIconBox}><Text style={s.dayIcon}>⚡</Text></View>
            <View style={s.dayInfo}>
              <Text style={s.dayDate}>{WRAPPED_DATA.bestDay.day}</Text>
              <Text style={s.dayQuests}>{WRAPPED_DATA.bestDay.quests} QUESTS COMPLETED</Text>
            </View>
          </View>
          <ProgressBar value={WRAPPED_DATA.bestDay.quests} max={20} label="ACTIVITY" color={colors.secondary} height={4} />
        </View>

        {/* Stat 6: Failure Point */}
        <View style={[s.statCard, s.failureCard]}>
          <Text style={s.statHeader}>{'> '}06 // FAILURE_POINT</Text>
          <View style={s.dayRow}>
            <View style={[s.dayIconBox, s.failureIconBox]}><Text style={s.dayIcon}>⚠</Text></View>
            <View style={s.dayInfo}>
              <Text style={s.dayDate}>{WRAPPED_DATA.failurePoint.day}</Text>
              <Text style={[s.dayQuests, { color: colors.error }]}>{WRAPPED_DATA.failurePoint.quests} QUESTS COMPLETED</Text>
            </View>
          </View>
          <ProgressBar value={WRAPPED_DATA.failurePoint.quests} max={20} label="ACTIVITY" color={colors.error} height={4} />
        </View>

        {/* End */}
        <View style={s.endBlock}>
          <Text style={s.endText}>{'>'} END_OF_REPORT</Text>
          <Text style={s.endSub}>GENERATED BY HABITOPIA_SYS</Text>
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
  scroll: { flex: 1, paddingHorizontal: 14 },

  // Title
  titleBlock: { paddingVertical: 20, borderBottomWidth: 1, borderBottomColor: colors.outlineVariant },
  titleLabel: { fontFamily: fonts.label, fontSize: 9, color: colors.secondary, letterSpacing: 2, marginBottom: 4 },
  title: { fontFamily: fonts.headline, fontSize: 28, color: colors.secondary, letterSpacing: 4 },
  titleSub: { fontFamily: fonts.label, fontSize: 11, color: colors.onSurfaceVariant, letterSpacing: 3, marginTop: 2 },

  // Stat Cards
  statCard: {
    marginTop: 12, borderWidth: 1, borderColor: colors.outlineVariant,
    backgroundColor: colors.surface, padding: 14,
  },
  failureCard: { borderColor: colors.error },
  statHeader: { fontFamily: fonts.label, fontSize: 10, color: colors.secondary, letterSpacing: 2, marginBottom: 10 },
  bigNumber: { fontFamily: fonts.headline, fontSize: 42, color: colors.onSurface, marginBottom: 4 },
  statFooter: { fontFamily: fonts.label, fontSize: 9, color: colors.onSurfaceVariant, letterSpacing: 1.5, marginBottom: 10 },

  // Contributor
  contributorRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  contributorIconBox: {
    width: 40, height: 40, backgroundColor: colors.surfaceContainer,
    borderWidth: 1, borderColor: colors.primaryContainer, alignItems: 'center', justifyContent: 'center',
  },
  contributorIcon: { fontSize: 22 },
  contributorInfo: { flex: 1 },
  contributorName: { fontFamily: fonts.headline, fontSize: 14, color: colors.onSurface, letterSpacing: 2 },
  contributorXP: { fontFamily: fonts.label, fontSize: 10, color: colors.secondary, letterSpacing: 1, marginTop: 2 },
  crownBadge: {
    width: 32, height: 32, backgroundColor: colors.surfaceContainer,
    borderWidth: 1, borderColor: colors.tertiary, alignItems: 'center', justifyContent: 'center',
  },
  crownText: { fontSize: 18 },

  // Consistency
  consistencyRow: { marginBottom: 6 },

  // Growth
  growthRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  growthPoint: { alignItems: 'center' },
  growthLabel: { fontFamily: fonts.label, fontSize: 9, color: colors.onSurfaceVariant, letterSpacing: 2, marginBottom: 2 },
  growthValue: { fontFamily: fonts.headline, fontSize: 20 },
  growthArrow: { flex: 1, alignItems: 'center' },
  arrowText: { fontFamily: fonts.headline, fontSize: 14, color: colors.secondary, letterSpacing: 4 },
  growthBar: { height: 6, backgroundColor: colors.surfaceContainerHighest, overflow: 'hidden', marginBottom: 6 },
  growthBarStart: { height: 6, backgroundColor: colors.error, position: 'absolute', left: 0 },
  growthBarEnd: { height: 6, backgroundColor: colors.secondary, position: 'absolute', left: 0 },
  growthDelta: { fontFamily: fonts.label, fontSize: 10, color: colors.secondary, letterSpacing: 2 },

  // Day
  dayRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10 },
  dayIconBox: {
    width: 36, height: 36, backgroundColor: colors.surfaceContainer,
    borderWidth: 1, borderColor: colors.secondary, alignItems: 'center', justifyContent: 'center',
  },
  failureIconBox: { borderColor: colors.error },
  dayIcon: { fontSize: 18 },
  dayInfo: {},
  dayDate: { fontFamily: fonts.headline, fontSize: 14, color: colors.onSurface, letterSpacing: 2 },
  dayQuests: { fontFamily: fonts.label, fontSize: 10, color: colors.secondary, letterSpacing: 1, marginTop: 2 },

  // End
  endBlock: {
    marginTop: 20, borderWidth: 1, borderColor: colors.outlineVariant, borderStyle: 'dashed',
    padding: 16, alignItems: 'center',
  },
  endText: { fontFamily: fonts.label, fontSize: 11, color: colors.onSurfaceVariant, letterSpacing: 2, marginBottom: 4 },
  endSub: { fontFamily: fonts.label, fontSize: 9, color: colors.onSurfaceVariant, letterSpacing: 1.5 },
});
