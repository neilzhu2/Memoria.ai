/**
 * RealtimeWaveform Component for Memoria.ai
 * High-performance real-time audio waveform visualization optimized for elderly users
 * Provides smooth 60fps animations with memory-efficient rendering
 */

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  View,
  StyleSheet,
  Animated,
  Dimensions,
  PixelRatio,
} from 'react-native';
import { Canvas, Line, Path, Skia, useCanvasRef, LinearGradient, vec } from '@shopify/react-native-skia';

import { useSettingsStore } from '../stores';

interface WaveformDataPoint {
  amplitude: number;
  frequency: number;
  timestamp: number;
  isActive: boolean;
}

interface RealtimeWaveformProps {
  audioLevel: number;
  isRecording: boolean;
  isPaused?: boolean;
  width?: number;
  height?: number;
  barCount?: number;
  smoothing?: number;
  showFrequencyBands?: boolean;
  responseTime?: number; // ms
  style?: any;
}

const { width: screenWidth } = Dimensions.get('window');
const DEFAULT_WIDTH = screenWidth - 40;
const DEFAULT_HEIGHT = 120;
const DEFAULT_BAR_COUNT = 50;
const DEFAULT_SMOOTHING = 0.7;
const TARGET_FPS = 60;
const FRAME_TIME = 1000 / TARGET_FPS;

