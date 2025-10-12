/**
 * Test Utilities and Helpers for Recording Flow Components
 *
 * Provides specialized testing utilities for elderly-friendly recording features
 * including accessibility testing, performance monitoring, and mock data generation.
 */

import { Animated } from 'react-native';
import * as Haptics from 'expo-haptics';
import * as Speech from 'expo-speech';

// ========================================
// Type Definitions
// ========================================

export interface RecordingTestState {
  isRecording: boolean;
  isPaused: boolean;
  duration: number;
  audioLevel: number;
  phase: 'idle' | 'preparation' | 'recording' | 'paused' | 'completion' | 'processing';
}

export interface ElderlyTestSettings {
  elderlyMode: boolean;
  voiceGuidanceEnabled: boolean;
  hapticFeedbackLevel: 'none' | 'light' | 'medium' | 'heavy';
  simplifiedInterface: boolean;
  highContrast: boolean;
  largeText: boolean;
}

export interface AccessibilityTestResult {
  touchTargetSize: { width: number; height: number; meetsRequirement: boolean };
  contrastRatio: { ratio: number; meetsAAA: boolean; meetsAA: boolean };
  screenReaderCompatible: boolean;
  voiceControlCompatible: boolean;
  keyboardNavigable: boolean;
}

export interface PerformanceTestResult {
  renderTime: number;
  animationFrameRate: number;
  memoryUsage: number;
  meetsPerformanceStandards: boolean;
}

// ========================================
// Mock Data Generators
// ========================================

export class RecordingTestDataGenerator {
  /**
   * Generate realistic audio level data for testing
   */
  static generateAudioLevels(
    count: number = 20,
    pattern: 'silent' | 'low' | 'medium' | 'high' | 'variable' = 'variable'
  ): number[] {
    const levels: number[] = [];

    for (let i = 0; i < count; i++) {
      let level: number;

      switch (pattern) {
        case 'silent':
          level = Math.random() * 5; // 0-5%
          break;
        case 'low':
          level = 10 + Math.random() * 20; // 10-30%
          break;
        case 'medium':
          level = 30 + Math.random() * 40; // 30-70%
          break;
        case 'high':
          level = 70 + Math.random() * 30; // 70-100%
          break;
        case 'variable':
        default:
          // Natural distribution with some randomness
          const base = 50;
          const variance = (Math.random() - 0.5) * 60;
          level = Math.max(0, Math.min(100, base + variance));
          break;
      }

      levels.push(Math.round(level));
    }

    return levels;
  }

  /**
   * Generate realistic recording state progression
   */
  static generateRecordingStateProgression(durationSeconds: number = 60): RecordingTestState[] {
    const states: RecordingTestState[] = [];
    const stepSize = 0.5; // Half-second intervals
    const totalSteps = Math.floor(durationSeconds / stepSize);

    for (let i = 0; i <= totalSteps; i++) {
      const currentTime = i * stepSize;

      let phase: RecordingTestState['phase'] = 'recording';
      let isRecording = true;
      let isPaused = false;
      let audioLevel = this.generateRealisticAudioLevel(currentTime, durationSeconds);

      // Add some pauses for realistic testing
      if (currentTime > 10 && currentTime < 15) {
        phase = 'paused';
        isRecording = true;
        isPaused = true;
        audioLevel = 0;
      }

      states.push({
        isRecording,
        isPaused,
        duration: Math.floor(currentTime),
        audioLevel,
        phase,
      });
    }

    return states;
  }

  private static generateRealisticAudioLevel(currentTime: number, totalDuration: number): number {
    // Simulate natural speech patterns
    const baseLevel = 40;
    const speechPattern = Math.sin(currentTime * 0.5) * 20; // Slow speech rhythm
    const quickVariation = Math.sin(currentTime * 5) * 10; // Quick volume changes
    const randomNoise = (Math.random() - 0.5) * 5; // Small random variations

    // Gradual fade at the end
    const fadeMultiplier = currentTime > totalDuration * 0.9
      ? 1 - ((currentTime - totalDuration * 0.9) / (totalDuration * 0.1))
      : 1;

    const level = (baseLevel + speechPattern + quickVariation + randomNoise) * fadeMultiplier;
    return Math.max(0, Math.min(100, Math.round(level)));
  }

