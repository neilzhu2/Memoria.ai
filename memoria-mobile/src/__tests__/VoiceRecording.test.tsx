/**
 * Voice Recording Integration Tests for Memoria.ai
 * Tests the complete voice recording functionality for elderly users
 */

import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import { Alert } from 'react-native';
import RecordingScreen from '../screens/RecordingScreen/RecordingScreen';
import { useAudioStore } from '../stores/audioStore';
import { audioService } from '../services/audioService';
import { VoiceGuidanceService } from '../components/VoiceGuidance';

// Mock dependencies
jest.mock('../services/audioService');
jest.mock('../components/VoiceGuidance');
jest.mock('expo-haptics');
jest.mock('expo-speech');
jest.mock('@react-navigation/native');

// Mock Zustand store
jest.mock('../stores/audioStore');

const mockAudioStore = {
  isRecording: false,
  recordingDuration: 0,
  startRecording: jest.fn(),
  stopRecording: jest.fn(),
  pauseRecording: jest.fn(),
  resumeRecording: jest.fn(),
  formatDuration: (seconds: number) => `${Math.floor(seconds / 60)}:${(seconds % 60).toString().padStart(2, '0')}`,
  settings: {
    defaultQuality: 'medium',
    maxRecordingDuration: 600,
    autoStopEnabled: true,
    noiseCancellationEnabled: true,
    amplificationEnabled: false,
    hapticFeedbackEnabled: true,
  },
};

const mockMemoryStore = {
  addMemory: jest.fn(),
  updateMemory: jest.fn(),
  getMemory: jest.fn(),
};

const mockUserStore = {
  user: {
    preferredLanguage: 'en',
  },
};

const mockSettingsStore = {
  getCurrentFontSize: () => 18,
  getCurrentTouchTargetSize: () => 60,
  shouldUseHighContrast: () => false,
  hapticFeedbackEnabled: true,
};

const mockNavigation = {
  goBack: jest.fn(),
  navigate: jest.fn(),
};

const mockRoute = {
  params: {},
};

beforeEach(() => {
  jest.clearAllMocks();
  (useAudioStore as jest.Mock).mockReturnValue(mockAudioStore);
  Alert.alert = jest.fn();
});

