// src/screens/OTPScreen.js
// Simulated OTP: any 4-digit code is accepted.
// UI has 4 individual boxes, auto-advances, and shows a resend timer.
import React, { useRef, useState, useEffect, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ScreenWrapper from '../components/ScreenWrapper';
import { COLORS, RADIUS, FONT } from '../components/theme';

const OTP_LENGTH = 4;

export default function OTPScreen({ navigation, route }) {
  const { destination = 'MainApp', label = '' } = route.params || {};

  const [digits,    setDigits]    = useState(Array(OTP_LENGTH).fill(''));
  const [loading,   setLoading]   = useState(false);
  const [err,       setErr]       = useState('');
  const [resend,    setResend]    = useState(30);
  const [verified,  setVerified]  = useState(false);
  const inputRefs = useRef([]);

  // Countdown timer for Resend
  useEffect(() => {
    if (resend <= 0) return;
    const t = setTimeout(() => setResend(r => r - 1), 1000);
    return () => clearTimeout(t);
  }, [resend]);

  const handleDigit = useCallback((text, index) => {
    // Accept only digits
    const clean = text.replace(/\D/g, '').slice(-1);
    setDigits(prev => {
      const next = [...prev];
      next[index] = clean;
      return next;
    });
    setErr('');
    // Auto-advance
    if (clean && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
    // Auto-verify when last box filled
    if (clean && index === OTP_LENGTH - 1) {
      setTimeout(() => verifyOTP(), 80);
    }
  }, []);

  const handleBackspace = useCallback((key, index) => {
    if (key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  }, [digits]);

  async function verifyOTP() {
    const code = digits.join('');
    if (code.length < OTP_LENGTH) { setErr('Please enter the 4-digit code'); return; }
    setLoading(true); setErr('');
    // Simulate network delay
    await new Promise(r => setTimeout(r, 1200));
    // Any 4-digit code works (simulated)
    setVerified(true);
    setLoading(false);
    setTimeout(() => navigation.replace(destination), 900);
  }

  function handleResend() {
    setDigits(Array(OTP_LENGTH).fill(''));
    setResend(30);
    setErr('');
    inputRefs.current[0]?.focus();
  }

  // Mask the label (email/phone) for display
  const masked = label.includes('@')
    ? label.replace(/(.{2})(.*)(@.*)/, (_, a, b, c) => a + '*'.repeat(Math.min(b.length, 6)) + c)
    : label;

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: COLORS.surface }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScreenWrapper>
        <View style={s.root}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.back}>
          <Ionicons name="chevron-back" size={18} color={COLORS.muted}/>
          <Text style={s.backTxt}>Back</Text>
        </TouchableOpacity>

        <View style={s.center}>
          {/* Icon */}
          <View style={[s.iconWrap, verified && s.iconWrapGreen]}>
            {verified
              ? <Ionicons name="checkmark" size={34} color={COLORS.primary}/>
              : <Ionicons name="shield-checkmark-outline" size={34} color={COLORS.primary}/>
            }
          </View>

          <Text style={s.title}>{verified ? 'Verified!' : 'Enter OTP'}</Text>
          <Text style={s.sub}>
            {verified
              ? 'Taking you in…'
              : `We've sent a 4-digit code to\n${masked || 'your registered contact'}`}
          </Text>

          {!verified && (
            <>
              {/* OTP boxes */}
              <View style={s.boxRow}>
                {digits.map((d, i) => (
                  <TextInput
                    key={i}
                    ref={r => { inputRefs.current[i] = r; }}
                    style={[s.box, d && s.boxFilled, err && s.boxErr]}
                    value={d}
                    onChangeText={t => handleDigit(t, i)}
                    onKeyPress={({ nativeEvent }) => handleBackspace(nativeEvent.key, i)}
                    keyboardType="number-pad"
                    maxLength={1}
                    selectTextOnFocus
                    caretHidden
                    textAlign="center"
                  />
                ))}
              </View>

              {!!err && <Text style={s.err}>{err}</Text>}

              <TouchableOpacity
                style={[s.btnPrimary, loading && { opacity:0.6 }]}
                onPress={verifyOTP}
                disabled={loading}
                activeOpacity={0.85}
              >
                {loading
                  ? <ActivityIndicator color="#fff"/>
                  : <Text style={s.btnTxt}>Verify OTP</Text>}
              </TouchableOpacity>

              {/* Resend */}
              <View style={s.resendRow}>
                <Text style={s.resendLbl}>Didn't receive the code? </Text>
                {resend > 0
                  ? <Text style={s.resendTimer}>Resend in {resend}s</Text>
                  : <TouchableOpacity onPress={handleResend}>
                      <Text style={s.resendBtn}>Resend OTP</Text>
                    </TouchableOpacity>
                }
              </View>

              <Text style={s.note}>
                For demo purposes, any 4-digit code will work.
              </Text>
            </>
          )}
        </View>
        </View>
      </ScreenWrapper>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  root:         { flex:1, backgroundColor:COLORS.surface, padding:24 },
  back:         { flexDirection:'row', alignItems:'center', gap:4, marginBottom:16 },
  backTxt:      { color:COLORS.muted, fontSize:FONT.base },
  center:       { flex:1, justifyContent:'center', alignItems:'center' },
  iconWrap:     { width:72, height:72, borderRadius:99, backgroundColor:COLORS.primaryBg, borderWidth:2, borderColor:COLORS.primaryBorder, alignItems:'center', justifyContent:'center', marginBottom:18 },
  iconWrapGreen:{ backgroundColor:'rgba(5,150,105,0.15)', borderColor:COLORS.primary },
  title:        { fontSize:FONT.xxl, fontWeight:'700', color:COLORS.text, marginBottom:8 },
  sub:          { fontSize:FONT.base, color:COLORS.muted, textAlign:'center', lineHeight:21, marginBottom:32 },
  boxRow:       { flexDirection:'row', gap:12, marginBottom:16 },
  box:          { width:56, height:64, borderWidth:1.5, borderColor:COLORS.border, borderRadius:RADIUS.md, fontSize:26, fontWeight:'700', color:COLORS.text, backgroundColor:COLORS.surface2, textAlign:'center' },
  boxFilled:    { borderColor:COLORS.primary, backgroundColor:COLORS.primaryBg },
  boxErr:       { borderColor:COLORS.danger },
  err:          { color:COLORS.danger, fontSize:FONT.sm, marginBottom:14 },
  btnPrimary:   { backgroundColor:COLORS.primary, borderRadius:RADIUS.md, paddingVertical:14, paddingHorizontal:40, alignItems:'center', marginTop:4, minWidth:200 },
  btnTxt:       { color:'#fff', fontSize:FONT.md, fontWeight:'600' },
  resendRow:    { flexDirection:'row', alignItems:'center', marginTop:20 },
  resendLbl:    { fontSize:FONT.base, color:COLORS.muted },
  resendTimer:  { fontSize:FONT.base, color:COLORS.muted, fontWeight:'500' },
  resendBtn:    { fontSize:FONT.base, color:COLORS.primary, fontWeight:'600' },
  note:         { marginTop:28, fontSize:FONT.sm, color:COLORS.muted, opacity:0.6, textAlign:'center' },
});
