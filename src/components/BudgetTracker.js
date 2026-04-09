import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, Keyboard } from 'react-native';
import { useCart } from '../context/CartContext';
import { COLORS, RADIUS, FONT } from './theme';

/**
 * Set budget + progress vs cart subtotal (scanning adds to bar).
 */
export default function BudgetTracker({ compact }) {
  const { subtotal, budget, setBudget } = useCart();
  const [draft, setDraft] = useState(budget > 0 ? String(budget) : '');

  useEffect(() => {
    setDraft(budget > 0 ? String(budget) : '');
  }, [budget]);

  const b = Number(budget) || 0;
  const ratio = b > 0 ? subtotal / b : 0;
  const pct = b > 0 ? Math.min(100, ratio * 100) : 0;

  let barColor = '#22c55e';
  if (b > 0) {
    if (ratio > 0.9 || subtotal > b) barColor = '#dc2626';
    else if (ratio >= 0.7) barColor = '#eab308';
  }

  function commitBudget() {
    const n = Math.max(0, Math.round(Number(draft) || 0));
    setBudget(n);
    setDraft(n > 0 ? String(n) : '');
    Keyboard.dismiss();
  }

  return (
    <View style={[styles.wrap, compact && styles.wrapCompact]}>
      <Text style={styles.lbl}>Set budget (₹)</Text>
      <View style={styles.row}>
        <TextInput
          style={styles.inp}
          placeholder="e.g. 2000"
          placeholderTextColor={COLORS.muted}
          keyboardType="number-pad"
          value={draft}
          onChangeText={setDraft}
          onBlur={commitBudget}
          onSubmitEditing={commitBudget}
        />
        <Text style={styles.spent}>
          Spent: <Text style={styles.spentVal}>₹{subtotal}</Text>
          {b > 0 ? (
            <Text style={styles.spentSub}>
              {' '}
              / ₹{b}
            </Text>
          ) : null}
        </Text>
      </View>
      {b > 0 ? (
        <>
          <View style={styles.track}>
            <View style={[styles.fill, { width: `${pct}%`, backgroundColor: barColor }]} />
          </View>
          <Text style={styles.hint}>
            {subtotal > b
              ? 'Over budget'
              : pct >= 90
                ? '90%+ of budget used'
                : pct >= 70
                  ? '70%+ of budget used'
                  : 'Within budget'}
          </Text>
        </>
      ) : (
        <Text style={styles.hintMuted}>Enter a budget to track spending while you scan.</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  wrapCompact: { marginBottom: 8, padding: 12 },
  lbl: { fontSize: FONT.xs, fontWeight: '700', color: COLORS.muted, textTransform: 'uppercase', marginBottom: 8 },
  row: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 10, marginBottom: 10 },
  inp: {
    flex: 1,
    minWidth: 100,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: FONT.md,
    color: COLORS.text,
    backgroundColor: COLORS.bg,
  },
  spent: { fontSize: FONT.sm, color: COLORS.muted },
  spentVal: { fontWeight: '800', color: COLORS.text },
  spentSub: { fontWeight: '600', color: COLORS.muted },
  track: {
    height: 10,
    borderRadius: 99,
    backgroundColor: COLORS.surface2,
    overflow: 'hidden',
  },
  fill: { height: '100%', borderRadius: 99 },
  hint: { fontSize: FONT.xs, color: COLORS.muted, marginTop: 6 },
  hintMuted: { fontSize: FONT.xs, color: COLORS.muted, marginTop: 4 },
});
