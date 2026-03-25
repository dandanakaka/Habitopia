import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useFonts, SpaceGrotesk_500Medium, SpaceGrotesk_700Bold } from '@expo-google-fonts/space-grotesk';
import { PlusJakartaSans_400Regular, PlusJakartaSans_500Medium, PlusJakartaSans_600SemiBold } from '@expo-google-fonts/plus-jakarta-sans';

import AuthScreen from './src/screens/AuthScreen';
import RealmHubScreen from './src/screens/RealmHubScreen';
import PulseScreen from './src/screens/PulseScreen';
import QuestsScreen from './src/screens/QuestsScreen';
import VillageScreen from './src/screens/VillageScreen';
import { colors, fonts } from './src/theme/theme';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.background,
          borderTopColor: colors.outline,
          borderTopWidth: 1,
          height: 56,
          paddingBottom: 6,
          paddingTop: 6,
        },
        tabBarActiveTintColor: colors.secondary,
        tabBarInactiveTintColor: colors.onSurfaceVariant,
        tabBarLabelStyle: {
          fontFamily: fonts.label,
          fontSize: 9,
          letterSpacing: 2,
        },
      }}
    >
      <Tab.Screen
        name="Village"
        component={VillageScreen}
        options={{
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 18 }}>🏰</Text>,
          tabBarLabel: 'VILLAGE',
        }}
      />
      <Tab.Screen
        name="Quests"
        component={QuestsScreen}
        options={{
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 18 }}>⚔️</Text>,
          tabBarLabel: 'QUESTS',
        }}
      />
      <Tab.Screen
        name="Pulse"
        component={PulseScreen}
        options={{
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 18 }}>◎</Text>,
          tabBarLabel: 'PULSE',
        }}
      />
    </Tab.Navigator>
  );
}

export default function App() {
  const [fontsLoaded] = useFonts({
    SpaceGrotesk_500Medium,
    SpaceGrotesk_700Bold,
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
  });

  if (!fontsLoaded) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color={colors.secondary} size="large" />
        <Text style={styles.loadingText}>INITIALIZING_SYSTEM...</Text>
        <StatusBar style="light" />
      </View>
    );
  }

  return (
    <>
      <StatusBar style="light" />
      <NavigationContainer
        theme={{
          dark: true,
          colors: {
            primary: colors.secondary,
            background: colors.background,
            card: colors.surface,
            text: colors.onSurface,
            border: colors.outline,
            notification: colors.secondary,
          },
          fonts: {
            regular: { fontFamily: 'PlusJakartaSans_400Regular', fontWeight: '400' },
            medium: { fontFamily: 'SpaceGrotesk_500Medium', fontWeight: '500' },
            bold: { fontFamily: 'SpaceGrotesk_700Bold', fontWeight: '700' },
            heavy: { fontFamily: 'SpaceGrotesk_700Bold', fontWeight: '700' },
          },
        }}
      >
        <Stack.Navigator screenOptions={{ headerShown: false, animation: 'fade' }}>
          <Stack.Screen name="Auth" component={AuthScreen} />
          <Stack.Screen name="RealmHub" component={RealmHubScreen} />
          <Stack.Screen name="MainTabs" component={MainTabs} />
        </Stack.Navigator>
      </NavigationContainer>
    </>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    color: colors.onSurfaceVariant,
    fontFamily: fonts.label,
    fontSize: 11,
    letterSpacing: 3,
  },
});
