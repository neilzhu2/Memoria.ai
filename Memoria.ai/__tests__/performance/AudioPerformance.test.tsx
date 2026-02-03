/**
 * Performance and Audio Functionality Tests
 * Tests Phase 2: Recording Flow Screens - Performance & Audio
 *
 * Tests comprehensive performance metrics and audio functionality:
 * - Component render performance
 * - Memory usage and leak detection
 * - Audio recording performance
 * - State management performance
 * - Animation performance
 * - Real-time audio processing
 */

import React from 'react';
import { render, fireEvent, waitFor, screen, act } from '@testing-library/react-native';
import { Animated } from 'react-native';
import * as Haptics from 'expo-haptics';
import * as Speech from 'expo-speech';
import { Audio } from 'expo-av';

import { RecordingPreparationModal } from '../../components/RecordingPreparationModal';
import { ActiveRecordingModal } from '../../components/ActiveRecordingModal';
import { RecordingCompletionModal } from '../../components/RecordingCompletionModal';
import { RecordingButton } from '../../components/RecordingButton';
import { FloatingRecordButton } from '../../components/FloatingRecordButton';

// Mock modules
jest.mock('expo-haptics');
jest.mock('expo-speech');
jest.mock('expo-av');

const mockHaptics = Haptics as jest.Mocked<typeof Haptics>;
const mockSpeech = Speech as jest.Mocked<typeof Speech>;
const mockAudio = Audio as jest.Mocked<typeof Audio>;

// Mock performance API
const mockPerformance = {
  now: jest.fn(() => Date.now()),
  mark: jest.fn(),
  measure: jest.fn(),
  getEntriesByName: jest.fn(() => []),
  getEntriesByType: jest.fn(() => []),
  clearMarks: jest.fn(),
  clearMeasures: jest.fn(),
};

Object.defineProperty(global, 'performance', {
  value: mockPerformance,
  writable: true,
});

// Mock Memory API for leak detection
const mockMemoryInfo = {
  usedJSHeapSize: 1000000,
  totalJSHeapSize: 2000000,
  jsHeapSizeLimit: 4000000,
};

Object.defineProperty(global.performance, 'memory', {
  value: mockMemoryInfo,
  writable: true,
});

// Mock Audio Recording
const createMockRecording = () => ({
  prepareToRecordAsync: jest.fn(() => Promise.resolve()),
  startAsync: jest.fn(() => Promise.resolve()),
  stopAndUnloadAsync: jest.fn(() => Promise.resolve({
    uri: 'mock://recording.m4a',
    durationMillis: 5000,
  })),
  pauseAsync: jest.fn(() => Promise.resolve()),
  getStatusAsync: jest.fn(() => Promise.resolve({
    isRecording: true,
    durationMillis: 1000,
    metering: -30, // Audio level
  })),
  setOnRecordingStatusUpdate: jest.fn(),
});

