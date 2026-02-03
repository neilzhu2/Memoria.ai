import React from 'react';
import {
  StyleSheet,
  View,
  Dimensions,
  Animated,
} from 'react-native';

const { width: screenWidth } = Dimensions.get('window');

interface SimpleWaveformProps {
  data: number[];
  isActive: boolean;
  color?: string;
  height?: number;
  maxBars?: number;
}

export function SimpleWaveform({
  data,
  isActive,
  color = '#3498db',
  height = 80,
  maxBars = 40
}: SimpleWaveformProps) {
  const waveformWidth = screenWidth - 48; // 24px padding on each side
  const barWidth = Math.max(2, waveformWidth / maxBars - 2);
  const barSpacing = 2;

  // Create bars from data, ensuring we don't exceed maxBars
  const bars = data.slice(-maxBars).map((value, index) => {
    // Normalize the value to fit within the height
    const normalizedHeight = Math.max(4, (value / 100) * height);
    const opacity = isActive ? 1 : 0.5;

    return (
      <Animated.View
        key={index}
        style={[
          styles.bar,
          {
            width: barWidth,
            height: normalizedHeight,
            backgroundColor: color,
            opacity,
            marginRight: index < data.length - 1 ? barSpacing : 0,
          },
        ]}
      />
    );
  });

  // Fill remaining space with placeholder bars if needed
  const remainingBars = Math.max(0, maxBars - data.length);
  const placeholderBars = Array(remainingBars).fill(0).map((_, index) => (
    <View
      key={`placeholder-${index}`}
      style={[
        styles.bar,
        styles.placeholderBar,
        {
          width: barWidth,
          height: 4,
          backgroundColor: color,
          opacity: 0.2,
          marginRight: index < remainingBars - 1 ? barSpacing : 0,
        },
      ]}
    />
  ));

  return (
    <View style={[styles.container, { height }]}>
      <View style={styles.waveform}>
        {placeholderBars}
        {bars}
      </View>

      {/* Center line */}
      <View
        style={[
          styles.centerLine,
          {
            backgroundColor: color,
            opacity: isActive ? 0.3 : 0.1
          }
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 32,
    width: '100%',
    position: 'relative',
  },
  waveform: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
  },
  bar: {
    borderRadius: 1,
    minHeight: 4,
  },
  placeholderBar: {
    // Placeholder bars have minimal styling
  },
  centerLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: StyleSheet.hairlineWidth,
    top: '50%',
    marginTop: -StyleSheet.hairlineWidth / 2,
  },
});