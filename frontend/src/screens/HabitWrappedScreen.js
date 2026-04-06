import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity } from 'react-native';
import { colors, fonts } from '../theme';
import ProgressBar from '../components/ProgressBar';
import { db } from '../firebase';
import { collection, query, where, getDocs, Timestamp } from 'firebase/firestore';

import useRealmStore from '../store/realmStore';

export default function HabitWrappedScreen({ navigation }) {
  const { realm, memberProfiles } = useRealmStore();
  const [weeklyLogs, setWeeklyLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchWeeklyLogs() {
      if (!realm?.id) return;
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      
      const q = query(
        collection(db, 'habit_logs'),
        where('realm_id', '==', realm.id),
        where('timestamp', '>=', Timestamp.fromDate(oneWeekAgo))
      );
      
      try {
        const snap = await getDocs(q);
        const logs = snap.docs.map(d => d.data());
        setWeeklyLogs(logs);
      } catch (err) {
        console.error("Failed to fetch habit_logs", err);
      }
      setIsLoading(false);
    }
    fetchWeeklyLogs();
  }, [realm?.id]);

  // Compute Weekly Stats from active Realm data
  const totalWeeklyQuests = weeklyLogs.length;

  const xpPerUser = {};
  weeklyLogs.forEach(log => {
      if (!xpPerUser[log.user_id]) xpPerUser[log.user_id] = 0;
      xpPerUser[log.user_id] += (log.xp_reward || 10);
  });
  
  let topUid = null;
  let topXp = 0;
  for (const [uid, xp] of Object.entries(xpPerUser)) {
      if (xp > topXp) {
          topXp = xp;
          topUid = uid;
      }
  }

  const topMemberProfile = memberProfiles.find(m => m.id === topUid);
  const topWeeklyName = topMemberProfile ? topMemberProfile.username : (topUid ? 'UNKNOWN' : 'NONE');

  const activeMembers = memberProfiles.filter(m => (m.streak || 0) > 0).length;
  const groupConsistency = memberProfiles.length ? Math.round((activeMembers / memberProfiles.length) * 100) : 0;
  
  const villageGrowthStart = 100;
  const villageGrowthEnd = realm ? Math.round(realm.health) : 100;
  const growthDelta = villageGrowthEnd - villageGrowthStart;
  
  const longestStreak = memberProfiles.length > 0 ? Math.max(0, ...memberProfiles.map(m => m.streak || 0)) : 0;
  const casualties = memberProfiles.length - activeMembers;

  const logsPerDay = {};
  weeklyLogs.forEach(log => {
      if (log.timestamp && log.timestamp.toDate) {
          const day = log.timestamp.toDate().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }).toUpperCase();
          if (!logsPerDay[day]) logsPerDay[day] = 0;
          logsPerDay[day]++;
      }
  });
  
  let bestDayName = 'NONE';
  let bestDayCount = 0;
  for (const [day, count] of Object.entries(logsPerDay)) {
      if (count > bestDayCount) {
          bestDayCount = count;
          bestDayName = day;
      }
  }

  if (isLoading) {
    return <SafeAreaView style={s.safe}><View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}><Text style={s.title}>LOADING DATA...</Text></View></SafeAreaView>;
  }

  return (
    <SafeAreaView style={s.safe}>
      {/* Top Bar */}
      <View style={s.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
          <Text style={s.backText}>← BACK</Text>
        </TouchableOpacity>
        <Text style={s.topBarTitle}>REALM REPORT</Text>
      </View>

      <ScrollView style={s.scroll} showsVerticalScrollIndicator={false}>
        {/* Title */}
        <View style={s.titleBlock}>
          <Text style={s.title}>REALM REPORT</Text>
          <Text style={s.titleSub}>WEEKLY SUMMARY</Text>
        </View>

        {/* Stat 1: Total Activity */}
        <View style={s.statCard}>
          <Text style={s.statHeader}>TOTAL ACTIVITY THIS WEEK</Text>
          <Text style={s.bigNumber}>{totalWeeklyQuests}</Text>
          <Text style={s.statFooter}>HABITS & QUESTS COMPLETED THIS WEEK</Text>
          <ProgressBar value={totalWeeklyQuests} max={50} label="PROGRESS" color={colors.secondary} height={6} />
        </View>

        {/* Stat 1.1: Best Day */}
        <View style={s.statCard}>
          <Text style={s.statHeader}>BEST DAY THIS WEEK</Text>
          <View style={s.dayRow}>
            <View style={s.dayIconBox}><Text style={s.dayIcon}>🔥</Text></View>
            <View style={s.dayInfo}>
              <Text style={s.dayDate}>{bestDayName}</Text>
              <Text style={s.dayQuests}>{bestDayCount} COMPLETIONS</Text>
            </View>
          </View>
          <ProgressBar value={bestDayCount} max={20} label="ACTIVITY" color={colors.secondary} height={4} />
        </View>

        {/* Stat 2: Top Contributor */}
        <View style={s.statCard}>
          <Text style={s.statHeader}>TOP WEEKLY CONTRIBUTOR</Text>
          <View style={s.contributorRow}>
             <View style={s.contributorIconBox}><Text style={s.contributorIcon}>👑</Text></View>
             <View style={s.contributorInfo}>
               <Text style={s.contributorName}>{topWeeklyName}</Text>
               <Text style={s.contributorXP}>{topXp} XP GAINED THIS WEEK</Text>
             </View>
          </View>
        </View>

        {/* Stat 3: Group Consistency */}
        <View style={s.statCard}>
          <Text style={s.statHeader}>GROUP CONSISTENCY</Text>
          <View style={s.consistencyRow}>
            <Text style={[s.bigNumber, { color: groupConsistency >= 70 ? colors.secondary : colors.tertiary }]}>
              {groupConsistency}%
            </Text>
          </View>
          <ProgressBar value={groupConsistency} max={100} label="CONSISTENCY" color={groupConsistency >= 70 ? colors.secondary : colors.tertiary} height={6} />
        </View>

        {/* Stat 4: Village Growth */}
        <View style={s.statCard}>
          <Text style={s.statHeader}>VILLAGE GROWTH</Text>
          <View style={s.growthRow}>
            <View style={s.growthPoint}>
              <Text style={s.growthLabel}>START</Text>
              <Text style={[s.growthValue, { color: colors.tertiary }]}>{villageGrowthStart} HP</Text>
            </View>
            <View style={s.growthArrow}>
              <Text style={s.arrowText}>→→→</Text>
            </View>
            <View style={s.growthPoint}>
              <Text style={s.growthLabel}>END</Text>
              <Text style={[s.growthValue, { color: growthDelta >= 0 ? colors.secondary : colors.error }]}>{villageGrowthEnd} HP</Text>
            </View>
          </View>
          <View style={s.growthBar}>
            <View style={[s.growthBarStart, { width: `100%`, backgroundColor: colors.surfaceContainerHighest }]} />
            <View style={[s.growthBarEnd, { width: `${Math.min(100, (villageGrowthEnd / villageGrowthStart) * 100)}%`, backgroundColor: growthDelta >= 0 ? colors.secondary : colors.error }]} />
          </View>
          <Text style={[s.growthDelta, { color: growthDelta >= 0 ? colors.secondary : colors.error }]}>
            {growthDelta >= 0 ? '+' : ''}{growthDelta} HP {growthDelta >= 0 ? 'GAINED' : 'LOST'}
          </Text>
        </View>

        {/* Stat 5: Longest Streak */}
        <View style={s.statCard}>
          <Text style={s.statHeader}>LONGEST STREAK</Text>
          <View style={s.dayRow}>
            <View style={s.dayIconBox}><Text style={s.dayIcon}>⚡</Text></View>
            <View style={s.dayInfo}>
              <Text style={s.dayDate}>{longestStreak} DAYS</Text>
              <Text style={s.dayQuests}>HIGHEST ACTIVE STREAK</Text>
            </View>
          </View>
          <ProgressBar value={longestStreak} max={30} label="STREAK" color={colors.secondary} height={4} />
        </View>

        {/* Stat 6: Village Casualties */}
        <View style={[s.statCard, s.failureCard]}>
          <Text style={s.statHeader}>VILLAGE CASUALTIES</Text>
          <View style={s.dayRow}>
            <View style={[s.dayIconBox, s.failureIconBox]}><Text style={s.dayIcon}>⚠</Text></View>
            <View style={s.dayInfo}>
              <Text style={s.dayDate}>{casualties} {casualties === 1 ? 'MEMBER' : 'MEMBERS'}</Text>
              <Text style={[s.dayQuests, { color: colors.error }]}>MEMBERS WITHOUT A STREAK</Text>
            </View>
          </View>
          <ProgressBar value={casualties} max={Math.max(1, memberProfiles.length)} label="RISK LEVEL" color={colors.error} height={4} />
        </View>
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
    borderWidth: 1, borderColor: colors.secondaryContainer, alignItems: 'center', justifyContent: 'center',
  },
  contributorIcon: { fontSize: 22 },
  contributorInfo: { flex: 1 },
  contributorName: { fontFamily: fonts.headline, fontSize: 14, color: colors.onSurface, letterSpacing: 2 },
  contributorXP: { fontFamily: fonts.label, fontSize: 10, color: colors.secondary, letterSpacing: 1, marginTop: 2 },

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
});