const RealtimeWaveform: React.FC<RealtimeWaveformProps> = ({
  audioLevel,
  isRecording,
  isPaused = false,
  width = DEFAULT_WIDTH,
  height = DEFAULT_HEIGHT,
  barCount = DEFAULT_BAR_COUNT,
  smoothing = DEFAULT_SMOOTHING,
  showFrequencyBands = true,
  responseTime = 100,
  style,
}) => {
  const { shouldUseHighContrast } = useSettingsStore();

  // State for waveform data
  const [waveformData, setWaveformData] = useState<WaveformDataPoint[]>([]);
  const [isAnimating, setIsAnimating] = useState(false);

  // Animation and performance refs
  const animationRef = useRef<number>();
  const lastFrameTime = useRef(0);
  const frameCount = useRef(0);
  const performanceMonitor = useRef({ avgFrameTime: 0, droppedFrames: 0 });

  // Waveform calculation refs
  const smoothedLevels = useRef<number[]>([]);
  const frequencyData = useRef<number[]>([]);
  const previousAudioLevel = useRef(0);

  // Canvas and rendering refs
  const canvasRef = useCanvasRef();
  const gradientColors = useRef<string[]>([]);

  // Configuration
  const highContrast = shouldUseHighContrast();
  const pixelRatio = PixelRatio.get();
  const scaledWidth = width * pixelRatio;
  const scaledHeight = height * pixelRatio;

  // Initialize waveform data
  useEffect(() => {
    const initialData: WaveformDataPoint[] = Array.from({ length: barCount }, (_, index) => ({
      amplitude: 0.1,
      frequency: 0,
      timestamp: Date.now() - (barCount - index) * FRAME_TIME,
      isActive: false,
    }));

    setWaveformData(initialData);
    smoothedLevels.current = new Array(barCount).fill(0.1);
    frequencyData.current = new Array(8).fill(0); // 8 frequency bands

    // Initialize gradient colors
    updateGradientColors();
  }, [barCount, highContrast]);

  // Update gradient colors based on theme and recording state
  const updateGradientColors = useCallback(() => {
    if (highContrast) {
      gradientColors.current = [
        '#666666', // Inactive
        '#ffffff', // Active
        '#ffff00', // Warning
        '#ff0000', // Error
      ];
    } else {
      gradientColors.current = [
        '#e5e7eb', // Inactive - light gray
        '#10b981', // Good level - green
        '#3b82f6', // Medium level - blue
        '#f59e0b', // High level - amber
        '#ef4444', // Too high - red
      ];
    }
  }, [highContrast]);

  // Performance monitoring
  const monitorPerformance = useCallback((frameTime: number) => {
    frameCount.current++;
    const timeDiff = frameTime - lastFrameTime.current;

    if (timeDiff > FRAME_TIME * 1.5) {
      performanceMonitor.current.droppedFrames++;
    }

    // Calculate rolling average frame time
    const alpha = 0.1;
    performanceMonitor.current.avgFrameTime =
      performanceMonitor.current.avgFrameTime * (1 - alpha) + timeDiff * alpha;

    lastFrameTime.current = frameTime;

    // Log performance issues for debugging
    if (frameCount.current % 300 === 0) { // Every 5 seconds at 60fps
      const avgFps = 1000 / performanceMonitor.current.avgFrameTime;
      if (avgFps < 45) {
        console.warn(`Waveform performance warning: ${avgFps.toFixed(1)} fps`);
      }
    }
  }, []);

  // Generate realistic audio frequency data simulation
  const generateFrequencyData = useCallback((level: number): number[] => {
    const bands = 8;
    const frequencies = new Array(bands);

    // Simulate frequency distribution based on audio level
    for (let i = 0; i < bands; i++) {
      const bandBase = level * (1 - i / bands); // Higher frequencies have lower amplitude
      const variation = (Math.random() - 0.5) * 0.3 * level;
      frequencies[i] = Math.max(0, Math.min(1, bandBase + variation));
    }

    return frequencies;
  }, []);

  // Calculate waveform bar properties
  const calculateBarProperties = useCallback((
    index: number,
    level: number,
    frequencies: number[]
  ): WaveformDataPoint => {
    const position = index / (barCount - 1);

    // Apply frequency band influence if enabled
    let amplitude = level;
    if (showFrequencyBands && frequencies.length > 0) {
      const bandIndex = Math.floor(position * frequencies.length);
      const bandLevel = frequencies[Math.min(bandIndex, frequencies.length - 1)];
      amplitude = (amplitude + bandLevel) / 2; // Blend with frequency data
    }

    // Apply smoothing
    const previousAmplitude = smoothedLevels.current[index] || 0.1;
    amplitude = previousAmplitude * smoothing + amplitude * (1 - smoothing);
    smoothedLevels.current[index] = amplitude;

    // Ensure minimum height for visibility
    amplitude = Math.max(0.1, amplitude);

    return {
      amplitude,
      frequency: frequencies[Math.floor(position * frequencies.length)] || 0,
      timestamp: Date.now(),
      isActive: isRecording && !isPaused,
    };
  }, [barCount, showFrequencyBands, smoothing, isRecording, isPaused]);

  // Get color for waveform bar based on amplitude and state
  const getBarColor = useCallback((amplitude: number, isActive: boolean): string => {
    if (!isActive) {
      return gradientColors.current[0]; // Inactive color
    }

    if (amplitude < 0.2) {
      return gradientColors.current[1]; // Good level
    } else if (amplitude < 0.4) {
      return gradientColors.current[2]; // Medium level
    } else if (amplitude < 0.7) {
      return gradientColors.current[3]; // High level
    } else {
      return gradientColors.current[4]; // Too high
    }
  }, []);

  // Animation loop for real-time updates
  const animate = useCallback((timestamp: number) => {
    monitorPerformance(timestamp);

    // Throttle to target FPS
    if (timestamp - lastFrameTime.current < FRAME_TIME) {
      animationRef.current = requestAnimationFrame(animate);
      return;
    }

    // Generate new frequency data
    const newFrequencies = generateFrequencyData(audioLevel);
    frequencyData.current = newFrequencies;

    // Update waveform data
    setWaveformData(prevData => {
      const newData = [...prevData];

      // Shift existing data left
      for (let i = 0; i < barCount - 1; i++) {
        newData[i] = newData[i + 1];
      }

      // Add new data point at the end
      newData[barCount - 1] = calculateBarProperties(
        barCount - 1,
        audioLevel,
        newFrequencies
      );

      return newData;
    });

    previousAudioLevel.current = audioLevel;

    if (isAnimating) {
      animationRef.current = requestAnimationFrame(animate);
    }
  }, [
    audioLevel,
    barCount,
    isAnimating,
    monitorPerformance,
    generateFrequencyData,
    calculateBarProperties,
  ]);

  // Start/stop animation based on recording state
  useEffect(() => {
    updateGradientColors();

    if (isRecording && !isPaused) {
      setIsAnimating(true);
    } else {
      setIsAnimating(false);

      // Gradually fade out when not recording
      if (!isRecording) {
        const fadeOut = () => {
          setWaveformData(prevData =>
            prevData.map(point => ({
              ...point,
              amplitude: Math.max(0.1, point.amplitude * 0.95),
              isActive: false,
            }))
          );
        };

        const fadeInterval = setInterval(fadeOut, 50);
        setTimeout(() => clearInterval(fadeInterval), 1000);
      }
    }
  }, [isRecording, isPaused, updateGradientColors]);

  // Start/stop animation loop
  useEffect(() => {
    if (isAnimating) {
      animationRef.current = requestAnimationFrame(animate);
    } else {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isAnimating, animate]);

  // Memoized bar calculations for performance
  const barElements = useMemo(() => {
    const barWidth = width / barCount;
    const barSpacing = barWidth * 0.2;
    const effectiveBarWidth = barWidth - barSpacing;

    return waveformData.map((point, index) => {
      const x = index * barWidth + barSpacing / 2;
      const barHeight = Math.max(2, point.amplitude * height);
      const y = height - barHeight;

      const color = getBarColor(point.amplitude, point.isActive);

      return {
        x,
        y,
        width: effectiveBarWidth,
        height: barHeight,
        color,
        opacity: point.isActive ? 1 : 0.6,
      };
    });
  }, [waveformData, width, height, barCount, getBarColor]);

  // Create Skia path for smooth waveform
  const waveformPath = useMemo(() => {
    const path = Skia.Path.Make();

    if (waveformData.length < 2) return path;

    const stepX = width / (waveformData.length - 1);

    // Start path
    const firstPoint = waveformData[0];
    const firstY = height - (firstPoint.amplitude * height);
    path.moveTo(0, firstY);

    // Create smooth curve through all points
    for (let i = 1; i < waveformData.length; i++) {
      const point = waveformData[i];
      const x = i * stepX;
      const y = height - (point.amplitude * height);

      if (i === 1) {
        path.lineTo(x, y);
      } else {
        // Use quadratic curves for smoothness
        const prevPoint = waveformData[i - 1];
        const prevX = (i - 1) * stepX;
        const prevY = height - (prevPoint.amplitude * height);

        const cpX = (prevX + x) / 2;
        const cpY = (prevY + y) / 2;

        path.quadTo(cpX, cpY, x, y);
      }
    }

    return path;
  }, [waveformData, width, height]);

  const styles = StyleSheet.create({
    container: {
      width,
      height,
      backgroundColor: highContrast ? '#1a1a1a' : '#f8fafc',
      borderRadius: 12,
      overflow: 'hidden',
      borderWidth: 2,
      borderColor: isRecording
        ? (isPaused ? '#f59e0b' : '#10b981')
        : (highContrast ? '#333333' : '#e5e7eb'),
    },
    canvas: {
      flex: 1,
    },
    overlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: isPaused ? 'rgba(245, 158, 11, 0.1)' : 'transparent',
    },
  });

  return (
    <View
      style={[styles.container, style]}
      accessible={true}
      accessibilityLabel={`Audio waveform: ${
        isRecording
          ? (isPaused ? 'paused' : 'recording')
          : 'ready'
      }`}
      accessibilityRole="image"
    >
      <Canvas ref={canvasRef} style={styles.canvas}>
        {/* Render individual bars */}
        {barElements.map((bar, index) => (
          <React.Fragment key={index}>
            <Path
              path={Skia.Path.MakeFromOp(
                Skia.Path.MakeFromRect(Skia.XYWHRect(bar.x, bar.y, bar.width, bar.height)),
                Skia.Path.Make(),
                Skia.PathOp.Union
              )!}
              color={bar.color}
              opacity={bar.opacity}
            />
          </React.Fragment>
        ))}

        {/* Render smooth curve overlay */}
        <Path
          path={waveformPath}
          style="stroke"
          strokeWidth={2}
          color={isRecording ? (isPaused ? '#f59e0b' : '#10b981') : '#9ca3af'}
          opacity={0.7}
        />

        {/* Background gradient */}
        <LinearGradient
          start={vec(0, 0)}
          end={vec(0, height)}
          colors={[
            highContrast ? '#2a2a2a' : '#ffffff',
            highContrast ? '#1a1a1a' : '#f8fafc',
          ]}
          positions={[0, 1]}
        />
      </Canvas>

      {/* Pause overlay */}
      <View style={styles.overlay} />
    </View>
  );
};

export default RealtimeWaveform;