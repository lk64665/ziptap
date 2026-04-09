// src/navigation/RootNavigator.js  –  ZipTap
import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { NavigationContainer }     from '@react-navigation/native';
import { createStackNavigator }    from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { COLORS }  from '../components/theme';

import SplashScreen      from '../screens/SplashScreen';
import UserAuthScreen    from '../screens/UserAuthScreen';
import SignupScreen      from '../screens/SignupScreen';
import OTPScreen         from '../screens/OTPScreen';
import AdminAuthScreen   from '../screens/AdminAuthScreen';
import AdminPanelScreen  from '../screens/AdminPanelScreen';

import HomeScreen     from '../screens/HomeScreen';
import ScanScreen     from '../screens/ScanScreen';
import CartScreen     from '../screens/CartScreen';
import CheckoutScreen from '../screens/CheckoutScreen';
import HistoryScreen  from '../screens/HistoryScreen';
import WalletScreen   from '../screens/WalletScreen';

const Stack = createStackNavigator();
const Tab   = createBottomTabNavigator();
const NONE  = { headerShown: false };

const TAB_ICONS = {
  Home:'home-outline', Scan:'scan-outline', Cart:'cart-outline',
  Checkout:'gift-outline', History:'document-text-outline', Wallet:'wallet-outline',
};

function MainTabs() {
  const { itemCount } = useCart();
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor:   COLORS.primary,
        tabBarInactiveTintColor: COLORS.muted,
        tabBarStyle: {
          backgroundColor: COLORS.surface,
          borderTopColor:  COLORS.border,
          height: 62, paddingBottom: 8,
        },
        tabBarLabelStyle: { fontSize: 9 },
        tabBarIcon: ({ color }) => (
          <Ionicons name={TAB_ICONS[route.name] || 'ellipse-outline'} size={20} color={color}/>
        ),
        tabBarBadge: route.name === 'Cart' && itemCount > 0 ? itemCount : undefined,
        tabBarBadgeStyle: { backgroundColor:COLORS.primary, fontSize:9, minWidth:16, height:16 },
      })}
    >
      <Tab.Screen name="Home"     component={HomeScreen} />
      <Tab.Screen name="Scan"     component={ScanScreen} />
      <Tab.Screen name="Cart"     component={CartScreen} />
      <Tab.Screen name="Checkout" component={CheckoutScreen} />
      <Tab.Screen name="History"  component={HistoryScreen} />
      <Tab.Screen name="Wallet"   component={WalletScreen} />
    </Tab.Navigator>
  );
}

export default function RootNavigator() {
  const { loading } = useAuth();
  if (loading) {
    return (
      <View style={{ flex:1, alignItems:'center', justifyContent:'center', backgroundColor:COLORS.bg }}>
        <ActivityIndicator size="large" color={COLORS.primary}/>
      </View>
    );
  }
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={NONE} initialRouteName="Splash">
        <Stack.Screen name="Splash"      component={SplashScreen} />
        <Stack.Screen name="UserAuth"    component={UserAuthScreen} />
        <Stack.Screen name="Signup"      component={SignupScreen} />
        <Stack.Screen name="OTP"         component={OTPScreen} />
        <Stack.Screen name="AdminAuth"   component={AdminAuthScreen} />
        <Stack.Screen name="AdminPanel"  component={AdminPanelScreen} />
        <Stack.Screen name="MainApp"     component={MainTabs} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
