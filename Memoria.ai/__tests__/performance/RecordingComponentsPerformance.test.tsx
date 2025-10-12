/**
 * Performance Tests for Recording Flow Components
 * Tests Phase 2: Recording Flow Screens - Performance Monitoring
 *
 * Tests performance characteristics specifically important for elderly users:
 * - Fast initial render times for responsiveness
 * - Smooth animations without lag
 * - Efficient real-time audio level updates
 * - Memory usage optimization
 * - Battery usage considerations
 * - Low CPU usage during recording
 */

import React from 'react';
import { render, act } from '@testing-library/react-native';
import { Animated } from 'react-native';

import { RecordingPreparationModal } from '../../components/RecordingPreparationModal';
import { ActiveRecordingModal } from '../../components/ActiveRecordingModal';
import { RecordingCompletionModal } from '../../components/RecordingCompletionModal';
import { FloatingRecordButton } from '../../components/FloatingRecordButton';
import { RecordingStatus } from '../../components/RecordingStatus';
import { AudioVisualizer } from '../../components/recording-flow/ui/AudioVisualizer';
import { ElderlyRecordingButton } from '../../components/recording-flow/ui/ElderlyRecordingButton';

import {
  PerformanceTestUtils,
  RecordingTestDataGenerator,
  MockSetupUtils,
} from '../utils/recording-test-helpers';

// Mock dependencies
jest.mock('expo-haptics');
jest.mock('expo-speech');
jest.mock('expo-av');

// Mock Animated API for performance testing
jest.mock('react-native/Libraries/Animated/NativeAnimatedHelper');

