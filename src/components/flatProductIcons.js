// Minimalist 2D flat-style line art for inventory (Blinkit-like)
import React from 'react';
import Svg, { Circle, Ellipse, Path, Rect } from 'react-native-svg';

const SIZE = 44;

export function FlatIconMilk({ size = SIZE, accent = '#0ea5e9' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 48 48">
      <Rect x="14" y="8" width="20" height="32" rx="3" fill={accent} opacity={0.92} />
      <Path d="M18 8 L22 4 L26 4 L30 8" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
      <Rect x="17" y="16" width="14" height="10" rx="1" fill="#fff" opacity={0.35} />
      <Rect x="18" y="30" width="12" height="3" rx="1" fill="#fff" opacity={0.5} />
    </Svg>
  );
}

export function FlatIconEggs({ size = SIZE, accent = '#fbbf24' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 48 48">
      <Rect x="8" y="14" width="32" height="24" rx="4" fill="#e5e7eb" />
      <Ellipse cx="16" cy="26" rx="5" ry="7" fill="#fff" stroke={accent} strokeWidth="1.5" />
      <Ellipse cx="24" cy="26" rx="5" ry="7" fill="#fff" stroke={accent} strokeWidth="1.5" />
      <Ellipse cx="32" cy="26" rx="5" ry="7" fill="#fff" stroke={accent} strokeWidth="1.5" />
      <Rect x="10" y="18" width="28" height="3" rx="1" fill="#d1d5db" />
    </Svg>
  );
}

export function FlatIconGrain({ size = SIZE, accent = '#d97706' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 48 48">
      <Path
        d="M10 32 L14 14 L34 14 L38 32 Z"
        fill={accent}
        opacity={0.9}
      />
      <Rect x="12" y="18" width="24" height="3" rx="1" fill="#fff" opacity={0.25} />
      <Rect x="12" y="24" width="18" height="3" rx="1" fill="#fff" opacity={0.2} />
      <Circle cx="24" cy="12" r="3" fill="#fde68a" />
    </Svg>
  );
}

export function FlatIconTomato({ size = SIZE, accent = '#ef4444' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 48 48">
      <Circle cx="24" cy="26" r="14" fill={accent} />
      <Path d="M24 10 L20 16 L28 16 Z" fill="#22c55e" />
      <Path d="M18 12 Q24 8 30 12" fill="none" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" />
      <Ellipse cx="24" cy="28" rx="6" ry="5" fill="#fff" opacity={0.2} />
    </Svg>
  );
}

export function FlatIconDefault({ size = SIZE, accent = '#64748b' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 48 48">
      <Rect x="10" y="12" width="28" height="26" rx="4" fill="#e2e8f0" stroke={accent} strokeWidth="2" />
      <Path d="M16 18 H32 M16 24 H28 M16 30 H32" stroke={accent} strokeWidth="2" strokeLinecap="round" opacity={0.6} />
    </Svg>
  );
}

export function pickFlatIconKey(product) {
  const name = (product?.name || '').toLowerCase();
  const cat = (product?.category || '').toLowerCase();
  if (name.includes('milk')) return 'milk';
  if (name.includes('egg')) return 'eggs';
  if (name.includes('tomato')) return 'tomato';
  if (
    name.includes('dal') ||
    name.includes('pulse') ||
    name.includes('rice') ||
    name.includes('basmati') ||
    name.includes('grain') ||
    cat.includes('grain')
  ) {
    return 'grain';
  }
  return 'default';
}

export function FlatProductGlyph({ product, size = 44 }) {
  const key = pickFlatIconKey(product);
  switch (key) {
    case 'milk':
      return <FlatIconMilk size={size} />;
    case 'eggs':
      return <FlatIconEggs size={size} />;
    case 'grain':
      return <FlatIconGrain size={size} />;
    case 'tomato':
      return <FlatIconTomato size={size} />;
    default:
      return <FlatIconDefault size={size} />;
  }
}
