/**
 * Audio Visualizer Component
 *
 * Real-time audio visualization optimized for elderly users,
 * providing clear visual feedback during recording with
 * simplified animations and elderly-friendly design.
 */

import React, { useEffect, useRef, useMemo } from 'react';
import {
  View,
  StyleSheet,
  Animated,
  Dimensions,
  ViewStyle,
} from 'react-native';

import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { ElderlyRecordingSettings } from '@/types/recording-flow';

// ========================================
// Types & Interfaces
// ========================================

export interface AudioVisualizerProps {
  // Audio data
  audioLevels?: number[]; // Array of audio levels (0-100)
  currentLevel?: number; // Current audio level (0-100)
  isRecording: boolean;
  isPaused?: boolean;

  // Visualization configuration
  type?: 'bars' | 'waveform' | 'circle' | 'simple';
  barCount?: number;
  showPeaks?: boolean;
  smoothing?: number; // Animation smoothing factor

  // Elderly-specific features
  elderlyMode?: boolean;
  simplifiedView?: boolean;
  highContrast?: boolean;
  largeElements?: boolean;

  // Styling
  width?: number;
  height?: number;
  colors?: {
    active: string;
    inactive: string;
    peak: string;
    background: string;
  };
  style?: ViewStyle;

  // Settings
  settings?: ElderlyRecordingSettings;
}

interface BarData {
  id: number;
  height: Animated.Value;
  peakHeight: Animated.Value;
  lastUpdate: number;
}

// ========================================
// Configuration
// ========================================

const DEFAULT_BAR_COUNT = 20;
const ELDERLY_BAR_COUNT = 10; // Fewer bars for simpler visualization
const ANIMATION_DURATION = 100;
const PEAK_DECAY_DURATION = 2000;
const SMOOTHING_FACTOR = 0.3;

const { width: screenWidth } = Dimensions.get('window');
const DEFAULT_WIDTH = screenWidth * 0.8;
const DEFAULT_HEIGHT = 120;
const ELDERLY_HEIGHT = 80; // Shorter for elderly users

// ========================================
// Main Component
// ========================================