  /**
   * Generate test topics for recording
   */
  static generateTestTopics(): string[] {
    return [
      'My childhood memories',
      'Meeting your grandfather',
      'Our first home together',
      'Family traditions at Christmas',
      'The story of how I learned to cook',
      'My proudest moments as a parent',
      'Adventures from my youth',
      'Lessons I\'ve learned in life',
      'Funny family stories',
      'My hopes for future generations',
    ];
  }

  /**
   * Generate elderly-friendly test settings
   */
  static generateElderlySettings(customizations: Partial<ElderlyTestSettings> = {}): ElderlyTestSettings {
    return {
      elderlyMode: true,
      voiceGuidanceEnabled: true,
      hapticFeedbackLevel: 'medium',
      simplifiedInterface: true,
      highContrast: false,
      largeText: true,
      ...customizations,
    };
  }
}

// ========================================
// Accessibility Testing Utilities
// ========================================

export class AccessibilityTestUtils {
  /**
   * Check if touch target meets elderly-friendly size requirements
   */
  static checkTouchTargetSize(element: any): AccessibilityTestResult['touchTargetSize'] {
    const style = element.props.style || {};
    const width = style.width || style.minWidth || 0;
    const height = style.height || style.minHeight || 0;

    // Elderly-friendly minimum: 80px (stricter than WCAG 44px)
    const elderlyMinimum = 80;
    const standardMinimum = 44;

    return {
      width,
      height,
      meetsRequirement: width >= elderlyMinimum && height >= elderlyMinimum,
    };
  }

  /**
   * Check color contrast ratio for elderly users
   */
  static checkContrastRatio(
    backgroundColor: string,
    textColor: string
  ): AccessibilityTestResult['contrastRatio'] {
    // Simplified contrast calculation for testing
    // In production, would use proper color parsing and luminance calculation
    const getColorBrightness = (color: string): number => {
      // Simple brightness calculation based on color string
      if (color.includes('#fff') || color.includes('white')) return 255;
      if (color.includes('#000') || color.includes('black')) return 0;
      if (color.includes('#f') || color.includes('light')) return 200;
      if (color.includes('#2') || color.includes('dark')) return 50;
      return 128; // Default mid-range
    };

    const bgBrightness = getColorBrightness(backgroundColor);
    const textBrightness = getColorBrightness(textColor);

    const ratio = Math.abs(bgBrightness - textBrightness) / 255 * 21; // Approximate ratio

    return {
      ratio,
      meetsAA: ratio >= 4.5, // WCAG AA standard
      meetsAAA: ratio >= 7, // WCAG AAA standard (preferred for elderly)
    };
  }

  /**
   * Check screen reader compatibility
   */
  static checkScreenReaderCompatibility(element: any): boolean {
    const props = element.props || {};

    return !!(
      props.accessibilityLabel ||
      props.accessibilityHint ||
      props.accessibilityRole ||
      (props.accessible !== false && props.children)
    );
  }

  /**
   * Check voice control compatibility
   */
  static checkVoiceControlCompatibility(element: any): boolean {
    const props = element.props || {};
    const label = props.accessibilityLabel || '';

    // Voice control works best with simple, clear labels
    return !!(
      label &&
      label.length > 0 &&
      label.length < 50 && // Not too long
      !/[^\w\s]/.test(label) && // No special characters
      !label.includes('🎙️') && // No emojis
      !label.includes('🔴')
    );
  }

  /**
   * Comprehensive accessibility test
   */
  static testAccessibility(element: any): AccessibilityTestResult {
    const style = element.props?.style || {};
    const backgroundColor = style.backgroundColor || '#ffffff';
    const textColor = style.color || '#000000';

    return {
      touchTargetSize: this.checkTouchTargetSize(element),
      contrastRatio: this.checkContrastRatio(backgroundColor, textColor),
      screenReaderCompatible: this.checkScreenReaderCompatibility(element),
      voiceControlCompatible: this.checkVoiceControlCompatibility(element),
      keyboardNavigable: !(element.props?.accessible === false),
    };
  }
}

// ========================================
// Performance Testing Utilities
// ========================================

export class PerformanceTestUtils {
  /**
   * Measure component render time
   */
  static measureRenderTime(renderFn: () => void): number {
    const startTime = performance.now();
    renderFn();
    const endTime = performance.now();
    return endTime - startTime;
  }

