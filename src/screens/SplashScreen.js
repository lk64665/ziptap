// src/screens/SplashScreen.js  –  ZipTap
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth }  from '../context/AuthContext';
import { COLORS, RADIUS, FONT } from '../components/theme';
import ScreenWrapper from '../components/ScreenWrapper';

export default function SplashScreen({ navigation }) {
  const { loginAsGuest } = useAuth();
  async function handleGuest() { await loginAsGuest(); navigation.replace('MainApp'); }

  return (
    <ScreenWrapper>
      <View style={s.root}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.surface}/>
      <View style={s.hero}>
        <View style={s.iconWrap}>
          <Ionicons name="flash-outline" size={44} color={COLORS.primary}/>
        </View>
        <Text style={s.logo}>ZipTap</Text>
        <Text style={s.tagline}>Scan. Pay. Walk out.{'\n'}No queues, ever.</Text>
      </View>
      <View style={s.actions}>
        <TouchableOpacity style={s.btnPrimary} onPress={() => navigation.navigate('UserAuth')} activeOpacity={0.85}>
          <Text style={s.btnPrimaryTxt}>Login / Sign Up</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.btnOutline} onPress={() => navigation.navigate('AdminAuth')} activeOpacity={0.85}>
          <Ionicons name="shield-outline" size={16} color={COLORS.text2}/>
          <Text style={s.btnOutlineTxt}>Login as Administrator</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.btnGhost} onPress={handleGuest} activeOpacity={0.7}>
          <Text style={s.btnGhostTxt}>Continue as Guest →</Text>
        </TouchableOpacity>
      </View>
      {/* FIX: plain & in JSX text — never use &amp; in React Native */}
      <Text style={s.legal}>By continuing you agree to ZipTap's{'\n'}Terms of Service & Privacy Policy</Text>
      </View>
    </ScreenWrapper>
  );
}

const s = StyleSheet.create({
  root:          { flex:1, backgroundColor:COLORS.surface, paddingHorizontal:28, paddingBottom:44, justifyContent:'space-between' },
  hero:          { flex:1, alignItems:'center', justifyContent:'center', gap:12 },
  iconWrap:      { width:84, height:84, borderRadius:26, backgroundColor:COLORS.primaryBg, borderWidth:2, borderColor:COLORS.primary, alignItems:'center', justifyContent:'center' },
  logo:          { fontSize:42, fontWeight:'800', color:COLORS.primary, letterSpacing:-1 },
  tagline:       { fontSize:FONT.md, color:COLORS.muted, textAlign:'center', lineHeight:22 },
  actions:       { gap:10 },
  btnPrimary:    { backgroundColor:COLORS.primary, borderRadius:RADIUS.md, paddingVertical:15, alignItems:'center' },
  btnPrimaryTxt: { color:'#fff', fontSize:FONT.md, fontWeight:'600' },
  btnOutline:    { flexDirection:'row', alignItems:'center', justifyContent:'center', gap:8, borderWidth:1, borderColor:COLORS.border, borderRadius:RADIUS.md, paddingVertical:14 },
  btnOutlineTxt: { color:COLORS.text2, fontSize:FONT.md, fontWeight:'500' },
  btnGhost:      { alignItems:'center', paddingVertical:10 },
  btnGhostTxt:   { color:COLORS.muted, fontSize:FONT.base },
  legal:         { textAlign:'center', color:COLORS.muted, fontSize:FONT.sm, lineHeight:18, opacity:0.7, marginTop:16 },
});