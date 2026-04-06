import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { colors, fonts } from '../theme';
import RPGInput from '../components/RPGInput';
import RPGButton from '../components/RPGButton';
import useAuthStore from '../store/authStore';
import useRealmStore from '../store/realmStore';
import { collection, addDoc, doc, getDoc, updateDoc, arrayUnion, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import fetchWithAuth from '../apiClient';

export default function JoinRealmScreen({ navigation }) {
  const [realmCode, setRealmCode] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  const [selectedHabits, setSelectedHabits] = useState([]);
  const [customHabits, setCustomHabits] = useState([]);
  const [usernames, setUsernames] = useState({ leetcode: '', strava: '', github: '' });
  const user = useAuthStore((s) => s.user);

  const toggleHabit = (habit) => {
    if (selectedHabits.includes(habit)) {
      setSelectedHabits(selectedHabits.filter(h => h !== habit));
      if (habit === 'CUSTOM') setCustomHabits([]);
    } else {
      setSelectedHabits([...selectedHabits, habit]);
      if (habit === 'CUSTOM') setCustomHabits(['']);
    }
  };

  const handleJoin = async () => {
    const code = realmCode.trim();
    if (!code || !user?.uid) return;

    setIsJoining(true);

    try {
      // 0. Validate external usernames
      for (const type of ['LEETCODE', 'GITHUB']) {
        if (selectedHabits.includes(type)) {
          const username = usernames[type.toLowerCase()].trim();
          if (!username) {
            Alert.alert("Missing Username", `Please provide a username for ${type}.`);
            setIsJoining(false);
            return;
          }
          try {
            const res = await fetchWithAuth(`/pulse/validate-username?type=${type.toLowerCase()}&username=${username}`);
            if (!res.valid) {
              Alert.alert("Invalid Username", `The ${type} username '${username}' could not be verified.`);
              setIsJoining(false);
              return;
            }
          } catch (e) {
            console.error("Validation error", e);
          }
        }
      }

      // 1. Check if realm exists
      const realmRef = doc(db, 'realms', code);
      const realmSnap = await getDoc(realmRef);

      if (!realmSnap.exists()) {
        Alert.alert('Invalid Code', 'No realm matches this invite code.');
        setIsJoining(false);
        return;
      }

      const realmData = realmSnap.data();

      if (realmData.members && realmData.members.includes(user.uid)) {
        Alert.alert('Already a Member', 'You are already part of this realm.');
        setIsJoining(false);
        return;
      }

      const maxMembers = realmData.total_members || 5;
      if (realmData.members && realmData.members.length >= maxMembers) {
        Alert.alert('Realm Full', 'This realm has already reached its maximum capacity.');
        setIsJoining(false);
        return;
      }

      // 2. Add user to realm
      await updateDoc(realmRef, { members: arrayUnion(user.uid) });

      const userRef = doc(db, 'users', user.uid);

      // 3. Save usernames + realm ID to user document
      const userUpdate = { realm_ids: arrayUnion(code) };
      if (selectedHabits.includes('LEETCODE') && usernames.leetcode.trim())
        userUpdate.leetcodeName = usernames.leetcode.trim();
      if (selectedHabits.includes('STRAVA') && usernames.strava.trim())
        userUpdate.stravaName = usernames.strava.trim();
      if (selectedHabits.includes('GITHUB') && usernames.github.trim())
        userUpdate.githubName = usernames.github.trim();
      await updateDoc(userRef, userUpdate);

      // 4. Create habit documents
      const habitIds = [];
      const now = serverTimestamp();

      for (const type of ['LEETCODE', 'STRAVA', 'GITHUB']) {
        if (selectedHabits.includes(type)) {
          const habitRef = await addDoc(collection(db, 'habits'), {
            user_id: user.uid,
            realm_id: code,
            title: type.charAt(0) + type.slice(1).toLowerCase(),
            type: type.toLowerCase(),
            streak: 0,
            status: 0,
            lastUpdated: now,
            xp_value: 10,
          });
          habitIds.push(habitRef.id);
        }
      }

      if (selectedHabits.includes('CUSTOM')) {
        for (const habitName of customHabits) {
          if (habitName.trim()) {
            const habitRef = await addDoc(collection(db, 'habits'), {
              user_id: user.uid,
              realm_id: code,
              title: habitName.trim(),
              type: 'custom',
              streak: 0,
              status: 0,
              lastUpdated: now,
              xp_value: 10,
            });
            habitIds.push(habitRef.id);
          }
        }
      }

      // 5. Link habit IDs to user's currentHabits and realm's habit_ids
      if (habitIds.length > 0) {
        await updateDoc(userRef, { currentHabits: arrayUnion(...habitIds) });
        await updateDoc(realmRef, { habit_ids: arrayUnion(...habitIds) });
      }

      // 6. Init store and navigate
      const { fetchRealm } = useRealmStore.getState();
      await fetchRealm(code);

      setIsJoining(false);
      navigation.replace('MainTabs');
    } catch (error) {
      console.error('Error joining realm:', error);
      Alert.alert('Connection Error', 'Could not complete the process. Please check your connection.');
      setIsJoining(false);
    }
  };

  return (
    <SafeAreaView style={s.safe}>
      {/* Top Bar */}
      <View style={s.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn} disabled={isJoining}>
          <Text style={s.backText}>← BACK</Text>
        </TouchableOpacity>
        <Text style={s.topBarTitle}>JOIN REALM</Text>
      </View>

      <ScrollView style={s.scroll} showsVerticalScrollIndicator={false}>
        <View style={s.container}>
          <Text style={s.sectionLabel}>{'> '}ENTER REALM CODE:</Text>
          <Text style={s.desc}>Input the invite code shared by your realm leader to join an existing village.</Text>

          <View style={s.codeBox}>
            <RPGInput
              label="REALM CODE"
              value={realmCode}
              onChangeText={setRealmCode}
              placeholder="e.g. xK7m2pQ9"
            />
          </View>

          {/* Habit Selection */}
          <Text style={s.sectionLabel}>{'> '}CHOOSE HABITS:</Text>
          <View style={s.chipRow}>
            {['LEETCODE', 'STRAVA', 'GITHUB', 'CUSTOM'].map((habit) => (
              <TouchableOpacity
                key={habit}
                style={[s.chip, s.chipWide, selectedHabits.includes(habit) && s.chipActive]}
                onPress={() => toggleHabit(habit)}
              >
                <Text style={[s.chipText, selectedHabits.includes(habit) && s.chipTextActive]}>{habit}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Username Inputs for services */}
          {selectedHabits.includes('LEETCODE') && (
            <RPGInput
              label="LEETCODE USERNAME"
              value={usernames.leetcode}
              onChangeText={(val) => setUsernames({ ...usernames, leetcode: val })}
              placeholder="Your LeetCode username"
            />
          )}
          {selectedHabits.includes('STRAVA') && (
            <RPGInput
              label="STRAVA USERNAME"
              value={usernames.strava}
              onChangeText={(val) => setUsernames({ ...usernames, strava: val })}
              placeholder="Your Strava username"
            />
          )}
          {selectedHabits.includes('GITHUB') && (
            <RPGInput
              label="GITHUB USERNAME"
              value={usernames.github}
              onChangeText={(val) => setUsernames({ ...usernames, github: val })}
              placeholder="Your GitHub username"
            />
          )}

          {/* Custom Habits */}
          {selectedHabits.includes('CUSTOM') && (
            <View>
              <Text style={s.fieldLabel}>{'> '}CUSTOM HABITS</Text>
              {customHabits.map((habit, index) => (
                <View key={index} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <View style={{ flex: 1 }}>
                    <RPGInput
                      label={`HABIT ${index + 1}`}
                      value={habit}
                      onChangeText={(val) => {
                        const newHabits = [...customHabits];
                        newHabits[index] = val;
                        setCustomHabits(newHabits);
                      }}
                      placeholder="e.g. Meditate"
                    />
                  </View>
                  {customHabits.length > 1 && (
                    <TouchableOpacity
                      onPress={() => setCustomHabits(customHabits.filter((_, i) => i !== index))}
                      style={{ marginBottom: 16 }}
                    >
                      <Text style={{ color: colors.error, fontFamily: fonts.label, fontSize: 18 }}>✕</Text>
                    </TouchableOpacity>
                  )}
                </View>
              ))}
              <TouchableOpacity
                onPress={() => setCustomHabits([...customHabits, ''])}
                style={s.addHabitBtn}
              >
                <Text style={s.addHabitText}>+ ADD ANOTHER</Text>
              </TouchableOpacity>
            </View>
          )}

          <View style={s.infoBox}>
            <Text style={s.infoLabel}>{'> '}PROTOCOL INFO:</Text>
            <Text style={s.infoText}>• Code is case-sensitive</Text>
            <Text style={s.infoText}>• Codes expire after 24h</Text>
            <Text style={s.infoText}>• Max 5 members per realm</Text>
          </View>

          <RPGButton
            title={isJoining ? 'JOINING...' : 'JOIN REALM'}
            variant="primary"
            onPress={handleJoin}
            disabled={!realmCode.trim() || isJoining}
            style={s.ctaBtn}
          />
          <View style={{ height: 30 }} />
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
  scroll: { flex: 1 },
  container: { flex: 1, paddingHorizontal: 16, paddingTop: 24 },
  sectionLabel: { fontFamily: fonts.label, fontSize: 11, color: colors.secondary, letterSpacing: 2, marginBottom: 6 },
  fieldLabel: { fontFamily: fonts.label, fontSize: 11, color: colors.secondary, letterSpacing: 2, marginBottom: 8 },
  desc: { fontFamily: fonts.body, fontSize: 12, color: colors.onSurfaceVariant, lineHeight: 18, marginBottom: 24 },
  codeBox: {
    borderWidth: 1, borderColor: colors.outlineVariant, backgroundColor: colors.surface,
    padding: 16, marginBottom: 20,
  },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
  chip: {
    borderWidth: 1, borderColor: colors.outline, backgroundColor: colors.surface,
    paddingHorizontal: 16, paddingVertical: 10, alignItems: 'center', justifyContent: 'center',
  },
  chipWide: { paddingHorizontal: 14 },
  chipActive: { borderColor: colors.secondary, backgroundColor: 'rgba(76,227,70,0.1)', borderWidth: 2 },
  chipText: { fontFamily: fonts.label, fontSize: 11, color: colors.onSurfaceVariant, letterSpacing: 1.5 },
  chipTextActive: { color: colors.secondary },
  infoBox: {
    borderWidth: 1, borderColor: colors.outlineVariant, backgroundColor: colors.surface,
    padding: 14, marginBottom: 24,
  },
  infoLabel: { fontFamily: fonts.label, fontSize: 11, color: colors.secondary, letterSpacing: 2, marginBottom: 8 },
  infoText: { fontFamily: fonts.body, fontSize: 11, color: colors.onSurfaceVariant, marginBottom: 3 },
  ctaBtn: { marginTop: 4 },
  addHabitBtn: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.outline,
    padding: 10,
    alignItems: 'center',
    marginBottom: 20,
  },
  addHabitText: { fontFamily: fonts.label, fontSize: 11, color: colors.secondary, letterSpacing: 1 },
});
