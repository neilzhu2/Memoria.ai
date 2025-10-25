/**
 * Integration Tests for Complete Recording Flow
 * Tests Phase 2: Recording Flow Screens - End-to-End Flow
 *
 * Tests the complete recording journey:
 * 1. Recording preparation → Active recording → Recording completion
 * 2. State management integration with Zustand store
 * 3. Audio service integration
 * 4. Memory context integration
 * 5. Error handling across the entire flow
 * 6. Elderly-friendly flow continuity
 */

import React from 'react';
import { render, fireEvent, waitFor, screen } from '@testing-library/react-native';
import { Alert } from 'react-native';
import * as Haptics from 'expo-haptics';
import * as Speech from 'expo-speech';

import { RecordingPreparationModal } from '../../components/RecordingPreparationModal';
import { ActiveRecordingModal } from '../../components/ActiveRecordingModal';
import { RecordingCompletionModal } from '../../components/RecordingCompletionModal';
import { RecordingButton } from '../../components/RecordingButton';
import { FloatingRecordButton } from '../../components/FloatingRecordButton';

// Mock modules
jest.mock('expo-haptics');
jest.mock('expo-speech');

const mockHaptics = Haptics as jest.Mocked<typeof Haptics>;
const mockSpeech = Speech as jest.Mocked<typeof Speech>;

// Mock audio store for integration testing
  isRecording: false,
  currentRecording: null,
  recordingDuration: 0,
  permissions: { microphone: 'granted', mediaLibrary: 'granted' },
  startRecording: jest.fn(),
  stopRecording: jest.fn(),
  pauseRecording: jest.fn(),
  resumeRecording: jest.fn(),
  cancelRecording: jest.fn(),
  requestMicrophonePermission: jest.fn(),
  formatDuration: jest.fn((seconds) => `${Math.floor(seconds / 60)}:${(seconds % 60).toString().padStart(2, '0')}`),
  lastError: null,
  clearError: jest.fn(),
};

jest.mock('../../src/stores/audioStore', () => ({
}));

// Mock memory context for integration testing
const mockMemoryContext = {
  memories: [],
  addMemory: jest.fn(),
  updateMemory: jest.fn(),
  deleteMemory: jest.fn(),
  isLoading: false,
  error: null,
};

jest.mock('../../contexts/MemoryContext', () => ({
  useMemories: () => mockMemoryContext,
}));

// Complete Recording Flow Component for testing
const RecordingFlowTest: React.FC = () => {
  const [flowState, setFlowState] = React.useState<'idle' | 'preparation' | 'recording' | 'completion'>('idle');
  const [recordingDuration, setRecordingDuration] = React.useState(0);
  const [currentTopic, setCurrentTopic] = React.useState<string>('Test memory topic');
  const [isRecording, setIsRecording] = React.useState(false);

  const handleStartFlow = () => {
    setFlowState('preparation');
  };

  const handleStartRecording = async () => {
    try {
      setIsRecording(true);
      setFlowState('recording');

      // Simulate recording duration increment
      const interval = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);

      // Store interval for cleanup
      (global as any).recordingInterval = interval;
    } catch (error) {
      console.error('Failed to start recording:', error);
    }
  };

  const handleStopRecording = async () => {
    try {
      if ((global as any).recordingInterval) {
        clearInterval((global as any).recordingInterval);
      }

      setIsRecording(false);
      setFlowState('completion');
    } catch (error) {
      console.error('Failed to stop recording:', error);
    }
  };

  const handlePauseRecording = async () => {
    if (isRecording) {
    } else {
    }
  };

  const handleSaveMemory = async () => {
    try {
      await mockMemoryContext.addMemory({
        title: 'New Memory',
        description: 'Test memory description',
        topic: currentTopic,
        duration: recordingDuration,
        filePath: 'mock://recording.m4a',
        date: new Date(),
        tags: [],
      });
      setFlowState('idle');
      setRecordingDuration(0);
    } catch (error) {
      console.error('Failed to save memory:', error);
    }
  };

  const handleDiscardMemory = () => {
    setFlowState('idle');
    setRecordingDuration(0);
  };

  const handleCancelFlow = () => {
    setFlowState('idle');
    setRecordingDuration(0);
  };

  return (
    <>
      {flowState === 'idle' && (
        <RecordingButton
          isRecording={false}
          onPress={handleStartFlow}
        />
      )}

      <RecordingPreparationModal
        visible={flowState === 'preparation'}
        topic={currentTopic}
        onStartRecording={handleStartRecording}
        onCancel={handleCancelFlow}
      />

      <ActiveRecordingModal
        visible={flowState === 'recording'}
        duration={recordingDuration}
        topic={currentTopic}
        onStopRecording={handleStopRecording}
        onPauseRecording={handlePauseRecording}
        isPaused={false}
      />

      <RecordingCompletionModal
        visible={flowState === 'completion'}
        duration={recordingDuration}
        topic={currentTopic}
        onSaveMemory={handleSaveMemory}
        onDiscardMemory={handleDiscardMemory}
      />
    </>
  );
};

