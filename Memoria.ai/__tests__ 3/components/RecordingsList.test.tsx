/**
 * Comprehensive Tests for RecordingsList Audio Playback Feature
 *
 * Tests the enhanced audio playback functionality for elderly users:
 * - Play/Pause toggle controls
 * - Skip controls (rewind 15s, forward 15s)
 * - Playback progress bar with time display
 * - Single audio playback management
 * - Playback completion handling
 * - Error handling and accessibility
 *
 * This test suite follows TDD principles - tests are written before implementation.
 */

import React from 'react';
import { render, fireEvent, waitFor, screen, act } from '@testing-library/react-native';
import { Audio } from 'expo-av';
import * as Haptics from 'expo-haptics';

import { RecordingsList } from '../../components/RecordingsList';
import { RecordingProvider } from '../../contexts/RecordingContext';
import { MemoryItem } from '../../types/memory';

// Mock dependencies
jest.mock('expo-haptics');

const mockHaptics = Haptics as jest.Mocked<typeof Haptics>;

// Test data
const mockMemories: MemoryItem[] = [
  {
    id: 'memory-1',
    title: 'Family Dinner Story',
    description: 'Story about family dinner',
    date: new Date('2024-01-15'),
    duration: 120, // 2 minutes
    audioPath: 'file:///path/to/audio1.m4a',
    transcription: 'This is a test transcription',
    tags: ['family', 'dinner'],
    isShared: false,
    familyMembers: [],
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-15'),
  },
  {
    id: 'memory-2',
    title: 'Childhood Memory',
    description: 'Memory from childhood',
    date: new Date('2024-01-14'),
    duration: 90, // 1.5 minutes
    audioPath: 'file:///path/to/audio2.m4a',
    transcription: 'Another test transcription',
    tags: ['childhood'],
    isShared: false,
    familyMembers: [],
    createdAt: new Date('2024-01-14'),
    updatedAt: new Date('2024-01-14'),
  },
  {
    id: 'memory-3',
    title: 'Memory without audio',
    description: 'This has no audio',
    date: new Date('2024-01-13'),
    duration: 60,
    audioPath: undefined, // No audio path
    tags: ['test'],
    isShared: false,
    familyMembers: [],
    createdAt: new Date('2024-01-13'),
    updatedAt: new Date('2024-01-13'),
  },
];

