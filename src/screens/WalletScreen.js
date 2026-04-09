// src/screens/WalletScreen.js  –  Z-Wallet & Z-Coins (ZipTap)
import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth }   from '../context/AuthContext';
import { useCart }   from '../context/CartContext';
import { COLORS, RADIUS, FONT } from '../components/theme';
import ScreenWrapper from '../components/ScreenWrapper';

export default function WalletScreen() {
  const { user }        = useAuth();
  const { coinHistory } = useCart();
  const zCoins = user?.zCoins || 0;
  const inrVal = (zCoins / 100).toFixed(2);

  return (
    <ScreenWrapper>
      <ScrollView style={s.root} contentContainerStyle={s.content}>

        {/* Z-Wallet Balance card */}
        <View style={s.balCard}>
          <Text style={s.balAppName}>ZipTap</Text>
          <Text style={s.balLabel}>Z-WALLET BALANCE</Text>
          <Text style={s.balCoins}>
            {zCoins}{' '}
            <Text style={s.balCoinsSub}>Z-Coins</Text>
          </Text>
          <Text style={s.balInr}>≈ ₹{inrVal} redeemable value</Text>
        </View>

        {/* How Z-Coins work */}
        <View style={s.card}>
          <Text style={s.cardTitle}>How Z-Coins Work</Text>
          <View style={s.howRow}>
            <View style={s.howBox}>
              {/* FIX: indentation restored; was accidentally un-indented */}
              <Text style={[s.howVal, { color: COLORS.primary }]}>10</Text>
              <Text style={s.howLbl}>Z-Coins per{'\n'}₹100 spent</Text>
            </View>
            <View style={s.howDivider}/>
            <View style={s.howBox}>
              <Text style={s.howVal}>100</Text>
              <Text style={s.howLbl}>Z-Coins ={'\n'}₹1 redeemable</Text>
            </View>
          </View>
          <Text style={s.howNote}>
            Z-Coins are credited automatically after every successful digital payment on ZipTap. Cash payments do not earn Z-Coins. Redeem at checkout on your next order.
          </Text>
        </View>

        {/* Progress to next reward */}
        <View style={s.card}>
          <Text style={s.cardTitle}>Next Z-Coin Reward</Text>
          <View style={s.progressRow}>
            <Text style={s.progressLbl}>{zCoins % 100} / 100 Z-Coins</Text>
            <Text style={s.progressPct}>{zCoins % 100}%</Text>
          </View>
          <View style={s.progressTrack}>
            <View style={[s.progressFill, { width: `${Math.min(zCoins % 100, 100)}%` }]} />
          </View>
          <Text style={s.progressNote}>
            {zCoins % 100 === 0 && zCoins > 0
              ? `You have ₹${Math.floor(zCoins / 100)} in Z-Coins ready to redeem!`
              : `${100 - (zCoins % 100)} more Z-Coins until your next ₹1 reward`}
          </Text>
        </View>

        {/* Z-Coin earning history */}
        <Text style={s.sectionLbl}>Z-Coin Earning History</Text>
        {coinHistory.length === 0 ? (
          <View style={s.emptyWrap}>
            <Ionicons name="star-outline" size={32} color={COLORS.muted}/>
            <Text style={s.emptyTxt}>No Z-Coins earned yet</Text>
            <Text style={s.emptySub}>Complete a digital payment on ZipTap to earn Z-Coins</Text>
          </View>
        ) : (
          coinHistory.map((entry, i) => (
            <View key={i} style={s.histRow}>
              <View style={s.histIcon}>
                <Ionicons name="star-outline" size={14} color={COLORS.primary}/>
              </View>
              <View style={s.histInfo}>
                <Text style={s.histTitle}>Order #{entry.orderId}</Text>
                <Text style={s.histMeta}>
                  ₹{entry.amount} spent · {entry.date.toLocaleDateString('en-IN')}
                </Text>
              </View>
              <Text style={s.histCoins}>+{entry.coins} Z</Text>
            </View>
          ))
        )}

      </ScrollView>
    </ScreenWrapper>
  );
}

const s = StyleSheet.create({
  root:          { flex: 1, backgroundColor: COLORS.bg },
  content:       { padding: 16, paddingBottom: 40 },
  balCard:       { backgroundColor: COLORS.primary, borderRadius: RADIUS.lg, padding: 18, marginBottom: 14 },
  balAppName:    { fontSize: FONT.sm, color: 'rgba(255,255,255,.6)', fontWeight: '700', letterSpacing: 1, marginBottom: 6 },
  balLabel:      { fontSize: FONT.xs, color: 'rgba(255,255,255,.75)', letterSpacing: .5, marginBottom: 4 },
  balCoins:      { fontSize: 34, fontWeight: '700', color: '#fff', marginBottom: 4 },
  balCoinsSub:   { fontSize: FONT.lg, fontWeight: '400', opacity: .85 },
  balInr:        { fontSize: FONT.base, color: 'rgba(255,255,255,.8)' },
  card:          { backgroundColor: COLORS.surface, borderRadius: RADIUS.lg, padding: 14, marginBottom: 14, borderWidth: 1, borderColor: COLORS.border },
  cardTitle:     { fontSize: FONT.xs, color: COLORS.muted, letterSpacing: .5, textTransform: 'uppercase', fontWeight: '500', marginBottom: 12 },
  howRow:        { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  howBox:        { flex: 1, alignItems: 'center' },
  howVal:        { fontSize: 22, fontWeight: '700', color: COLORS.text, marginBottom: 4 },
  howLbl:        { fontSize: FONT.sm, color: COLORS.muted, textAlign: 'center', lineHeight: 17 },
  howDivider:    { width: 1, height: 48, backgroundColor: COLORS.border, marginHorizontal: 16 },
  howNote:       { fontSize: FONT.sm, color: COLORS.muted, lineHeight: 19 },
  progressRow:   { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  progressLbl:   { fontSize: FONT.sm, color: COLORS.muted },
  progressPct:   { fontSize: FONT.sm, color: COLORS.primary, fontWeight: '600' },
  progressTrack: { height: 8, backgroundColor: COLORS.surface2, borderRadius: 99, overflow: 'hidden', marginBottom: 8 },
  progressFill:  { height: '100%', backgroundColor: COLORS.primary, borderRadius: 99 },
  progressNote:  { fontSize: FONT.sm, color: COLORS.muted },
  sectionLbl:    { fontSize: FONT.xs, color: COLORS.muted, letterSpacing: .5, textTransform: 'uppercase', fontWeight: '500', marginBottom: 10 },
  emptyWrap:     { alignItems: 'center', paddingVertical: 28, gap: 8 },
  emptyTxt:      { fontSize: FONT.md, color: COLORS.muted },
  emptySub:      { fontSize: FONT.sm, color: COLORS.muted, opacity: .7, textAlign: 'center' },
  histRow:       { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.surface, borderRadius: RADIUS.md, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: COLORS.border, gap: 10 },
  histIcon:      { width: 36, height: 36, backgroundColor: COLORS.primaryBg, borderRadius: 9, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  histInfo:      { flex: 1 },
  histTitle:     { fontSize: FONT.base, fontWeight: '500', color: COLORS.text, marginBottom: 2 },
  histMeta:      { fontSize: FONT.sm, color: COLORS.muted },
  histCoins:     { fontSize: FONT.md, fontWeight: '700', color: COLORS.primary },
});