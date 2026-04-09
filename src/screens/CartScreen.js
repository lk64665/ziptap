// src/screens/CartScreen.js
// ─────────────────────────────────────────────────────────────────────────────
//  FIXES:
//  ✅ FlatList contentContainerStyle paddingBottom:100 — checkout btn no longer
//     covers the last item
//  ✅ joinSharedCart / leaveSharedCartMode / clearCart destructured from useCart
//     (now match CartContext exports exactly)
//  ✅ handleJoinGroup calls joinSharedCart(code) — correct signature, no extra args
//  ✅ handleLeaveGroup calls leaveSharedCartMode() — no userId arg needed
//  ✅ CASING FIX: '../componentss/ScreenWrapper' → '../components/ScreenWrapper'
// ─────────────────────────────────────────────────────────────────────────────
import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, Modal, TextInput, ActivityIndicator, Alert,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { Ionicons }  from '@expo/vector-icons';
import { useAuth }   from '../context/AuthContext';
import { useCart }   from '../context/CartContext';
import ScreenWrapper from '../components/ScreenWrapper';   // ← was '../componentss/…'
import { CATEGORY_COLORS } from '../data/products';
import { COLORS, RADIUS, FONT } from '../components/theme';

export default function CartScreen({ navigation }) {
  const { user, displayName } = useAuth();
  const {
    cartItems, itemCount, subtotal, total,
    groupId, groupLoading,
    changeQty, clearCart,
    startSharedCart, joinSharedCart, leaveSharedCartMode,
    subscribeCart,
  } = useCart();

  const empty = itemCount === 0;

  // ── Real-time subscription ─────────────────────────────────────────────────
  useEffect(() => {
    if (!groupId) return;
    const unsubscribe = subscribeCart(groupId);
    return () => unsubscribe();
  }, [groupId]);

  // ── Share-cart modal state ─────────────────────────────────────────────────
  const [shareModal,    setShareModal]    = useState(false);
  const [joinCode,      setJoinCode]      = useState('');
  const [joiningGroup,  setJoiningGroup]  = useState(false);
  const [creatingGroup, setCreatingGroup] = useState(false);

  const handleCreateGroup = useCallback(async () => {
    setCreatingGroup(true);
    try {
      const id = await startSharedCart(displayName);
      setShareModal(false);
      Alert.alert(
        'Shared Cart Created!',
        `Your group code is:\n\n${id}\n\nShare this code with friends to shop together.`,
        [{ text: 'OK' }],
      );
    } catch (e) {
      Alert.alert('Error', e.message);
    }
    setCreatingGroup(false);
  }, [displayName, startSharedCart]);

  const handleJoinGroup = useCallback(async () => {
    const code = joinCode.trim().toUpperCase();
    if (code.length < 5) {
      Alert.alert('Invalid Code', 'Please enter a valid 5–6 character group code.');
      return;
    }
    setJoiningGroup(true);
    try {
      await joinSharedCart(code);   // signature: (code) only
      setShareModal(false);
      setJoinCode('');
    } catch (e) {
      Alert.alert('Error', e.message);
    }
    setJoiningGroup(false);
  }, [joinCode, joinSharedCart]);

  const handleLeaveGroup = useCallback(() => {
    Alert.alert(
      'Leave Shared Cart?',
      'You will return to your personal cart. Your scanned items stay in the shared cart.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Leave', style: 'destructive',
          onPress: () => leaveSharedCartMode(),  // no args needed
        },
      ],
    );
  }, [leaveSharedCartMode]);

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <ScreenWrapper>
      <View style={s.root}>
      {/* Header */}
      <View style={s.hdr}>
        <View>
          <Text style={s.title}>Your Cart</Text>
          <Text style={s.count}>{itemCount} item{itemCount !== 1 ? 's' : ''}</Text>
        </View>
        <View style={s.hdrRight}>
          {groupId ? (
            <TouchableOpacity style={s.groupBadge} onPress={handleLeaveGroup} activeOpacity={0.8}>
              <Ionicons name="people" size={13} color={COLORS.primary}/>
              <Text style={s.groupBadgeTxt}>{groupId}</Text>
              <Ionicons name="close-circle" size={13} color={COLORS.primary}/>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={s.shareBtn} onPress={() => setShareModal(true)} activeOpacity={0.8}>
              <Ionicons name="people-outline" size={14} color={COLORS.primary}/>
              <Text style={s.shareBtnTxt}>Share Cart</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Shared cart live indicator */}
      {groupId && (
        <View style={s.liveBanner}>
          <View style={s.liveDot}/>
          <Text style={s.liveTxt}>
            Live — syncing with group <Text style={{ fontWeight: '700' }}>{groupId}</Text>
          </Text>
        </View>
      )}

      {/* Loading spinner when Firebase op in progress */}
      {groupLoading && (
        <View style={s.loadingRow}>
          <ActivityIndicator size="small" color={COLORS.primary}/>
          <Text style={s.loadingTxt}>Connecting to shared cart…</Text>
        </View>
      )}

      {empty ? (
        <View style={s.empty}>
          <View style={s.emptyIcon}>
            <Ionicons name="cart-outline" size={28} color={COLORS.muted}/>
          </View>
          <Text style={s.emptyTitle}>Cart is empty</Text>
          <Text style={s.emptySub}>
            {groupId
              ? 'Waiting for group members to scan items…'
              : 'Scan items to get started'}
          </Text>
          <TouchableOpacity
            style={s.scanBtn}
            onPress={() => navigation.navigate('Scan')}
            activeOpacity={0.85}
          >
            <Text style={s.scanBtnTxt}>Start Scanning</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          {/* ── Item list — paddingBottom:100 so Checkout button doesn't overlap ── */}
          <FlatList
            data={cartItems}
            keyExtractor={(i) => i.product.id}
            contentContainerStyle={[s.list, { paddingBottom: 100 }]}
            renderItem={({ item }) => {
              const cat = CATEGORY_COLORS[item.product.category] || { bg: '#f3f4f6', text: '#374151' };
              return (
                <View style={s.item}>
                  <View style={[s.catBadge, { backgroundColor: cat.bg }]}>
                    <Text style={[s.catTxt, { color: cat.text }]}>
                      {item.product.category.slice(0, 3).toUpperCase()}
                    </Text>
                  </View>
                  <View style={s.info}>
                    <Text style={s.name}>{item.product.name}</Text>
                    <Text style={s.meta}>₹{item.product.price} each</Text>
                    {item.addedBy && (
                      <Text style={s.addedBy}>Added by {item.addedBy}</Text>
                    )}
                  </View>
                  <View style={s.qty}>
                    <TouchableOpacity style={s.qBtn} onPress={() => changeQty(item.product.id, -1)}>
                      <Text style={s.qTxt}>−</Text>
                    </TouchableOpacity>
                    <Text style={s.qVal}>{item.qty}</Text>
                    <TouchableOpacity style={s.qBtn} onPress={() => changeQty(item.product.id, 1)}>
                      <Text style={s.qTxt}>+</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            }}
          />

          <View style={s.footer}>
            <View style={s.footRow}>
              <Text style={s.footLbl}>Subtotal</Text>
              <Text style={s.footVal}>₹{Number(subtotal).toFixed(2)}</Text>
            </View>
            <View style={[s.footRow, { marginBottom: 14 }]}>
              <Text style={s.totalLbl}>Est. Total</Text>
              <Text style={s.totalVal}>₹{Number(total).toFixed(2)}</Text>
            </View>
            <TouchableOpacity
              style={s.btn}
              onPress={() => navigation.navigate('Checkout')}
              activeOpacity={0.85}
            >
              <Text style={s.btnTxt}>Checkout →</Text>
            </TouchableOpacity>
          </View>
        </>
      )}

      {/* ── Share Cart Modal ───────────────────────────────────────────────── */}
      <Modal
        visible={shareModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShareModal(false)}
      >
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={s.modalOverlay}>
            <View style={s.modalSheet}>
              <View style={s.modalHandle}/>

              <View style={s.modalHeader}>
                <Ionicons name="people-outline" size={22} color={COLORS.primary}/>
                <Text style={s.modalTitle}>Share Cart</Text>
                <TouchableOpacity onPress={() => setShareModal(false)} style={s.modalClose}>
                  <Ionicons name="close" size={18} color={COLORS.muted}/>
                </TouchableOpacity>
              </View>

              <Text style={s.modalSub}>
                Shop together in real time. Create a group and share the code, or join an existing one.
              </Text>

              {/* Create group */}
              <TouchableOpacity
                style={[s.modalBtn, creatingGroup && { opacity: 0.6 }]}
                onPress={handleCreateGroup}
                disabled={creatingGroup || joiningGroup}
                activeOpacity={0.85}
              >
                {creatingGroup
                  ? <ActivityIndicator color="#fff"/>
                  : <>
                      <Ionicons name="add-circle-outline" size={18} color="#fff"/>
                      <Text style={s.modalBtnTxt}>Create New Shared Cart</Text>
                    </>
                }
              </TouchableOpacity>

              <View style={s.divider}>
                <View style={s.divLine}/>
                <Text style={s.divTxt}>or join existing</Text>
                <View style={s.divLine}/>
              </View>

              {/* Join group */}
              <TextInput
                style={s.joinInput}
                placeholder="Enter group code (e.g. K7MN2R)"
                placeholderTextColor={COLORS.muted}
                autoCapitalize="characters"
                autoCorrect={false}
                maxLength={6}
                value={joinCode}
                onChangeText={setJoinCode}
              />
              <TouchableOpacity
                style={[s.joinBtn, joiningGroup && { opacity: 0.6 }]}
                onPress={handleJoinGroup}
                disabled={joiningGroup || creatingGroup}
                activeOpacity={0.85}
              >
                {joiningGroup
                  ? <ActivityIndicator color={COLORS.primary}/>
                  : <Text style={s.joinBtnTxt}>Join Group Cart</Text>
                }
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
      </View>
    </ScreenWrapper>
  );
}

