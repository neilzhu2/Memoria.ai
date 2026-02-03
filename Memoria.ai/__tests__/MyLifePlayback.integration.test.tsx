import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import { Alert } from 'react-native';
import { Audio } from 'expo-av';
import * as Haptics from 'expo-haptics';
import MyLifeScreen from '@/app/(tabs)/mylife';
import { RecordingProvider } from '@/contexts/RecordingContext';

// Mock dependencies
jest.mock('expo-haptics');
jest.mock('expo-router', () => ({
  useRouter: () => ({
    setParams: jest.fn(),
  }),
  useLocalSearchParams: () => ({}),
}));

jest.mock('expo-av', () => ({
  Audio: {
    Sound: {
      createAsync: jest.fn(),
    },
  },
}));

// Mock RecordingContext with test data
const mockMemories = [
  {
    id: 'memory-1',
    title: 'Talk about your childhood home',
    description: 'Recording about: Talk about your childhood home',
    date: new Date('2024-01-15'),
    duration: 120, // 2 minutes
    audioPath: 'file:///path/to/recording1.m4a',
    tags: ['childhood', 'home'],
    isShared: false,
    familyMembers: [],
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-15'),
  },
  {
    id: 'memory-2',
    title: 'Family gathering memories',
    description: 'Recording about family events',
    date: new Date('2024-01-16'),
    duration: 180, // 3 minutes
    audioPath: 'file:///path/to/recording2.m4a',
    tags: ['family'],
    isShared: true,
    familyMembers: ['John', 'Mary'],
    createdAt: new Date('2024-01-16'),
    updatedAt: new Date('2024-01-16'),
  },
  {
    id: 'memory-3',
    title: 'No audio memory',
    description: 'This memory has no audio file',
    date: new Date('2024-01-17'),
    duration: 0,
    audioPath: undefined,
    tags: [],
    isShared: false,
    familyMembers: [],
    createdAt: new Date('2024-01-17'),
    updatedAt: new Date('2024-01-17'),
  },
];

const mockStats = {
  totalMemories: 3,
  totalDuration: 300,
  memoriesThisWeek: 2,
  memoriesThisMonth: 3,
  favoriteTopics: ['childhood', 'family'],
  averageRecordingLength: 100,
};

