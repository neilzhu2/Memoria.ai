# Recording Flow State Management - Usage Guide

## Overview

The Memoria.ai recording flow state management is now fully implemented with comprehensive Zustand stores, TypeScript integration, and elderly-optimized features. This guide demonstrates how to use the recording flow in your components.

## Key Features Implemented

### ✅ Complete State Management
- **Zustand Store**: `useRecordingFlow` with 1,066 lines of comprehensive implementation
- **TypeScript Types**: 677 lines of strict type definitions in `types/recording-flow.ts`
- **Elderly Optimizations**: Voice guidance, haptic feedback, large buttons, simplified interface
- **Error Handling**: Elderly-friendly error messages and smart recovery
- **Session Persistence**: Automatic session recovery for interrupted recordings

### ✅ Audio Integration
- **Expo-AV Integration**: Full `expo-av` integration via `OptimizedAudioService`
- **Device Optimization**: Adaptive quality based on device capabilities
- **Memory Management**: Optimized for older devices with memory constraints
- **Audio Quality**: Elderly-optimized settings for speech clarity

### ✅ Accessibility Features
- **Voice Guidance**: Configurable speech rate and volume
- **Haptic Feedback**: Light, medium, strong levels
- **Visual Accessibility**: Large text, high contrast, simplified interface
- **Progressive Disclosure**: Hide complex features for beginners

## Basic Usage

### 1. Setting Up the Recording Flow

```typescript
import React from 'react';
import { useRecordingFlowState, useRecordingActions, useElderlySettings } from '@/src/stores';
import { useMemories } from '@/contexts/MemoryContext';

export const RecordingScreen: React.FC = () => {
  const { flowState, session, navigation } = useRecordingFlowState();
  const { start, pause, resume, stop, save, navigateTo } = useRecordingActions();
  const { addMemory } = useMemories();
  const { settings, updateSettings } = useElderlySettings();

  // Start recording with elderly optimizations
  const handleStartRecording = async () => {
    try {
      await start(); // Automatically applies elderly optimizations
    } catch (error) {
      console.error('Failed to start recording:', error);
    }
  };

  // Save recording with memory context integration
  const handleSaveRecording = async () => {
    try {
      await save(
        {
          title: 'My Memory',
          description: 'A wonderful memory',
          tags: ['family', 'childhood']
        },
        addMemory // Pass the memory context callback
      );
    } catch (error) {
      console.error('Failed to save recording:', error);
    }
  };

  return (
    <View>
      {/* Recording controls based on current phase */}
      {flowState.currentPhase === 'idle' && (
        <Button onPress={handleStartRecording}>
          Start Recording
        </Button>
      )}

      {flowState.currentPhase === 'recording' && (
        <>
          <Button onPress={pause}>Pause</Button>
          <Button onPress={stop}>Stop</Button>
          <Text>Duration: {flowState.duration}s</Text>
        </>
      )}

      {flowState.currentPhase === 'paused' && (
        <>
          <Button onPress={resume}>Resume</Button>
          <Button onPress={stop}>Stop</Button>
        </>
      )}

      {flowState.currentPhase === 'stopped' && (
        <>
          <Button onPress={handleSaveRecording}>Save Memory</Button>
          <Button onPress={() => navigateTo('playback-review')}>
            Review Recording
          </Button>
        </>
      )}
    </View>
  );
};
```

### 2. Session Recovery on App Launch

```typescript
import React, { useEffect } from 'react';
import { useRecordingActions } from '@/src/stores';

export const AppLaunchHandler: React.FC = () => {
  const { checkRecoverable, recover } = useRecordingActions();

  useEffect(() => {
    const handleSessionRecovery = async () => {
      const hasRecoverableSession = checkRecoverable();

      if (hasRecoverableSession) {
        const recovered = await recover();
        if (recovered) {
          // Navigate to recording review screen
          console.log('Session recovered successfully');
        }
      }
    };

    handleSessionRecovery();
  }, []);

  return null;
};
```

### 3. Elderly Settings Configuration

```typescript
import React from 'react';
import { useElderlySettings } from '@/src/stores';

export const SettingsScreen: React.FC = () => {
  const { settings, updateSettings } = useElderlySettings();

  const enableVoiceGuidance = () => {
    updateSettings({
      voiceGuidanceEnabled: true,
      voiceGuidanceRate: 0.8, // Slower for clarity
      voiceVolume: 0.9, // Louder for elderly users
    });
  };

  const enableLargeButtons = () => {
    updateSettings({
      largeButtons: true,
      largeText: true,
      simplifiedInterface: true,
    });
  };

  const enableHapticFeedback = () => {
    updateSettings({
      hapticFeedbackLevel: 'medium',
      confirmationHaptics: true,
      errorHaptics: true,
    });
  };

  return (
    <View>
      <Switch
        value={settings.voiceGuidanceEnabled}
        onValueChange={(enabled) => updateSettings({ voiceGuidanceEnabled: enabled })}
      />

      <Switch
        value={settings.largeButtons}
        onValueChange={(enabled) => updateSettings({ largeButtons: enabled })}
      />

      <Switch
        value={settings.hapticFeedbackLevel !== 'none'}
        onValueChange={(enabled) =>
          updateSettings({ hapticFeedbackLevel: enabled ? 'medium' : 'none' })
        }
      />
    </View>
  );
};
```