export const AudioVisualizer: React.FC<AudioVisualizerProps> = ({
  audioLevels = [],
  currentLevel = 0,
  isRecording,
  isPaused = false,
  type = 'bars',
  barCount,
  showPeaks = true,
  smoothing = SMOOTHING_FACTOR,
  elderlyMode = true,
  simplifiedView = false,
  highContrast = false,
  largeElements = false,
  width = DEFAULT_WIDTH,
  height,
  colors,
  style,
  settings,
}) => {
  const colorScheme = useColorScheme();

  // ========================================
  // Configuration
  // ========================================

  const config = useMemo(() => {
    const effectiveElderlyMode = elderlyMode || settings?.simplifiedInterface;
    const effectiveBarCount = barCount ||
      (effectiveElderlyMode ? ELDERLY_BAR_COUNT : DEFAULT_BAR_COUNT);
    const effectiveHeight = height ||
      (effectiveElderlyMode ? ELDERLY_HEIGHT : DEFAULT_HEIGHT);

    const defaultColors = Colors[colorScheme ?? 'light'];
    const effectiveColors = colors || {
      active: highContrast ? '#e74c3c' : '#3498db',
      inactive: highContrast ? '#95a5a6' : defaultColors.tabIconDefault,
      peak: '#e74c3c',
      background: defaultColors.background,
    };

    return {
      barCount: effectiveBarCount,
      height: effectiveHeight,
      colors: effectiveColors,
      elderlyMode: effectiveElderlyMode,
      barWidth: Math.max(4, (width - (effectiveBarCount - 1) * 4) / effectiveBarCount),
      barSpacing: effectiveElderlyMode ? 6 : 4,
    };
  }, [
    elderlyMode,
    settings?.simplifiedInterface,
    barCount,
    height,
    colors,
    highContrast,
    colorScheme,
    width,
  ]);

  // ========================================
  // Animation State
  // ========================================

  const barsData = useRef<BarData[]>([]);
  const lastAudioLevels = useRef<number[]>([]);

  // Initialize bars data
  useEffect(() => {
    barsData.current = Array.from({ length: config.barCount }, (_, index) => ({
      id: index,
      height: new Animated.Value(0),
      peakHeight: new Animated.Value(0),
      lastUpdate: 0,
    }));
  }, [config.barCount]);

  // ========================================
  // Audio Level Processing
  // ========================================

  const processAudioLevels = useMemo(() => {
    if (audioLevels.length > 0) {
      // Use provided audio levels
      return audioLevels.slice(0, config.barCount);
    }

    // Generate levels based on current level
    if (currentLevel > 0 && isRecording && !isPaused) {
      return Array.from({ length: config.barCount }, (_, index) => {
        // Create a natural distribution around the center
        const centerIndex = config.barCount / 2;
        const distance = Math.abs(index - centerIndex) / centerIndex;
        const variance = (Math.random() - 0.5) * 0.3; // Add some randomness
        const level = Math.max(0, currentLevel * (1 - distance * 0.5) + variance * currentLevel);
        return Math.min(100, Math.max(0, level));
      });
    }

    // Silent state
    return Array.from({ length: config.barCount }, () => 0);
  }, [audioLevels, currentLevel, isRecording, isPaused, config.barCount]);

  // ========================================
  // Animation Updates
  // ========================================

  useEffect(() => {
    const currentLevels = processAudioLevels;
    const now = Date.now();

    barsData.current.forEach((bar, index) => {
      const targetLevel = currentLevels[index] || 0;
      const lastLevel = lastAudioLevels.current[index] || 0;

      // Apply smoothing for elderly users (less jarring animations)
      const smoothedLevel = config.elderlyMode
        ? lastLevel + (targetLevel - lastLevel) * smoothing
        : targetLevel;

      const targetHeight = (smoothedLevel / 100) * config.height;

      // Animate bar height
      Animated.timing(bar.height, {
        toValue: targetHeight,
        duration: config.elderlyMode ? ANIMATION_DURATION * 1.5 : ANIMATION_DURATION,
        useNativeDriver: false,
      }).start();

      // Handle peak indicators
      if (showPeaks && targetHeight > 0) {
        const currentPeakHeight = (bar.peakHeight as any)._value;
        if (targetHeight > currentPeakHeight || now - bar.lastUpdate > PEAK_DECAY_DURATION) {
          bar.peakHeight.setValue(targetHeight);
          bar.lastUpdate = now;

          // Decay peak after a delay
          setTimeout(() => {
            Animated.timing(bar.peakHeight, {
              toValue: 0,
              duration: PEAK_DECAY_DURATION,
              useNativeDriver: false,
            }).start();
          }, 500);
        }
      }
    });

    lastAudioLevels.current = currentLevels;
  }, [processAudioLevels, config, smoothing, showPeaks]);

  // ========================================
  // Render Methods
  // ========================================

  const renderBars = () => {
    if (type === 'simple' || simplifiedView) {
      return renderSimpleBars();
    }

    return barsData.current.map((bar, index) => (
      <View key={bar.id} style={styles.barContainer}>
        {/* Main bar */}
        <Animated.View
          style={[
            styles.bar,
            {
              width: config.barWidth,
              height: bar.height,
              backgroundColor: isRecording && !isPaused
                ? config.colors.active
                : config.colors.inactive,
              borderRadius: config.elderlyMode ? 3 : 2,
            },
          ]}
        />

        {/* Peak indicator */}
        {showPeaks && !simplifiedView && (
          <Animated.View
            style={[
              styles.peak,
              {
                width: config.barWidth,
                height: 2,
                backgroundColor: config.colors.peak,
                bottom: bar.peakHeight,
                borderRadius: 1,
              },
            ]}
          />
        )}
      </View>
    ));
  };

  const renderSimpleBars = () => {
    // Simplified version with fewer, larger bars for elderly users
    const simplifiedBarCount = Math.min(5, config.barCount);
    const simplifiedBarWidth = (width - (simplifiedBarCount - 1) * 8) / simplifiedBarCount;

    return Array.from({ length: simplifiedBarCount }, (_, index) => {
      const level = processAudioLevels[Math.floor(index * config.barCount / simplifiedBarCount)] || 0;
      const barHeight = (level / 100) * config.height;

      return (
        <View key={index} style={[styles.barContainer, { marginHorizontal: 4 }]}>
          <View
            style={[
              styles.simpleBar,
              {
                width: simplifiedBarWidth,
                height: Math.max(4, barHeight),
                backgroundColor: isRecording && !isPaused
                  ? config.colors.active
                  : config.colors.inactive,
                borderRadius: 4,
              },
            ]}
          />
        </View>
      );
    });
  };

  const renderCircleVisualizer = () => {
    const radius = Math.min(width, config.height) / 2 - 20;
    const centerX = width / 2;
    const centerY = config.height / 2;

    return (
      <View style={[styles.circleContainer, { width, height: config.height }]}>
        {/* Outer circle */}
        <View
          style={[
            styles.outerCircle,
            {
              width: radius * 2,
              height: radius * 2,
              borderRadius: radius,
              borderColor: config.colors.inactive,
              borderWidth: config.elderlyMode ? 3 : 2,
            },
          ]}
        />

        {/* Inner circle that pulses with audio */}
        <Animated.View
          style={[
            styles.innerCircle,
            {
              width: radius,
              height: radius,
              borderRadius: radius / 2,
              backgroundColor: isRecording && !isPaused
                ? config.colors.active
                : config.colors.inactive,
              transform: [{
                scale: isRecording && !isPaused
                  ? 1 + (currentLevel / 100) * 0.5
                  : 1
              }],
            },
          ]}
        />
      </View>
    );
  };

  // ========================================
  // Main Render
  // ========================================

  const renderContent = () => {
    switch (type) {
      case 'circle':
        return renderCircleVisualizer();
      case 'simple':
        return (
          <View style={[styles.barsContainer, { width, height: config.height }]}>
            {renderSimpleBars()}
          </View>
        );
      case 'bars':
      case 'waveform':
      default:
        return (
          <View style={[styles.barsContainer, { width, height: config.height }]}>
            {renderBars()}
          </View>
        );
    }
  };

  return (
    <View
      testID="audio-visualizer-container"
      style={[
        styles.container,
        {
          width,
          height: config.height,
          backgroundColor: config.colors.background,
        },
        config.elderlyMode && styles.elderlyContainer,
        style,
      ]}
    >
      {renderContent()}

      {/* Status indicator for elderly users */}
      {config.elderlyMode && (
        <View
          testID="status-indicator"
          style={[
            styles.statusIndicator,
            {
              backgroundColor: isPaused
                ? '#f39c12'
                : isRecording
                ? config.colors.active
                : config.colors.inactive,
            },
          ]}
        />
      )}
    </View>
  );
};

// ========================================
// Styles
// ========================================

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  elderlyContainer: {
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
  },
  barsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  barContainer: {
    position: 'relative',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  bar: {
    minHeight: 2,
    alignSelf: 'flex-end',
  },
  simpleBar: {
    minHeight: 4,
    alignSelf: 'flex-end',
  },
  peak: {
    position: 'absolute',
  },
  circleContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  outerCircle: {
    position: 'absolute',
  },
  innerCircle: {
    position: 'absolute',
  },
  statusIndicator: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});

export default AudioVisualizer;