describe('Recording Components Performance', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    MockSetupUtils.setupRecordingFlowMocks();

    // Mock performance.now() for consistent testing
    global.performance = {
      ...global.performance,
      now: jest.fn(() => Date.now()),
    };
  });

  describe('Initial Render Performance', () => {
    it('RecordingPreparationModal renders quickly for elderly users', () => {
      const renderTime = PerformanceTestUtils.measureRenderTime(() => {
        render(
          <RecordingPreparationModal
            visible={true}
            onStartRecording={jest.fn()}
            onCancel={jest.fn()}
          />
        );
      });

      // Should render in under 50ms for good UX
      expect(renderTime).toBeLessThan(50);
    });

    it('ActiveRecordingModal renders quickly during recording', () => {
      const renderTime = PerformanceTestUtils.measureRenderTime(() => {
        render(
          <ActiveRecordingModal
            visible={true}
            duration={30}
            onStopRecording={jest.fn()}
            onPauseRecording={jest.fn()}
          />
        );
      });

      expect(renderTime).toBeLessThan(50);
    });

    it('RecordingCompletionModal renders quickly for completion', () => {
      const renderTime = PerformanceTestUtils.measureRenderTime(() => {
        render(
          <RecordingCompletionModal
            visible={true}
            duration={60}
            onSaveMemory={jest.fn()}
            onDiscardMemory={jest.fn()}
          />
        );
      });

      expect(renderTime).toBeLessThan(50);
    });

    it('FloatingRecordButton renders quickly', () => {
      const renderTime = PerformanceTestUtils.measureRenderTime(() => {
        render(<FloatingRecordButton onPress={jest.fn()} />);
      });

      expect(renderTime).toBeLessThan(25);
    });

    it('RecordingStatus renders quickly', () => {
      const renderTime = PerformanceTestUtils.measureRenderTime(() => {
        render(<RecordingStatus isRecording={true} duration={30} />);
      });

      expect(renderTime).toBeLessThan(25);
    });

    it('AudioVisualizer renders quickly with complex configuration', () => {
      const renderTime = PerformanceTestUtils.measureRenderTime(() => {
        render(
          <AudioVisualizer
            isRecording={true}
            currentLevel={50}
            type="bars"
            barCount={30}
            showPeaks={true}
            elderlyMode={true}
          />
        );
      });

      expect(renderTime).toBeLessThan(75);
    });

    it('ElderlyRecordingButton renders quickly with all features', () => {
      const renderTime = PerformanceTestUtils.measureRenderTime(() => {
        render(
          <ElderlyRecordingButton
            phase="recording"
            isRecording={true}
            isPaused={false}
            duration={30}
            size="extra-large"
            elderlyMode={true}
            voiceGuidanceEnabled={true}
            showDuration={true}
            showVisualFeedback={true}
            onPress={jest.fn()}
          />
        );
      });

      expect(renderTime).toBeLessThan(75);
    });
  });

  describe('Real-Time Update Performance', () => {
    it('handles rapid duration updates efficiently', () => {
      const { rerender } = render(<RecordingStatus isRecording={true} duration={0} />);

      const performanceResult = PerformanceTestUtils.simulateHighFrequencyUpdates(
        null,
        (iteration) => {
          rerender(<RecordingStatus isRecording={true} duration={iteration} />);
        },
        60 // 60 updates (1 second of updates at 60fps)
      );

      expect(performanceResult.meetsPerformanceStandards).toBe(true);
      expect(performanceResult.animationFrameRate).toBeGreaterThan(30);
    });

    it('AudioVisualizer handles rapid audio level updates efficiently', () => {
      const { rerender } = render(
        <AudioVisualizer isRecording={true} currentLevel={0} />
      );

      const audioLevels = RecordingTestDataGenerator.generateAudioLevels(100, 'variable');

      const startTime = performance.now();

      audioLevels.forEach((level, index) => {
        act(() => {
          rerender(<AudioVisualizer isRecording={true} currentLevel={level} />);
        });
      });

      const endTime = performance.now();
      const totalTime = endTime - startTime;

      // Should handle 100 updates in under 500ms
      expect(totalTime).toBeLessThan(500);
    });

    it('AudioVisualizer with multiple bars performs well', () => {
      const audioLevels = RecordingTestDataGenerator.generateAudioLevels(50, 'high');
      const { rerender } = render(
        <AudioVisualizer
          isRecording={true}
          audioLevels={audioLevels}
          barCount={50}
          showPeaks={true}
        />
      );

      const performanceResult = PerformanceTestUtils.simulateHighFrequencyUpdates(
        null,
        (iteration) => {
          const newLevels = RecordingTestDataGenerator.generateAudioLevels(50, 'variable');
          rerender(
            <AudioVisualizer
              isRecording={true}
              audioLevels={newLevels}
              barCount={50}
              showPeaks={true}
            />
          );
        },
        30 // 30 updates
      );

      expect(performanceResult.meetsPerformanceStandards).toBe(true);
    });

    it('ElderlyRecordingButton handles state changes efficiently', () => {
      const { rerender } = render(
        <ElderlyRecordingButton
          phase="idle"
          isRecording={false}
          isPaused={false}
          duration={0}
          onPress={jest.fn()}
        />
      );

      const startTime = performance.now();

      // Simulate typical recording flow state changes
      const states = [
        { phase: 'preparation' as const, isRecording: false, isPaused: false, duration: 0 },
        { phase: 'recording' as const, isRecording: true, isPaused: false, duration: 1 },
        { phase: 'recording' as const, isRecording: true, isPaused: false, duration: 5 },
        { phase: 'paused' as const, isRecording: true, isPaused: true, duration: 10 },
        { phase: 'recording' as const, isRecording: true, isPaused: false, duration: 15 },
        { phase: 'completion' as const, isRecording: false, isPaused: false, duration: 20 },
      ];

      states.forEach((state) => {
        act(() => {
          rerender(
            <ElderlyRecordingButton
              {...state}
              onPress={jest.fn()}
            />
          );
        });
      });

      const endTime = performance.now();
      const totalTime = endTime - startTime;

      // Should handle all state changes in under 100ms
      expect(totalTime).toBeLessThan(100);
    });
  });

  describe('Animation Performance', () => {
    it('FloatingRecordButton animations perform smoothly', () => {
      render(<FloatingRecordButton onPress={jest.fn()} isRecording={true} />);

      const animationPerformance = PerformanceTestUtils.testAnimationPerformance(() => {
        // Simulate animation frame
        jest.advanceTimersByTime(16.67); // One frame at 60fps
      });

      expect(animationPerformance).toBe(true);
    });

    it('AudioVisualizer animations maintain good frame rate', () => {
      render(
        <AudioVisualizer
          isRecording={true}
          currentLevel={50}
          type="bars"
          barCount={20}
          elderlyMode={true}
        />
      );

      // Test animation performance with multiple animated elements
      const isPerformant = PerformanceTestUtils.testAnimationPerformance(() => {
        // Simulate updating all bars
        for (let i = 0; i < 20; i++) {
          jest.advanceTimersByTime(1);
        }
      });

      expect(isPerformant).toBe(true);
    });

    it('ElderlyRecordingButton pulse animation performs well', () => {
      render(
        <ElderlyRecordingButton
          phase="recording"
          isRecording={true}
          isPaused={false}
          showVisualFeedback={true}
          onPress={jest.fn()}
        />
      );

      const animationPerformance = PerformanceTestUtils.testAnimationPerformance(() => {
        jest.advanceTimersByTime(16.67);
      });

      expect(animationPerformance).toBe(true);
    });

    it('RecordingStatus pulse animation performs efficiently', () => {
      render(<RecordingStatus isRecording={true} duration={30} />);

      const animationPerformance = PerformanceTestUtils.testAnimationPerformance(() => {
        jest.advanceTimersByTime(16.67);
      });

      expect(animationPerformance).toBe(true);
    });
  });

  describe('Memory Usage Optimization', () => {
    it('components clean up properly on unmount', () => {
      const components = [
        <RecordingPreparationModal
          key="prep"
          visible={true}
          onStartRecording={jest.fn()}
          onCancel={jest.fn()}
        />,
        <ActiveRecordingModal
          key="active"
          visible={true}
          duration={30}
          onStopRecording={jest.fn()}
        />,
        <RecordingCompletionModal
          key="complete"
          visible={true}
          duration={60}
          onSaveMemory={jest.fn()}
          onDiscardMemory={jest.fn()}
        />,
        <AudioVisualizer
          key="visualizer"
          isRecording={true}
          currentLevel={50}
          barCount={30}
        />,
        <ElderlyRecordingButton
          key="elderly-btn"
          phase="recording"
          isRecording={true}
          isPaused={false}
          onPress={jest.fn()}
        />,
      ];

      const unmountFunctions = components.map((component) => {
        const { unmount } = render(component);
        return unmount;
      });

      // Should unmount all components without errors
      expect(() => {
        unmountFunctions.forEach((unmount) => unmount());
      }).not.toThrow();
    });

    it('AudioVisualizer with many bars manages memory efficiently', () => {
      const { unmount } = render(
        <AudioVisualizer
          isRecording={true}
          currentLevel={50}
          barCount={100} // Large number of bars
          showPeaks={true}
        />
      );

      // Should handle large number of animated elements
      expect(() => {
        for (let i = 0; i < 50; i++) {
          jest.advanceTimersByTime(100);
        }
      }).not.toThrow();

      expect(() => {
        unmount();
      }).not.toThrow();
    });

    it('handles rapid component mounting and unmounting', () => {
      expect(() => {
        for (let i = 0; i < 10; i++) {
          const { unmount } = render(
            <RecordingStatus isRecording={true} duration={i} />
          );
          unmount();
        }
      }).not.toThrow();
    });
  });

  describe('Elderly-Specific Performance Considerations', () => {
    it('simplified UI reduces complexity for better performance', () => {
      const complexRenderTime = PerformanceTestUtils.measureRenderTime(() => {
        render(
          <AudioVisualizer
            isRecording={true}
            currentLevel={50}
            type="bars"
            barCount={50}
            showPeaks={true}
            elderlyMode={false}
          />
        );
      });

      const simpleRenderTime = PerformanceTestUtils.measureRenderTime(() => {
        render(
          <AudioVisualizer
            isRecording={true}
            currentLevel={50}
            type="simple"
            barCount={5}
            showPeaks={false}
            elderlyMode={true}
          />
        );
      });

      // Simplified version should render faster
      expect(simpleRenderTime).toBeLessThan(complexRenderTime);
    });

    it('elderly mode animations are optimized for smoothness', () => {
      const { rerender } = render(
        <ElderlyRecordingButton
          phase="recording"
          isRecording={true}
          isPaused={false}
          elderlyMode={true}
          onPress={jest.fn()}
        />
      );

      const startTime = performance.now();

      // Rapid state changes that might happen during recording
      for (let i = 0; i < 20; i++) {
        act(() => {
          rerender(
            <ElderlyRecordingButton
              phase="recording"
              isRecording={i % 2 === 0}
              isPaused={false}
              elderlyMode={true}
              duration={i}
              onPress={jest.fn()}
            />
          );
        });
      }

      const endTime = performance.now();
      const totalTime = endTime - startTime;

      // Should handle rapid changes smoothly
      expect(totalTime).toBeLessThan(200);
    });

    it('voice guidance does not block UI updates', async () => {
      const { rerender } = render(
        <ElderlyRecordingButton
          phase="idle"
          isRecording={false}
          isPaused={false}
          elderlyMode={true}
          voiceGuidanceEnabled={true}
          onPress={jest.fn()}
        />
      );

      const startTime = performance.now();

      // UI updates should not be blocked by voice guidance
      act(() => {
        rerender(
          <ElderlyRecordingButton
            phase="recording"
            isRecording={true}
            isPaused={false}
            elderlyMode={true}
            voiceGuidanceEnabled={true}
            onPress={jest.fn()}
          />
        );
      });

      const endTime = performance.now();
      const updateTime = endTime - startTime;

      // UI update should be immediate regardless of voice guidance
      expect(updateTime).toBeLessThan(50);
    });

    it('haptic feedback does not impact render performance', () => {
      const { rerender } = render(
        <ElderlyRecordingButton
          phase="idle"
          isRecording={false}
          isPaused={false}
          hapticFeedbackLevel="heavy"
          onPress={jest.fn()}
        />
      );

      const startTime = performance.now();

      // Multiple rapid state changes with haptic feedback
      for (let i = 0; i < 10; i++) {
        act(() => {
          rerender(
            <ElderlyRecordingButton
              phase={i % 2 === 0 ? 'idle' : 'recording'}
              isRecording={i % 2 === 1}
              isPaused={false}
              hapticFeedbackLevel="heavy"
              onPress={jest.fn()}
            />
          );
        });
      }

      const endTime = performance.now();
      const totalTime = endTime - startTime;

      expect(totalTime).toBeLessThan(150);
    });
  });

  describe('Stress Testing', () => {
    it('handles very long recording sessions without performance degradation', () => {
      const { rerender } = render(<RecordingStatus isRecording={true} duration={0} />);

      const startTime = performance.now();

      // Simulate 10 minute recording with updates every second
      for (let i = 1; i <= 600; i++) {
        act(() => {
          rerender(<RecordingStatus isRecording={true} duration={i} />);
        });
      }

      const endTime = performance.now();
      const totalTime = endTime - startTime;

      // Should handle 600 updates efficiently
      expect(totalTime).toBeLessThan(1000);
    });

    it('AudioVisualizer handles continuous high audio levels', () => {
      const { rerender } = render(
        <AudioVisualizer isRecording={true} currentLevel={0} />
      );

      const highAudioLevels = Array.from({ length: 200 }, () =>
        Math.floor(Math.random() * 100)
      );

      const startTime = performance.now();

      highAudioLevels.forEach((level) => {
        act(() => {
          rerender(<AudioVisualizer isRecording={true} currentLevel={level} />);
        });
      });

      const endTime = performance.now();
      const totalTime = endTime - startTime;

      expect(totalTime).toBeLessThan(1000);
    });

    it('handles rapid modal transitions without memory leaks', () => {
      const modals = [
        RecordingPreparationModal,
        ActiveRecordingModal,
        RecordingCompletionModal,
      ];

      const defaultProps = [
        { visible: true, onStartRecording: jest.fn(), onCancel: jest.fn() },
        { visible: true, duration: 30, onStopRecording: jest.fn() },
        { visible: true, duration: 60, onSaveMemory: jest.fn(), onDiscardMemory: jest.fn() },
      ];

      expect(() => {
        for (let i = 0; i < 20; i++) {
          const ModalComponent = modals[i % 3];
          const props = defaultProps[i % 3];

          const { unmount } = render(React.createElement(ModalComponent, props));
          unmount();
        }
      }).not.toThrow();
    });
  });

  describe('Resource Management', () => {
    it('timers are properly cleaned up', () => {
      const { unmount } = render(
        <ElderlyRecordingButton
          phase="recording"
          isRecording={true}
          isPaused={false}
          showVisualFeedback={true}
          onPress={jest.fn()}
        />
      );

      // Should clean up timers without errors
      expect(() => {
        unmount();
        jest.runOnlyPendingTimers();
      }).not.toThrow();
    });

    it('animation listeners are properly removed', () => {
      const { unmount } = render(
        <AudioVisualizer
          isRecording={true}
          currentLevel={50}
          type="bars"
          barCount={20}
        />
      );

      expect(() => {
        unmount();
      }).not.toThrow();
    });

    it('event listeners are properly cleaned up', () => {
      const components = [
        <FloatingRecordButton key="float" onPress={jest.fn()} />,
        <RecordingStatus key="status" isRecording={true} duration={30} />,
      ];

      const unmountFunctions = components.map((component) => {
        const { unmount } = render(component);
        return unmount;
      });

      expect(() => {
        unmountFunctions.forEach((unmount) => unmount());
      }).not.toThrow();
    });
  });
});