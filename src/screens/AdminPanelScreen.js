// src/screens/AdminPanelScreen.js
// NEW FEATURES:
//   1. "Verify Order" button opens CameraView to scan user's QR code.
//   2. Scanned QR decoded → order details shown in a modal sheet.
//   3. "History" tab shows all transactions with date, time, amount.
import React, { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, Modal, Alert,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import ScreenWrapper from '../components/ScreenWrapper';
import { CATEGORY_COLORS } from '../data/products';
import { COLORS, RADIUS, FONT } from '../components/theme';

const TABS = ['Dashboard', 'History'];

export default function AdminPanelScreen({ navigation }) {
  const { logout }                            = useAuth();
  const { orders, transactions, findOrder }   = useCart();
  const [permission, requestPermission]       = useCameraPermissions();
  const [activeTab,   setActiveTab]           = useState('Dashboard');
  const [scanning,    setScanning]            = useState(false);
  const [canScan,     setCanScan]             = useState(true);
  const [verifiedOrder, setVerifiedOrder]     = useState(null);
  const [modalVisible,  setModalVisible]      = useState(false);

  const revenue      = transactions.reduce((s, o) => s + o.total, 0);
  const pendingCount = transactions.filter(o => o.status === 'pending').length;
  const paidCount    = transactions.filter(o => o.status === 'paid').length;

  function signOut() { logout(); navigation.replace('Splash'); }

  // ── QR verification ───────────────────────────────────────────────────────────
  async function openScanner() {
    if (!permission?.granted) {
      const res = await requestPermission();
      if (!res.granted) {
        Alert.alert('Camera Permission', 'Enable camera access in Settings to scan QR codes.'); return;
      }
    }
    setCanScan(true);
    setScanning(true);
  }

  const handleQR = useCallback(({ data }) => {
    if (!canScan) return;
    setCanScan(false);
    setScanning(false);
    try {
      const payload = JSON.parse(data);
      const order   = findOrder(payload.orderId);
      if (order) {
        setVerifiedOrder(order);
        setModalVisible(true);
      } else {
        Alert.alert('Order Not Found', `No order with ID #${payload.orderId} found in this session.`, [
          { text:'Scan Again', onPress:() => { setCanScan(true); setScanning(true); } },
          { text:'Close' },
        ]);
      }
    } catch {
      Alert.alert('Invalid QR', 'This QR code does not belong to ZipTap.', [
        { text:'Scan Again', onPress:() => { setCanScan(true); setScanning(true); } },
        { text:'Close' },
      ]);
    }
  }, [canScan, findOrder]);

  // ── Stat card ─────────────────────────────────────────────────────────────────
  const Stat = ({ label, value, color, icon }) => (
    <View style={s.stat}>
      <View style={[s.statIcon,{backgroundColor: color+'18'}]}>
        <Ionicons name={icon} size={18} color={color}/>
      </View>
      <Text style={[s.statVal,{color}]}>{value}</Text>
      <Text style={s.statLbl}>{label}</Text>
    </View>
  );

  // ── Order verification modal ──────────────────────────────────────────────────
  function OrderModal() {
    if (!verifiedOrder) return null;
    const isPending = verifiedOrder.status === 'pending';
    return (
      <Modal visible={modalVisible} transparent animationType="slide" onRequestClose={() => setModalVisible(false)}>
        <View style={s.modalOverlay}>
          <View style={s.modalSheet}>
            <View style={s.modalHandle}/>

            <View style={s.modalHeader}>
              <View style={[s.modalStatusDot,{backgroundColor: isPending ? COLORS.amber : COLORS.primary}]}/>
              <Text style={s.modalTitle}>Order #{verifiedOrder.id}</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={s.modalClose}>
                <Ionicons name="close" size={20} color={COLORS.muted}/>
              </TouchableOpacity>
            </View>

            {/* Status banner */}
            <View style={[s.statusBanner,{backgroundColor: isPending ? COLORS.amberBg : COLORS.primaryBg, borderColor: isPending ? COLORS.amberBorder : COLORS.primaryBorder}]}>
              <Ionicons name={isPending ? 'time-outline' : 'checkmark-circle-outline'} size={16} color={isPending ? COLORS.amber : COLORS.primary}/>
              <Text style={[s.statusBannerTxt,{color: isPending ? COLORS.amber : COLORS.primary}]}>
                {isPending ? 'PAYMENT PENDING — Collect cash before exit' : 'PAYMENT CONFIRMED — Allow exit'}
              </Text>
            </View>

            {/* Customer info */}
            <View style={s.infoRow}>
              <Ionicons name="person-outline" size={14} color={COLORS.muted}/>
              <Text style={s.infoTxt}>Customer: <Text style={{fontWeight:'600',color:COLORS.text}}>{verifiedOrder.userName}</Text></Text>
            </View>
            <View style={s.infoRow}>
              <Ionicons name="time-outline" size={14} color={COLORS.muted}/>
              <Text style={s.infoTxt}>
                {verifiedOrder.date.toLocaleDateString('en-IN')} at {verifiedOrder.date.toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit',hour12:true})}
              </Text>
            </View>

            {/* Items */}
            <Text style={[s.cardTitle,{marginTop:12,marginBottom:8}]}>Items ({verifiedOrder.items.length})</Text>
            <ScrollView style={{maxHeight:200}} showsVerticalScrollIndicator={false}>
              {verifiedOrder.items.map(({ product, qty }) => {
                const cat = CATEGORY_COLORS[product.category] || { bg:'#f3f4f6', text:'#374151' };
                return (
                  <View key={product.id} style={s.itemRow}>
                    <View style={[s.catBadge,{backgroundColor:cat.bg}]}>
                      <Text style={[s.catTxt,{color:cat.text}]}>{product.category.slice(0,3).toUpperCase()}</Text>
                    </View>
                    <View style={{flex:1}}>
                      <Text style={s.itemName}>{product.name}</Text>
                      <Text style={s.itemMeta}>₹{product.price} × {qty}</Text>
                    </View>
                    <Text style={s.itemTotal}>₹{product.price * qty}</Text>
                  </View>
                );
              })}
            </ScrollView>

            {/* Totals */}
            <View style={[s.divider,{marginVertical:10}]}/>
            <View style={s.calcRow}><Text style={s.calcLbl}>Subtotal</Text><Text style={s.calcVal}>₹{verifiedOrder.subtotal}</Text></View>
            <View style={s.calcRow}><Text style={s.calcLbl}>GST (5%)</Text><Text style={s.calcVal}>₹{verifiedOrder.tax}</Text></View>
            <View style={s.calcRow}><Text style={s.calcLbl}>Convenience</Text><Text style={s.calcVal}>₹{verifiedOrder.convenienceFee}</Text></View>
            <View style={s.calcRow}>
              <Text style={[s.calcLbl,{fontWeight:'700',color:COLORS.text,fontSize:FONT.md}]}>Total</Text>
              <Text style={[s.calcVal,{fontWeight:'700',color:COLORS.primary,fontSize:FONT.md}]}>₹{verifiedOrder.total}</Text>
            </View>

            <View style={{flexDirection:'row',gap:10,marginTop:16}}>
              <TouchableOpacity style={[s.modalBtn,{flex:1,backgroundColor:COLORS.surface2,borderWidth:1,borderColor:COLORS.border}]} onPress={() => { setModalVisible(false); openScanner(); }}>
                <Text style={[s.modalBtnTxt,{color:COLORS.text2}]}>Scan Another</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[s.modalBtn,{flex:1,backgroundColor:COLORS.primary}]} onPress={() => setModalVisible(false)}>
                <Text style={s.modalBtnTxt}>Done</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  }

  // ── Camera scanner overlay ────────────────────────────────────────────────────
  if (scanning) {
    return (
      <View style={{flex:1,backgroundColor:'#000'}}>
        <CameraView
          style={StyleSheet.absoluteFillObject}
          facing="back"
          barcodeScannerSettings={{ barcodeTypes:['qr'] }}
          onBarcodeScanned={canScan ? handleQR : undefined}
        />
        <View style={s.scanOverlay}>
          <View style={s.scanTopBar}>
            <TouchableOpacity style={s.scanClose} onPress={() => setScanning(false)}>
              <Ionicons name="close" size={22} color="#fff"/>
            </TouchableOpacity>
            <Text style={s.scanTitle}>Verify Order QR</Text>
            <View style={{width:40}}/>
          </View>
          <View style={s.scanWindow}>
            <View style={[s.corner,s.tl]}/><View style={[s.corner,s.tr]}/>
            <View style={[s.corner,s.bl]}/><View style={[s.corner,s.br]}/>
          </View>
          <Text style={s.scanHint}>Scan the customer's checkout QR code</Text>
        </View>
      </View>
    );
  }

  // ── Main admin panel ──────────────────────────────────────────────────────────
  return (
    <ScreenWrapper>
      <View style={s.root}>
      {/* Red header */}
      <View style={s.header}>
        <View>
          <Text style={s.hSub}>ADMIN PANEL</Text>
          <Text style={s.hTitle}>ZipTap Dashboard</Text>
        </View>
        <TouchableOpacity style={s.soBtn} onPress={signOut}>
          <Text style={s.soTxt}>Sign Out</Text>
        </TouchableOpacity>
      </View>

      {/* Verify Order button */}
      <TouchableOpacity style={s.verifyBtn} onPress={openScanner} activeOpacity={0.85}>
        <Ionicons name="qr-code-outline" size={20} color="#fff" style={{marginRight:8}}/>
        <Text style={s.verifyBtnTxt}>Verify Order (Scan QR)</Text>
      </TouchableOpacity>

      {/* Tabs */}
      <View style={s.tabRow}>
        {TABS.map(t => (
          <TouchableOpacity key={t} style={[s.tab, activeTab===t && s.tabOn]} onPress={() => setActiveTab(t)}>
            <Text style={[s.tabTxt, activeTab===t && s.tabTxtOn]}>{t}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {activeTab === 'Dashboard' ? (
        <ScrollView contentContainerStyle={s.body}>
          {/* Stats grid */}
          <View style={s.grid}>
            <Stat label="Total Orders"  value={transactions.length} color={COLORS.danger}  icon="receipt-outline"/>
            <Stat label="Revenue"       value={'₹'+revenue}         color={COLORS.primary} icon="trending-up-outline"/>
            <Stat label="Pending Cash"  value={pendingCount}        color={COLORS.amber}   icon="time-outline"/>
            <Stat label="Paid"          value={paidCount}           color={COLORS.blue}    icon="checkmark-circle-outline"/>
          </View>

          <Text style={s.sectionLbl}>Recent Orders</Text>
          {transactions.length === 0
            ? <Text style={s.empty}>No orders yet</Text>
            : transactions.slice(0,20).map(o => (
                <View key={o.id} style={s.orderRow}>
                  <View style={{flex:1}}>
                    <Text style={s.rowId}>#{o.id}</Text>
                    <Text style={s.rowMeta}>
                      {o.items.length} item{o.items.length!==1?'s':''} · {o.paymentMethod==='cash'?'Cash':'Digital'} · {o.userName}
                    </Text>
                  </View>
                  <View style={{alignItems:'flex-end',gap:4}}>
                    <Text style={s.rowTotal}>₹{o.total}</Text>
                    <View style={[s.badge, o.status==='paid' ? s.bGreen : s.bAmber]}>
                      <Text style={[s.badgeTxt,{color: o.status==='paid' ? COLORS.primary : COLORS.amber}]}>
                        {o.status==='paid' ? 'Paid' : 'Pending'}
                      </Text>
                    </View>
                  </View>
                </View>
              ))
          }
        </ScrollView>
      ) : (
        /* ── History tab ── */
        <ScrollView contentContainerStyle={s.body}>
          <Text style={s.sectionLbl}>All Transactions</Text>
          {transactions.length === 0
            ? (
              <View style={s.emptyWrap}>
                <Ionicons name="document-text-outline" size={36} color={COLORS.muted}/>
                <Text style={s.empty}>No transactions yet</Text>
              </View>
            )
            : transactions.map(o => (
                <View key={o.id} style={s.histCard}>
                  <View style={{flexDirection:'row',justifyContent:'space-between',alignItems:'flex-start',marginBottom:8}}>
                    <View>
                      <Text style={s.histId}>Order #{o.id}</Text>
                      <Text style={s.histDate}>
                        {o.date.toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'})}
                        {'  '}
                        {o.date.toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit',hour12:true})}
                      </Text>
                      <Text style={s.histUser}>{o.userName}</Text>
                    </View>
                    <View style={{alignItems:'flex-end',gap:4}}>
                      <Text style={s.histAmt}>₹{o.total}</Text>
                      <View style={[s.badge, o.status==='paid' ? s.bGreen : s.bAmber]}>
                        <Text style={[s.badgeTxt,{color: o.status==='paid' ? COLORS.primary : COLORS.amber}]}>
                          {o.status==='paid' ? 'Paid' : 'Pending'}
                        </Text>
                      </View>
                    </View>
                  </View>
                  <View style={s.divider}/>
                  <View style={{flexDirection:'row',justifyContent:'space-between'}}>
                    <Text style={s.histMeta}>{o.items.length} items · {o.paymentMethod==='upi'?'UPI/GPay':o.paymentMethod==='card'?'Card':'Cash'}</Text>
                    {o.zCoinsEarned > 0 && <Text style={s.histCoins}>+{o.zCoinsEarned} Z-Coins</Text>}
                  </View>
                </View>
              ))
          }
        </ScrollView>
      )}

      <OrderModal/>
      </View>
    </ScreenWrapper>
  );
}

const s = StyleSheet.create({
  root:         { flex:1, backgroundColor:COLORS.bg },
  header:       { backgroundColor:'#7f1d1d', paddingTop:56, paddingBottom:16, paddingHorizontal:18, flexDirection:'row', justifyContent:'space-between', alignItems:'flex-start' },
  hSub:         { fontSize:FONT.xs, color:'rgba(255,255,255,.55)', letterSpacing:.5, marginBottom:2 },
  hTitle:       { fontSize:FONT.xl, fontWeight:'700', color:'#fff' },
  soBtn:        { backgroundColor:'rgba(255,255,255,.18)', borderRadius:RADIUS.sm, paddingHorizontal:14, paddingVertical:7 },
  soTxt:        { color:'#fff', fontSize:FONT.sm, fontWeight:'500' },
  verifyBtn:    { flexDirection:'row', alignItems:'center', justifyContent:'center', backgroundColor:COLORS.primary, margin:14, marginBottom:0, borderRadius:RADIUS.md, paddingVertical:13 },
  verifyBtnTxt: { color:'#fff', fontSize:FONT.md, fontWeight:'600' },
  tabRow:       { flexDirection:'row', margin:14, marginBottom:0, backgroundColor:COLORS.surface2, borderRadius:RADIUS.md, padding:3 },
  tab:          { flex:1, alignItems:'center', paddingVertical:8, borderRadius:RADIUS.sm-2 },
  tabOn:        { backgroundColor:COLORS.surface },
  tabTxt:       { fontSize:FONT.base, color:COLORS.muted, fontWeight:'500' },
  tabTxtOn:     { color:COLORS.text, fontWeight:'600' },
  body:         { padding:14, paddingBottom:40 },
  grid:         { flexDirection:'row', flexWrap:'wrap', gap:10, marginBottom:20 },
  stat:         { flex:1, minWidth:'45%', backgroundColor:COLORS.surface, borderRadius:RADIUS.md, padding:14, alignItems:'center', borderWidth:1, borderColor:COLORS.border },
  statIcon:     { width:36, height:36, borderRadius:99, alignItems:'center', justifyContent:'center', marginBottom:8 },
  statVal:      { fontSize:22, fontWeight:'700', marginBottom:2 },
  statLbl:      { fontSize:FONT.sm, color:COLORS.muted, textAlign:'center' },
  sectionLbl:   { fontSize:FONT.xs, color:COLORS.muted, letterSpacing:.5, textTransform:'uppercase', fontWeight:'500', marginBottom:10 },
  empty:        { textAlign:'center', color:COLORS.muted, fontSize:FONT.base, paddingVertical:24 },
  emptyWrap:    { alignItems:'center', paddingVertical:40, gap:10 },
  orderRow:     { backgroundColor:COLORS.surface, borderRadius:RADIUS.md, padding:13, flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginBottom:8, borderWidth:1, borderColor:COLORS.border },
  rowId:        { fontSize:FONT.md, fontWeight:'600', color:COLORS.text, marginBottom:2 },
  rowMeta:      { fontSize:FONT.sm, color:COLORS.muted },
  rowTotal:     { fontSize:FONT.md, fontWeight:'700', color:COLORS.text, marginBottom:3 },
  badge:        { borderRadius:99, paddingHorizontal:8, paddingVertical:2 },
  bGreen:       { backgroundColor:COLORS.primaryBg },
  bAmber:       { backgroundColor:COLORS.amberBg },
  badgeTxt:     { fontSize:FONT.xs, fontWeight:'500' },
  // History tab
  histCard:     { backgroundColor:COLORS.surface, borderRadius:RADIUS.md, padding:13, marginBottom:8, borderWidth:1, borderColor:COLORS.border },
  histId:       { fontSize:FONT.md, fontWeight:'600', color:COLORS.text, marginBottom:2 },
  histDate:     { fontSize:FONT.sm, color:COLORS.muted, marginBottom:1 },
  histUser:     { fontSize:FONT.sm, color:COLORS.text2 },
  histAmt:      { fontSize:FONT.lg, fontWeight:'700', color:COLORS.text },
  histMeta:     { fontSize:FONT.sm, color:COLORS.muted },
  histCoins:    { fontSize:FONT.sm, color:COLORS.primary, fontWeight:'500' },
  divider:      { height:1, backgroundColor:COLORS.border, marginVertical:8 },
  // Modal
  modalOverlay: { flex:1, backgroundColor:'rgba(0,0,0,0.5)', justifyContent:'flex-end' },
  modalSheet:   { backgroundColor:COLORS.surface, borderTopLeftRadius:24, borderTopRightRadius:24, padding:20, paddingBottom:36 },
  modalHandle:  { width:40, height:4, backgroundColor:COLORS.border, borderRadius:99, alignSelf:'center', marginBottom:16 },
  modalHeader:  { flexDirection:'row', alignItems:'center', gap:10, marginBottom:14 },
  modalStatusDot:{ width:10, height:10, borderRadius:99 },
  modalTitle:   { flex:1, fontSize:FONT.xl, fontWeight:'700', color:COLORS.text },
  modalClose:   { width:32, height:32, backgroundColor:COLORS.surface2, borderRadius:99, alignItems:'center', justifyContent:'center' },
  statusBanner: { flexDirection:'row', alignItems:'center', gap:8, borderRadius:RADIUS.md, borderWidth:1, padding:11, marginBottom:12 },
  statusBannerTxt:{ flex:1, fontSize:FONT.sm, fontWeight:'600', lineHeight:18 },
  infoRow:      { flexDirection:'row', alignItems:'center', gap:6, marginBottom:5 },
  infoTxt:      { fontSize:FONT.base, color:COLORS.muted },
  cardTitle:    { fontSize:FONT.xs, color:COLORS.muted, letterSpacing:.5, textTransform:'uppercase', fontWeight:'500' },
  itemRow:      { flexDirection:'row', alignItems:'center', gap:8, paddingVertical:6, borderBottomWidth:1, borderBottomColor:'rgba(0,0,0,.04)' },
  catBadge:     { width:30, height:30, borderRadius:7, alignItems:'center', justifyContent:'center', flexShrink:0 },
  catTxt:       { fontSize:8, fontWeight:'700' },
  itemName:     { fontSize:FONT.base, fontWeight:'500', color:COLORS.text },
  itemMeta:     { fontSize:FONT.sm, color:COLORS.muted },
  itemTotal:    { fontSize:FONT.base, fontWeight:'600', color:COLORS.text },
  calcRow:      { flexDirection:'row', justifyContent:'space-between', marginBottom:5 },
  calcLbl:      { fontSize:FONT.base, color:COLORS.muted },
  calcVal:      { fontSize:FONT.base, color:COLORS.text },
  modalBtn:     { borderRadius:RADIUS.md, paddingVertical:13, alignItems:'center' },
  modalBtnTxt:  { color:'#fff', fontSize:FONT.md, fontWeight:'600' },
  // Camera scanner
  scanOverlay:  { ...StyleSheet.absoluteFillObject, justifyContent:'space-between', alignItems:'center', paddingVertical:60 },
  scanTopBar:   { flexDirection:'row', alignItems:'center', justifyContent:'space-between', width:'100%', paddingHorizontal:20 },
  scanClose:    { width:40, height:40, backgroundColor:'rgba(0,0,0,0.5)', borderRadius:99, alignItems:'center', justifyContent:'center' },
  scanTitle:    { color:'#fff', fontSize:FONT.lg, fontWeight:'600' },
  scanWindow:   { width:240, height:240, position:'relative' },
  corner:       { position:'absolute', width:28, height:28, borderColor:COLORS.primary, borderWidth:3 },
  tl: { top:0,    left:0,  borderRightWidth:0, borderBottomWidth:0, borderTopLeftRadius:4 },
  tr: { top:0,    right:0, borderLeftWidth:0,  borderBottomWidth:0, borderTopRightRadius:4 },
  bl: { bottom:0, left:0,  borderRightWidth:0, borderTopWidth:0,    borderBottomLeftRadius:4 },
  br: { bottom:0, right:0, borderLeftWidth:0,  borderTopWidth:0,    borderBottomRightRadius:4 },
  scanHint:     { color:'rgba(255,255,255,0.7)', fontSize:FONT.base, textAlign:'center', paddingHorizontal:32 },
});
