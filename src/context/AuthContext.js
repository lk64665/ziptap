// src/context/AuthContext.js
// ─── ZipTap  •  Z-Coins  •  Z-Wallet ────────────────────────────────────────
import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ── Admin code ────────────────────────────────────────────────────────────────
export const ADMIN_CODE = 'ziptapadmin@2411';

// ── AsyncStorage keys (ZipTap namespace) ─────────────────────────────────────
const KEYS = {
  SESSION: '@zt_session',
  USERS:   '@zt_users',
};

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(null);
  const [isGuest, setIsGuest] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(KEYS.SESSION);
        if (raw) {
          const s = JSON.parse(raw);
          if (s.isGuest)      setIsGuest(true);
          else if (s.isAdmin) setIsAdmin(true);
          else if (s.user)    setUser(s.user);
        }
      } catch (_) {}
      setLoading(false);
    })();
  }, []);

  // ── Email login ───────────────────────────────────────────────────────────
  async function loginWithEmail(email, password) {
    const raw   = await AsyncStorage.getItem(KEYS.USERS);
    const users = raw ? JSON.parse(raw) : [];
    const found = users.find(u => u.email === email && u.password === password);
    if (!found) throw new Error('Incorrect email or password');
    await _save({ user: found });
    setUser(found);
    return found;
  }

  // ── Sign up ───────────────────────────────────────────────────────────────
  async function signup({ firstName, lastName, username, email, phone, dob, password, referralCode }) {
    const raw   = await AsyncStorage.getItem(KEYS.USERS);
    const users = raw ? JSON.parse(raw) : [];
    if (users.find(u => u.email === email)) throw new Error('Email already registered');
    const newUser = {
      id:           Date.now().toString(),
      firstName, lastName,
      name:         `${firstName} ${lastName}`,
      username, email, phone, dob, password,
      referralCode: referralCode || null,
      provider:     'email',
      zCoins:       referralCode ? 50 : 0,   
      createdAt:    new Date().toISOString(),
    };
    users.push(newUser);
    await AsyncStorage.setItem(KEYS.USERS, JSON.stringify(users));
    await _save({ user: newUser });
    setUser(newUser);
    return newUser;
  }

  // ── Social login (mock — wire up expo-auth-session in prod) ───────────────
  async function loginWithSocial(provider) {
    const names = { Google:'Priya Sharma', Apple:'Raj Patel', Facebook:'Anita Verma', Phone:'Mobile User', WhatsApp:'WhatsApp User' };
    const u = {
      id:        `${provider.toLowerCase()}_${Date.now()}`,
      name:      names[provider] || `${provider} User`,
      username:  `${provider.toLowerCase()}_user`,
      email:     `user@${provider.toLowerCase()}.mock`,
      provider,
      zCoins:    0,
      createdAt: new Date().toISOString(),
    };
    await _save({ user: u });
    setUser(u);
    return u;
  }

  async function loginAsGuest()  { setIsGuest(true); await _save({ isGuest: true }); }
  async function loginAsAdmin()  { setIsAdmin(true); await _save({ isAdmin: true }); }

  async function logout() {
    setUser(null); setIsGuest(false); setIsAdmin(false);
    await AsyncStorage.removeItem(KEYS.SESSION);
  }

  // ── Update Z-Coins balance ────────────────────────────────────────────────
  async function updateZCoins(delta) {
    if (!user) return;
    const updated = { ...user, zCoins: (user.zCoins || 0) + delta };
    setUser(updated);
    await _save({ user: updated });
    const raw = await AsyncStorage.getItem(KEYS.USERS);
    if (raw) {
      const users = JSON.parse(raw);
      const idx   = users.findIndex(u => u.id === user.id);
      if (idx !== -1) {
        users[idx] = updated;
        await AsyncStorage.setItem(KEYS.USERS, JSON.stringify(users));
      }
    }
  }

  async function _save(payload) {
    await AsyncStorage.setItem(KEYS.SESSION, JSON.stringify(payload));
  }

  const displayName = isGuest ? 'Guest' : (user?.name || user?.username || '');

  return (
    <AuthContext.Provider value={{
      user, isGuest, isAdmin, loading, displayName,
      loginWithEmail, signup, loginWithSocial,
      loginAsGuest, loginAsAdmin, logout, updateZCoins,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
