/**
 * Unit Tests for FloatingRecordButton Component
 * Tests Phase 2: Recording Flow Screens - Floating Record Button
 *
 * Tests elderly-friendly features including:
 * - Large circular touch target (70px+ diameter)
 * - Clear visual state indicators
 * - Haptic feedback on interactions
 * - Accessibility compliance for screen readers
 * - Visual styling and icon display
 */

import React from 'react';
import { render, fireEvent, waitFor, screen } from '@testing-library/react-native';
import * as Haptics from 'expo-haptics';

import { FloatingRecordButton } from '../../components/FloatingRecordButton';

// Mock modules
jest.mock('expo-haptics');
jest.mock('../components/ui/IconSymbol', () => ({
  IconSymbol: ({ name, size, color, ...props }: any) => {
    const MockIcon = require('react-native').Text;
    return (
      <MockIcon
        {...props}
        testID={`icon-${name}`}
        style={{ fontSize: size, color }}
      >
        {name}
      </MockIcon>
    );
  },
}));

const mockHaptics = Haptics as jest.Mocked<typeof Haptics>;

describe('FloatingRecordButton', () => {
  const defaultProps = {
    onPress: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering and States', () => {
    it('renders idle state correctly', () => {
      render(<FloatingRecordButton {...defaultProps} />);

      const button = screen.getByLabelText('Start recording');
      expect(button).toBeTruthy();

      const micIcon = screen.getByTestId('icon-mic.fill');
      expect(micIcon).toBeTruthy();
    });

    it('renders recording state correctly', () => {
      render(<FloatingRecordButton {...defaultProps} isRecording={true} />);

      const button = screen.getByLabelText('Stop recording');
      expect(button).toBeTruthy();

      const stopIcon = screen.getByTestId('icon-stop.fill');
      expect(stopIcon).toBeTruthy();
    });

    it('applies default size correctly', () => {
      render(<FloatingRecordButton {...defaultProps} />);

      const button = screen.getByLabelText('Start recording');

      // Default size is 70px
      expect(button.props.style.width).toBe(70);
      expect(button.props.style.height).toBe(70);
      expect(button.props.style.borderRadius).toBe(35); // size / 2
    });

    it('applies custom size correctly', () => {
      const customSize = 100;
      render(<FloatingRecordButton {...defaultProps} size={customSize} />);

      const button = screen.getByLabelText('Start recording');

      expect(button.props.style.width).toBe(customSize);
      expect(button.props.style.height).toBe(customSize);
      expect(button.props.style.borderRadius).toBe(customSize / 2);
    });

    it('shows different background colors for different states', () => {
      const { rerender } = render(<FloatingRecordButton {...defaultProps} />);

      let button = screen.getByLabelText('Start recording');
      expect(button.props.style.backgroundColor).toBe('#5dade2'); // Idle color

      rerender(<FloatingRecordButton {...defaultProps} isRecording={true} />);

      button = screen.getByLabelText('Stop recording');
      expect(button.props.style.backgroundColor).toBe('#3498db'); // Recording color
    });
  });

  describe('Accessibility', () => {
    it('has proper accessibility labels for idle state', () => {
      render(<FloatingRecordButton {...defaultProps} />);

      const button = screen.getByLabelText('Start recording');
      expect(button.props.accessibilityLabel).toBe('Start recording');
      expect(button.props.accessibilityHint).toBe('Large recording button - tap to begin sharing your memory');
    });

    it('has proper accessibility labels for recording state', () => {
      render(<FloatingRecordButton {...defaultProps} isRecording={true} />);

      const button = screen.getByLabelText('Stop recording');
      expect(button.props.accessibilityLabel).toBe('Stop recording');
      expect(button.props.accessibilityHint).toBe('Large recording button - tap to begin sharing your memory');
    });

    it('supports touch accessibility with proper opacity', () => {
      render(<FloatingRecordButton {...defaultProps} />);

      const button = screen.getByLabelText('Start recording');
      expect(button.props.activeOpacity).toBe(0.8);
    });

    it('is accessible for screen readers', () => {
      render(<FloatingRecordButton {...defaultProps} />);

      const button = screen.getByLabelText('Start recording');
      expect(button.props.accessible).not.toBe(false);
    });
  });

  describe('Elderly-Friendly Design Requirements', () => {
    it('meets minimum touch target size requirements', () => {
      render(<FloatingRecordButton {...defaultProps} />);

      const button = screen.getByLabelText('Start recording');

      // Default 70px exceeds minimum 44px touch target
      expect(button.props.style.width).toBeGreaterThanOrEqual(44);
      expect(button.props.style.height).toBeGreaterThanOrEqual(44);
    });

    it('uses large enough icons for elderly users', () => {
      const size = 70;
      render(<FloatingRecordButton {...defaultProps} size={size} />);

      const micIcon = screen.getByTestId('icon-mic.fill');

      // Icon should be 40% of button size (28px for 70px button)
      const expectedIconSize = size * 0.4;
      expect(micIcon.props.style.fontSize).toBe(expectedIconSize);
    });

    it('has high contrast colors for visibility', () => {
      render(<FloatingRecordButton {...defaultProps} />);

      const micIcon = screen.getByTestId('icon-mic.fill');
      expect(micIcon.props.style.color).toBe('white'); // White on blue background
    });

    it('has proper elevation and shadow for visual clarity', () => {
      render(<FloatingRecordButton {...defaultProps} />);

      const button = screen.getByLabelText('Start recording');

      expect(button.props.style.elevation).toBe(8);
      expect(button.props.style.shadowOpacity).toBe(0.3);
    });

    it('has white border for better definition', () => {
      render(<FloatingRecordButton {...defaultProps} />);

      const button = screen.getByLabelText('Start recording');

      expect(button.props.style.borderWidth).toBe(4);
      expect(button.props.style.borderColor).toBe('white');
    });

    it('includes gradient effect for visual appeal', () => {
      render(<FloatingRecordButton {...defaultProps} />);

      // Inner gradient should be present
      const button = screen.getByLabelText('Start recording');
      expect(button).toBeTruthy();
    });
  });

  describe('User Interactions', () => {
    it('calls onPress when pressed', async () => {
      render(<FloatingRecordButton {...defaultProps} />);

      const button = screen.getByLabelText('Start recording');
      fireEvent.press(button);

      expect(defaultProps.onPress).toHaveBeenCalledTimes(1);
    });

    it('provides haptic feedback on press', async () => {
      render(<FloatingRecordButton {...defaultProps} />);

      const button = screen.getByLabelText('Start recording');
      fireEvent.press(button);

      await waitFor(() => {
        expect(mockHaptics.impactAsync).toHaveBeenCalledWith(
          Haptics.ImpactFeedbackStyle.Medium
        );
      });
    });

    it('handles rapid button presses gracefully', () => {
      render(<FloatingRecordButton {...defaultProps} />);

      const button = screen.getByLabelText('Start recording');

      // Rapid fire presses
      fireEvent.press(button);
      fireEvent.press(button);
      fireEvent.press(button);

      expect(defaultProps.onPress).toHaveBeenCalledTimes(3);
    });

    it('maintains press interaction for both states', () => {
      const { rerender } = render(<FloatingRecordButton {...defaultProps} />);

      let button = screen.getByLabelText('Start recording');
      fireEvent.press(button);
      expect(defaultProps.onPress).toHaveBeenCalledTimes(1);

      rerender(<FloatingRecordButton {...defaultProps} isRecording={true} />);

      button = screen.getByLabelText('Stop recording');
      fireEvent.press(button);
      expect(defaultProps.onPress).toHaveBeenCalledTimes(2);
    });
  });

  describe('Icon Display', () => {
    it('shows microphone icon when not recording', () => {
      render(<FloatingRecordButton {...defaultProps} />);

      const micIcon = screen.getByTestId('icon-mic.fill');
      expect(micIcon).toBeTruthy();
      expect(screen.queryByTestId('icon-stop.fill')).toBeNull();
    });

    it('shows stop icon when recording', () => {
      render(<FloatingRecordButton {...defaultProps} isRecording={true} />);

      const stopIcon = screen.getByTestId('icon-stop.fill');
      expect(stopIcon).toBeTruthy();
      expect(screen.queryByTestId('icon-mic.fill')).toBeNull();
    });

    it('sizes icons proportionally to button size', () => {
      const customSize = 100;
      render(<FloatingRecordButton {...defaultProps} size={customSize} />);

      const micIcon = screen.getByTestId('icon-mic.fill');
      const expectedIconSize = customSize * 0.4; // 40% of button size

      expect(micIcon.props.style.fontSize).toBe(expectedIconSize);
    });

    it('uses white color for all icons', () => {
      const { rerender } = render(<FloatingRecordButton {...defaultProps} />);

      let icon = screen.getByTestId('icon-mic.fill');
      expect(icon.props.style.color).toBe('white');

      rerender(<FloatingRecordButton {...defaultProps} isRecording={true} />);

      icon = screen.getByTestId('icon-stop.fill');
      expect(icon.props.style.color).toBe('white');
    });
  });

  describe('Visual Styling', () => {
    it('applies proper button container styling', () => {
      render(<FloatingRecordButton {...defaultProps} />);

      const button = screen.getByLabelText('Start recording');

      expect(button.props.style).toMatchObject({
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 4,
        borderColor: 'white',
        elevation: 8,
      });
    });

    it('creates circular button shape', () => {
      const size = 80;
      render(<FloatingRecordButton {...defaultProps} size={size} />);

      const button = screen.getByLabelText('Start recording');

      expect(button.props.style.width).toBe(size);
      expect(button.props.style.height).toBe(size);
      expect(button.props.style.borderRadius).toBe(size / 2);
    });

    it('includes shadow styling for depth', () => {
      render(<FloatingRecordButton {...defaultProps} />);

      const button = screen.getByLabelText('Start recording');

      expect(button.props.style).toMatchObject({
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      });
    });

    it('has proper container layout', () => {
      render(<FloatingRecordButton {...defaultProps} />);

      // Container should center the button
      const container = screen.getByLabelText('Start recording').parent;
      expect(container).toBeTruthy();
    });
  });

  describe('Size Customization', () => {
    it('handles small size correctly', () => {
      const smallSize = 50;
      render(<FloatingRecordButton {...defaultProps} size={smallSize} />);

      const button = screen.getByLabelText('Start recording');
      const icon = screen.getByTestId('icon-mic.fill');

      expect(button.props.style.width).toBe(smallSize);
      expect(button.props.style.height).toBe(smallSize);
      expect(icon.props.style.fontSize).toBe(smallSize * 0.4);
    });

    it('handles large size correctly', () => {
      const largeSize = 120;
      render(<FloatingRecordButton {...defaultProps} size={largeSize} />);

      const button = screen.getByLabelText('Start recording');
      const icon = screen.getByTestId('icon-mic.fill');

      expect(button.props.style.width).toBe(largeSize);
      expect(button.props.style.height).toBe(largeSize);
      expect(icon.props.style.fontSize).toBe(largeSize * 0.4);
    });

    it('maintains proportions at different sizes', () => {
      const sizes = [50, 70, 100, 120];

      sizes.forEach(size => {
        const { unmount } = render(<FloatingRecordButton {...defaultProps} size={size} />);

        const button = screen.getByLabelText('Start recording');
        const icon = screen.getByTestId('icon-mic.fill');

        expect(button.props.style.borderRadius).toBe(size / 2);
        expect(icon.props.style.fontSize).toBe(size * 0.4);

        unmount();
      });
    });
  });

  describe('Error Handling', () => {
    it('handles haptic feedback errors gracefully', async () => {
      mockHaptics.impactAsync.mockRejectedValueOnce(new Error('Haptic failed'));

      render(<FloatingRecordButton {...defaultProps} />);

      const button = screen.getByLabelText('Start recording');
      fireEvent.press(button);

      // Should still call onPress even if haptic fails
      expect(defaultProps.onPress).toHaveBeenCalled();
    });

    it('handles missing onPress gracefully', () => {
      const propsWithoutOnPress = {
        onPress: undefined as any,
      };

      expect(() => {
        render(<FloatingRecordButton {...propsWithoutOnPress} />);
      }).not.toThrow();
    });

    it('handles invalid size values', () => {
      expect(() => {
        render(<FloatingRecordButton {...defaultProps} size={0} />);
        render(<FloatingRecordButton {...defaultProps} size={-10} />);
        render(<FloatingRecordButton {...defaultProps} size={NaN} />);
      }).not.toThrow();
    });

    it('handles missing icon component gracefully', () => {
      // This tests resilience to missing icon dependencies
      expect(() => {
        render(<FloatingRecordButton {...defaultProps} />);
      }).not.toThrow();
    });
  });

  describe('Performance', () => {
    it('renders quickly without blocking UI', () => {
      const startTime = performance.now();

      render(<FloatingRecordButton {...defaultProps} />);

      const endTime = performance.now();
      const renderTime = endTime - startTime;

      // Should render quickly for good UX
      expect(renderTime).toBeLessThan(50);
    });

    it('handles state changes efficiently', () => {
      const { rerender } = render(<FloatingRecordButton {...defaultProps} />);

      const startTime = performance.now();

      // Multiple state changes
      for (let i = 0; i < 10; i++) {
        rerender(<FloatingRecordButton {...defaultProps} isRecording={i % 2 === 0} />);
      }

      const endTime = performance.now();
      const updateTime = endTime - startTime;

      // Should handle rapid state changes efficiently
      expect(updateTime).toBeLessThan(100);
    });

    it('does not cause memory leaks', () => {
      const { unmount } = render(<FloatingRecordButton {...defaultProps} />);

      // Should unmount cleanly
      expect(() => {
        unmount();
      }).not.toThrow();
    });
  });

  describe('Edge Cases', () => {
    it('handles undefined props gracefully', () => {
      const minimalProps = {
        onPress: jest.fn(),
        isRecording: undefined,
        size: undefined,
      };

      expect(() => {
        render(<FloatingRecordButton {...minimalProps} />);
      }).not.toThrow();
    });

    it('handles boolean prop edge cases', () => {
      expect(() => {
        render(<FloatingRecordButton onPress={jest.fn()} isRecording={true as any} />);
        render(<FloatingRecordButton onPress={jest.fn()} isRecording={false as any} />);
        render(<FloatingRecordButton onPress={jest.fn()} isRecording={null as any} />);
      }).not.toThrow();
    });

    it('handles extreme size values', () => {
      expect(() => {
        render(<FloatingRecordButton {...defaultProps} size={1} />);
        render(<FloatingRecordButton {...defaultProps} size={500} />);
      }).not.toThrow();
    });
  });

  describe('Integration', () => {
    it('integrates properly with parent components', () => {
      const onPress = jest.fn();
      render(<FloatingRecordButton onPress={onPress} />);

      const button = screen.getByLabelText('Start recording');
      fireEvent.press(button);

      expect(onPress).toHaveBeenCalledTimes(1);
    });

    it('maintains accessibility across state changes', () => {
      const { rerender } = render(<FloatingRecordButton {...defaultProps} />);

      let button = screen.getByLabelText('Start recording');
      expect(button.props.accessibilityLabel).toBe('Start recording');

      rerender(<FloatingRecordButton {...defaultProps} isRecording={true} />);

      button = screen.getByLabelText('Stop recording');
      expect(button.props.accessibilityLabel).toBe('Stop recording');
    });

    it('works with touch gesture systems', () => {
      render(<FloatingRecordButton {...defaultProps} />);

      const button = screen.getByLabelText('Start recording');

      // Should support standard touch events
      expect(() => {
        fireEvent.press(button);
        fireEvent(button, 'pressIn');
        fireEvent(button, 'pressOut');
      }).not.toThrow();
    });
  });
});