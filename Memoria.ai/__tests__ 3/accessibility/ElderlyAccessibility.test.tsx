/**
 * Accessibility Tests for Elderly-Friendly Features
 * Tests Phase 2: Recording Flow Screens - Elderly Accessibility
 *
 * Tests comprehensive accessibility features specifically designed for elderly users:
 * - Large touch targets (80px+ minimum for elderly users)
 * - High contrast ratios (WCAG AAA compliance)
 * - Screen reader support and voice guidance
 * - Voice control compatibility
 * - Simple, clear navigation flows
 * - Error handling with clear feedback
 */

import React from 'react';
import { render, fireEvent, waitFor, screen } from '@testing-library/react-native';
import { AccessibilityInfo, Dimensions } from 'react-native';
import * as Speech from 'expo-speech';
import * as Haptics from 'expo-haptics';

import { RecordingPreparationModal } from '../../components/RecordingPreparationModal';
import { ActiveRecordingModal } from '../../components/ActiveRecordingModal';
import { RecordingCompletionModal } from '../../components/RecordingCompletionModal';
import { RecordingButton } from '../../components/RecordingButton';
import { FloatingRecordButton } from '../../components/FloatingRecordButton';

// Mock modules
jest.mock('expo-speech');
jest.mock('expo-haptics');

const mockSpeech = Speech as jest.Mocked<typeof Speech>;
const mockHaptics = Haptics as jest.Mocked<typeof Haptics>;

// Mock AccessibilityInfo
jest.mock('react-native', () => {
  const ReactNative = jest.requireActual('react-native');
  return {
    ...ReactNative,
    AccessibilityInfo: {
      isScreenReaderEnabled: jest.fn(() => Promise.resolve(true)),
      isVoiceOverRunning: jest.fn(() => Promise.resolve(true)),
      isTalkBackRunning: jest.fn(() => Promise.resolve(false)),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      announceForAccessibility: jest.fn(),
      setAccessibilityFocus: jest.fn(),
    },
  };
});

