/**
 * Jest Setup for Memoria.ai Testing
 * Configures mocks and testing environment for elderly-friendly app testing
 */

import 'react-native-gesture-handler/jestSetup';
import '@testing-library/jest-native/extend-expect';

// Mock expo modules
jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(() => Promise.resolve()),
  ImpactFeedbackStyle: {
    Light: 'light',
    Medium: 'medium',
    Heavy: 'heavy',
  },
  NotificationFeedbackType: {
    Success: 'success',
    Warning: 'warning',
    Error: 'error',
  },
}));

jest.mock('expo-speech', () => ({
  speak: jest.fn(() => Promise.resolve()),
  stop: jest.fn(() => Promise.resolve()),
  isSpeakingAsync: jest.fn(() => Promise.resolve(false)),
  getAvailableVoicesAsync: jest.fn(() => Promise.resolve([])),
}));

jest.mock('expo-av', () => ({
  Audio: {
    requestPermissionsAsync: jest.fn(() => Promise.resolve({
      status: 'granted',
      granted: true,
    })),
    getPermissionsAsync: jest.fn(() => Promise.resolve({
      status: 'granted',
      granted: true,
    })),
    setAudioModeAsync: jest.fn(() => Promise.resolve()),
    Recording: jest.fn().mockImplementation(() => ({
      prepareToRecordAsync: jest.fn(() => Promise.resolve()),
      startAsync: jest.fn(() => Promise.resolve()),
      stopAndUnloadAsync: jest.fn(() => Promise.resolve({
        uri: 'mock://audio/recording.m4a',
        durationMillis: 5000,
      })),
      pauseAsync: jest.fn(() => Promise.resolve()),
      getStatusAsync: jest.fn(() => Promise.resolve({
        isRecording: true,
        durationMillis: 1000,
      })),
    })),
    RecordingStatus: {},
    RecordingOptions: {
      HIGH_QUALITY: 'high',
      MEDIUM_QUALITY: 'medium',
      LOW_QUALITY: 'low',
    },
    RECORDING_OPTION_ANDROID_AUDIO_ENCODER_AAC: 'aac',
    RECORDING_OPTION_ANDROID_OUTPUT_FORMAT_MPEG_4: 'mpeg4',
    RECORDING_OPTION_IOS_AUDIO_QUALITY_HIGH: 'high',
    RECORDING_OPTION_IOS_OUTPUT_FORMAT_MPEG4AAC: 'mpeg4aac',
    Sound: jest.fn().mockImplementation(() => ({
      loadAsync: jest.fn(() => Promise.resolve()),
      playAsync: jest.fn(() => Promise.resolve()),
      pauseAsync: jest.fn(() => Promise.resolve()),
      stopAsync: jest.fn(() => Promise.resolve()),
      unloadAsync: jest.fn(() => Promise.resolve()),
      setVolumeAsync: jest.fn(() => Promise.resolve()),
      setRateAsync: jest.fn(() => Promise.resolve()),
      getStatusAsync: jest.fn(() => Promise.resolve({
        isLoaded: true,
        isPlaying: false,
        positionMillis: 0,
        durationMillis: 5000,
      })),
    })),
  },
}));

jest.mock('expo-blur', () => ({
  BlurView: 'BlurView',
}));

jest.mock('expo-font', () => ({
  loadAsync: jest.fn(() => Promise.resolve()),
  isLoaded: jest.fn(() => true),
}));

// Mock expo-speech-recognition for transcription testing
jest.mock('expo-speech-recognition', () => ({
  ExpoSpeechRecognitionModule: {
    start: jest.fn(() => Promise.resolve()),
    stop: jest.fn(() => Promise.resolve()),
    abort: jest.fn(() => Promise.resolve()),
    requestPermissionsAsync: jest.fn(() => Promise.resolve({
      status: 'granted',
      granted: true,
      canAskAgain: true,
      expires: 'never',
    })),
    getPermissionsAsync: jest.fn(() => Promise.resolve({
      status: 'granted',
      granted: true,
      canAskAgain: true,
      expires: 'never',
    })),
    getSupportedLocales: jest.fn(() => Promise.resolve(['en-US', 'zh-CN'])),
    getAssistantLocale: jest.fn(() => Promise.resolve('en-US')),
    supportsOnDeviceRecognition: jest.fn(() => Promise.resolve(true)),
    supportsRecording: jest.fn(() => Promise.resolve(true)),
    getStateAsync: jest.fn(() => Promise.resolve('inactive')),
    isRecognitionAvailable: jest.fn(() => Promise.resolve(true)),
  },
  useSpeechRecognitionEvent: jest.fn(),
  ExpoSpeechRecognitionErrorCode: {
    NetworkError: 'network',
    RecognizerBusy: 'busy',
    NoMatch: 'no-match',
    Aborted: 'aborted',
  },
}));

jest.mock('expo-constants', () => ({
  default: {
    statusBarHeight: 44,
    deviceId: 'mock-device-id',
    deviceName: 'Mock Device',
    platform: {
      ios: {
        systemVersion: '16.0',
      },
    },
  },
}));

