import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, Modal } from 'react-native';
import { colors, fonts, spacing, shape, glow } from '../theme/theme';
import RPGButton from '../components/RPGButton';
import RPGInput from '../components/RPGInput';
import useHabitStore from '../store/habitStore';
import useRealmStore from '../store/realmStore';

export default function PulseScreen() {
  const { habits, toggleHabit, addHabit } = useHabitStore();
  const realm = useRealmStore((s) => s.realm);
  const [selectedId, setSelectedId] = useState(null);
  const [contribution, setContribution] = useState(75);
  const [modalVisible, setModalVisible] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newXp, setNewXp] = useState('');
  const [newIcon, setNewIcon] = useState('');

  const gridHabits = habits.slice(0, 4);
  const activeId = selectedId || gridHabits.find((h) => !h.completed)?.id || gridHabits[0]?.id;

  const handleSubmit = () => {
    if (activeId) { toggleHabit(activeId); setSelectedId(null); }
  };
  const handleAdd = () => {
    if (!newTitle.trim()) return;
    addHabit(newTitle.trim(), parseInt(newXp) || 25, newIcon || '⚡');
    setNewTitle(''); setNewXp(''); setNewIcon(''); setModalVisible(false);
  };

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
        {/* Title */}
        <Text style={s.hero}>LOG YOUR{'\n'}PROGRESS</Text>
        <View style={s.subtitleRow}>
          <View style={s.subtitleLine} />
          <Text style={s.subtitle}>SELECT ACTIVE QUEST</Text>
          <View style={s.subtitleLine} />
        </View>

        {/* 2x2 Grid */}
        <View style={s.grid}>
          {gridHabits.map((h) => {
            const isActive = activeId === h.id;
            return (
              <TouchableOpacity
                key={h.id}
                style={[s.gridCard, isActive && s.gridCardActive]}
                onPress={() => setSelectedId(h.id)}
                activeOpacity={0.7}
              >
                {isActive && (
                  <View style={s.activeBadge}><Text style={s.activeBadgeText}>ACTIVE</Text></View>
                )}
                <View style={[s.gridIconBox, isActive && s.gridIconActive]}>
                  <Text style={s.gridIcon}>{h.icon}</Text>
                </View>
                <Text style={s.gridLabel}>{h.title.toUpperCase()}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Contribution Level */}
        <View style={s.contribBox}>
          <Text style={s.contribLabel}>{'> '}CONTRIBUTION_LEVEL:</Text>
          <View style={s.sliderRow}>
            <Text style={s.sliderEnd}>MIN</Text>
            <View style={s.sliderTrack}>
              <View style={[s.sliderFill, { width: `${contribution}%` }]} />
              <View style={[s.sliderThumb, { left: `${contribution - 2}%` }]} />
            </View>
            <Text style={s.sliderEnd}>MAX</Text>
          </View>
          <View style={s.contribRow}>
            <Text style={s.contribValue}>{contribution}%</Text>
            <Text style={s.contribXP}>EST. XP: +{Math.floor(contribution * 6)}</Text>
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

        {/* Action Row */}
        <View style={s.actionRow}>
          <RPGButton title="CANCEL" variant="ghost" onPress={() => setSelectedId(null)} style={{ flex: 1 }} />
          <RPGButton title="SUBMIT_XP" variant="primary" onPress={handleSubmit} style={{ flex: 1 }} />
        </View>

        {/* Add new habit */}
        <TouchableOpacity style={s.addLink} onPress={() => setModalVisible(true)}>
          <Text style={s.addLinkText}>[ + ADD_QUEST ]</Text>
        </TouchableOpacity>
        <View style={{ height: 20 }} />
      </ScrollView>

      {/* Add Habit Modal */}
      <Modal visible={modalVisible} transparent animationType="fade" onRequestClose={() => setModalVisible(false)}>
        <View style={s.modalOverlay}>
          <View style={s.modalCard}>
            <Text style={s.modalTitle}>{'> '}NEW_QUEST</Text>
            <RPGInput label="QUEST_NAME" value={newTitle} onChangeText={setNewTitle} placeholder="e.g. Morning Run" />
            <RPGInput label="XP_REWARD" value={newXp} onChangeText={setNewXp} placeholder="25" />
            <RPGInput label="ICON" value={newIcon} onChangeText={setNewIcon} placeholder="⚡" />
            <View style={s.modalActions}>
              <RPGButton title="CANCEL" variant="ghost" onPress={() => setModalVisible(false)} style={{ flex: 1 }} />
              <RPGButton title="ADD" variant="primary" onPress={handleAdd} style={{ flex: 1 }} />
            </View>
          </View>
        </View>
      </Modal>
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

  // Hero
  hero: { fontFamily: fonts.headline, fontSize: 30, color: colors.secondary, letterSpacing: 3, marginTop: 16, textAlign: 'center' },
  subtitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8, marginBottom: 16, justifyContent: 'center' },
  subtitleLine: { height: 1, flex: 1, backgroundColor: colors.outline, maxWidth: 50 },
  subtitle: { fontFamily: fonts.label, fontSize: 11, color: colors.onSurfaceVariant, letterSpacing: 2 },

  // 2x2 grid
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  gridCard: {
    width: '47.5%', aspectRatio: 1, backgroundColor: colors.surface,
    borderWidth: 1, borderColor: colors.outlineVariant, alignItems: 'center', justifyContent: 'center',
    padding: 10, position: 'relative',
  },
  gridCardActive: { borderColor: colors.primaryContainer, borderWidth: 2, ...glow.purple },
  activeBadge: {
    position: 'absolute', top: 0, right: 0, backgroundColor: colors.primaryContainer,
    paddingHorizontal: 6, paddingVertical: 2,
  },
  activeBadgeText: { fontFamily: fonts.label, fontSize: 8, color: '#fff', letterSpacing: 1.5 },
  gridIconBox: {
    width: 48, height: 48, backgroundColor: colors.surfaceContainer,
    borderWidth: 1, borderColor: colors.outline, alignItems: 'center', justifyContent: 'center',
    marginBottom: 8,
  },
  gridIconActive: { borderColor: colors.primaryContainer },
  gridIcon: { fontSize: 24 },
  gridLabel: { fontFamily: fonts.label, fontSize: 10, color: colors.onSurface, letterSpacing: 2, textAlign: 'center' },

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
    borderRadius: shape.radius, overflow: 'hidden', position: 'relative',
  },
  sliderFill: { height: 8, backgroundColor: colors.secondary, position: 'absolute', left: 0, top: 0 },
  sliderThumb: {
    position: 'absolute', top: -2, width: 12, height: 12,
    backgroundColor: colors.secondary, borderRadius: 0,
  },
  contribRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginTop: 10 },
  contribValue: { fontFamily: fonts.headline, fontSize: 32, color: colors.onSurface },
  contribXP: { fontFamily: fonts.label, fontSize: 11, color: colors.onSurfaceVariant, letterSpacing: 1 },

  // Warning
  warningBox: {
    marginTop: 14, borderWidth: 1, borderColor: colors.error,
    backgroundColor: colors.errorContainer, padding: 12,
  },
  warningTitle: { fontFamily: fonts.headline, fontSize: 12, color: colors.error, letterSpacing: 1, marginBottom: 4 },
  warningText: { fontFamily: fonts.body, fontSize: 11, color: colors.onSurface, lineHeight: 16 },

  // Actions
  actionRow: { flexDirection: 'row', gap: 8, marginTop: 16 },
  addLink: { alignItems: 'center', marginTop: 14 },
  addLinkText: { fontFamily: fonts.label, fontSize: 11, color: colors.onSurfaceVariant, letterSpacing: 2 },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', paddingHorizontal: 16 },
  modalCard: {
    backgroundColor: colors.surface, borderWidth: 2, borderColor: colors.primaryContainer,
    padding: 18, borderRadius: shape.radius,
  },
  modalTitle: { fontFamily: fonts.headline, fontSize: 16, color: colors.secondary, letterSpacing: 2, marginBottom: 16 },
  modalActions: { flexDirection: 'row', gap: 8 },
});
