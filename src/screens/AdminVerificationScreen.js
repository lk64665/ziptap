// Admin-only: verify checkout QR or Order ID against persisted orders
import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Haptics from 'expo-haptics';
import { useAuth } from '../context/AuthContext';
import ScreenWrapper from '../components/ScreenWrapper';
import * as orderDatabase from '../services/orderDatabase';
import { COLORS, RADIUS, FONT } from '../components/theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

function parseQrPayload(data) {
  const raw = String(data || '').trim();
  if (!raw) return { orderId: null };
  try {
    const j = JSON.parse(raw);
    if (j && j.orderId != null) return { orderId: String(j.orderId), amount: j.amount, currency: j.currency };
  } catch (_) {}
  return { orderId: raw };
}

export default function AdminVerificationScreen({ navigation }) {
  const { isAdmin } = useAuth();
  const insets = useSafeAreaInsets();
  const [permission, requestPermission] = useCameraPermissions();
  const [mode, setMode] = useState('scan');
  const [manualId, setManualId] = useState('');
  const [loading, setLoading] = useState(false);
  const [order, setOrder] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isAdmin) {
      navigation.goBack();
    }
  }, [isAdmin, navigation]);

  useEffect(() => {
    (async () => {
      try {
        await requestPermission();
      } catch (_) {}
    })();
  }, [requestPermission]);

  const loadOrder = useCallback(async (orderId) => {
    const id = String(orderId || '').trim();
    if (!id) {
      setError('Enter or scan a valid Order ID');
      setOrder(null);
      return;
    }
    setLoading(true);
    setError('');
    setOrder(null);
    try {
      const found = await orderDatabase.getOrderById(id);
      if (!found) {
        setError(`No order found for #${id}`);
        return;
      }
      setOrder(found);
    } catch (e) {
      setError(e?.message || 'Lookup failed');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleBarcodeScanned = useCallback(
    (event) => {
      const result = event?.data ? event : event?.nativeEvent;
      const data = result?.data;
      const { orderId } = parseQrPayload(data);
      if (orderId) loadOrder(orderId);
    },
    [loadOrder],
  );

  function handleVerifySuccess() {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert('Verified', 'Order details match the database. Customer may proceed.');
  }

  return (
    <ScreenWrapper>
      <View style={[s.root, { paddingTop: insets.top + 8 }]}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.back}>
          <Ionicons name="chevron-back" size={20} color={COLORS.text} />
          <Text style={s.backTxt}>Back</Text>
        </TouchableOpacity>
        <Text style={s.title}>Verify Order</Text>
        <Text style={s.sub}>Scan checkout QR or enter Order ID</Text>
      </View>

      <View style={s.tabs}>
        <TouchableOpacity
          style={[s.tab, mode === 'scan' && s.tabOn]}
          onPress={() => setMode('scan')}
        >
          <Text style={[s.tabTxt, mode === 'scan' && s.tabTxtOn]}>Scan QR</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[s.tab, mode === 'manual' && s.tabOn]}
          onPress={() => setMode('manual')}
        >
          <Text style={[s.tabTxt, mode === 'manual' && s.tabTxtOn]}>Order ID</Text>
        </TouchableOpacity>
      </View>

      {mode === 'scan' && (
        <View style={s.camWrap}>
          {permission?.granted ? (
            <CameraView
              style={s.camera}
              facing="back"
              onBarcodeScanned={handleBarcodeScanned}
              barcodeScannerSettings={{
                barcodeTypes: ['qr', 'ean13', 'code128'],
              }}
            />
          ) : (
            <View style={s.camFallback}>
              <Text style={s.camFallbackTxt}>Camera access required to scan QR</Text>
              <TouchableOpacity style={s.permBtn} onPress={() => requestPermission()}>
                <Text style={s.permBtnTxt}>Allow camera</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}

      {mode === 'manual' && (
        <View style={s.manual}>
          <Text style={s.lbl}>Order ID</Text>
          <TextInput
            style={s.inp}
            placeholder="e.g. 4521"
            placeholderTextColor={COLORS.muted}
            keyboardType="number-pad"
            value={manualId}
            onChangeText={setManualId}
          />
          <TouchableOpacity
            style={s.lookupBtn}
            onPress={() => loadOrder(manualId)}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={s.lookupBtnTxt}>Lookup order</Text>
            )}
          </TouchableOpacity>
        </View>
      )}

      {!!error && <Text style={s.err}>{error}</Text>}

      {order && (
        <ScrollView style={s.result} contentContainerStyle={s.resultContent}>
          <View style={s.resultHead}>
            <View>
              <Text style={s.oid}>#{order.id}</Text>
              <Text style={s.odate}>
                {order.date instanceof Date
                  ? order.date.toLocaleString('en-IN')
                  : new Date(order.date).toLocaleString('en-IN')}
              </Text>
            </View>
            <View
              style={[
                s.payBadge,
                { backgroundColor: order.status === 'paid' ? COLORS.primaryBg : COLORS.amberBg },
              ]}
            >
              <Text
                style={[
                  s.payTxt,
                  { color: order.status === 'paid' ? COLORS.primary : COLORS.amber },
                ]}
              >
                {order.status === 'paid' ? 'Paid' : 'Pending'}
              </Text>
            </View>
          </View>
          <Text style={s.lineLbl}>Payment</Text>
          <Text style={s.lineVal}>
            {order.paymentMethod === 'cash' ? 'Cash at counter' : 'Digital (UPI / Card)'}
          </Text>
          <Text style={s.lineLbl}>Customer</Text>
          <Text style={s.lineVal}>{order.userName || '—'}</Text>

          <Text style={s.itemsLbl}>Cart items</Text>
          {(order.items || []).map((line, idx) => (
            <View key={`${line.product?.id}-${idx}`} style={s.itemRow}>
              <Text style={s.itemName} numberOfLines={2}>
                {line.product?.name}
              </Text>
              <Text style={s.itemQty}>×{line.qty}</Text>
              <Text style={s.itemPrice}>₹{(line.product?.price || 0) * (line.qty || 0)}</Text>
            </View>
          ))}

          <View style={s.totalRow}>
            {/* FIX: plain & in JSX text — never use &amp; in React Native */}
            <Text style={s.totalLbl}>Total (incl. tax & fee)</Text>
            <Text style={s.totalVal}>₹{order.total}</Text>
          </View>

          <TouchableOpacity style={s.verifyBtn} onPress={handleVerifySuccess} activeOpacity={0.85}>
            <Ionicons name="shield-checkmark" size={20} color="#fff" />
            <Text style={s.verifyBtnTxt}>Confirm verification</Text>
          </TouchableOpacity>
        </ScrollView>
      )}
      </View>
    </ScreenWrapper>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg },
  header: { paddingHorizontal: 16, marginBottom: 12 },
  back: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 8 },
  backTxt: { fontSize: FONT.base, color: COLORS.muted },
  title: { fontSize: FONT.xl, fontWeight: '800', color: COLORS.text },
  sub: { fontSize: FONT.sm, color: COLORS.muted, marginTop: 4 },
  tabs: { flexDirection: 'row', marginHorizontal: 16, gap: 8, marginBottom: 12 },
  tab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
  },
  tabOn: { borderColor: COLORS.primary, backgroundColor: COLORS.primaryBg },
  tabTxt: { fontSize: FONT.sm, fontWeight: '600', color: COLORS.muted },
  tabTxtOn: { color: COLORS.primary },
  camWrap: {
    height: 220,
    marginHorizontal: 16,
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    backgroundColor: '#000',
    marginBottom: 12,
  },
  camera: { flex: 1 },
  camFallback: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 16 },
  camFallbackTxt: { color: COLORS.muted, marginBottom: 12, textAlign: 'center' },
  permBtn: { backgroundColor: COLORS.primary, paddingHorizontal: 16, paddingVertical: 10, borderRadius: RADIUS.md },
  permBtnTxt: { color: '#fff', fontWeight: '700' },
  manual: { paddingHorizontal: 16, marginBottom: 12 },
  lbl: { fontSize: FONT.xs, color: COLORS.muted, marginBottom: 6, fontWeight: '600' },
  inp: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    padding: 14,
    fontSize: FONT.lg,
    color: COLORS.text,
    backgroundColor: COLORS.surface,
    marginBottom: 12,
  },
  lookupBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.md,
    paddingVertical: 14,
    alignItems: 'center',
  },
  lookupBtnTxt: { color: '#fff', fontWeight: '700', fontSize: FONT.md },
  err: { color: COLORS.danger, marginHorizontal: 16, marginBottom: 8, fontSize: FONT.sm },
  result: { flex: 1 },
  resultContent: { paddingHorizontal: 16, paddingBottom: 32 },
  resultHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  oid: { fontSize: FONT.xl, fontWeight: '800', color: COLORS.text },
  odate: { fontSize: FONT.sm, color: COLORS.muted, marginTop: 4 },
  payBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 99 },
  payTxt: { fontSize: FONT.sm, fontWeight: '700' },
  lineLbl: { fontSize: FONT.xs, color: COLORS.muted, textTransform: 'uppercase', marginTop: 8 },
  lineVal: { fontSize: FONT.md, color: COLORS.text, fontWeight: '600' },
  itemsLbl: { fontSize: FONT.sm, color: COLORS.muted, fontWeight: '700', marginTop: 16, marginBottom: 8 },
  itemRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  itemName: { flex: 1, fontSize: FONT.base, color: COLORS.text },
  itemQty: { fontSize: FONT.sm, color: COLORS.muted, width: 36 },
  itemPrice: { fontSize: FONT.base, fontWeight: '600', color: COLORS.text },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  totalLbl: { fontSize: FONT.md, fontWeight: '700', color: COLORS.text },
  totalVal: { fontSize: FONT.lg, fontWeight: '800', color: COLORS.primary },
  verifyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.danger,
    marginTop: 20,
    paddingVertical: 14,
    borderRadius: RADIUS.md,
  },
  verifyBtnTxt: { color: '#fff', fontSize: FONT.md, fontWeight: '800' },
});