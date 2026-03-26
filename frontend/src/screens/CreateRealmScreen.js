import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { colors, fonts, spacing, shape, glow } from '../theme/theme';
import RPGInput from '../components/RPGInput';
import RPGButton from '../components/RPGButton';
import useAuthStore from '../store/authStore';
import useRealmStore from '../store/realmStore';
import { collection, addDoc, doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { db } from '../firebase';

const THEMES = ['CYBER', 'ARCANE', 'FORGE', 'NATURE'];

export default function CreateRealmScreen({ navigation }) {
  const [realmName, setRealmName] = useState('');
  const [memberCount, setMemberCount] = useState(3);
  const [selectedTheme, setSelectedTheme] = useState('CYBER');
  const [isCreating, setIsCreating] = useState(false);
  const user = useAuthStore((s) => s.user);

  const handleCreate = async () => {
    if (!realmName.trim() || !user) return;

    setIsCreating(true);
    try {
      // Create realm document in Firebase
      const docRef = await addDoc(collection(db, 'realms'), {
        names: realmName.trim(), // As requested: names field (realm name)
        members: [user.id || user.uid], // As requested: members field with just one user
        health: 100, // As requested: health field as 100
        total_xp: 0, // As requested: total_xp as 0
        completions: 0, // As requested: no.of completes field as 0
        habit_ids: 0, // As requested: habit ids as 0
        total_members: memberCount // As requested: total_members as chose by user button
      });

      console.log("Realm created with ID:", docRef.id);

      // Update user's realm list
      const userRef = doc(db, 'users', user.id || user.uid);
      await updateDoc(userRef, {
        realm_ids: arrayUnion(docRef.id)
      });

      // Initialize the store immediately for the new realm
      const { fetchRealm } = useRealmStore.getState();
      await fetchRealm(docRef.id);

      setIsCreating(false);
      navigation.replace('MainTabs');
    } catch (err) {
      console.error("Error creating realm:", err);
      Alert.alert("Error", "Could not create realm. Please try again.");
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
        <Text style={s.topBarTitle}>CREATE_REALM</Text>
      </View>

      <ScrollView style={s.scroll} showsVerticalScrollIndicator={false}>
        <Text style={s.sectionLabel}>{'> '}REALM_CONFIG:</Text>

        <RPGInput
          label="REALM_NAME"
          value={realmName}
          onChangeText={setRealmName}
          placeholder="e.g. The Iron Village"
        />

        {/* Member Count Selector */}
        <Text style={s.fieldLabel}>{'> '}MEMBER_COUNT</Text>
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

        {/* Theme Selection */}
        <Text style={s.fieldLabel}>{'> '}THEME_SELECT</Text>
        <View style={s.chipRow}>
          {THEMES.map((theme) => (
            <TouchableOpacity
              key={theme}
              style={[s.chip, s.chipWide, selectedTheme === theme && s.chipActive]}
              onPress={() => setSelectedTheme(theme)}
            >
              <Text style={[s.chipText, selectedTheme === theme && s.chipTextActive]}>{theme}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Summary */}
        <View style={s.summaryBox}>
          <Text style={s.summaryLabel}>{'> '}REALM_PREVIEW:</Text>
          <Text style={s.summaryText}>NAME: {realmName || '---'}</Text>
          <Text style={s.summaryText}>MEMBERS: {memberCount}</Text>
          <Text style={s.summaryText}>THEME: {selectedTheme}</Text>
        </View>

        <RPGButton
          title={isCreating ? "CREATING..." : "CREATE_REALM"}
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
});