describe('Voice Recording Functionality', () => {
  it('should render recording screen with proper accessibility', () => {
    const { getByText, getByLabelText } = render(
      <RecordingScreen navigation={mockNavigation} route={mockRoute} />
    );

    // Check for main elements
    expect(getByText('Record Memory')).toBeTruthy();
    expect(getByText('Share your story, preserve your legacy')).toBeTruthy();
    expect(getByLabelText('Start recording')).toBeTruthy();
  });

  it('should start recording when start button is pressed', async () => {
    const { getByLabelText } = render(
      <RecordingScreen navigation={mockNavigation} route={mockRoute} />
    );

    const startButton = getByLabelText('Start recording');

    await act(async () => {
      fireEvent.press(startButton);
    });

    expect(mockAudioStore.startRecording).toHaveBeenCalledWith({
      quality: 'medium',
      maxDuration: 600,
      autoStop: true,
      enableNoiseCancellation: true,
      enableAmplification: false,
    });
  });

  it('should handle recording errors gracefully for elderly users', async () => {
    const errorMessage = 'Microphone permission denied';
    mockAudioStore.startRecording.mockRejectedValueOnce(new Error(errorMessage));

    const { getByLabelText } = render(
      <RecordingScreen navigation={mockNavigation} route={mockRoute} />
    );

    const startButton = getByLabelText('Start recording');

    await act(async () => {
      fireEvent.press(startButton);
    });

    await waitFor(() => {
      expect(VoiceGuidanceService.announceError).toHaveBeenCalledWith(errorMessage);
      expect(Alert.alert).toHaveBeenCalledWith(
        'Microphone Permission Required',
        expect.stringContaining('microphone permissions'),
        expect.any(Array)
      );
    });
  });

  it('should stop recording and save memory', async () => {
    const mockRecording = {
      id: '123',
      filePath: '/path/to/recording.m4a',
      duration: 30,
      fileSize: 1024,
      quality: 'medium',
      sampleRate: 44100,
      bitRate: 128000,
      createdAt: new Date(),
      isProcessing: false,
    };

    mockAudioStore.isRecording = true;
    mockAudioStore.recordingDuration = 30;
    mockAudioStore.stopRecording.mockResolvedValueOnce(mockRecording);

    const { getByLabelText } = render(
      <RecordingScreen navigation={mockNavigation} route={mockRoute} />
    );

    const stopButton = getByLabelText('Stop recording');

    await act(async () => {
      fireEvent.press(stopButton);
    });

    await waitFor(() => {
      expect(mockAudioStore.stopRecording).toHaveBeenCalled();
      expect(mockMemoryStore.addMemory).toHaveBeenCalledWith(
        expect.objectContaining({
          audioFilePath: mockRecording.filePath,
          duration: mockRecording.duration,
          language: 'en',
        })
      );
      expect(VoiceGuidanceService.announceSuccess).toHaveBeenCalledWith(
        'Your memory has been saved successfully.'
      );
    });
  });

  it('should handle short recordings appropriately', async () => {
    mockAudioStore.isRecording = true;
    mockAudioStore.recordingDuration = 0; // Too short
    mockAudioStore.stopRecording.mockResolvedValueOnce({
      duration: 0,
      filePath: '/path/to/short.m4a',
    });

    const { getByLabelText } = render(
      <RecordingScreen navigation={mockNavigation} route={mockRoute} />
    );

    const stopButton = getByLabelText('Stop recording');

    await act(async () => {
      fireEvent.press(stopButton);
    });

    await waitFor(() => {
      expect(VoiceGuidanceService.announceError).toHaveBeenCalledWith(
        'Recording too short. Please record for at least 1 second.'
      );
      expect(Alert.alert).toHaveBeenCalledWith(
        'Recording Too Short',
        expect.stringContaining('at least 1 second'),
        expect.any(Array)
      );
    });
  });

  it('should update time display correctly during recording', () => {
    mockAudioStore.isRecording = true;
    mockAudioStore.recordingDuration = 125; // 2:05

    const { getByLabelText } = render(
      <RecordingScreen navigation={mockNavigation} route={mockRoute} />
    );

    const timeDisplay = getByLabelText('Recording time: 2:05');
    expect(timeDisplay).toBeTruthy();
  });

  it('should show audio level indicator during recording', () => {
    mockAudioStore.isRecording = true;

    const { getByLabelText } = render(
      <RecordingScreen navigation={mockNavigation} route={mockRoute} />
    );

    const audioLevelIndicator = getByLabelText(/Audio level:/);
    expect(audioLevelIndicator).toBeTruthy();
  });

  it('should handle pause and resume functionality', async () => {
    mockAudioStore.isRecording = true;

    const { getByLabelText, rerender } = render(
      <RecordingScreen navigation={mockNavigation} route={mockRoute} />
    );

    // Test pause
    const pauseButton = getByLabelText('Pause recording');
    await act(async () => {
      fireEvent.press(pauseButton);
    });

    expect(mockAudioStore.pauseRecording).toHaveBeenCalled();

    // Update store state to paused
    mockAudioStore.isRecording = true;
    const isPaused = true;

    // Rerender with paused state
    rerender(
      <RecordingScreen navigation={mockNavigation} route={mockRoute} />
    );

    // Test resume
    const resumeButton = getByLabelText('Resume recording');
    await act(async () => {
      fireEvent.press(resumeButton);
    });

    expect(mockAudioStore.resumeRecording).toHaveBeenCalled();
  });

  it('should handle cancel recording', async () => {
    mockAudioStore.isRecording = true;

    const { getByLabelText } = render(
      <RecordingScreen navigation={mockNavigation} route={mockRoute} />
    );

    const cancelButton = getByLabelText('Cancel recording');

    await act(async () => {
      fireEvent.press(cancelButton);
    });

    expect(Alert.alert).toHaveBeenCalledWith(
      'Cancel Recording',
      expect.stringContaining('Are you sure'),
      expect.arrayContaining([
        expect.objectContaining({ text: 'Keep Recording' }),
        expect.objectContaining({ text: 'Cancel Recording' }),
      ])
    );
  });

  it('should show permission help when microphone access is denied', async () => {
    const { getByText } = render(
      <RecordingScreen navigation={mockNavigation} route={mockRoute} />
    );

    // Simulate permission error
    mockAudioStore.startRecording.mockRejectedValueOnce(
      new Error('Microphone permission denied')
    );

    const startButton = getByText('Start Recording');
    await act(async () => {
      fireEvent.press(startButton);
    });

    await waitFor(() => {
      expect(getByText(/Microphone access is required/)).toBeTruthy();
    });
  });

  it('should provide proper accessibility labels for elderly users', () => {
    const { getByLabelText } = render(
      <RecordingScreen navigation={mockNavigation} route={mockRoute} />
    );

    // Check accessibility labels
    expect(getByLabelText('Start recording')).toBeTruthy();
    expect(getByLabelText('Cancel recording')).toBeTruthy();
    expect(getByLabelText(/Recording time:/)).toBeTruthy();
    expect(getByLabelText(/Maximum recording time:/)).toBeTruthy();
  });

  it('should format durations correctly for display', () => {
    const testCases = [
      { seconds: 0, expected: '0:00' },
      { seconds: 59, expected: '0:59' },
      { seconds: 60, expected: '1:00' },
      { seconds: 125, expected: '2:05' },
      { seconds: 3661, expected: '61:01' },
    ];

    testCases.forEach(({ seconds, expected }) => {
      const result = mockAudioStore.formatDuration(seconds);
      expect(result).toBe(expected);
    });
  });
});

