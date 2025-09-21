/**
 * Voice Guidance Component for Memoria.ai
 * Provides audio announcements and guidance for elderly users
 */

import React, { useEffect, useRef } from 'react';
import { View, StyleSheet } from 'react-native';
import * as Speech from 'expo-speech';
import { useSettingsStore } from '../stores';

interface VoiceGuidanceProps {
  isRecording: boolean;
  isPaused: boolean;
  recordingDuration: number;
  maxDuration: number;
  announceOnChange?: boolean;
  announceTimeWarnings?: boolean;
}

const VoiceGuidance: React.FC<VoiceGuidanceProps> = ({
  isRecording,
  isPaused,
  recordingDuration,
  maxDuration,
  announceOnChange = true,
  announceTimeWarnings = true,
}) => {
  const { user } = useSettingsStore();
  const previousStateRef = useRef({ isRecording: false, isPaused: false });
  const lastAnnouncementRef = useRef(0);

  // Voice settings optimized for elderly users
  const speechOptions: Speech.SpeechOptions = {
    language: user?.preferredLanguage === 'zh' ? 'zh-CN' : 'en-US',
    pitch: 1.0, // Normal pitch
    rate: 0.8, // Slightly slower for elderly users
    volume: 0.9, // High volume
  };

  const speak = async (text: string, priority: 'low' | 'normal' | 'high' = 'normal') => {
    try {
      // Stop any current speech for high priority announcements
      if (priority === 'high') {
        await Speech.stop();
      }

      // Check if we should throttle announcements
      const now = Date.now();
      if (priority === 'low' && now - lastAnnouncementRef.current < 3000) {
        return; // Throttle low priority announcements
      }

      lastAnnouncementRef.current = now;
      await Speech.speak(text, speechOptions);
    } catch (error) {
      console.warn('Speech synthesis error:', error);
    }
  };

  // Announce state changes
  useEffect(() => {
    if (!announceOnChange) return;

    const prevState = previousStateRef.current;
    const currentState = { isRecording, isPaused };

    // Recording started
    if (!prevState.isRecording && isRecording && !isPaused) {
      speak('Recording started. Speak clearly and naturally.', 'high');
    }
    // Recording stopped
    else if (prevState.isRecording && !isRecording) {
      speak('Recording stopped. Your memory has been saved.', 'high');
    }
    // Recording paused
    else if (isRecording && !prevState.isPaused && isPaused) {
      speak('Recording paused.', 'normal');
    }
    // Recording resumed
    else if (isRecording && prevState.isPaused && !isPaused) {
      speak('Recording resumed.', 'normal');
    }

    previousStateRef.current = currentState;
  }, [isRecording, isPaused, announceOnChange]);

  // Time warnings for elderly users
  useEffect(() => {
    if (!announceTimeWarnings || !isRecording || isPaused) return;

    const timeRemaining = maxDuration - recordingDuration;

    // Warning announcements at specific intervals
    if (timeRemaining === 60) {
      speak('One minute remaining.', 'normal');
    } else if (timeRemaining === 30) {
      speak('Thirty seconds remaining.', 'normal');
    } else if (timeRemaining === 10) {
      speak('Ten seconds remaining.', 'high');
    } else if (timeRemaining === 5) {
      speak('Five seconds remaining.', 'high');
    }

    // Encouragement for longer recordings
    if (recordingDuration === 30) {
      speak('Keep going, you\'re doing great.', 'low');
    } else if (recordingDuration === 60) {
      speak('One minute recorded. Continue sharing your story.', 'low');
    } else if (recordingDuration === 120) {
      speak('Two minutes recorded. Your memory is being captured beautifully.', 'low');
    }
  }, [recordingDuration, maxDuration, isRecording, isPaused, announceTimeWarnings]);

  // Provide helpful prompts for elderly users
  const announceHelpfulPrompts = async (prompt: 'start' | 'continue' | 'finish') => {
    const prompts = {
      start: 'Take your time. Share whatever comes to mind. There\'s no rush.',
      continue: 'You\'re doing wonderfully. Keep sharing your thoughts.',
      finish: 'Thank you for sharing your memory. It has been saved safely.',
    };

    await speak(prompts[prompt], 'low');
  };

  // Cleanup speech when component unmounts
  useEffect(() => {
    return () => {
      Speech.stop();
    };
  }, []);

  // Methods exposed through imperative handle if needed
  const guidanceMethods = {
    announceWelcome: () => speak('Welcome to memory recording. Tap the blue button to start.', 'normal'),
    announceError: (error: string) => speak(`Error: ${error}. Please try again.`, 'high'),
    announceSuccess: () => speak('Recording saved successfully.', 'normal'),
    announcePermissionNeeded: () => speak('Microphone permission is needed to record your memories.', 'high'),
    stopSpeaking: () => Speech.stop(),
  };

  // This component doesn't render anything visible
  return <View style={styles.hidden} />;
};

const styles = StyleSheet.create({
  hidden: {
    display: 'none',
  },
});

export default VoiceGuidance;

// Export methods for use in other components
export const VoiceGuidanceService = {
  speak: async (text: string, options?: Partial<Speech.SpeechOptions>) => {
    try {
      const defaultOptions: Speech.SpeechOptions = {
        language: 'en-US',
        pitch: 1.0,
        rate: 0.8,
        volume: 0.9,
        ...options,
      };
      await Speech.speak(text, defaultOptions);
    } catch (error) {
      console.warn('Voice guidance error:', error);
    }
  },

  stop: () => Speech.stop(),

  announceError: (message: string) => {
    Speech.speak(`Error: ${message}. Please try again.`, {
      language: 'en-US',
      pitch: 1.0,
      rate: 0.8,
      volume: 0.9,
    });
  },

  announceSuccess: (message: string = 'Operation completed successfully.') => {
    Speech.speak(message, {
      language: 'en-US',
      pitch: 1.0,
      rate: 0.8,
      volume: 0.9,
    });
  },
};