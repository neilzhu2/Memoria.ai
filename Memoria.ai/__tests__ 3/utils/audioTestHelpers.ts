/**
 * Audio Playback Test Utilities
 *
 * Reusable helpers and mocks for testing audio playback functionality
 * across the Memoria.ai application.
 */

import { Audio } from 'expo-av';
import { MemoryItem } from '@/types/memory';

/**
 * Creates a mock Audio.Sound instance with controllable behavior
 */
export const createMockSound = (config?: {
  duration?: number;
  initialPosition?: number;
  shouldFail?: boolean;
  failureType?: 'load' | 'play' | 'seek';
}) => {
  const {
    duration = 120000,
    initialPosition = 0,
    shouldFail = false,
    failureType = 'load',
  } = config || {};

  let position = initialPosition;
  let isPlaying = false;
  let isLoaded = !shouldFail;
  let playbackCallback: ((status: any) => void) | null = null;

  const mockSound = {
    loadAsync: jest.fn(() => {
      if (shouldFail && failureType === 'load') {
        return Promise.reject(new Error('Failed to load audio'));
      }
      isLoaded = true;
      return Promise.resolve({ isLoaded: true });
    }),

    playAsync: jest.fn(() => {
      if (shouldFail && failureType === 'play') {
        return Promise.reject(new Error('Failed to play audio'));
      }
      isPlaying = true;
      return Promise.resolve();
    }),

    pauseAsync: jest.fn(() => {
      isPlaying = false;
      return Promise.resolve();
    }),

    stopAsync: jest.fn(() => {
      isPlaying = false;
      position = 0;
      return Promise.resolve();
    }),

    unloadAsync: jest.fn(() => {
      isLoaded = false;
      isPlaying = false;
      position = 0;
      return Promise.resolve();
    }),

    setPositionAsync: jest.fn((newPosition: number) => {
      if (shouldFail && failureType === 'seek') {
        return Promise.reject(new Error('Failed to seek'));
      }
      position = Math.max(0, Math.min(newPosition, duration));

      // Trigger status update after seeking
      if (playbackCallback) {
        playbackCallback({
          isLoaded: true,
          isPlaying,
          positionMillis: position,
          durationMillis: duration,
          didJustFinish: position >= duration,
        });
      }

      return Promise.resolve();
    }),

    getStatusAsync: jest.fn(() =>
      Promise.resolve({
        isLoaded,
        isPlaying,
        positionMillis: position,
        durationMillis: duration,
        didJustFinish: position >= duration,
      })
    ),

    setOnPlaybackStatusUpdate: jest.fn((callback) => {
      playbackCallback = callback;
    }),

    setVolumeAsync: jest.fn((volume: number) => Promise.resolve()),

    setRateAsync: jest.fn((rate: number) => Promise.resolve()),

    // Test helpers
    _triggerPlaybackUpdate: (status: any) => {
      if (playbackCallback) {
        playbackCallback(status);
      }
    },

    _simulatePlayback: (targetPosition: number, intervalMs = 100) => {
      const interval = setInterval(() => {
        if (!isPlaying || position >= targetPosition) {
          clearInterval(interval);
          return;
        }

        position = Math.min(position + intervalMs, duration);

        if (playbackCallback) {
          playbackCallback({
            isLoaded: true,
            isPlaying: true,
            positionMillis: position,
            durationMillis: duration,
            didJustFinish: position >= duration,
          });
        }

        if (position >= duration && playbackCallback) {
          playbackCallback({
            isLoaded: true,
            isPlaying: false,
            positionMillis: duration,
            durationMillis: duration,
            didJustFinish: true,
          });
        }
      }, intervalMs);

      return interval;
    },

    _getInternalState: () => ({
      position,
      isPlaying,
      isLoaded,
      duration,
    }),
  };

  return mockSound;
};

/**
 * Sets up expo-av Audio mock with customizable sound creation
 */
export const setupAudioMock = (soundFactory?: () => any) => {
  const defaultFactory = () => createMockSound();
  const factory = soundFactory || defaultFactory;

  (Audio.Sound.createAsync as jest.Mock) = jest.fn(() =>
    Promise.resolve({ sound: factory() })
  );

  return {
    resetMock: () => {
      (Audio.Sound.createAsync as jest.Mock).mockClear();
    },
    setSoundFactory: (newFactory: () => any) => {
      (Audio.Sound.createAsync as jest.Mock) = jest.fn(() =>
        Promise.resolve({ sound: newFactory() })
      );
    },
  };
};

/**
 * Creates mock MemoryItem test data
 */
