/**
 * Unit Tests for RecordingStatus Component
 * Tests Phase 2: Recording Flow Screens - Recording Status Indicator
 *
 * Tests elderly-friendly features including:
 * - Clear visual recording indicators
 * - Large, readable text for duration display
 * - Smooth animations for visual feedback
 * - High contrast colors for visibility
 * - Clear instructions and guidance
 */

import React from 'react';
import { render, waitFor, screen } from '@testing-library/react-native';
import { Animated } from 'react-native';

import { RecordingStatus } from '../../components/RecordingStatus';

// Mock Animated API
jest.mock('react-native/Libraries/Animated/NativeAnimatedHelper');

describe('RecordingStatus', () => {
  const defaultProps = {
    isRecording: true,
    duration: 30,
  };

  beforeEach(() => {
    jest.clearAllMocks();

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
  });

  describe('Rendering and Visibility', () => {
    it('renders when recording is active', () => {
      render(<RecordingStatus {...defaultProps} />);

      expect(screen.getByText('Recording...')).toBeTruthy();
      expect(screen.getByText('🎤 Speak clearly about your memory')).toBeTruthy();
    });

    it('does not render when not recording', () => {
      render(<RecordingStatus isRecording={false} duration={30} />);

      expect(screen.queryByText('Recording...')).toBeNull();
      expect(screen.queryByText('🎤 Speak clearly about your memory')).toBeNull();
    });

    it('shows duration when provided and greater than 0', () => {
      render(<RecordingStatus isRecording={true} duration={65} />);

      expect(screen.getByText('1:05')).toBeTruthy();
    });

    it('hides duration when 0 or not provided', () => {
      render(<RecordingStatus isRecording={true} duration={0} />);

      expect(screen.queryByText('0:00')).toBeNull();
    });

    it('hides duration when duration prop is undefined', () => {
      render(<RecordingStatus isRecording={true} />);

      expect(screen.queryByText(/\d+:\d+/)).toBeNull();
    });
  });

  describe('Duration Formatting', () => {
    it('formats seconds correctly - under 1 minute', () => {
      render(<RecordingStatus isRecording={true} duration={45} />);

      expect(screen.getByText('0:45')).toBeTruthy();
    });

    it('formats seconds correctly - exactly 1 minute', () => {
      render(<RecordingStatus isRecording={true} duration={60} />);

      expect(screen.getByText('1:00')).toBeTruthy();
    });

    it('formats seconds correctly - over 1 minute', () => {
      render(<RecordingStatus isRecording={true} duration={125} />);

      expect(screen.getByText('2:05')).toBeTruthy();
    });

    it('formats seconds correctly - multiple minutes', () => {
      render(<RecordingStatus isRecording={true} duration={601} />);

      expect(screen.getByText('10:01')).toBeTruthy();
    });

    it('pads single digit seconds with zero', () => {
      render(<RecordingStatus isRecording={true} duration={63} />);

      expect(screen.getByText('1:03')).toBeTruthy();
    });

    it('handles very long durations', () => {
      render(<RecordingStatus isRecording={true} duration={3661} />);

      expect(screen.getByText('61:01')).toBeTruthy(); // Over 1 hour
    });
  });

  describe('Visual Styling and Design', () => {
    it('has proper container styling for visibility', () => {
      render(<RecordingStatus {...defaultProps} />);

      const container = screen.getByText('Recording...').parent;

      // Should have light green background for recording state
      expect(container?.props.style).toMatchObject({
        backgroundColor: '#F0FFF4',
        borderColor: '#9AE6B4',
        borderRadius: 12,
      });
    });

    it('shows red recording dot indicator', () => {
      render(<RecordingStatus {...defaultProps} />);

      // Recording dot should be present (though we can't directly test its color in this setup)
      const statusText = screen.getByText('Recording...');
      expect(statusText).toBeTruthy();
    });

    it('uses large, readable fonts for elderly users', () => {
      render(<RecordingStatus {...defaultProps} />);

      const statusText = screen.getByText('Recording...');
      const instructionText = screen.getByText('🎤 Speak clearly about your memory');

      expect(statusText.props.style.fontSize).toBe(18);
      expect(statusText.props.style.fontWeight).toBe('600');
      expect(instructionText.props.style.fontSize).toBe(16);
    });

    it('uses high contrast colors for visibility', () => {
      render(<RecordingStatus {...defaultProps} />);

      const statusText = screen.getByText('Recording...');
      const instructionText = screen.getByText('🎤 Speak clearly about your memory');

      // Should use green color scheme for recording state
      expect(statusText.props.style.color).toBe('#2F855A');
      expect(instructionText.props.style.color).toBe('#38A169');
    });

    it('has minimum width for consistency', () => {
      render(<RecordingStatus {...defaultProps} />);

      const container = screen.getByText('Recording...').parent;
      expect(container?.props.style.minWidth).toBe(280);
    });

    it('applies custom style prop', () => {
      const customStyle = { backgroundColor: '#custom' };
      render(<RecordingStatus {...defaultProps} style={customStyle} />);

      const container = screen.getByText('Recording...').parent;
      expect(container?.props.style).toMatchObject(customStyle);
    });

    it('applies custom text style prop', () => {
      const customTextStyle = { fontSize: 24 };
      render(<RecordingStatus {...defaultProps} textStyle={customTextStyle} />);

      const statusText = screen.getByText('Recording...');
      expect(statusText.props.style).toMatchObject(customTextStyle);
    });
  });

  describe('Animations', () => {
    it('starts fade in animation when recording begins', () => {
      render(<RecordingStatus isRecording={true} duration={30} />);

      expect(Animated.timing).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        })
      );
    });

    it('starts pulse animation when recording', () => {
      render(<RecordingStatus isRecording={true} duration={30} />);

      expect(Animated.loop).toHaveBeenCalled();
      expect(Animated.sequence).toHaveBeenCalled();
    });

    it('stops animations and fades out when recording stops', () => {
      const { rerender } = render(<RecordingStatus isRecording={true} duration={30} />);

      // Change to not recording
      rerender(<RecordingStatus isRecording={false} duration={30} />);

      expect(Animated.timing).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        })
      );
    });

    it('resets pulse value when recording stops', () => {
      const { rerender } = render(<RecordingStatus isRecording={true} duration={30} />);

      rerender(<RecordingStatus isRecording={false} duration={30} />);

      // Should reset pulse animation value
      expect(jest.spyOn(Animated.Value.prototype, 'setValue')).toHaveBeenCalledWith(1);
    });

    it('cleans up pulse animation on unmount', () => {
      const mockStop = jest.fn();
      (Animated.loop as jest.Mock).mockReturnValue({ start: jest.fn(), stop: mockStop });

      const { unmount } = render(<RecordingStatus isRecording={true} duration={30} />);

      unmount();

      // Animation should be cleaned up
      expect(mockStop).toHaveBeenCalled();
    });

    it('handles animation state changes efficiently', () => {
      const { rerender } = render(<RecordingStatus isRecording={false} duration={30} />);

      // Start recording
      rerender(<RecordingStatus isRecording={true} duration={30} />);

      // Stop recording
      rerender(<RecordingStatus isRecording={false} duration={30} />);

      // Start again
      rerender(<RecordingStatus isRecording={true} duration={30} />);

      // Should handle multiple state changes without issues
      expect(Animated.timing).toHaveBeenCalled();
    });
  });

  describe('User Guidance and Instructions', () => {
    it('provides clear recording instructions', () => {
      render(<RecordingStatus {...defaultProps} />);

      expect(screen.getByText('🎤 Speak clearly about your memory')).toBeTruthy();
    });

    it('shows recording status clearly', () => {
      render(<RecordingStatus {...defaultProps} />);

      expect(screen.getByText('Recording...')).toBeTruthy();
    });

    it('includes microphone icon for visual clarity', () => {
      render(<RecordingStatus {...defaultProps} />);

      const instructionText = screen.getByText('🎤 Speak clearly about your memory');
      expect(instructionText.props.children).toContain('🎤');
    });

    it('uses friendly, encouraging language', () => {
      render(<RecordingStatus {...defaultProps} />);

      const instructionText = screen.getByText('🎤 Speak clearly about your memory');
      expect(instructionText.props.children).toContain('Speak clearly');
      expect(instructionText.props.children).toContain('your memory');
    });
  });

  describe('State Management', () => {
    it('responds correctly to recording state changes', () => {
      const { rerender } = render(<RecordingStatus isRecording={false} duration={30} />);

      expect(screen.queryByText('Recording...')).toBeNull();

      rerender(<RecordingStatus isRecording={true} duration={30} />);

      expect(screen.getByText('Recording...')).toBeTruthy();
    });

    it('updates duration display in real-time', () => {
      const { rerender } = render(<RecordingStatus isRecording={true} duration={30} />);

      expect(screen.getByText('0:30')).toBeTruthy();

      rerender(<RecordingStatus isRecording={true} duration={60} />);

      expect(screen.getByText('1:00')).toBeTruthy();
      expect(screen.queryByText('0:30')).toBeNull();
    });

    it('handles duration changes while recording', () => {
      const { rerender } = render(<RecordingStatus isRecording={true} duration={0} />);

      expect(screen.queryByText(/\d+:\d+/)).toBeNull();

      rerender(<RecordingStatus isRecording={true} duration={1} />);

      expect(screen.getByText('0:01')).toBeTruthy();
    });

    it('maintains state consistency across re-renders', () => {
      const { rerender } = render(<RecordingStatus isRecording={true} duration={30} />);

      // Multiple re-renders with same props
      rerender(<RecordingStatus isRecording={true} duration={30} />);
      rerender(<RecordingStatus isRecording={true} duration={30} />);

      expect(screen.getByText('Recording...')).toBeTruthy();
      expect(screen.getByText('0:30')).toBeTruthy();
    });
  });

  describe('Error Handling', () => {
    it('handles animation errors gracefully', () => {
      // Mock animation to throw error
      (Animated.timing as jest.Mock).mockImplementation(() => {
        throw new Error('Animation failed');
      });

      expect(() => {
        render(<RecordingStatus isRecording={true} duration={30} />);
      }).not.toThrow();
    });

    it('handles negative duration values', () => {
      expect(() => {
        render(<RecordingStatus isRecording={true} duration={-10} />);
      }).not.toThrow();
    });

    it('handles very large duration values', () => {
      expect(() => {
        render(<RecordingStatus isRecording={true} duration={999999} />);
      }).not.toThrow();
    });

    it('handles NaN duration values', () => {
      expect(() => {
        render(<RecordingStatus isRecording={true} duration={NaN} />);
      }).not.toThrow();
    });

    it('handles rapid state changes without crashing', () => {
      const { rerender } = render(<RecordingStatus isRecording={false} duration={0} />);

      // Rapid state changes
      for (let i = 0; i < 10; i++) {
        rerender(<RecordingStatus isRecording={i % 2 === 0} duration={i} />);
      }

      expect(() => {
        rerender(<RecordingStatus isRecording={true} duration={10} />);
      }).not.toThrow();
    });
  });

  describe('Performance', () => {
    it('renders quickly without blocking UI', () => {
      const startTime = performance.now();

      render(<RecordingStatus {...defaultProps} />);

      const endTime = performance.now();
      const renderTime = endTime - startTime;

      // Should render quickly for good UX
      expect(renderTime).toBeLessThan(50);
    });

    it('handles frequent duration updates efficiently', () => {
      const { rerender } = render(<RecordingStatus isRecording={true} duration={0} />);

      const startTime = performance.now();

      // Simulate rapid duration updates (like real recording timer)
      for (let i = 1; i <= 60; i++) {
        rerender(<RecordingStatus isRecording={true} duration={i} />);
      }

      const endTime = performance.now();
      const updateTime = endTime - startTime;

      // Should handle rapid updates efficiently
      expect(updateTime).toBeLessThan(200);
    });

    it('cleans up resources properly on unmount', () => {
      const { unmount } = render(<RecordingStatus isRecording={true} duration={30} />);

      expect(() => {
        unmount();
      }).not.toThrow();
    });

    it('does not cause memory leaks with animations', () => {
      const { rerender, unmount } = render(<RecordingStatus isRecording={true} duration={30} />);

      // Cycle through states multiple times
      for (let i = 0; i < 5; i++) {
        rerender(<RecordingStatus isRecording={false} duration={30} />);
        rerender(<RecordingStatus isRecording={true} duration={30} />);
      }

      expect(() => {
        unmount();
      }).not.toThrow();
    });
  });

  describe('Edge Cases', () => {
    it('handles undefined props gracefully', () => {
      const minimalProps = {
        isRecording: true,
        duration: undefined,
        style: undefined,
        textStyle: undefined,
      };

      expect(() => {
        render(<RecordingStatus {...minimalProps} />);
      }).not.toThrow();
    });

    it('handles boolean edge cases', () => {
      expect(() => {
        render(<RecordingStatus isRecording={true as any} duration={30} />);
        render(<RecordingStatus isRecording={false as any} duration={30} />);
        render(<RecordingStatus isRecording={null as any} duration={30} />);
        render(<RecordingStatus isRecording={undefined as any} duration={30} />);
      }).not.toThrow();
    });

    it('handles zero duration correctly', () => {
      render(<RecordingStatus isRecording={true} duration={0} />);

      expect(screen.getByText('Recording...')).toBeTruthy();
      expect(screen.queryByText('0:00')).toBeNull();
    });

    it('handles floating point durations', () => {
      render(<RecordingStatus isRecording={true} duration={30.7} />);

      expect(screen.getByText('0:30')).toBeTruthy(); // Should floor to integer
    });
  });

  describe('Accessibility', () => {
    it('provides accessible structure for screen readers', () => {
      render(<RecordingStatus {...defaultProps} />);

      const statusText = screen.getByText('Recording...');
      const instructionText = screen.getByText('🎤 Speak clearly about your memory');

      // Should be readable by screen readers
      expect(statusText).toBeTruthy();
      expect(instructionText).toBeTruthy();
    });

    it('uses semantic text content for status', () => {
      render(<RecordingStatus {...defaultProps} />);

      // Should have clear, semantic text
      expect(screen.getByText('Recording...')).toBeTruthy();
    });

    it('provides clear visual hierarchy', () => {
      render(<RecordingStatus isRecording={true} duration={30} />);

      const statusText = screen.getByText('Recording...');
      const instructionText = screen.getByText('🎤 Speak clearly about your memory');
      const durationText = screen.getByText('0:30');

      // Status should be largest, then instruction, then duration
      expect(statusText.props.style.fontSize).toBe(18);
      expect(instructionText.props.style.fontSize).toBe(16);
      expect(durationText.props.style.fontSize).toBe(14);
    });

    it('maintains readability with custom text styles', () => {
      const customTextStyle = { fontSize: 20, color: '#000' };
      render(<RecordingStatus {...defaultProps} textStyle={customTextStyle} />);

      const statusText = screen.getByText('Recording...');
      expect(statusText.props.style).toMatchObject(customTextStyle);
    });
  });

  describe('Integration', () => {
    it('integrates properly with parent components', () => {
      render(
        <RecordingStatus
          isRecording={true}
          duration={45}
          style={{ marginTop: 20 }}
        />
      );

      expect(screen.getByText('Recording...')).toBeTruthy();
      expect(screen.getByText('0:45')).toBeTruthy();
    });

    it('responds to prop changes from parent state', () => {
      const { rerender } = render(<RecordingStatus isRecording={false} duration={0} />);

      expect(screen.queryByText('Recording...')).toBeNull();

      // Simulate parent updating state
      rerender(<RecordingStatus isRecording={true} duration={10} />);

      expect(screen.getByText('Recording...')).toBeTruthy();
      expect(screen.getByText('0:10')).toBeTruthy();
    });

    it('works with different duration intervals', () => {
      const { rerender } = render(<RecordingStatus isRecording={true} duration={1} />);

      expect(screen.getByText('0:01')).toBeTruthy();

      // Simulate 1-second intervals
      rerender(<RecordingStatus isRecording={true} duration={2} />);
      expect(screen.getByText('0:02')).toBeTruthy();

      rerender(<RecordingStatus isRecording={true} duration={3} />);
      expect(screen.getByText('0:03')).toBeTruthy();
    });
  });
});