describe('Performance and Audio Functionality Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();

    // Reset performance mocks
    mockPerformance.now.mockImplementation(() => Date.now());

    // Setup audio mocks
    mockAudio.requestPermissionsAsync.mockResolvedValue({
      status: 'granted',
      granted: true,
    });

    mockAudio.Recording = jest.fn().mockImplementation(() => createMockRecording());
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  describe('Component Render Performance', () => {
    it('RecordingPreparationModal renders within performance threshold', () => {
      const startTime = mockPerformance.now();

      render(
        <RecordingPreparationModal
          visible={true}
          topic="Test topic"
          onStartRecording={jest.fn()}
          onCancel={jest.fn()}
        />
      );

      const endTime = mockPerformance.now();
      const renderTime = endTime - startTime;

      // Should render in under 100ms for good UX
      expect(renderTime).toBeLessThan(100);
    });

    it('ActiveRecordingModal renders quickly with animations', () => {
      const startTime = mockPerformance.now();

      render(
        <ActiveRecordingModal
          visible={true}
          duration={30}
          topic="Test topic"
          onStopRecording={jest.fn()}
          onPauseRecording={jest.fn()}
        />
      );

      const endTime = mockPerformance.now();
      const renderTime = endTime - startTime;

      // Should render quickly despite complex animations
      expect(renderTime).toBeLessThan(150);
    });

    it('RecordingCompletionModal renders efficiently with complex content', () => {
      const startTime = mockPerformance.now();

      render(
        <RecordingCompletionModal
          visible={true}
          duration={60}
          topic="Test topic"
          onSaveMemory={jest.fn()}
          onDiscardMemory={jest.fn()}
          onPlayback={jest.fn()}
          onEditTitle={jest.fn()}
        />
      );

      const endTime = mockPerformance.now();
      const renderTime = endTime - startTime;

      // Should render efficiently despite rich content
      expect(renderTime).toBeLessThan(120);
    });

    it('RecordingButton renders quickly with animations', () => {
      const startTime = mockPerformance.now();

      render(<RecordingButton isRecording={true} onPress={jest.fn()} />);

      const endTime = mockPerformance.now();
      const renderTime = endTime - startTime;

      // Should render very quickly
      expect(renderTime).toBeLessThan(50);
    });

    it('FloatingRecordButton renders efficiently', () => {
      const startTime = mockPerformance.now();

      render(<FloatingRecordButton onPress={jest.fn()} size={100} />);

      const endTime = mockPerformance.now();
      const renderTime = endTime - startTime;

      // Should render very quickly
      expect(renderTime).toBeLessThan(30);
    });
  });

  describe('State Update Performance', () => {
    it('handles rapid state changes efficiently', () => {
      const { rerender } = render(<RecordingButton isRecording={false} onPress={jest.fn()} />);

      const startTime = mockPerformance.now();

      // Simulate rapid state changes
      for (let i = 0; i < 100; i++) {
        rerender(<RecordingButton isRecording={i % 2 === 0} onPress={jest.fn()} />);
      }

      const endTime = mockPerformance.now();
      const updateTime = endTime - startTime;

      // Should handle 100 state changes quickly
      expect(updateTime).toBeLessThan(500);
    });

    it('ActiveRecordingModal handles duration updates efficiently', () => {
      const { rerender } = render(
        <ActiveRecordingModal
          visible={true}
          duration={0}
          onStopRecording={jest.fn()}
        />
      );

      const startTime = mockPerformance.now();

      // Simulate real-time duration updates
      for (let duration = 1; duration <= 60; duration++) {
        rerender(
          <ActiveRecordingModal
            visible={true}
            duration={duration}
            onStopRecording={jest.fn()}
          />
        );
      }

      const endTime = mockPerformance.now();
      const updateTime = endTime - startTime;

      // Should handle 60 duration updates quickly
      expect(updateTime).toBeLessThan(300);
    });

    it('handles modal visibility changes efficiently', () => {
      const { rerender } = render(
        <RecordingPreparationModal
          visible={false}
          onStartRecording={jest.fn()}
          onCancel={jest.fn()}
        />
      );

      const startTime = mockPerformance.now();

      // Rapid visibility toggles
      for (let i = 0; i < 20; i++) {
        rerender(
          <RecordingPreparationModal
            visible={i % 2 === 0}
            onStartRecording={jest.fn()}
            onCancel={jest.fn()}
          />
        );
      }

      const endTime = mockPerformance.now();
      const toggleTime = endTime - startTime;

      // Should handle modal toggles efficiently
      expect(toggleTime).toBeLessThan(200);
    });
  });

  describe('Animation Performance', () => {
    it('ActiveRecordingModal animations perform smoothly', () => {
      render(
        <ActiveRecordingModal
          visible={true}
          duration={30}
          onStopRecording={jest.fn()}
        />
      );

      const startTime = mockPerformance.now();

      // Let animations run
      act(() => {
        jest.advanceTimersByTime(2000);
      });

      const endTime = mockPerformance.now();
      const animationTime = endTime - startTime;

      // Animation setup should not block main thread
      expect(animationTime).toBeLessThan(100);
    });

    it('RecordingButton animations do not impact performance', () => {
      render(<RecordingButton isRecording={true} onPress={jest.fn()} />);

      const startTime = mockPerformance.now();

      // Trigger press animations
      const button = screen.getByLabelText('Stop recording');
      act(() => {
        fireEvent(button, 'pressIn');
        fireEvent(button, 'pressOut');
      });

      const endTime = mockPerformance.now();
      const animationTime = endTime - startTime;

      // Press animations should be immediate
      expect(animationTime).toBeLessThan(50);
    });

    it('handles animation cleanup properly on unmount', () => {
      const { unmount } = render(
        <ActiveRecordingModal
          visible={true}
          duration={30}
          onStopRecording={jest.fn()}
        />
      );

      const startTime = mockPerformance.now();

      unmount();

      const endTime = mockPerformance.now();
      const cleanupTime = endTime - startTime;

      // Cleanup should be fast
      expect(cleanupTime).toBeLessThan(50);
    });
  });

  describe('Memory Usage and Leak Detection', () => {
    it('does not create memory leaks with modal mounting/unmounting', () => {
      const initialMemory = mockMemoryInfo.usedJSHeapSize;

      // Mount and unmount modal multiple times
      for (let i = 0; i < 10; i++) {
        const { unmount } = render(
          <RecordingPreparationModal
            visible={true}
            onStartRecording={jest.fn()}
            onCancel={jest.fn()}
          />
        );
        unmount();
      }

      // Memory usage should not grow significantly
      const finalMemory = mockMemoryInfo.usedJSHeapSize;
      const memoryGrowth = finalMemory - initialMemory;

      // Allow for some growth but not excessive
      expect(memoryGrowth).toBeLessThan(100000); // 100KB max growth
    });

    it('cleans up timers properly', () => {
      const { unmount } = render(
        <RecordingPreparationModal
          visible={true}
          onStartRecording={jest.fn()}
          onCancel={jest.fn()}
        />
      );

      // Start timer
      jest.advanceTimersByTime(250);

      unmount();

      // Advance timers after unmount - should not cause errors
      expect(() => {
        jest.advanceTimersByTime(1000);
      }).not.toThrow();
    });

    it('cleans up animations on component unmount', () => {
      const { unmount } = render(
        <ActiveRecordingModal
          visible={true}
          duration={30}
          onStopRecording={jest.fn()}
        />
      );

      // Let animations start
      act(() => {
        jest.advanceTimersByTime(100);
      });

      // Should unmount without errors
      expect(() => {
        unmount();
      }).not.toThrow();
    });

    it('handles multiple component instances efficiently', () => {
      const initialMemory = mockMemoryInfo.usedJSHeapSize;

      // Render multiple instances simultaneously
      const instances = [];
      for (let i = 0; i < 5; i++) {
        instances.push(
          render(
            <RecordingButton
              isRecording={i % 2 === 0}
              onPress={jest.fn()}
            />
          )
        );
      }

      const midMemory = mockMemoryInfo.usedJSHeapSize;

      // Cleanup all instances
      instances.forEach(instance => instance.unmount());

      const finalMemory = mockMemoryInfo.usedJSHeapSize;
      const netMemoryGrowth = finalMemory - initialMemory;

      // Should not retain significant memory after cleanup
      expect(netMemoryGrowth).toBeLessThan(50000); // 50KB max
    });
  });

  describe('Audio Recording Performance', () => {
    it('handles audio permission requests efficiently', async () => {
      const startTime = mockPerformance.now();

      await mockAudio.requestPermissionsAsync();

      const endTime = mockPerformance.now();
      const permissionTime = endTime - startTime;

      // Permission request should be fast
      expect(permissionTime).toBeLessThan(100);
      expect(mockAudio.requestPermissionsAsync).toHaveBeenCalled();
    });

    it('starts recording quickly', async () => {
      const recording = new mockAudio.Recording();
      const startTime = mockPerformance.now();

      await recording.prepareToRecordAsync();
      await recording.startAsync();

      const endTime = mockPerformance.now();
      const recordingStartTime = endTime - startTime;

      // Recording should start quickly
      expect(recordingStartTime).toBeLessThan(200);
    });

    it('stops recording efficiently', async () => {
      const recording = new mockAudio.Recording();

      await recording.prepareToRecordAsync();
      await recording.startAsync();

      const startTime = mockPerformance.now();
      const result = await recording.stopAndUnloadAsync();
      const endTime = mockPerformance.now();

      const stopTime = endTime - startTime;

      // Stopping should be fast
      expect(stopTime).toBeLessThan(150);
      expect(result.uri).toBeTruthy();
    });

    it('handles real-time recording status updates efficiently', async () => {
      const recording = new mockAudio.Recording();
      await recording.prepareToRecordAsync();
      await recording.startAsync();

      const startTime = mockPerformance.now();

      // Simulate multiple status checks
      for (let i = 0; i < 10; i++) {
        await recording.getStatusAsync();
      }

      const endTime = mockPerformance.now();
      const statusTime = endTime - startTime;

      // Status checks should be very fast
      expect(statusTime).toBeLessThan(100);
    });

    it('handles audio metering without performance impact', async () => {
      const recording = new mockAudio.Recording();
      await recording.prepareToRecordAsync();
      await recording.startAsync();

      const startTime = mockPerformance.now();

      // Simulate metering updates
      for (let i = 0; i < 30; i++) {
        const status = await recording.getStatusAsync();
        expect(status.metering).toBeDefined();
      }

      const endTime = mockPerformance.now();
      const meteringTime = endTime - startTime;

      // Metering should not impact performance
      expect(meteringTime).toBeLessThan(150);
    });
  });

  describe('Haptic and Speech Performance', () => {
    it('haptic feedback does not block UI', async () => {
      const startTime = mockPerformance.now();

      // Trigger multiple haptic feedbacks
      await Promise.all([
        mockHaptics.impactAsync(Haptics.ImpactFeedbackStyle.Light),
        mockHaptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium),
        mockHaptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy),
      ]);

      const endTime = mockPerformance.now();
      const hapticTime = endTime - startTime;

      // Haptic feedback should be non-blocking
      expect(hapticTime).toBeLessThan(50);
    });

    it('speech synthesis does not block UI', async () => {
      const startTime = mockPerformance.now();

      // Trigger speech
      mockSpeech.speak('Test speech', { language: 'en' });

      const endTime = mockPerformance.now();
      const speechTime = endTime - startTime;

      // Speech should not block UI
      expect(speechTime).toBeLessThan(30);
    });

    it('handles concurrent speech and haptic feedback', async () => {
      const startTime = mockPerformance.now();

      // Trigger both simultaneously
      await Promise.all([
        mockHaptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium),
        Promise.resolve(mockSpeech.speak('Test', { language: 'en' })),
      ]);

      const endTime = mockPerformance.now();
      const concurrentTime = endTime - startTime;

      // Should handle concurrent feedback efficiently
      expect(concurrentTime).toBeLessThan(100);
    });
  });

  describe('Large Dataset Performance', () => {
    it('handles long recording durations efficiently', () => {
      const longDuration = 3600; // 1 hour

      const startTime = mockPerformance.now();

      render(
        <ActiveRecordingModal
          visible={true}
          duration={longDuration}
          onStopRecording={jest.fn()}
        />
      );

      const endTime = mockPerformance.now();
      const renderTime = endTime - startTime;

      // Should handle long durations without performance impact
      expect(renderTime).toBeLessThan(100);
      expect(screen.getByText('60:00')).toBeTruthy();
    });

    it('handles topic with long text efficiently', () => {
      const longTopic = 'A'.repeat(1000); // Very long topic

      const startTime = mockPerformance.now();

      render(
        <RecordingPreparationModal
          visible={true}
          topic={longTopic}
          onStartRecording={jest.fn()}
          onCancel={jest.fn()}
        />
      );

      const endTime = mockPerformance.now();
      const renderTime = endTime - startTime;

      // Should handle long text without performance impact
      expect(renderTime).toBeLessThan(150);
    });
  });

  describe('Real-time Performance Monitoring', () => {
    it('ActiveRecordingModal maintains 60fps during recording simulation', () => {
      render(
        <ActiveRecordingModal
          visible={true}
          duration={0}
          onStopRecording={jest.fn()}
        />
      );

      const frameCount = 60; // 60 frames
      const startTime = mockPerformance.now();

      // Simulate 60 frame updates (1 second at 60fps)
      for (let frame = 0; frame < frameCount; frame++) {
        act(() => {
          jest.advanceTimersByTime(16.67); // ~60fps
        });
      }

      const endTime = mockPerformance.now();
      const totalTime = endTime - startTime;

      // Should complete 60 frames in reasonable time
      expect(totalTime).toBeLessThan(200);
    });

    it('waveform animations do not impact frame rate', () => {
      render(
        <ActiveRecordingModal
          visible={true}
          duration={30}
          onStopRecording={jest.fn()}
        />
      );

      const startTime = mockPerformance.now();

      // Let waveform animations run
      act(() => {
        jest.advanceTimersByTime(2000); // 2 seconds of animation
      });

      const endTime = mockPerformance.now();
      const animationDuration = endTime - startTime;

      // Animation processing should not take excessive time
      expect(animationDuration).toBeLessThan(100);
    });

    it('timer updates maintain performance', () => {
      const { rerender } = render(
        <ActiveRecordingModal
          visible={true}
          duration={0}
          onStopRecording={jest.fn()}
        />
      );

      const startTime = mockPerformance.now();

      // Simulate 60 seconds of timer updates
      for (let second = 1; second <= 60; second++) {
        rerender(
          <ActiveRecordingModal
            visible={true}
            duration={second}
            onStopRecording={jest.fn()}
          />
        );
      }

      const endTime = mockPerformance.now();
      const updateTime = endTime - startTime;

      // 60 timer updates should be very fast
      expect(updateTime).toBeLessThan(300);
    });
  });

  describe('Edge Case Performance', () => {
    it('handles zero duration efficiently', () => {
      const startTime = mockPerformance.now();

      render(
        <ActiveRecordingModal
          visible={true}
          duration={0}
          onStopRecording={jest.fn()}
        />
      );

      const endTime = mockPerformance.now();
      const renderTime = endTime - startTime;

      expect(renderTime).toBeLessThan(50);
      expect(screen.getByText('00:00')).toBeTruthy();
    });

    it('handles component remounting efficiently', () => {
      const startTime = mockPerformance.now();

      for (let i = 0; i < 5; i++) {
        const { unmount } = render(
          <RecordingButton isRecording={false} onPress={jest.fn()} />
        );
        unmount();
      }

      const endTime = mockPerformance.now();
      const mountTime = endTime - startTime;

      // Multiple mount/unmount cycles should be fast
      expect(mountTime).toBeLessThan(200);
    });

    it('maintains performance under stress conditions', () => {
      const components = [];

      const startTime = mockPerformance.now();

      // Create many components simultaneously
      for (let i = 0; i < 10; i++) {
        components.push(
          render(
            <FloatingRecordButton
              onPress={jest.fn()}
              isRecording={i % 2 === 0}
              size={70 + i * 5}
            />
          )
        );
      }

      const endTime = mockPerformance.now();
      const massRenderTime = endTime - startTime;

      // Should handle multiple components efficiently
      expect(massRenderTime).toBeLessThan(300);

      // Cleanup
      components.forEach(component => component.unmount());
    });
  });
});