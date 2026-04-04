import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, Modal, ActivityIndicator } from 'react-native';
import { colors, fonts, shape, glow } from '../theme/theme';
import RPGButton from '../components/RPGButton';
import ProfileModal from '../components/ProfileModal';
import useQuestStore from '../store/questStore';
import useAuthStore from '../store/authStore';
import useRealmStore from '../store/realmStore';

const HABIT_ICONS = {
  github: '💻',
  leetcode: '🧠',
  strava: '🏃',
  custom: '⚡',
};

export default function QuestsScreen() {
  const { quests, fetchQuests, assignQuest, acceptQuest, declineQuest, completeQuest, fetchUserHabits, isLoading } = useQuestStore();
  const user = useAuthStore((s) => s.user);
  const realm = useRealmStore((s) => s.realm);
  const memberProfiles = useRealmStore((s) => s.memberProfiles);

  const [modalVisible, setModalVisible] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);
  const [targetHabits, setTargetHabits] = useState([]);
  const [selectedHabit, setSelectedHabit] = useState(null);
  const [loadingHabits, setLoadingHabits] = useState(false);

  const uid = user?.uid;

  useEffect(() => {
    if (realm?.id && uid) {
      fetchQuests(realm.id, uid);
    }
  }, [realm?.id, uid]);

  // When a member is selected in the modal, fetch habits and filter
  useEffect(() => {
    if (selectedMember && realm?.id && uid) {
      setLoadingHabits(true);
      setSelectedHabit(null);
      Promise.all([
        fetchUserHabits(realm.id, uid),
        fetchUserHabits(realm.id, selectedMember)
      ]).then(([myHabits, theirHabits]) => {
        // filter myHabits to only show assignable ones
        const assignableHabits = myHabits.filter(myHabit => {
          if (['github', 'leetcode', 'strava'].includes(myHabit.type)) {
            return theirHabits.some(theirHabit => theirHabit.type === myHabit.type);
          }
          return true; // custom habits are always assignable
        });
        setTargetHabits(assignableHabits);
        setLoadingHabits(false);
      });
    } else {
      setTargetHabits([]);
    }
  }, [selectedMember]);

  const otherMembers = memberProfiles.filter((m) => m.id !== uid);

  const assignedToMe = quests.filter(q => q.assigned_to === uid && q.status !== 'declined');
  const assignedByMe = quests.filter(q => q.assigned_by === uid && q.status !== 'declined');

  const completedCount = assignedToMe.filter(q => q.status === 'completed').length;
  const totalXP = completedCount * 5;

  const handleAssign = () => {
    if (!selectedHabit || !selectedMember || !realm?.id || !uid) return;
    assignQuest(
      realm.id,
      selectedHabit.title,
      selectedHabit.type || 'custom',
      selectedMember,
      uid
    );
    setSelectedMember(null);
    setSelectedHabit(null);
    setTargetHabits([]);
    setModalVisible(false);
  };

  const getMemberName = (memberId) => {
    const m = memberProfiles.find(p => p.id === memberId);
    return m?.username || 'Unknown';
  };

  const isCustomType = (type) => !['github', 'leetcode', 'strava'].includes(type);

  return (
    <SafeAreaView style={s.safe}>
      {/* Top Bar */}
      <View style={s.topBar}>
        <View style={s.topBarLeft}>
          <Text style={s.topBarGrid}>⚔️</Text>
          <Text style={s.topBarTitle}>FRIEND_QUESTS</Text>
        </View>
        <TouchableOpacity onPress={() => setShowProfile(true)} style={s.avatar}>
          <Text style={s.avatarText}>🧙</Text>
        </TouchableOpacity>
      </View>

      {/* Banner */}
      <View style={s.banner}>
        <Text style={s.bannerLabel}>SYSTEM_QUESTS // FRIEND_MISSIONS</Text>
        <Text style={s.bannerTitle}>FRIEND QUESTS</Text>
        <Text style={s.bannerSub}>ASSIGNED MISSIONS</Text>
        <View style={s.progressBox}>
          <View style={s.progressRow}>
            <Text style={s.progressLeft}>{completedCount}/{assignedToMe.length} COMPLETE</Text>
            <Text style={s.progressRight}>+{totalXP} XP EARNED</Text>
          </View>
          <View style={s.progressTrack}>
            <View style={[s.progressFill, { width: assignedToMe.length > 0 ? `${(completedCount / assignedToMe.length) * 100}%` : '0%' }]} />
          </View>
        </View>
      </View>

      <ScrollView style={s.scroll} showsVerticalScrollIndicator={false}>
        {isLoading ? (
          <ActivityIndicator color={colors.secondary} style={{ padding: 20 }} />
        ) : (
          <>
            {/* Assigned to me */}
            <Text style={s.sectionLabel}>{'> '}ASSIGNED_TO_YOU:</Text>
            {assignedToMe.length === 0 ? (
              <View style={s.emptyRow}>
                <Text style={s.emptyText}>NO QUESTS ASSIGNED TO YOU YET</Text>
              </View>
            ) : (
              assignedToMe.map((q) => {
                const icon = HABIT_ICONS[q.habit_type] || '⚡';
                const isPending = q.status === 'pending';
                const isCompleted = q.status === 'completed';
                const isAccepted = q.status === 'accepted';
                const custom = isCustomType(q.habit_type);

                return (
                  <View key={q.id} style={[s.questRow, isCompleted && s.questRowDone]}>
                    <View style={[s.questIconBox, isCompleted && s.questIconDone]}>
                      <Text style={s.questIconText}>{icon}</Text>
                    </View>
                    <View style={s.questInfo}>
                      <Text style={s.questName}>{(q.habit_title || '').toUpperCase()}</Text>
                      <Text style={s.questFrom}>FROM: {getMemberName(q.assigned_by)}</Text>
                      {isCompleted ? (
                        <Text style={s.questCompleteMsg}>✓ COMPLETED • +{q.xp_reward} XP</Text>
                      ) : isAccepted ? (
                        custom ? (
                          <Text style={s.questXP}>TAP ✓ TO COMPLETE • +{q.xp_reward} XP</Text>
                        ) : (
                          <Text style={s.questPendingMsg}>FINISH YOUR HABIT TO EARN +{q.xp_reward} XP</Text>
                        )
                      ) : (
                        <Text style={s.questXP}>+{q.xp_reward} XP</Text>
                      )}
                    </View>

                    {/* Actions column */}
                    {isPending && (
                      <View style={s.inlineActions}>
                        <TouchableOpacity style={s.acceptSmall} onPress={() => acceptQuest(q.id)}>
                          <Text style={s.acceptSmallText}>✓</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={s.declineSmall} onPress={() => declineQuest(q.id)}>
                          <Text style={s.declineSmallText}>✕</Text>
                        </TouchableOpacity>
                      </View>
                    )}
                    {isAccepted && custom && (
                      <TouchableOpacity onPress={() => completeQuest(q.id)}>
                        <View style={s.checkCircle}>
                          <Text style={{ color: colors.onSurfaceVariant, fontSize: 11 }}> </Text>
                        </View>
                      </TouchableOpacity>
                    )}
                    {isAccepted && !custom && (
                      <View style={s.statusIndicator}>
                        <Text style={s.statusIndicatorText}>⏳</Text>
                      </View>
                    )}
                    {isCompleted && (
                      <TouchableOpacity onPress={() => custom && completeQuest(q.id)}>
                        <View style={[s.checkCircle, s.checkCircleDone]}>
                          <Text style={s.checkMark}>✓</Text>
                        </View>
                      </TouchableOpacity>
                    )}
                  </View>
                );
              })
            )}

            {/* Assigned by me */}
            <Text style={[s.sectionLabel, { marginTop: 20 }]}>{'> '}ASSIGNED_BY_YOU:</Text>
            {assignedByMe.length === 0 ? (
              <View style={s.emptyRow}>
                <Text style={s.emptyText}>YOU HAVEN'T ASSIGNED ANY QUESTS YET</Text>
              </View>
            ) : (
              assignedByMe.map((q) => {
                const icon = HABIT_ICONS[q.habit_type] || '⚡';
                const isCompleted = q.status === 'completed';

                return (
                  <View key={q.id} style={[s.questRow, isCompleted && s.questRowDone]}>
                    <View style={[s.questIconBox, isCompleted && s.questIconDone]}>
                      <Text style={s.questIconText}>{icon}</Text>
                    </View>
                    <View style={s.questInfo}>
                      <Text style={s.questName}>{(q.habit_title || '').toUpperCase()}</Text>
                      <Text style={s.questFrom}>TO: {getMemberName(q.assigned_to)}</Text>
                    </View>
                    <View style={s.statusBadge}>
                      <Text style={[s.statusBadgeText, isCompleted && { color: colors.secondary }]}>
                        {q.status?.toUpperCase()}
                      </Text>
                    </View>
                  </View>
                );
              })
            )}
          </>
        )}
        <View style={{ height: 80 }} />
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity style={s.fab} onPress={() => setModalVisible(true)} activeOpacity={0.8}>
        <Text style={s.fabText}>+</Text>
      </TouchableOpacity>

      {/* Assign Modal */}
      <Modal visible={modalVisible} transparent animationType="fade" onRequestClose={() => setModalVisible(false)}>
        <View style={s.modalOverlay}>
          <View style={s.modalCard}>
            <Text style={s.modalTitle}>{'> '}ASSIGN_QUEST</Text>

            {/* Step 1: Pick a member */}
            <Text style={s.fieldLabel}>{'> '}ASSIGN_TO</Text>
            <View style={s.chipRow}>
              {otherMembers.length === 0 ? (
                <Text style={s.emptyTextSmall}>No other realm members</Text>
              ) : (
                otherMembers.map((m) => (
                  <TouchableOpacity
                    key={m.id}
                    style={[s.chip, selectedMember === m.id && s.chipActive]}
                    onPress={() => setSelectedMember(m.id === selectedMember ? null : m.id)}
                  >
                    <Text style={[s.chipText, selectedMember === m.id && s.chipTextActive]}>{m.username}</Text>
                  </TouchableOpacity>
                ))
              )}
            </View>

            {/* Step 2: Pick one of your habits */}
            {selectedMember && (
              <>
                <Text style={s.fieldLabel}>{'> '}SELECT_YOUR_HABIT</Text>
                {loadingHabits ? (
                  <ActivityIndicator color={colors.secondary} style={{ padding: 10 }} />
                ) : targetHabits.length === 0 ? (
                  <Text style={s.emptyTextSmall}>You have no habits in this realm</Text>
                ) : (
                  <View style={s.chipRow}>
                    {targetHabits.map((h) => (
                      <TouchableOpacity
                        key={h.id}
                        style={[s.habitChip, selectedHabit?.id === h.id && s.habitChipActive]}
                        onPress={() => setSelectedHabit(selectedHabit?.id === h.id ? null : h)}
                      >
                        <Text style={s.habitChipIcon}>{HABIT_ICONS[h.type] || '⚡'}</Text>
                        <Text style={[s.habitChipText, selectedHabit?.id === h.id && s.habitChipTextActive]}>
                          {(h.title || '').toUpperCase()}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </>
            )}

            <View style={s.modalActions}>
              <RPGButton title="CANCEL" variant="ghost" onPress={() => { setModalVisible(false); setSelectedMember(null); setSelectedHabit(null); }} style={{ flex: 1 }} />
              <RPGButton title="ASSIGN" variant="primary" onPress={handleAssign} disabled={!selectedHabit || !selectedMember} style={{ flex: 1 }} />
            </View>
          </View>
        </View>
      </Modal>

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
  topBarGrid: { fontSize: 18 },
  topBarTitle: { fontFamily: fonts.headline, fontSize: 13, color: colors.onSurface, letterSpacing: 2 },
  avatar: {
    width: 30, height: 30, backgroundColor: colors.surfaceContainer, borderWidth: 1,
    borderColor: colors.primaryContainer, alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { fontSize: 16 },
  scroll: { flex: 1, paddingHorizontal: 14 },

  // Banner
  banner: {
    backgroundColor: colors.primaryContainer, paddingHorizontal: 16, paddingTop: 10, paddingBottom: 14,
    borderBottomWidth: 2, borderBottomColor: colors.primary,
  },
  bannerLabel: { fontFamily: fonts.label, fontSize: 10, color: colors.secondary, letterSpacing: 2, marginBottom: 4 },
  bannerTitle: { fontFamily: fonts.headline, fontSize: 26, color: colors.onSurface, letterSpacing: 2 },
  bannerSub: { fontFamily: fonts.label, fontSize: 11, color: colors.onSurfaceVariant, letterSpacing: 2, marginBottom: 10 },
  progressBox: {
    backgroundColor: 'rgba(0,0,0,0.35)', borderWidth: 1, borderColor: colors.outline,
    padding: 10, borderRadius: shape.radius,
  },
  progressRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  progressLeft: { fontFamily: fonts.label, fontSize: 11, color: colors.onSurface, letterSpacing: 1 },
  progressRight: { fontFamily: fonts.headline, fontSize: 11, color: colors.secondary, letterSpacing: 1 },
  progressTrack: { height: 6, backgroundColor: colors.surfaceContainerHighest, borderRadius: shape.radius, overflow: 'hidden' },
  progressFill: { height: 6, backgroundColor: colors.secondary },

  // Sections
  sectionLabel: { fontFamily: fonts.label, fontSize: 11, color: colors.secondary, letterSpacing: 2, marginTop: 16, marginBottom: 8 },

  // Empty
  emptyRow: {
    borderWidth: 1, borderColor: colors.outlineVariant, borderStyle: 'dashed',
    backgroundColor: colors.surface, padding: 16, alignItems: 'center', marginBottom: 6,
  },
  emptyText: { fontFamily: fonts.label, fontSize: 10, color: colors.onSurfaceVariant, letterSpacing: 1.5 },
  emptyTextSmall: { fontFamily: fonts.body, fontSize: 11, color: colors.onSurfaceVariant, marginBottom: 12 },

  // Quest rows
  questRow: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface,
    borderWidth: 1, borderColor: colors.outlineVariant, padding: 12, gap: 10, marginBottom: 6,
  },
  questRowDone: { borderLeftWidth: 3, borderLeftColor: colors.secondary },
  questIconBox: {
    width: 40, height: 40, backgroundColor: colors.surfaceContainer,
    borderWidth: 1, borderColor: colors.outline, alignItems: 'center', justifyContent: 'center',
  },
  questIconDone: { borderColor: colors.secondary },
  questIconText: { fontSize: 18 },
  questInfo: { flex: 1 },
  questName: { fontFamily: fonts.headline, fontSize: 13, color: colors.onSurface, letterSpacing: 1.5 },
  questFrom: { fontFamily: fonts.label, fontSize: 9, color: colors.onSurfaceVariant, letterSpacing: 1, marginTop: 1 },
  questXP: { fontFamily: fonts.label, fontSize: 9, color: colors.secondary, letterSpacing: 1, marginTop: 2 },
  questPendingMsg: { fontFamily: fonts.label, fontSize: 9, color: colors.tertiary, letterSpacing: 1, marginTop: 2 },
  questCompleteMsg: { fontFamily: fonts.label, fontSize: 9, color: colors.secondary, letterSpacing: 1, marginTop: 2 },

  // Status
  statusBadge: {
    borderWidth: 1, borderColor: colors.outline, paddingHorizontal: 8, paddingVertical: 4,
  },
  statusBadgeText: { fontFamily: fonts.label, fontSize: 9, color: colors.onSurfaceVariant, letterSpacing: 1 },

  // Check circle
  checkCircle: {
    width: 24, height: 24, borderWidth: 2, borderColor: colors.outline,
    borderRadius: 12, alignItems: 'center', justifyContent: 'center',
  },
  checkCircleDone: { borderColor: colors.secondary, backgroundColor: colors.secondaryContainer },
  checkMark: { color: '#fff', fontSize: 14, fontWeight: 'bold' },

  // Status indicator (integrated)
  statusIndicator: {
    width: 28, height: 28, borderWidth: 1, borderColor: colors.outline,
    alignItems: 'center', justifyContent: 'center',
  },
  statusIndicatorText: { fontSize: 14 },

  // Inline accept/decline
  inlineActions: { flexDirection: 'column', gap: 4, marginLeft: 6 },
  acceptSmall: {
    width: 24, height: 24, backgroundColor: colors.secondaryContainer,
    alignItems: 'center', justifyContent: 'center',
  },
  acceptSmallText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
  declineSmall: {
    width: 24, height: 24, backgroundColor: colors.errorContainer,
    borderWidth: 1, borderColor: colors.error, alignItems: 'center', justifyContent: 'center',
  },
  declineSmallText: { color: colors.error, fontSize: 12, fontWeight: 'bold' },

  // FAB
  fab: {
    position: 'absolute', bottom: 20, right: 16,
    width: 48, height: 48, backgroundColor: colors.secondary,
    alignItems: 'center', justifyContent: 'center', ...glow.green,
  },
  fabText: { fontSize: 24, color: '#000', fontFamily: fonts.headline },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', paddingHorizontal: 16 },
  modalCard: {
    backgroundColor: colors.surface, borderWidth: 2, borderColor: colors.primaryContainer,
    padding: 18, borderRadius: shape.radius,
  },
  modalTitle: { fontFamily: fonts.headline, fontSize: 16, color: colors.secondary, letterSpacing: 2, marginBottom: 16 },
  fieldLabel: { fontFamily: fonts.label, fontSize: 11, color: colors.secondary, letterSpacing: 2, marginBottom: 6 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  chip: { borderWidth: 1, borderColor: colors.outline, paddingHorizontal: 12, paddingVertical: 6 },
  chipActive: { borderColor: colors.secondary, backgroundColor: 'rgba(76,227,70,0.1)' },
  chipText: { fontFamily: fonts.label, fontSize: 11, color: colors.onSurfaceVariant, letterSpacing: 1 },
  chipTextActive: { color: colors.secondary },
  habitChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    borderWidth: 1, borderColor: colors.outline, paddingHorizontal: 10, paddingVertical: 8,
  },
  habitChipActive: { borderColor: colors.secondary, backgroundColor: 'rgba(76,227,70,0.1)', borderWidth: 2 },
  habitChipIcon: { fontSize: 16 },
  habitChipText: { fontFamily: fonts.label, fontSize: 10, color: colors.onSurfaceVariant, letterSpacing: 1 },
  habitChipTextActive: { color: colors.secondary },
  modalActions: { flexDirection: 'row', gap: 8 },
});
