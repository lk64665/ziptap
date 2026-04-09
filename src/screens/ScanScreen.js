// src/screens/ScanScreen.js  (also used as Scanner.js)
// ─────────────────────────────────────────────────────────────────────────────
//  KEY CHANGES vs v1:
//  • Barcode scan → addSharedItem() which pushes to Firebase RTDB when a
//    groupId is active, or falls back to local cart.
//  • CameraView from expo-camera SDK 53+ (not the old <Camera> component).
//  • useCameraPermissions() hook — permissions requested on demand.
//  • expo-image-picker fully removed from this screen (no conflict).
// ─────────────────────────────────────────────────────────────────────────────
import React, { useState, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, FlatList,
  StyleSheet, Alert, ActivityIndicator,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import ScreenWrapper from '../components/ScreenWrapper';
import { PRODUCTS, CATEGORY_COLORS } from '../data/products';
import { COLORS, RADIUS, FONT } from '../components/theme';

export default function ScanScreen() {
  const { displayName }                    = useAuth();
  const { addSharedItem, groupId }         = useCart();
  const [permission, requestPermission]    = useCameraPermissions();
  const [mode,       setMode]              = useState('list'); // 'list' | 'camera'
  const [scanning,   setScanning]          = useState(true);
  const [lastAdded,  setLastAdded]         = useState(null);
  const [adding,     setAdding]            = useState(false);

  // ── Add a product (local or shared) ───────────────────────────────────────
  const handleAdd = useCallback(async (product) => {
    if (adding) return;
    setAdding(true);
    try {
      await addSharedItem(product, displayName);
      setLastAdded(product.name);
      setTimeout(() => setLastAdded(null), 2500);
    } catch (err) {
      Alert.alert('Error', 'Could not add item. Please try again.');
      console.error('[ScanScreen] addSharedItem error:', err);
    } finally {
      setAdding(false);
    }
  }, [addSharedItem, displayName, adding]);

  // ── Camera barcode handler ─────────────────────────────────────────────────
  const handleBarcode = useCallback(async ({ data }) => {
    if (!scanning || adding) return;
    setScanning(false);  // debounce
    const found = PRODUCTS.find(p => p.barcode === data);
    if (found) {
      await handleAdd(found);
      setMode('list');
    } else {
      Alert.alert(
        'Unknown Barcode',
        `"${data}" is not in the ZipTap store catalogue.`,
        [
          { text:'Scan Again', onPress:() => setScanning(true) },
          { text:'Close',      onPress:() => { setMode('list'); setScanning(true); } },
        ]
      );
    }
  }, [scanning, adding, handleAdd]);

  // ── Open camera with permission check ─────────────────────────────────────
  async function openCamera() {
    if (!permission?.granted) {
      const res = await requestPermission();
      if (!res.granted) {
        Alert.alert(
          'Camera Permission Required',
          'ZipTap needs camera access to scan barcodes. Please enable it in Settings.',
        );
        return;
      }
    }
    setScanning(true);
    setMode('camera');
  }

  // ── Camera view ────────────────────────────────────────────────────────────
  if (mode === 'camera') {
    return (
      <View style={s.cameraRoot}>
        <CameraView
          style={StyleSheet.absoluteFillObject}
          facing="back"
          barcodeScannerSettings={{
            barcodeTypes: ['ean13', 'ean8', 'qr', 'code128', 'upc_a'],
          }}
          onBarcodeScanned={scanning && !adding ? handleBarcode : undefined}
        />
        <View style={s.overlay}>
          <View style={s.topBar}>
            <TouchableOpacity style={s.closeBtn} onPress={() => { setMode('list'); setScanning(true); }}>
              <Ionicons name="close" size={22} color="#fff"/>
            </TouchableOpacity>
            <Text style={s.camTitle}>Scan Barcode</Text>
            <View style={{ width:40 }}/>
          </View>

          <View style={s.scanWindow}>
            <View style={[s.corner,s.tl]}/><View style={[s.corner,s.tr]}/>
            <View style={[s.corner,s.bl]}/><View style={[s.corner,s.br]}/>
          </View>

          {adding && (
            <View style={s.addingBadge}>
              <ActivityIndicator color="#fff" size="small" style={{ marginRight:8 }}/>
              <Text style={{ color:'#fff', fontSize:FONT.base }}>Adding to cart…</Text>
            </View>
          )}
          <Text style={s.camHint}>Point at any product barcode</Text>
        </View>
      </View>
    );
  }

  // ── List view ──────────────────────────────────────────────────────────────
  return (
    <ScreenWrapper>
      <View style={s.root}>
      {/* Shared cart indicator */}
      {groupId && (
        <View style={s.sharedBanner}>
          <Ionicons name="people-outline" size={14} color={COLORS.primary}/>
          <Text style={s.sharedTxt}>
            Shared Cart active — Group <Text style={{ fontWeight:'700' }}>{groupId}</Text>. Items sync to all members.
          </Text>
        </View>
      )}

      {/* Camera scan button */}
      <TouchableOpacity style={s.camBtn} onPress={openCamera} activeOpacity={0.85}>
        <Ionicons name="camera-outline" size={20} color="#fff" style={{ marginRight:8 }}/>
        <Text style={s.camBtnTxt}>Open Camera to Scan Barcode</Text>
      </TouchableOpacity>

      {/* Toast */}
      {lastAdded && (
        <View style={s.toast}>
          <Ionicons name="checkmark-circle" size={15} color={COLORS.primary}/>
          <Text style={s.toastTxt}>{lastAdded} added{groupId ? ' to shared cart' : ''}</Text>
        </View>
      )}

      <Text style={s.sectionLbl}>Or tap a product to add</Text>

      <FlatList
        data={PRODUCTS}
        keyExtractor={p => p.id}
        contentContainerStyle={[s.list, { paddingBottom: 100 }]}
        keyboardShouldPersistTaps="handled"
        renderItem={({ item }) => {
          const cat = CATEGORY_COLORS[item.category] || { bg:'#f3f4f6', text:'#374151' };
          return (
            <TouchableOpacity
              style={[s.item, adding && { opacity:0.6 }]}
              onPress={() => handleAdd(item)}
              disabled={adding}
              activeOpacity={0.8}
            >
              <View style={[s.catBadge,{ backgroundColor:cat.bg }]}>
                <Text style={[s.catTxt,{ color:cat.text }]}>{item.category.slice(0,3).toUpperCase()}</Text>
              </View>
              <View style={s.info}>
                <Text style={s.name}>{item.name}</Text>
                <View style={s.tags}>
                  {item.discount > 0 && (
                    <View style={s.tagP}><Text style={s.tagPTxt}>{item.discount}% OFF</Text></View>
                  )}
                  {item.restocked && (
                    <View style={s.tagB}><Text style={s.tagBTxt}>Restocked</Text></View>
                  )}
                </View>
              </View>
              <View style={s.priceCol}>
                <Text style={s.price}>₹{item.price}</Text>
                {item.discount > 0 && <Text style={s.mrp}>₹{item.mrp}</Text>}
              </View>
            </TouchableOpacity>
          );
        }}
      />
      </View>
    </ScreenWrapper>
  );
}

const s = StyleSheet.create({
  root:        { flex:1, backgroundColor:COLORS.bg },
  sharedBanner:{ flexDirection:'row', alignItems:'center', gap:7, backgroundColor:COLORS.primaryBg, borderBottomWidth:1, borderBottomColor:COLORS.primaryBorder, padding:10, paddingHorizontal:16 },
  sharedTxt:   { fontSize:FONT.sm, color:COLORS.primary, flex:1 },
  camBtn:      { flexDirection:'row', alignItems:'center', justifyContent:'center', backgroundColor:COLORS.primary, margin:14, marginBottom:10, borderRadius:RADIUS.md, paddingVertical:13 },
  camBtnTxt:   { color:'#fff', fontSize:FONT.md, fontWeight:'600' },
  toast:       { flexDirection:'row', alignItems:'center', gap:8, marginHorizontal:14, backgroundColor:COLORS.surface, borderRadius:RADIUS.md, padding:10, borderWidth:1, borderColor:COLORS.primaryBorder, marginBottom:8 },
  toastTxt:    { color:COLORS.text, fontSize:FONT.base, fontWeight:'500', flex:1 },
  sectionLbl:  { fontSize:FONT.xs, color:COLORS.muted, letterSpacing:.5, textTransform:'uppercase', fontWeight:'500', marginHorizontal:16, marginBottom:8 },
  list:        { paddingHorizontal:14, paddingBottom:24 },
  item:        { flexDirection:'row', alignItems:'center', backgroundColor:COLORS.surface, borderRadius:RADIUS.md, padding:12, marginBottom:8, borderWidth:1, borderColor:COLORS.border },
  catBadge:    { width:42, height:42, borderRadius:10, alignItems:'center', justifyContent:'center', marginRight:10, flexShrink:0 },
  catTxt:      { fontSize:FONT.xs, fontWeight:'700' },
  info:        { flex:1 },
  name:        { fontSize:FONT.base, fontWeight:'500', color:COLORS.text, marginBottom:4 },
  tags:        { flexDirection:'row', gap:5 },
  tagP:        { backgroundColor:COLORS.primaryBg, borderRadius:99, paddingHorizontal:6, paddingVertical:1 },
  tagPTxt:     { fontSize:FONT.xs, color:COLORS.primary, fontWeight:'600' },
  tagB:        { backgroundColor:COLORS.blueBg, borderRadius:99, paddingHorizontal:6, paddingVertical:1 },
  tagBTxt:     { fontSize:FONT.xs, color:COLORS.blue, fontWeight:'600' },
  priceCol:    { alignItems:'flex-end' },
  price:       { fontSize:FONT.md, fontWeight:'700', color:COLORS.primary },
  mrp:         { fontSize:FONT.sm, color:COLORS.muted, textDecorationLine:'line-through' },
  // Camera
  cameraRoot:  { flex:1, backgroundColor:'#000' },
  overlay:     { ...StyleSheet.absoluteFillObject, justifyContent:'space-between', alignItems:'center', paddingVertical:60 },
  topBar:      { flexDirection:'row', alignItems:'center', justifyContent:'space-between', width:'100%', paddingHorizontal:20 },
  closeBtn:    { width:40, height:40, backgroundColor:'rgba(0,0,0,0.55)', borderRadius:99, alignItems:'center', justifyContent:'center' },
  camTitle:    { color:'#fff', fontSize:FONT.lg, fontWeight:'600' },
  scanWindow:  { width:250, height:250, position:'relative' },
  corner:      { position:'absolute', width:30, height:30, borderColor:COLORS.primary, borderWidth:3 },
  tl: { top:0,    left:0,  borderRightWidth:0, borderBottomWidth:0, borderTopLeftRadius:4 },
  tr: { top:0,    right:0, borderLeftWidth:0,  borderBottomWidth:0, borderTopRightRadius:4 },
  bl: { bottom:0, left:0,  borderRightWidth:0, borderTopWidth:0,    borderBottomLeftRadius:4 },
  br: { bottom:0, right:0, borderLeftWidth:0,  borderTopWidth:0,    borderBottomRightRadius:4 },
  addingBadge: { flexDirection:'row', alignItems:'center', backgroundColor:'rgba(108,60,225,0.8)', borderRadius:99, paddingHorizontal:16, paddingVertical:8 },
  camHint:     { color:'rgba(255,255,255,0.65)', fontSize:FONT.base, textAlign:'center', paddingHorizontal:32 },
});