export const createMockMemory = (overrides?: Partial<MemoryItem>): MemoryItem => {
  const id = overrides?.id || `memory-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  return {
    id,
    title: 'Test Memory',
    description: 'Test description',
    date: new Date(),
    duration: 120, // 2 minutes in seconds
    audioPath: 'file:///test/audio.m4a',
    transcription: 'Test transcription',
    tags: ['test'],
    isShared: false,
    familyMembers: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
};

/**
 * Creates multiple mock memories for list testing
 */
export const createMockMemories = (count: number, baseOverrides?: Partial<MemoryItem>): MemoryItem[] => {
  return Array.from({ length: count }, (_, index) =>
    createMockMemory({
      id: `memory-${index}`,
      title: `Memory ${index + 1}`,
      duration: 60 + index * 30, // Varying durations
      date: new Date(Date.now() - index * 24 * 60 * 60 * 1000), // Different dates
      ...baseOverrides,
    })
  );
};

/**
 * Time formatting utilities matching app implementation
 */
export const formatTime = {
  /**
   * Formats milliseconds to MM:SS or HH:MM:SS
   */
  toMMSS: (millis: number): string => {
    const totalSeconds = Math.floor(millis / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }

    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  },

  /**
   * Formats seconds to MM:SS or HH:MM:SS
   */
  secondsToMMSS: (seconds: number): string => {
    return formatTime.toMMSS(seconds * 1000);
  },

  /**
   * Parses MM:SS or HH:MM:SS to milliseconds
   */
  parseToMillis: (timeString: string): number => {
    const parts = timeString.split(':').map(Number);

    if (parts.length === 2) {
      const [minutes, seconds] = parts;
      return (minutes * 60 + seconds) * 1000;
    } else if (parts.length === 3) {
      const [hours, minutes, seconds] = parts;
      return (hours * 3600 + minutes * 60 + seconds) * 1000;
    }

    return 0;
  },
};

/**
 * Progress calculation utilities
 */
export const progressHelpers = {
  /**
   * Calculates progress percentage (0-1) from position and duration
   */
  calculateProgress: (positionMillis: number, durationMillis: number): number => {
    if (durationMillis === 0) return 0;
    return Math.min(Math.max(positionMillis / durationMillis, 0), 1);
  },

  /**
   * Calculates position from progress percentage and duration
   */
  calculatePosition: (progress: number, durationMillis: number): number => {
    return Math.floor(progress * durationMillis);
  },

  /**
   * Calculates position from tap location on progress bar
   */
  calculatePositionFromTap: (
    tapX: number,
    barWidth: number,
    durationMillis: number
  ): number => {
    const progress = Math.min(Math.max(tapX / barWidth, 0), 1);
    return progressHelpers.calculatePosition(progress, durationMillis);
  },
};

/**
 * Skip control utilities
 */
export const skipHelpers = {
  /**
   * Calculate new position after rewind (15 seconds back)
   */
  calculateRewindPosition: (currentPositionMillis: number, skipSeconds = 15): number => {
    return Math.max(0, currentPositionMillis - skipSeconds * 1000);
  },

  /**
   * Calculate new position after forward (15 seconds ahead)
   */
  calculateForwardPosition: (
    currentPositionMillis: number,
    durationMillis: number,
    skipSeconds = 15
  ): number => {
    return Math.min(durationMillis, currentPositionMillis + skipSeconds * 1000);
  },

  /**
   * Check if rewind is available (not at start)
   */
  canRewind: (currentPositionMillis: number): boolean => {
    return currentPositionMillis > 0;
  },

  /**
   * Check if forward is available (not at end)
   */
  canForward: (currentPositionMillis: number, durationMillis: number): boolean => {
    return currentPositionMillis < durationMillis;
  },
};

/**
 * Accessibility test helpers
 */
export const accessibilityHelpers = {
  /**
   * Validates touch target size meets elderly-friendly requirements
   */
  validateTouchTargetSize: (width: number, height: number, elderlyMode = true): boolean => {
    const minSize = elderlyMode ? 60 : 44; // 60px for elderly, 44px standard
    return width >= minSize && height >= minSize;
  },

  /**
   * Generates accessibility label for playback state
   */
  getPlaybackLabel: (isPlaying: boolean, title: string): string => {
    return isPlaying ? `Pause recording: ${title}` : `Play recording: ${title}`;
  },

  /**
   * Generates accessibility hint for playback control
   */
  getPlaybackHint: (isPlaying: boolean): string => {
    return isPlaying
      ? 'Double tap to pause playback'
      : 'Double tap to start playback';
  },

  /**
   * Generates time accessibility announcement
   */
  getTimeAnnouncement: (currentMillis: number, durationMillis: number): string => {
    const current = formatTime.toMMSS(currentMillis);
    const total = formatTime.toMMSS(durationMillis);
    return `${current} of ${total}`;
  },
};

/**
 * Wait for playback status update
 */
export const waitForPlaybackUpdate = async (
  mockSound: any,
  expectedPosition?: number,
  timeout = 1000
): Promise<void> => {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();

    const checkStatus = async () => {
      const status = await mockSound.getStatusAsync();

      if (expectedPosition !== undefined) {
        if (status.positionMillis === expectedPosition) {
          resolve();
          return;
        }
      } else {
        resolve();
        return;
      }

      if (Date.now() - startTime > timeout) {
        reject(new Error('Timeout waiting for playback update'));
        return;
      }

      setTimeout(checkStatus, 50);
    };

    checkStatus();
  });
};

/**
 * Simulate complete playback from start to finish
 */
export const simulateCompletePlayback = async (
  mockSound: any,
  onUpdate?: (status: any) => void
): Promise<void> => {
  const status = await mockSound.getStatusAsync();
  const { durationMillis } = status;

  // Simulate updates every 100ms
  const updateInterval = 100;
  const totalUpdates = Math.floor(durationMillis / updateInterval);

  for (let i = 0; i <= totalUpdates; i++) {
    const position = Math.min(i * updateInterval, durationMillis);
    const updateStatus = {
      isLoaded: true,
      isPlaying: position < durationMillis,
      positionMillis: position,
      durationMillis,
      didJustFinish: position >= durationMillis,
    };

    mockSound._triggerPlaybackUpdate(updateStatus);

    if (onUpdate) {
      onUpdate(updateStatus);
    }

    await new Promise(resolve => setTimeout(resolve, 10)); // Small delay
  }
};

/**
 * Test data sets for edge cases
 */
export const edgeCaseMemories = {
  veryShort: createMockMemory({ duration: 5, title: 'Very Short Audio' }),
  veryLong: createMockMemory({ duration: 3600, title: 'One Hour Audio' }),
  noAudio: createMockMemory({ audioPath: undefined, title: 'No Audio' }),
  corruptedAudio: createMockMemory({
    audioPath: 'file:///corrupted/audio.m4a',
    title: 'Corrupted Audio'
  }),
  missingFile: createMockMemory({
    audioPath: 'file:///missing/audio.m4a',
    title: 'Missing File'
  }),
};

/**
 * Custom matchers for audio testing
 */
export const audioMatchers = {
  /**
   * Check if time is formatted correctly as MM:SS
   */
  toBeValidTimeFormat: (received: string) => {
    const mmssPattern = /^\d{2}:\d{2}$/;
    const hhmmssPattern = /^\d{1,2}:\d{2}:\d{2}$/;

    const pass = mmssPattern.test(received) || hhmmssPattern.test(received);

    return {
      pass,
      message: () =>
        pass
          ? `expected ${received} not to be valid time format`
          : `expected ${received} to be valid time format (MM:SS or HH:MM:SS)`,
    };
  },

  /**
   * Check if progress is within valid range (0-1)
   */
  toBeValidProgress: (received: number) => {
    const pass = received >= 0 && received <= 1;

    return {
      pass,
      message: () =>
        pass
          ? `expected ${received} not to be between 0 and 1`
          : `expected ${received} to be between 0 and 1 (valid progress)`,
    };
  },

  /**
   * Check if touch target meets accessibility standards
   */
  toMeetAccessibilityStandards: (element: any, elderlyMode = true) => {
    const minSize = elderlyMode ? 60 : 44;
    const { width, height } = element.props?.style || {};
    const pass = width >= minSize && height >= minSize;

    return {
      pass,
      message: () =>
        pass
          ? `expected touch target (${width}x${height}) not to meet ${minSize}px minimum`
          : `expected touch target (${width}x${height}) to meet ${minSize}px minimum`,
    };
  },
};

/**
 * Setup function for audio playback tests
 */
export const setupAudioTest = () => {
  const mockSound = createMockSound();
  const audioMock = setupAudioMock(() => mockSound);

  return {
    mockSound,
    audioMock,
    cleanup: () => {
      audioMock.resetMock();
      jest.clearAllMocks();
    },
  };
};

export default {
  createMockSound,
  setupAudioMock,
  createMockMemory,
  createMockMemories,
  formatTime,
  progressHelpers,
  skipHelpers,
  accessibilityHelpers,
  waitForPlaybackUpdate,
  simulateCompletePlayback,
  edgeCaseMemories,
  audioMatchers,
  setupAudioTest,
};
