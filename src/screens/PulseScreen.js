import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, Modal } from 'react-native';
import { colors, fonts, spacing, shape, glow } from '../theme/theme';
import RPGButton from '../components/RPGButton';
import RPGInput from '../components/RPGInput';
import ProfileModal from '../components/ProfileModal';
import useHabitStore from '../store/habitStore';
import useRealmStore from '../store/realmStore';

const PRESET_QUESTS = [
  { id: 'pq1', name: 'GITHUB', icon: '💻', desc: 'Track daily commits and PRs', difficulty: 'MEDIUM' },
  { id: 'pq2', name: 'LEETCODE', icon: '🧠', desc: 'Solve daily coding challenges', difficulty: 'HARD' },
  { id: 'pq3', name: 'STRAVA', icon: '🏃', desc: 'Log workouts and runs', difficulty: 'EASY' },
];

const DIFFICULTY_LEVELS = ['EASY', 'MEDIUM', 'HARD', 'EXTREME'];

export default function PulseScreen() {
  const { habits, addHabit } = useHabitStore();
  const realm = useRealmStore((s) => s.realm);
  const [selectedPreset, setSelectedPreset] = useState(null);
  const [customName, setCustomName] = useState('');
  const [customDifficulty, setCustomDifficulty] = useState('MEDIUM');
  const [modalVisible, setModalVisible] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [pendingQuests, setPendingQuests] = useState([
    { id: 'cq1', name: 'DAILY PUSHUPS', difficulty: 'MEDIUM', status: 'pending' },
    { id: 'cq2', name: 'COLD SHOWER', difficulty: 'HARD', status: 'accepted' },
  ]);

  // Contribution from Main Quests only
  const mainQuestsCompleted = habits.filter((h) => h.completed).length;
  const mainQuestsTotal = habits.length;
  const contribution = mainQuestsTotal > 0 ? Math.round((mainQuestsCompleted / mainQuestsTotal) * 100) : 0;

  const handleAddPreset = (preset) => {
    setSelectedPreset(preset.id === selectedPreset ? null : preset.id);
  };

  const handleSubmitCustom = () => {
    if (!customName.trim()) return;
    setPendingQuests((prev) => [
      ...prev,
      { id: 'cq' + Date.now(), name: customName.trim().toUpperCase(), difficulty: customDifficulty, status: 'pending' },
    ]);
    setCustomName('');
    setCustomDifficulty('MEDIUM');
    setModalVisible(false);
  };

  return (
    <SafeAreaView style={s.safe}>
      {/* Top Bar */}
      <View style={s.topBar}>
        <View style={s.topBarLeft}>
          <Text style={s.topBarGrid}>◎</Text>
          <Text style={s.topBarTitle}>MAIN_QUESTS</Text>
        </View>
        <TouchableOpacity onPress={() => setShowProfile(true)} style={s.avatar}><Text style={s.avatarText}>🧙</Text></TouchableOpacity>
      </View>

      <ScrollView style={s.scroll} showsVerticalScrollIndicator={false}>
        {/* Section 1: Preset Quests */}
        <Text style={s.sectionLabel}>{'> '}PRESET_QUESTS:</Text>
        <Text style={s.sectionDesc}>Select from integrated habit trackers</Text>

        <View style={s.presetGrid}>
          {PRESET_QUESTS.map((pq) => {
            const isSelected = selectedPreset === pq.id;
            return (
              <TouchableOpacity
                key={pq.id}
                style={[s.presetCard, isSelected && s.presetCardActive]}
                onPress={() => handleAddPreset(pq)}
                activeOpacity={0.7}
              >
                {isSelected && (
                  <View style={s.activeBadge}><Text style={s.activeBadgeText}>SELECTED</Text></View>
                )}
                <Text style={s.presetIcon}>{pq.icon}</Text>
                <Text style={s.presetName}>{pq.name}</Text>
                <Text style={s.presetDesc}>{pq.desc}</Text>
                <View style={s.diffBadge}>
                  <Text style={[s.diffText, pq.difficulty === 'HARD' && { color: colors.error }, pq.difficulty === 'EASY' && { color: colors.secondary }]}>
                    {pq.difficulty}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Section 2: Custom Quest */}
        <Text style={s.sectionLabel}>{'> '}CUSTOM_QUEST:</Text>
        <TouchableOpacity style={s.addCustomBtn} onPress={() => setModalVisible(true)} activeOpacity={0.7}>
          <Text style={s.addCustomText}>+ CREATE_CUSTOM_QUEST</Text>
        </TouchableOpacity>

        {/* Section 3: Group Consensus */}
        <Text style={s.sectionLabel}>{'> '}GROUP_CONSENSUS:</Text>
        {pendingQuests.map((q) => (
          <View key={q.id} style={s.consensusRow}>
            <View style={s.consensusInfo}>
              <Text style={s.consensusName}>{q.name}</Text>
              <Text style={s.consensusDiff}>{q.difficulty}</Text>
            </View>
            <View style={[s.statusBadge, q.status === 'accepted' && s.statusAccepted]}>
              <Text style={[s.statusText, q.status === 'accepted' && s.statusTextAccepted]}>
                {q.status === 'accepted' ? '✓ ACCEPTED' : '⏳ PENDING'}
              </Text>
            </View>
          </View>
        ))}

        {/* Contribution Level (Main Quests Only) */}
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
            <Text style={s.contribXP}>MAIN QUESTS ONLY</Text>
          </View>
        </View>

        {/* Warning Box */}
        {realm.health < 95 && (
          <View style={s.warningBox}>
            <Text style={s.warningTitle}>⚠ DECAY WARNING: VILLAGE AT RISK</Text>
            <Text style={s.warningText}>
              Global activity is <Text style={{ fontWeight: 'bold' }}>LOW</Text>. Habit failure in 4 hours will result in <Text style={{ fontWeight: 'bold' }}>-200 Village HP</Text>.
            </Text>
          </View>
        )}

        <View style={{ height: 20 }} />
      </ScrollView>

      {/* Custom Quest Modal */}
      <Modal visible={modalVisible} transparent animationType="fade" onRequestClose={() => setModalVisible(false)}>
        <View style={s.modalOverlay}>
          <View style={s.modalCard}>
            <Text style={s.modalTitle}>{'> '}NEW_CUSTOM_QUEST</Text>
            <RPGInput label="QUEST_NAME" value={customName} onChangeText={setCustomName} placeholder="e.g. Daily Pushups" />

            <Text style={s.fieldLabel}>{'> '}DIFFICULTY</Text>
            <View style={s.chipRow}>
              {DIFFICULTY_LEVELS.map((diff) => (
                <TouchableOpacity
                  key={diff}
                  style={[s.chip, customDifficulty === diff && s.chipActive]}
                  onPress={() => setCustomDifficulty(diff)}
                >
                  <Text style={[s.chipText, customDifficulty === diff && s.chipTextActive]}>{diff}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={s.modalActions}>
              <RPGButton title="CANCEL" variant="ghost" onPress={() => setModalVisible(false)} style={{ flex: 1 }} />
              <RPGButton title="SUBMIT" variant="primary" onPress={handleSubmitCustom} disabled={!customName.trim()} style={{ flex: 1 }} />
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

  // Preset Grid
  presetGrid: { gap: 10 },
  presetCard: {
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.outlineVariant,
    padding: 16, position: 'relative',
  },
  presetCardActive: { borderColor: colors.primaryContainer, borderWidth: 2, ...glow.purple },
  activeBadge: {
    position: 'absolute', top: 0, right: 0, backgroundColor: colors.primaryContainer,
    paddingHorizontal: 8, paddingVertical: 2,
  },
  activeBadgeText: { fontFamily: fonts.label, fontSize: 8, color: '#fff', letterSpacing: 1.5 },
  presetIcon: { fontSize: 28, marginBottom: 6 },
  presetName: { fontFamily: fonts.headline, fontSize: 16, color: colors.onSurface, letterSpacing: 2, marginBottom: 4 },
  presetDesc: { fontFamily: fonts.body, fontSize: 11, color: colors.onSurfaceVariant, marginBottom: 8 },
  diffBadge: {
    borderWidth: 1, borderColor: colors.outline, paddingHorizontal: 8, paddingVertical: 3,
    alignSelf: 'flex-start',
  },
  diffText: { fontFamily: fonts.label, fontSize: 9, color: colors.tertiary, letterSpacing: 1.5 },

  // Custom Quest
  addCustomBtn: {
    borderWidth: 1, borderColor: colors.outlineVariant, borderStyle: 'dashed',
    padding: 16, alignItems: 'center', marginBottom: 4,
  },
  addCustomText: { fontFamily: fonts.label, fontSize: 11, color: colors.secondary, letterSpacing: 2 },

  // Consensus
  consensusRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.outlineVariant,
    padding: 12, marginBottom: 6,
  },
  consensusInfo: { flex: 1 },
  consensusName: { fontFamily: fonts.headline, fontSize: 12, color: colors.onSurface, letterSpacing: 1.5 },
  consensusDiff: { fontFamily: fonts.label, fontSize: 9, color: colors.onSurfaceVariant, letterSpacing: 1, marginTop: 2 },
  statusBadge: {
    borderWidth: 1, borderColor: colors.tertiary, paddingHorizontal: 8, paddingVertical: 4,
  },
  statusAccepted: { borderColor: colors.secondary, backgroundColor: 'rgba(76,227,70,0.1)' },
  statusText: { fontFamily: fonts.label, fontSize: 9, color: colors.tertiary, letterSpacing: 1 },
  statusTextAccepted: { color: colors.secondary },

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

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', paddingHorizontal: 16 },
  modalCard: {
    backgroundColor: colors.surface, borderWidth: 2, borderColor: colors.primaryContainer,
    padding: 18, borderRadius: shape.radius,
  },
  modalTitle: { fontFamily: fonts.headline, fontSize: 16, color: colors.secondary, letterSpacing: 2, marginBottom: 16 },
  fieldLabel: { fontFamily: fonts.label, fontSize: 11, color: colors.secondary, letterSpacing: 2, marginBottom: 8 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  chip: {
    borderWidth: 1, borderColor: colors.outline, paddingHorizontal: 12, paddingVertical: 6,
  },
  chipActive: { borderColor: colors.secondary, backgroundColor: 'rgba(76,227,70,0.1)' },
  chipText: { fontFamily: fonts.label, fontSize: 10, color: colors.onSurfaceVariant, letterSpacing: 1 },
  chipTextActive: { color: colors.secondary },
  modalActions: { flexDirection: 'row', gap: 8 },
});