describe('Elderly Accessibility Features', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Touch Target Size Requirements', () => {
    it('RecordingButton meets elderly-friendly touch target size (80px+)', () => {
      render(<RecordingButton isRecording={false} onPress={jest.fn()} />);

      const button = screen.getByLabelText('Start recording');

      // Should exceed 80px minimum for elderly users
      expect(button.props.style.minHeight).toBeGreaterThanOrEqual(80);
      expect(button.props.style.minWidth).toBeGreaterThanOrEqual(200);
    });

    it('FloatingRecordButton meets elderly-friendly touch target size', () => {
      render(<FloatingRecordButton onPress={jest.fn()} size={80} />);

      const button = screen.getByLabelText('Start recording');

      // Should be at least 80px for elderly users
      expect(button.props.style.width).toBeGreaterThanOrEqual(80);
      expect(button.props.style.height).toBeGreaterThanOrEqual(80);
    });

    it('All modal buttons meet elderly touch target requirements', () => {
      render(<RecordingPreparationModal visible={true} onStartRecording={jest.fn()} onCancel={jest.fn()} />);

      const startButton = screen.getByLabelText('Start recording');
      const cancelButton = screen.getByLabelText('Cancel recording');

      // Both buttons should meet 56px minimum (elderly-friendly)
      expect(startButton.props.style.minHeight).toBe(56);
      expect(cancelButton.props.style.minHeight).toBe(56);
    });

    it('Active recording controls meet touch target requirements', () => {
      render(
        <ActiveRecordingModal
          visible={true}
          duration={30}
          onStopRecording={jest.fn()}
          onPauseRecording={jest.fn()}
        />
      );

      const stopButton = screen.getByLabelText('Stop recording');
      const pauseButton = screen.getByLabelText('Pause recording');

      // Should meet elderly-friendly sizes (80px+)
      expect(stopButton.props.style.minHeight).toBe(80);
      expect(stopButton.props.style.minWidth).toBe(120);
      expect(pauseButton.props.style.minHeight).toBe(80);
      expect(pauseButton.props.style.minWidth).toBe(120);
    });

    it('Completion modal buttons meet accessibility requirements', () => {
      render(
        <RecordingCompletionModal
          visible={true}
          duration={60}
          onSaveMemory={jest.fn()}
          onDiscardMemory={jest.fn()}
        />
      );

      const saveButton = screen.getByLabelText('Save memory');
      const discardButton = screen.getByLabelText('Discard recording');

      expect(saveButton.props.style.minHeight).toBe(56);
      expect(discardButton.props.style.minHeight).toBe(56);
    });
  });

  describe('Typography and Visual Accessibility', () => {
    it('uses large, readable fonts for elderly users', () => {
      render(<RecordingPreparationModal visible={true} onStartRecording={jest.fn()} onCancel={jest.fn()} />);

      const title = screen.getByText('Ready to Record?');
      const subtitle = screen.getByText('Share your memory with your family');

      // Should use large fonts for elderly users
      expect(title.props.style.fontSize).toBe(28);
      expect(subtitle.props.style.fontSize).toBe(18);
    });

    it('provides high contrast text colors', () => {
      render(<RecordingButton isRecording={false} onPress={jest.fn()} />);

      const buttonText = screen.getByText('🎙️ Start Recording');

      // White text on dark background for high contrast
      expect(buttonText.props.style.color).toBe('#FFFFFF');
    });

    it('uses bold fonts for important text', () => {
      render(<RecordingPreparationModal visible={true} onStartRecording={jest.fn()} onCancel={jest.fn()} />);

      const title = screen.getByText('Ready to Record?');

      expect(title.props.style.fontWeight).toBe('bold');
    });

    it('provides adequate line height for readability', () => {
      render(<RecordingCompletionModal visible={true} duration={60} onSaveMemory={jest.fn()} onDiscardMemory={jest.fn()} />);

      const subtitle = screen.getByText('Your memory has been recorded successfully');

      expect(subtitle.props.style.lineHeight).toBe(24);
    });

    it('includes clear visual icons with text', () => {
      render(<RecordingButton isRecording={false} onPress={jest.fn()} />);

      const buttonText = screen.getByText('🎙️ Start Recording');

      // Should include both icon and text for clarity
      expect(buttonText.props.children).toContain('🎙️');
      expect(buttonText.props.children).toContain('Start Recording');
    });
  });

  describe('Screen Reader Support', () => {
    it('provides comprehensive accessibility labels', () => {
      render(<RecordingPreparationModal visible={true} onStartRecording={jest.fn()} onCancel={jest.fn()} />);

      const startButton = screen.getByLabelText('Start recording');
      const cancelButton = screen.getByLabelText('Cancel recording');

      expect(startButton.props.accessibilityLabel).toBe('Start recording');
      expect(cancelButton.props.accessibilityLabel).toBe('Cancel recording');
    });

    it('provides helpful accessibility hints', () => {
      render(<RecordingPreparationModal visible={true} onStartRecording={jest.fn()} onCancel={jest.fn()} />);

      const startButton = screen.getByLabelText('Start recording');
      const cancelButton = screen.getByLabelText('Cancel recording');

      expect(startButton.props.accessibilityHint).toBe('Tap to begin recording your memory');
      expect(cancelButton.props.accessibilityHint).toBe('Tap to go back without recording');
    });

    it('sets proper accessibility roles', () => {
      render(<RecordingButton isRecording={false} onPress={jest.fn()} />);

      const button = screen.getByLabelText('Start recording');

      expect(button.props.accessibilityRole).toBe('button');
    });

    it('provides accessibility state information', () => {
      render(<RecordingButton isRecording={true} onPress={jest.fn()} disabled={false} />);

      const button = screen.getByLabelText('Stop recording');

      expect(button.props.accessibilityState).toEqual({
        disabled: false,
        selected: true,
      });
    });

    it('sets modal accessibility correctly', () => {
      render(<RecordingPreparationModal visible={true} onStartRecording={jest.fn()} onCancel={jest.fn()} />);

      const modal = screen.getByTestId('recording-preparation-modal');

      expect(modal.props.accessibilityViewIsModal).toBe(true);
    });

    it('announces important state changes', async () => {
      render(<RecordingCompletionModal visible={true} duration={60} onSaveMemory={jest.fn()} onDiscardMemory={jest.fn()} />);

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

  describe('Voice Guidance Integration', () => {
    it('provides voice guidance at appropriate speaking rate for elderly users', async () => {
      render(<RecordingPreparationModal visible={true} onStartRecording={jest.fn()} onCancel={jest.fn()} />);

      jest.advanceTimersByTime(500);

      await waitFor(() => {
        expect(mockSpeech.speak).toHaveBeenCalledWith(
          'Ready to record? Follow the instructions on screen.',
          {
            language: 'en',
            rate: 0.8, // Slower rate for elderly users
          }
        );
      });
    });

    it('provides confirmation voice feedback for actions', async () => {
      render(<RecordingPreparationModal visible={true} onStartRecording={jest.fn()} onCancel={jest.fn()} />);

      const startButton = screen.getByLabelText('Start recording');
      fireEvent.press(startButton);

      await waitFor(() => {
        expect(mockSpeech.speak).toHaveBeenCalledWith(
          'Recording started. Please speak clearly.',
          { language: 'en' }
        );
      });
    });

    it('provides voice guidance for complex flows', async () => {
      render(<RecordingCompletionModal visible={true} duration={60} onSaveMemory={jest.fn()} onDiscardMemory={jest.fn()} />);

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

    it('indicates voice guidance is active', () => {
      render(<RecordingPreparationModal visible={true} onStartRecording={jest.fn()} onCancel={jest.fn()} />);

      expect(screen.getByText('🔊 Voice guidance is active to help you through each step')).toBeTruthy();
    });
  });

  describe('Haptic Feedback for Accessibility', () => {
    it('provides appropriate haptic feedback for primary actions', async () => {
      render(<RecordingPreparationModal visible={true} onStartRecording={jest.fn()} onCancel={jest.fn()} />);

      const startButton = screen.getByLabelText('Start recording');
      fireEvent.press(startButton);

      await waitFor(() => {
        expect(mockHaptics.impactAsync).toHaveBeenCalledWith(
          Haptics.ImpactFeedbackStyle.Medium
        );
      });
    });

    it('provides lighter haptic feedback for secondary actions', async () => {
      render(<RecordingPreparationModal visible={true} onStartRecording={jest.fn()} onCancel={jest.fn()} />);

      const cancelButton = screen.getByLabelText('Cancel recording');
      fireEvent.press(cancelButton);

      await waitFor(() => {
        expect(mockHaptics.impactAsync).toHaveBeenCalledWith(
          Haptics.ImpactFeedbackStyle.Light
        );
      });
    });

    it('provides consistent haptic feedback across components', async () => {
      render(<FloatingRecordButton onPress={jest.fn()} />);

      const button = screen.getByLabelText('Start recording');
      fireEvent.press(button);

      await waitFor(() => {
        expect(mockHaptics.impactAsync).toHaveBeenCalledWith(
          Haptics.ImpactFeedbackStyle.Medium
        );
      });
    });
  });

  describe('Clear Visual Hierarchy', () => {
    it('establishes clear visual hierarchy with headings', () => {
      render(<RecordingPreparationModal visible={true} onStartRecording={jest.fn()} onCancel={jest.fn()} />);

      const title = screen.getByText('Ready to Record?');
      const instructionsTitle = screen.getByText('Recording Tips:');

      // Main title should be larger than section titles
      expect(title.props.style.fontSize).toBeGreaterThan(instructionsTitle.props.style.fontSize);
    });

    it('uses consistent spacing for visual grouping', () => {
      render(<RecordingCompletionModal visible={true} duration={60} onSaveMemory={jest.fn()} onDiscardMemory={jest.fn()} />);

      const title = screen.getByText('Recording Complete!');
      const benefitsTitle = screen.getByText('What happens when you save:');

      // Should have consistent font sizes for similar elements
      expect(title.props.style.fontSize).toBe(28);
      expect(benefitsTitle.props.style.fontSize).toBe(18);
    });

    it('groups related information clearly', () => {
      render(<RecordingPreparationModal visible={true} topic="Test topic" onStartRecording={jest.fn()} onCancel={jest.fn()} />);

      expect(screen.getByText('Today\'s Topic:')).toBeTruthy();
      expect(screen.getByText('"Test topic"')).toBeTruthy();
      expect(screen.getByText('Recording Tips:')).toBeTruthy();
    });

    it('uses icons consistently to aid comprehension', () => {
      render(<RecordingPreparationModal visible={true} onStartRecording={jest.fn()} onCancel={jest.fn()} />);

      // Should have icons for each tip
      expect(screen.getByText('🎤')).toBeTruthy();
      expect(screen.getByText('⏱️')).toBeTruthy();
      expect(screen.getByText('💭')).toBeTruthy();
      expect(screen.getByText('✋')).toBeTruthy();
    });
  });

  describe('Error Handling and User Guidance', () => {
    it('provides clear error messages with voice feedback', async () => {
      // Test error handling when haptic feedback fails
      mockHaptics.impactAsync.mockRejectedValueOnce(new Error('Haptic failed'));

      render(<RecordingPreparationModal visible={true} onStartRecording={jest.fn()} onCancel={jest.fn()} />);

      const startButton = screen.getByLabelText('Start recording');
      fireEvent.press(startButton);

      // Should still provide voice guidance even if haptic fails
      await waitFor(() => {
        expect(mockSpeech.speak).toHaveBeenCalledWith(
          'Recording started. Please speak clearly.',
          { language: 'en' }
        );
      });
    });

    it('provides confirmation dialogs with clear options', () => {
      render(<RecordingCompletionModal visible={true} duration={60} onSaveMemory={jest.fn()} onDiscardMemory={jest.fn()} />);

      const discardButton = screen.getByLabelText('Discard recording');
      fireEvent.press(discardButton);

      // Should show confirmation dialog with clear options
      expect(screen.getByText('Discard')).toBeTruthy();
      expect(screen.getByText('Keep Recording')).toBeTruthy();
    });

    it('provides helpful instructions throughout flow', () => {
      render(<RecordingPreparationModal visible={true} onStartRecording={jest.fn()} onCancel={jest.fn()} />);

      // Should provide clear, helpful instructions
      expect(screen.getByText('Speak clearly and at normal volume')).toBeTruthy();
      expect(screen.getByText('Take your time - there\'s no rush')).toBeTruthy();
      expect(screen.getByText('Share details, feelings, and stories')).toBeTruthy();
      expect(screen.getByText('Tap stop when you\'re finished')).toBeTruthy();
    });
  });

  describe('Voice Control Compatibility', () => {
    it('has clear, pronounceable accessibility labels', () => {
      render(<RecordingButton isRecording={false} onPress={jest.fn()} />);

      const button = screen.getByLabelText('Start recording');

      // Label should be clear and easy to pronounce for voice control
      expect(button.props.accessibilityLabel).toBe('Start recording');
      expect(button.props.accessibilityLabel).not.toContain('🎙️'); // No emojis in labels
    });

    it('provides alternative text for emojis and icons', () => {
      render(<RecordingCompletionModal visible={true} duration={60} onSaveMemory={jest.fn()} onDiscardMemory={jest.fn()} />);

      const saveButton = screen.getByLabelText('Save memory');

      // Should have text-only accessibility label
      expect(saveButton.props.accessibilityLabel).toBe('Save memory');
    });

    it('avoids complex accessibility labels', () => {
      render(<FloatingRecordButton onPress={jest.fn()} />);

      const button = screen.getByLabelText('Start recording');

      // Should use simple, clear language
      expect(button.props.accessibilityLabel).toBe('Start recording');
      expect(button.props.accessibilityLabel.length).toBeLessThan(20);
    });
  });

  describe('Cognitive Load Reduction', () => {
    it('limits number of simultaneous actions', () => {
      render(<RecordingPreparationModal visible={true} onStartRecording={jest.fn()} onCancel={jest.fn()} />);

      // Should only show 2 primary actions at most
      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeLessThanOrEqual(2);
    });

    it('uses consistent button placement', () => {
      render(<RecordingCompletionModal visible={true} duration={60} onSaveMemory={jest.fn()} onDiscardMemory={jest.fn()} />);

      const saveButton = screen.getByLabelText('Save memory');
      const discardButton = screen.getByLabelText('Discard recording');

      // Primary action (save) should be more prominent
      expect(saveButton.props.style.flex).toBe(2);
      expect(discardButton.props.style.flex).toBe(1);
    });

    it('provides clear next steps', () => {
      render(<RecordingCompletionModal visible={true} duration={60} onSaveMemory={jest.fn()} onDiscardMemory={jest.fn()} />);

      // Should clearly explain what happens next
      expect(screen.getByText('What happens when you save:')).toBeTruthy();
      expect(screen.getByText('Your family can access this memory')).toBeTruthy();
    });

    it('uses familiar patterns and language', () => {
      render(<RecordingPreparationModal visible={true} onStartRecording={jest.fn()} onCancel={jest.fn()} />);

      // Should use familiar, friendly language
      expect(screen.getByText('Ready to Record?')).toBeTruthy();
      expect(screen.getByText('Share your memory with your family')).toBeTruthy();
    });
  });

  describe('Multi-Device Accessibility', () => {
    it('adapts to different screen sizes while maintaining accessibility', () => {
      const originalDimensions = Dimensions.get('window');

      // Mock smaller screen
      jest.spyOn(Dimensions, 'get').mockReturnValue({
        width: 320,
        height: 568,
      });

      render(<RecordingButton isRecording={false} onPress={jest.fn()} />);

      const button = screen.getByLabelText('Start recording');

      // Should still meet minimum touch targets on small screens
      expect(button.props.style.minHeight).toBeGreaterThanOrEqual(88);

      // Restore original dimensions
      jest.spyOn(Dimensions, 'get').mockReturnValue(originalDimensions);
    });

    it('maintains readability across different pixel densities', () => {
      render(<RecordingPreparationModal visible={true} onStartRecording={jest.fn()} onCancel={jest.fn()} />);

      const title = screen.getByText('Ready to Record?');

      // Should use absolute font sizes that scale properly
      expect(title.props.style.fontSize).toBe(28);
      expect(typeof title.props.style.fontSize).toBe('number');
    });
  });

  describe('Platform-Specific Accessibility', () => {
    it('works with iOS VoiceOver patterns', () => {
      render(<RecordingButton isRecording={false} onPress={jest.fn()} />);

      const button = screen.getByLabelText('Start recording');

      // Should have proper accessibility traits for iOS
      expect(button.props.accessibilityRole).toBe('button');
      expect(button.props.accessibilityLabel).toBeTruthy();
    });

    it('provides appropriate accessibility information', () => {
      render(<ActiveRecordingModal visible={true} duration={30} onStopRecording={jest.fn()} />);

      const modal = screen.getByTestId('active-recording-modal');

      // Should be properly marked as modal
      expect(modal.props.accessibilityViewIsModal).toBe(true);
    });
  });
});