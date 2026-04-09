// src/firebase/firebaseConfig.js
// ─────────────────────────────────────────────────────────────────────────────
//  NEW in this version:
//  ✅ setCartStatus(groupId, status)       — host writes 'checking_out' | 'paid' | 'idle'
//  ✅ subscribeToCartStatus(groupId, cb)   — members listen for status changes in real time
//  ✅ clearSharedCart now atomically removes items AND resets status → 'idle'
//  ✅ category field stored in addItemToSharedCart so item cards show correct badge
//  All previous fixes retained (auth persistence, NaN-safe, proper exports)
// ─────────────────────────────────────────────────────────────────────────────
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import {
  getDatabase,
  ref,
  set,
  get,
  update,
  onValue,
  remove,
  serverTimestamp as rtdbTimestamp,
} from 'firebase/database';
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';
 
// ── Config ────────────────────────────────────────────────────────────────────
const firebaseConfig = {
  apiKey:            'AIzaSyAVAmVeN9wV1bqBM64ev2MJqYJZk3n2tJE',
  authDomain:        'ziptap-69.firebaseapp.com',
  databaseURL:       'https://ziptap-69-default-rtdb.asia-southeast1.firebasedatabase.app/',
  projectId:         'ziptap-69',
  storageBucket:     'ziptap-69.firebasestorage.app',
  messagingSenderId: '363368075985',
  appId:             '1:363368075985:web:bda28b1472954d79bfebf0',
};
 
// ── App init (singleton guard) ────────────────────────────────────────────────
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
 
// ── Auth with AsyncStorage persistence (AsyncStorage warning fix) ─────────────
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(ReactNativeAsyncStorage),
});
 
const db   = getFirestore(app);
const rtdb = getDatabase(app);
 
// ─────────────────────────────────────────────────────────────────────────────
//  SHARED CART FUNCTIONS
// ─────────────────────────────────────────────────────────────────────────────
 
/**
 * Creates a new shared cart node with status: 'idle'.
 * Returns the auto-generated 6-char groupId.
 */
export async function createSharedCart(userName) {
  const groupId = Math.random().toString(36).substring(2, 8).toUpperCase();
  const cartRef = ref(rtdb, `sharedCarts/${groupId}`);
  await set(cartRef, {
    createdAt: rtdbTimestamp(),
    createdBy: userName || 'unknown',
    status:    'idle',
    items:     {},
  });
  return groupId;
}
 
/**
 * Validates group exists; throws 'Invalid Group Code' if not.
 * Returns the current cart snapshot value.
 */
export async function joinSharedCart(groupId) {
  const cartRef  = ref(rtdb, `sharedCarts/${groupId}`);
  const snapshot = await get(cartRef);
  if (snapshot.exists()) return snapshot.val();
  throw new Error('Invalid Group Code');
}
 
/**
 * Adds a product to the shared cart.
 * If item already exists, increments qty by 1.
 * Stores category so item cards render the correct badge.
 */
export async function addItemToSharedCart(groupId, product, addedBy) {
  const productId = product.id || product.productId;
  const itemRef   = ref(rtdb, `sharedCarts/${groupId}/items/${productId}`);
  const snapshot  = await get(itemRef);
 
  if (snapshot.exists()) {
    const existing = snapshot.val();
    await update(itemRef, { qty: Number(existing.qty || 0) + 1 });
  } else {
    await set(itemRef, {
      productId: productId,
      name:      product.name      || '',
      price:     Number(product.price) || 0,
      category:  product.category  || 'GEN',
      qty:       1,
      addedBy:   addedBy           || 'unknown',
    });
  }
}
 
/**
 * Increments or decrements qty in the shared cart.
 * Removes the item when qty drops to 0 or below.
 */
export async function changeItemQtyInSharedCart(groupId, productId, delta) {
  const itemRef  = ref(rtdb, `sharedCarts/${groupId}/items/${productId}`);
  const snapshot = await get(itemRef);
  if (!snapshot.exists()) return;
 
  const current = snapshot.val();
  const newQty  = Number(current.qty || 0) + delta;
 
  if (newQty <= 0) {
    await remove(itemRef);
  } else {
    await update(itemRef, { qty: newQty });
  }
}
 
/**
 * Sets the top-level status field on the shared cart.
 * status values: 'idle' | 'checking_out' | 'paid'
 *
 * Host calls setCartStatus(id, 'checking_out') when entering Checkout.
 * After payment, CartContext calls clearSharedCart which resets to 'idle'.
 */
export async function setCartStatus(groupId, status) {
  const cartRef = ref(rtdb, `sharedCarts/${groupId}`);
  await update(cartRef, { status });
}
 
/**
 * Subscribes to the top-level cart node so all members receive status updates.
 * callback receives the status string: 'idle' | 'checking_out' | 'paid'
 * Returns the onValue unsubscribe function for useEffect cleanup.
 */
export function subscribeToCartStatus(groupId, callback) {
  const cartRef = ref(rtdb, `sharedCarts/${groupId}`);
  return onValue(cartRef, (snapshot) => {
    const data = snapshot.val();
    callback(data?.status || 'idle');
  });
}
 
/**
 * Atomically clears all items and resets status to 'idle'.
 * Called by the host after a successful payment — all members' carts reset.
 */
export async function clearSharedCart(groupId) {
  const itemsRef = ref(rtdb, `sharedCarts/${groupId}/items`);
  const cartRef  = ref(rtdb, `sharedCarts/${groupId}`);
  await remove(itemsRef);
  await update(cartRef, { status: 'idle' });
}
 
/**
 * Subscribes to real-time item changes in the cart.
 * Returns the onValue unsubscribe function for useEffect cleanup.
 */
export function subscribeToSharedCart(groupId, callback) {
  const itemsRef = ref(rtdb, `sharedCarts/${groupId}/items`);
  return onValue(itemsRef, (snapshot) => {
    const data = snapshot.val();
    callback(data ? Object.values(data) : []);
  });
}
 
export { auth, db, rtdb, ref, get };
 