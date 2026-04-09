// src/components/ScreenWrapper.js
// ─────────────────────────────────────────────────────────────────────────────
//  IMPORTANT — FILE NAME MUST BE:  ScreenWrapper.js  (capital S, capital W)
//  Metro's resolver is case-sensitive on all platforms.
//  Any variant (screenwrapper.js, Screenwrapper.js, basescreen.js) will cause
//  "Unable to resolve module '../components/ScreenWrapper'" at runtime.
//  Delete all other versions and keep ONLY this file.
// ─────────────────────────────────────────────────────────────────────────────
import React from 'react';
import { StyleSheet, View, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const ScreenWrapper = ({ children, style }) => {
  return (
    <SafeAreaView style={[styles.container, style]}>
      <View style={styles.innerView}>
        {children}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex:            1,
    backgroundColor: '#fff',
    paddingTop:      Platform.OS === 'android' ? 0 : 0,
  },
  innerView: {
    flex: 1,
  },
});

export default ScreenWrapper;