import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, FlatList, TouchableOpacity, Modal } from 'react-native';
import { colors, fonts, spacing, shape, glow } from '../theme/theme';
import RPGButton from '../components/RPGButton';
import RPGInput from '../components/RPGInput';
import useQuestStore from '../store/questStore';
import useAuthStore from '../store/authStore';
import useRealmStore from '../store/realmStore';

export default function QuestsScreen() {
  const { quests, assignQuest, acceptQuest, declineQuest } = useQuestStore();
  const currentUser = useAuthStore((s) => s.user);
  const memberProfiles = useRealmStore((s) => s.memberProfiles);
  const [modalVisible, setModalVisible] = useState(false);
  const [questTitle, setQuestTitle] = useState('');
  const [questDesc, setQuestDesc] = useState('');
  const [selectedMember, setSelectedMember] = useState(null);
  const userId = currentUser?.id || 'u1';

  const completedCount = quests.filter((q) => q.status === 'accepted' || q.status === 'completed').length;
  const totalXP = quests.filter((q) => q.status === 'accepted' || q.status === 'completed').reduce((s, q) => s + q.xpReward, 0);

  const handleAssign = () => {
    if (!questTitle.trim() || !selectedMember) return;
    assignQuest(questTitle.trim(), questDesc.trim(), selectedMember, userId, 'side_quest');
    setQuestTitle(''); setQuestDesc(''); setSelectedMember(null); setModalVisible(false);
  };

  const questIcons = { challenge: '⚔️', side_quest: '📜' };
  const otherMembers = memberProfiles.filter((m) => m.id !== userId);

  const renderQuest = ({ item }) => {
    const done = item.status === 'accepted' || item.status === 'completed';
    const isPending = item.status === 'pending' && item.assigned_to === userId;
    return (
      <View style={[st.questRow, done && st.questRowDone]}>
        <View style={[st.questIconBox, done && st.questIconDone]}>
          <Text style={st.questIconText}>{questIcons[item.type] || '📜'}</Text>
        </View>
        <View style={st.questInfo}>
          <Text style={st.questName}>{item.title.toUpperCase()}</Text>
          <Text style={st.questXP}>+{item.xpReward} XP</Text>
        </View>
        <View style={st.questStatusCol}>
          <Text style={[st.questStatusText, { color: done ? colors.secondary : colors.onSurfaceVariant }]}>
            {done ? 'COMPLETED' : 'PENDING'}
          </Text>
          <View style={[st.statusCircle, done && st.statusCircleDone]}>
            {done && <Text style={st.checkMark}>✓</Text>}
          </View>
        </View>
        {isPending && (
          <View style={st.inlineActions}>
            <TouchableOpacity style={st.acceptSmall} onPress={() => acceptQuest(item.id)}>
              <Text style={st.acceptSmallText}>✓</Text>
            </TouchableOpacity>
            <TouchableOpacity style={st.declineSmall} onPress={() => declineQuest(item.id)}>
              <Text style={st.declineSmallText}>✕</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={st.safe}>
      {/* Top Bar */}
      <View style={st.topBar}>
        <View style={st.topBarLeft}>
          <Text style={st.topBarGrid}>⊞</Text>
          <Text style={st.topBarTitle}>HABIT_VILLAGE_V1.0</Text>
        </View>
        <View style={st.avatar}><Text style={st.avatarText}>🧙</Text></View>
      </View>

      {/* Purple Header Banner */}
      <View style={st.banner}>
        <Text style={st.bannerLabel}>SYSTEM_QUESTS // DAILY_MISSIONS</Text>
        <Text style={st.bannerTitle}>DAILY QUESTS</Text>
        <Text style={st.bannerSub}>TODAY'S MISSIONS</Text>
        <View style={st.progressBox}>
          <View style={st.progressRow}>
            <Text style={st.progressLeft}>{completedCount}/{quests.length} COMPLETE</Text>
            <Text style={st.progressRight}>+{totalXP} XP EARNED</Text>
          </View>
          <View style={st.progressTrack}>
            <View style={[st.progressFill, { width: quests.length > 0 ? `${(completedCount / quests.length) * 100}%` : '0%' }]} />
          </View>
        </View>
      </View>

      {/* Quest List */}
      <FlatList
        data={quests}
        keyExtractor={(item) => item.id}
        renderItem={renderQuest}
        contentContainerStyle={st.list}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={{ height: 6 }} />}
      />

      {/* FAB */}
      <TouchableOpacity style={st.fab} onPress={() => setModalVisible(true)} activeOpacity={0.8}>
        <Text style={st.fabText}>+</Text>
      </TouchableOpacity>

      {/* Assign Modal */}
      <Modal visible={modalVisible} transparent animationType="fade" onRequestClose={() => setModalVisible(false)}>
        <View style={st.modalOverlay}>
          <View style={st.modalCard}>
            <Text style={st.modalTitle}>{'> '}ASSIGN_QUEST</Text>
            <RPGInput label="QUEST_NAME" value={questTitle} onChangeText={setQuestTitle} placeholder="e.g. 50 Squats" />
            <RPGInput label="DESCRIPTION" value={questDesc} onChangeText={setQuestDesc} placeholder="Optional..." />
            <Text style={st.memberLabel}>{'> '}ASSIGN_TO</Text>
            <View style={st.memberList}>
              {otherMembers.map((m) => (
                <TouchableOpacity key={m.id} style={[st.memberChip, selectedMember === m.id && st.memberChipActive]} onPress={() => setSelectedMember(m.id)}>
                  <Text style={[st.memberChipText, selectedMember === m.id && st.memberChipTextActive]}>{m.username}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={st.modalActions}>
              <RPGButton title="CANCEL" variant="ghost" onPress={() => setModalVisible(false)} style={{ flex: 1 }} />
              <RPGButton title="ASSIGN" variant="primary" onPress={handleAssign} disabled={!questTitle.trim() || !selectedMember} style={{ flex: 1 }} />
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const st = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  topBar: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 14, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colors.outline,
  },
  topBarLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  topBarGrid: { color: colors.onSurface, fontSize: 18 },
  topBarTitle: { fontFamily: fonts.headline, fontSize: 13, color: colors.onSurface, letterSpacing: 2 },
  avatar: {
    width: 30, height: 30, backgroundColor: colors.surfaceContainer,
    borderWidth: 1, borderColor: colors.primaryContainer, alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { fontSize: 16 },

  // Purple Banner
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

  // Quest rows
  list: { padding: 12, paddingBottom: 80 },
  questRow: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface,
    borderWidth: 1, borderColor: colors.outlineVariant, padding: 10, gap: 10,
  },
  questRowDone: { borderLeftWidth: 3, borderLeftColor: colors.secondary },
  questIconBox: {
    width: 40, height: 40, backgroundColor: colors.surfaceContainer,
    borderWidth: 1, borderColor: colors.outline, alignItems: 'center', justifyContent: 'center',
  },
  questIconDone: { backgroundColor: colors.surfaceContainerHigh, borderColor: colors.secondary },
  questIconText: { fontSize: 18 },
  questInfo: { flex: 1 },
  questName: { fontFamily: fonts.headline, fontSize: 13, color: colors.onSurface, letterSpacing: 1.5 },
  questXP: { fontFamily: fonts.label, fontSize: 10, color: colors.secondary, letterSpacing: 1, marginTop: 1 },
  questStatusCol: { alignItems: 'flex-end', gap: 3 },
  questStatusText: { fontFamily: fonts.label, fontSize: 9, letterSpacing: 1.5 },
  statusCircle: {
    width: 20, height: 20, borderWidth: 1.5, borderColor: colors.outline,
    borderRadius: 10, alignItems: 'center', justifyContent: 'center',
  },
  statusCircleDone: { borderColor: colors.secondary, backgroundColor: colors.secondaryContainer },
  checkMark: { color: '#fff', fontSize: 11, fontWeight: 'bold' },
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
  memberLabel: { fontFamily: fonts.label, fontSize: 11, color: colors.secondary, letterSpacing: 2, marginBottom: 6 },
  memberList: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 16 },
  memberChip: { borderWidth: 1, borderColor: colors.outline, paddingHorizontal: 12, paddingVertical: 6 },
  memberChipActive: { borderColor: colors.secondary, backgroundColor: 'rgba(76,227,70,0.1)' },
  memberChipText: { fontFamily: fonts.label, fontSize: 11, color: colors.onSurfaceVariant, letterSpacing: 1 },
  memberChipTextActive: { color: colors.secondary },
  modalActions: { flexDirection: 'row', gap: 8 },
});
