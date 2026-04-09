// src/screens/HomeScreen.js  –  ZipTap
import React, { useState, useEffect, useRef } from 'react';
import { View, Text, ScrollView, TouchableOpacity, FlatList, StyleSheet, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { PRODUCTS, PROMO_SLIDES, CATEGORY_COLORS } from '../data/products';
import { COLORS, RADIUS, FONT } from '../components/theme';
import ScreenWrapper from '../components/ScreenWrapper';

const { width } = Dimensions.get('window');
const SLIDE_W = width - 32;

function getIST() {
  return new Date().toLocaleTimeString('en-IN', {
    timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', hour12: true,
  }) + ' IST';
}

export default function HomeScreen({ navigation }) {
  const { displayName, isGuest, user, logout } = useAuth();
  const { itemCount, addToCart } = useCart();
  const [istTime, setIstTime] = useState(getIST());
  const [slideIdx, setSlideIdx] = useState(0);
  const flatRef = useRef(null);
  const zCoins = user?.zCoins || 0;

  useEffect(() => {
    const t = setInterval(() => setIstTime(getIST()), 30000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const t = setInterval(() => {
      const next = (slideIdx + 1) % PROMO_SLIDES.length;
      setSlideIdx(next);
      flatRef.current?.scrollToIndex({ index: next, animated: true });
    }, 4200);
    return () => clearInterval(t);
  }, [slideIdx]);

  const slides = PROMO_SLIDES.map(sl => ({ ...sl, product: PRODUCTS.find(p => p.id === sl.productId) }));

  return (
    <ScreenWrapper>
      <ScrollView style={s.root} contentContainerStyle={s.content}>
        {/* Top row */}
        <View style={s.topRow}>
          <View>
            <Text style={s.greeting}>Good morning,</Text>
            <Text style={s.name}>{displayName || 'User'}</Text>
            <Text style={s.time}>{istTime}</Text>
          </View>
          <TouchableOpacity style={s.logoutBtn} onPress={() => { logout(); navigation.replace('Splash'); }}>
            <Ionicons name="log-out-outline" size={18} color={COLORS.muted} />
          </TouchableOpacity>
        </View>

        {isGuest && (
          <TouchableOpacity style={s.guestBanner} onPress={() => navigation.navigate('UserAuth')} activeOpacity={0.8}>
            <Ionicons name="information-circle-outline" size={15} color={COLORS.amber} />
            <Text style={s.guestTxt}>Browsing as Guest — <Text style={{ fontWeight: '600', textDecorationLine: 'underline' }}>Sign in to pay</Text></Text>
          </TouchableOpacity>
        )}

        {/* Z-Wallet card */}
        <TouchableOpacity style={s.walletCard} onPress={() => navigation.navigate('Wallet')} activeOpacity={0.9}>
          <View>
            <Text style={s.wLabel}>Z-WALLET</Text>
            <Text style={s.wCoins}>{zCoins} <Text style={s.wCoinsSub}>Z-Coins</Text></Text>
            <Text style={s.wVal}>≈ ₹{(zCoins / 100).toFixed(2)} redeemable</Text>
          </View>
          <View style={s.wIcon}><Ionicons name="star-outline" size={22} color="#fff" /></View>
        </TouchableOpacity>

        {/* Stats */}
        <View style={s.statsRow}>
          <View style={s.statCard}>
            <Text style={[s.statVal, { color: COLORS.primary }]}>{itemCount}</Text>
            <Text style={s.statLbl}>In Cart</Text>
          </View>
          <View style={s.statCard}>
            <Text style={s.statVal}>{Math.ceil(itemCount * 1.5)} min</Text>
            <Text style={s.statLbl}>Time Saved</Text>
          </View>
        </View>

        <TouchableOpacity style={s.scanBtn} onPress={() => navigation.navigate('Scan')} activeOpacity={0.85}>
          <Ionicons name="scan-outline" size={18} color="#fff" style={{ marginRight: 8 }} />
          <Text style={s.scanBtnTxt}>Start Scanning</Text>
        </TouchableOpacity>

        {/* Promo slides */}
        <View style={s.slidesHdr}>
          {/* FIX: plain & in JSX text — never use &amp; in React Native */}
          <Text style={s.sectionLbl}>Today's Deals & Restocks</Text>
          <View style={s.dots}>
            {slides.map((_, i) => <View key={i} style={[s.dot, i === slideIdx && s.dotOn]} />)}
          </View>
        </View>

        <FlatList
          ref={flatRef}
          data={slides}
          horizontal pagingEnabled
          showsHorizontalScrollIndicator={false}
          snapToInterval={SLIDE_W + 12}
          decelerationRate="fast"
          keyExtractor={(_, i) => String(i)}
          onMomentumScrollEnd={e => setSlideIdx(Math.round(e.nativeEvent.contentOffset.x / (SLIDE_W + 12)))}
          renderItem={({ item: sl }) => {
            const it = sl.product;
            if (!it) return null;
            return (
              <View style={[s.slide, { backgroundColor: sl.bg, width: SLIDE_W, marginRight: 12 }]}>
                <View style={s.slideBadge}>
                  <Text style={s.slideBadgeTxt}>{sl.type === 'restock' ? 'RESTOCKED' : 'HOT DEAL'}</Text>
                </View>
                <Text style={s.slideName}>{it.name}</Text>
                <Text style={s.slideSub}>{sl.type === 'restock' ? 'Back in stock — limited qty' : `Save ₹${it.mrp - it.price} today`}</Text>
                <View style={s.slidePriceRow}>
                  <Text style={[s.slidePrice, { color: sl.accent }]}>₹{it.price}</Text>
                  {sl.type === 'deal' && <>
                    <Text style={s.slideMrp}>₹{it.mrp}</Text>
                    <View style={[s.slideOffBadge, { backgroundColor: sl.accent }]}>
                      <Text style={s.slideOffTxt}>{it.discount}% OFF</Text>
                    </View>
                  </>}
                </View>
                <TouchableOpacity style={[s.slideBtn, { backgroundColor: sl.accent }]} onPress={() => addToCart(it)} activeOpacity={0.85}>
                  <Text style={s.slideBtnTxt}>Add to Cart</Text>
                </TouchableOpacity>
              </View>
            );
          }}
        />
      </ScrollView>
    </ScreenWrapper>
  );
}

const s = StyleSheet.create({
  root:          { flex: 1, backgroundColor: COLORS.bg },
  content:       { padding: 16, paddingBottom: 32 },
  topRow:        { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  greeting:      { fontSize: FONT.sm, color: COLORS.muted },
  name:          { fontSize: 22, fontWeight: '700', color: COLORS.text, marginBottom: 2 },
  time:          { fontSize: FONT.sm, color: COLORS.muted },
  logoutBtn:     { width: 36, height: 36, backgroundColor: COLORS.surface2, borderRadius: 99, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: COLORS.border },
  guestBanner:   { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: COLORS.amberBg, borderRadius: RADIUS.md, borderWidth: 1, borderColor: COLORS.amberBorder, padding: 11, marginBottom: 12 },
  guestTxt:      { fontSize: FONT.sm, color: COLORS.amber, flex: 1 },
  walletCard:    { backgroundColor: COLORS.primary, borderRadius: RADIUS.lg, padding: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  wLabel:        { fontSize: FONT.xs, color: 'rgba(255,255,255,.8)', letterSpacing: .4, marginBottom: 4 },
  wCoins:        { fontSize: 26, fontWeight: '700', color: '#fff' },
  wCoinsSub:     { fontSize: FONT.md, fontWeight: '400', opacity: .85 },
  wVal:          { fontSize: FONT.sm, color: 'rgba(255,255,255,.8)', marginTop: 4 },
  wIcon:         { backgroundColor: 'rgba(255,255,255,.2)', borderRadius: RADIUS.md, padding: 10 },
  statsRow:      { flexDirection: 'row', gap: 10, marginBottom: 12 },
  statCard:      { flex: 1, backgroundColor: COLORS.surface, borderRadius: RADIUS.md, padding: 12, alignItems: 'center', borderWidth: 1, borderColor: COLORS.border },
  statVal:       { fontSize: 26, fontWeight: '700', color: COLORS.text, marginBottom: 2 },
  statLbl:       { fontSize: FONT.sm, color: COLORS.muted },
  scanBtn:       { backgroundColor: COLORS.primary, borderRadius: RADIUS.md, paddingVertical: 14, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginBottom: 18 },
  scanBtnTxt:    { color: '#fff', fontSize: FONT.md, fontWeight: '600' },
  slidesHdr:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  sectionLbl:    { fontSize: FONT.xs, color: COLORS.muted, fontWeight: '500', letterSpacing: .5, textTransform: 'uppercase' },
  dots:          { flexDirection: 'row', gap: 4 },
  dot:           { width: 6, height: 6, borderRadius: 99, backgroundColor: COLORS.border },
  dotOn:         { backgroundColor: COLORS.primary, width: 16 },
  slide:         { borderRadius: RADIUS.lg, padding: 18, overflow: 'hidden' },
  slideBadge:    { backgroundColor: 'rgba(255,255,255,.18)', borderRadius: 99, paddingHorizontal: 10, paddingVertical: 3, alignSelf: 'flex-start', marginBottom: 10 },
  slideBadgeTxt: { fontSize: FONT.xs, color: '#fff', fontWeight: '600', letterSpacing: .3 },
  slideName:     { fontSize: FONT.lg, fontWeight: '700', color: '#fff', marginBottom: 4 },
  slideSub:      { fontSize: FONT.sm, color: 'rgba(255,255,255,.65)', marginBottom: 10 },
  slidePriceRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 },
  slidePrice:    { fontSize: 24, fontWeight: '800' },
  slideMrp:      { fontSize: FONT.base, color: 'rgba(255,255,255,.4)', textDecorationLine: 'line-through' },
  slideOffBadge: { borderRadius: 99, paddingHorizontal: 8, paddingVertical: 2 },
  slideOffTxt:   { fontSize: FONT.xs, fontWeight: '700', color: '#000' },
  slideBtn:      { borderRadius: RADIUS.sm, paddingHorizontal: 18, paddingVertical: 9, alignSelf: 'flex-start' },
  slideBtnTxt:   { fontSize: FONT.base, fontWeight: '700', color: '#000' },
});