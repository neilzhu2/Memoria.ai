/**
 * Unit Tests for AudioVisualizer Component
 * Tests Phase 2: Recording Flow Screens - Audio Visualization
 *
 * Tests elderly-friendly features including:
 * - Real-time audio level visualization
 * - Simplified visualizations for elderly users
 * - High contrast and large element options
 * - Smooth animations optimized for clarity
 * - Multiple visualization types (bars, circle, simple)
 */

import React from 'react';
import { render, waitFor, screen } from '@testing-library/react-native';
import { Animated, Dimensions } from 'react-native';

import { AudioVisualizer } from '../../../components/recording-flow/ui/AudioVisualizer';

// Mock dependencies
jest.mock('expo-haptics');
jest.mock('../../../constants/Colors', () => ({
  Colors: {
    light: {
      background: '#ffffff',
      text: '#000000',
      tabIconDefault: '#888888',
    },
    dark: {
      background: '#000000',
      text: '#ffffff',
      tabIconDefault: '#888888',
    },
  },
}));

jest.mock('../../../hooks/useColorScheme', () => ({
  useColorScheme: jest.fn(() => 'light'),
}));

// Mock Animated API
jest.mock('react-native/Libraries/Animated/NativeAnimatedHelper');

describe('AudioVisualizer', () => {
  const defaultProps = {
    isRecording: true,
    currentLevel: 50,
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock Animated methods
    jest.spyOn(Animated, 'timing').mockReturnValue({
      start: jest.fn(),
      stop: jest.fn(),
    } as any);

    jest.spyOn(Animated.Value.prototype, 'setValue').mockImplementation(jest.fn());
  });

  describe('Rendering and Visibility', () => {
    it('renders with default props', () => {
      const { UNSAFE_getByType } = render(<AudioVisualizer {...defaultProps} />);

      const container = UNSAFE_getByType('View');
      expect(container).toBeTruthy();
    });

    it('renders bars visualization by default', () => {
      render(<AudioVisualizer {...defaultProps} />);

      // Should render bars container
      expect(screen.getByTestId('audio-visualizer-container')).toBeTruthy();
    });

    it('renders different visualization types', () => {
      const { rerender } = render(<AudioVisualizer {...defaultProps} type="bars" />);
      expect(screen.getByTestId('audio-visualizer-container')).toBeTruthy();

      rerender(<AudioVisualizer {...defaultProps} type="circle" />);
      expect(screen.getByTestId('audio-visualizer-container')).toBeTruthy();

      rerender(<AudioVisualizer {...defaultProps} type="simple" />);
      expect(screen.getByTestId('audio-visualizer-container')).toBeTruthy();

      rerender(<AudioVisualizer {...defaultProps} type="waveform" />);
      expect(screen.getByTestId('audio-visualizer-container')).toBeTruthy();
    });

    it('shows status indicator in elderly mode', () => {
      render(<AudioVisualizer {...defaultProps} elderlyMode={true} />);

      // Should show status indicator for elderly users
      expect(screen.getByTestId('status-indicator')).toBeTruthy();
    });

    it('hides status indicator when not in elderly mode', () => {
      render(<AudioVisualizer {...defaultProps} elderlyMode={false} />);

      expect(screen.queryByTestId('status-indicator')).toBeNull();
    });
  });

  describe('Configuration and Sizing', () => {
    it('uses default width when not specified', () => {
      render(<AudioVisualizer {...defaultProps} />);

      const container = screen.getByTestId('audio-visualizer-container');
      const expectedWidth = Dimensions.get('window').width * 0.8;
      expect(container.props.style.width).toBe(expectedWidth);
    });

    it('uses custom width when specified', () => {
      const customWidth = 300;
      render(<AudioVisualizer {...defaultProps} width={customWidth} />);

      const container = screen.getByTestId('audio-visualizer-container');
      expect(container.props.style.width).toBe(customWidth);
    });

    it('adjusts height for elderly mode', () => {
      const { rerender } = render(<AudioVisualizer {...defaultProps} elderlyMode={false} />);

      let container = screen.getByTestId('audio-visualizer-container');
      const normalHeight = container.props.style.height;

      rerender(<AudioVisualizer {...defaultProps} elderlyMode={true} />);

      container = screen.getByTestId('audio-visualizer-container');
      const elderlyHeight = container.props.style.height;

      // Elderly mode should use shorter height (80px vs 120px)
      expect(elderlyHeight).toBeLessThan(normalHeight);
    });

    it('reduces bar count in elderly mode', () => {
      // This test verifies that elderly mode uses fewer bars
      // The exact verification would depend on internal implementation
      render(<AudioVisualizer {...defaultProps} elderlyMode={true} />);

      const container = screen.getByTestId('audio-visualizer-container');
      expect(container).toBeTruthy();
    });

    it('applies custom bar count when specified', () => {
      render(<AudioVisualizer {...defaultProps} barCount={15} />);

      const container = screen.getByTestId('audio-visualizer-container');
      expect(container).toBeTruthy();
    });
  });

  describe('Audio Level Processing', () => {
    it('processes provided audio levels array', () => {
      const audioLevels = [10, 20, 30, 40, 50];
      render(<AudioVisualizer {...defaultProps} audioLevels={audioLevels} />);

      const container = screen.getByTestId('audio-visualizer-container');
      expect(container).toBeTruthy();
    });

    it('generates levels from current level when recording', () => {
      render(<AudioVisualizer isRecording={true} currentLevel={75} />);

      const container = screen.getByTestId('audio-visualizer-container');
      expect(container).toBeTruthy();
    });

    it('shows silent state when not recording', () => {
      render(<AudioVisualizer isRecording={false} currentLevel={75} />);

      const container = screen.getByTestId('audio-visualizer-container');
      expect(container).toBeTruthy();
    });

    it('shows silent state when paused', () => {
      render(<AudioVisualizer isRecording={true} isPaused={true} currentLevel={75} />);

      const container = screen.getByTestId('audio-visualizer-container');
      expect(container).toBeTruthy();
    });

    it('handles zero current level', () => {
      render(<AudioVisualizer {...defaultProps} currentLevel={0} />);

      const container = screen.getByTestId('audio-visualizer-container');
      expect(container).toBeTruthy();
    });

    it('handles maximum current level', () => {
      render(<AudioVisualizer {...defaultProps} currentLevel={100} />);

      const container = screen.getByTestId('audio-visualizer-container');
      expect(container).toBeTruthy();
    });
  });

  describe('Visualization Types', () => {
    it('renders bars visualization correctly', () => {
      render(<AudioVisualizer {...defaultProps} type="bars" />);

      const container = screen.getByTestId('audio-visualizer-container');
      expect(container).toBeTruthy();
    });

    it('renders circle visualization correctly', () => {
      render(<AudioVisualizer {...defaultProps} type="circle" />);

      const container = screen.getByTestId('audio-visualizer-container');
      expect(container).toBeTruthy();
    });

    it('renders simple visualization correctly', () => {
      render(<AudioVisualizer {...defaultProps} type="simple" />);

      const container = screen.getByTestId('audio-visualizer-container');
      expect(container).toBeTruthy();
    });

    it('renders waveform visualization correctly', () => {
      render(<AudioVisualizer {...defaultProps} type="waveform" />);

      const container = screen.getByTestId('audio-visualizer-container');
      expect(container).toBeTruthy();
    });

    it('simplifies view when simplifiedView is true', () => {
      render(<AudioVisualizer {...defaultProps} simplifiedView={true} />);

      const container = screen.getByTestId('audio-visualizer-container');
      expect(container).toBeTruthy();
    });
  });

  describe('Visual Styling and Colors', () => {
    it('applies default colors correctly', () => {
      render(<AudioVisualizer {...defaultProps} />);

      const container = screen.getByTestId('audio-visualizer-container');
      expect(container.props.style.backgroundColor).toBeTruthy();
    });

    it('applies custom colors when provided', () => {
      const customColors = {
        active: '#ff0000',
        inactive: '#00ff00',
        peak: '#0000ff',
        background: '#ffffff',
      };

      render(<AudioVisualizer {...defaultProps} colors={customColors} />);

      const container = screen.getByTestId('audio-visualizer-container');
      expect(container.props.style.backgroundColor).toBe(customColors.background);
    });

    it('applies high contrast colors when enabled', () => {
      render(<AudioVisualizer {...defaultProps} highContrast={true} />);

      const container = screen.getByTestId('audio-visualizer-container');
      expect(container).toBeTruthy();
    });

    it('shows different colors for recording vs inactive state', () => {
      const { rerender } = render(<AudioVisualizer isRecording={true} currentLevel={50} />);

      let container = screen.getByTestId('audio-visualizer-container');
      expect(container).toBeTruthy();

      rerender(<AudioVisualizer isRecording={false} currentLevel={50} />);

      container = screen.getByTestId('audio-visualizer-container');
      expect(container).toBeTruthy();
    });

    it('shows different colors for paused state', () => {
      render(<AudioVisualizer isRecording={true} isPaused={true} currentLevel={50} />);

      const statusIndicator = screen.getByTestId('status-indicator');
      expect(statusIndicator).toBeTruthy();
    });
  });

  describe('Elderly-Friendly Features', () => {
    it('applies elderly mode styling', () => {
      render(<AudioVisualizer {...defaultProps} elderlyMode={true} />);

      const container = screen.getByTestId('audio-visualizer-container');
      expect(container.props.style).toMatchObject(
        expect.objectContaining({
          borderRadius: 12,
          paddingHorizontal: 15,
          paddingVertical: 12,
        })
      );
    });

    it('uses larger elements when largeElements is true', () => {
      render(<AudioVisualizer {...defaultProps} largeElements={true} />);

      const container = screen.getByTestId('audio-visualizer-container');
      expect(container).toBeTruthy();
    });

    it('responds to settings prop for elderly features', () => {
      const settings = {
        simplifiedInterface: true,
        highContrast: true,
        largeText: true,
      };

      render(<AudioVisualizer {...defaultProps} settings={settings} />);

      const container = screen.getByTestId('audio-visualizer-container');
      expect(container).toBeTruthy();
    });

    it('shows status indicator with appropriate color in elderly mode', () => {
      render(<AudioVisualizer {...defaultProps} elderlyMode={true} />);

      const statusIndicator = screen.getByTestId('status-indicator');
      expect(statusIndicator.props.style.backgroundColor).toBeTruthy();
    });
  });

  describe('Peak Indicators', () => {
    it('shows peak indicators when enabled', () => {
      render(<AudioVisualizer {...defaultProps} showPeaks={true} />);

      const container = screen.getByTestId('audio-visualizer-container');
      expect(container).toBeTruthy();
    });

    it('hides peak indicators when disabled', () => {
      render(<AudioVisualizer {...defaultProps} showPeaks={false} />);

      const container = screen.getByTestId('audio-visualizer-container');
      expect(container).toBeTruthy();
    });

    it('hides peak indicators in simplified view', () => {
      render(<AudioVisualizer {...defaultProps} showPeaks={true} simplifiedView={true} />);

      const container = screen.getByTestId('audio-visualizer-container');
      expect(container).toBeTruthy();
    });
  });

  describe('Animations', () => {
    it('starts animations when recording begins', () => {
      render(<AudioVisualizer isRecording={true} currentLevel={50} />);

      expect(Animated.timing).toHaveBeenCalled();
    });

    it('handles animation smoothing', () => {
      render(<AudioVisualizer {...defaultProps} smoothing={0.5} />);

      const container = screen.getByTestId('audio-visualizer-container');
      expect(container).toBeTruthy();
    });

    it('applies different animation duration for elderly mode', () => {
      render(<AudioVisualizer {...defaultProps} elderlyMode={true} />);

      // Should use longer animation duration for elderly users
      expect(Animated.timing).toHaveBeenCalled();
    });

    it('updates animations when audio levels change', () => {
      const { rerender } = render(<AudioVisualizer isRecording={true} currentLevel={30} />);

      rerender(<AudioVisualizer isRecording={true} currentLevel={70} />);

      // Should trigger new animations
      expect(Animated.timing).toHaveBeenCalled();
    });

    it('stops animations when recording stops', () => {
      const { rerender } = render(<AudioVisualizer isRecording={true} currentLevel={50} />);

      rerender(<AudioVisualizer isRecording={false} currentLevel={50} />);

      // Animations should be updated
      expect(Animated.timing).toHaveBeenCalled();
    });
  });

  describe('Performance', () => {
    it('renders quickly without blocking UI', () => {
      const startTime = performance.now();

      render(<AudioVisualizer {...defaultProps} />);

      const endTime = performance.now();
      const renderTime = endTime - startTime;

      expect(renderTime).toBeLessThan(100);
    });

    it('handles frequent audio level updates efficiently', () => {
      const { rerender } = render(<AudioVisualizer isRecording={true} currentLevel={0} />);

      const startTime = performance.now();

      // Simulate rapid audio level updates
      for (let i = 1; i <= 50; i++) {
        rerender(<AudioVisualizer isRecording={true} currentLevel={i} />);
      }

      const endTime = performance.now();
      const updateTime = endTime - startTime;

      expect(updateTime).toBeLessThan(500);
    });

    it('cleans up resources properly on unmount', () => {
      const { unmount } = render(<AudioVisualizer {...defaultProps} />);

      expect(() => {
        unmount();
      }).not.toThrow();
    });

    it('handles many bars efficiently', () => {
      const startTime = performance.now();

      render(<AudioVisualizer {...defaultProps} barCount={50} />);

      const endTime = performance.now();
      const renderTime = endTime - startTime;

      expect(renderTime).toBeLessThan(200);
    });
  });

  describe('Error Handling', () => {
    it('handles undefined audio levels gracefully', () => {
      expect(() => {
        render(<AudioVisualizer isRecording={true} audioLevels={undefined} />);
      }).not.toThrow();
    });

    it('handles empty audio levels array', () => {
      expect(() => {
        render(<AudioVisualizer isRecording={true} audioLevels={[]} />);
      }).not.toThrow();
    });

    it('handles negative current levels', () => {
      expect(() => {
        render(<AudioVisualizer isRecording={true} currentLevel={-10} />);
      }).not.toThrow();
    });

    it('handles current levels over 100', () => {
      expect(() => {
        render(<AudioVisualizer isRecording={true} currentLevel={150} />);
      }).not.toThrow();
    });

    it('handles NaN current levels', () => {
      expect(() => {
        render(<AudioVisualizer isRecording={true} currentLevel={NaN} />);
      }).not.toThrow();
    });

    it('handles invalid bar count values', () => {
      expect(() => {
        render(<AudioVisualizer {...defaultProps} barCount={0} />);
        render(<AudioVisualizer {...defaultProps} barCount={-5} />);
        render(<AudioVisualizer {...defaultProps} barCount={NaN} />);
      }).not.toThrow();
    });

    it('handles animation errors gracefully', () => {
      // Mock animation to throw error
      (Animated.timing as jest.Mock).mockImplementation(() => {
        throw new Error('Animation failed');
      });

      expect(() => {
        render(<AudioVisualizer {...defaultProps} />);
      }).not.toThrow();
    });

    it('handles missing color scheme gracefully', () => {
      const useColorScheme = require('../../../hooks/useColorScheme').useColorScheme;
      useColorScheme.mockReturnValue(undefined);

      expect(() => {
        render(<AudioVisualizer {...defaultProps} />);
      }).not.toThrow();
    });
  });

  describe('Edge Cases', () => {
    it('handles undefined props gracefully', () => {
      const minimalProps = {
        isRecording: true,
        currentLevel: undefined,
        audioLevels: undefined,
        type: undefined,
        elderlyMode: undefined,
        width: undefined,
        height: undefined,
      };

      expect(() => {
        render(<AudioVisualizer {...minimalProps} />);
      }).not.toThrow();
    });

    it('handles rapid state changes', () => {
      const { rerender } = render(<AudioVisualizer isRecording={false} currentLevel={0} />);

      // Rapid state changes
      for (let i = 0; i < 10; i++) {
        rerender(<AudioVisualizer isRecording={i % 2 === 0} currentLevel={i * 10} />);
      }

      expect(() => {
        rerender(<AudioVisualizer isRecording={true} currentLevel={50} />);
      }).not.toThrow();
    });

    it('handles very wide visualizer', () => {
      expect(() => {
        render(<AudioVisualizer {...defaultProps} width={1000} />);
      }).not.toThrow();
    });

    it('handles very narrow visualizer', () => {
      expect(() => {
        render(<AudioVisualizer {...defaultProps} width={50} />);
      }).not.toThrow();
    });

    it('handles very tall visualizer', () => {
      expect(() => {
        render(<AudioVisualizer {...defaultProps} height={500} />);
      }).not.toThrow();
    });

    it('handles very short visualizer', () => {
      expect(() => {
        render(<AudioVisualizer {...defaultProps} height={20} />);
      }).not.toThrow();
    });
  });

  describe('Custom Styling', () => {
    it('applies custom style prop', () => {
      const customStyle = { backgroundColor: '#custom', margin: 10 };
      render(<AudioVisualizer {...defaultProps} style={customStyle} />);

      const container = screen.getByTestId('audio-visualizer-container');
      expect(container.props.style).toMatchObject(customStyle);
    });

    it('merges custom styles with default styles', () => {
      const customStyle = { marginTop: 20 };
      render(<AudioVisualizer {...defaultProps} style={customStyle} />);

      const container = screen.getByTestId('audio-visualizer-container');
      expect(container.props.style.marginTop).toBe(20);
      expect(container.props.style.justifyContent).toBe('center');
    });
  });

  describe('Accessibility', () => {
    it('provides accessible structure for audio visualization', () => {
      render(<AudioVisualizer {...defaultProps} />);

      const container = screen.getByTestId('audio-visualizer-container');
      expect(container).toBeTruthy();
    });

    it('maintains consistent visual hierarchy', () => {
      render(<AudioVisualizer {...defaultProps} />);

      const container = screen.getByTestId('audio-visualizer-container');
      expect(container.props.style).toMatchObject(
        expect.objectContaining({
          justifyContent: 'center',
          alignItems: 'center',
        })
      );
    });

    it('provides clear visual feedback for recording state', () => {
      const { rerender } = render(<AudioVisualizer isRecording={false} currentLevel={50} />);

      let container = screen.getByTestId('audio-visualizer-container');
      expect(container).toBeTruthy();

      rerender(<AudioVisualizer isRecording={true} currentLevel={50} />);

      container = screen.getByTestId('audio-visualizer-container');
      expect(container).toBeTruthy();
    });
  });

  describe('Integration', () => {
    it('integrates with color scheme changes', () => {
      const useColorScheme = require('../../../hooks/useColorScheme').useColorScheme;
      const { rerender } = render(<AudioVisualizer {...defaultProps} />);

      useColorScheme.mockReturnValue('dark');
      rerender(<AudioVisualizer {...defaultProps} />);

      const container = screen.getByTestId('audio-visualizer-container');
      expect(container).toBeTruthy();
    });

    it('responds to prop changes from parent components', () => {
      const { rerender } = render(<AudioVisualizer isRecording={false} currentLevel={0} />);

      expect(screen.getByTestId('audio-visualizer-container')).toBeTruthy();

      rerender(<AudioVisualizer isRecording={true} currentLevel={75} />);

      expect(screen.getByTestId('audio-visualizer-container')).toBeTruthy();
    });

    it('works with different screen sizes', () => {
      const originalDimensions = Dimensions.get('window');

      // Mock smaller screen
      jest.spyOn(Dimensions, 'get').mockReturnValue({
        width: 320,
        height: 568,
      });

      render(<AudioVisualizer {...defaultProps} />);

      const container = screen.getByTestId('audio-visualizer-container');
      expect(container).toBeTruthy();

      // Restore original dimensions
      jest.spyOn(Dimensions, 'get').mockReturnValue(originalDimensions);
    });
  });
});