jest.mock('@/contexts/RecordingContext', () => ({
  useRecording: () => ({
    memories: mockMemories,
    memoryStats: mockStats,
    removeMemory: jest.fn(),
    addMemory: jest.fn(),
    updateMemory: jest.fn(),
    triggerRecording: jest.fn(),
    isRecording: false,
    setIsRecording: jest.fn(),
    recordingTrigger: 0,
    memoryCount: 3,
    refreshStats: jest.fn(),
    generateSmartExport: jest.fn(),
    isExporting: false,
  }),
  RecordingProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

describe('MyLife Tab - Audio Playback Integration', () => {
  let mockSound: any;
  let mockPlaybackStatusCallback: any;

  beforeEach(() => {
    jest.clearAllMocks();
    Alert.alert = jest.fn();

    // Create mock sound object
    mockSound = {
      pauseAsync: jest.fn(),
      playAsync: jest.fn(),
      unloadAsync: jest.fn(),
      getStatusAsync: jest.fn(),
      setPositionAsync: jest.fn(),
      setOnPlaybackStatusUpdate: jest.fn((callback) => {
        mockPlaybackStatusCallback = callback;
      }),
    };

    // Mock Audio.Sound.createAsync to return our mock sound
    (Audio.Sound.createAsync as jest.Mock).mockResolvedValue({
      sound: mockSound,
    });
  });

  afterEach(() => {
    jest.clearAllTimers();
  });

  describe('Memory Display', () => {
    it('should render all memories in the list', () => {
      const { getByText } = render(<MyLifeScreen />);

      expect(getByText('Talk about your childhood home')).toBeTruthy();
      expect(getByText('Family gathering memories')).toBeTruthy();
      expect(getByText('No audio memory')).toBeTruthy();
    });

    it('should show waveform icon for memories with audio', () => {
      const { getByLabelText } = render(<MyLifeScreen />);

      const memoryWithAudio = getByLabelText('Memory: Talk about your childhood home');
      expect(memoryWithAudio).toBeTruthy();
    });

    it('should display memory duration correctly formatted', () => {
      const { getByText } = render(<MyLifeScreen />);

      expect(getByText('2:00')).toBeTruthy(); // 120 seconds
      expect(getByText('3:00')).toBeTruthy(); // 180 seconds
    });

    it('should show shared indicator for shared memories', () => {
      const { getByText } = render(<MyLifeScreen />);

      expect(getByText('Shared')).toBeTruthy();
    });
  });

  describe('Playback Controls - Basic Interaction', () => {
    it('should trigger haptic feedback when memory is tapped', async () => {
      const { getByLabelText } = render(<MyLifeScreen />);

      const memory = getByLabelText('Memory: Talk about your childhood home');
      await act(async () => {
        fireEvent.press(memory);
      });

      expect(Haptics.impactAsync).toHaveBeenCalledWith(
        Haptics.ImpactFeedbackStyle.Light
      );
    });

    it('should start playback when memory with audio is tapped', async () => {
      const { getByLabelText } = render(<MyLifeScreen />);

      const memory = getByLabelText('Memory: Talk about your childhood home');
      await act(async () => {
        fireEvent.press(memory);
      });

      await waitFor(() => {
        expect(Audio.Sound.createAsync).toHaveBeenCalledWith(
          { uri: 'file:///path/to/recording1.m4a' },
          { shouldPlay: true }
        );
      });
    });

    it('should show alert for memory without audio', async () => {
      const { getByLabelText } = render(<MyLifeScreen />);

      const memory = getByLabelText('Memory: No audio memory');
      await act(async () => {
        fireEvent.press(memory);
      });

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          'No audio memory',
          expect.stringContaining('This memory has no audio file')
        );
      });
    });
  });

  describe('Playback Controls - Expanded View', () => {
    it('should expand memory card to show playback controls when playing', async () => {
      const { getByLabelText, getByText } = render(<MyLifeScreen />);

      const memory = getByLabelText('Memory: Talk about your childhood home');
      await act(async () => {
        fireEvent.press(memory);
      });

      // Simulate playback starting
      await act(async () => {
        mockPlaybackStatusCallback({
          isLoaded: true,
          positionMillis: 0,
          durationMillis: 120000,
          isPlaying: true,
          didJustFinish: false,
        });
      });

      await waitFor(() => {
        // Should show time display
        expect(getByText(/0:00/)).toBeTruthy();

        // Should show control buttons
        expect(getByLabelText('Rewind 15 seconds')).toBeTruthy();
        expect(getByLabelText('Forward 15 seconds')).toBeTruthy();
        expect(getByLabelText('Pause')).toBeTruthy();
      });
    });

    it('should update progress bar as playback progresses', async () => {
      const { getByLabelText, getByText } = render(<MyLifeScreen />);

      const memory = getByLabelText('Memory: Talk about your childhood home');
      await act(async () => {
        fireEvent.press(memory);
      });

      // Simulate playback at 30 seconds
      await act(async () => {
        mockPlaybackStatusCallback({
          isLoaded: true,
          positionMillis: 30000,
          durationMillis: 120000,
          isPlaying: true,
          didJustFinish: false,
        });
      });

      await waitFor(() => {
        expect(getByText(/0:30/)).toBeTruthy();
      });
    });

    it('should toggle pause/play when tapped during playback', async () => {
      const { getByLabelText } = render(<MyLifeScreen />);

      const memory = getByLabelText('Memory: Talk about your childhood home');

      // Start playback
      await act(async () => {
        fireEvent.press(memory);
      });

      await waitFor(() => {
        expect(mockSound.playAsync).toHaveBeenCalled();
      });

      // Tap again to pause
      await act(async () => {
        fireEvent.press(memory);
      });

      await waitFor(() => {
        expect(mockSound.pauseAsync).toHaveBeenCalled();
      });
    });
  });

  describe('Skip Controls', () => {
    beforeEach(async () => {
      mockSound.getStatusAsync.mockResolvedValue({
        isLoaded: true,
        positionMillis: 60000, // 1 minute in
        durationMillis: 120000, // 2 minutes total
      });
    });

    it('should skip backward 15 seconds when rewind button is pressed', async () => {
      const { getByLabelText } = render(<MyLifeScreen />);

      const memory = getByLabelText('Memory: Talk about your childhood home');
      await act(async () => {
        fireEvent.press(memory);
      });

      const rewindButton = getByLabelText('Rewind 15 seconds');
      await act(async () => {
        fireEvent.press(rewindButton);
      });

      await waitFor(() => {
        expect(mockSound.getStatusAsync).toHaveBeenCalled();
        expect(mockSound.setPositionAsync).toHaveBeenCalledWith(45000); // 60s - 15s
      });

      expect(Haptics.impactAsync).toHaveBeenCalledWith(
        Haptics.ImpactFeedbackStyle.Light
      );
    });

    it('should skip forward 15 seconds when forward button is pressed', async () => {
      const { getByLabelText } = render(<MyLifeScreen />);

      const memory = getByLabelText('Memory: Talk about your childhood home');
      await act(async () => {
        fireEvent.press(memory);
      });

      const forwardButton = getByLabelText('Forward 15 seconds');
      await act(async () => {
        fireEvent.press(forwardButton);
      });

      await waitFor(() => {
        expect(mockSound.getStatusAsync).toHaveBeenCalled();
        expect(mockSound.setPositionAsync).toHaveBeenCalledWith(75000); // 60s + 15s
      });

      expect(Haptics.impactAsync).toHaveBeenCalledWith(
        Haptics.ImpactFeedbackStyle.Light
      );
    });

    it('should not skip backward past 0 seconds', async () => {
      mockSound.getStatusAsync.mockResolvedValue({
        isLoaded: true,
        positionMillis: 10000, // Only 10 seconds in
        durationMillis: 120000,
      });

      const { getByLabelText } = render(<MyLifeScreen />);

      const memory = getByLabelText('Memory: Talk about your childhood home');
      await act(async () => {
        fireEvent.press(memory);
      });

      const rewindButton = getByLabelText('Rewind 15 seconds');
      await act(async () => {
        fireEvent.press(rewindButton);
      });

      await waitFor(() => {
        expect(mockSound.setPositionAsync).toHaveBeenCalledWith(0); // Clamped to 0
      });
    });

    it('should not skip forward past duration', async () => {
      mockSound.getStatusAsync.mockResolvedValue({
        isLoaded: true,
        positionMillis: 110000, // Near the end
        durationMillis: 120000,
      });

      const { getByLabelText } = render(<MyLifeScreen />);

      const memory = getByLabelText('Memory: Talk about your childhood home');
      await act(async () => {
        fireEvent.press(memory);
      });

      const forwardButton = getByLabelText('Forward 15 seconds');
      await act(async () => {
        fireEvent.press(forwardButton);
      });

      await waitFor(() => {
        expect(mockSound.setPositionAsync).toHaveBeenCalledWith(120000); // Clamped to duration
      });
    });
  });

  describe('Multiple Memory Playback', () => {
    it('should stop first memory when second memory is played', async () => {
      const { getByLabelText } = render(<MyLifeScreen />);

      // Play first memory
      const memory1 = getByLabelText('Memory: Talk about your childhood home');
      await act(async () => {
        fireEvent.press(memory1);
      });

      await waitFor(() => {
        expect(Audio.Sound.createAsync).toHaveBeenCalledTimes(1);
      });

      // Play second memory
      const memory2 = getByLabelText('Memory: Family gathering memories');
      await act(async () => {
        fireEvent.press(memory2);
      });

      await waitFor(() => {
        expect(mockSound.unloadAsync).toHaveBeenCalled();
        expect(Audio.Sound.createAsync).toHaveBeenCalledTimes(2);
        expect(Audio.Sound.createAsync).toHaveBeenLastCalledWith(
          { uri: 'file:///path/to/recording2.m4a' },
          { shouldPlay: true }
        );
      });
    });
  });

  describe('Playback Completion', () => {
    it('should collapse controls and reset state when playback finishes', async () => {
      const { getByLabelText, queryByLabelText } = render(<MyLifeScreen />);

      const memory = getByLabelText('Memory: Talk about your childhood home');
      await act(async () => {
        fireEvent.press(memory);
      });

      // Simulate playback finishing
      await act(async () => {
        mockPlaybackStatusCallback({
          isLoaded: true,
          positionMillis: 120000,
          durationMillis: 120000,
          isPlaying: false,
          didJustFinish: true,
        });
      });

      await waitFor(() => {
        expect(mockSound.unloadAsync).toHaveBeenCalled();
        // Playback controls should be hidden
        expect(queryByLabelText('Pause')).toBeNull();
      });
    });
  });

  describe('Error Handling', () => {
    it('should show error alert if playback fails', async () => {
      (Audio.Sound.createAsync as jest.Mock).mockRejectedValue(
        new Error('Playback failed')
      );

      const { getByLabelText } = render(<MyLifeScreen />);

      const memory = getByLabelText('Memory: Talk about your childhood home');
      await act(async () => {
        fireEvent.press(memory);
      });

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith('Error', 'Failed to play audio.');
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper accessibility labels for playback controls', async () => {
      const { getByLabelText } = render(<MyLifeScreen />);

      const memory = getByLabelText('Memory: Talk about your childhood home');
      await act(async () => {
        fireEvent.press(memory);
      });

      await waitFor(() => {
        expect(getByLabelText('Rewind 15 seconds')).toBeTruthy();
        expect(getByLabelText('Forward 15 seconds')).toBeTruthy();
      });
    });

    it('should update accessibility hint based on whether memory has audio', () => {
      const { getByLabelText } = render(<MyLifeScreen />);

      const memoryWithAudio = getByLabelText('Memory: Talk about your childhood home');
      expect(memoryWithAudio.props.accessibilityHint).toBe('Tap to play recording');

      const memoryNoAudio = getByLabelText('Memory: No audio memory');
      expect(memoryNoAudio.props.accessibilityHint).toBe('Tap to view memory details');
    });
  });
});
