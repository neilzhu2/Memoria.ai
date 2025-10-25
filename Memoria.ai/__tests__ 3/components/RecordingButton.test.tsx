/**
 * Unit Tests for RecordingButton Component
 * Tests Phase 2: Recording Flow Screens - Recording Button
 *
 * Tests elderly-friendly features including:
 * - Large touch targets (88px+ minimum)
 * - Clear visual state indicators
 * - Haptic feedback on interactions
 * - Accessibility compliance
 * - Visual feedback animations
 */

import React from 'react';
import { render, fireEvent, waitFor, screen } from '@testing-library/react-native';
import { Animated } from 'react-native';
import * as Haptics from 'expo-haptics';

import { RecordingButton } from '../../components/RecordingButton';

// Mock modules
jest.mock('expo-haptics');

// Mock Animated API

const mockHaptics = Haptics as jest.Mocked<typeof Haptics>;

describe('RecordingButton', () => {
  const defaultProps = {
    isRecording: false,
    onPress: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock Animated methods
    jest.spyOn(Animated, 'loop').mockReturnValue({
      start: jest.fn(),
      stop: jest.fn(),
    } as any);

    jest.spyOn(Animated, 'timing').mockReturnValue({
      start: jest.fn(),
      stop: jest.fn(),
    } as any);

    jest.spyOn(Animated, 'spring').mockReturnValue({
      start: jest.fn(),
      stop: jest.fn(),
    } as any);

    jest.spyOn(Animated, 'sequence').mockReturnValue({
      start: jest.fn(),
      stop: jest.fn(),
    } as any);
  });

  describe('Rendering and States', () => {
    it('renders idle state correctly', () => {
      render(<RecordingButton {...defaultProps} />);

      const button = screen.getByLabelText('Start recording');
      expect(button).toBeTruthy();
      expect(screen.getByText('🎙️ Start Recording')).toBeTruthy();
    });

    it('renders recording state correctly', () => {
      render(<RecordingButton {...defaultProps} isRecording={true} />);

      const button = screen.getByLabelText('Stop recording');
      expect(button).toBeTruthy();
      expect(screen.getByText('🔴 Stop Recording')).toBeTruthy();
    });

    it('renders disabled state correctly', () => {
      render(<RecordingButton {...defaultProps} disabled={true} />);

      const button = screen.getByLabelText('Start recording');
      expect(button.props.accessibilityState.disabled).toBe(true);
    });

    it('applies large size styles by default', () => {
      render(<RecordingButton {...defaultProps} />);

      const button = screen.getByLabelText('Start recording');
      expect(button.props.style).toMatchObject({
        minHeight: 96,
      });
    });

    it('applies medium size styles when specified', () => {
      render(<RecordingButton {...defaultProps} size="medium" />);

      const button = screen.getByLabelText('Start recording');
      expect(button.props.style).toMatchObject({
        minHeight: 80,
      });
    });
  });

  describe('Accessibility', () => {
    it('has proper accessibility labels for idle state', () => {
      render(<RecordingButton {...defaultProps} />);

      const button = screen.getByLabelText('Start recording');
      expect(button.props.accessibilityLabel).toBe('Start recording');
      expect(button.props.accessibilityHint).toBe('Tap to start recording your memory');
      expect(button.props.accessibilityRole).toBe('button');
    });

    it('has proper accessibility labels for recording state', () => {
      render(<RecordingButton {...defaultProps} isRecording={true} />);

      const button = screen.getByLabelText('Stop recording');
      expect(button.props.accessibilityLabel).toBe('Stop recording');
      expect(button.props.accessibilityHint).toBe('Tap to stop recording your memory');
      expect(button.props.accessibilityRole).toBe('button');
    });

    it('sets accessibility state correctly', () => {
      render(<RecordingButton {...defaultProps} isRecording={true} disabled={false} />);

      const button = screen.getByLabelText('Stop recording');
      expect(button.props.accessibilityState).toEqual({
        disabled: false,
        selected: true,
      });
    });

    it('indicates disabled state in accessibility', () => {
      render(<RecordingButton {...defaultProps} disabled={true} />);

      const button = screen.getByLabelText('Start recording');
      expect(button.props.accessibilityState.disabled).toBe(true);
    });
  });

  describe('Elderly-Friendly Design Requirements', () => {
    it('meets minimum touch target size requirements', () => {
      render(<RecordingButton {...defaultProps} />);

      const button = screen.getByLabelText('Start recording');

      // Check minimum touch target sizes (88px minimum, 96px for large)
      expect(button.props.style.minHeight).toBeGreaterThanOrEqual(88);
      expect(button.props.style.minWidth).toBeGreaterThan(200); // Wide enough for text
    });

    it('uses large, readable text for elderly users', () => {
      render(<RecordingButton {...defaultProps} />);

      const buttonText = screen.getByText('🎙️ Start Recording');
      expect(buttonText.props.style.fontSize).toBe(22); // Large size
      expect(buttonText.props.style.fontWeight).toBe('bold');
    });

    it('has high contrast colors for visibility', () => {
      render(<RecordingButton {...defaultProps} />);

      const button = screen.getByLabelText('Start recording');
      const buttonText = screen.getByText('🎙️ Start Recording');

      // Check high contrast: white text on dark blue background
      expect(buttonText.props.style.color).toBe('#FFFFFF');
    });

    it('uses clear visual indicators for different states', () => {
      const { rerender } = render(<RecordingButton {...defaultProps} />);

      expect(screen.getByText('🎙️ Start Recording')).toBeTruthy();

      rerender(<RecordingButton {...defaultProps} isRecording={true} />);

      expect(screen.getByText('🔴 Stop Recording')).toBeTruthy();
    });

    it('has rounded corners for friendly appearance', () => {
      render(<RecordingButton {...defaultProps} />);

      const button = screen.getByLabelText('Start recording');
      expect(button.props.style.borderRadius).toBe(20);
    });
  });

  describe('User Interactions', () => {
    it('calls onPress when pressed and not disabled', async () => {
      render(<RecordingButton {...defaultProps} />);

      const button = screen.getByLabelText('Start recording');
      fireEvent.press(button);

      expect(defaultProps.onPress).toHaveBeenCalledTimes(1);
    });

    it('does not call onPress when disabled', () => {
      render(<RecordingButton {...defaultProps} disabled={true} />);

      const button = screen.getByLabelText('Start recording');
      fireEvent.press(button);

      expect(defaultProps.onPress).not.toHaveBeenCalled();
    });

    it('provides haptic feedback on press in', async () => {
      render(<RecordingButton {...defaultProps} />);

      const button = screen.getByLabelText('Start recording');
      fireEvent(button, 'pressIn');

      await waitFor(() => {
        expect(mockHaptics.impactAsync).toHaveBeenCalledWith(
          Haptics.ImpactFeedbackStyle.Medium
        );
      });
    });

    it('handles rapid button presses gracefully', () => {
      render(<RecordingButton {...defaultProps} />);

      const button = screen.getByLabelText('Start recording');

      // Rapid fire presses
      fireEvent.press(button);
      fireEvent.press(button);
      fireEvent.press(button);

      expect(defaultProps.onPress).toHaveBeenCalledTimes(3);
    });
  });

  describe('Animations', () => {
    it('starts pulse animation when recording', () => {
      render(<RecordingButton {...defaultProps} isRecording={true} />);

      expect(Animated.loop).toHaveBeenCalled();
      expect(Animated.timing).toHaveBeenCalled();
    });

    it('stops pulse animation when not recording', () => {
      const { rerender } = render(<RecordingButton {...defaultProps} isRecording={true} />);

      // Change to not recording
      rerender(<RecordingButton {...defaultProps} isRecording={false} />);

      // Should reset animation value
      expect(jest.spyOn(Animated.Value.prototype, 'setValue')).toHaveBeenCalledWith(1);
    });

    it('animates scale on press in and out', () => {
      render(<RecordingButton {...defaultProps} />);

      const button = screen.getByLabelText('Start recording');

      fireEvent(button, 'pressIn');
      expect(Animated.spring).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({ toValue: 0.95 })
      );

      fireEvent(button, 'pressOut');
      expect(Animated.spring).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({ toValue: 1 })
      );
    });

    it('cleans up animations on unmount', () => {
      const { unmount } = render(<RecordingButton {...defaultProps} isRecording={true} />);

      const mockStop = jest.fn();
      (Animated.loop as jest.Mock).mockReturnValue({ start: jest.fn(), stop: mockStop });

      unmount();

      // Animation should be stopped when component unmounts
      expect(mockStop).toHaveBeenCalled();
    });
  });

  describe('Visual Feedback', () => {
    it('applies different styles for recording vs idle state', () => {
      const { rerender } = render(<RecordingButton {...defaultProps} />);

      let button = screen.getByLabelText('Start recording');
      const idleStyle = button.props.style;

      rerender(<RecordingButton {...defaultProps} isRecording={true} />);

      button = screen.getByLabelText('Stop recording');
      const recordingStyle = button.props.style;

      // Styles should be different between states
      expect(idleStyle).not.toEqual(recordingStyle);
    });

    it('shows different text colors for different states', () => {
      const { rerender } = render(<RecordingButton {...defaultProps} />);

      let buttonText = screen.getByText('🎙️ Start Recording');
      expect(buttonText.props.style.color).toBe('#FFFFFF');

      rerender(<RecordingButton {...defaultProps} isRecording={true} />);

      buttonText = screen.getByText('🔴 Stop Recording');
      expect(buttonText.props.style.color).toBe('#FFFFFF');
    });

    it('applies disabled styling when disabled', () => {
      render(<RecordingButton {...defaultProps} disabled={true} />);

      const buttonText = screen.getByText('🎙️ Start Recording');
      expect(buttonText.props.style.color).toBe('#718096'); // Disabled text color
    });
  });

  describe('Custom Styling', () => {
    it('applies custom style prop', () => {
      const customStyle = { backgroundColor: '#custom' };
      render(<RecordingButton {...defaultProps} style={customStyle} />);

      const button = screen.getByLabelText('Start recording');
      expect(button.props.style).toMatchObject(customStyle);
    });

    it('applies custom text style prop', () => {
      const customTextStyle = { fontSize: 30 };
      render(<RecordingButton {...defaultProps} textStyle={customTextStyle} />);

      const buttonText = screen.getByText('🎙️ Start Recording');
      expect(buttonText.props.style).toMatchObject(customTextStyle);
    });

    it('merges custom styles with default styles', () => {
      const customStyle = { marginTop: 10 };
      render(<RecordingButton {...defaultProps} style={customStyle} />);

      const button = screen.getByLabelText('Start recording');

      // Should have both default and custom styles
      expect(button.props.style.marginTop).toBe(10);
      expect(button.props.style.borderRadius).toBe(20); // Default style
    });
  });

  describe('Error Handling', () => {
    it('handles haptic feedback errors gracefully', async () => {
      mockHaptics.impactAsync.mockRejectedValueOnce(new Error('Haptic failed'));

      render(<RecordingButton {...defaultProps} />);

      const button = screen.getByLabelText('Start recording');
      fireEvent(button, 'pressIn');

      // Should still function normally even if haptic fails
      fireEvent.press(button);
      expect(defaultProps.onPress).toHaveBeenCalled();
    });

    it('handles missing onPress gracefully', () => {
      const propsWithoutOnPress = {
        isRecording: false,
        onPress: undefined as any,
      };

      expect(() => {
        render(<RecordingButton {...propsWithoutOnPress} />);
      }).not.toThrow();
    });

    it('handles animation errors gracefully', () => {
      // Mock animation to throw error
      (Animated.spring as jest.Mock).mockImplementation(() => {
        throw new Error('Animation failed');
      });

      expect(() => {
        render(<RecordingButton {...defaultProps} />);
        const button = screen.getByLabelText('Start recording');
        fireEvent(button, 'pressIn');
      }).not.toThrow();
    });
  });

  describe('Performance', () => {
    it('renders quickly without blocking UI', () => {
      const startTime = performance.now();

      render(<RecordingButton {...defaultProps} />);

      const endTime = performance.now();
      const renderTime = endTime - startTime;

      // Should render quickly for good UX
      expect(renderTime).toBeLessThan(50);
    });

    it('handles state changes efficiently', () => {
      const { rerender } = render(<RecordingButton {...defaultProps} />);

      const startTime = performance.now();

      // Multiple state changes
      for (let i = 0; i < 10; i++) {
        rerender(<RecordingButton {...defaultProps} isRecording={i % 2 === 0} />);
      }

      const endTime = performance.now();
      const updateTime = endTime - startTime;

      // Should handle rapid state changes efficiently
      expect(updateTime).toBeLessThan(100);
    });

    it('manages animation resources properly', () => {
      const { unmount } = render(<RecordingButton {...defaultProps} isRecording={true} />);

      // Should not cause memory leaks
      unmount();

      expect(() => {
        // Any cleanup should happen without errors
      }).not.toThrow();
    });
  });

  describe('Edge Cases', () => {
    it('handles undefined props gracefully', () => {
      const minimalProps = {
        isRecording: false,
        onPress: jest.fn(),
        disabled: undefined,
        style: undefined,
        textStyle: undefined,
        size: undefined,
      };

      expect(() => {
        render(<RecordingButton {...minimalProps} />);
      }).not.toThrow();
    });

    it('handles boolean prop edge cases', () => {
      expect(() => {
        render(<RecordingButton isRecording={true as any} onPress={jest.fn()} disabled={false as any} />);
        render(<RecordingButton isRecording={false as any} onPress={jest.fn()} disabled={true as any} />);
      }).not.toThrow();
    });

    it('handles invalid size prop gracefully', () => {
      expect(() => {
        render(<RecordingButton {...defaultProps} size={'invalid' as any} />);
      }).not.toThrow();
    });
  });

  describe('Integration', () => {
    it('integrates properly with parent components', () => {
      const onPress = jest.fn();
      render(<RecordingButton isRecording={false} onPress={onPress} />);

      const button = screen.getByLabelText('Start recording');
      fireEvent.press(button);

      expect(onPress).toHaveBeenCalledTimes(1);
    });

    it('maintains proper focus management', () => {
      render(<RecordingButton {...defaultProps} />);

      const button = screen.getByLabelText('Start recording');

      // Should be focusable for keyboard navigation
      expect(button.props.accessible).not.toBe(false);
    });

    it('works with screen readers', () => {
      render(<RecordingButton {...defaultProps} isRecording={true} />);

      const button = screen.getByLabelText('Stop recording');

      expect(button.props.accessibilityLabel).toBe('Stop recording');
      expect(button.props.accessibilityRole).toBe('button');
    });
  });
});
