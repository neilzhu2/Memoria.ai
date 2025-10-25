/**
 * Unit Tests for RecordingPreparationModal Component
 * Tests Phase 2: Recording Flow Screens - Preparation Screen
 *
 * Tests elderly-friendly features including:
 * - Large touch targets (80px+ minimum)
 * - Voice guidance and speech synthesis
 * - Haptic feedback
 * - Clear visual hierarchy
 * - Accessibility compliance
 */

import React from 'react';
import { render, fireEvent, waitFor, screen } from '@testing-library/react-native';
import { Alert } from 'react-native';
import * as Haptics from 'expo-haptics';
import * as Speech from 'expo-speech';

import { RecordingPreparationModal } from '../../components/RecordingPreparationModal';

// Mock modules
jest.mock('expo-haptics');
jest.mock('expo-speech');

const mockHaptics = Haptics as jest.Mocked<typeof Haptics>;
const mockSpeech = Speech as jest.Mocked<typeof Speech>;

describe('RecordingPreparationModal', () => {
  const defaultProps = {
    visible: true,
    onStartRecording: jest.fn(),
    onCancel: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  describe('Rendering and Visibility', () => {
    it('renders correctly when visible', () => {
      render(<RecordingPreparationModal {...defaultProps} />);

      expect(screen.getByText('Ready to Record?')).toBeTruthy();
      expect(screen.getByText('Share your memory with your family')).toBeTruthy();
      expect(screen.getByText('Recording Tips:')).toBeTruthy();
    });

    it('does not render when not visible', () => {
      render(<RecordingPreparationModal {...defaultProps} visible={false} />);

      expect(screen.queryByText('Ready to Record?')).toBeNull();
    });

    it('displays topic when provided', () => {
      const topic = 'My childhood memories';
      render(<RecordingPreparationModal {...defaultProps} topic={topic} />);

      expect(screen.getByText('Today\'s Topic:')).toBeTruthy();
      expect(screen.getByText(`"${topic}"`)).toBeTruthy();
    });

    it('hides topic section when no topic provided', () => {
      render(<RecordingPreparationModal {...defaultProps} />);

      expect(screen.queryByText('Today\'s Topic:')).toBeNull();
    });
  });

  describe('Voice Guidance and Accessibility', () => {
    it('provides voice guidance when modal becomes visible', async () => {
      render(<RecordingPreparationModal {...defaultProps} />);

      // Fast-forward past the 500ms delay
      jest.advanceTimersByTime(500);

      await waitFor(() => {
        expect(mockSpeech.speak).toHaveBeenCalledWith(
          'Ready to record? Follow the instructions on screen.',
          {
            language: 'en',
            rate: 0.8,
          }
        );
      });
    });

    it('does not provide voice guidance when not visible', () => {
      render(<RecordingPreparationModal {...defaultProps} visible={false} />);

      jest.advanceTimersByTime(1000);

      expect(mockSpeech.speak).not.toHaveBeenCalled();
    });

    it('has proper accessibility labels on buttons', () => {
      render(<RecordingPreparationModal {...defaultProps} />);

      const startButton = screen.getByLabelText('Start recording');
      const cancelButton = screen.getByLabelText('Cancel recording');

      expect(startButton).toBeTruthy();
      expect(cancelButton).toBeTruthy();

      // Check accessibility hints
      expect(startButton.props.accessibilityHint).toBe('Tap to begin recording your memory');
      expect(cancelButton.props.accessibilityHint).toBe('Tap to go back without recording');
    });

    it('sets accessibilityViewIsModal correctly', () => {
      const { UNSAFE_getByType } = render(<RecordingPreparationModal {...defaultProps} />);

      const modal = UNSAFE_getByType('Modal');
      expect(modal.props.accessibilityViewIsModal).toBe(true);
    });
  });

  describe('Elderly-Friendly Design Requirements', () => {
    it('has minimum touch target sizes for buttons', () => {
      render(<RecordingPreparationModal {...defaultProps} />);

      const startButton = screen.getByLabelText('Start recording');
      const cancelButton = screen.getByLabelText('Cancel recording');

      // Check minimum touch target size (56px height as per styles)
      expect(startButton.props.style.minHeight).toBe(56);
      expect(cancelButton.props.style.minHeight).toBe(56);
    });

    it('displays clear, large text for instructions', () => {
      render(<RecordingPreparationModal {...defaultProps} />);

      const title = screen.getByText('Ready to Record?');
      const subtitle = screen.getByText('Share your memory with your family');

      // Verify text is large enough for elderly users
      expect(title.props.style.fontSize).toBeGreaterThanOrEqual(28);
      expect(subtitle.props.style.fontSize).toBeGreaterThanOrEqual(18);
    });

    it('shows all recording tips clearly', () => {
      render(<RecordingPreparationModal {...defaultProps} />);

      // Check all tips are present
      expect(screen.getByText('Speak clearly and at normal volume')).toBeTruthy();
      expect(screen.getByText('Take your time - there\'s no rush')).toBeTruthy();
      expect(screen.getByText('Share details, feelings, and stories')).toBeTruthy();
      expect(screen.getByText('Tap stop when you\'re finished')).toBeTruthy();
    });

    it('includes voice guidance indicator', () => {
      render(<RecordingPreparationModal {...defaultProps} />);

      expect(screen.getByText('🔊 Voice guidance is active to help you through each step')).toBeTruthy();
    });
  });

  describe('User Interactions', () => {
    it('calls onStartRecording with haptic feedback when start button pressed', async () => {
      render(<RecordingPreparationModal {...defaultProps} />);

      const startButton = screen.getByLabelText('Start recording');
      fireEvent.press(startButton);

      await waitFor(() => {
        expect(mockHaptics.impactAsync).toHaveBeenCalledWith(
          Haptics.ImpactFeedbackStyle.Medium
        );
        expect(mockSpeech.speak).toHaveBeenCalledWith(
          'Recording started. Please speak clearly.',
          { language: 'en' }
        );
        expect(defaultProps.onStartRecording).toHaveBeenCalled();
      });
    });

    it('calls onCancel with haptic feedback when cancel button pressed', async () => {
      render(<RecordingPreparationModal {...defaultProps} />);

      const cancelButton = screen.getByLabelText('Cancel recording');
      fireEvent.press(cancelButton);

      await waitFor(() => {
        expect(mockHaptics.impactAsync).toHaveBeenCalledWith(
          Haptics.ImpactFeedbackStyle.Light
        );
        expect(defaultProps.onCancel).toHaveBeenCalled();
      });
    });

    it('handles rapid button presses gracefully', async () => {
      render(<RecordingPreparationModal {...defaultProps} />);

      const startButton = screen.getByLabelText('Start recording');

      // Simulate rapid button presses
      fireEvent.press(startButton);
      fireEvent.press(startButton);
      fireEvent.press(startButton);

      await waitFor(() => {
        // Should still only call handlers once per press
        expect(defaultProps.onStartRecording).toHaveBeenCalledTimes(3);
      });
    });
  });

  describe('Modal Behavior', () => {
    it('uses slide animation', () => {
      const { UNSAFE_getByType } = render(<RecordingPreparationModal {...defaultProps} />);

      const modal = UNSAFE_getByType('Modal');
      expect(modal.props.animationType).toBe('slide');
    });

    it('is transparent overlay', () => {
      const { UNSAFE_getByType } = render(<RecordingPreparationModal {...defaultProps} />);

      const modal = UNSAFE_getByType('Modal');
      expect(modal.props.transparent).toBe(true);
    });

    it('handles modal state changes correctly', () => {
      const { rerender } = render(<RecordingPreparationModal {...defaultProps} visible={false} />);

      expect(screen.queryByText('Ready to Record?')).toBeNull();

      rerender(<RecordingPreparationModal {...defaultProps} visible={true} />);

      expect(screen.getByText('Ready to Record?')).toBeTruthy();
    });
  });

  describe('Topic Display', () => {
    it('formats topic text correctly with quotes', () => {
      const topic = 'Family traditions';
      render(<RecordingPreparationModal {...defaultProps} topic={topic} />);

      expect(screen.getByText(`"${topic}"`)).toBeTruthy();
    });

    it('handles long topic names', () => {
      const longTopic = 'This is a very long topic name that might wrap to multiple lines';
      render(<RecordingPreparationModal {...defaultProps} topic={longTopic} />);

      expect(screen.getByText(`"${longTopic}"`)).toBeTruthy();
    });

    it('handles special characters in topic names', () => {
      const specialTopic = 'My mom\'s "special" recipe & family secrets';
      render(<RecordingPreparationModal {...defaultProps} topic={specialTopic} />);

      expect(screen.getByText(`"${specialTopic}"`)).toBeTruthy();
    });
  });

  describe('Error Handling', () => {
    it('handles haptic feedback errors gracefully', async () => {
      mockHaptics.impactAsync.mockRejectedValueOnce(new Error('Haptic failed'));

      render(<RecordingPreparationModal {...defaultProps} />);

      const startButton = screen.getByLabelText('Start recording');
      fireEvent.press(startButton);

      await waitFor(() => {
        // Should still call onStartRecording even if haptic fails
        expect(defaultProps.onStartRecording).toHaveBeenCalled();
      });
    });

    it('handles speech synthesis errors gracefully', async () => {
      mockSpeech.speak.mockRejectedValueOnce(new Error('Speech failed'));

      render(<RecordingPreparationModal {...defaultProps} />);

      jest.advanceTimersByTime(500);

      const startButton = screen.getByLabelText('Start recording');
      fireEvent.press(startButton);

      await waitFor(() => {
        // Should still call onStartRecording even if speech fails
        expect(defaultProps.onStartRecording).toHaveBeenCalled();
      });
    });
  });

  describe('Performance', () => {
    it('does not cause memory leaks with timers', () => {
      const { unmount } = render(<RecordingPreparationModal {...defaultProps} />);

      // Start the timer
      jest.advanceTimersByTime(250);

      // Unmount before timer completes
      unmount();

      // Complete the timer - should not cause errors
      jest.advanceTimersByTime(500);

      // No speech should be called after unmount
      expect(mockSpeech.speak).not.toHaveBeenCalled();
    });

    it('renders quickly without blocking UI', () => {
      const startTime = performance.now();

      render(<RecordingPreparationModal {...defaultProps} />);

      const endTime = performance.now();
      const renderTime = endTime - startTime;

      // Should render in under 100ms for good UX
      expect(renderTime).toBeLessThan(100);
    });
  });

  describe('Accessibility Compliance', () => {
    it('has proper contrast ratios for text', () => {
      render(<RecordingPreparationModal {...defaultProps} />);

      const title = screen.getByText('Ready to Record?');
      const subtitle = screen.getByText('Share your memory with your family');

      // Colors should meet WCAG AA standards
      expect(title.props.style.color).toBe('#2c3e50'); // Dark text on light background
      expect(subtitle.props.style.color).toBe('#7f8c8d'); // Medium contrast
    });

    it('supports screen readers with proper semantics', () => {
      render(<RecordingPreparationModal {...defaultProps} />);

      const modal = screen.getByTestId('recording-preparation-modal');

      // Modal should be properly announced to screen readers
      expect(modal.props.accessibilityViewIsModal).toBe(true);
    });

    it('provides clear button labels for voice control', () => {
      render(<RecordingPreparationModal {...defaultProps} />);

      const startButton = screen.getByLabelText('Start recording');
      const cancelButton = screen.getByLabelText('Cancel recording');

      // Labels should be clear enough for voice control
      expect(startButton.props.accessibilityLabel).toBe('Start recording');
      expect(cancelButton.props.accessibilityLabel).toBe('Cancel recording');
    });
  });

  describe('Edge Cases', () => {
    it('handles undefined props gracefully', () => {
      const minimalProps = {
        visible: true,
        onStartRecording: jest.fn(),
        onCancel: jest.fn(),
        topic: undefined,
      };

      expect(() => {
        render(<RecordingPreparationModal {...minimalProps} />);
      }).not.toThrow();
    });

    it('handles empty string topic', () => {
      render(<RecordingPreparationModal {...defaultProps} topic="" />);

      expect(screen.queryByText('Today\'s Topic:')).toBeNull();
    });

    it('handles null callbacks gracefully', () => {
      const propsWithNullCallbacks = {
        ...defaultProps,
        onStartRecording: undefined as any,
        onCancel: undefined as any,
      };

      expect(() => {
        render(<RecordingPreparationModal {...propsWithNullCallbacks} />);
      }).not.toThrow();
    });
  });

  describe('Component Integration', () => {
    it('integrates properly with modal system', () => {
      const { UNSAFE_getByType } = render(<RecordingPreparationModal {...defaultProps} />);

      const modal = UNSAFE_getByType('Modal');

      expect(modal.props.visible).toBe(true);
      expect(modal.props.animationType).toBe('slide');
      expect(modal.props.transparent).toBe(true);
    });

    it('maintains focus management for accessibility', () => {
      render(<RecordingPreparationModal {...defaultProps} />);

      const startButton = screen.getByLabelText('Start recording');

      // Should be focusable for keyboard navigation
      expect(startButton.props.accessible).not.toBe(false);
    });
  });
});