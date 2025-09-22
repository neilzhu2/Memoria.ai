import React from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  Platform
} from 'react-native';
import Svg, { Path } from 'react-native-svg';

const { width } = Dimensions.get('window');

export function EnclaveTabBarBackground() {
  const tabBarHeight = Platform.select({
    ios: 88,
    default: 80,
  });

  // Create SVG path for curved enclave in the center
  const enclaveWidth = 120;
  const enclaveDepth = 35;
  const centerX = width / 2;

  const pathData = `
    M 0 0
    L ${centerX - enclaveWidth / 2} 0
    Q ${centerX - enclaveWidth / 2} ${enclaveDepth} ${centerX - enclaveWidth / 4} ${enclaveDepth}
    Q ${centerX} ${enclaveDepth + 10} ${centerX + enclaveWidth / 4} ${enclaveDepth}
    Q ${centerX + enclaveWidth / 2} ${enclaveDepth} ${centerX + enclaveWidth / 2} 0
    L ${width} 0
    L ${width} ${tabBarHeight}
    L 0 ${tabBarHeight}
    Z
  `;

  return (
    <View style={[styles.container, { height: tabBarHeight }]}>
      <Svg
        width={width}
        height={tabBarHeight}
        style={StyleSheet.absoluteFill}
      >
        <Path
          d={pathData}
          fill="white"
          stroke="none"
        />
      </Svg>

      {/* Additional shadow layer */}
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