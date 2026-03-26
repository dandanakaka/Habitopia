import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity } from 'react-native';
import { colors, fonts, spacing, shape, glow } from '../theme/theme';
import RPGInput from '../components/RPGInput';
import RPGButton from '../components/RPGButton';

export default function JoinRealmScreen({ navigation }) {
  const [realmCode, setRealmCode] = useState('');

  const handleJoin = () => {
    if (!realmCode.trim()) return;
    navigation.replace('MainTabs');
  };

  return (
    <SafeAreaView style={s.safe}>
      {/* Top Bar */}
      <View style={s.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
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
          title="JOIN_REALM"
          variant="primary"
          onPress={handleJoin}
          disabled={!realmCode.trim()}
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
