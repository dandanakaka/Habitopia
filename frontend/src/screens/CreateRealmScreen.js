import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { colors, fonts } from '../theme';
import RPGInput from '../components/RPGInput';
import RPGButton from '../components/RPGButton';
import useAuthStore from '../store/authStore';
import useRealmStore from '../store/realmStore';
import { collection, addDoc, doc, updateDoc, arrayUnion, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import fetchWithAuth from '../apiClient';

export default function CreateRealmScreen({ navigation }) {
  const [realmName, setRealmName] = useState('');
  const [memberCount, setMemberCount] = useState(3);
  const [selectedHabits, setSelectedHabits] = useState([]);
  const [customHabits, setCustomHabits] = useState([]);
  const [usernames, setUsernames] = useState({ leetcode: '', strava: '', github: '' });
  const [isCreating, setIsCreating] = useState(false);
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

  const handleCreate = async () => {
    if (!realmName.trim() || !user) return;

    setIsCreating(true);
    try {
      const uid = user.uid || user.id;

      // 0. Validate external usernames
      for (const type of ['LEETCODE', 'GITHUB']) {
        if (selectedHabits.includes(type)) {
          const username = usernames[type.toLowerCase()].trim();
          if (!username) {
            Alert.alert("Missing Username", `Please provide a username for ${type}.`);
            setIsCreating(false);
            return;
          }
          try {
            const res = await fetchWithAuth(`/pulse/validate-username?type=${type.toLowerCase()}&username=${username}`);
            if (!res.valid) {
              Alert.alert("Invalid Username", `The ${type} username '${username}' could not be verified.`);
              setIsCreating(false);
              return;
            }
          } catch (e) {
            console.error("Validation error", e);
          }
        }
      }

      // 1. Create realm document
      const docRef = await addDoc(collection(db, 'realms'), {
        names: realmName.trim(),
        members: [uid],
        health: 0,
        total_xp: 0,
        completions: 0,
        habit_ids: [],
        total_members: memberCount,
      });

      const userRef = doc(db, 'users', uid);

      // 2. Save usernames to user document
      const userUpdate = { realm_ids: arrayUnion(docRef.id) };
      if (selectedHabits.includes('LEETCODE') && usernames.leetcode.trim())
        userUpdate.leetcodeName = usernames.leetcode.trim();
      if (selectedHabits.includes('STRAVA') && usernames.strava.trim())
        userUpdate.stravaName = usernames.strava.trim();
      if (selectedHabits.includes('GITHUB') && usernames.github.trim())
        userUpdate.githubName = usernames.github.trim();
      await updateDoc(userRef, userUpdate);

      // 3. Create habit documents
      const habitIds = [];
      const now = serverTimestamp();

      for (const type of ['LEETCODE', 'STRAVA', 'GITHUB']) {
        if (selectedHabits.includes(type)) {
          const habitRef = await addDoc(collection(db, 'habits'), {
            user_id: uid,
            realm_id: docRef.id,
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
              user_id: uid,
              realm_id: docRef.id,
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

      // 4. Link habit IDs to user's currentHabits and realm's habit_ids
      if (habitIds.length > 0) {
        await updateDoc(userRef, { currentHabits: arrayUnion(...habitIds) });
        await updateDoc(doc(db, 'realms', docRef.id), { habit_ids: arrayUnion(...habitIds) });
      }

      // 5. Init store and navigate
      const { fetchRealm } = useRealmStore.getState();
      await fetchRealm(docRef.id);

      setIsCreating(false);
      navigation.replace('MainTabs');
    } catch (err) {
      console.error('Error creating realm:', err);
      Alert.alert('Error', 'Could not create realm. Please try again.');
      setIsCreating(false);
    }
  };

  return (
    <SafeAreaView style={s.safe}>
      {/* Top Bar */}
      <View style={s.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
          <Text style={s.backText}>← BACK</Text>
        </TouchableOpacity>
        <Text style={s.topBarTitle}>CREATE REALM</Text>
      </View>

      <ScrollView style={s.scroll} showsVerticalScrollIndicator={false}>

        <RPGInput
          label="REALM NAME"
          value={realmName}
          onChangeText={setRealmName}
          placeholder="e.g. The Iron Village"
        />

        {/* Member Count Selector */}
        <Text style={s.fieldLabel}>{'> '}MEMBER COUNT</Text>
        <View style={s.chipRow}>
          {[3, 4, 5].map((num) => (
            <TouchableOpacity
              key={num}
              style={[s.chip, memberCount === num && s.chipActive]}
              onPress={() => setMemberCount(num)}
            >
              <Text style={[s.chipText, memberCount === num && s.chipTextActive]}>{num}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Habit Selection */}
        <Text style={s.fieldLabel}>{'> '}CHOOSE HABITS</Text>
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

        {/* Summary */}
        <View style={s.summaryBox}>
          <Text style={s.summaryLabel}>{'> '}REALM PREVIEW:</Text>
          <Text style={s.summaryText}>NAME: {realmName || '---'}</Text>
          <Text style={s.summaryText}>MEMBERS: {memberCount}</Text>
          <Text style={s.summaryText}>HABITS: {selectedHabits.length > 0 ? selectedHabits.join(', ') : 'NONE'}</Text>
        </View>

        <RPGButton
          title={isCreating ? 'CREATING...' : 'CREATE REALM'}
          variant="primary"
          onPress={handleCreate}
          disabled={!realmName.trim() || isCreating}
          style={s.ctaBtn}
        />
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
  scroll: { flex: 1, paddingHorizontal: 16, paddingTop: 20 },
  sectionLabel: { fontFamily: fonts.label, fontSize: 11, color: colors.secondary, letterSpacing: 2, marginBottom: 16 },
  fieldLabel: { fontFamily: fonts.label, fontSize: 11, color: colors.secondary, letterSpacing: 2, marginBottom: 8 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
  chip: {
    borderWidth: 1, borderColor: colors.outline, backgroundColor: colors.surface,
    paddingHorizontal: 16, paddingVertical: 10, alignItems: 'center', justifyContent: 'center',
  },
  chipWide: { paddingHorizontal: 14 },
  chipActive: { borderColor: colors.secondary, backgroundColor: 'rgba(76,227,70,0.1)', borderWidth: 2 },
  chipText: { fontFamily: fonts.label, fontSize: 11, color: colors.onSurfaceVariant, letterSpacing: 1.5 },
  chipTextActive: { color: colors.secondary },
  summaryBox: {
    borderWidth: 1, borderColor: colors.outlineVariant, backgroundColor: colors.surface,
    padding: 14, marginBottom: 20,
  },
  summaryLabel: { fontFamily: fonts.label, fontSize: 11, color: colors.secondary, letterSpacing: 2, marginBottom: 8 },
  summaryText: { fontFamily: fonts.body, fontSize: 12, color: colors.onSurfaceVariant, letterSpacing: 1, marginBottom: 3 },
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
