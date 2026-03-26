import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import { useNavigation, CommonActions } from '@react-navigation/native';
import { colors, fonts, shape } from '../theme/theme';
import useAuthStore from '../store/authStore';
import useRealmStore from '../store/realmStore';

export default function ProfileModal({ visible, onClose }) {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const memberProfiles = useRealmStore((s) => s.memberProfiles);
  const navigation = useNavigation();

  const currentMember = memberProfiles.find((m) => m.id === user?.uid) || { xp: 0, streak: 0 };
  const totalGroupXP = memberProfiles.reduce((sum, m) => sum + (m.xp || 0), 0);
  const contributionPct = totalGroupXP > 0 ? Math.round(((currentMember.xp || 0) / totalGroupXP) * 100) : 0;

  const handleLogout = () => {
    onClose();
    logout();
    navigation.dispatch(
      CommonActions.reset({ index: 0, routes: [{ name: 'Auth' }] })
    );
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity style={s.overlay} activeOpacity={1} onPress={onClose}>
        <View style={s.panel}>
          <Text style={s.title}>{'> '}USER_PROFILE:</Text>
          <View style={s.row}>
            <View style={s.avatarBox}><Text style={s.avatar}>🧙</Text></View>
            <View style={s.info}>
              <Text style={s.name}>{(user?.displayName || user?.username || 'COMMANDER').toUpperCase()}</Text>
              <Text style={s.id}>ID: {user?.id?.toUpperCase() || 'U1'}</Text>
            </View>
          </View>
          <View style={s.stats}>
            <View style={s.statBox}>
              <Text style={s.statValue}>{currentMember.xp}</Text>
              <Text style={s.statLabel}>TOTAL XP</Text>
            </View>
            <View style={s.divider} />
            <View style={s.statBox}>
              <Text style={s.statValue}>{currentMember.streak}d</Text>
              <Text style={s.statLabel}>STREAK</Text>
            </View>
            <View style={s.divider} />
            <View style={s.statBox}>
              <Text style={[s.statValue, { color: colors.secondary }]}>{contributionPct}%</Text>
              <Text style={s.statLabel}>CONTRIB</Text>
            </View>
          </View>
          <TouchableOpacity style={s.logoutBtn} onPress={handleLogout} activeOpacity={0.7}>
            <Text style={s.logoutText}>⏻ LOGOUT_SESSION</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.closeBtn} onPress={onClose}>
            <Text style={s.closeText}>[ CLOSE ]</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

const s = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'flex-start', paddingTop: 60 },
  panel: {
    marginHorizontal: 14, backgroundColor: colors.surface,
    borderWidth: 2, borderColor: colors.primaryContainer, padding: 16,
  },
  title: { fontFamily: fonts.headline, fontSize: 13, color: colors.secondary, letterSpacing: 2, marginBottom: 14 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
  avatarBox: {
    width: 44, height: 44, backgroundColor: colors.surfaceContainer,
    borderWidth: 1, borderColor: colors.primaryContainer, alignItems: 'center', justifyContent: 'center',
  },
  avatar: { fontSize: 24 },
  info: {},
  name: { fontFamily: fonts.headline, fontSize: 14, color: colors.onSurface, letterSpacing: 2 },
  id: { fontFamily: fonts.label, fontSize: 9, color: colors.onSurfaceVariant, letterSpacing: 1.5, marginTop: 2 },
  stats: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    borderWidth: 1, borderColor: colors.outlineVariant, padding: 12,
  },
  statBox: { flex: 1, alignItems: 'center' },
  statValue: { fontFamily: fonts.headline, fontSize: 18, color: colors.onSurface },
  statLabel: { fontFamily: fonts.label, fontSize: 8, color: colors.onSurfaceVariant, letterSpacing: 1.5, marginTop: 2 },
  divider: { width: 1, height: 28, backgroundColor: colors.outlineVariant },
  logoutBtn: {
    marginTop: 14, borderWidth: 1, borderColor: colors.error,
    backgroundColor: colors.errorContainer, padding: 12, alignItems: 'center',
  },
  logoutText: { fontFamily: fonts.label, fontSize: 11, color: colors.error, letterSpacing: 2 },
  closeBtn: { alignItems: 'center', marginTop: 10 },
  closeText: { fontFamily: fonts.label, fontSize: 11, color: colors.onSurfaceVariant, letterSpacing: 2 },
});