// Mock React Native modules
jest.mock('react-native/Libraries/Animated/NativeAnimatedHelper');

jest.mock('react-native', () => {
  const ReactNative = jest.requireActual('react-native');
  return {
    ...ReactNative,
    Dimensions: {
      get: jest.fn(() => ({ width: 375, height: 667 })),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    },
    Alert: {
      alert: jest.fn(),
    },
    Platform: {
      OS: 'ios',
      Version: 16,
      select: jest.fn((obj) => obj.ios || obj.default),
    },
  };
});

// Mock navigation
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    navigate: jest.fn(),
    goBack: jest.fn(),
    dispatch: jest.fn(),
  }),
  useRoute: () => ({
    params: {},
  }),
  useFocusEffect: jest.fn(),
}));

// Mock Zustand stores
jest.mock('../src/stores/audioStore', () => ({
  useAudioStore: jest.fn(() => ({
    isRecording: false,
    currentRecording: null,
    recordingDuration: 0,
    recordingStartTime: null,
    permissions: {
      microphone: 'granted',
      mediaLibrary: 'granted',
    },
    settings: {
      defaultQuality: 'medium',
      maxRecordingDuration: 600,
      autoStopEnabled: true,
      hapticFeedbackEnabled: true,
    },
    playbackState: {
      isPlaying: false,
      isPaused: false,
      currentTime: 0,
      duration: 0,
      volume: 0.8,
      playbackRate: 1.0,
      isLoading: false,
    },
    startRecording: jest.fn(() => Promise.resolve()),
    stopRecording: jest.fn(() => Promise.resolve({
      id: 'mock-recording-id',
      filePath: 'mock://audio/recording.m4a',
      duration: 5,
    })),
    pauseRecording: jest.fn(() => Promise.resolve()),
    resumeRecording: jest.fn(() => Promise.resolve()),
    cancelRecording: jest.fn(),
    requestMicrophonePermission: jest.fn(() => Promise.resolve(true)),
    formatDuration: jest.fn((seconds) => `${Math.floor(seconds / 60)}:${(seconds % 60).toString().padStart(2, '0')}`),
    lastError: null,
    clearError: jest.fn(),
    setError: jest.fn(),
  })),
}));

// Mock Memory Context
jest.mock('../contexts/MemoryContext', () => ({
  useMemories: jest.fn(() => ({
    memories: [],
    addMemory: jest.fn(),
    updateMemory: jest.fn(),
    deleteMemory: jest.fn(),
    isLoading: false,
    error: null,
  })),
}));

// Global test utilities
global.mockHapticFeedback = jest.fn();
global.mockSpeechSynthesis = jest.fn();

// Console warnings suppression for cleaner test output
const originalConsoleWarn = console.warn;
const originalConsoleError = console.error;

console.warn = (...args) => {
  // Suppress specific React Native warnings during testing
  if (
    args[0] &&
    (args[0].includes('Animated') ||
     args[0].includes('VirtualizedList') ||
     args[0].includes('componentWillReceiveProps'))
  ) {
    return;
  }
  originalConsoleWarn.apply(console, args);
};

console.error = (...args) => {
  // Suppress specific React Native errors during testing
  if (
    args[0] &&
    (args[0].includes('Warning: ReactDOM.render is deprecated') ||
     args[0].includes('Warning: componentWillReceiveProps'))
  ) {
    return;
  }
  originalConsoleError.apply(console, args);
};

// Setup test environment
beforeEach(() => {
  jest.clearAllMocks();
  jest.clearAllTimers();
  jest.useFakeTimers();
});

afterEach(() => {
  jest.runOnlyPendingTimers();
  jest.useRealTimers();
});

// Accessibility testing helpers
global.testAccessibility = {
  checkTouchTargetSize: (element) => {
    const { width, height } = element.props.style || {};
    return (width >= 44 && height >= 44) || // iOS minimum
           (width >= 48 && height >= 48);   // Android minimum (elderly-friendly: 80px+)
  },

  checkContrastRatio: (backgroundColor, textColor) => {
    // Simplified contrast ratio check for testing
    // In real implementation, would use proper color contrast calculation
    return true; // Placeholder
  },

  checkScreenReaderAccessibility: (element) => {
    return element.props.accessibilityLabel ||
           element.props.accessibilityHint ||
           element.props.accessible !== false;
  },
};

// Performance testing utilities
global.performance = global.performance || {
  now: jest.fn(() => Date.now()),
  mark: jest.fn(),
  measure: jest.fn(),
  getEntriesByName: jest.fn(() => []),
  getEntriesByType: jest.fn(() => []),
};

// Mock file system for audio files
global.mockFileSystem = {
  createAudioFile: (duration = 5000) => ({
    uri: `mock://audio/recording_${Date.now()}.m4a`,
    duration,
    size: Math.floor(duration / 1000) * 64000, // Approximate file size
  }),
};