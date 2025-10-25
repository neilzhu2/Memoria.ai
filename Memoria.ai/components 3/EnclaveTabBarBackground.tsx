import React from 'react';
import {
  View,
  StyleSheet,
  Platform
} from 'react-native';

export function EnclaveTabBarBackground() {
  const tabBarHeight = Platform.select({
    ios: 88,
    default: 80,
  });

  return (
    <View style={[styles.container, { height: tabBarHeight }]}>
      {/* Flat background without decorative elements */}
      <View style={[styles.shadowOverlay, { height: tabBarHeight }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'transparent',
  },
  shadowOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 10,
  },
});