/**
 * Test setup configuration for Memoria.ai accessibility testing
 * Configures testing environment for elderly user focus
 */

import '@testing-library/jest-native/extend-expect';
import { configure } from '@testing-library/react-native';

// Configure testing library for accessibility-focused testing
configure({
  // Increase timeout for slower interactions (elderly users)
  asyncUtilTimeout: 5000,
  // Enable accessibility testing by default
  defaultHidden: false,
});

// Mock React Native modules commonly used in accessibility
jest.mock('react-native', () => {
  const RN = jest.requireActual('react-native');

  return {
    ...RN,
    AccessibilityInfo: {
      announceForAccessibility: jest.fn(),
      isScreenReaderEnabled: jest.fn(() => Promise.resolve(false)),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      setAccessibilityFocus: jest.fn(),
    },
    Alert: {
      alert: jest.fn(),
    },
    Dimensions: {
      get: jest.fn(() => ({ width: 375, height: 812 })),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    },
  };
});

// Mock Expo modules
jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  ImpactFeedbackStyle: {
    Light: 'light',
    Medium: 'medium',
    Heavy: 'heavy',
  },
}));

jest.mock('expo-speech', () => ({
  speak: jest.fn(),
  stop: jest.fn(),
  isSpeakingAsync: jest.fn(() => Promise.resolve(false)),
}));

jest.mock('expo-av', () => ({
  Audio: {
    requestPermissionsAsync: jest.fn(() => Promise.resolve({ status: 'granted' })),
    setAudioModeAsync: jest.fn(),
    Recording: jest.fn(),
  },
}));

// Global test utilities for accessibility testing
global.testAccessibility = {
  // Simulate screen reader enabled state
  enableScreenReader: () => {
    require('react-native').AccessibilityInfo.isScreenReaderEnabled.mockResolvedValue(true);
  },

  // Simulate elderly user settings
  applyElderlyUserSettings: () => {
    // This would typically set up larger touch targets, fonts, etc.
    global.elderlyUserMode = true;
  },

  // Simulate different device capabilities
  simulateOlderDevice: () => {
    require('react-native').Dimensions.get.mockReturnValue({
      width: 320,
      height: 568,
    });
  },

  // Reset all mocks between tests
  reset: () => {
    jest.clearAllMocks();
    global.elderlyUserMode = false;
  },
};

// Setup for each test
beforeEach(() => {
  global.testAccessibility.reset();
});

// Extend expect with custom accessibility matchers
expect.extend({
  toHaveAccessibleTouchTarget(received) {
    const minTouchTarget = 60; // 60px minimum for elderly users
    const element = received;

    if (!element || !element.props || !element.props.style) {
      return {
        message: () => 'Element does not have style props',
        pass: false,
      };
    }

    const style = Array.isArray(element.props.style)
      ? Object.assign({}, ...element.props.style)
      : element.props.style;

    const width = style.width || style.minWidth || 0;
    const height = style.height || style.minHeight || 0;

    const pass = width >= minTouchTarget && height >= minTouchTarget;

    return {
      message: () =>
        pass
          ? `Expected element not to have accessible touch target (${width}x${height}), but it does`
          : `Expected element to have accessible touch target (min ${minTouchTarget}px), but got ${width}x${height}`,
      pass,
    };
  },

  toHaveHighContrastColors(received) {
    const element = received;

    if (!element || !element.props || !element.props.style) {
      return {
        message: () => 'Element does not have style props',
        pass: false,
      };
    }

    const style = Array.isArray(element.props.style)
      ? Object.assign({}, ...element.props.style)
      : element.props.style;

    // This is a simplified check - in reality you'd calculate contrast ratios
    const hasHighContrast = style.color === '#000000' ||
                           style.backgroundColor === '#ffffff' ||
                           style.color === '#ffffff' ||
                           style.backgroundColor === '#000000';

    return {
      message: () =>
        hasHighContrast
          ? 'Expected element not to have high contrast colors, but it does'
          : 'Expected element to have high contrast colors for elderly users',
      pass: hasHighContrast,
    };
  },

  toHaveLargeFont(received) {
    const minFontSize = 18; // Minimum for elderly users
    const element = received;

    if (!element || !element.props || !element.props.style) {
      return {
        message: () => 'Element does not have style props',
        pass: false,
      };
    }

    const style = Array.isArray(element.props.style)
      ? Object.assign({}, ...element.props.style)
      : element.props.style;

    const fontSize = style.fontSize || 16; // Default React Native font size
    const pass = fontSize >= minFontSize;

    return {
      message: () =>
        pass
          ? `Expected element not to have large font (${fontSize}px), but it does`
          : `Expected element to have large font (min ${minFontSize}px), but got ${fontSize}px`,
      pass,
    };
  },
});

declare global {
  namespace jest {
    interface Matchers<R> {
      toHaveAccessibleTouchTarget(): R;
      toHaveHighContrastColors(): R;
      toHaveLargeFont(): R;
    }
  }

  var testAccessibility: {
    enableScreenReader: () => void;
    applyElderlyUserSettings: () => void;
    simulateOlderDevice: () => void;
    reset: () => void;
  };

  var elderlyUserMode: boolean;
}