import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, Alert } from 'react-native';
import { useNavigation, CommonActions } from '@react-navigation/native';
import { colors, fonts, shape } from '../theme';
import useAuthStore from '../store/authStore';
import useRealmStore from '../store/realmStore';
import useHabitStore from '../store/habitStore';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import fetchWithAuth from '../apiClient';
import RPGInput from './RPGInput';
import RPGButton from './RPGButton';

export default function ProfileModal({ visible, onClose }) {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const { realm, memberProfiles, leaveRealm } = useRealmStore();
  const habits = useHabitStore((s) => s.habits) || [];
  const navigation = useNavigation();

  const [isEditingNames, setIsEditingNames] = React.useState(false);
  const [usernames, setUsernames] = React.useState({ github: '', leetcode: '', strava: '' });
  const [isValidating, setIsValidating] = React.useState(false);

  React.useEffect(() => {
    if (visible && user?.uid) {
      const fetchNames = async () => {
        try {
          const snap = await getDoc(doc(db, 'users', user.uid));
          if (snap.exists()) {
            const d = snap.data();
            setUsernames({
              github: d.githubName || d.github_username || '',
              leetcode: d.leetcodeName || d.leetcode_username || '',
              strava: d.stravaName || d.strava_username || '',
            });
          }
        } catch (e) { console.warn(e); }
      };
      fetchNames();
      setIsEditingNames(false);
    }
  }, [visible, user?.uid]);

  const handleSaveNames = async () => {
    setIsValidating(true);
    // Validate
    for (const type of ['leetcode', 'github']) {
      const uname = usernames[type].trim();
      if (uname) {
        try {
          const res = await fetchWithAuth(`/pulse/validate-username?type=${type}&username=${uname}`);
          if (!res.valid) {
            alert(`The ${type} username '${uname}' could not be verified.`);
            setIsValidating(false);
            return;
          }
        } catch (e) {
          console.error('Validation error', e);
        }
      }
    }
    
    // Save
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        githubName: usernames.github.trim(),
        leetcodeName: usernames.leetcode.trim(),
        stravaName: usernames.strava.trim()
      });
      setIsEditingNames(false);
    } catch (e) {
      alert('Could not save usernames.');
    }
    setIsValidating(false);
  };

  const handleLogout = () => {
    onClose();
    logout();
    navigation.dispatch(
      CommonActions.reset({ index: 0, routes: [{ name: 'Auth' }] })
    );
  };

  const handleLeaveRealm = () => {
    if (!user?.uid || !realm?.id) return;

    const isOnlyMember = memberProfiles.length === 1 && memberProfiles[0]?.id === user.uid;
    let message = "Are you sure you want to leave this realm? This action cannot be reversed.";
    if (isOnlyMember) {
      message = "You are the last member of this realm. If you leave, the realm will be permanently deleted and this cannot be reversed.";
    }

    Alert.alert(
      "Warning",
      message,
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Leave Realm", 
          style: "destructive",
          onPress: async () => {
            try {
              await leaveRealm(user.uid, realm.id);
              onClose();
              navigation.dispatch(
                CommonActions.reset({ index: 0, routes: [{ name: 'RealmHub' }] })
              );
            } catch (e) {
              Alert.alert('Error', 'Failed to leave realm.');
            }
          }
        }
      ]
    );
  };

  const totalGroupXP = memberProfiles.reduce((sum, m) => sum + (m.xp || 0), 0);
  const contributionPct = totalGroupXP > 0 ? Math.round(((user?.xp || 0) / totalGroupXP) * 100) : 0;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity style={s.overlay} activeOpacity={1} onPress={onClose}>
        <View style={s.panel}>
          <Text style={s.title}>{'> '}USER_PROFILE:</Text>
          <View style={s.row}>
            <View style={s.avatarBox}><Text style={s.avatar}>🧙</Text></View>
            <View style={s.info}>
              <Text style={s.name}>{(user?.displayName || user?.username || 'COMMANDER').toUpperCase()}</Text>
            </View>
          </View>
          <View style={s.stats}>
            <View style={s.statBox}>
              <Text style={s.statValue}>{(!user?.displayName && !user?.username) ? '?' : (user?.xp || 0)}</Text>
              <Text style={s.statLabel}>TOTAL XP</Text>
            </View>
            <View style={s.divider} />
            <View style={s.statBox}>
              <Text style={s.statValue}>{user?.streak || 0}d</Text>
              <Text style={s.statLabel}>STREAK</Text>
            </View>
            <View style={s.divider} />
            <View style={s.statBox}>
              <Text style={[s.statValue, { color: colors.secondary }]}>{contributionPct}%</Text>
              <Text style={s.statLabel}>CONTRIBUTION</Text>
            </View>
          </View>

          {/* Compute Integration Visibility */}
          {(() => {
            const showGithub = habits.some(h => h.type === 'github') || !!usernames.github;
            const showLeetcode = habits.some(h => h.type === 'leetcode') || !!usernames.leetcode;
            const showStrava = habits.some(h => h.type === 'strava') || !!usernames.strava;

            return (
              <>

          {/* Integrations Section */}
          {(showGithub || showLeetcode || showStrava) && (
            <View style={{ marginTop: 16 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <Text style={s.title}>{'> '}INTEGRATIONS:</Text>
                {!isEditingNames && (
                  <TouchableOpacity onPress={() => setIsEditingNames(true)}>
                    <Text style={{ fontFamily: fonts.label, fontSize: 10, color: colors.secondary }}>EDIT</Text>
                  </TouchableOpacity>
                )}
              </View>
              
              {isEditingNames ? (
                <View>
                  {showGithub && <RPGInput label="GITHUB_USERNAME" value={usernames.github} onChangeText={t => setUsernames({...usernames, github: t})} placeholder="GitHub" />}
                  {showLeetcode && <RPGInput label="LEETCODE_USERNAME" value={usernames.leetcode} onChangeText={t => setUsernames({...usernames, leetcode: t})} placeholder="LeetCode" />}
                  {showStrava && <RPGInput label="STRAVA_USERNAME" value={usernames.strava} onChangeText={t => setUsernames({...usernames, strava: t})} placeholder="Strava" />}
                  <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
                    <RPGButton style={{ flex: 1 }} variant="ghost" title="CANCEL" onPress={() => setIsEditingNames(false)} />
                    <RPGButton style={{ flex: 1 }} variant="primary" title={isValidating ? "VERIFYING..." : "SAVE"} onPress={handleSaveNames} disabled={isValidating} />
                  </View>
                </View>
              ) : (
                <View style={{ display: 'flex', gap: 6 }}>
                  {showGithub && <Text style={s.statLabel}>GITHUB: <Text style={{ color: colors.onSurface }}>{usernames.github || 'NOT LINKED'}</Text></Text>}
                  {showLeetcode && <Text style={s.statLabel}>LEETCODE: <Text style={{ color: colors.onSurface }}>{usernames.leetcode || 'NOT LINKED'}</Text></Text>}
                  {showStrava && <Text style={s.statLabel}>STRAVA: <Text style={{ color: colors.onSurface }}>{usernames.strava || 'NOT LINKED'}</Text></Text>}
                </View>
              )}
            </View>
          )}
              </>
            );
          })()}
          <TouchableOpacity style={s.logoutBtn} onPress={handleLogout} activeOpacity={0.7}>
            <Text style={s.logoutText}>⏻ LOGOUT_SESSION</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.leaveBtn} onPress={handleLeaveRealm} activeOpacity={0.7}>
            <Text style={s.leaveText}>🚪 LEAVE_REALM</Text>
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
  leaveBtn: {
    marginTop: 10, borderWidth: 1, borderColor: colors.outline,
    padding: 12, alignItems: 'center',
  },
  leaveText: { fontFamily: fonts.label, fontSize: 11, color: colors.onSurfaceVariant, letterSpacing: 2 },
  closeBtn: { alignItems: 'center', marginTop: 10 },
  closeText: { fontFamily: fonts.label, fontSize: 11, color: colors.onSurfaceVariant, letterSpacing: 2 },
});
