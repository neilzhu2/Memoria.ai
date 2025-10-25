/**
 * Unit Tests for ElderlyRecordingButton Component
 * Tests Phase 2: Recording Flow Screens - Elderly-Optimized Recording Button
 *
 * Tests elderly-friendly features including:
 * - Extra-large touch targets (120px+ for elderly users)
 * - Clear visual states and feedback
 * - Voice guidance with slower speech rate
 * - Enhanced haptic feedback options
 * - Duration display and status indicators
 * - Accessibility compliance for screen readers
 */

import React from 'react';
import { render, fireEvent, waitFor, screen } from '@testing-library/react-native';
import { Animated } from 'react-native';
import * as Haptics from 'expo-haptics';
import * as Speech from 'expo-speech';

import { ElderlyRecordingButton } from '../../../components/recording-flow/ui/ElderlyRecordingButton';

// Mock dependencies
jest.mock('expo-haptics');
jest.mock('expo-speech');

jest.mock('../../../components/ui/IconSymbol', () => ({
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

jest.mock('../../../constants/Colors', () => ({
  Colors: {
    light: {
      background: '#ffffff',
      text: '#000000',
    },
    dark: {
      background: '#000000',
      text: '#ffffff',
    },
  },
}));

jest.mock('../../../hooks/useColorScheme', () => ({
  useColorScheme: jest.fn(() => 'light'),
}));

// Mock Animated API
jest.mock('react-native/Libraries/Animated/NativeAnimatedHelper');

const mockHaptics = Haptics as jest.Mocked<typeof Haptics>;
const mockSpeech = Speech as jest.Mocked<typeof Speech>;

describe('ElderlyRecordingButton', () => {
  const defaultProps = {
    phase: 'idle' as const,
    isRecording: false,
    isPaused: false,
    onPress: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();

    // Mock Animated methods
    jest.spyOn(Animated, 'timing').mockReturnValue({
      start: jest.fn(),
      stop: jest.fn(),
    } as any);

    jest.spyOn(Animated, 'loop').mockReturnValue({
      start: jest.fn(),
      stop: jest.fn(),
    } as any);

    jest.spyOn(Animated, 'sequence').mockReturnValue({
      start: jest.fn(),
      stop: jest.fn(),
    } as any);

    jest.spyOn(Animated.Value.prototype, 'setValue').mockImplementation(jest.fn());
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  describe('Rendering and States', () => {
    it('renders idle state correctly', () => {
      render(<ElderlyRecordingButton {...defaultProps} />);

      expect(screen.getByText('Start Recording')).toBeTruthy();
      expect(screen.getByTestId('icon-mic.fill')).toBeTruthy();
    });

    it('renders recording state correctly', () => {
      render(<ElderlyRecordingButton {...defaultProps} isRecording={true} />);

      expect(screen.getByText('Stop Recording')).toBeTruthy();
      expect(screen.getByTestId('icon-stop.fill')).toBeTruthy();
    });

    it('renders paused state correctly', () => {
      render(<ElderlyRecordingButton {...defaultProps} isPaused={true} />);

      expect(screen.getByText('Resume Recording')).toBeTruthy();
      expect(screen.getByTestId('icon-play.fill')).toBeTruthy();
    });

    it('renders processing state correctly', () => {
      render(<ElderlyRecordingButton {...defaultProps} phase="processing" />);

      expect(screen.getByText('Processing...')).toBeTruthy();
      expect(screen.getByTestId('icon-hourglass')).toBeTruthy();
      expect(screen.getByText('Please wait...')).toBeTruthy();
    });

    it('renders disabled state correctly', () => {
      render(<ElderlyRecordingButton {...defaultProps} disabled={true} />);

      expect(screen.getByText('Not Available')).toBeTruthy();
      expect(screen.getByTestId('icon-mic.slash.fill')).toBeTruthy();
    });

    it('shows recording indicator when recording and visual feedback enabled', () => {
      render(
        <ElderlyRecordingButton
          {...defaultProps}
          isRecording={true}
          showVisualFeedback={true}
        />
      );

      expect(screen.getByTestId('recording-indicator')).toBeTruthy();
    });

    it('hides recording indicator when visual feedback disabled', () => {
      render(
        <ElderlyRecordingButton
          {...defaultProps}
          isRecording={true}
          showVisualFeedback={false}
        />
      );

      expect(screen.queryByTestId('recording-indicator')).toBeNull();
    });
  });

  describe('Button Sizes and Elderly-Friendly Design', () => {
    it('uses extra-large size by default for elderly users', () => {
      render(<ElderlyRecordingButton {...defaultProps} />);

      const button = screen.getByRole('button');
      expect(button.props.style.width).toBe(120);
      expect(button.props.style.height).toBe(120);
    });

    it('applies different sizes correctly', () => {
      const sizes = ['small', 'medium', 'large', 'extra-large'] as const;
      const expectedSizes = [60, 80, 100, 120];

      sizes.forEach((size, index) => {
        const { unmount } = render(<ElderlyRecordingButton {...defaultProps} size={size} />);

        const button = screen.getByRole('button');
        expect(button.props.style.width).toBe(expectedSizes[index]);
        expect(button.props.style.height).toBe(expectedSizes[index]);

        unmount();
      });
    });

    it('uses enhanced styling in elderly mode', () => {
      render(<ElderlyRecordingButton {...defaultProps} elderlyMode={true} />);

      const button = screen.getByRole('button');
      expect(button.props.style.borderWidth).toBe(4);
      expect(button.props.style.elevation).toBe(12);
    });

    it('uses standard styling when elderly mode disabled', () => {
      render(<ElderlyRecordingButton {...defaultProps} elderlyMode={false} />);

      const button = screen.getByRole('button');
      expect(button.props.style.borderWidth).toBe(3);
      expect(button.props.style.elevation).toBe(8);
    });

    it('scales icon appropriately for elderly mode', () => {
      render(<ElderlyRecordingButton {...defaultProps} size="large" elderlyMode={true} />);

      const icon = screen.getByTestId('icon-mic.fill');
      expect(icon.props.style.fontSize).toBe(40); // 100 * 0.4
    });

    it('uses larger text in elderly mode', () => {
      render(<ElderlyRecordingButton {...defaultProps} elderlyMode={true} />);

      const label = screen.getByText('Start Recording');
      expect(label.props.style.fontSize).toBe(20);
      expect(label.props.style.fontWeight).toBe('bold');
    });
  });

  describe('Duration Display', () => {
    it('shows duration when enabled and duration > 0', () => {
      render(
        <ElderlyRecordingButton
          {...defaultProps}
          duration={65}
          showDuration={true}
        />
      );

      expect(screen.getByText('01:05')).toBeTruthy();
    });

    it('hides duration when disabled', () => {
      render(
        <ElderlyRecordingButton
          {...defaultProps}
          duration={65}
          showDuration={false}
        />
      );

      expect(screen.queryByText('01:05')).toBeNull();
    });

    it('hides duration when duration is 0', () => {
      render(
        <ElderlyRecordingButton
          {...defaultProps}
          duration={0}
          showDuration={true}
        />
      );

      expect(screen.queryByText(/\d+:\d+/)).toBeNull();
    });

    it('formats duration correctly', () => {
      const durations = [30, 60, 125, 3661];
      const expectedFormats = ['00:30', '01:00', '02:05', '61:01'];

      durations.forEach((duration, index) => {
        const { unmount } = render(
          <ElderlyRecordingButton
            {...defaultProps}
            duration={duration}
            showDuration={true}
          />
        );

        expect(screen.getByText(expectedFormats[index])).toBeTruthy();
        unmount();
      });
    });

    it('uses larger duration text in elderly mode', () => {
      render(
        <ElderlyRecordingButton
          {...defaultProps}
          duration={30}
          showDuration={true}
          elderlyMode={true}
        />
      );

      const durationText = screen.getByText('00:30');
      expect(durationText.props.style.fontSize).toBe(24);
    });
  });

  describe('Voice Guidance', () => {
    it('provides voice guidance on press when enabled', async () => {
      render(
        <ElderlyRecordingButton
          {...defaultProps}
          voiceGuidanceEnabled={true}
        />
      );

      const button = screen.getByRole('button');
      fireEvent.press(button);

      await waitFor(() => {
        expect(mockSpeech.speak).toHaveBeenCalledWith(
          'Press the red button to start recording your memory',
          expect.objectContaining({
            rate: 0.8,
            volume: 0.9,
          })
        );
      });
    });

    it('uses elderly-friendly voice prompts when in elderly mode', async () => {
      render(
        <ElderlyRecordingButton
          {...defaultProps}
          elderlyMode={true}
          voiceGuidanceEnabled={true}
        />
      );

      const button = screen.getByRole('button');
      fireEvent.press(button);

      await waitFor(() => {
        expect(mockSpeech.speak).toHaveBeenCalledWith(
          expect.stringContaining('Press the red button'),
          expect.any(Object)
        );
      });
    });

    it('uses standard voice prompts when not in elderly mode', async () => {
      render(
        <ElderlyRecordingButton
          {...defaultProps}
          elderlyMode={false}
          voiceGuidanceEnabled={true}
        />
      );

      const button = screen.getByRole('button');
      fireEvent.press(button);

      await waitFor(() => {
        expect(mockSpeech.speak).toHaveBeenCalledWith(
          'Press to start recording',
          expect.objectContaining({
            rate: 1.0,
            volume: 0.7,
          })
        );
      });
    });

    it('does not provide voice guidance when disabled', async () => {
      render(
        <ElderlyRecordingButton
          {...defaultProps}
          voiceGuidanceEnabled={false}
        />
      );

      const button = screen.getByRole('button');
      fireEvent.press(button);

      await waitFor(() => {
        expect(mockSpeech.speak).not.toHaveBeenCalled();
      });
    });

    it('provides different voice prompts for different states', async () => {
      const { rerender } = render(
        <ElderlyRecordingButton
          {...defaultProps}
          voiceGuidanceEnabled={true}
          elderlyMode={true}
        />
      );

      let button = screen.getByRole('button');
      fireEvent.press(button);

      await waitFor(() => {
        expect(mockSpeech.speak).toHaveBeenCalledWith(
          expect.stringContaining('start recording'),
          expect.any(Object)
        );
      });

      jest.clearAllMocks();

      rerender(
        <ElderlyRecordingButton
          {...defaultProps}
          isRecording={true}
          voiceGuidanceEnabled={true}
          elderlyMode={true}
        />
      );

      button = screen.getByRole('button');
      fireEvent.press(button);

      await waitFor(() => {
        expect(mockSpeech.speak).toHaveBeenCalledWith(
          expect.stringContaining('stop when you\'re finished'),
          expect.any(Object)
        );
      });
    });
  });

  describe('Haptic Feedback', () => {
    it('provides medium haptic feedback by default', async () => {
      render(<ElderlyRecordingButton {...defaultProps} />);

      const button = screen.getByRole('button');
      fireEvent.press(button);

      await waitFor(() => {
        expect(mockHaptics.impactAsync).toHaveBeenCalledWith(
          Haptics.ImpactFeedbackStyle.Medium
        );
      });
    });

    it('respects different haptic feedback levels', async () => {
      const levels = ['light', 'medium', 'heavy'] as const;
      const expectedStyles = [
        Haptics.ImpactFeedbackStyle.Light,
        Haptics.ImpactFeedbackStyle.Medium,
        Haptics.ImpactFeedbackStyle.Heavy,
      ];

      for (let i = 0; i < levels.length; i++) {
        const { unmount } = render(
          <ElderlyRecordingButton
            {...defaultProps}
            hapticFeedbackLevel={levels[i]}
          />
        );

        const button = screen.getByRole('button');
        fireEvent.press(button);

        await waitFor(() => {
          expect(mockHaptics.impactAsync).toHaveBeenCalledWith(expectedStyles[i]);
        });

        unmount();
        jest.clearAllMocks();
      }
    });

    it('does not provide haptic feedback when level is none', async () => {
      render(
        <ElderlyRecordingButton
          {...defaultProps}
          hapticFeedbackLevel="none"
        />
      );

      const button = screen.getByRole('button');
      fireEvent.press(button);

      await waitFor(() => {
        expect(mockHaptics.impactAsync).not.toHaveBeenCalled();
      });
    });

    it('provides enhanced haptic feedback for long press', async () => {
      render(
        <ElderlyRecordingButton
          {...defaultProps}
          onLongPress={jest.fn()}
        />
      );

      const button = screen.getByRole('button');
      fireEvent(button, 'longPress');

      await waitFor(() => {
        expect(mockHaptics.impactAsync).toHaveBeenCalledWith(
          Haptics.ImpactFeedbackStyle.Heavy
        );
      });
    });
  });

  describe('Animations', () => {
    it('starts pulse animation when recording', () => {
      render(
        <ElderlyRecordingButton
          {...defaultProps}
          isRecording={true}
          showVisualFeedback={true}
        />
      );

      expect(Animated.loop).toHaveBeenCalled();
      expect(Animated.sequence).toHaveBeenCalled();
    });

    it('stops pulse animation when not recording', () => {
      const { rerender } = render(
        <ElderlyRecordingButton
          {...defaultProps}
          isRecording={true}
          showVisualFeedback={true}
        />
      );

      rerender(
        <ElderlyRecordingButton
          {...defaultProps}
          isRecording={false}
          showVisualFeedback={true}
        />
      );

      expect(jest.spyOn(Animated.Value.prototype, 'setValue')).toHaveBeenCalledWith(1);
    });

    it('animates scale on press', async () => {
      render(<ElderlyRecordingButton {...defaultProps} />);

      const button = screen.getByRole('button');
      fireEvent.press(button);

      expect(Animated.sequence).toHaveBeenCalled();
      expect(Animated.timing).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({ toValue: 0.95 })
      );
    });

    it('animates opacity for disabled state', () => {
      render(<ElderlyRecordingButton {...defaultProps} disabled={true} />);

      expect(Animated.timing).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({
          toValue: 0.6,
          duration: 150,
        })
      );
    });

    it('does not start pulse animation when visual feedback disabled', () => {
      render(
        <ElderlyRecordingButton
          {...defaultProps}
          isRecording={true}
          showVisualFeedback={false}
        />
      );

      // Should not start pulse animation
      expect(jest.spyOn(Animated.Value.prototype, 'setValue')).toHaveBeenCalledWith(1);
    });
  });

  describe('User Interactions', () => {
    it('calls onPress when pressed and not disabled', async () => {
      const onPress = jest.fn();
      render(<ElderlyRecordingButton {...defaultProps} onPress={onPress} />);

      const button = screen.getByRole('button');
      fireEvent.press(button);

      await waitFor(() => {
        expect(onPress).toHaveBeenCalledTimes(1);
      });
    });

    it('does not call onPress when disabled', async () => {
      const onPress = jest.fn();
      render(<ElderlyRecordingButton {...defaultProps} onPress={onPress} disabled={true} />);

      const button = screen.getByRole('button');
      fireEvent.press(button);

      await waitFor(() => {
        expect(onPress).not.toHaveBeenCalled();
      });
    });

    it('calls onLongPress when long pressed', async () => {
      const onLongPress = jest.fn();
      render(<ElderlyRecordingButton {...defaultProps} onLongPress={onLongPress} />);

      const button = screen.getByRole('button');
      fireEvent(button, 'longPress');

      await waitFor(() => {
        expect(onLongPress).toHaveBeenCalledTimes(1);
      });
    });

    it('uses longer delay for long press in elderly mode', () => {
      render(
        <ElderlyRecordingButton
          {...defaultProps}
          elderlyMode={true}
          onLongPress={jest.fn()}
        />
      );

      const button = screen.getByRole('button');
      expect(button.props.delayLongPress).toBe(800);
    });

    it('uses standard delay for long press when not in elderly mode', () => {
      render(
        <ElderlyRecordingButton
          {...defaultProps}
          elderlyMode={false}
          onLongPress={jest.fn()}
        />
      );

      const button = screen.getByRole('button');
      expect(button.props.delayLongPress).toBe(500);
    });

    it('handles rapid button presses gracefully', async () => {
      const onPress = jest.fn();
      render(<ElderlyRecordingButton {...defaultProps} onPress={onPress} />);

      const button = screen.getByRole('button');

      // Rapid presses
      fireEvent.press(button);
      fireEvent.press(button);
      fireEvent.press(button);

      await waitFor(() => {
        expect(onPress).toHaveBeenCalledTimes(3);
      });
    });
  });

  describe('Accessibility', () => {
    it('has proper accessibility role', () => {
      render(<ElderlyRecordingButton {...defaultProps} />);

      const button = screen.getByRole('button');
      expect(button.props.accessibilityRole).toBe('button');
    });

    it('provides appropriate accessibility labels for different states', () => {
      const states = [
        { props: { isRecording: false }, expectedLabel: 'Start Recording' },
        { props: { isRecording: true }, expectedLabel: 'Stop Recording' },
        { props: { isPaused: true }, expectedLabel: 'Resume Recording' },
        { props: { disabled: true }, expectedLabel: 'Not Available' },
      ];

      states.forEach(({ props, expectedLabel }) => {
        const { unmount } = render(<ElderlyRecordingButton {...defaultProps} {...props} />);

        const button = screen.getByRole('button');
        expect(button.props.accessibilityLabel).toBe(expectedLabel);

        unmount();
      });
    });

    it('provides elderly-friendly accessibility hints', () => {
      render(
        <ElderlyRecordingButton
          {...defaultProps}
          elderlyMode={true}
        />
      );

      const button = screen.getByRole('button');
      expect(button.props.accessibilityHint).toContain('Press the red button');
    });

    it('uses custom accessibility labels when provided', () => {
      const customLabel = 'Custom recording button';
      const customHint = 'Custom hint for recording';

      render(
        <ElderlyRecordingButton
          {...defaultProps}
          accessibilityLabel={customLabel}
          accessibilityHint={customHint}
        />
      );

      const button = screen.getByRole('button');
      expect(button.props.accessibilityLabel).toBe(customLabel);
      expect(button.props.accessibilityHint).toBe(customHint);
    });

    it('sets accessibility state correctly', () => {
      const { rerender } = render(<ElderlyRecordingButton {...defaultProps} disabled={false} />);

      let button = screen.getByRole('button');
      expect(button.props.accessibilityState).toEqual({
        disabled: false,
        selected: false,
      });

      rerender(<ElderlyRecordingButton {...defaultProps} isRecording={true} disabled={false} />);

      button = screen.getByRole('button');
      expect(button.props.accessibilityState).toEqual({
        disabled: false,
        selected: true,
      });

      rerender(<ElderlyRecordingButton {...defaultProps} disabled={true} />);

      button = screen.getByRole('button');
      expect(button.props.accessibilityState.disabled).toBe(true);
    });
  });

  describe('Visual Styling', () => {
    it('applies correct colors for different states', () => {
      const states = [
        { props: { isRecording: false }, expectedBg: '#e74c3c' },
        { props: { isRecording: true }, expectedBg: '#e74c3c' },
        { props: { isPaused: true }, expectedBg: '#f39c12' },
        { props: { disabled: true }, expectedBg: '#bdc3c7' },
      ];

      states.forEach(({ props, expectedBg }) => {
        const { unmount } = render(<ElderlyRecordingButton {...defaultProps} {...props} />);

        const button = screen.getByRole('button');
        expect(button.props.style.backgroundColor).toBe(expectedBg);

        unmount();
      });
    });

    it('applies primary variant styling', () => {
      render(<ElderlyRecordingButton {...defaultProps} variant="primary" />);

      const button = screen.getByRole('button');
      expect(button.props.style.backgroundColor).toBe('#e74c3c');
    });

    it('applies secondary variant styling', () => {
      render(<ElderlyRecordingButton {...defaultProps} variant="secondary" />);

      const button = screen.getByRole('button');
      const icon = screen.getByTestId('icon-mic.fill');
      expect(icon.props.style.color).toBe('#e74c3c');
    });

    it('applies circular shape with proper border radius', () => {
      render(<ElderlyRecordingButton {...defaultProps} size="large" />);

      const button = screen.getByRole('button');
      expect(button.props.style.borderRadius).toBe(50); // 100 / 2
    });

    it('applies custom styles', () => {
      const customStyle = { backgroundColor: '#custom', margin: 10 };
      render(<ElderlyRecordingButton {...defaultProps} style={customStyle} />);

      const container = screen.getByRole('button').parent;
      expect(container?.props.style).toMatchObject(customStyle);
    });

    it('applies custom text styles', () => {
      const customTextStyle = { fontSize: 24, color: '#custom' };
      render(<ElderlyRecordingButton {...defaultProps} textStyle={customTextStyle} />);

      const label = screen.getByText('Start Recording');
      expect(label.props.style).toMatchObject(customTextStyle);
    });
  });

  describe('Error Handling', () => {
    it('handles haptic feedback errors gracefully', async () => {
      mockHaptics.impactAsync.mockRejectedValueOnce(new Error('Haptic failed'));

      render(<ElderlyRecordingButton {...defaultProps} />);

      const button = screen.getByRole('button');

      expect(() => {
        fireEvent.press(button);
      }).not.toThrow();

      await waitFor(() => {
        expect(defaultProps.onPress).toHaveBeenCalled();
      });
    });

    it('handles speech synthesis errors gracefully', async () => {
      mockSpeech.speak.mockRejectedValueOnce(new Error('Speech failed'));

      render(
        <ElderlyRecordingButton
          {...defaultProps}
          voiceGuidanceEnabled={true}
        />
      );

      const button = screen.getByRole('button');

      expect(() => {
        fireEvent.press(button);
      }).not.toThrow();

      await waitFor(() => {
        expect(defaultProps.onPress).toHaveBeenCalled();
      });
    });

    it('handles missing callbacks gracefully', () => {
      expect(() => {
        render(<ElderlyRecordingButton {...defaultProps} onPress={undefined} />);
      }).not.toThrow();
    });

    it('handles animation errors gracefully', () => {
      (Animated.timing as jest.Mock).mockImplementation(() => {
        throw new Error('Animation failed');
      });

      expect(() => {
        render(<ElderlyRecordingButton {...defaultProps} />);
      }).not.toThrow();
    });
  });

  describe('Performance', () => {
    it('renders quickly without blocking UI', () => {
      const startTime = performance.now();

      render(<ElderlyRecordingButton {...defaultProps} />);

      const endTime = performance.now();
      const renderTime = endTime - startTime;

      expect(renderTime).toBeLessThan(100);
    });

    it('handles state changes efficiently', () => {
      const { rerender } = render(<ElderlyRecordingButton {...defaultProps} />);

      const startTime = performance.now();

      // Multiple state changes
      for (let i = 0; i < 10; i++) {
        rerender(
          <ElderlyRecordingButton
            {...defaultProps}
            isRecording={i % 2 === 0}
            duration={i}
          />
        );
      }

      const endTime = performance.now();
      const updateTime = endTime - startTime;

      expect(updateTime).toBeLessThan(200);
    });

    it('cleans up animations on unmount', () => {
      const { unmount } = render(
        <ElderlyRecordingButton
          {...defaultProps}
          isRecording={true}
          showVisualFeedback={true}
        />
      );

      expect(() => {
        unmount();
      }).not.toThrow();
    });
  });

  describe('Edge Cases', () => {
    it('handles undefined props gracefully', () => {
      const minimalProps = {
        phase: 'idle' as const,
        isRecording: false,
        isPaused: false,
        duration: undefined,
        size: undefined,
        variant: undefined,
        elderlyMode: undefined,
        onPress: undefined,
      };

      expect(() => {
        render(<ElderlyRecordingButton {...minimalProps} />);
      }).not.toThrow();
    });

    it('handles invalid phase values', () => {
      expect(() => {
        render(<ElderlyRecordingButton {...defaultProps} phase={'invalid' as any} />);
      }).not.toThrow();
    });

    it('handles negative duration values', () => {
      expect(() => {
        render(<ElderlyRecordingButton {...defaultProps} duration={-10} />);
      }).not.toThrow();
    });

    it('handles very large duration values', () => {
      expect(() => {
        render(<ElderlyRecordingButton {...defaultProps} duration={999999} />);
      }).not.toThrow();
    });

    it('handles NaN duration values', () => {
      expect(() => {
        render(<ElderlyRecordingButton {...defaultProps} duration={NaN} />);
      }).not.toThrow();
    });
  });

  describe('Integration', () => {
    it('integrates with color scheme changes', () => {
      const useColorScheme = require('../../../hooks/useColorScheme').useColorScheme;
      const { rerender } = render(<ElderlyRecordingButton {...defaultProps} />);

      useColorScheme.mockReturnValue('dark');
      rerender(<ElderlyRecordingButton {...defaultProps} />);

      expect(screen.getByText('Start Recording')).toBeTruthy();
    });

    it('responds to prop changes from parent components', () => {
      const { rerender } = render(<ElderlyRecordingButton {...defaultProps} />);

      expect(screen.getByText('Start Recording')).toBeTruthy();

      rerender(<ElderlyRecordingButton {...defaultProps} isRecording={true} />);

      expect(screen.getByText('Stop Recording')).toBeTruthy();
    });

    it('maintains state consistency across re-renders', () => {
      const { rerender } = render(<ElderlyRecordingButton {...defaultProps} duration={30} />);

      // Multiple re-renders with same props
      rerender(<ElderlyRecordingButton {...defaultProps} duration={30} />);
      rerender(<ElderlyRecordingButton {...defaultProps} duration={30} />);

      expect(screen.getByText('Start Recording')).toBeTruthy();
    });
  });
});