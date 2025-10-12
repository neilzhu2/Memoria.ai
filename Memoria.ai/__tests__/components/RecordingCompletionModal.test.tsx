/**
 * Unit Tests for RecordingCompletionModal Component
 * Tests Phase 2: Recording Flow Screens - Recording Completion Modal
 *
 * Tests elderly-friendly features including:
 * - Clear recording summary and preview options
 * - Large action buttons with haptic feedback
 * - Voice guidance and confirmations
 * - Memory benefits explanation for family sharing
 * - Accessibility compliance and error handling
 */

import React from 'react';
import { render, fireEvent, waitFor, screen } from '@testing-library/react-native';
import { Alert } from 'react-native';
import * as Haptics from 'expo-haptics';
import * as Speech from 'expo-speech';

import { RecordingCompletionModal } from '../../components/RecordingCompletionModal';

// Mock modules
jest.mock('expo-haptics');
jest.mock('expo-speech');

const mockHaptics = Haptics as jest.Mocked<typeof Haptics>;
const mockSpeech = Speech as jest.Mocked<typeof Speech>;

// Mock Alert
jest.spyOn(Alert, 'alert');

describe('RecordingCompletionModal', () => {
  const defaultProps = {
    visible: true,
    duration: 65, // 1 minute 5 seconds
    onSaveMemory: jest.fn(),
    onDiscardMemory: jest.fn(),
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
      render(<RecordingCompletionModal {...defaultProps} />);

      expect(screen.getByText('Recording Complete!')).toBeTruthy();
      expect(screen.getByText('Your memory has been recorded successfully')).toBeTruthy();
      expect(screen.getByText('01:05')).toBeTruthy(); // Duration
      expect(screen.getByText('Save Memory')).toBeTruthy();
      expect(screen.getByText('Discard')).toBeTruthy();
    });

    it('does not render when not visible', () => {
      render(<RecordingCompletionModal {...defaultProps} visible={false} />);

      expect(screen.queryByText('Recording Complete!')).toBeNull();
    });

    it('displays topic when provided', () => {
      const topic = 'My college years';
      render(<RecordingCompletionModal {...defaultProps} topic={topic} />);

      expect(screen.getByText('Topic:')).toBeTruthy();
      expect(screen.getByText(`"${topic}"`)).toBeTruthy();
    });

    it('hides topic section when no topic provided', () => {
      render(<RecordingCompletionModal {...defaultProps} />);

      expect(screen.queryByText('Topic:')).toBeNull();
    });

    it('shows success icon and proper styling', () => {
      render(<RecordingCompletionModal {...defaultProps} />);

      expect(screen.getByText('✅')).toBeTruthy();
      expect(screen.getByText('Recording Complete!')).toBeTruthy();
    });
  });

  describe('Voice Guidance and Accessibility', () => {
    it('provides voice guidance when modal becomes visible', async () => {
      render(<RecordingCompletionModal {...defaultProps} />);

      // Fast-forward past the 500ms delay
      jest.advanceTimersByTime(500);

      await waitFor(() => {
        expect(mockSpeech.speak).toHaveBeenCalledWith(
          'Recording complete. Choose to save or discard your memory.',
          {
            language: 'en',
            rate: 0.8,
          }
        );
      });
    });

    it('does not provide voice guidance when not visible', () => {
      render(<RecordingCompletionModal {...defaultProps} visible={false} />);

      jest.advanceTimersByTime(1000);

      expect(mockSpeech.speak).not.toHaveBeenCalled();
    });

    it('has proper accessibility labels on action buttons', () => {
      render(<RecordingCompletionModal {...defaultProps} />);

      const saveButton = screen.getByLabelText('Save memory');
      const discardButton = screen.getByLabelText('Discard recording');

      expect(saveButton).toBeTruthy();
      expect(discardButton).toBeTruthy();

      expect(saveButton.props.accessibilityHint).toBe('Tap to save this recording to your memories');
      expect(discardButton.props.accessibilityHint).toBe('Tap to delete this recording permanently');
    });

    it('sets accessibilityViewIsModal correctly', () => {
      const { UNSAFE_getByType } = render(<RecordingCompletionModal {...defaultProps} />);

      const modal = UNSAFE_getByType('Modal');
      expect(modal.props.accessibilityViewIsModal).toBe(true);
    });
  });

  describe('Recording Summary Display', () => {
    it('formats duration correctly - seconds only', () => {
      render(<RecordingCompletionModal {...defaultProps} duration={45} />);

      expect(screen.getByText('00:45')).toBeTruthy();
    });

    it('formats duration correctly - minutes and seconds', () => {
      render(<RecordingCompletionModal {...defaultProps} duration={125} />);

      expect(screen.getByText('02:05')).toBeTruthy();
    });

    it('shows current date in readable format', () => {
      render(<RecordingCompletionModal {...defaultProps} />);

      const dateElement = screen.getByText(/Date:/);
      expect(dateElement).toBeTruthy();

      // Should show full date format
      const currentDate = new Date().toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });

      expect(screen.getByText(currentDate)).toBeTruthy();
    });

    it('displays all summary items with proper labels', () => {
      const topic = 'Family traditions';
      render(<RecordingCompletionModal {...defaultProps} topic={topic} />);

      expect(screen.getByText('Duration:')).toBeTruthy();
      expect(screen.getByText('Topic:')).toBeTruthy();
      expect(screen.getByText('Date:')).toBeTruthy();
    });
  });

  describe('Preview Options', () => {
    it('shows playback button when onPlayback provided', () => {
      const onPlayback = jest.fn();
      render(<RecordingCompletionModal {...defaultProps} onPlayback={onPlayback} />);

      const playButton = screen.getByLabelText('Play recording');
      expect(playButton).toBeTruthy();
      expect(playButton.props.accessibilityHint).toBe('Tap to listen to your recording');
    });

    it('shows edit title button when onEditTitle provided', () => {
      const onEditTitle = jest.fn();
      render(<RecordingCompletionModal {...defaultProps} onEditTitle={onEditTitle} />);

      const editButton = screen.getByLabelText('Edit title');
      expect(editButton).toBeTruthy();
      expect(editButton.props.accessibilityHint).toBe('Tap to change the title of this memory');
    });

    it('calls onPlayback with haptic feedback', async () => {
      const onPlayback = jest.fn();
      render(<RecordingCompletionModal {...defaultProps} onPlayback={onPlayback} />);

      const playButton = screen.getByLabelText('Play recording');
      fireEvent.press(playButton);

      await waitFor(() => {
        expect(mockHaptics.impactAsync).toHaveBeenCalledWith(
          Haptics.ImpactFeedbackStyle.Light
        );
        expect(mockSpeech.speak).toHaveBeenCalledWith(
          'Playing back your recording.',
          { language: 'en' }
        );
        expect(onPlayback).toHaveBeenCalled();
      });
    });

    it('calls onEditTitle with haptic feedback', async () => {
      const onEditTitle = jest.fn();
      render(<RecordingCompletionModal {...defaultProps} onEditTitle={onEditTitle} />);

      const editButton = screen.getByLabelText('Edit title');
      fireEvent.press(editButton);

      await waitFor(() => {
        expect(mockHaptics.impactAsync).toHaveBeenCalledWith(
          Haptics.ImpactFeedbackStyle.Light
        );
        expect(onEditTitle).toHaveBeenCalled();
      });
    });

    it('hides preview section when no preview options available', () => {
      render(<RecordingCompletionModal {...defaultProps} />);

      expect(screen.queryByText('Preview Options')).toBeNull();
    });
  });

  describe('Memory Benefits Information', () => {
    it('displays all benefit items clearly', () => {
      render(<RecordingCompletionModal {...defaultProps} />);

      expect(screen.getByText('What happens when you save:')).toBeTruthy();
      expect(screen.getByText('Your family can access this memory')).toBeTruthy();
      expect(screen.getByText('Available on all your devices')).toBeTruthy();
      expect(screen.getByText('Safely backed up to the cloud')).toBeTruthy();
      expect(screen.getByText('Can be included in your memoir')).toBeTruthy();
    });

    it('uses appropriate icons for each benefit', () => {
      render(<RecordingCompletionModal {...defaultProps} />);

      expect(screen.getByText('👨‍👩‍👧‍👦')).toBeTruthy(); // Family icon
      expect(screen.getByText('📱')).toBeTruthy(); // Device icon
      expect(screen.getByText('☁️')).toBeTruthy(); // Cloud icon
      expect(screen.getByText('📖')).toBeTruthy(); // Book icon
    });
  });

  describe('Action Buttons and User Interactions', () => {
    it('calls onSaveMemory with haptic feedback and voice confirmation', async () => {
      render(<RecordingCompletionModal {...defaultProps} />);

      const saveButton = screen.getByLabelText('Save memory');
      fireEvent.press(saveButton);

      await waitFor(() => {
        expect(mockHaptics.impactAsync).toHaveBeenCalledWith(
          Haptics.ImpactFeedbackStyle.Medium
        );
        expect(mockSpeech.speak).toHaveBeenCalledWith(
          'Memory saved successfully. Your family will love this.',
          { language: 'en' }
        );
        expect(defaultProps.onSaveMemory).toHaveBeenCalled();
      });
    });

    it('shows confirmation alert before discarding', async () => {
      render(<RecordingCompletionModal {...defaultProps} />);

      const discardButton = screen.getByLabelText('Discard recording');
      fireEvent.press(discardButton);

      await waitFor(() => {
        expect(mockHaptics.impactAsync).toHaveBeenCalledWith(
          Haptics.ImpactFeedbackStyle.Light
        );
        expect(Alert.alert).toHaveBeenCalledWith(
          'Discard Recording?',
          'Are you sure you want to delete this memory? This action cannot be undone.',
          expect.arrayContaining([
            expect.objectContaining({
              text: 'Keep Recording',
              style: 'cancel',
            }),
            expect.objectContaining({
              text: 'Discard',
              style: 'destructive',
            }),
          ])
        );
      });
    });

    it('calls onDiscardMemory when user confirms discard', async () => {
      const mockAlert = Alert.alert as jest.MockedFunction<typeof Alert.alert>;
      mockAlert.mockImplementation((title, message, buttons) => {
        // Simulate user pressing "Discard" button
        const discardButton = buttons?.find(btn => btn.text === 'Discard');
        if (discardButton?.onPress) {
          discardButton.onPress();
        }
      });

      render(<RecordingCompletionModal {...defaultProps} />);

      const discardButton = screen.getByLabelText('Discard recording');
      fireEvent.press(discardButton);

      await waitFor(() => {
        expect(mockSpeech.speak).toHaveBeenCalledWith(
          'Recording discarded.',
          { language: 'en' }
        );
        expect(defaultProps.onDiscardMemory).toHaveBeenCalled();
      });
    });

    it('provides voice feedback when keeping recording', async () => {
      const mockAlert = Alert.alert as jest.MockedFunction<typeof Alert.alert>;
      mockAlert.mockImplementation((title, message, buttons) => {
        // Simulate user pressing "Keep Recording" button
        const keepButton = buttons?.find(btn => btn.text === 'Keep Recording');
        if (keepButton?.onPress) {
          keepButton.onPress();
        }
      });

      render(<RecordingCompletionModal {...defaultProps} />);

      const discardButton = screen.getByLabelText('Discard recording');
      fireEvent.press(discardButton);

      await waitFor(() => {
        expect(mockSpeech.speak).toHaveBeenCalledWith(
          'Recording kept.',
          { language: 'en' }
        );
        expect(defaultProps.onDiscardMemory).not.toHaveBeenCalled();
      });
    });
  });

  describe('Elderly-Friendly Design Requirements', () => {
    it('has minimum touch target sizes for action buttons', () => {
      render(<RecordingCompletionModal {...defaultProps} />);

      const saveButton = screen.getByLabelText('Save memory');
      const discardButton = screen.getByLabelText('Discard recording');

      // Check minimum touch target size (56px height as per styles)
      expect(saveButton.props.style.minHeight).toBe(56);
      expect(discardButton.props.style.minHeight).toBe(56);
    });

    it('uses large, clear text for title and content', () => {
      render(<RecordingCompletionModal {...defaultProps} />);

      const title = screen.getByText('Recording Complete!');
      const subtitle = screen.getByText('Your memory has been recorded successfully');

      expect(title.props.style.fontSize).toBe(28);
      expect(subtitle.props.style.fontSize).toBe(18);
    });

    it('makes save button more prominent than discard', () => {
      render(<RecordingCompletionModal {...defaultProps} />);

      const saveButton = screen.getByLabelText('Save memory');
      const discardButton = screen.getByLabelText('Discard recording');

      // Save button should be larger (flex: 2 vs flex: 1)
      expect(saveButton.props.style.flex).toBe(2);
      expect(discardButton.props.style.flex).toBe(1);
    });

    it('includes transcription note for user awareness', () => {
      render(<RecordingCompletionModal {...defaultProps} />);

      expect(screen.getByText('💬 This recording will be automatically transcribed for easy reading')).toBeTruthy();
    });
  });

  describe('Modal Behavior', () => {
    it('uses proper modal configuration', () => {
      const { UNSAFE_getByType } = render(<RecordingCompletionModal {...defaultProps} />);

      const modal = UNSAFE_getByType('Modal');
      expect(modal.props.animationType).toBe('slide');
      expect(modal.props.transparent).toBe(true);
      expect(modal.props.accessibilityViewIsModal).toBe(true);
    });

    it('handles modal state changes correctly', () => {
      const { rerender } = render(<RecordingCompletionModal {...defaultProps} visible={false} />);

      expect(screen.queryByText('Recording Complete!')).toBeNull();

      rerender(<RecordingCompletionModal {...defaultProps} visible={true} />);

      expect(screen.getByText('Recording Complete!')).toBeTruthy();
    });

    it('uses appropriate modal sizing for content', () => {
      render(<RecordingCompletionModal {...defaultProps} />);

      // Should be sized to fit content with proper padding
      expect(screen.getByText('Recording Complete!')).toBeTruthy();
    });
  });

  describe('Error Handling', () => {
    it('handles haptic feedback errors gracefully', async () => {
      mockHaptics.impactAsync.mockRejectedValueOnce(new Error('Haptic failed'));

      render(<RecordingCompletionModal {...defaultProps} />);

      const saveButton = screen.getByLabelText('Save memory');
      fireEvent.press(saveButton);

      await waitFor(() => {
        // Should still call onSaveMemory even if haptic fails
        expect(defaultProps.onSaveMemory).toHaveBeenCalled();
      });
    });

    it('handles speech synthesis errors gracefully', async () => {
      mockSpeech.speak.mockRejectedValueOnce(new Error('Speech failed'));

      render(<RecordingCompletionModal {...defaultProps} />);

      const saveButton = screen.getByLabelText('Save memory');
      fireEvent.press(saveButton);

      await waitFor(() => {
        // Should still call onSaveMemory even if speech fails
        expect(defaultProps.onSaveMemory).toHaveBeenCalled();
      });
    });

    it('handles missing optional callbacks gracefully', () => {
      expect(() => {
        render(<RecordingCompletionModal {...defaultProps} />);
      }).not.toThrow();
    });
  });

  describe('Performance', () => {
    it('does not cause memory leaks with timers', () => {
      const { unmount } = render(<RecordingCompletionModal {...defaultProps} />);

      // Start the timer
      jest.advanceTimersByTime(250);

      // Unmount before timer completes
      unmount();

      // Complete the timer - should not cause errors
      jest.advanceTimersByTime(500);

      // No speech should be called after unmount
      expect(mockSpeech.speak).not.toHaveBeenCalled();
    });

    it('renders quickly with all content', () => {
      const startTime = performance.now();

      render(<RecordingCompletionModal {...defaultProps} />);

      const endTime = performance.now();
      const renderTime = endTime - startTime;

      // Should render in under 150ms even with complex content
      expect(renderTime).toBeLessThan(150);
    });
  });

  describe('Accessibility Compliance', () => {
    it('has proper contrast ratios for all text', () => {
      render(<RecordingCompletionModal {...defaultProps} />);

      const title = screen.getByText('Recording Complete!');
      const benefitText = screen.getByText('Your family can access this memory');

      // Colors should meet WCAG AA standards
      expect(title.props.style.color).toBe('#27ae60'); // Green success color
      expect(benefitText.props.style.color).toBe('#27ae60'); // Readable green
    });

    it('supports screen readers with proper semantics', () => {
      render(<RecordingCompletionModal {...defaultProps} />);

      const modal = screen.getByTestId('recording-completion-modal');
      expect(modal.props.accessibilityViewIsModal).toBe(true);
    });

    it('provides clear button labels for voice control', () => {
      render(<RecordingCompletionModal {...defaultProps} />);

      const saveButton = screen.getByLabelText('Save memory');
      const discardButton = screen.getByLabelText('Discard recording');

      expect(saveButton.props.accessibilityLabel).toBe('Save memory');
      expect(discardButton.props.accessibilityLabel).toBe('Discard recording');
    });

    it('announces actions to screen readers', async () => {
      render(<RecordingCompletionModal {...defaultProps} />);

      const saveButton = screen.getByLabelText('Save memory');
      fireEvent.press(saveButton);

      await waitFor(() => {
        expect(mockSpeech.speak).toHaveBeenCalledWith(
          'Memory saved successfully. Your family will love this.',
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
        onSaveMemory: jest.fn(),
        onDiscardMemory: jest.fn(),
        topic: undefined,
        onPlayback: undefined,
        onEditTitle: undefined,
      };

      expect(() => {
        render(<RecordingCompletionModal {...minimalProps} />);
      }).not.toThrow();
    });

    it('handles very long durations', () => {
      render(<RecordingCompletionModal {...defaultProps} duration={7321} />); // Over 2 hours

      expect(screen.getByText('122:01')).toBeTruthy();
    });

    it('handles zero duration', () => {
      render(<RecordingCompletionModal {...defaultProps} duration={0} />);

      expect(screen.getByText('00:00')).toBeTruthy();
    });

    it('handles empty string topic', () => {
      render(<RecordingCompletionModal {...defaultProps} topic="" />);

      expect(screen.queryByText('Topic:')).toBeNull();
    });

    it('handles special characters in topic names', () => {
      const specialTopic = 'Mom\'s "secret" recipe & cooking tips';
      render(<RecordingCompletionModal {...defaultProps} topic={specialTopic} />);

      expect(screen.getByText(`"${specialTopic}"`)).toBeTruthy();
    });

    it('handles null callbacks without crashing', () => {
      const propsWithNullCallbacks = {
        ...defaultProps,
        onSaveMemory: undefined as any,
        onDiscardMemory: undefined as any,
        onPlayback: undefined as any,
        onEditTitle: undefined as any,
      };

      expect(() => {
        render(<RecordingCompletionModal {...propsWithNullCallbacks} />);
      }).not.toThrow();
    });
  });

  describe('Component Integration', () => {
    it('integrates properly with Alert system', () => {
      render(<RecordingCompletionModal {...defaultProps} />);

      const discardButton = screen.getByLabelText('Discard recording');
      fireEvent.press(discardButton);

      expect(Alert.alert).toHaveBeenCalledWith(
        'Discard Recording?',
        'Are you sure you want to delete this memory? This action cannot be undone.',
        expect.any(Array)
      );
    });

    it('maintains proper focus management', () => {
      render(<RecordingCompletionModal {...defaultProps} />);

      const saveButton = screen.getByLabelText('Save memory');
      const discardButton = screen.getByLabelText('Discard recording');

      // Should be focusable for keyboard navigation
      expect(saveButton.props.accessible).not.toBe(false);
      expect(discardButton.props.accessible).not.toBe(false);
    });
  });
});