  /**
   * Simulate high-frequency updates (like audio levels)
   */
  static simulateHighFrequencyUpdates(
    component: any,
    updateFn: (iteration: number) => void,
    iterations: number = 100
  ): PerformanceTestResult {
    const startTime = performance.now();

    for (let i = 0; i < iterations; i++) {
      updateFn(i);
    }

    const endTime = performance.now();
    const totalTime = endTime - startTime;
    const avgTimePerUpdate = totalTime / iterations;

    // Calculate approximate frame rate (60fps = 16.67ms per frame)
    const targetFrameTime = 16.67;
    const approximateFrameRate = targetFrameTime / avgTimePerUpdate * 60;

    return {
      renderTime: totalTime,
      animationFrameRate: Math.min(60, Math.max(0, approximateFrameRate)),
      memoryUsage: 0, // Would require actual memory measurement
      meetsPerformanceStandards: avgTimePerUpdate < 10, // Less than 10ms per update
    };
  }

  /**
   * Test animation performance
   */
  static testAnimationPerformance(animationFn: () => void): boolean {
    const startTime = performance.now();

    // Simulate multiple animation frames
    for (let i = 0; i < 60; i++) { // 60 frames
      animationFn();
    }

    const endTime = performance.now();
    const totalTime = endTime - startTime;

    // Should complete 60 frames in under 1 second for 60fps
    return totalTime < 1000;
  }
}

// ========================================
// Mock Setup Utilities
// ========================================

export class MockSetupUtils {
  /**
   * Setup comprehensive mocks for recording flow tests
   */
  static setupRecordingFlowMocks() {
    // Mock Haptics
    const mockHaptics = {
      impactAsync: jest.fn(() => Promise.resolve()),
      ImpactFeedbackStyle: {
        Light: 'light',
        Medium: 'medium',
        Heavy: 'heavy',
      },
    };

    // Mock Speech
    const mockSpeech = {
      speak: jest.fn(() => Promise.resolve()),
      stop: jest.fn(() => Promise.resolve()),
      isSpeakingAsync: jest.fn(() => Promise.resolve(false)),
    };

    // Mock Animated API
    const mockAnimated = {
      timing: jest.fn(() => ({
        start: jest.fn(),
        stop: jest.fn(),
      })),
      loop: jest.fn(() => ({
        start: jest.fn(),
        stop: jest.fn(),
      })),
      sequence: jest.fn(() => ({
        start: jest.fn(),
        stop: jest.fn(),
      })),
      spring: jest.fn(() => ({
        start: jest.fn(),
        stop: jest.fn(),
      })),
      Value: jest.fn(() => ({
        setValue: jest.fn(),
        addListener: jest.fn(),
        removeListener: jest.fn(),
        interpolate: jest.fn(() => ({
          setValue: jest.fn(),
        })),
      })),
    };

    return {
      haptics: mockHaptics,
      speech: mockSpeech,
      animated: mockAnimated,
    };
  }

  /**
   * Setup audio store mock with realistic behavior
   */
  static setupAudioStoreMock() {
    const audioStoreMock = {
      isRecording: false,
      currentRecording: null,
      recordingDuration: 0,
      recordingStartTime: null,
      permissions: {
        microphone: 'granted',
        mediaLibrary: 'granted',
      },
      settings: {
        defaultQuality: 'medium',
        maxRecordingDuration: 600,
        autoStopEnabled: true,
        hapticFeedbackEnabled: true,
      },
      playbackState: {
        isPlaying: false,
        isPaused: false,
        currentTime: 0,
        duration: 0,
        volume: 0.8,
        playbackRate: 1.0,
        isLoading: false,
      },
      // Mock functions
      startRecording: jest.fn(() => Promise.resolve({
        id: 'mock-recording-id',
        filePath: 'mock://audio/recording.m4a',
        duration: 0,
      })),
      stopRecording: jest.fn(() => Promise.resolve({
        id: 'mock-recording-id',
        filePath: 'mock://audio/recording.m4a',
        duration: 5,
      })),
      pauseRecording: jest.fn(() => Promise.resolve()),
      resumeRecording: jest.fn(() => Promise.resolve()),
      cancelRecording: jest.fn(),
      requestMicrophonePermission: jest.fn(() => Promise.resolve(true)),
      formatDuration: jest.fn((seconds) =>
        `${Math.floor(seconds / 60)}:${(seconds % 60).toString().padStart(2, '0')}`
      ),
      lastError: null,
      clearError: jest.fn(),
      setError: jest.fn(),
    };

    return audioStoreMock;
  }

