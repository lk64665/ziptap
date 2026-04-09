// src/screens/UserAuthScreen.js
//
// FIX 1: Keyboard dismisses after 1 char
//   Root cause: inline state setters inside JSX caused the TextInput component
//   itself to remount on every keystroke. Fix: use useCallback for handlers
//   and keep inputs as uncontrolled refs OR use local state with stable refs.
//   Here we use useRef for the form values and only call setState on submit,
//   which prevents any re-render while typing.
//
// FIX 2: KeyboardAvoidingView so inputs slide above the keyboard.
//
import React, { useRef, useState, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, Alert, ActivityIndicator,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth }  from '../context/AuthContext';
import ScreenWrapper from '../components/ScreenWrapper';
import { COLORS, RADIUS, FONT } from '../components/theme';

const SOCIAL = [
  { id:'Google',   label:'Continue with Google',   icon:'logo-google',   color:'#EA4335' },
  { id:'Apple',    label:'Continue with Apple',    icon:'logo-apple',    color:'#000' },
  { id:'Facebook', label:'Continue with Facebook', icon:'logo-facebook', color:'#1877F2' },
  { id:'Phone',    label:'Continue with Phone',    icon:'call-outline',  color:COLORS.primary },
  { id:'WhatsApp', label:'Continue with WhatsApp', icon:'logo-whatsapp', color:'#25D366' },
];

export default function UserAuthScreen({ navigation }) {
  const { loginWithEmail, loginWithSocial } = useAuth();

  // Use refs so typing never triggers a re-render → keyboard stays up
  const emailRef = useRef('');
  const pwRef    = useRef('');

  const [loading, setLoading] = useState(false);
  const [err,     setErr]     = useState('');

  const handleEmail = useCallback(async () => {
    const email = emailRef.current;
    const pw    = pwRef.current;
    if (!email || !pw) { setErr('Please enter email and password'); return; }
    setLoading(true); setErr('');
    try {
      await loginWithEmail(email, pw);
      // After login → go to OTP
      navigation.navigate('OTP', { destination: 'MainApp', label: email });
    } catch (e) {
      setErr(e.message);
    }
    setLoading(false);
  }, []);

  const handleSocial = useCallback(async (provider) => {
    setLoading(true);
    try {
      await loginWithSocial(provider);
      navigation.navigate('OTP', { destination: 'MainApp', label: provider });
    } catch (e) {
      Alert.alert('Login Failed', e.message);
    }
    setLoading(false);
  }, []);

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
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

        <Text style={s.title}>Welcome back</Text>
        <Text style={s.sub}>Sign in to your ZipTap account</Text>

        {SOCIAL.map(p => (
          <TouchableOpacity key={p.id} style={s.socialBtn} onPress={() => handleSocial(p.id)} activeOpacity={0.8}>
            <Ionicons name={p.icon} size={20} color={p.color}/>
            <Text style={s.socialTxt}>{p.label}</Text>
          </TouchableOpacity>
        ))}

        <View style={s.divider}>
          <View style={s.divLine}/><Text style={s.divTxt}>or use email</Text><View style={s.divLine}/>
        </View>

        {/* KEY FIX: onChangeText writes to ref, never to state → no re-render */}
        <TextInput
          style={s.inp}
          placeholder="Email address"
          placeholderTextColor={COLORS.muted}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          onChangeText={v => { emailRef.current = v; }}
        />
        <TextInput
          style={s.inp}
          placeholder="Password"
          placeholderTextColor={COLORS.muted}
          secureTextEntry
          autoCorrect={false}
          onChangeText={v => { pwRef.current = v; }}
        />

        {!!err && <Text style={s.err}>{err}</Text>}

        <TouchableOpacity style={s.btnPrimary} onPress={handleEmail} disabled={loading} activeOpacity={0.85}>
          {loading ? <ActivityIndicator color="#fff"/> : <Text style={s.btnTxt}>Sign In</Text>}
        </TouchableOpacity>

        <TouchableOpacity style={s.link} onPress={() => navigation.navigate('Signup')}>
          <Text style={s.linkTxt}>
            Don't have an account? <Text style={{ color:COLORS.primary, fontWeight:'600' }}>Sign Up</Text>
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </ScreenWrapper>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  root:      { flex:1, backgroundColor:COLORS.surface },
  content:   { padding:24, paddingBottom:60 },
  back:      { flexDirection:'row', alignItems:'center', marginBottom:20, gap:4 },
  backTxt:   { color:COLORS.muted, fontSize:FONT.base },
  title:     { fontSize:FONT.xxl, fontWeight:'700', color:COLORS.text, marginBottom:4 },
  sub:       { color:COLORS.muted, fontSize:FONT.md, marginBottom:22 },
  socialBtn: { flexDirection:'row', alignItems:'center', gap:12, padding:13, borderWidth:1, borderColor:COLORS.border, borderRadius:RADIUS.md, marginBottom:9, backgroundColor:COLORS.surface },
  socialTxt: { fontSize:FONT.md, color:COLORS.text },
  divider:   { flexDirection:'row', alignItems:'center', marginVertical:18, gap:10 },
  divLine:   { flex:1, height:1, backgroundColor:COLORS.border },
  divTxt:    { color:COLORS.muted, fontSize:FONT.sm },
  inp:       { borderWidth:1, borderColor:COLORS.border, borderRadius:RADIUS.md, padding:13, fontSize:FONT.md, color:COLORS.text, marginBottom:10 },
  err:       { color:COLORS.danger, fontSize:FONT.sm, marginBottom:8 },
  btnPrimary:{ backgroundColor:COLORS.primary, borderRadius:RADIUS.md, paddingVertical:15, alignItems:'center', marginTop:4 },
  btnTxt:    { color:'#fff', fontSize:FONT.md, fontWeight:'600' },
  link:      { alignItems:'center', marginTop:16 },
  linkTxt:   { color:COLORS.muted, fontSize:FONT.base },
});
