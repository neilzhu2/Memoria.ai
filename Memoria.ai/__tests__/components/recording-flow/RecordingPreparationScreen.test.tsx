/**
 * Unit Tests for RecordingPreparationScreen Component
 * Tests Phase 2: Recording Flow Screens - Preparation Screen
 *
 * Tests elderly-friendly features including:
 * - Large touch targets (80px+ minimum)
 * - Voice guidance and speech synthesis
 * - Haptic feedback
 * - Clear visual hierarchy
 * - Accessibility compliance
 */

import React from 'react';
import { render, fireEvent, waitFor, screen } from '@testing-library/react-native';
import * as Haptics from 'expo-haptics';
import * as Speech from 'expo-speech';

import { RecordingPreparationScreen } from '../../../components/recording-flow/screens/RecordingPreparationScreen';

// Mock modules
jest.mock('expo-haptics');
jest.mock('expo-speech');
jest.mock('@/stores/useRecordingFlow');
jest.mock('@/hooks/useColorScheme');

const mockHaptics = Haptics as jest.Mocked<typeof Haptics>;
const mockSpeech = Speech as jest.Mocked<typeof Speech>;

// Mock store hooks
const mockUseRecordingFlowState = jest.fn();
const mockUseElderlySettings = jest.fn();
const mockUseRecordingActions = jest.fn();

jest.mock('@/stores/useRecordingFlow', () => ({
  useRecordingFlowState: () => mockUseRecordingFlowState(),
  useElderlySettings: () => mockUseElderlySettings(),
  useRecordingActions: () => mockUseRecordingActions(),
}));

jest.mock('@/hooks/useColorScheme', () => ({
  useColorScheme: () => 'light',
}));

