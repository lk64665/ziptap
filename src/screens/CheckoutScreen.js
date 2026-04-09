// src/screens/CheckoutScreen.js  –  ZipTap  •  Z-Coins
import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, ActivityIndicator, Alert,
} from 'react-native';
import QRCode    from 'react-native-qrcode-svg';
import { Ionicons }  from '@expo/vector-icons';
import { useAuth }   from '../context/AuthContext';
import { useCart }   from '../context/CartContext';
import ScreenWrapper from '../components/ScreenWrapper';
import { CONVENIENCE_FEE } from '../data/products';
import { COLORS, RADIUS, FONT } from '../components/theme';

const PAY_OPTIONS = [
  { id:'upi',  label:'UPI / GPay',          sub:'Instant, no fees',        icon:'phone-portrait-outline' },
  { id:'card', label:'Credit / Debit Card',  sub:'Visa, Mastercard, RuPay', icon:'card-outline' },
  { id:'cash', label:'Cash at Counter',      sub:'Pay staff before exit',   icon:'cash-outline' },
];

export default function CheckoutScreen({ navigation }) {
  const { isGuest, displayName, updateZCoins } = useAuth();
  const { cartItems, subtotal, tax, total, itemCount, placeOrder, cancelLastOrder, clearCart } = useCart();
  const [method,     setMethod]     = useState('upi');
  const [processing, setProcessing] = useState(false);
  const [order,      setOrder]      = useState(null);

  if (isGuest) {
    return (
      <ScreenWrapper>
        <View style={s.guard}>
        <Ionicons name="lock-closed-outline" size={44} color={COLORS.muted} style={{ marginBottom:16 }}/>
        <Text style={s.guardTitle}>Sign In Required</Text>
        <Text style={s.guardSub}>You need a ZipTap account to complete payment</Text>
        <TouchableOpacity style={s.guardBtn} onPress={() => navigation.navigate('UserAuth')} activeOpacity={0.85}>
          <Text style={s.guardBtnTxt}>Sign In / Sign Up</Text>
        </TouchableOpacity>
        </View>
      </ScreenWrapper>
    );
  }

  async function handlePay() {
    if (itemCount === 0) { Alert.alert('Cart Empty', 'Add items before paying'); return; }
    setProcessing(true);
    await new Promise(r => setTimeout(r, 1400));
    const placed = placeOrder({ paymentMethod: method, userName: displayName });
    if (method !== 'cash') await updateZCoins(placed.zCoinsEarned);
    setOrder(placed);
    setProcessing(false);
  }

  function handleCancelCash() {
    cancelLastOrder();
    setOrder(null);
    setMethod('upi');
  }

  function handleShopAgain() {
    clearCart();
    setOrder(null);
    setMethod('upi');
    navigation.navigate('Home');
  }

  // ── Success / Pending ─────────────────────────────────────────────────────
  if (order) {
    const isPending = order.status === 'pending';
    const qrPayload = JSON.stringify({
      orderId:  order.id,
      total:    order.total,
      status:   order.status,
      userName: order.userName,
      app:      'ZipTap',
      items:    order.items.length,
    });

    return (
      <ScreenWrapper>
        <ScrollView style={s.root} contentContainerStyle={s.succContent}>
        <View style={[s.succIcon,{ borderColor: isPending ? COLORS.amber : COLORS.primary, backgroundColor: isPending ? COLORS.amberBg : COLORS.primaryBg }]}>
          <Ionicons name={isPending ? 'time-outline' : 'checkmark-outline'} size={34} color={isPending ? COLORS.amber : COLORS.primary}/>
        </View>
        <Text style={[s.succTitle,{ color: isPending ? COLORS.amber : COLORS.text }]}>
          {isPending ? 'Payment Pending' : 'Payment Successful!'}
        </Text>
        <Text style={s.succSub}>{isPending ? 'Pay at the counter before leaving' : 'Show QR code at the exit gate'}</Text>

        {!isPending && (
          <View style={s.coinsBadge}>
            <Ionicons name="star-outline" size={12} color={COLORS.primary}/>
            <Text style={s.coinsTxt}>+{order.zCoinsEarned} Z-Coins earned</Text>
          </View>
        )}
        {isPending && (
          <View style={s.pendBadge}><Text style={s.pendTxt}>Payment Pending — Pay at counter</Text></View>
        )}

        <View style={s.qrCard}>
          <View style={{ flexDirection:'row', justifyContent:'space-between', alignItems:'flex-start', marginBottom:14 }}>
            <View>
              <Text style={s.qrLbl}>Exit Pass Code</Text>
              <Text style={s.qrCode}>#{order.id}</Text>
              <Text style={s.qrAmt}>Total: ₹{order.total}</Text>
            </View>
            <View style={[s.statusBadge,{ backgroundColor: isPending ? COLORS.amberBg : COLORS.primaryBg }]}>
              <Text style={[s.statusTxt,{ color: isPending ? COLORS.amber : COLORS.primary }]}>
                {isPending ? 'Pending' : 'Paid'}
              </Text>
            </View>
          </View>
          <View style={s.qrBox}>
            <QRCode value={qrPayload} size={160} color="#1E1B4B" backgroundColor="#ffffff"/>
          </View>
          <Text style={s.qrHint}>Scan at ZipTap exit gate · Valid 10 minutes</Text>
        </View>

        {isPending && (
          <TouchableOpacity style={s.cancelBtn} onPress={handleCancelCash} activeOpacity={0.8}>
            {/* FIX: plain & in JSX text — never use &amp; in React Native */}
            <Text style={s.cancelTxt}>← Cancel & Change Payment Method</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity style={s.payBtn} onPress={handleShopAgain} activeOpacity={0.85}>
          <Text style={s.payBtnTxt}>Shop Again</Text>
        </TouchableOpacity>
        </ScrollView>
      </ScreenWrapper>
    );
  }

  // ── Checkout form ─────────────────────────────────────────────────────────
  return (
    <ScreenWrapper>
      <ScrollView style={s.root} contentContainerStyle={s.content}>
      <Text style={s.pageTitle}>Checkout</Text>
      <View style={s.card}>
        <Text style={s.cardTitle}>Order Summary</Text>
        {cartItems.map(({ product, qty }) => (
          <View key={product.id} style={s.summRow}>
            <View style={{ flex:1 }}>
              <Text style={s.summName}>{product.name}</Text>
              <Text style={s.summMeta}>₹{product.price} × {qty}{product.discount>0?`  ·  ${product.discount}% off`:''}</Text>
            </View>
            <View style={{ alignItems:'flex-end' }}>
              <Text style={s.summTotal}>₹{product.price * qty}</Text>
              {product.discount>0 && <Text style={s.summMrp}>₹{product.mrp * qty}</Text>}
            </View>
          </View>
        ))}
        <View style={s.divider}/>
        <View style={s.calcRow}><Text style={s.calcLbl}>Subtotal</Text><Text style={s.calcVal}>₹{subtotal}</Text></View>
        <View style={s.calcRow}><Text style={s.calcLbl}>GST (5%)</Text><Text style={s.calcVal}>₹{tax}</Text></View>
        <View style={s.convRow}>
          <Text style={s.convLbl}>ZipTap convenience charge</Text>
          <Text style={s.convVal}>₹{CONVENIENCE_FEE}</Text>
        </View>
        <View style={s.calcRow}><Text style={s.totalLbl}>Total</Text><Text style={s.totalVal}>₹{total}</Text></View>
      </View>

      <Text style={s.sectionLbl}>Payment Method</Text>
      {PAY_OPTIONS.map(p => (
        <TouchableOpacity key={p.id} style={[s.pmOpt, method===p.id && s.pmOptOn]} onPress={() => setMethod(p.id)} activeOpacity={0.8}>
          <View style={s.pmIcon}><Ionicons name={p.icon} size={16} color={method===p.id ? COLORS.primary : COLORS.muted}/></View>
          <View style={{ flex:1 }}>
            <Text style={s.pmLbl}>{p.label}</Text>
            <Text style={s.pmSub}>{p.sub}</Text>
          </View>
          <View style={[s.radio, method===p.id && s.radioOn]}>
            {method===p.id && <Ionicons name="checkmark" size={10} color="#fff"/>}
          </View>
        </TouchableOpacity>
      ))}

      {method==='cash' && (
        <View style={s.cashWarn}>
          <Ionicons name="information-circle-outline" size={15} color={COLORS.amber} style={{ marginTop:1 }}/>
          <Text style={s.cashWarnTxt}>You'll need to pay ₹{total} to counter staff before leaving.</Text>
        </View>
      )}

      <TouchableOpacity style={s.payBtn} onPress={handlePay} disabled={processing} activeOpacity={0.85}>
        {processing ? <ActivityIndicator color="#fff"/> : <Text style={s.payBtnTxt}>Pay ₹{total}</Text>}
      </TouchableOpacity>
      </ScrollView>
    </ScreenWrapper>
  );
}


const s = StyleSheet.create({
  content:     { padding:16, paddingBottom:40 },
  succContent: { padding:16, paddingBottom:40, alignItems:'center' },
  pageTitle:   { fontSize:FONT.xl, fontWeight:'600', color:COLORS.text, marginBottom:14 },
  card:        { backgroundColor:COLORS.surface, borderRadius:RADIUS.lg, padding:14, marginBottom:14, borderWidth:1, borderColor:COLORS.border },
  cardTitle:   { fontSize:FONT.xs, color:COLORS.muted, letterSpacing:.5, textTransform:'uppercase', fontWeight:'500', marginBottom:10 },
  summRow:     { flexDirection:'row', justifyContent:'space-between', marginBottom:8, paddingBottom:8, borderBottomWidth:1, borderBottomColor:'rgba(0,0,0,.04)' },
  summName:    { fontSize:FONT.base, color:COLORS.text, fontWeight:'500', marginBottom:2 },
  summMeta:    { fontSize:FONT.sm, color:COLORS.muted },
  summTotal:   { fontSize:FONT.base, fontWeight:'600', color:COLORS.text },
  summMrp:     { fontSize:FONT.xs, color:COLORS.muted, textDecorationLine:'line-through' },
  divider:     { height:1, backgroundColor:COLORS.border, marginVertical:10 },
  calcRow:     { flexDirection:'row', justifyContent:'space-between', marginBottom:6 },
  calcLbl:     { fontSize:FONT.base, color:COLORS.muted },
  calcVal:     { fontSize:FONT.base, color:COLORS.text },
  convRow:     { flexDirection:'row', justifyContent:'space-between', backgroundColor:COLORS.primaryBg, borderRadius:RADIUS.sm, padding:8, marginBottom:8 },
  convLbl:     { fontSize:FONT.base, color:COLORS.primary, fontWeight:'500' },
  convVal:     { fontSize:FONT.base, color:COLORS.primary, fontWeight:'500' },
  totalLbl:    { fontSize:FONT.lg, fontWeight:'700', color:COLORS.text },
  totalVal:    { fontSize:18, fontWeight:'700', color:COLORS.primary },
  sectionLbl:  { fontSize:FONT.xs, color:COLORS.muted, letterSpacing:.5, textTransform:'uppercase', fontWeight:'500', marginBottom:10 },
  pmOpt:       { flexDirection:'row', alignItems:'center', gap:12, padding:13, borderWidth:1.5, borderColor:COLORS.border, borderRadius:RADIUS.md, marginBottom:9, backgroundColor:COLORS.surface },
  pmOptOn:     { borderColor:COLORS.primary, backgroundColor:COLORS.primaryBg },
  pmIcon:      { width:36, height:36, borderRadius:RADIUS.sm, backgroundColor:COLORS.surface2, alignItems:'center', justifyContent:'center' },
  pmLbl:       { fontSize:FONT.md, color:COLORS.text },
  pmSub:       { fontSize:FONT.sm, color:COLORS.muted },
  radio:       { width:18, height:18, borderRadius:99, borderWidth:1.5, borderColor:COLORS.border, alignItems:'center', justifyContent:'center' },
  radioOn:     { backgroundColor:COLORS.primary, borderColor:COLORS.primary },
  cashWarn:    { flexDirection:'row', alignItems:'flex-start', gap:8, backgroundColor:COLORS.amberBg, borderWidth:1, borderColor:COLORS.amberBorder, borderRadius:RADIUS.md, padding:11, marginBottom:14 },
  cashWarnTxt: { flex:1, fontSize:FONT.sm, color:COLORS.amber, lineHeight:18 },
  payBtn:      { backgroundColor:COLORS.primary, borderRadius:RADIUS.md, paddingVertical:15, alignItems:'center', width:'100%' },
  payBtnTxt:   { color:'#fff', fontSize:FONT.md, fontWeight:'600' },
  succIcon:    { width:72, height:72, borderRadius:99, borderWidth:2, alignItems:'center', justifyContent:'center', marginTop:12, marginBottom:14 },
  succTitle:   { fontSize:FONT.xl, fontWeight:'700', marginBottom:4 },
  succSub:     { fontSize:FONT.base, color:COLORS.muted, marginBottom:10, textAlign:'center' },
  coinsBadge:  { flexDirection:'row', alignItems:'center', gap:6, backgroundColor:COLORS.primaryBg, borderRadius:99, paddingHorizontal:14, paddingVertical:5, marginBottom:14 },
  coinsTxt:    { fontSize:FONT.sm, fontWeight:'600', color:COLORS.primary },
  pendBadge:   { backgroundColor:COLORS.amberBg, borderRadius:99, paddingHorizontal:14, paddingVertical:5, marginBottom:14 },
  pendTxt:     { fontSize:FONT.sm, color:COLORS.amber, fontWeight:'600' },
  qrCard:      { backgroundColor:COLORS.surface, borderRadius:RADIUS.lg, padding:16, marginBottom:12, borderWidth:1, borderColor:COLORS.border, width:'100%' },
  qrLbl:       { fontSize:FONT.xs, color:COLORS.muted, letterSpacing:.5, textTransform:'uppercase', marginBottom:3 },
  qrCode:      { fontSize:26, fontWeight:'700', color:COLORS.text, letterSpacing:3 },
  qrAmt:       { fontSize:FONT.base, color:COLORS.muted, marginTop:2 },
  statusBadge: { borderRadius:99, paddingHorizontal:10, paddingVertical:3 },
  statusTxt:   { fontSize:FONT.xs, fontWeight:'500' },
  qrBox:       { backgroundColor:'#fff', borderRadius:RADIUS.md, padding:14, alignItems:'center', marginVertical:10, borderWidth:1, borderColor:COLORS.border },
  qrHint:      { textAlign:'center', fontSize:FONT.sm, color:COLORS.muted, marginTop:4 },
  cancelBtn:   { borderWidth:1, borderColor:COLORS.border, borderRadius:RADIUS.md, paddingVertical:12, paddingHorizontal:16, marginBottom:10, width:'100%', alignItems:'center' },
  cancelTxt:   { fontSize:FONT.base, color:COLORS.muted },
  guard:       { flex:1, alignItems:'center', justifyContent:'center', padding:32, backgroundColor:COLORS.bg },
  guardTitle:  { fontSize:FONT.xl, fontWeight:'700', color:COLORS.text, marginBottom:8 },
  guardSub:    { fontSize:FONT.base, color:COLORS.muted, textAlign:'center', marginBottom:24 },
  guardBtn:    { backgroundColor:COLORS.primary, borderRadius:RADIUS.md, paddingVertical:14, paddingHorizontal:32 },
  guardBtnTxt: { color:'#fff', fontSize:FONT.md, fontWeight:'600' },
});