// src/screens/HistoryScreen.js
import React from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { Ionicons }  from '@expo/vector-icons';
import { useCart }   from '../context/CartContext';
import ScreenWrapper from '../components/ScreenWrapper';
import { CATEGORY_COLORS } from '../data/products';
import { COLORS, RADIUS, FONT } from '../components/theme';

export default function HistoryScreen() {
  const { orders } = useCart();

  if (orders.length === 0) {
    return (
      <ScreenWrapper>
        <View style={s.empty}>
          <View style={s.emptyIcon}>
            <Ionicons name="document-text-outline" size={28} color={COLORS.muted}/>
          </View>
          <Text style={s.emptyTitle}>No orders yet</Text>
          <Text style={s.emptySub}>Completed orders will appear here</Text>
        </View>
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper>
      <View style={s.root}>
      <Text style={s.heading}>Order History</Text>
      <FlatList
        data={orders}
        keyExtractor={o => o.id}
        contentContainerStyle={s.list}
        renderItem={({ item: o }) => (
          <View style={s.card}>
            {/* Header */}
            <View style={s.cardHdr}>
              <View>
                <Text style={s.orderId}>Order #{o.id}</Text>
                <Text style={s.orderMeta}>
                  {o.date.toLocaleDateString('en-IN')} · {
                    o.paymentMethod === 'upi'  ? 'UPI / GPay' :
                    o.paymentMethod === 'card' ? 'Card' : 'Cash at Counter'
                  }
                </Text>
              </View>
              <View style={{ alignItems:'flex-end', gap:4 }}>
                <Text style={s.orderTotal}>₹{o.total}</Text>
                <View style={[s.badge, o.status==='paid' ? s.bGreen : s.bAmber]}>
                  <Text style={[s.badgeTxt,{color: o.status==='paid' ? COLORS.primary : COLORS.amber}]}>
                    {o.status==='paid' ? 'Paid' : 'Pending'}
                  </Text>
                </View>
              </View>
            </View>

            {/* Line items */}
            <View style={s.divider}/>
            {o.items.map(({ product, qty }) => {
              const cat = CATEGORY_COLORS[product.category] || { bg:'#f3f4f6', text:'#374151' };
              return (
                <View key={product.id} style={s.lineRow}>
                  <View style={[s.catBadge,{backgroundColor:cat.bg}]}>
                    <Text style={[s.catTxt,{color:cat.text}]}>{product.category.slice(0,3).toUpperCase()}</Text>
                  </View>
                  <View style={s.lineInfo}>
                    <Text style={s.lineName}>{product.name}</Text>
                    <Text style={s.lineMeta}>
                      ₹{product.price} × {qty}
                      {product.discount > 0 ? `  ·  ${product.discount}% off` : ''}
                    </Text>
                  </View>
                  <View style={{ alignItems:'flex-end' }}>
                    <Text style={s.lineTotal}>₹{product.price * qty}</Text>
                    {product.discount > 0 && (
                      <Text style={s.lineMrp}>₹{product.mrp * qty}</Text>
                    )}
                  </View>
                </View>
              );
            })}

            {/* Totals footer */}
            <View style={s.divider}/>
            <View style={s.calcRow}>
              <Text style={s.calcLbl}>Subtotal</Text>
              <Text style={s.calcVal}>₹{o.subtotal}</Text>
            </View>
            <View style={s.calcRow}>
              <Text style={s.calcLbl}>GST (5%)</Text>
              <Text style={s.calcVal}>₹{o.tax}</Text>
            </View>
            <View style={s.convRow}>
              <Text style={s.convLbl}>ZipTap convenience charge</Text>
              <Text style={s.convVal}>₹{o.convenienceFee}</Text>
            </View>
            <View style={s.calcRow}>
              <Text style={s.totalLbl}>Total Paid</Text>
              <Text style={s.totalVal}>₹{o.total}</Text>
            </View>
            {o.zCoinsEarned > 0 && (
              <Text style={s.zCoinsEarned}>+{o.zCoinsEarned} Z-Coins earned</Text>
            )}
          </View>
        )}
      />
      </View>
    </ScreenWrapper>
  );
}

const s = StyleSheet.create({
  root:       { flex:1, backgroundColor:COLORS.bg },
  heading:    { fontSize:FONT.xl, fontWeight:'600', color:COLORS.text, padding:16, paddingBottom:8 },
  list:       { paddingHorizontal:16, paddingBottom:32 },
  empty:      { flex:1, alignItems:'center', justifyContent:'center', backgroundColor:COLORS.bg, gap:10 },
  emptyIcon:  { width:64, height:64, backgroundColor:COLORS.surface2, borderRadius:RADIUS.lg, alignItems:'center', justifyContent:'center' },
  emptyTitle: { fontSize:FONT.md, color:COLORS.muted },
  emptySub:   { fontSize:FONT.sm, color:COLORS.muted, opacity:0.6 },
  card:       { backgroundColor:COLORS.surface, borderRadius:RADIUS.lg, padding:13, marginBottom:10, borderWidth:1, borderColor:COLORS.border },
  cardHdr:    { flexDirection:'row', justifyContent:'space-between', marginBottom:10 },
  orderId:    { fontSize:FONT.md, fontWeight:'600', color:COLORS.text, marginBottom:2 },
  orderMeta:  { fontSize:FONT.sm, color:COLORS.muted },
  orderTotal: { fontSize:FONT.md, fontWeight:'700', color:COLORS.text, marginBottom:4 },
  badge:      { borderRadius:99, paddingHorizontal:8, paddingVertical:2 },
  bGreen:     { backgroundColor:COLORS.primaryBg },
  bAmber:     { backgroundColor:COLORS.amberBg },
  badgeTxt:   { fontSize:FONT.xs, fontWeight:'500' },
  divider:    { height:1, backgroundColor:COLORS.border, marginVertical:8 },
  lineRow:    { flexDirection:'row', alignItems:'center', paddingVertical:5, borderBottomWidth:1, borderBottomColor:'rgba(0,0,0,.04)', gap:8 },
  catBadge:   { width:30, height:30, borderRadius:7, alignItems:'center', justifyContent:'center', flexShrink:0 },
  catTxt:     { fontSize:8, fontWeight:'700' },
  lineInfo:   { flex:1 },
  lineName:   { fontSize:FONT.sm, fontWeight:'500', color:COLORS.text, marginBottom:1 },
  lineMeta:   { fontSize:FONT.xs, color:COLORS.muted },
  lineTotal:  { fontSize:FONT.base, fontWeight:'600', color:COLORS.text },
  lineMrp:    { fontSize:FONT.xs, color:COLORS.muted, textDecorationLine:'line-through' },
  calcRow:    { flexDirection:'row', justifyContent:'space-between', marginBottom:5 },
  calcLbl:    { fontSize:FONT.sm, color:COLORS.muted },
  calcVal:    { fontSize:FONT.sm, color:COLORS.text },
  convRow:    { flexDirection:'row', justifyContent:'space-between', backgroundColor:COLORS.primaryBg, borderRadius:RADIUS.sm, padding:7, marginBottom:6 },
  convLbl:    { fontSize:FONT.sm, color:COLORS.primary, fontWeight:'500' },
  convVal:    { fontSize:FONT.sm, color:COLORS.primary, fontWeight:'500' },
  totalLbl:   { fontSize:FONT.md, fontWeight:'700', color:COLORS.text },
  totalVal:   { fontSize:FONT.md, fontWeight:'700', color:COLORS.primary },
  zCoinsEarned:{ fontSize:FONT.xs, color:COLORS.primary, textAlign:'right', marginTop:4 },
});
