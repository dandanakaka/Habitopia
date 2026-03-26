import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { colors, fonts, spacing, shape, glow } from '../theme/theme';
import RPGInput from '../components/RPGInput';
import RPGButton from '../components/RPGButton';
import useAuthStore from '../store/authStore';
import useRealmStore from '../store/realmStore';
import { doc, getDoc, updateDoc, arrayUnion } from 'firebase/firestore';
import { db } from '../firebase';

export default function JoinRealmScreen({ navigation }) {
  const [realmCode, setRealmCode] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  const user = useAuthStore((s) => s.user);

  const handleJoin = async () => {
    const code = realmCode.trim();
    if (!code || !user?.uid) return;

    setIsJoining(true);

    try {
      // 1. Check if the realm exists
      const realmRef = doc(db, 'realms', code);
      const realmSnap = await getDoc(realmRef);

      if (!realmSnap.exists()) {
        Alert.alert("Invalid Code", "No realm matches this invite code.");
        setIsJoining(false);
        return;
      }

      const realmData = realmSnap.data();

      // Check if user is already in it
      if (realmData.members && realmData.members.includes(user.uid)) {
        Alert.alert("Already a Member", "You are already part of this realm.");
        setIsJoining(false);
        return;
      }

      // Check if realm is full
      const maxMembers = realmData.total_members || 5;
      if (realmData.members && realmData.members.length >= maxMembers) {
        Alert.alert("Realm Full", "This realm has already reached its maximum capacity.");
        setIsJoining(false);
        return;
      }

      // 2. Add user to the realm's members list
      await updateDoc(realmRef, {
        members: arrayUnion(user.uid)
      });

      // 3. Add realm code to the user's realm list
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        realm_ids: arrayUnion(code) // 'realm_ids' stores the list of joined realms
      });

      // 4. Initialize the store immediately for the joined realm
      const { fetchRealm } = useRealmStore.getState();
      await fetchRealm(code);

      setIsJoining(false);
      navigation.replace('MainTabs');

    } catch (error) {
      console.error("Error joining realm:", error);
      Alert.alert("Connection Error", "Could not complete the process. Please check your connection.");
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
        <Text style={s.topBarTitle}>JOIN_REALM</Text>
      </View>

      <View style={s.container}>
        <Text style={s.sectionLabel}>{'> '}ENTER_REALM_CODE:</Text>
        <Text style={s.desc}>Input the invite code shared by your realm leader to join an existing village.</Text>

        <View style={s.codeBox}>
          <RPGInput
            label="REALM_CODE"
            value={realmCode}
            onChangeText={setRealmCode}
            placeholder="e.g. xK7m2pQ9"
          />
        </View>

        <View style={s.infoBox}>
          <Text style={s.infoLabel}>{'> '}PROTOCOL_INFO:</Text>
          <Text style={s.infoText}>• Code is case-sensitive</Text>
          <Text style={s.infoText}>• Codes expire after 24h</Text>
          <Text style={s.infoText}>• Max 5 members per realm</Text>
        </View>

        <RPGButton
          title={isJoining ? "JOINING..." : "JOIN_REALM"}
          variant="primary"
          onPress={handleJoin}
          disabled={!realmCode.trim() || isJoining}
          style={s.ctaBtn}
        />
      </View>
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
  container: { flex: 1, paddingHorizontal: 16, paddingTop: 24 },
  sectionLabel: { fontFamily: fonts.label, fontSize: 11, color: colors.secondary, letterSpacing: 2, marginBottom: 6 },
  desc: { fontFamily: fonts.body, fontSize: 12, color: colors.onSurfaceVariant, lineHeight: 18, marginBottom: 24 },
  codeBox: {
    borderWidth: 1, borderColor: colors.outlineVariant, backgroundColor: colors.surface,
    padding: 16, marginBottom: 20,
  },
  infoBox: {
    borderWidth: 1, borderColor: colors.outlineVariant, backgroundColor: colors.surface,
    padding: 14, marginBottom: 24,
  },
  infoLabel: { fontFamily: fonts.label, fontSize: 11, color: colors.secondary, letterSpacing: 2, marginBottom: 8 },
  infoText: { fontFamily: fonts.body, fontSize: 11, color: colors.onSurfaceVariant, marginBottom: 3 },
  ctaBtn: { marginTop: 4 },
});