describe('Recording Flow Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();

    // Reset mock store state

    // Reset mock context
    mockMemoryContext.memories = [];
    mockMemoryContext.isLoading = false;
    mockMemoryContext.error = null;

    // Setup default mock implementations
      id: 'test-recording',
      filePath: 'mock://recording.m4a',
      duration: 0,
    });

      id: 'test-recording',
      filePath: 'mock://recording.m4a',
      duration: 30,
    });

    mockMemoryContext.addMemory.mockResolvedValue(undefined);
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();

    // Clean up any intervals
    if ((global as any).recordingInterval) {
      clearInterval((global as any).recordingInterval);
      (global as any).recordingInterval = null;
    }
  });

  describe('Complete Flow: Happy Path', () => {
    it('completes full recording flow from start to save', async () => {
      render(<RecordingFlowTest />);

      // Step 1: Start the flow
      const startButton = screen.getByLabelText('Start recording');
      fireEvent.press(startButton);

      // Should show preparation modal
      await waitFor(() => {
        expect(screen.getByText('Ready to Record?')).toBeTruthy();
      });

      // Step 2: Start recording
      const prepareStartButton = screen.getByLabelText('Start recording');
      fireEvent.press(prepareStartButton);

      // Should show active recording modal
      await waitFor(() => {
        expect(screen.getByText('Recording Active')).toBeTruthy();
      });

      // Step 3: Let recording run for a bit
      jest.advanceTimersByTime(5000);

      // Step 4: Stop recording
      const stopButton = screen.getByLabelText('Stop recording');
      fireEvent.press(stopButton);

      // Should show completion modal
      await waitFor(() => {
        expect(screen.getByText('Recording Complete!')).toBeTruthy();
      });

      // Step 5: Save memory
      const saveButton = screen.getByLabelText('Save memory');
      fireEvent.press(saveButton);

      // Should save and return to idle
      await waitFor(() => {
        expect(mockMemoryContext.addMemory).toHaveBeenCalled();
        expect(screen.getByLabelText('Start recording')).toBeTruthy();
      });
    });

    it('provides consistent voice guidance throughout flow', async () => {
      render(<RecordingFlowTest />);

      // Start the flow
      const startButton = screen.getByLabelText('Start recording');
      fireEvent.press(startButton);

      // Voice guidance in preparation
      jest.advanceTimersByTime(500);
      await waitFor(() => {
        expect(mockSpeech.speak).toHaveBeenCalledWith(
          'Ready to record? Follow the instructions on screen.',
          expect.any(Object)
        );
      });

      // Start recording
      const prepareStartButton = screen.getByLabelText('Start recording');
      fireEvent.press(prepareStartButton);

      await waitFor(() => {
        expect(mockSpeech.speak).toHaveBeenCalledWith(
          'Recording started. Please speak clearly.',
          expect.any(Object)
        );
      });

      // Stop recording
      const stopButton = screen.getByLabelText('Stop recording');
      fireEvent.press(stopButton);

      await waitFor(() => {
        expect(mockSpeech.speak).toHaveBeenCalledWith(
          'Recording stopped. Processing your memory.',
          expect.any(Object)
        );
      });

      // Voice guidance in completion
      jest.advanceTimersByTime(500);
      await waitFor(() => {
        expect(mockSpeech.speak).toHaveBeenCalledWith(
          'Recording complete. Choose to save or discard your memory.',
          expect.any(Object)
        );
      });
    });

    it('maintains haptic feedback consistency across flow', async () => {
      render(<RecordingFlowTest />);

      // Start flow
      const startButton = screen.getByLabelText('Start recording');
      fireEvent.press(startButton);

      // Haptic feedback in preparation
      const prepareStartButton = screen.getByLabelText('Start recording');
      fireEvent.press(prepareStartButton);

      await waitFor(() => {
        expect(mockHaptics.impactAsync).toHaveBeenCalledWith(
          Haptics.ImpactFeedbackStyle.Medium
        );
      });

      // Stop recording with haptic feedback
      const stopButton = screen.getByLabelText('Stop recording');
      fireEvent.press(stopButton);

      await waitFor(() => {
        expect(mockHaptics.impactAsync).toHaveBeenCalledWith(
          Haptics.ImpactFeedbackStyle.Medium
        );
      });
    });
  });

  describe('Flow with Pause/Resume', () => {
    it('handles pause and resume during recording', async () => {
      render(<RecordingFlowTest />);

      // Get to recording state
      const startButton = screen.getByLabelText('Start recording');
      fireEvent.press(startButton);

      const prepareStartButton = screen.getByLabelText('Start recording');
      fireEvent.press(prepareStartButton);

      await waitFor(() => {
        expect(screen.getByText('Recording Active')).toBeTruthy();
      });

      // Pause recording
      const pauseButton = screen.getByLabelText('Pause recording');
      fireEvent.press(pauseButton);

      await waitFor(() => {
      });

      // Resume recording
      const resumeButton = screen.getByLabelText('Resume recording');
      fireEvent.press(resumeButton);

      await waitFor(() => {
      });
    });
  });

  describe('Flow Cancellation Scenarios', () => {
    it('handles cancellation during preparation', async () => {
      render(<RecordingFlowTest />);

      // Start flow
      const startButton = screen.getByLabelText('Start recording');
      fireEvent.press(startButton);

      await waitFor(() => {
        expect(screen.getByText('Ready to Record?')).toBeTruthy();
      });

      // Cancel preparation
      const cancelButton = screen.getByLabelText('Cancel recording');
      fireEvent.press(cancelButton);

      // Should return to idle
      await waitFor(() => {
        expect(screen.getByLabelText('Start recording')).toBeTruthy();
        expect(screen.queryByText('Ready to Record?')).toBeNull();
      });
    });

    it('handles discard during completion', async () => {
      render(<RecordingFlowTest />);

      // Get to completion state
      const startButton = screen.getByLabelText('Start recording');
      fireEvent.press(startButton);

      const prepareStartButton = screen.getByLabelText('Start recording');
      fireEvent.press(prepareStartButton);

      await waitFor(() => {
        expect(screen.getByText('Recording Active')).toBeTruthy();
      });

      const stopButton = screen.getByLabelText('Stop recording');
      fireEvent.press(stopButton);

      await waitFor(() => {
        expect(screen.getByText('Recording Complete!')).toBeTruthy();
      });

      // Mock Alert.alert to simulate user confirming discard
      const mockAlert = Alert.alert as jest.MockedFunction<typeof Alert.alert>;
      mockAlert.mockImplementation((title, message, buttons) => {
        const discardButton = buttons?.find(btn => btn.text === 'Discard');
        if (discardButton?.onPress) {
          discardButton.onPress();
        }
      });

      // Discard recording
      const discardButton = screen.getByLabelText('Discard recording');
      fireEvent.press(discardButton);

      // Should return to idle
      await waitFor(() => {
        expect(screen.getByLabelText('Start recording')).toBeTruthy();
        expect(screen.queryByText('Recording Complete!')).toBeNull();
      });
    });
  });

  describe('Error Handling Integration', () => {
    it('handles recording start failure gracefully', async () => {

      render(<RecordingFlowTest />);

      // Start flow
      const startButton = screen.getByLabelText('Start recording');
      fireEvent.press(startButton);

      const prepareStartButton = screen.getByLabelText('Start recording');
      fireEvent.press(prepareStartButton);

      // Should handle error and stay in preparation or return to idle
      await waitFor(() => {
        // Component should handle the error gracefully
      });
    });

    it('handles recording stop failure gracefully', async () => {

      render(<RecordingFlowTest />);

      // Get to recording state
      const startButton = screen.getByLabelText('Start recording');
      fireEvent.press(startButton);

      const prepareStartButton = screen.getByLabelText('Start recording');
      fireEvent.press(prepareStartButton);

      await waitFor(() => {
        expect(screen.getByText('Recording Active')).toBeTruthy();
      });

      // Try to stop recording
      const stopButton = screen.getByLabelText('Stop recording');
      fireEvent.press(stopButton);

      await waitFor(() => {
        // Should handle error gracefully
      });
    });

    it('handles memory save failure gracefully', async () => {
      mockMemoryContext.addMemory.mockRejectedValueOnce(new Error('Save failed'));

      render(<RecordingFlowTest />);

      // Get to completion state
      const startButton = screen.getByLabelText('Start recording');
      fireEvent.press(startButton);

      const prepareStartButton = screen.getByLabelText('Start recording');
      fireEvent.press(prepareStartButton);

      await waitFor(() => {
        expect(screen.getByText('Recording Active')).toBeTruthy();
      });

      const stopButton = screen.getByLabelText('Stop recording');
      fireEvent.press(stopButton);

      await waitFor(() => {
        expect(screen.getByText('Recording Complete!')).toBeTruthy();
      });

      // Try to save memory
      const saveButton = screen.getByLabelText('Save memory');
      fireEvent.press(saveButton);

      await waitFor(() => {
        expect(mockMemoryContext.addMemory).toHaveBeenCalled();
        // Should handle save error gracefully
      });
    });
  });

  describe('State Management Integration', () => {
    it('maintains consistent state across flow transitions', async () => {
      render(<RecordingFlowTest />);

      // Track state consistency
      const startButton = screen.getByLabelText('Start recording');
      fireEvent.press(startButton);

      // Preparation state
      await waitFor(() => {
        expect(screen.getByText('Test memory topic')).toBeTruthy();
      });

      const prepareStartButton = screen.getByLabelText('Start recording');
      fireEvent.press(prepareStartButton);

      // Recording state maintains topic
      await waitFor(() => {
        expect(screen.getByText('"Test memory topic"')).toBeTruthy();
      });

      const stopButton = screen.getByLabelText('Stop recording');
      fireEvent.press(stopButton);

      // Completion state maintains topic and duration
      await waitFor(() => {
        expect(screen.getByText('"Test memory topic"')).toBeTruthy();
        expect(screen.getByText('Topic:')).toBeTruthy();
      });
    });

    it('properly cleans up state when flow is cancelled', async () => {
      render(<RecordingFlowTest />);

      // Start and cancel flow
      const startButton = screen.getByLabelText('Start recording');
      fireEvent.press(startButton);

      const cancelButton = screen.getByLabelText('Cancel recording');
      fireEvent.press(cancelButton);

      // Should return to clean idle state
      await waitFor(() => {
        expect(screen.getByLabelText('Start recording')).toBeTruthy();
        expect(screen.queryByText('Test memory topic')).toBeNull();
      });
    });

    it('integrates properly with audio store permissions', async () => {
      // Test with denied permissions

      render(<RecordingFlowTest />);

      const startButton = screen.getByLabelText('Start recording');
      fireEvent.press(startButton);

      const prepareStartButton = screen.getByLabelText('Start recording');
      fireEvent.press(prepareStartButton);

      // Should handle permission denial appropriately
      await waitFor(() => {
      });
    });
  });

  describe('Accessibility Throughout Flow', () => {
    it('maintains accessibility labels across all flow states', async () => {
      render(<RecordingFlowTest />);

      // Idle state
      expect(screen.getByLabelText('Start recording')).toBeTruthy();

      // Preparation state
      const startButton = screen.getByLabelText('Start recording');
      fireEvent.press(startButton);

      await waitFor(() => {
        expect(screen.getByLabelText('Start recording')).toBeTruthy();
        expect(screen.getByLabelText('Cancel recording')).toBeTruthy();
      });

      // Recording state
      const prepareStartButton = screen.getByLabelText('Start recording');
      fireEvent.press(prepareStartButton);

      await waitFor(() => {
        expect(screen.getByLabelText('Stop recording')).toBeTruthy();
        expect(screen.getByLabelText('Pause recording')).toBeTruthy();
      });

      // Completion state
      const stopButton = screen.getByLabelText('Stop recording');
      fireEvent.press(stopButton);

      await waitFor(() => {
        expect(screen.getByLabelText('Save memory')).toBeTruthy();
        expect(screen.getByLabelText('Discard recording')).toBeTruthy();
      });
    });

    it('provides consistent accessibility hints throughout flow', async () => {
      render(<RecordingFlowTest />);

      // Check accessibility hints are present at each stage
      const startButton = screen.getByLabelText('Start recording');
      expect(startButton.props.accessibilityHint).toBeTruthy();

      fireEvent.press(startButton);

      await waitFor(() => {
        const prepareStartButton = screen.getByLabelText('Start recording');
        expect(prepareStartButton.props.accessibilityHint).toBeTruthy();
      });
    });
  });

  describe('Performance Integration', () => {
    it('maintains good performance throughout entire flow', async () => {
      const startTime = performance.now();

      render(<RecordingFlowTest />);

      // Complete full flow rapidly
      const startButton = screen.getByLabelText('Start recording');
      fireEvent.press(startButton);

      const prepareStartButton = screen.getByLabelText('Start recording');
      fireEvent.press(prepareStartButton);

      await waitFor(() => {
        expect(screen.getByText('Recording Active')).toBeTruthy();
      });

      const stopButton = screen.getByLabelText('Stop recording');
      fireEvent.press(stopButton);

      await waitFor(() => {
        expect(screen.getByText('Recording Complete!')).toBeTruthy();
      });

      const saveButton = screen.getByLabelText('Save memory');
      fireEvent.press(saveButton);

      await waitFor(() => {
        expect(screen.getByLabelText('Start recording')).toBeTruthy();
      });

      const endTime = performance.now();
      const totalTime = endTime - startTime;

      // Entire flow should complete quickly
      expect(totalTime).toBeLessThan(1000);
    });

    it('handles rapid state changes without memory leaks', async () => {
      render(<RecordingFlowTest />);

      // Rapidly cycle through flow multiple times
      for (let i = 0; i < 5; i++) {
        const startButton = screen.getByLabelText('Start recording');
        fireEvent.press(startButton);

        const cancelButton = screen.getByLabelText('Cancel recording');
        fireEvent.press(cancelButton);

        await waitFor(() => {
          expect(screen.getByLabelText('Start recording')).toBeTruthy();
        });
      }

      // Should not cause performance issues
      expect(screen.getByLabelText('Start recording')).toBeTruthy();
    });
  });
});