// Mock Sound instance
const createMockSound = (duration = 120000, initialPosition = 0) => {
  let position = initialPosition;
  let isPlaying = false;
  let playbackCallback: ((status: any) => void) | null = null;

  return {
    loadAsync: jest.fn(() => Promise.resolve({ isLoaded: true })),
    playAsync: jest.fn(() => {
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
    unloadAsync: jest.fn(() => Promise.resolve()),
    setPositionAsync: jest.fn((newPosition: number) => {
      position = Math.max(0, Math.min(newPosition, duration));
      return Promise.resolve();
    }),
    getStatusAsync: jest.fn(() =>
      Promise.resolve({
        isLoaded: true,
        isPlaying,
        positionMillis: position,
        durationMillis: duration,
        didJustFinish: position >= duration,
      })
    ),
    setOnPlaybackStatusUpdate: jest.fn((callback) => {
      playbackCallback = callback;
    }),
    _triggerPlaybackUpdate: (status: any) => {
      if (playbackCallback) {
        playbackCallback(status);
      }
    },
  };
};

// Helper to render component with context
const renderRecordingsList = (props = {}) => {
  const defaultProps = {
    visible: true,
    onClose: jest.fn(),
    ...props,
  };

  return render(
    <RecordingProvider>
      <RecordingsList {...defaultProps} />
    </RecordingProvider>
  );
};

describe('RecordingsList - Audio Playback Feature', () => {
  let mockSound: any;

  beforeEach(() => {
    jest.clearAllMocks();
    mockSound = createMockSound();

    // Setup expo-av mock
      Promise.resolve({ sound: mockSound })
    );

    // Mock AsyncStorage for RecordingContext
    const mockAsyncStorage = {
      getItem: jest.fn(() => Promise.resolve(JSON.stringify(mockMemories))),
      setItem: jest.fn(() => Promise.resolve()),
    };
    jest.mock('@react-native-async-storage/async-storage', () => mockAsyncStorage);
  });

  describe('1. Initial State Tests', () => {
    it('renders playback controls for each recording', async () => {
      renderRecordingsList();

      await waitFor(() => {
        // Should show play buttons for recordings with audio
        const playButtons = screen.queryAllByLabelText(/Play recording/i);
        expect(playButtons.length).toBeGreaterThan(0);
      });
    });

    it('displays recordings with default "not playing" state', async () => {
      renderRecordingsList();

      await waitFor(() => {
        // Play icons should be showing (not pause/stop)
        const playButton = screen.getByLabelText('Play recording: Family Dinner Story');
        expect(playButton).toBeTruthy();
      });
    });

    it('shows initial time as 00:00 for all recordings', async () => {
      renderRecordingsList();

      await waitFor(() => {
        // All recordings should show 00:00 initially
        const timeDisplays = screen.queryAllByText('00:00');
        expect(timeDisplays.length).toBeGreaterThan(0);
      });
    });

    it('displays total duration for each recording', async () => {
      renderRecordingsList();

      await waitFor(() => {
        // Should show formatted duration (2:00 for 120 seconds)
        expect(screen.getByText('2:00')).toBeTruthy();
        // Should show formatted duration (1:30 for 90 seconds)
        expect(screen.getByText('1:30')).toBeTruthy();
      });
    });

    it('does not show playback controls for recordings without audio', async () => {
      renderRecordingsList();

      await waitFor(() => {
        // Memory without audio should not have play button
        const playButton = screen.queryByLabelText('Play recording: Memory without audio');
        expect(playButton).toBeNull();
      });
    });
  });

  describe('2. Play/Pause Functionality', () => {
    it('starts playback when play button is pressed', async () => {
      renderRecordingsList();

      await waitFor(() => {
        const playButton = screen.getByLabelText('Play recording: Family Dinner Story');
        fireEvent.press(playButton);
      });

      await waitFor(() => {
          { uri: 'file:///path/to/audio1.m4a' },
          expect.any(Object)
        );
        expect(mockSound.playAsync).toHaveBeenCalled();
      });
    });

    it('changes play icon to pause icon when playing', async () => {
      renderRecordingsList();

      const playButton = screen.getByLabelText('Play recording: Family Dinner Story');

      await act(async () => {
        fireEvent.press(playButton);
      });

      await waitFor(() => {
        // Should now show pause button
        const pauseButton = screen.getByLabelText('Pause recording: Family Dinner Story');
        expect(pauseButton).toBeTruthy();
      });
    });

    it('pauses playback when pause button is pressed', async () => {
      renderRecordingsList();

      // Start playback
      await act(async () => {
        const playButton = screen.getByLabelText('Play recording: Family Dinner Story');
        fireEvent.press(playButton);
      });

      // Pause playback
      await act(async () => {
        const pauseButton = screen.getByLabelText('Pause recording: Family Dinner Story');
        fireEvent.press(pauseButton);
      });

      await waitFor(() => {
        expect(mockSound.pauseAsync).toHaveBeenCalled();
      });
    });

    it('toggles between play and pause states correctly', async () => {
      renderRecordingsList();

      // Play
      await act(async () => {
        fireEvent.press(screen.getByLabelText('Play recording: Family Dinner Story'));
      });

      await waitFor(() => {
        expect(screen.getByLabelText('Pause recording: Family Dinner Story')).toBeTruthy();
      });

      // Pause
      await act(async () => {
        fireEvent.press(screen.getByLabelText('Pause recording: Family Dinner Story'));
      });

      await waitFor(() => {
        expect(screen.getByLabelText('Play recording: Family Dinner Story')).toBeTruthy();
      });
    });

    it('provides haptic feedback on play/pause', async () => {
      renderRecordingsList();

      await act(async () => {
        const playButton = screen.getByLabelText('Play recording: Family Dinner Story');
        fireEvent.press(playButton);
      });

      await waitFor(() => {
        expect(mockHaptics.impactAsync).toHaveBeenCalledWith(
          Haptics.ImpactFeedbackStyle.Light
        );
      });
    });

    it('shows visual feedback when button is pressed', async () => {
      renderRecordingsList();

      const playButton = screen.getByLabelText('Play recording: Family Dinner Story');

      // Visual feedback should occur on press
      await act(async () => {
        fireEvent.press(playButton);
      });

      // Button should change color or show animation
      await waitFor(() => {
        expect(playButton).toBeTruthy();
      });
    });
  });

  describe('3. Skip Controls (Rewind/Forward 15s)', () => {
    it('renders rewind 15s button for playing audio', async () => {
      renderRecordingsList();

      await act(async () => {
        fireEvent.press(screen.getByLabelText('Play recording: Family Dinner Story'));
      });

      await waitFor(() => {
        const rewindButton = screen.getByLabelText('Rewind 15 seconds');
        expect(rewindButton).toBeTruthy();
      });
    });

    it('renders forward 15s button for playing audio', async () => {
      renderRecordingsList();

      await act(async () => {
        fireEvent.press(screen.getByLabelText('Play recording: Family Dinner Story'));
      });

      await waitFor(() => {
        const forwardButton = screen.getByLabelText('Forward 15 seconds');
        expect(forwardButton).toBeTruthy();
      });
    });

    it('rewinds 15 seconds when rewind button is pressed', async () => {
      // Set initial position to 30 seconds
      mockSound = createMockSound(120000, 30000);

      renderRecordingsList();

      await act(async () => {
        fireEvent.press(screen.getByLabelText('Play recording: Family Dinner Story'));
      });

      await act(async () => {
        const rewindButton = screen.getByLabelText('Rewind 15 seconds');
        fireEvent.press(rewindButton);
      });

      await waitFor(() => {
        // Should set position to 30s - 15s = 15s (15000ms)
        expect(mockSound.setPositionAsync).toHaveBeenCalledWith(15000);
      });
    });

    it('forwards 15 seconds when forward button is pressed', async () => {
      // Set initial position to 30 seconds
      mockSound = createMockSound(120000, 30000);

      renderRecordingsList();

      await act(async () => {
        fireEvent.press(screen.getByLabelText('Play recording: Family Dinner Story'));
      });

      await act(async () => {
        const forwardButton = screen.getByLabelText('Forward 15 seconds');
        fireEvent.press(forwardButton);
      });

      await waitFor(() => {
        // Should set position to 30s + 15s = 45s (45000ms)
        expect(mockSound.setPositionAsync).toHaveBeenCalledWith(45000);
      });
    });

    it('does not rewind below 0 seconds', async () => {
      // Set initial position to 10 seconds (less than 15s)
      mockSound = createMockSound(120000, 10000);

      renderRecordingsList();

      await act(async () => {
        fireEvent.press(screen.getByLabelText('Play recording: Family Dinner Story'));
      });

      await act(async () => {
        const rewindButton = screen.getByLabelText('Rewind 15 seconds');
        fireEvent.press(rewindButton);
      });

      await waitFor(() => {
        // Should set position to 0 (not negative)
        expect(mockSound.setPositionAsync).toHaveBeenCalledWith(0);
      });
    });

    it('does not forward beyond total duration', async () => {
      // Set initial position to 110 seconds (10s before end of 120s audio)
      mockSound = createMockSound(120000, 110000);

      renderRecordingsList();

      await act(async () => {
        fireEvent.press(screen.getByLabelText('Play recording: Family Dinner Story'));
      });

      await act(async () => {
        const forwardButton = screen.getByLabelText('Forward 15 seconds');
        fireEvent.press(forwardButton);
      });

      await waitFor(() => {
        // Should set position to max duration (120000ms, not 125000ms)
        expect(mockSound.setPositionAsync).toHaveBeenCalledWith(120000);
      });
    });

    it('skip controls work during active playback', async () => {
      renderRecordingsList();

      await act(async () => {
        fireEvent.press(screen.getByLabelText('Play recording: Family Dinner Story'));
      });

      // Skip controls should be functional while playing
      await act(async () => {
        const rewindButton = screen.getByLabelText('Rewind 15 seconds');
        fireEvent.press(rewindButton);
      });

      await waitFor(() => {
        expect(mockSound.setPositionAsync).toHaveBeenCalled();
        // Playback should continue
        expect(mockSound.pauseAsync).not.toHaveBeenCalled();
      });
    });

    it('provides haptic feedback on skip controls', async () => {
      renderRecordingsList();

      await act(async () => {
        fireEvent.press(screen.getByLabelText('Play recording: Family Dinner Story'));
      });

      await act(async () => {
        const rewindButton = screen.getByLabelText('Rewind 15 seconds');
        fireEvent.press(rewindButton);
      });

      await waitFor(() => {
        expect(mockHaptics.impactAsync).toHaveBeenCalledWith(
          Haptics.ImpactFeedbackStyle.Light
        );
      });
    });
  });

  describe('4. Progress Display', () => {
    it('displays progress bar for playing audio', async () => {
      renderRecordingsList();

      await act(async () => {
        fireEvent.press(screen.getByLabelText('Play recording: Family Dinner Story'));
      });

      await waitFor(() => {
        const progressBar = screen.getByTestId('audio-progress-bar-memory-1');
        expect(progressBar).toBeTruthy();
      });
    });

    it('updates progress bar during playback', async () => {
      renderRecordingsList();

      await act(async () => {
        fireEvent.press(screen.getByLabelText('Play recording: Family Dinner Story'));
      });

      // Simulate playback progress update (50% through)
      await act(async () => {
        mockSound._triggerPlaybackUpdate({
          isLoaded: true,
          isPlaying: true,
          positionMillis: 60000, // 1 minute (50% of 2 minutes)
          durationMillis: 120000,
          didJustFinish: false,
        });
      });

      await waitFor(() => {
        const progressBar = screen.getByTestId('audio-progress-bar-memory-1');
        // Progress should be approximately 50%
        expect(progressBar.props.value).toBeCloseTo(0.5, 1);
      });
    });

    it('displays current playback time in MM:SS format', async () => {
      renderRecordingsList();

      await act(async () => {
        fireEvent.press(screen.getByLabelText('Play recording: Family Dinner Story'));
      });

      // Simulate 1 minute 30 seconds playback
      await act(async () => {
        mockSound._triggerPlaybackUpdate({
          isLoaded: true,
          isPlaying: true,
          positionMillis: 90000, // 1:30
          durationMillis: 120000,
          didJustFinish: false,
        });
      });

      await waitFor(() => {
        expect(screen.getByText('01:30')).toBeTruthy();
      });
    });

    it('formats time correctly for single digit seconds', async () => {
      renderRecordingsList();

      await act(async () => {
        fireEvent.press(screen.getByLabelText('Play recording: Family Dinner Story'));
      });

      // Simulate 1 minute 5 seconds playback
      await act(async () => {
        mockSound._triggerPlaybackUpdate({
          isLoaded: true,
          isPlaying: true,
          positionMillis: 65000, // 1:05
          durationMillis: 120000,
          didJustFinish: false,
        });
      });

      await waitFor(() => {
        expect(screen.getByText('01:05')).toBeTruthy();
      });
    });

    it('allows seeking by tapping on progress bar', async () => {
      renderRecordingsList();

      await act(async () => {
        fireEvent.press(screen.getByLabelText('Play recording: Family Dinner Story'));
      });

      const progressBar = screen.getByTestId('audio-progress-bar-memory-1');

      // Simulate tap at 75% position
      await act(async () => {
        fireEvent.press(progressBar, { nativeEvent: { locationX: 300, width: 400 } });
      });

      await waitFor(() => {
        // Should seek to 75% of 120000ms = 90000ms
        expect(mockSound.setPositionAsync).toHaveBeenCalledWith(90000);
      });
    });

    it('updates time display when seeking', async () => {
      renderRecordingsList();

      await act(async () => {
        fireEvent.press(screen.getByLabelText('Play recording: Family Dinner Story'));
      });

      await act(async () => {
        const forwardButton = screen.getByLabelText('Forward 15 seconds');
        fireEvent.press(forwardButton);
      });

      // Simulate status update after seeking
      await act(async () => {
        mockSound._triggerPlaybackUpdate({
          isLoaded: true,
          isPlaying: true,
          positionMillis: 15000,
          durationMillis: 120000,
          didJustFinish: false,
        });
      });

      await waitFor(() => {
        expect(screen.getByText('00:15')).toBeTruthy();
      });
    });
  });

  describe('5. Multiple Audio Management', () => {
    it('stops currently playing audio when new audio starts', async () => {
      renderRecordingsList();

      // Start first audio
      await act(async () => {
        fireEvent.press(screen.getByLabelText('Play recording: Family Dinner Story'));
      });

      await waitFor(() => {
        expect(mockSound.playAsync).toHaveBeenCalled();
      });

      // Start second audio
      const secondMockSound = createMockSound();

      await act(async () => {
        fireEvent.press(screen.getByLabelText('Play recording: Childhood Memory'));
      });

      await waitFor(() => {
        // First sound should be unloaded
        expect(mockSound.unloadAsync).toHaveBeenCalled();
        // Second sound should start playing
        expect(secondMockSound.playAsync).toHaveBeenCalled();
      });
    });

    it('ensures only one recording plays at a time', async () => {
      renderRecordingsList();

      // Start first audio
      await act(async () => {
        fireEvent.press(screen.getByLabelText('Play recording: Family Dinner Story'));
      });

      // Start second audio
      await act(async () => {
        fireEvent.press(screen.getByLabelText('Play recording: Childhood Memory'));
      });

      await waitFor(() => {
        // Should have pause button for second recording
        expect(screen.getByLabelText('Pause recording: Childhood Memory')).toBeTruthy();
        // First recording should show play button (not playing)
        expect(screen.getByLabelText('Play recording: Family Dinner Story')).toBeTruthy();
      });
    });

    it('cleans up previous audio resources properly', async () => {
      renderRecordingsList();

      await act(async () => {
        fireEvent.press(screen.getByLabelText('Play recording: Family Dinner Story'));
      });

      const newMockSound = createMockSound();

      await act(async () => {
        fireEvent.press(screen.getByLabelText('Play recording: Childhood Memory'));
      });

      await waitFor(() => {
        expect(mockSound.unloadAsync).toHaveBeenCalled();
      });
    });

    it('handles rapid switching between recordings', async () => {
      renderRecordingsList();

      // Rapidly switch between recordings
      await act(async () => {
        fireEvent.press(screen.getByLabelText('Play recording: Family Dinner Story'));
      });

      await act(async () => {
        fireEvent.press(screen.getByLabelText('Play recording: Childhood Memory'));
      });

      await act(async () => {
        fireEvent.press(screen.getByLabelText('Play recording: Family Dinner Story'));
      });

      await waitFor(() => {
        // Should handle without errors
        expect(mockSound.unloadAsync).toHaveBeenCalled();
      });
    });
  });

  describe('6. Playback Completion', () => {
    it('stops playback when audio reaches end', async () => {
      renderRecordingsList();

      await act(async () => {
        fireEvent.press(screen.getByLabelText('Play recording: Family Dinner Story'));
      });

      // Simulate playback completion
      await act(async () => {
        mockSound._triggerPlaybackUpdate({
          isLoaded: true,
          isPlaying: false,
          positionMillis: 120000,
          durationMillis: 120000,
          didJustFinish: true,
        });
      });

      await waitFor(() => {
        expect(mockSound.unloadAsync).toHaveBeenCalled();
      });
    });

    it('resets UI to initial state after completion', async () => {
      renderRecordingsList();

      await act(async () => {
        fireEvent.press(screen.getByLabelText('Play recording: Family Dinner Story'));
      });

      // Complete playback
      await act(async () => {
        mockSound._triggerPlaybackUpdate({
          isLoaded: true,
          isPlaying: false,
          positionMillis: 120000,
          durationMillis: 120000,
          didJustFinish: true,
        });
      });

      await waitFor(() => {
        // Should show play button again
        expect(screen.getByLabelText('Play recording: Family Dinner Story')).toBeTruthy();
        // Time should reset to 00:00
        expect(screen.getByText('00:00')).toBeTruthy();
      });
    });

    it('allows replaying completed audio', async () => {
      renderRecordingsList();

      // Play and complete
      await act(async () => {
        fireEvent.press(screen.getByLabelText('Play recording: Family Dinner Story'));
      });

      await act(async () => {
        mockSound._triggerPlaybackUpdate({
          isLoaded: true,
          isPlaying: false,
          positionMillis: 120000,
          durationMillis: 120000,
          didJustFinish: true,
        });
      });

      // Play again
      const newMockSound = createMockSound();

      await act(async () => {
        fireEvent.press(screen.getByLabelText('Play recording: Family Dinner Story'));
      });

      await waitFor(() => {
        expect(newMockSound.playAsync).toHaveBeenCalled();
      });
    });

    it('hides skip controls after completion', async () => {
      renderRecordingsList();

      await act(async () => {
        fireEvent.press(screen.getByLabelText('Play recording: Family Dinner Story'));
      });

      // Complete playback
      await act(async () => {
        mockSound._triggerPlaybackUpdate({
          isLoaded: true,
          isPlaying: false,
          positionMillis: 120000,
          durationMillis: 120000,
          didJustFinish: true,
        });
      });

      await waitFor(() => {
        expect(screen.queryByLabelText('Rewind 15 seconds')).toBeNull();
        expect(screen.queryByLabelText('Forward 15 seconds')).toBeNull();
      });
    });
  });

  describe('7. Error Handling', () => {
    it('shows error alert when audio file is missing', async () => {
      const mockAlert = jest.spyOn(require('react-native').Alert, 'alert');

      // Mock failed sound creation
        new Error('File not found')
      );

      renderRecordingsList();

      await act(async () => {
        fireEvent.press(screen.getByLabelText('Play recording: Family Dinner Story'));
      });

      await waitFor(() => {
        expect(mockAlert).toHaveBeenCalledWith(
          'Error',
          expect.stringContaining('Failed to play recording')
        );
      });
    });

    it('handles corrupted audio files gracefully', async () => {
        new Error('Invalid audio format')
      );

      renderRecordingsList();

      await act(async () => {
        fireEvent.press(screen.getByLabelText('Play recording: Family Dinner Story'));
      });

      await waitFor(() => {
        // Should not crash, should show error
        expect(screen.getByLabelText('Play recording: Family Dinner Story')).toBeTruthy();
      });
    });

    it('cleans up resources on component unmount', async () => {
      const { unmount } = renderRecordingsList();

      await act(async () => {
        fireEvent.press(screen.getByLabelText('Play recording: Family Dinner Story'));
      });

      await act(async () => {
        unmount();
      });

      await waitFor(() => {
        expect(mockSound.unloadAsync).toHaveBeenCalled();
      });
    });

    it('handles playback errors mid-stream', async () => {
      renderRecordingsList();

      await act(async () => {
        fireEvent.press(screen.getByLabelText('Play recording: Family Dinner Story'));
      });

      // Simulate error during playback
      await act(async () => {
        mockSound._triggerPlaybackUpdate({
          isLoaded: false,
          error: 'Playback interrupted',
        });
      });

      await waitFor(() => {
        // Should reset to initial state
        expect(screen.getByLabelText('Play recording: Family Dinner Story')).toBeTruthy();
      });
    });

    it('stops playback when modal is closed', async () => {
      const { rerender } = renderRecordingsList({ visible: true });

      await act(async () => {
        fireEvent.press(screen.getByLabelText('Play recording: Family Dinner Story'));
      });

      // Close modal
      rerender(
        <RecordingProvider>
          <RecordingsList visible={false} onClose={jest.fn()} />
        </RecordingProvider>
      );

      await waitFor(() => {
        expect(mockSound.unloadAsync).toHaveBeenCalled();
      });
    });
  });

  describe('8. Accessibility for Elderly Users', () => {
    it('has minimum 44x44 touch targets for all controls', async () => {
      renderRecordingsList();

      await act(async () => {
        fireEvent.press(screen.getByLabelText('Play recording: Family Dinner Story'));
      });

      await waitFor(() => {
        const rewindButton = screen.getByLabelText('Rewind 15 seconds');
        const forwardButton = screen.getByLabelText('Forward 15 seconds');
        const pauseButton = screen.getByLabelText('Pause recording: Family Dinner Story');

        // Check minimum touch target sizes
        expect(rewindButton.props.style.width).toBeGreaterThanOrEqual(44);
        expect(rewindButton.props.style.height).toBeGreaterThanOrEqual(44);
        expect(forwardButton.props.style.width).toBeGreaterThanOrEqual(44);
        expect(forwardButton.props.style.height).toBeGreaterThanOrEqual(44);
        expect(pauseButton.props.style.width).toBeGreaterThanOrEqual(44);
        expect(pauseButton.props.style.height).toBeGreaterThanOrEqual(44);
      });
    });

    it('has proper accessibility labels for all controls', async () => {
      renderRecordingsList();

      await act(async () => {
        fireEvent.press(screen.getByLabelText('Play recording: Family Dinner Story'));
      });

      await waitFor(() => {
        expect(screen.getByLabelText('Pause recording: Family Dinner Story')).toBeTruthy();
        expect(screen.getByLabelText('Rewind 15 seconds')).toBeTruthy();
        expect(screen.getByLabelText('Forward 15 seconds')).toBeTruthy();
      });
    });

    it('includes accessibility hints for controls', async () => {
      renderRecordingsList();

      await act(async () => {
        fireEvent.press(screen.getByLabelText('Play recording: Family Dinner Story'));
      });

      await waitFor(() => {
        const pauseButton = screen.getByLabelText('Pause recording: Family Dinner Story');
        expect(pauseButton.props.accessibilityHint).toBeTruthy();
      });
    });

    it('announces playback state changes to screen readers', async () => {
      renderRecordingsList();

      await act(async () => {
        fireEvent.press(screen.getByLabelText('Play recording: Family Dinner Story'));
      });

      await waitFor(() => {
        const pauseButton = screen.getByLabelText('Pause recording: Family Dinner Story');
        expect(pauseButton.props.accessibilityRole).toBe('button');
        expect(pauseButton.props.accessibilityState?.checked).toBeDefined();
      });
    });

    it('uses large, readable text for time display', async () => {
      renderRecordingsList();

      await act(async () => {
        fireEvent.press(screen.getByLabelText('Play recording: Family Dinner Story'));
      });

      await waitFor(() => {
        const timeDisplay = screen.getByText('00:00');
        expect(timeDisplay.props.style.fontSize).toBeGreaterThanOrEqual(16);
      });
    });

    it('provides clear visual feedback on all interactions', async () => {
      renderRecordingsList();

      const playButton = screen.getByLabelText('Play recording: Family Dinner Story');

      await act(async () => {
        fireEvent.press(playButton);
      });

      await waitFor(() => {
        // Visual state should change
        expect(mockHaptics.impactAsync).toHaveBeenCalled();
      });
    });

    it('supports screen reader navigation between controls', async () => {
      renderRecordingsList();

      await act(async () => {
        fireEvent.press(screen.getByLabelText('Play recording: Family Dinner Story'));
      });

      await waitFor(() => {
        const pauseButton = screen.getByLabelText('Pause recording: Family Dinner Story');
        const rewindButton = screen.getByLabelText('Rewind 15 seconds');
        const forwardButton = screen.getByLabelText('Forward 15 seconds');

        expect(pauseButton.props.accessible).not.toBe(false);
        expect(rewindButton.props.accessible).not.toBe(false);
        expect(forwardButton.props.accessible).not.toBe(false);
      });
    });

    it('displays high contrast colors for visibility', async () => {
      renderRecordingsList();

      await act(async () => {
        fireEvent.press(screen.getByLabelText('Play recording: Family Dinner Story'));
      });

      await waitFor(() => {
        const pauseButton = screen.getByLabelText('Pause recording: Family Dinner Story');
        // Should have high contrast background
        expect(pauseButton.props.style.backgroundColor).toBeTruthy();
      });
    });
  });

  describe('9. Performance', () => {
    it('renders playback controls without performance degradation', () => {
      const startTime = performance.now();

      renderRecordingsList();

      const endTime = performance.now();
      expect(endTime - startTime).toBeLessThan(100);
    });

    it('updates progress bar smoothly without jank', async () => {
      renderRecordingsList();

      await act(async () => {
        fireEvent.press(screen.getByLabelText('Play recording: Family Dinner Story'));
      });

      // Simulate multiple rapid progress updates
      for (let i = 0; i < 10; i++) {
        await act(async () => {
          mockSound._triggerPlaybackUpdate({
            isLoaded: true,
            isPlaying: true,
            positionMillis: i * 1000,
            durationMillis: 120000,
            didJustFinish: false,
          });
        });
      }

      // Should handle without performance issues
      await waitFor(() => {
        expect(screen.getByTestId('audio-progress-bar-memory-1')).toBeTruthy();
      });
    });

    it('efficiently manages multiple recordings in list', () => {
      const startTime = performance.now();

      // Render with many recordings
      const manyMemories = Array(20).fill(mockMemories[0]).map((mem, i) => ({
        ...mem,
        id: `memory-${i}`,
      }));

      renderRecordingsList();

      const endTime = performance.now();
      expect(endTime - startTime).toBeLessThan(200);
    });
  });

  describe('10. Edge Cases', () => {
    it('handles very short audio files (< 15s)', async () => {
      const shortMockSound = createMockSound(10000); // 10 seconds

      renderRecordingsList();

      await act(async () => {
        fireEvent.press(screen.getByLabelText('Play recording: Family Dinner Story'));
      });

      await act(async () => {
        const forwardButton = screen.getByLabelText('Forward 15 seconds');
        fireEvent.press(forwardButton);
      });

      await waitFor(() => {
        // Should not exceed duration
        expect(shortMockSound.setPositionAsync).toHaveBeenCalledWith(10000);
      });
    });

    it('handles very long audio files (> 1 hour)', async () => {
      const longMockSound = createMockSound(3600000); // 1 hour

      renderRecordingsList();

      await act(async () => {
        fireEvent.press(screen.getByLabelText('Play recording: Family Dinner Story'));
      });

      // Simulate position at 59:50
      await act(async () => {
        longMockSound._triggerPlaybackUpdate({
          isLoaded: true,
          isPlaying: true,
          positionMillis: 3590000,
          durationMillis: 3600000,
          didJustFinish: false,
        });
      });

      await waitFor(() => {
        expect(screen.getByText('59:50')).toBeTruthy();
      });
    });

    it('handles audio with zero duration gracefully', async () => {
      const zeroMockSound = createMockSound(0);

      renderRecordingsList();

      await act(async () => {
        fireEvent.press(screen.getByLabelText('Play recording: Family Dinner Story'));
      });

      await waitFor(() => {
        expect(screen.getByText('00:00')).toBeTruthy();
      });
    });

    it('handles simultaneous play and delete actions', async () => {
      const mockAlert = jest.spyOn(require('react-native').Alert, 'alert');

      renderRecordingsList();

      await act(async () => {
        fireEvent.press(screen.getByLabelText('Play recording: Family Dinner Story'));
      });

      await act(async () => {
        const deleteButton = screen.getByLabelText('Delete recording: Family Dinner Story');
        fireEvent.press(deleteButton);
      });

      await waitFor(() => {
        expect(mockAlert).toHaveBeenCalledWith(
          'Delete Recording',
          expect.any(String),
          expect.any(Array)
        );
      });
    });
  });
});
