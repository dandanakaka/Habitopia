import React, { useState } from 'react';
import { View, Text, TextInput, Image, StyleSheet, SafeAreaView, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { colors, fonts, spacing, shape } from '../theme/theme';
import useAuthStore from '../store/authStore';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';

export default function AuthScreen({ navigation }) {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [focusField, setFocusField] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const setUser = useAuthStore((s) => s.setUser);

  const handleToggle = () => {
    setIsLogin(!isLogin);
    setErrorMessage('');
  };

  const handleInputChange = (setter, val) => {
    setter(val);
    if (errorMessage) setErrorMessage('');
  };

  const handleSubmit = async () => {
    const emailStr = username.trim();
    const passStr = password.trim();
    setErrorMessage('');

    // Basic validation
    if (!emailStr || !passStr) {
      setErrorMessage("REQUIRED_FIELDS_MISSING: EMAIL_OR_PASS");
      return;
    }
    if (!isLogin && !displayName.trim()) {
      setErrorMessage("REQUIRED_FIELDS_MISSING: DISPLAY_NAME");
      return;
    }

    setIsLoading(true);

    try {
      if (isLogin) {
        // ----- LOGIN FLOW -----
        const userCredential = await signInWithEmailAndPassword(auth, emailStr, passStr);
        // authStore listener will pick this up if we call setUser
        setUser(userCredential.user);
      } else {
        // ----- SIGNUP FLOW -----
        const userCredential = await createUserWithEmailAndPassword(auth, emailStr, passStr);
        const fbUser = userCredential.user;

        // Save user profile fields to the 'users' collection
        const newUserDoc = {
          displayName: displayName.trim(),
          realm_ids: [],
          xp: 0,
          habitsCompleted: 0,
          streak: 0,
          level: 1
        };

        // Write to Firestore database -> 'users' collection -> document ID = their Firebase UID
        await setDoc(doc(db, 'users', fbUser.uid), newUserDoc);

        // Pass to the app-wide store
        setUser(fbUser);
      }

      setIsLoading(false);
      // navigation.replace('RealmHub'); // App.js will handle redirect based on auth state now
    } catch (error) {
      setIsLoading(false);
      console.error("Firebase Auth Error:", error);

      // Friendly error messages
      let msg = error.message;
      if (error.code === 'auth/email-already-in-use') msg = "That email already has an account. Switch to Login.";
      if (error.code === 'auth/wrong-password' || error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential') msg = "Incorrect email or password.";

      setErrorMessage(msg.toUpperCase());
    }
  };

  return (
    <SafeAreaView style={s.safe}>
      {/* System Top Bar */}
      <View style={s.topBar}>
        <View style={s.topBarLeft}>
          <Text style={s.topBarIcon}>⬡</Text>
          <Text style={s.topBarTitle}>HABITOPIA_SYS</Text>
        </View>
      </View>

      <KeyboardAvoidingView style={s.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scrollContent}>
          {/* Hero */}
          <View style={s.heroSection}>
            <Image source={require("../../assets/logo.png")} style={s.coinLogo} />
            <Text style={s.hero}>HABITOPIA</Text>
            <Text style={s.heroSub}>SYSTEM_INIT // AUTHENTICATION</Text>
          </View>

          {/* Auth Card */}
          <View style={s.authCard}>
            <Text style={s.accessTitle}>ACCESS YOUR SYSTEM</Text>
            <Text style={s.accessDesc}>Continue your streak. Rebuild your village.</Text>

            {/* Error Message Warning */}
            {errorMessage ? (
              <View style={s.errorBox}>
                <Text style={s.errorText}>⚠ ERROR: {errorMessage}</Text>
              </View>
            ) : null}

            {/* Only show Display Name field if Creating a new account */}
            {!isLogin && (
              <>
                <Text style={s.inputLabel}>{'> '}DISPLAY_NAME</Text>
                <TextInput
                  style={[s.input, focusField === 'display' && s.inputFocus]}
                  value={displayName}
                  onChangeText={(v) => handleInputChange(setDisplayName, v)}
                  placeholder="COMMANDER_TAG"
                  placeholderTextColor={colors.onSurfaceVariant}
                  onFocus={() => setFocusField('display')}
                  onBlur={() => setFocusField(null)}
                  selectionColor={colors.secondary}
                />
              </>
            )}

            <Text style={s.inputLabel}>{'> '}USER_ID / EMAIL</Text>
            <TextInput
              style={[s.input, focusField === 'user' && s.inputFocus]}
              value={username}
              onChangeText={(v) => handleInputChange(setUsername, v)}
              placeholder="commander@habitopia.sys"
              placeholderTextColor={colors.onSurfaceVariant}
              keyboardType="email-address"
              autoCapitalize="none"
              onFocus={() => setFocusField('user')}
              onBlur={() => setFocusField(null)}
              selectionColor={colors.secondary}
            />

            <Text style={s.inputLabel}>{'> '}PASS_CODE</Text>
            <TextInput
              style={[s.input, focusField === 'pass' && s.inputFocus]}
              value={password}
              onChangeText={(v) => handleInputChange(setPassword, v)}
              placeholder="********"
              placeholderTextColor={colors.onSurfaceVariant}
              secureTextEntry
              onFocus={() => setFocusField('pass')}
              onBlur={() => setFocusField(null)}
              selectionColor={colors.secondary}
            />

            {/* Submit */}
            <TouchableOpacity
              style={[s.submitBtn, isLoading && s.submitBtnDisabled]}
              onPress={handleSubmit}
              activeOpacity={0.8}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#000000" size="small" />
              ) : (
                <Text style={s.submitText}>{isLogin ? 'LOGIN' : 'SIGN UP'}</Text>
              )}
            </TouchableOpacity>

            {/* Toggle */}
            <TouchableOpacity onPress={handleToggle}>
              <Text style={s.toggleText}>
                {isLogin ? 'NO SQUAD? [ ' : 'HAVE ACCOUNT? [ '}
                <Text style={s.toggleBold}>{isLogin ? 'CREATE ONE' : 'LOGIN'}</Text>
                {' ]'}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  topBar: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: colors.outline,
  },
  topBarLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  topBarIcon: { color: colors.secondary, fontSize: 16 },
  topBarTitle: { fontFamily: fonts.headline, fontSize: 13, color: colors.secondary, letterSpacing: 2 },
  container: { flex: 1 },
  scrollContent: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 20, paddingVertical: 20 },
  heroSection: { alignItems: 'center', marginBottom: 24 },
  coinLogo: { width: 64, height: 64, marginBottom: 12 },
  hero: { fontFamily: fonts.headline, fontSize: 38, color: colors.secondary, textAlign: 'center', letterSpacing: 4 },
  heroSub: {
    fontFamily: fonts.label, fontSize: 11, color: colors.secondary, textAlign: 'center',
    letterSpacing: 3, marginTop: 4,
  },
  authCard: {
    borderWidth: 2, borderColor: colors.primaryContainer, borderStyle: 'dashed',
    borderRadius: shape.radius, backgroundColor: colors.surface, padding: 20,
  },
  accessTitle: { fontFamily: fonts.headline, fontSize: 18, color: colors.onSurface, marginBottom: 6 },
  accessDesc: { fontFamily: fonts.body, fontSize: 13, color: colors.onSurfaceVariant, marginBottom: 20, lineHeight: 18 },
  errorBox: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 1,
    borderColor: colors.error,
    padding: 10,
    marginBottom: 20,
  },
  errorText: {
    color: colors.error,
    fontFamily: fonts.label,
    fontSize: 9,
    letterSpacing: 1,
  },
  inputLabel: { fontFamily: fonts.label, fontSize: 11, color: colors.secondary, letterSpacing: 2, marginBottom: 5 },
  input: {
    backgroundColor: colors.surfaceContainerLowest, borderWidth: 1, borderColor: colors.outline,
    borderRadius: shape.radius, paddingVertical: 12, paddingHorizontal: 14,
    fontFamily: fonts.body, fontSize: 14, color: colors.onSurface, marginBottom: 16,
  },
  inputFocus: { borderColor: colors.secondary, borderWidth: 2 },
  submitBtn: {
    backgroundColor: colors.secondary, paddingVertical: 14, alignItems: 'center',
    borderRadius: shape.radius, marginTop: 4, marginBottom: 16,
  },
  submitBtnDisabled: { opacity: 0.5 },
  submitText: { fontFamily: fonts.headline, fontSize: 15, color: '#000000', letterSpacing: 3 },
  toggleText: { fontFamily: fonts.label, fontSize: 11, color: colors.onSurfaceVariant, textAlign: 'center', letterSpacing: 1 },
  toggleBold: { color: colors.onSurface, textDecorationLine: 'underline' },
});