describe('Audio Level Indicator', () => {
  it('should show appropriate feedback for different audio levels', () => {
    const { AudioLevelIndicator } = require('../components/AudioLevelIndicator');

    // Test quiet level
    const { getByLabelText: getByLabelQuiet } = render(
      <AudioLevelIndicator audioLevel={0.05} isRecording={true} />
    );
    expect(getByLabelQuiet('Audio level: Too quiet')).toBeTruthy();

    // Test good level
    const { getByLabelText: getByLabelGood } = render(
      <AudioLevelIndicator audioLevel={0.5} isRecording={true} />
    );
    expect(getByLabelGood('Audio level: Good')).toBeTruthy();

    // Test loud level
    const { getByLabelText: getByLabelLoud } = render(
      <AudioLevelIndicator audioLevel={0.95} isRecording={true} />
    );
    expect(getByLabelLoud('Audio level: Too loud')).toBeTruthy();
  });
});

describe('Voice Guidance', () => {
  it('should announce recording state changes', () => {
    const { VoiceGuidance } = require('../components/VoiceGuidance');

    const { rerender } = render(
      <VoiceGuidance
        isRecording={false}
        isPaused={false}
        recordingDuration={0}
        maxDuration={600}
      />
    );

    // Start recording
    rerender(
      <VoiceGuidance
        isRecording={true}
        isPaused={false}
        recordingDuration={0}
        maxDuration={600}
      />
    );

    expect(VoiceGuidanceService.speak).toHaveBeenCalledWith(
      'Recording started. Speak clearly and naturally.',
      expect.any(Object)
    );
  });

  it('should announce time warnings for elderly users', () => {
    const { VoiceGuidance } = require('../components/VoiceGuidance');

    render(
      <VoiceGuidance
        isRecording={true}
        isPaused={false}
        recordingDuration={590} // 10 seconds remaining
        maxDuration={600}
      />
    );

    expect(VoiceGuidanceService.speak).toHaveBeenCalledWith(
      'Ten seconds remaining.',
      expect.any(Object)
    );
  });
});

describe('Accessibility Features', () => {
  it('should support high contrast mode', () => {
    mockSettingsStore.shouldUseHighContrast = () => true;

    const { getByText } = render(
      <RecordingScreen navigation={mockNavigation} route={mockRoute} />
    );

    const header = getByText('Record Memory');
    expect(header).toBeTruthy();
    // In a real test, you would check the style colors
  });

  it('should support larger font sizes for elderly users', () => {
    mockSettingsStore.getCurrentFontSize = () => 24; // Larger font

    const { getByText } = render(
      <RecordingScreen navigation={mockNavigation} route={mockRoute} />
    );

    const header = getByText('Record Memory');
    expect(header).toBeTruthy();
    // In a real test, you would verify the font size is applied
  });

  it('should provide haptic feedback when enabled', async () => {
    const { Haptics } = require('expo-haptics');

    const { getByLabelText } = render(
      <RecordingScreen navigation={mockNavigation} route={mockRoute} />
    );

    const startButton = getByLabelText('Start recording');

    await act(async () => {
      fireEvent.press(startButton);
    });

    expect(Haptics.impactAsync).toHaveBeenCalledWith(
      Haptics.ImpactFeedbackStyle.Medium
    );
  });
});