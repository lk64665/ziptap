// src/context/CartContext.js
// ─────────────────────────────────────────────────────────────────────────────
//  NEW in this version:
//  ✅ isHost — true for the user who called startSharedCart()
//  ✅ cartStatus — real-time string: 'idle' | 'checking_out' | 'paid'
//  ✅ beginCheckout() — host sets status → 'checking_out' in RTDB
//  ✅ completeCheckout() — host clears cart, resets everyone's groupId to null
//  ✅ Two subscriptions in subscribeCart: items listener + status listener
//     Both unsubscribed cleanly on unmount via the returned cleanup fn
//  ✅ All calcs wrapped in Number() — zero NaN in UI
// ─────────────────────────────────────────────────────────────────────────────
import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import {
  createSharedCart,
  joinSharedCart        as firebaseJoinCart,
  addItemToSharedCart,
  changeItemQtyInSharedCart,
  clearSharedCart,
  setCartStatus,
  subscribeToSharedCart,
  subscribeToCartStatus,
} from '../firebase/firebaseConfig';
 
// ── PURE CALCULATION HELPERS (NaN-safe) ───────────────────────────────────────
export const calcSubtotal = (items) =>
  items.reduce(
    (sum, i) => sum + (Number(i.product?.price || 0) * Number(i.qty || 0)),
    0,
  );
 
export const calcTax         = (subtotal) => Number(subtotal) * 0.05;
export const CONVENIENCE_FEE = 15;
export const calcTotal       = (subtotal) => {
  const res = Number(subtotal) + calcTax(Number(subtotal)) + CONVENIENCE_FEE;
  return isNaN(res) ? 0 : res;
};
export const calcZCoins = (total) => Math.floor(Number(total) / 10);
 
// ── Context ────────────────────────────────────────────────────────────────────
const CartContext = createContext(null);
 