  /**
   * Reset all mocks to clean state
   */
  static resetAllMocks() {
    jest.clearAllMocks();
    jest.clearAllTimers();
    jest.restoreAllMocks();
  }
}

// ========================================
// Test Assertion Helpers
// ========================================

export class TestAssertionHelpers {
  /**
   * Assert that component meets elderly-friendly design standards
   */
  static assertElderlyFriendlyDesign(element: any) {
    const touchTarget = AccessibilityTestUtils.checkTouchTargetSize(element);
    const accessibility = AccessibilityTestUtils.testAccessibility(element);

    expect(touchTarget.meetsRequirement).toBe(true);
    expect(accessibility.screenReaderCompatible).toBe(true);
    expect(accessibility.contrastRatio.meetsAA).toBe(true);
  }

  /**
   * Assert that animations perform well
   */
  static assertGoodAnimationPerformance(renderTime: number, maxTime: number = 100) {
    expect(renderTime).toBeLessThan(maxTime);
  }

  /**
   * Assert that voice guidance is elderly-appropriate
   */
  static assertElderlyVoiceGuidance(speechCall: any) {
    expect(speechCall).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        rate: expect.any(Number),
      })
    );

    const [message, options] = speechCall.mock.calls[0];
    expect(options.rate).toBeLessThanOrEqual(1.0); // Not too fast
    expect(message.length).toBeGreaterThan(10); // Descriptive enough
    expect(message).not.toMatch(/[^a-zA-Z0-9\s.,!?'"]/); // No complex symbols
  }

  /**
   * Assert that haptic feedback is appropriate
   */
  static assertAppropriatHapticFeedback(hapticsCall: any, expectedLevel: string = 'medium') {
    expect(hapticsCall).toHaveBeenCalledWith(
      expect.stringContaining(expectedLevel)
    );
  }

  /**
   * Assert that component handles errors gracefully
   */
  static assertGracefulErrorHandling(renderFn: () => void) {
    expect(renderFn).not.toThrow();
  }
}

// ========================================
// Integration Test Helpers
// ========================================

export class IntegrationTestHelpers {
  /**
   * Create a complete recording flow test scenario
   */
  static createRecordingFlowScenario(customSteps?: Partial<RecordingTestState[]>) {
    const defaultSteps: RecordingTestState[] = [
      { isRecording: false, isPaused: false, duration: 0, audioLevel: 0, phase: 'idle' },
      { isRecording: false, isPaused: false, duration: 0, audioLevel: 0, phase: 'preparation' },
      { isRecording: true, isPaused: false, duration: 0, audioLevel: 20, phase: 'recording' },
      { isRecording: true, isPaused: false, duration: 5, audioLevel: 50, phase: 'recording' },
      { isRecording: true, isPaused: true, duration: 10, audioLevel: 0, phase: 'paused' },
      { isRecording: true, isPaused: false, duration: 15, audioLevel: 40, phase: 'recording' },
      { isRecording: false, isPaused: false, duration: 20, audioLevel: 0, phase: 'completion' },
    ];

    return customSteps || defaultSteps;
  }

  /**
   * Simulate user interaction patterns for elderly users
   */
  static simulateElderlyUserInteraction(component: any, action: 'tap' | 'longPress' | 'multiTap') {
    const element = component;

    switch (action) {
      case 'tap':
        // Single deliberate tap
        setTimeout(() => {
          element.fireEvent.press();
        }, 200); // Slight delay to simulate careful interaction
        break;

      case 'longPress':
        // Longer hold time for elderly users
        setTimeout(() => {
          element.fireEvent(element, 'pressIn');
          setTimeout(() => {
            element.fireEvent(element, 'longPress');
            element.fireEvent(element, 'pressOut');
          }, 1000); // Longer hold
        }, 200);
        break;

      case 'multiTap':
        // Multiple accidental taps (common with elderly users)
        setTimeout(() => {
          element.fireEvent.press();
          setTimeout(() => element.fireEvent.press(), 100);
          setTimeout(() => element.fireEvent.press(), 200);
        }, 200);
        break;
    }
  }
}

export default {
  RecordingTestDataGenerator,
  AccessibilityTestUtils,
  PerformanceTestUtils,
  MockSetupUtils,
  TestAssertionHelpers,
  IntegrationTestHelpers,
};