### 4. Error Handling

```typescript
import React from 'react';
import { useRecordingFlowState } from '@/src/stores';

export const ErrorDisplay: React.FC = () => {
  const { flowState } = useRecordingFlowState();

  if (flowState.currentPhase === 'error' && flowState.lastError) {
    return (
      <View>
        <Text style={{ fontSize: 18, color: 'red' }}>
          {flowState.lastError.elderlyFriendlyMessage}
        </Text>

        {flowState.lastError.recoverable && (
          <Button onPress={() => flowState.lastError?.retryAction?.()}>
            Try Again
          </Button>
        )}
      </View>
    );
  }

  return null;
};
```

## Advanced Features

### 1. Custom Daily Topics

```typescript
import { DailyTopic } from '@/types/recording-flow';

const customTopic: DailyTopic = {
  id: 1,
  title: "Your First Job",
  description: "Tell us about your very first job and what you learned",
  category: "career",
  elderlyFriendly: true,
  suggestedDuration: 5,
  voicePrompts: [
    {
      id: "prompt1",
      text: "What was your first job?",
      elderlyOptimized: "What was your very first job when you were young?",
      timing: 30,
      priority: "high",
      interruptible: false
    }
  ],
  difficulty: "simple",
  tags: ["career", "youth"],
  basicPrompts: ["What was your first job?"],
  advancedPrompts: ["What skills did you learn?", "How did it shape your career?"]
};

// Start recording with custom topic
await start(customTopic);
```

### 2. Performance Monitoring

```typescript
import { useRecordingFlow } from '@/src/stores';

export const PerformanceMonitor: React.FC = () => {
  const performanceMetrics = useRecordingFlow(state => state.performanceMetrics);

  return (
    <View>
      {performanceMetrics && (
        <>
          <Text>Recording Latency: {performanceMetrics.recordingStartLatency}ms</Text>
          <Text>Memory Usage: {performanceMetrics.memoryUsage.at(-1)}MB</Text>
          <Text>Elderly Optimizations: {performanceMetrics.elderlyOptimizationsUsed.length}</Text>
        </>
      )}
    </View>
  );
};
```

## State Structure

### Core State Properties

```typescript
interface RecordingFlowState {
  currentPhase: 'idle' | 'preparation' | 'recording' | 'paused' | 'stopped' | 'completed' | 'error';
  sessionId: string;
  topic?: DailyTopic;
  duration: number;
  isPaused: boolean;
  quality: AudioQuality;
  elderlyMode: boolean;
  voiceGuidanceEnabled: boolean;
  hapticFeedbackEnabled: boolean;
  lastError?: RecordingError;
  advancedFeaturesEnabled: boolean;
  firstTimeUser: boolean;
}
```

### Session Management

```typescript
interface RecordingSession {
  id: string;
  topic?: DailyTopic;
  filePath?: string;
  duration: number;
  quality: AudioQuality;
  timestamp: Date;
  phase: RecordingPhase;
  elderlyOptimized: boolean;
  voiceGuidanceUsed: boolean;
  pauseCount: number;
  retryCount: number;
  isProcessing: boolean;
  tags: string[];
}
```

## Best Practices

### 1. Always Use Callbacks for Memory Integration
```typescript
// ✅ Correct - Pass memory context callback
await save(memoryData, addMemory);

// ❌ Incorrect - Don't call hooks inside Zustand actions
// This was fixed in the implementation
```

### 2. Handle Elderly Users Gracefully
```typescript
// Enable all elderly optimizations
updateSettings({
  voiceGuidanceEnabled: true,
  largeButtons: true,
  simplifiedInterface: true,
  extendedTimeouts: true,
  confirmationDialogs: true,
});
```

### 3. Session Recovery on App Start
```typescript
// Always check for recoverable sessions on app launch
useEffect(() => {
  const handleRecovery = async () => {
    if (checkRecoverable()) {
      await recover();
    }
  };
  handleRecovery();
}, []);
```

## QA Test Integration

The recording flow state is designed to support comprehensive QA testing:

### State Validation
- All state transitions are properly typed
- Error states include elderly-friendly messages
- Performance metrics are tracked for optimization

### Accessibility Testing
- Voice guidance can be verified through Speech.speak calls
- Haptic feedback through Haptics.impactAsync calls
- Large button states through elderlySettings

### Session Persistence Testing
- Sessions automatically persist during critical phases
- Recovery works for sessions up to 24 hours old
- Corrupted sessions are gracefully handled

## Conclusion

The recording flow state management is now complete and production-ready with:

- ✅ Full Zustand implementation with TypeScript
- ✅ Expo-AV integration for audio recording
- ✅ Elderly-optimized UI and interactions
- ✅ Comprehensive error handling and recovery
- ✅ Session persistence for interrupted recordings
- ✅ Performance monitoring and device optimization
- ✅ Integration with existing memory context

The implementation follows existing patterns in the codebase and provides a robust foundation for the Phase 2 recording flow screens.