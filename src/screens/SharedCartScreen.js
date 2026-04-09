import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, TextInput, Alert, Share } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, RADIUS, FONT } from '../components/theme';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import ScreenWrapper from '../components/ScreenWrapper';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';

export default function SharedCartScreen({ navigation }) {
  const { user, isGuest } = useAuth();
  const {
    sharedCartId,
    sharedHostUid,
    sharedClosed,
    sharedJoinRequests,
    sharedMembers,
    mySharedMember,
    hostSharedCart,
    joinSharedCartByCode,
    approveJoinRequest,
    kickMember,
    closeSharedCart,
    leaveSharedCart,
  } = useCart();

  const [codeInput, setCodeInput] = useState('');
  const [joinOpen, setJoinOpen] = useState(false);

  const myUid = user?.id ? String(user.id) : null;
  const isHost = !!(myUid && sharedHostUid && String(myUid) === String(sharedHostUid));
  const code = sharedCartId ? String(sharedCartId).trim().toUpperCase() : '';

  const pendingRequests = useMemo(() => {
    const v = sharedJoinRequests || {};
    return Object.entries(v).map(([uid, row]) => ({
      uid,
      userName: row?.userName || 'User',
    }));
  }, [sharedJoinRequests]);

  const members = useMemo(() => {
    const v = sharedMembers || {};
    return Object.entries(v).map(([uid, row]) => ({
      uid,
      userName: row?.userName || row?.name || 'User',
      userColor: row?.userColor || row?.color || COLORS.primary,
    }));
  }, [sharedMembers]);

  // Host popup when a new join request arrives.
  const lastPendingCountRef = useRef(0);
  useEffect(() => {
    if (!isHost) return;
    const count = pendingRequests.length;
    const prev = lastPendingCountRef.current;
    lastPendingCountRef.current = count;
    if (count > prev && pendingRequests[0]) {
      const newest = pendingRequests[0];
      Alert.alert(
        'Join Request',
        `${newest.userName} wants to join your shared cart.`,
        [
          { text: 'Later', style: 'cancel' },
          {
            text: 'Approve',
            onPress: async () => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              await approveJoinRequest(newest.uid);
            },
          },
        ],
      );
    }
  }, [isHost, pendingRequests, approveJoinRequest]);

  return (
    <ScreenWrapper>
      <View style={s.root}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn} activeOpacity={0.85}>
          <Ionicons name="chevron-back" size={20} color={COLORS.text} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={s.title}>Shared Cart</Text>
          <Text style={s.sub}>Host or join a shopping session</Text>
        </View>
      </View>

      {!sharedCartId ? (
        <View style={s.card}>
          <TouchableOpacity
            style={s.primaryBtn}
            onPress={async () => {
              if (isGuest) {
                Alert.alert('Sign in required', 'Please sign in to host a shared cart.');
                navigation.navigate('UserAuth');
                return;
              }
              try {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                await hostSharedCart();
              } catch (e) {
                Alert.alert('Host failed', e?.message || 'Unexpected error');
              }
            }}
            activeOpacity={0.9}
          >
            <Ionicons name="people-outline" size={16} color="#fff" style={{ marginRight: 8 }} />
            <Text style={s.primaryBtnTxt}>Host Shared Cart</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={s.secondaryBtn}
            onPress={() => setJoinOpen((v) => !v)}
            activeOpacity={0.9}
          >
            <Ionicons name="log-in-outline" size={16} color={COLORS.primary} style={{ marginRight: 8 }} />
            <Text style={s.secondaryBtnTxt}>Join Shared Cart</Text>
          </TouchableOpacity>

          {joinOpen && (
            <View style={s.joinRow}>
              <TextInput
                style={s.input}
                value={codeInput}
                onChangeText={setCodeInput}
                placeholder="Enter code (e.g., V7X2K)"
                placeholderTextColor={COLORS.muted}
                autoCapitalize="characters"
              />
              <TouchableOpacity
                style={s.joinBtn}
                onPress={async () => {
                  if (isGuest) {
                    Alert.alert('Sign in required', 'Please sign in to join a shared cart.');
                    navigation.navigate('UserAuth');
                    return;
                  }
                  try {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    await joinSharedCartByCode(codeInput);
                    Alert.alert('Request sent', 'Waiting for host approval…');
                  } catch (e) {
                    Alert.alert('Join failed', e?.message || 'Unexpected error');
                  }
                }}
                activeOpacity={0.9}
                disabled={!codeInput.trim()}
              >
                <Text style={s.joinBtnTxt}>Request</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      ) : (
        <View style={s.card}>
          <Text style={s.sectionLbl}>Session Code</Text>
          <View style={s.codeRow}>
            <Text style={s.codeTxt}>{code}</Text>
            <TouchableOpacity
              style={s.copyBtn}
              onPress={async () => {
                await Clipboard.setStringAsync(code);
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                Alert.alert('Copied', 'Code copied to clipboard.');
              }}
              activeOpacity={0.85}
            >
              <Ionicons name="copy-outline" size={18} color={COLORS.primary} />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={s.inviteBtn}
            onPress={async () => {
              const deepLink = `velocart://join?code=${code}`;
              const msg =
                `Hey! Join my shopping session on VeloCart. ` +
                `Use code: ${code} or click this link to join: ${deepLink}`;
              try {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                await Share.share({ message: msg });
              } catch (_) {}
            }}
            activeOpacity={0.9}
          >
            <Ionicons name="share-outline" size={16} color="#fff" style={{ marginRight: 8 }} />
            <Text style={s.inviteBtnTxt}>Share Invite</Text>
          </TouchableOpacity>

          {sharedClosed && (
            <View style={s.banner}>
              <Ionicons name="lock-closed-outline" size={18} color={COLORS.amber} />
              <Text style={s.bannerTxt}>This shared cart is closed.</Text>
            </View>
          )}

          {isHost && (
            <>
              <View style={s.divider} />
              <Text style={s.sectionLbl}>Pending Join Requests</Text>
              {pendingRequests.length === 0 ? (
                <Text style={s.muted}>No pending requests.</Text>
              ) : (
                pendingRequests.map((r) => (
                  <View key={r.uid} style={s.row}>
                    <Text style={s.rowTxt}>{r.userName}</Text>
                    <TouchableOpacity
                      style={s.smallBtn}
                      onPress={async () => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                        await approveJoinRequest(r.uid);
                      }}
                      activeOpacity={0.9}
                    >
                      <Text style={s.smallBtnTxt}>Approve</Text>
                    </TouchableOpacity>
                  </View>
                ))
              )}

              <View style={{ marginTop: 10 }}>
                <Text style={s.sectionLbl}>Members</Text>
                {members.map((m) => (
                  <View key={m.uid} style={s.row}>
                    <View style={[s.swatch, { backgroundColor: m.userColor }]} />
                    <Text style={[s.rowTxt, { flex: 1 }]} numberOfLines={1}>{m.userName}</Text>
                    {String(m.uid) !== String(sharedHostUid) && (
                      <TouchableOpacity
                        style={s.kickBtn}
                        onPress={async () => {
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                          await kickMember(m.uid);
                        }}
                        activeOpacity={0.9}
                      >
                        <Text style={s.kickBtnTxt}>Kick</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                ))}
              </View>

              <TouchableOpacity
                style={s.closeBtn}
                onPress={() => {
                  Alert.alert('Close cart?', 'This will prevent everyone from editing the cart.', [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Close', style: 'destructive', onPress: () => closeSharedCart() },
                  ]);
                }}
                activeOpacity={0.9}
              >
                <Text style={s.closeBtnTxt}>Close Cart</Text>
              </TouchableOpacity>
            </>
          )}

          {!isHost && (
            <TouchableOpacity
              style={s.secondaryBtn}
              onPress={async () => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                await leaveSharedCart();
              }}
              activeOpacity={0.9}
            >
              <Text style={s.secondaryBtnTxt}>Leave Session</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      <TouchableOpacity
        style={s.goCartBtn}
        onPress={() => navigation.navigate('Cart')}
        activeOpacity={0.9}
      >
        <Text style={s.goCartBtnTxt}>Go to Cart</Text>
      </TouchableOpacity>
      </View>
    </ScreenWrapper>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg, padding: 16, paddingTop: 22 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  backBtn: { width: 42, height: 42, borderRadius: RADIUS.md, backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: FONT.xl, fontWeight: '900', color: COLORS.text },
  sub: { fontSize: FONT.sm, color: COLORS.muted, fontWeight: '700', marginTop: 2 },
  card: { backgroundColor: COLORS.surface, borderRadius: RADIUS.lg, padding: 14, borderWidth: 1, borderColor: COLORS.border },
  primaryBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.primary, borderRadius: RADIUS.md, paddingVertical: 12, marginBottom: 10 },
  primaryBtnTxt: { color: '#fff', fontWeight: '900', fontSize: FONT.md },
  secondaryBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.primaryBg, borderRadius: RADIUS.md, paddingVertical: 12, borderWidth: 1, borderColor: COLORS.primaryBorder },
  secondaryBtnTxt: { color: COLORS.primary, fontWeight: '900', fontSize: FONT.md },
  joinRow: { flexDirection: 'row', gap: 10, marginTop: 10 },
  input: { flex: 1, backgroundColor: COLORS.bg, borderWidth: 1, borderColor: COLORS.border, borderRadius: RADIUS.md, paddingHorizontal: 12, paddingVertical: 10, fontSize: FONT.md, color: COLORS.text },
  joinBtn: { backgroundColor: COLORS.primary, borderRadius: RADIUS.md, paddingHorizontal: 14, justifyContent: 'center' },
  joinBtnTxt: { color: '#fff', fontWeight: '900' },
  sectionLbl: { fontSize: FONT.xs, color: COLORS.muted, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 },
  codeRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  codeTxt: { fontSize: 24, fontWeight: '900', letterSpacing: 6, color: COLORS.primary, flex: 1 },
  copyBtn: { width: 42, height: 42, borderRadius: RADIUS.md, backgroundColor: COLORS.surface2, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: COLORS.border },
  inviteBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.primary, borderRadius: RADIUS.md, paddingVertical: 12, marginBottom: 10 },
  inviteBtnTxt: { color: '#fff', fontWeight: '900', fontSize: FONT.md },
  banner: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(217,119,6,0.09)', borderColor: COLORS.amberBorder, borderWidth: 1, borderRadius: RADIUS.md, padding: 10, marginBottom: 10 },
  bannerTxt: { color: COLORS.amber, fontWeight: '900' },
  divider: { height: 1, backgroundColor: COLORS.border, marginVertical: 10 },
  muted: { color: COLORS.muted, fontWeight: '700', fontSize: FONT.sm },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: COLORS.surface2, borderRadius: RADIUS.md, padding: 10, borderWidth: 1, borderColor: COLORS.border, marginBottom: 8 },
  rowTxt: { color: COLORS.text, fontWeight: '900' },
  smallBtn: { backgroundColor: COLORS.primaryBg, borderWidth: 1, borderColor: COLORS.primaryBorder, paddingVertical: 8, paddingHorizontal: 12, borderRadius: RADIUS.md },
  smallBtnTxt: { color: COLORS.primary, fontWeight: '900' },
  swatch: { width: 12, height: 12, borderRadius: 99 },
  kickBtn: { backgroundColor: 'rgba(220,38,38,0.08)', borderWidth: 1, borderColor: 'rgba(220,38,38,0.25)', paddingVertical: 8, paddingHorizontal: 12, borderRadius: RADIUS.md },
  kickBtnTxt: { color: COLORS.danger, fontWeight: '900' },
  closeBtn: { backgroundColor: COLORS.danger, borderRadius: RADIUS.md, paddingVertical: 12, alignItems: 'center', marginTop: 6 },
  closeBtnTxt: { color: '#fff', fontWeight: '900' },
  goCartBtn: { backgroundColor: COLORS.primary, borderRadius: RADIUS.md, paddingVertical: 14, alignItems: 'center', marginTop: 12 },
  goCartBtnTxt: { color: '#fff', fontWeight: '900', fontSize: FONT.md },
});

