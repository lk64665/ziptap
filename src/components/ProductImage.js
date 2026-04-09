import React, { useEffect, useMemo, useState } from 'react';
import { Image, View, StyleSheet } from 'react-native';
import { getProductImageUrl, getFallbackImageUrl, getUnsplashGroceryUrl } from '../utils/productImageUrl';

/**
 * Network product photo with graceful fallbacks (Lorem Flickr → Unsplash query → Picsum seed).
 */
export default function ProductImage({ product, width, height, borderRadius = 12, style }) {
  const uris = useMemo(
    () => [
      getProductImageUrl(product),
      getUnsplashGroceryUrl(product),
      getFallbackImageUrl(product),
    ],
    [product?.id, product?.barcode, product?.name, product?.category],
  );
  const [step, setStep] = useState(0);
  useEffect(() => {
    setStep(0);
  }, [uris]);

  const uri = uris[Math.min(step, uris.length - 1)];

  return (
    <View style={[{ width, height, borderRadius, overflow: 'hidden', backgroundColor: '#f1f5f9' }, style]}>
      <Image
        source={{ uri }}
        style={StyleSheet.absoluteFill}
        resizeMode="cover"
        onError={() => setStep((s) => Math.min(s + 1, uris.length - 1))}
      />
    </View>
  );
}