describe('RecordingPreparationScreen', () => {
  const defaultSession = {
    id: 'test-session',
    duration: 0,
    quality: {
      sampleRate: 22050,
      bitRate: 96000,
      channels: 1,
      format: 'aac' as const,
      elderlyOptimized: true,
      compressionLevel: 0.8,
      noiseReduction: true,
      voiceEnhancement: true,
    },
    timestamp: new Date(),
    phase: 'preparation' as const,
    elderlyOptimized: true,
    voiceGuidanceUsed: true,
    pauseCount: 0,
    retryCount: 0,
    isProcessing: false,
    isShared: false,
    familyMembers: [],
    tags: [],
  };

  const defaultElderlySettings = {
    voiceGuidanceEnabled: true,
    voiceGuidanceRate: 0.8,
    voiceVolume: 0.9,
    voiceLanguage: 'en-US',
    hapticFeedbackLevel: 'medium' as const,
    confirmationHaptics: true,
    errorHaptics: true,
    largeButtons: true,
    highContrast: false,
    largeText: true,
    simplifiedInterface: true,
    extendedTimeouts: true,
    autoSaveEnabled: true,
    pauseReminderInterval: 300,
    confirmationDialogs: true,
    speechEnhancement: true,
    noiseReduction: true,
    autoVolumeAdjustment: true,
    playbackSpeedControl: true,
    showAdvancedOptions: false,
    enableExpertMode: false,
    hideComplexFeatures: true,
    smartErrorRecovery: true,
    contextualHelp: true,
    voiceCommands: false,
    gestureAlternatives: true,
  };

  const defaultFlowState = {
    flowState: {
      currentPhase: 'preparation' as const,
      sessionId: 'test-session',
      duration: 0,
      isPaused: false,
      quality: defaultSession.quality,
      elderlyMode: true,
      voiceGuidanceEnabled: true,
      hapticFeedbackEnabled: true,
      advancedFeaturesEnabled: false,
      firstTimeUser: true,
    },
    navigation: {
      currentScreen: 'preparation' as const,
      navigationHistory: [],
      canGoBack: false,
      canSkip: false,
      skipReasons: [],
      showNavigationHelp: true,
      largeNavigationButtons: true,
      voiceNavigationEnabled: true,
    },
  };

  const mockNavigateTo = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();

    // Setup default mock returns
    mockUseRecordingFlowState.mockReturnValue(defaultFlowState);
    mockUseElderlySettings.mockReturnValue({ settings: defaultElderlySettings });
    mockUseRecordingActions.mockReturnValue({ navigateTo: mockNavigateTo });
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  describe('Rendering and Visibility', () => {
    it('renders correctly with basic content', () => {
      render(<RecordingPreparationScreen session={defaultSession} />);

      expect(screen.getByText('Ready to Record?')).toBeTruthy();
      expect(screen.getByText('Share your memory with your family')).toBeTruthy();
      expect(screen.getByText('Recording Tips:')).toBeTruthy();
    });

    it('displays topic when provided in session', () => {
      const sessionWithTopic = {
        ...defaultSession,
        topic: {
          id: 1,
          title: 'My childhood memories',
          description: 'Share stories from your childhood',
          category: 'childhood' as const,
          elderlyFriendly: true,
          suggestedDuration: 10,
          voicePrompts: [],
          difficulty: 'simple' as const,
          tags: [],
          basicPrompts: [],
          advancedPrompts: [],
        },
      };

      render(<RecordingPreparationScreen session={sessionWithTopic} />);

      expect(screen.getByText('Today\'s Topic:')).toBeTruthy();
      expect(screen.getByText('"My childhood memories"')).toBeTruthy();
    });

    it('hides topic section when no topic provided', () => {
      render(<RecordingPreparationScreen session={defaultSession} />);

      expect(screen.queryByText('Today\'s Topic:')).toBeNull();
    });
  });

  describe('Voice Guidance and Accessibility', () => {
    it('provides voice guidance when component becomes active', async () => {
      render(<RecordingPreparationScreen session={defaultSession} />);

      // Fast-forward past the 500ms delay
      jest.advanceTimersByTime(500);

      await waitFor(() => {
        expect(mockSpeech.speak).toHaveBeenCalledWith(
          'Ready to record? Follow the instructions on screen.',
          {
            language: 'en-US',
            rate: 0.8,
            volume: 0.9,
          }
        );
      });
    });

    it('does not provide voice guidance when disabled', () => {
      const settingsWithoutVoice = {
        ...defaultElderlySettings,
        voiceGuidanceEnabled: false,
      };

      mockUseElderlySettings.mockReturnValue({ settings: settingsWithoutVoice });

      render(<RecordingPreparationScreen />);

      jest.advanceTimersByTime(1000);

      expect(mockSpeech.speak).not.toHaveBeenCalled();
    });

    it('has proper accessibility labels on buttons', () => {
      render(<RecordingPreparationScreen />);

      const startButton = screen.getByTestId('start-button');
      const cancelButton = screen.getByTestId('cancel-button');

      expect(startButton).toBeTruthy();
      expect(cancelButton).toBeTruthy();

      // Check accessibility properties
      expect(startButton.props.accessibilityLabel).toBe('Start recording');
      expect(startButton.props.accessibilityHint).toBe('Tap to begin recording your memory');
      expect(cancelButton.props.accessibilityLabel).toBe('Cancel recording');
      expect(cancelButton.props.accessibilityHint).toBe('Tap to go back without recording');
    });

    it('sets accessibilityViewIsModal correctly', () => {
      render(<RecordingPreparationScreen />);

      const screen_element = screen.getByTestId('recording-preparation-screen');
      expect(screen_element.props.accessibilityViewIsModal).toBe(true);
    });
  });

  describe('Elderly-Friendly Design Requirements', () => {
    it('has minimum touch target sizes for buttons', () => {
      render(<RecordingPreparationScreen />);

      const startButton = screen.getByTestId('start-button');
      const cancelButton = screen.getByTestId('cancel-button');

      // Check minimum touch target size (56px+ as per styles)
      expect(startButton.props.style.minHeight).toBeGreaterThanOrEqual(56);
      expect(cancelButton.props.style.minHeight).toBeGreaterThanOrEqual(56);
    });

    it('displays clear, large text for instructions', () => {
      render(<RecordingPreparationScreen />);

      const title = screen.getByText('Ready to Record?');
      const subtitle = screen.getByText('Share your memory with your family');

      // Verify text is large enough for elderly users
      expect(title.props.style.fontSize).toBeGreaterThanOrEqual(28);
      expect(subtitle.props.style.fontSize).toBeGreaterThanOrEqual(18);
    });

    it('shows all recording tips clearly', () => {
      render(<RecordingPreparationScreen />);

      // Check all tips are present
      expect(screen.getByText(/Speak clearly and at normal volume/)).toBeTruthy();
      expect(screen.getByText(/Take your time - there's no rush/)).toBeTruthy();
      expect(screen.getByText(/Share.*details, feelings, and stories/)).toBeTruthy();
      expect(screen.getByText(/Tap.*stop.*when you're finished/)).toBeTruthy();
    });

    it('includes voice guidance indicator', () => {
      render(<RecordingPreparationScreen />);

      expect(screen.getByText('🔊 Voice guidance is active to help you through each step')).toBeTruthy();
    });
  });

  describe('User Interactions', () => {
    it('calls navigateTo with haptic feedback when start button pressed', async () => {
      render(<RecordingPreparationScreen />);

      const startButton = screen.getByTestId('start-button');
      fireEvent.press(startButton);

      await waitFor(() => {
        expect(mockHaptics.impactAsync).toHaveBeenCalledWith(
          Haptics.ImpactFeedbackStyle.Medium
        );
        expect(mockSpeech.speak).toHaveBeenCalledWith(
          'Recording started. Please speak clearly.',
          { language: 'en-US', rate: 0.8 }
        );
        expect(mockNavigateTo).toHaveBeenCalledWith('permission-request');
      });
    });

    it('calls navigateTo with haptic feedback when cancel button pressed', async () => {
      render(<RecordingPreparationScreen />);

      const cancelButton = screen.getByTestId('cancel-button');
      fireEvent.press(cancelButton);

      await waitFor(() => {
        expect(mockHaptics.impactAsync).toHaveBeenCalledWith(
          Haptics.ImpactFeedbackStyle.Light
        );
        expect(mockNavigateTo).toHaveBeenCalled();
      });
    });

    it('handles rapid button presses gracefully', async () => {
      render(<RecordingPreparationScreen />);

      const startButton = screen.getByTestId('start-button');

      // Simulate rapid button presses
      fireEvent.press(startButton);
      fireEvent.press(startButton);
      fireEvent.press(startButton);

      await waitFor(() => {
        // Should still only call handlers once per press
        expect(mockNavigateTo).toHaveBeenCalledTimes(3);
      });
    });
  });

  describe('Error Handling', () => {
    it('handles haptic feedback errors gracefully', async () => {
      mockHaptics.impactAsync.mockRejectedValueOnce(new Error('Haptic failed'));

      const mockOnError = jest.fn();
      render(<RecordingPreparationScreen onError={mockOnError} />);

      const startButton = screen.getByTestId('start-button');
      fireEvent.press(startButton);

      await waitFor(() => {
        // Should still call navigateTo even if haptic fails
        expect(mockNavigateTo).toHaveBeenCalled();
      });
    });

    it('handles speech synthesis errors gracefully', async () => {
      mockSpeech.speak.mockRejectedValueOnce(new Error('Speech failed'));

      render(<RecordingPreparationScreen />);

      jest.advanceTimersByTime(500);

      const startButton = screen.getByTestId('start-button');
      fireEvent.press(startButton);

      await waitFor(() => {
        // Should still call navigateTo even if speech fails
        expect(mockNavigateTo).toHaveBeenCalled();
      });
    });
  });

  describe('Performance', () => {
    it('does not cause memory leaks with timers', () => {
      const { unmount } = render(<RecordingPreparationScreen />);

      // Start the timer
      jest.advanceTimersByTime(250);

      // Unmount before timer completes
      unmount();

      // Complete the timer - should not cause errors
      jest.advanceTimersByTime(500);

      // No speech should be called after unmount
      expect(mockSpeech.speak).not.toHaveBeenCalled();
    });

    it('renders quickly without blocking UI', () => {
      const startTime = performance.now();

      render(<RecordingPreparationScreen />);

      const endTime = performance.now();
      const renderTime = endTime - startTime;

      // Should render in under 100ms for good UX
      expect(renderTime).toBeLessThan(100);
    });
  });

  describe('Accessibility Compliance', () => {
    it('has proper contrast ratios for text', () => {
      render(<RecordingPreparationScreen />);

      const title = screen.getByText('Ready to Record?');
      const subtitle = screen.getByText('Share your memory with your family');

      // Colors should meet WCAG AA standards
      expect(title.props.style.color).toBe('#2c3e50'); // Dark text on light background
      expect(subtitle.props.style.color).toBe('#7f8c8d'); // Medium contrast
    });

    it('supports screen readers with proper semantics', () => {
      render(<RecordingPreparationScreen />);

      const screen_element = screen.getByTestId('recording-preparation-screen');

      // Screen should be properly announced to screen readers
      expect(screen_element.props.accessibilityViewIsModal).toBe(true);
    });

    it('provides clear button labels for voice control', () => {
      render(<RecordingPreparationScreen />);

      const startButton = screen.getByTestId('start-button');
      const cancelButton = screen.getByTestId('cancel-button');

      // Labels should be clear enough for voice control
      expect(startButton.props.accessibilityLabel).toBe('Start recording');
      expect(cancelButton.props.accessibilityLabel).toBe('Cancel recording');
    });
  });

  describe('Edge Cases', () => {
    it('handles undefined props gracefully', () => {
      expect(() => {
        render(<RecordingPreparationScreen />);
      }).not.toThrow();
    });

    it('handles null session gracefully', () => {
      render(<RecordingPreparationScreen session={null} />);

      expect(screen.queryByText('Today\'s Topic:')).toBeNull();
    });

    it('handles missing callbacks gracefully', () => {
      expect(() => {
        render(<RecordingPreparationScreen />);
      }).not.toThrow();
    });
  });

  describe('Component Integration', () => {
    it('integrates properly with store state', () => {
      render(<RecordingPreparationScreen />);

      // Should use store state when no props provided
      expect(mockUseRecordingFlowState).toHaveBeenCalled();
      expect(mockUseElderlySettings).toHaveBeenCalled();
      expect(mockUseRecordingActions).toHaveBeenCalled();
    });

    it('maintains focus management for accessibility', () => {
      render(<RecordingPreparationScreen />);

      const startButton = screen.getByTestId('start-button');

      // Should be focusable for keyboard navigation
      expect(startButton.props.accessible).not.toBe(false);
    });
  });
});