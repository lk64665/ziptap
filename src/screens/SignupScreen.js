// src/screens/SignupScreen.js
// FIX: All text inputs use refs (not state) so typing never triggers re-renders.
// KeyboardAvoidingView keeps fields above the keyboard.
// NEW: Referral code field with success banner.
import React, { useRef, useState, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth }  from '../context/AuthContext';
import ScreenWrapper from '../components/ScreenWrapper';
import { COLORS, RADIUS, FONT } from '../components/theme';

// Valid referral codes (extend this list or fetch from backend)
const VALID_REFERRAL_CODES = ['VELO50', 'FRIEND10', 'WELCOME', 'CART2024'];

export default function SignupScreen({ navigation }) {
  const { signup } = useAuth();

  // All form values in refs → no re-render while typing
  const refs = {
    firstName:       useRef(''),
    lastName:        useRef(''),
    username:        useRef(''),
    email:           useRef(''),
    phone:           useRef(''),
    dob:             useRef(''),
    password:        useRef(''),
    confirmPassword: useRef(''),
    referralCode:    useRef(''),
  };

  const [agreed,         setAgreed]         = useState(false);
  const [showPw,         setShowPw]         = useState(false);
  const [loading,        setLoading]        = useState(false);
  const [err,            setErr]            = useState('');
  const [referralStatus, setReferralStatus] = useState('idle'); // idle | valid | invalid

  const checkReferral = useCallback(() => {
    const code = refs.referralCode.current.trim().toUpperCase();
    if (!code) { setReferralStatus('idle'); return; }
    setReferralStatus(VALID_REFERRAL_CODES.includes(code) ? 'valid' : 'invalid');
  }, []);

  const handleSignup = useCallback(async () => {
    const v = Object.fromEntries(
      Object.entries(refs).map(([k, r]) => [k, r.current.trim()])
    );
    if (!v.firstName || !v.lastName || !v.username || !v.email || !v.phone || !v.dob || !v.password) {
      setErr('Please fill all required fields'); return;
    }
    if (v.password !== v.confirmPassword) { setErr('Passwords do not match'); return; }
    if (v.password.length < 8)            { setErr('Password must be at least 8 characters'); return; }
    if (!agreed)                           { setErr('Please accept the Terms of Service'); return; }
    setErr(''); setLoading(true);
    try {
      await signup({ ...v, referralCode: referralStatus === 'valid' ? v.referralCode.toUpperCase() : null });
      navigation.navigate('OTP', { destination:'MainApp', label: v.email });
    } catch (e) {
      setErr(e.message);
    }
    setLoading(false);
  }, [agreed, referralStatus]);

  // Stable field component — rendered outside the main component to avoid recreating
  const Field = ({ label, rKey, placeholder, ...rest }) => (
    <View style={s.fWrap}>
      <Text style={s.label}>{label}</Text>
      <TextInput
        style={s.inp}
        placeholder={placeholder}
        placeholderTextColor={COLORS.muted}
        autoCorrect={false}
        onChangeText={v => { refs[rKey].current = v; }}
        {...rest}
      />
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={{ flex:1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 24}
    >
    <ScreenWrapper>
      <ScrollView
        style={s.root}
        contentContainerStyle={s.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.back}>
          <Ionicons name="chevron-back" size={18} color={COLORS.muted}/>
          <Text style={s.backTxt}>Back</Text>
        </TouchableOpacity>

        <Text style={s.title}>Create Account</Text>
        <Text style={s.sub}>Join ZipTap and shop without queues</Text>

        {/* Name row */}
        <View style={{ flexDirection:'row', gap:10 }}>
          <View style={{ flex:1 }}>
            <Text style={s.label}>First Name <Text style={s.req}>*</Text></Text>
            <TextInput style={s.inp} placeholder="First" placeholderTextColor={COLORS.muted} autoCorrect={false} onChangeText={v => { refs.firstName.current = v; }}/>
          </View>
          <View style={{ flex:1 }}>
            <Text style={s.label}>Last Name <Text style={s.req}>*</Text></Text>
            <TextInput style={s.inp} placeholder="Last" placeholderTextColor={COLORS.muted} autoCorrect={false} onChangeText={v => { refs.lastName.current = v; }}/>
          </View>
        </View>

        <Field label="Username *"      rKey="username"  placeholder="e.g. arjun_singh" autoCapitalize="none"/>
        <Field label="Email Address *" rKey="email"     placeholder="you@email.com" keyboardType="email-address" autoCapitalize="none"/>
        <Field label="Phone Number *"  rKey="phone"     placeholder="+91 98765 43210" keyboardType="phone-pad"/>
        <Field label="Date of Birth *" rKey="dob"       placeholder="DD/MM/YYYY"/>

        {/* Password */}
        <View style={s.fWrap}>
          <Text style={s.label}>Password <Text style={s.req}>*</Text></Text>
          <View style={s.pwRow}>
            <TextInput
              style={[s.inp, { flex:1, marginBottom:0, borderWidth:0, paddingVertical:12 }]}
              placeholder="Min. 8 characters"
              placeholderTextColor={COLORS.muted}
              secureTextEntry={!showPw}
              autoCorrect={false}
              onChangeText={v => { refs.password.current = v; }}
            />
            <TouchableOpacity onPress={() => setShowPw(p => !p)} style={{ padding:12 }}>
              <Ionicons name={showPw ? 'eye-off-outline' : 'eye-outline'} size={18} color={COLORS.muted}/>
            </TouchableOpacity>
          </View>
        </View>

        <View style={s.fWrap}>
          <Text style={s.label}>Confirm Password <Text style={s.req}>*</Text></Text>
          <TextInput
            style={s.inp}
            placeholder="Re-enter password"
            placeholderTextColor={COLORS.muted}
            secureTextEntry
            autoCorrect={false}
            onChangeText={v => { refs.confirmPassword.current = v; }}
          />
        </View>

        {/* Referral code */}
        <View style={s.fWrap}>
          <Text style={s.label}>Referral Code <Text style={s.optional}>(optional)</Text></Text>
          <View style={s.referralRow}>
            <TextInput
              style={[s.inp, { flex:1, marginBottom:0, borderRightWidth:0, borderTopRightRadius:0, borderBottomRightRadius:0 }]}
              placeholder="e.g. VELO50"
              placeholderTextColor={COLORS.muted}
              autoCapitalize="characters"
              autoCorrect={false}
              onChangeText={v => {
                refs.referralCode.current = v;
                if (referralStatus !== 'idle') setReferralStatus('idle');
              }}
            />
            <TouchableOpacity
              style={s.applyBtn}
              onPress={checkReferral}
              activeOpacity={0.8}
            >
              <Text style={s.applyTxt}>Apply</Text>
            </TouchableOpacity>
          </View>

          {referralStatus === 'valid' && (
            <View style={s.refSuccess}>
              <Ionicons name="checkmark-circle" size={14} color={COLORS.primary}/>
              <Text style={s.refSuccessTxt}>Referral applied! You'll get 50 bonus Z-Coins on signup.</Text>
            </View>
          )}
          {referralStatus === 'invalid' && (
            <View style={s.refError}>
              <Ionicons name="close-circle" size={14} color={COLORS.danger}/>
              <Text style={s.refErrorTxt}>Invalid referral code. Try another.</Text>
            </View>
          )}
        </View>

        {!!err && <Text style={s.err}>{err}</Text>}

        {/* Terms */}
        <TouchableOpacity style={s.termsRow} onPress={() => setAgreed(p => !p)} activeOpacity={0.8}>
          <View style={[s.cb, agreed && s.cbOn]}>
            {agreed && <Ionicons name="checkmark" size={12} color="#fff"/>}
          </View>
          <Text style={s.termsTxt}>I agree to ZipTap's Terms of Service and Privacy Policy</Text>
        </TouchableOpacity>

        <TouchableOpacity style={s.btnPrimary} onPress={handleSignup} disabled={loading} activeOpacity={0.85}>
          {loading ? <ActivityIndicator color="#fff"/> : <Text style={s.btnTxt}>Create Account</Text>}
        </TouchableOpacity>
      </ScrollView>
    </ScreenWrapper>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  root:         { flex:1, backgroundColor:COLORS.surface },
  content:      { padding:24, paddingBottom:60 },
  back:         { flexDirection:'row', alignItems:'center', gap:4, marginBottom:16 },
  backTxt:      { color:COLORS.muted, fontSize:FONT.base },
  title:        { fontSize:FONT.xxl, fontWeight:'700', color:COLORS.text, marginBottom:4 },
  sub:          { color:COLORS.muted, fontSize:FONT.base, marginBottom:18 },
  fWrap:        { marginBottom:10 },
  label:        { fontSize:FONT.sm, color:COLORS.muted, marginBottom:5, fontWeight:'500' },
  req:          { color:COLORS.danger },
  optional:     { color:COLORS.muted, fontWeight:'400' },
  inp:          { borderWidth:1, borderColor:COLORS.border, borderRadius:RADIUS.md, padding:12, fontSize:FONT.md, color:COLORS.text, backgroundColor:COLORS.surface },
  pwRow:        { flexDirection:'row', alignItems:'center', borderWidth:1, borderColor:COLORS.border, borderRadius:RADIUS.md, backgroundColor:COLORS.surface },
  referralRow:  { flexDirection:'row', alignItems:'stretch' },
  applyBtn:     { backgroundColor:COLORS.primary, borderTopRightRadius:RADIUS.md, borderBottomRightRadius:RADIUS.md, paddingHorizontal:16, justifyContent:'center' },
  applyTxt:     { color:'#fff', fontSize:FONT.sm, fontWeight:'600' },
  refSuccess:   { flexDirection:'row', alignItems:'center', gap:6, marginTop:6, backgroundColor:COLORS.primaryBg, borderRadius:RADIUS.sm, padding:8 },
  refSuccessTxt:{ fontSize:FONT.sm, color:COLORS.primary, flex:1 },
  refError:     { flexDirection:'row', alignItems:'center', gap:6, marginTop:6, backgroundColor:COLORS.dangerBg, borderRadius:RADIUS.sm, padding:8 },
  refErrorTxt:  { fontSize:FONT.sm, color:COLORS.danger, flex:1 },
  err:          { color:COLORS.danger, fontSize:FONT.sm, marginBottom:10 },
  termsRow:     { flexDirection:'row', alignItems:'flex-start', gap:10, marginBottom:16 },
  cb:           { width:20, height:20, borderRadius:5, borderWidth:1.5, borderColor:COLORS.border, alignItems:'center', justifyContent:'center', marginTop:1, flexShrink:0 },
  cbOn:         { backgroundColor:COLORS.primary, borderColor:COLORS.primary },
  termsTxt:     { flex:1, fontSize:FONT.sm, color:COLORS.muted, lineHeight:18 },
  btnPrimary:   { backgroundColor:COLORS.primary, borderRadius:RADIUS.md, paddingVertical:15, alignItems:'center' },
  btnTxt:       { color:'#fff', fontSize:FONT.md, fontWeight:'600' },
});
