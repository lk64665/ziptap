// src/screens/OtpVerificationScreen.js
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ScreenWrapper from '../components/ScreenWrapper';
import { COLORS, RADIUS, FONT } from '../components/theme';

function makeOtp() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export default function OtpVerificationScreen({ navigation, route }) {
  const next = route?.params?.next ?? 'MainApp';
  const label = route?.params?.label ?? 'your phone/email';

  const expectedRef = useRef(makeOtp());
  const otpRef = useRef('');
  const [err, setErr] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [seconds, setSeconds] = useState(30);

  const hint = useMemo(() => expectedRef.current, []);

  useEffect(() => {
    setSeconds(30);
    const t = setInterval(() => setSeconds(s => (s > 0 ? s - 1 : 0)), 1000);
    return () => clearInterval(t);
  }, [hint]);

  async function handleVerify() {
    const entered = (otpRef.current || '').trim();
    if (entered.length < 4) { setErr('Enter the OTP'); return; }
    setErr('');
    setVerifying(true);
    await new Promise(r => setTimeout(r, 800));
    if (entered === expectedRef.current || entered === '123456') {
      navigation.replace(next);
    } else {
      setErr('Incorrect OTP. Try again.');
    }
    setVerifying(false);
  }

  function handleResend() {
    if (seconds > 0) return;
    expectedRef.current = makeOtp();
    otpRef.current = '';
    setErr('');
    setSeconds(30);
  }

  return (
    <KeyboardAvoidingView style={s.root} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScreenWrapper>
        <View style={s.content}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.back} activeOpacity={0.85}>
          <Ionicons name="chevron-back" size={18} color={COLORS.muted} />
          <Text style={s.backTxt}>Back</Text>
        </TouchableOpacity>

        <View style={s.icon}>
          <Ionicons name="shield-checkmark-outline" size={30} color={COLORS.primary} />
        </View>
        <Text style={s.title}>Verify OTP</Text>
        <Text style={s.sub}>We sent a one-time password to {label}.</Text>
        <Text style={s.devHint}>Demo OTP: {hint} (or use 123456)</Text>

        <TextInput
          style={s.inp}
          placeholder="Enter 6-digit OTP"
          placeholderTextColor={COLORS.muted}
          keyboardType="number-pad"
          inputMode="numeric"
          maxLength={6}
          autoFocus
          defaultValue=""
          onChangeText={(t) => { otpRef.current = t; }}
        />

        {!!err && <Text style={s.err}>{err}</Text>}

        <TouchableOpacity style={[s.btn, verifying && { opacity: 0.7 }]} onPress={handleVerify} disabled={verifying} activeOpacity={0.85}>
          <Text style={s.btnTxt}>{verifying ? 'Verifying…' : 'Verify & Continue'}</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={handleResend} disabled={seconds > 0} activeOpacity={0.85} style={s.resend}>
          <Text style={[s.resendTxt, seconds > 0 && { color: COLORS.muted }]}>
            {seconds > 0 ? `Resend OTP in ${seconds}s` : 'Resend OTP'}
          </Text>
        </TouchableOpacity>
        </View>
      </ScreenWrapper>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.surface },
  content: { flex: 1, padding: 24, paddingBottom: 40, justifyContent: 'center' },
  back: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 18, position: 'absolute', top: 24, left: 24 },
  backTxt: { color: COLORS.muted, fontSize: FONT.base },
  icon: { width: 70, height: 70, borderRadius: 22, backgroundColor: COLORS.primaryBg, borderWidth: 1.5, borderColor: COLORS.primary, alignItems: 'center', justifyContent: 'center', alignSelf: 'center', marginBottom: 14 },
  title: { fontSize: FONT.xl, fontWeight: '800', color: COLORS.text, textAlign: 'center', marginBottom: 6 },
  sub: { fontSize: FONT.base, color: COLORS.muted, textAlign: 'center', marginBottom: 10 },
  devHint: { fontSize: FONT.sm, color: COLORS.muted, textAlign: 'center', marginBottom: 16 },
  inp: { borderWidth: 1.5, borderColor: COLORS.border, borderRadius: RADIUS.md, paddingVertical: 14, paddingHorizontal: 14, fontSize: FONT.lg, color: COLORS.text, textAlign: 'center', letterSpacing: 6, backgroundColor: COLORS.surface },
  err: { color: COLORS.danger, fontSize: FONT.sm, textAlign: 'center', marginTop: 10, marginBottom: 2 },
  btn: { backgroundColor: COLORS.primary, borderRadius: RADIUS.md, paddingVertical: 15, alignItems: 'center', marginTop: 14 },
  btnTxt: { color: '#fff', fontSize: FONT.md, fontWeight: '700' },
  resend: { alignItems: 'center', marginTop: 14 },
  resendTxt: { color: COLORS.primary, fontSize: FONT.base, fontWeight: '600' },
});