export function CartProvider({ children }) {
  const [localItems,   setLocalItems]   = useState([]);
  const [sharedItems,  setSharedItems]  = useState([]);
  const [groupId,      setGroupId]      = useState(null);
  const [isHost,       setIsHost]       = useState(false);
  const [cartStatus,   setCartStatusState] = useState('idle'); // 'idle' | 'checking_out' | 'paid'
  const [groupLoading, setGroupLoading] = useState(false);
  const [orders,       setOrders]       = useState([]);
  const [coinHistory,  setCoinHistory]  = useState([]);
 
  // Ref to hold the current groupId synchronously (avoids stale closure in callbacks)
  const groupIdRef = useRef(null);
 
  const cartItems = groupId ? sharedItems : localItems;
 
  // ── Derived values (NaN-safe, re-computed on every render) ────────────────
  const itemCount = cartItems.reduce((s, i) => s + Number(i.qty || 0), 0);
  const subtotal  = calcSubtotal(cartItems);
  const tax       = calcTax(subtotal);
  const total     = calcTotal(subtotal);
 
  // ── LOCAL MUTATIONS ────────────────────────────────────────────────────────
 
  const addToCart = useCallback((product) => {
    if (groupIdRef.current) return;
    setLocalItems((prev) => {
      const hit = prev.find((i) => i.product.id === product.id);
      if (hit)
        return prev.map((i) =>
          i.product.id === product.id ? { ...i, qty: i.qty + 1 } : i,
        );
      return [...prev, { product, qty: 1 }];
    });
  }, []);
 
  const changeQty = useCallback((productId, delta) => {
    const gid = groupIdRef.current;
    if (gid) {
      changeItemQtyInSharedCart(gid, productId, delta).catch(console.error);
      return;
    }
    setLocalItems((prev) =>
      prev
        .map((i) =>
          i.product.id !== productId
            ? i
            : { ...i, qty: Math.max(0, i.qty + delta) },
        )
        .filter((i) => i.qty > 0),
    );
  }, []);
 
  const clearCart = useCallback(async () => {
    const gid = groupIdRef.current;
    if (gid) {
      await clearSharedCart(gid).catch(console.error);
    } else {
      setLocalItems([]);
    }
  }, []);
 
  // ── SHARED CART: addSharedItem (ScanScreen uses this) ─────────────────────
 
  const addSharedItem = useCallback(
    async (product, addedBy) => {
      const gid = groupIdRef.current;
      if (gid) {
        await addItemToSharedCart(gid, product, addedBy);
      } else {
        addToCart(product);
      }
    },
    [addToCart],
  );
 
  // ── SHARED CART: create ────────────────────────────────────────────────────
 
  async function startSharedCart(userName) {
    setGroupLoading(true);
    try {
      const id = await createSharedCart(userName);
      groupIdRef.current = id;
      setGroupId(id);
      setIsHost(true);         // creator is the host
      setCartStatusState('idle');
      return id;
    } finally {
      setGroupLoading(false);
    }
  }
 
  // ── SHARED CART: join ──────────────────────────────────────────────────────
 
  async function joinSharedCart(code) {
    setGroupLoading(true);
    try {
      await firebaseJoinCart(code);
      groupIdRef.current = code;
      setGroupId(code);
      setIsHost(false);        // joiner is NOT the host
      setCartStatusState('idle');
      return true;
    } catch (err) {
      throw err;
    } finally {
      setGroupLoading(false);
    }
  }
 
  // ── SHARED CART: leave ─────────────────────────────────────────────────────
 
  function leaveSharedCartMode() {
    groupIdRef.current = null;
    setGroupId(null);
    setSharedItems([]);
    setIsHost(false);
    setCartStatusState('idle');
  }
 
  // ── SHARED CART: subscribe (items + status) ────────────────────────────────
 
  /**
   * Sets up two RTDB listeners — items and status.
   * Returns a single cleanup function that unsubscribes both.
   * Use as the return value of useEffect(() => subscribeCart(groupId), [groupId]).
   */
  function subscribeCart(id) {
    if (!id) return () => {};
 
    // 1️⃣ Items listener
    const unsubItems = subscribeToSharedCart(id, (rawItems) => {
      if (!rawItems) {
        setSharedItems([]);
        return;
      }
      const normalized = Object.values(rawItems).map((i) => ({
        product: {
          id:       i.productId,
          name:     i.name      || '',
          price:    Number(i.price)    || 0,
          category: i.category  || 'GEN',
        },
        qty:     Number(i.qty)  || 0,
        addedBy: i.addedBy || '',
      }));
      setSharedItems(normalized);
    });
 
    // 2️⃣ Status listener — drives the host-checkout overlay for members
    const unsubStatus = subscribeToCartStatus(id, (status) => {
      setCartStatusState(status || 'idle');
 
      // When host's payment completes, reset everyone back to local mode
      if (status === 'paid') {
        groupIdRef.current = null;
        setGroupId(null);
        setSharedItems([]);
        setIsHost(false);
        setCartStatusState('idle');
      }
    });
 
    // Return combined cleanup
    return () => {
      unsubItems();
      unsubStatus();
    };
  }
 
  // ── CHECKOUT SYNC ──────────────────────────────────────────────────────────
 
  /**
   * Host calls this when navigating to the Checkout screen.
   * Writes status → 'checking_out' so all members see the overlay.
   */
  async function beginCheckout() {
    const gid = groupIdRef.current;
    if (gid && isHost) {
      await setCartStatus(gid, 'checking_out').catch(console.error);
    }
  }
 
  /**
   * Host calls this after successful payment.
   * Clears cart for everyone + resets status → 'idle'.
   * The subscribeToCartStatus listener on all clients then detects 'paid'
   * and resets their groupId to null automatically (see subscribeCart above).
   */
  async function completeCheckout({ paymentMethod, userName }) {
    const gid = groupIdRef.current;
 
    // Record the order locally before clearing
    const order = placeOrder({ paymentMethod, userName });
 
    if (gid && isHost) {
      // Signal 'paid' first so members' status listeners fire the reset
      await setCartStatus(gid, 'paid').catch(console.error);
      // Then clear items (status listener already reset state client-side)
      await clearSharedCart(gid).catch(console.error);
    }
 
    return order;
  }
 
  // ── ORDER PLACEMENT ────────────────────────────────────────────────────────
 
  function placeOrder({ paymentMethod, userName }) {
    const orderId     = String(1000 + Math.floor(Math.random() * 9000));
    const safeTotal   = Number(total)    || 0;
    const coinsEarned = paymentMethod === 'cash' ? 0 : calcZCoins(safeTotal);
 
    const order = {
      id:           orderId,
      date:         new Date(),
      items:        JSON.parse(JSON.stringify(cartItems)),
      subtotal:     Number(subtotal) || 0,
      tax:          Number(tax)      || 0,
      total:        safeTotal,
      paymentMethod,
      status:       paymentMethod === 'cash' ? 'pending' : 'paid',
      zCoinsEarned: coinsEarned,
      userName,
    };
 
    setOrders((prev) => [order, ...prev]);
    if (coinsEarned > 0) {
      setCoinHistory((prev) => [
        { coins: coinsEarned, orderId, date: new Date(), amount: safeTotal },
        ...prev,
      ]);
    }
    return order;
  }
 
  // ── Provider ───────────────────────────────────────────────────────────────
  return (
    <CartContext.Provider
      value={{
        // State
        cartItems, groupId, isHost, cartStatus, groupLoading,
        orders, coinHistory,
        // Derived (NaN-safe)
        itemCount, subtotal, tax, total,
        // Local mutations
        addToCart, changeQty, clearCart,
        // Shared-cart actions
        addSharedItem,
        startSharedCart,
        joinSharedCart,
        leaveSharedCartMode,
        subscribeCart,
        // Checkout sync
        beginCheckout,
        completeCheckout,
        // Legacy (for screens still calling placeOrder directly)
        placeOrder,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}
 
export const useCart = () => useContext(CartContext);