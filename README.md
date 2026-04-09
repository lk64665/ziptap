# VeloCart — React Native (Expo) App

Scan. Pay. Walk out. No queues.

---

## Project Structure

```
velocart/
├── App.js                        ← Root entry point
├── app.json                      ← Expo config (name, icons, permissions)
├── babel.config.js
├── package.json
├── assets/                       ← icon.png, splash.png, adaptive-icon.png
└── src/
    ├── components/
    │   └── theme.js              ← All colours, radii, font sizes
    ├── context/
    │   ├── AuthContext.js        ← Login / signup / session state
    │   └── CartContext.js        ← Cart, orders, V-Coin history
    ├── data/
    │   └── products.js           ← Product catalogue + pricing helpers
    ├── navigation/
    │   └── RootNavigator.js      ← Stack + Tab navigation wiring
    └── screens/
        ├── SplashScreen.js       ← Role selector (User / Admin / Guest)
        ├── UserAuthScreen.js     ← Social + email login
        ├── SignupScreen.js       ← Full sign-up with DOB & confirm password
        ├── AdminAuthScreen.js    ← Secret code gate
        ├── AdminPanelScreen.js   ← Admin dashboard
        ├── HomeScreen.js         ← Promo slides, V-Wallet, IST clock
        ├── ScanScreen.js         ← Product list + tap-to-add
        ├── CartScreen.js         ← Cart management
        ├── CheckoutScreen.js     ← Payment, QR exit pass, cash pending
        ├── HistoryScreen.js      ← Full order history with line items
        └── WalletScreen.js       ← V-Coins balance + earning history
```

---

## Quick Start (VS Code + Phone)

### 1. Install prerequisites

- **Node.js** ≥ 18 → https://nodejs.org
- **VS Code** → https://code.visualstudio.com
- **Expo Go** app on your phone (Android or iOS) from the App Store / Play Store

### 2. Open & install

```bash
# Open the project folder in VS Code, then in the terminal:
npm install
```

### 3. Run

```bash
npx expo start
```

A QR code appears in the terminal. Scan it with:
- **Android**: Expo Go app → Scan QR
- **iOS**: Camera app → tap the notification

The app hot-reloads every time you save a file.

---

## Admin Login

On the splash screen tap **"Login as Administrator"** and enter:

```
velocartadmin@2411
```

To change the code, open `src/context/AuthContext.js` and edit line 8:
```js
export const ADMIN_CODE = 'velocartadmin@2411';
```

---

## Build an APK / IPA

### Install EAS CLI
```bash
npm install -g eas-cli
eas login          # Create a free account at expo.dev
eas build:configure
```

### Android APK
```bash
eas build --platform android --profile preview
# Downloads a .apk you can sideload directly on any Android phone
```

### iOS IPA (requires Apple Developer account)
```bash
eas build --platform ios
```

---

## Customise Products

Open `src/data/products.js` and edit the `PRODUCTS` array:

```js
{ id:'11', name:'Your Product', price:99, mrp:120, category:'Snacks', discount:18, restocked:false, barcode:'...' }
```

Edit `PROMO_SLIDES` to change which products appear in the home carousel.

---

## Customise Pricing

In `src/data/products.js`:

```js
export const CONVENIENCE_FEE = 15;   // ₹ flat per order — change here
export const GST_RATE        = 0.05; // 5% — change here
```

V-Coin rate: `src/data/products.js` → `calcVCoins()`:
```js
// ₹100 spent → 10 V-Coins (1 coin per ₹10)
return Math.floor(totalPaid / 100) * 10;
```

---

## Customise Theme / Colours

Open `src/components/theme.js` and change any token:

```js
export const COLORS = {
  primary: '#059669',  // ← change to any hex for a full recolour
  ...
};
```

---

## VS Code Debug (breakpoints)

1. Install the **React Native Tools** extension in VS Code.
2. Run `npx expo start`.
3. Press `Shift+Cmd+P` → **Debug: Attach to React Native** → choose Expo.
4. Set breakpoints in any `.js` file — they hit on the connected device.

---

## Production Notes

- **Passwords**: `AuthContext.js` stores passwords in plain text in `AsyncStorage`. Before going live, replace with a backend API + bcrypt hashing.
- **Social OAuth**: `loginWithSocial()` is mocked. Wire up `expo-auth-session` with real Google/Apple/Facebook OAuth credentials for production.
- **Barcode scanning**: Add `expo-camera` + `expo-barcode-scanner` to `ScanScreen.js` to scan real barcodes — the product list already has `barcode` fields ready.
- **Backend**: All state is local (AsyncStorage). For a real deployment, replace `AuthContext` and `CartContext` API calls with your backend (Node.js/Express, Firebase, Supabase, etc.).