const s = StyleSheet.create({
  root:          { flex: 1, backgroundColor: COLORS.bg },
  hdr:           { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, paddingBottom: 8 },
  title:         { fontSize: FONT.xl, fontWeight: '600', color: COLORS.text },
  count:         { fontSize: FONT.sm, color: COLORS.muted, marginTop: 1 },
  hdrRight:      { alignItems: 'flex-end' },
  shareBtn:      { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: COLORS.primaryBg, borderRadius: 99, paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1, borderColor: COLORS.primaryBorder },
  shareBtnTxt:   { fontSize: FONT.sm, color: COLORS.primary, fontWeight: '600' },
  groupBadge:    { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: COLORS.primaryBg, borderRadius: 99, paddingHorizontal: 10, paddingVertical: 6, borderWidth: 1, borderColor: COLORS.primaryBorder },
  groupBadgeTxt: { fontSize: FONT.sm, color: COLORS.primary, fontWeight: '700' },
  liveBanner:    { flexDirection: 'row', alignItems: 'center', gap: 7, backgroundColor: COLORS.primaryBg, paddingHorizontal: 16, paddingVertical: 7, borderBottomWidth: 1, borderBottomColor: COLORS.primaryBorder },
  liveDot:       { width: 7, height: 7, borderRadius: 99, backgroundColor: COLORS.green },
  liveTxt:       { fontSize: FONT.sm, color: COLORS.primary },
  loadingRow:    { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 10, paddingHorizontal: 16 },
  loadingTxt:    { fontSize: FONT.sm, color: COLORS.muted },
  empty:         { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10, padding: 32 },
  emptyIcon:     { width: 64, height: 64, backgroundColor: COLORS.surface2, borderRadius: RADIUS.lg, alignItems: 'center', justifyContent: 'center' },
  emptyTitle:    { fontSize: FONT.md, color: COLORS.muted },
  emptySub:      { fontSize: FONT.sm, color: COLORS.muted, opacity: 0.7, textAlign: 'center' },
  scanBtn:       { backgroundColor: COLORS.primaryBg, borderRadius: RADIUS.sm, paddingHorizontal: 18, paddingVertical: 9, borderWidth: 1, borderColor: COLORS.primaryBorder },
  scanBtnTxt:    { color: COLORS.primary, fontSize: FONT.base, fontWeight: '600' },
  list:          { padding: 14, paddingBottom: 8 },
  item:          { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.surface, borderRadius: RADIUS.md, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: COLORS.border },
  catBadge:      { width: 44, height: 44, borderRadius: 11, alignItems: 'center', justifyContent: 'center', marginRight: 10, flexShrink: 0 },
  catTxt:        { fontSize: FONT.xs, fontWeight: '700' },
  info:          { flex: 1 },
  name:          { fontSize: FONT.base, fontWeight: '500', color: COLORS.text, marginBottom: 2 },
  meta:          { fontSize: FONT.sm, color: COLORS.muted },
  addedBy:       { fontSize: FONT.xs, color: COLORS.primary, marginTop: 2 },
  qty:           { flexDirection: 'row', alignItems: 'center', gap: 6 },
  qBtn:          { width: 28, height: 28, backgroundColor: COLORS.surface2, borderRadius: RADIUS.sm, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: COLORS.border },
  qTxt:          { fontSize: 16, color: COLORS.text },
  qVal:          { fontSize: FONT.md, fontWeight: '600', color: COLORS.text, minWidth: 20, textAlign: 'center' },
  footer:        { padding: 16, backgroundColor: COLORS.surface, borderTopWidth: 1, borderTopColor: COLORS.border },
  footRow:       { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  footLbl:       { fontSize: FONT.base, color: COLORS.muted },
  footVal:       { fontSize: FONT.base, color: COLORS.text },
  totalLbl:      { fontSize: FONT.lg, fontWeight: '700', color: COLORS.text },
  totalVal:      { fontSize: 20, fontWeight: '700', color: COLORS.primary },
  btn:           { backgroundColor: COLORS.primary, borderRadius: RADIUS.md, paddingVertical: 14, alignItems: 'center' },
  btnTxt:        { color: '#fff', fontSize: FONT.md, fontWeight: '600' },
  // Modal
  modalOverlay:  { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  modalSheet:    { backgroundColor: COLORS.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 22, paddingBottom: 40 },
  modalHandle:   { width: 40, height: 4, backgroundColor: COLORS.border, borderRadius: 99, alignSelf: 'center', marginBottom: 18 },
  modalHeader:   { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 6 },
  modalTitle:    { flex: 1, fontSize: FONT.xl, fontWeight: '700', color: COLORS.text },
  modalClose:    { width: 30, height: 30, backgroundColor: COLORS.surface2, borderRadius: 99, alignItems: 'center', justifyContent: 'center' },
  modalSub:      { fontSize: FONT.base, color: COLORS.muted, marginBottom: 20, lineHeight: 20 },
  modalBtn:      { backgroundColor: COLORS.primary, borderRadius: RADIUS.md, paddingVertical: 14, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8 },
  modalBtnTxt:   { color: '#fff', fontSize: FONT.md, fontWeight: '600' },
  divider:       { flexDirection: 'row', alignItems: 'center', marginVertical: 18, gap: 10 },
  divLine:       { flex: 1, height: 1, backgroundColor: COLORS.border },
  divTxt:        { color: COLORS.muted, fontSize: FONT.sm },
  joinInput:     { borderWidth: 1, borderColor: COLORS.border, borderRadius: RADIUS.md, padding: 13, fontSize: FONT.xl, color: COLORS.text, textAlign: 'center', letterSpacing: 4, fontWeight: '700', marginBottom: 10 },
  joinBtn:       { borderWidth: 1.5, borderColor: COLORS.primary, borderRadius: RADIUS.md, paddingVertical: 13, alignItems: 'center' },
  joinBtnTxt:    { color: COLORS.primary, fontSize: FONT.md, fontWeight: '600' },
});