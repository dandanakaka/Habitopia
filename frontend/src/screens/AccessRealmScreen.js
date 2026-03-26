import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { colors, fonts, spacing, shape, glow } from '../theme/theme';
import useAuthStore from '../store/authStore';
import useRealmStore from '../store/realmStore';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';

function getHealthColor(health) {
  if (health >= 70) return colors.secondary;
  if (health >= 40) return colors.tertiary;
  return colors.error;
}

function getHealthStatus(health) {
  if (health >= 70) return 'THRIVING';
  if (health >= 40) return 'STABLE';
  return 'CRITICAL';
}

export default function AccessRealmScreen({ navigation }) {
  const user = useAuthStore((s) => s.user);
  const [realms, setRealms] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchRealms = async () => {
      const realmIds = user?.realm_ids || [];
      if (realmIds.length === 0) {
        setRealms([]);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        // Fetch each realm document
        const realmPromises = realmIds.map((rId) => getDoc(doc(db, 'realms', rId)));
        const realmSnaps = await Promise.all(realmPromises);

        const validRealms = realmSnaps
          .filter(snap => snap.exists())
          .map(snap => ({
            id: snap.id,
            ...snap.data()
          }));

        setRealms(validRealms);
      } catch (error) {
        console.error("Error fetching realms:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRealms();
  }, [user?.realm_ids]);

  const fetchRealm = useRealmStore((s) => s.fetchRealm);

  const handleSelect = (realmId) => {
    fetchRealm(realmId);
    navigation.replace('MainTabs');
  };

  return (
    <SafeAreaView style={s.safe}>
      {/* Top Bar */}
      <View style={s.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
          <Text style={s.backText}>← BACK</Text>
        </TouchableOpacity>
        <Text style={s.topBarTitle}>ACCESS_REALM</Text>
      </View>

      <ScrollView style={s.scroll} showsVerticalScrollIndicator={false}>
        <Text style={s.sectionLabel}>{'> '}YOUR_REALMS:</Text>
        <Text style={s.desc}>Select a realm to enter. Active realms are listed below.</Text>

        {isLoading ? (
          <View style={s.loaderBox}>
            <ActivityIndicator color={colors.secondary} size="large" />
            <Text style={s.loaderText}>SYNCING_DATABASE...</Text>
          </View>
        ) : realms.length > 0 ? (
          realms.map((realm) => {
            const healthVal = typeof realm.health === 'number' ? realm.health : 0;
            const healthColor = getHealthColor(healthVal);
            const status = getHealthStatus(healthVal);
            const memberCount = Array.isArray(realm.members) ? realm.members.length : 0;
            const rName = realm.names || realm.name || 'UNKNOWN REALM';

            return (
              <TouchableOpacity
                key={realm.id}
                style={s.realmCard}
                onPress={() => handleSelect(realm.id)}
                activeOpacity={0.7}
              >
                <View style={s.realmRow}>
                  <View style={s.realmIconBox}>
                    <Text style={s.realmIcon}>{healthVal >= 70 ? '🏰' : healthVal >= 40 ? '🏗️' : '🏚️'}</Text>
                  </View>
                  <View style={s.realmInfo}>
                    <Text style={s.realmName}>{rName.toUpperCase()}</Text>
                    <Text style={s.realmMeta}>{memberCount} MEMBERS // {status}</Text>
                  </View>
                  <View style={s.healthBadge}>
                    <Text style={[s.healthText, { color: healthColor }]}>{healthVal}</Text>
                    <Text style={s.healthUnit}>HP</Text>
                  </View>
                </View>
                <View style={s.healthTrack}>
                  <View style={[s.healthFill, { width: `${Math.min(100, Math.max(0, healthVal))}%`, backgroundColor: healthColor }]} />
                </View>
              </TouchableOpacity>
            );
          })
        ) : (
          <View style={s.emptyNotice}>
            <Text style={s.emptyText}>{'>'} NO REALMS FOUND. CREATE OR JOIN ONE.</Text>
          </View>
        )}

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
  sectionLabel: { fontFamily: fonts.label, fontSize: 11, color: colors.secondary, letterSpacing: 2, marginBottom: 6 },
  desc: { fontFamily: fonts.body, fontSize: 12, color: colors.onSurfaceVariant, lineHeight: 18, marginBottom: 20 },
  loaderBox: { paddingVertical: 40, alignItems: 'center' },
  loaderText: { fontFamily: fonts.label, fontSize: 10, color: colors.secondary, letterSpacing: 2, marginTop: 16 },
  realmCard: {
    borderWidth: 1, borderColor: colors.outlineVariant, backgroundColor: colors.surface,
    padding: 14, marginBottom: 10,
  },
  realmRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10 },
  realmIconBox: {
    width: 40, height: 40, backgroundColor: colors.surfaceContainer,
    borderWidth: 1, borderColor: colors.outline, alignItems: 'center', justifyContent: 'center',
  },
  realmIcon: { fontSize: 20 },
  realmInfo: { flex: 1 },
  realmName: { fontFamily: fonts.headline, fontSize: 13, color: colors.onSurface, letterSpacing: 2 },
  realmMeta: { fontFamily: fonts.label, fontSize: 9, color: colors.onSurfaceVariant, letterSpacing: 1.5, marginTop: 2 },
  healthBadge: { alignItems: 'center' },
  healthText: { fontFamily: fonts.headline, fontSize: 18 },
  healthUnit: { fontFamily: fonts.label, fontSize: 8, color: colors.onSurfaceVariant, letterSpacing: 1 },
  healthTrack: { height: 4, backgroundColor: colors.surfaceContainerHighest, overflow: 'hidden' },
  healthFill: { height: 4 },
  emptyNotice: {
    borderWidth: 1, borderColor: colors.outlineVariant, borderStyle: 'dashed',
    padding: 16, alignItems: 'center', marginTop: 10,
  },
  emptyText: { fontFamily: fonts.label, fontSize: 10, color: colors.onSurfaceVariant, letterSpacing: 2 },
});
