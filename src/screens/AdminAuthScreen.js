// src/screens/AdminAuthScreen.js
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth, ADMIN_CODE } from '../context/AuthContext';
import { COLORS, RADIUS, FONT } from '../components/theme';
import ScreenWrapper from '../components/ScreenWrapper';

export default function AdminAuthScreen({ navigation }) {
  const { loginAsAdmin } = useAuth();
  const [code,    setCode]    = useState('');
  const [err,     setErr]     = useState('');
  const [loading, setLoading] = useState(false);

  function handleLogin() {
    if (!code) { setErr('Enter the access code'); return; }
    setLoading(true);
    setTimeout(() => {
      if (code === ADMIN_CODE) {
        loginAsAdmin();
        navigation.replace('AdminPanel');
      } else {
        setErr('Incorrect access code. Access denied.');
        setCode('');
      }
      setLoading(false);
    }, 700);
  }

  // ── JSX TAG BALANCE ────────────────────────────────────────────────────────
  //  <ScreenWrapper>                ① open
  //    <View style={s.root}>        ② open
  //      ...
  //    </View>                      ② close
  //  </ScreenWrapper>               ① close
  // ──────────────────────────────────────────────────────────────────────────
  return (
    <ScreenWrapper>
      <View style={s.root}>

        <TouchableOpacity onPress={() => navigation.goBack()} style={s.back}>
          <Ionicons name="chevron-back" size={18} color={COLORS.muted}/>
          <Text style={s.backTxt}>Back</Text>
        </TouchableOpacity>

        <View style={s.icon}>
          <Ionicons name="lock-closed-outline" size={32} color={COLORS.danger}/>
        </View>

        <Text style={s.title}>Administrator Access</Text>
        <Text style={s.sub}>Enter your admin access code to continue</Text>

        <TextInput
          style={s.inp}
          placeholder="Admin access code"
          placeholderTextColor={COLORS.muted}
          secureTextEntry
          autoCapitalize="none"
          value={code}
          onChangeText={setCode}
        />

        {!!err && <Text style={s.err}>{err}</Text>}

        <TouchableOpacity
          style={s.btn}
          onPress={handleLogin}
          disabled={loading}
          activeOpacity={0.85}
        >
          {/* FIX: plain & in JSX text — never use &amp; in React Native */}
          {loading
            ? <ActivityIndicator color="#fff"/>
            : <Text style={s.btnTxt}>Verify & Enter Admin Panel</Text>
          }
        </TouchableOpacity>

      </View>
    </ScreenWrapper>
  );
}

const s = StyleSheet.create({
  root:    { flex: 1, backgroundColor: COLORS.surface, padding: 24, justifyContent: 'center' },
  back:    { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 20 },
  backTxt: { color: COLORS.muted, fontSize: FONT.base },
  icon:    { width: 68, height: 68, borderRadius: 20, backgroundColor: COLORS.dangerBg, borderWidth: 1.5, borderColor: COLORS.dangerBorder, alignItems: 'center', justifyContent: 'center', alignSelf: 'center', marginBottom: 14 },
  title:   { fontSize: FONT.xl, fontWeight: '700', color: COLORS.text, textAlign: 'center', marginBottom: 6 },
  sub:     { color: COLORS.muted, fontSize: FONT.base, textAlign: 'center', marginBottom: 28 },
  inp:     { borderWidth: 1, borderColor: COLORS.border, borderRadius: RADIUS.md, padding: 14, fontSize: FONT.lg, color: COLORS.text, textAlign: 'center', letterSpacing: 2, marginBottom: 8 },
  err:     { color: COLORS.danger, fontSize: FONT.sm, textAlign: 'center', marginBottom: 14 },
  btn:     { backgroundColor: COLORS.danger, borderRadius: RADIUS.md, paddingVertical: 15, alignItems: 'center' },
  btnTxt:  { color: '#fff', fontSize: FONT.md, fontWeight: '600' },
});