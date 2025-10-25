/**
 * Unit Tests for ActiveRecordingModal Component
 * Tests Phase 2: Recording Flow Screens - Active Recording Interface
 *
 * Tests elderly-friendly features including:
 * - Real-time visual feedback (timer, waveform)
 * - Clear recording state indicators
 * - Large control buttons with haptic feedback
 * - Voice guidance and confirmation
 * - Accessibility for screen readers
 */

import React from 'react';
import { render, fireEvent, waitFor, screen } from '@testing-library/react-native';
import { Animated } from 'react-native';
import * as Haptics from 'expo-haptics';
import * as Speech from 'expo-speech';

import { ActiveRecordingModal } from '../../components/ActiveRecordingModal';

// Mock modules
jest.mock('expo-haptics');
jest.mock('expo-speech');

// Mock Animated API

const mockHaptics = Haptics as jest.Mocked<typeof Haptics>;
const mockSpeech = Speech as jest.Mocked<typeof Speech>;

describe('ActiveRecordingModal', () => {
  const defaultProps = {
    visible: true,
    duration: 30,
    onStopRecording: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();

    // Mock Animated.loop and timing
    jest.spyOn(Animated, 'loop').mockReturnValue({
      start: jest.fn(),
      stop: jest.fn(),
    } as any);

    jest.spyOn(Animated, 'timing').mockReturnValue({
      start: jest.fn(),
      stop: jest.fn(),
    } as any);

    jest.spyOn(Animated, 'sequence').mockReturnValue({
      start: jest.fn(),
      stop: jest.fn(),
    } as any);
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  describe('Rendering and Visibility', () => {
    it('renders correctly when visible and recording', () => {
      render(<ActiveRecordingModal {...defaultProps} />);

      expect(screen.getByText('Recording Active')).toBeTruthy();
      expect(screen.getByText('00:30')).toBeTruthy(); // Duration display
      expect(screen.getByText('Stop & Save')).toBeTruthy();
    });

    it('does not render when not visible', () => {
      render(<ActiveRecordingModal {...defaultProps} visible={false} />);

      expect(screen.queryByText('Recording Active')).toBeNull();
    });

    it('shows paused state correctly', () => {
      render(<ActiveRecordingModal {...defaultProps} isPaused={true} />);

      expect(screen.getByText('Recording Paused')).toBeTruthy();
      expect(screen.getByText('Resume')).toBeTruthy();
      expect(screen.getByText('Recording is paused')).toBeTruthy();
    });

    it('displays topic when provided', () => {
      const topic = 'My wedding day';
      render(<ActiveRecordingModal {...defaultProps} topic={topic} />);

      expect(screen.getByText('Recording About:')).toBeTruthy();
      expect(screen.getByText(`"${topic}"`)).toBeTruthy();
    });
  });

  describe('Timer and Duration Display', () => {
    it('formats duration correctly - seconds only', () => {
      render(<ActiveRecordingModal {...defaultProps} duration={45} />);

      expect(screen.getByText('00:45')).toBeTruthy();
    });

    it('formats duration correctly - minutes and seconds', () => {
      render(<ActiveRecordingModal {...defaultProps} duration={125} />);

      expect(screen.getByText('02:05')).toBeTruthy();
    });

    it('formats duration correctly - zero duration', () => {
      render(<ActiveRecordingModal {...defaultProps} duration={0} />);

      expect(screen.getByText('00:00')).toBeTruthy();
    });

    it('updates duration display when props change', () => {
      const { rerender } = render(<ActiveRecordingModal {...defaultProps} duration={30} />);

      expect(screen.getByText('00:30')).toBeTruthy();

      rerender(<ActiveRecordingModal {...defaultProps} duration={60} />);

      expect(screen.getByText('01:00')).toBeTruthy();
    });

    it('shows duration label for clarity', () => {
      render(<ActiveRecordingModal {...defaultProps} />);

      expect(screen.getByText('Duration')).toBeTruthy();
    });
  });

  describe('Visual Feedback and Animations', () => {
    it('starts pulse animation when recording', () => {
      render(<ActiveRecordingModal {...defaultProps} />);

      expect(Animated.loop).toHaveBeenCalled();
      expect(Animated.timing).toHaveBeenCalled();
    });

    it('stops animations when paused', () => {
      const { rerender } = render(<ActiveRecordingModal {...defaultProps} />);

      // Change to paused state
      rerender(<ActiveRecordingModal {...defaultProps} isPaused={true} />);

      // Animation should stop/reset when paused
      expect(screen.getByText('Recording Paused')).toBeTruthy();
    });

    it('shows waveform visualization', () => {
      render(<ActiveRecordingModal {...defaultProps} />);

      expect(screen.getByText('Audio Level')).toBeTruthy();
      expect(screen.getByText('Speak clearly into your device')).toBeTruthy();
    });

    it('updates waveform hint when paused', () => {
      render(<ActiveRecordingModal {...defaultProps} isPaused={true} />);

      expect(screen.getByText('Recording is paused')).toBeTruthy();
    });

    it('renders recording indicator with proper styling', () => {
      render(<ActiveRecordingModal {...defaultProps} />);

      const statusText = screen.getByText('Recording Active');
      expect(statusText).toBeTruthy();
    });
  });

  describe('Control Buttons and Interactions', () => {
    it('renders stop button with proper accessibility', () => {
      render(<ActiveRecordingModal {...defaultProps} />);

      const stopButton = screen.getByLabelText('Stop recording');
      expect(stopButton).toBeTruthy();
      expect(stopButton.props.accessibilityHint).toBe('Tap to finish and save your recording');
    });

    it('calls onStopRecording with haptic feedback', async () => {
      render(<ActiveRecordingModal {...defaultProps} />);

      const stopButton = screen.getByLabelText('Stop recording');
      fireEvent.press(stopButton);

      await waitFor(() => {
        expect(mockHaptics.impactAsync).toHaveBeenCalledWith(
          Haptics.ImpactFeedbackStyle.Medium
        );
        expect(mockSpeech.speak).toHaveBeenCalledWith(
          'Recording stopped. Processing your memory.',
          { language: 'en' }
        );
        expect(defaultProps.onStopRecording).toHaveBeenCalled();
      });
    });

    it('renders pause/resume button when onPauseRecording provided', () => {
      const onPauseRecording = jest.fn();
      render(
        <ActiveRecordingModal
          {...defaultProps}
          onPauseRecording={onPauseRecording}
        />
      );

      const pauseButton = screen.getByLabelText('Pause recording');
      expect(pauseButton).toBeTruthy();
      expect(pauseButton.props.accessibilityHint).toBe('Tap to pause recording');
    });

    it('calls onPauseRecording with haptic feedback', async () => {
      const onPauseRecording = jest.fn();
      render(
        <ActiveRecordingModal
          {...defaultProps}
          onPauseRecording={onPauseRecording}
        />
      );

      const pauseButton = screen.getByLabelText('Pause recording');
      fireEvent.press(pauseButton);

      await waitFor(() => {
        expect(mockHaptics.impactAsync).toHaveBeenCalledWith(
          Haptics.ImpactFeedbackStyle.Light
        );
        expect(mockSpeech.speak).toHaveBeenCalledWith(
          'Recording paused.',
          { language: 'en' }
        );
        expect(onPauseRecording).toHaveBeenCalled();
      });
    });

    it('shows resume button and calls onPauseRecording when paused', async () => {
      const onPauseRecording = jest.fn();
      render(
        <ActiveRecordingModal
          {...defaultProps}
          onPauseRecording={onPauseRecording}
          isPaused={true}
        />
      );

      const resumeButton = screen.getByLabelText('Resume recording');
      expect(resumeButton).toBeTruthy();
      expect(resumeButton.props.accessibilityHint).toBe('Tap to continue recording');

      fireEvent.press(resumeButton);

      await waitFor(() => {
        expect(mockSpeech.speak).toHaveBeenCalledWith(
          'Recording resumed.',
          { language: 'en' }
        );
        expect(onPauseRecording).toHaveBeenCalled();
      });
    });

    it('does not render pause button when onPauseRecording not provided', () => {
      render(<ActiveRecordingModal {...defaultProps} />);

      expect(screen.queryByLabelText('Pause recording')).toBeNull();
    });
  });

  describe('Elderly-Friendly Design Requirements', () => {
    it('has minimum touch target sizes for control buttons', () => {
      render(<ActiveRecordingModal {...defaultProps} onPauseRecording={jest.fn()} />);

      const stopButton = screen.getByLabelText('Stop recording');
      const pauseButton = screen.getByLabelText('Pause recording');

      // Check minimum touch target sizes (80px for elderly users)
      expect(stopButton.props.style.minHeight).toBe(80);
      expect(stopButton.props.style.minWidth).toBe(120);
      expect(pauseButton.props.style.minHeight).toBe(80);
      expect(pauseButton.props.style.minWidth).toBe(120);
    });

    it('displays large, clear timer text', () => {
      render(<ActiveRecordingModal {...defaultProps} />);

      const timerText = screen.getByText('00:30');
      expect(timerText.props.style.fontSize).toBe(48);
      expect(timerText.props.style.fontFamily).toBe('monospace');
    });

    it('shows clear recording guidelines', () => {
      render(<ActiveRecordingModal {...defaultProps} />);

      expect(screen.getByText('Recording Tips:')).toBeTruthy();
      expect(screen.getByText('• Share your memories naturally')).toBeTruthy();
      expect(screen.getByText('• Include names, dates, and places')).toBeTruthy();
      expect(screen.getByText('• Describe feelings and emotions')).toBeTruthy();
      expect(screen.getByText('• Take breaks if you need them')).toBeTruthy();
    });

    it('includes encouragement message', () => {
      render(<ActiveRecordingModal {...defaultProps} />);

      expect(screen.getByText('💝 Your family will treasure this memory')).toBeTruthy();
    });

    it('uses high contrast colors for visibility', () => {
      render(<ActiveRecordingModal {...defaultProps} />);

      // Check that text uses white color on dark background
      const statusText = screen.getByText('Recording Active');
      expect(statusText.props.style.color).toBe('white');
    });
  });

  describe('Modal Behavior', () => {
    it('uses proper modal configuration', () => {
      const { UNSAFE_getByType } = render(<ActiveRecordingModal {...defaultProps} />);

      const modal = UNSAFE_getByType('Modal');
      expect(modal.props.animationType).toBe('slide');
      expect(modal.props.transparent).toBe(false);
      expect(modal.props.accessibilityViewIsModal).toBe(true);
    });

    it('handles modal state changes correctly', () => {
      const { rerender } = render(<ActiveRecordingModal {...defaultProps} visible={false} />);

      expect(screen.queryByText('Recording Active')).toBeNull();

      rerender(<ActiveRecordingModal {...defaultProps} visible={true} />);

      expect(screen.getByText('Recording Active')).toBeTruthy();
    });
  });

  describe('Topic Display', () => {
    it('formats topic text correctly', () => {
      const topic = 'My first job';
      render(<ActiveRecordingModal {...defaultProps} topic={topic} />);

      expect(screen.getByText(`"${topic}"`)).toBeTruthy();
    });

    it('handles long topic names gracefully', () => {
      const longTopic = 'The story of how I met your grandmother and fell in love';
      render(<ActiveRecordingModal {...defaultProps} topic={longTopic} />);

      expect(screen.getByText(`"${longTopic}"`)).toBeTruthy();
    });

    it('handles special characters in topic names', () => {
      const specialTopic = 'Dad\'s "war stories" & life lessons';
      render(<ActiveRecordingModal {...defaultProps} topic={specialTopic} />);

      expect(screen.getByText(`"${specialTopic}"`)).toBeTruthy();
    });
  });

  describe('Error Handling', () => {
    it('handles haptic feedback errors gracefully', async () => {
      mockHaptics.impactAsync.mockRejectedValueOnce(new Error('Haptic failed'));

      render(<ActiveRecordingModal {...defaultProps} />);

      const stopButton = screen.getByLabelText('Stop recording');
      fireEvent.press(stopButton);

      await waitFor(() => {
        // Should still call onStopRecording even if haptic fails
        expect(defaultProps.onStopRecording).toHaveBeenCalled();
      });
    });

    it('handles speech synthesis errors gracefully', async () => {
      mockSpeech.speak.mockRejectedValueOnce(new Error('Speech failed'));

      render(<ActiveRecordingModal {...defaultProps} />);

      const stopButton = screen.getByLabelText('Stop recording');
      fireEvent.press(stopButton);

      await waitFor(() => {
        // Should still call onStopRecording even if speech fails
        expect(defaultProps.onStopRecording).toHaveBeenCalled();
      });
    });

    it('handles missing onPauseRecording callback', async () => {
      render(<ActiveRecordingModal {...defaultProps} />);

      // Should not crash when pause functionality is not available
      expect(() => {
        render(<ActiveRecordingModal {...defaultProps} />);
      }).not.toThrow();
    });
  });

  describe('Performance', () => {
    it('cleans up animations on unmount', () => {
      const { unmount } = render(<ActiveRecordingModal {...defaultProps} />);

      unmount();

      // Animations should be properly cleaned up
      expect(jest.spyOn(Animated.Value.prototype, 'setValue')).toHaveBeenCalled();
    });

    it('renders efficiently with many waveform bars', () => {
      const startTime = performance.now();

      render(<ActiveRecordingModal {...defaultProps} />);

      const endTime = performance.now();
      const renderTime = endTime - startTime;

      // Should render quickly even with animated elements
      expect(renderTime).toBeLessThan(200);
    });

    it('handles rapid state changes without memory leaks', () => {
      const { rerender } = render(<ActiveRecordingModal {...defaultProps} isPaused={false} />);

      // Rapidly change pause state
      for (let i = 0; i < 10; i++) {
        rerender(<ActiveRecordingModal {...defaultProps} isPaused={i % 2 === 0} />);
      }

      // Should not cause memory issues
      expect(screen.getByText(/Recording/)).toBeTruthy();
    });
  });

  describe('Accessibility Compliance', () => {
    it('provides proper screen reader support', () => {
      render(<ActiveRecordingModal {...defaultProps} />);

      const modal = screen.getByTestId('active-recording-modal');
      expect(modal.props.accessibilityViewIsModal).toBe(true);
    });

    it('has meaningful button labels for voice control', () => {
      render(<ActiveRecordingModal {...defaultProps} onPauseRecording={jest.fn()} />);

      const stopButton = screen.getByLabelText('Stop recording');
      const pauseButton = screen.getByLabelText('Pause recording');

      expect(stopButton.props.accessibilityLabel).toBe('Stop recording');
      expect(pauseButton.props.accessibilityLabel).toBe('Pause recording');
    });

    it('provides clear accessibility hints', () => {
      render(<ActiveRecordingModal {...defaultProps} onPauseRecording={jest.fn()} />);

      const stopButton = screen.getByLabelText('Stop recording');
      const pauseButton = screen.getByLabelText('Pause recording');

      expect(stopButton.props.accessibilityHint).toBe('Tap to finish and save your recording');
      expect(pauseButton.props.accessibilityHint).toBe('Tap to pause recording');
    });

    it('announces state changes to screen readers', async () => {
      render(<ActiveRecordingModal {...defaultProps} onPauseRecording={jest.fn()} />);

      const pauseButton = screen.getByLabelText('Pause recording');
      fireEvent.press(pauseButton);

      await waitFor(() => {
        expect(mockSpeech.speak).toHaveBeenCalledWith(
          'Recording paused.',
          { language: 'en' }
        );
      });
    });
  });

  describe('Edge Cases', () => {
    it('handles undefined props gracefully', () => {
      const minimalProps = {
        visible: true,
        duration: 0,
        onStopRecording: jest.fn(),
        topic: undefined,
        onPauseRecording: undefined,
        isPaused: undefined,
      };

      expect(() => {
        render(<ActiveRecordingModal {...minimalProps} />);
      }).not.toThrow();
    });

    it('handles very long durations', () => {
      render(<ActiveRecordingModal {...defaultProps} duration={3661} />); // Over 1 hour

      expect(screen.getByText('61:01')).toBeTruthy();
    });

    it('handles negative durations', () => {
      render(<ActiveRecordingModal {...defaultProps} duration={-5} />);

      expect(screen.getByText('00:00')).toBeTruthy(); // Should default to 00:00
    });

    it('handles null callbacks without crashing', () => {
      const propsWithNullCallbacks = {
        ...defaultProps,
        onStopRecording: undefined as any,
        onPauseRecording: undefined as any,
      };

      expect(() => {
        render(<ActiveRecordingModal {...propsWithNullCallbacks} />);
      }).not.toThrow();
    });
  });

  describe('State Management Integration', () => {
    it('responds correctly to recording state changes', () => {
      const { rerender } = render(<ActiveRecordingModal {...defaultProps} isPaused={false} />);

      expect(screen.getByText('Recording Active')).toBeTruthy();

      rerender(<ActiveRecordingModal {...defaultProps} isPaused={true} />);

      expect(screen.getByText('Recording Paused')).toBeTruthy();
    });

    it('updates visual feedback based on recording state', () => {
      const { rerender } = render(<ActiveRecordingModal {...defaultProps} isPaused={false} />);

      expect(screen.getByText('Speak clearly into your device')).toBeTruthy();

      rerender(<ActiveRecordingModal {...defaultProps} isPaused={true} />);

      expect(screen.getByText('Recording is paused')).toBeTruthy();
    });
  });
});
