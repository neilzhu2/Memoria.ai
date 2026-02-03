# Memoria.ai Phase 2: Recording Flow Architecture

## Executive Summary

This document provides a comprehensive architecture design for implementing the Phase 2 recording flow in Memoria.ai, an elderly-friendly memory recording application. The architecture leverages existing foundations while introducing new state management patterns, component hierarchies, and user experience optimizations specifically designed for elderly users.

## Current State Analysis

### Existing Assets
- **Expo SDK 53** with TypeScript integration
- **Zustand** state management (currently basic with `useSettings`)
- **expo-av** for audio recording/playback
- **Existing Context**: `RecordingContext.tsx` with memory management
- **Audio Services**: Both basic and optimized audio service implementations
- **Modal Components**: Pre-built recording modals (preparation, active, completion)
- **Navigation**: Expo Router with asymmetric tab layout
- **Elderly Optimizations**: Voice guidance, haptic feedback, accessibility features

### Current Recording Flow (Phase 1)
1. User taps floating record button
2. Triggers `RecordingContext.triggerRecording()`
3. Basic recording state management
4. Modal-based UI with voice guidance

## Phase 2 Architecture Overview

### Design Principles
1. **Elderly-First Design**: Every component optimized for senior users
2. **State Resilience**: Robust state management that handles interruptions
3. **Progressive Disclosure**: Simplified interfaces with optional advanced features
4. **Performance Optimization**: Smooth experience on older devices
5. **Error Tolerance**: Graceful handling of common user mistakes

## 1. TypeScript Type System Architecture

### Core Recording Flow Types

```typescript
// Recording flow state management
export interface RecordingFlowState {
  currentPhase: RecordingPhase;
  sessionId: string;
  topic?: DailyTopic;
  startTime?: Date;
  duration: number;
  isPaused: boolean;
  quality: AudioQuality;

  // Elderly-specific settings
  elderlyMode: boolean;
  voiceGuidanceEnabled: boolean;
  hapticFeedbackEnabled: boolean;

  // Error and recovery
  lastError?: RecordingError;
  recoveryState?: RecordingRecoveryState;
}

export type RecordingPhase =
  | 'idle'
  | 'preparation'
  | 'permission-check'
  | 'ready'
  | 'recording'
  | 'paused'
  | 'stopped'
  | 'processing'
  | 'completed'
  | 'error';

export interface RecordingSession {
  id: string;
  topic?: DailyTopic;
  filePath?: string;
  duration: number;
  quality: AudioQuality;
  timestamp: Date;

  // Metadata for elderly users
  elderlyOptimized: boolean;
  voiceGuidanceUsed: boolean;
  pauseCount: number;

  // Processing state
  isProcessing: boolean;
  transcriptionStatus?: TranscriptionStatus;

  // Memory integration
  memoryId?: string;
  isShared: boolean;
  familyMembers: string[];
}

export interface RecordingError {
  code: RecordingErrorCode;
  message: string;
  elderlyFriendlyMessage: string;
  recoverable: boolean;
  retryAction?: () => Promise<void>;
  timestamp: Date;
}

export type RecordingErrorCode =
  | 'PERMISSION_DENIED'
  | 'MICROPHONE_UNAVAILABLE'
  | 'STORAGE_FULL'
  | 'DEVICE_TOO_OLD'
  | 'AUDIO_QUALITY_LOW'
  | 'BACKGROUND_INTERRUPTION'
  | 'NETWORK_ERROR'
  | 'TIMEOUT_ERROR';

export interface AudioQuality {
  sampleRate: number;
  bitRate: number;
  channels: number;
  format: 'aac' | 'mp3' | 'wav';
  elderlyOptimized: boolean;
}

export interface DailyTopic {
  id: number;
  title: string;
  description: string;
  category: TopicCategory;
  elderlyFriendly: boolean;
  suggestedDuration: number; // minutes
  voicePrompts: string[];
}
```

### Navigation and Screen Types

```typescript
export interface RecordingFlowNavigation {
  currentScreen: RecordingScreen;
  previousScreen?: RecordingScreen;
  navigationHistory: RecordingScreen[];
  canGoBack: boolean;
  canSkip: boolean;
}

export type RecordingScreen =
  | 'preparation'
  | 'permission-request'
  | 'topic-selection'
  | 'audio-test'
  | 'recording-active'
  | 'recording-paused'
  | 'playback-review'
  | 'title-edit'
  | 'completion'
  | 'success';

export interface RecordingScreenProps {
  navigation: RecordingFlowNavigation;
  session: RecordingSession;
  onNext: (screen: RecordingScreen) => void;
  onBack: () => void;
  onCancel: () => void;
  onError: (error: RecordingError) => void;
}
```

## 2. Zustand Store Architecture

### Core Recording Store

```typescript
interface RecordingFlowStore {
  // Core state
  flowState: RecordingFlowState;
  navigation: RecordingFlowNavigation;
  session: RecordingSession | null;

  // Audio management
  audioService: typeof optimizedAudioService;
  audioPermissions: AudioPermissions;

  // Elderly-specific features
  elderlySettings: ElderlyRecordingSettings;
  accessibility: AccessibilitySettings;

  // Actions - Flow Control
  startRecordingFlow: (topic?: DailyTopic) => Promise<void>;
  cancelRecordingFlow: () => Promise<void>;
  pauseRecording: () => Promise<void>;
  resumeRecording: () => Promise<void>;
  stopRecording: () => Promise<void>;

  // Actions - Navigation
  navigateToScreen: (screen: RecordingScreen) => void;
  goBack: () => void;
  skipScreen: () => void;

  // Actions - Session Management
  createSession: (topic?: DailyTopic) => string;
  saveSession: (memory: MemoryMetadata) => Promise<void>;
  discardSession: () => Promise<void>;

  // Actions - Error Handling
  handleError: (error: RecordingError) => void;
  retryLastAction: () => Promise<void>;
  clearError: () => void;

  // Actions - Elderly Features
  enableVoiceGuidance: (enabled: boolean) => void;
  adjustAudioQuality: (quality: AudioQuality) => void;
  enableElderlyMode: (enabled: boolean) => void;
}

interface ElderlyRecordingSettings {
  voiceGuidanceEnabled: boolean;
  voiceGuidanceRate: number; // 0.5 to 1.0
  hapticFeedbackLevel: 'none' | 'light' | 'medium' | 'strong';
  largerButtons: boolean;
  simplifiedInterface: boolean;
  extendedTimeouts: boolean;
  autoSaveEnabled: boolean;
  pauseReminderInterval: number; // seconds
}
```

### Store Implementation Pattern

```typescript
export const useRecordingFlow = create<RecordingFlowStore>()(
  persist(
    (set, get) => ({
      // Initial state
      flowState: {
        currentPhase: 'idle',
        sessionId: '',
        duration: 0,
        isPaused: false,
        quality: DEFAULT_ELDERLY_AUDIO_QUALITY,
        elderlyMode: true,
        voiceGuidanceEnabled: true,
        hapticFeedbackEnabled: true,
      },

      navigation: {
        currentScreen: 'preparation',
        navigationHistory: [],
        canGoBack: false,
        canSkip: false,
      },

      session: null,
      audioService: optimizedAudioService,

      // Implementation of actions...
      startRecordingFlow: async (topic) => {
        const sessionId = generateSessionId();
        const session = createRecordingSession(sessionId, topic);

        set(state => ({
          session,
          flowState: {
            ...state.flowState,
            currentPhase: 'preparation',
            sessionId,
            topic,
            startTime: new Date(),
          },
          navigation: {
            ...state.navigation,
            currentScreen: 'preparation',
            navigationHistory: ['preparation'],
          }
        }));

        // Initialize audio service for elderly users
        await get().audioService.optimizeForElderly();

        // Start voice guidance if enabled
        if (get().elderlySettings.voiceGuidanceEnabled) {
          await startVoiceGuidance('recording_flow_start');
        }
      },

      // ... other action implementations
    }),
    {
      name: 'memoria-recording-flow',
      partialize: (state) => ({
        elderlySettings: state.elderlySettings,
        accessibility: state.accessibility,
      }),
    }
  )
);
```

## 3. Component Architecture

### Screen Component Hierarchy

```
RecordingFlowContainer
├── RecordingPreparationScreen
│   ├── TopicDisplay
│   ├── RecordingInstructions
│   ├── AudioTestButton
│   └── StartRecordingButton
├── PermissionRequestScreen
│   ├── PermissionExplanation
│   ├── PermissionButtons
│   └── VoiceGuidanceToggle
├── ActiveRecordingScreen
│   ├── RecordingVisualizer
│   ├── DurationTimer
│   ├── PauseResumeButton
│   ├── StopButton
│   └── ElderlyControlsPanel
├── RecordingReviewScreen
│   ├── PlaybackControls
│   ├── TranscriptionPreview
│   ├── TitleEditor
│   └── SaveDiscardButtons
└── CompletionScreen
    ├── SuccessMessage
    ├── MemoryPreview
    ├── SharingOptions
    └── NextActionsPanel
```

### Reusable Component Library

```typescript
// Core recording UI components
export const RecordingButton: React.FC<RecordingButtonProps> = ({
  state,
  onPress,
  elderlyMode = true,
  size = 'large',
  hapticFeedback = true,
}) => {
  // Elderly-optimized recording button with voice feedback
};

export const AudioVisualizer: React.FC<AudioVisualizerProps> = ({
  audioLevels,
  isRecording,
  elderlyMode = true,
  showWaveform = true,
}) => {
  // Visual feedback optimized for elderly users
};

export const RecordingTimer: React.FC<RecordingTimerProps> = ({
  duration,
  isPaused,
  elderlyMode = true,
  showMilliseconds = false,
}) => {
  // Large, clear timer display
};

export const VoiceGuidancePanel: React.FC<VoiceGuidancePanelProps> = ({
  currentMessage,
  isPlaying,
  onToggle,
  rate = 0.8,
}) => {
  // Voice guidance controls for elderly users
};
```

## 4. Navigation Flow Architecture

### State-Driven Navigation

```typescript
export const useRecordingNavigation = () => {
  const { navigation, navigateToScreen, goBack } = useRecordingFlow();

  const getNextScreen = (currentScreen: RecordingScreen): RecordingScreen => {
    const flowMap: Record<RecordingScreen, RecordingScreen> = {
      'preparation': 'permission-request',
      'permission-request': 'audio-test',
      'audio-test': 'recording-active',
      'recording-active': 'playback-review',
      'recording-paused': 'recording-active',
      'playback-review': 'title-edit',
      'title-edit': 'completion',
      'completion': 'success',
      'success': 'preparation', // Reset for new recording
    };

    return flowMap[currentScreen];
  };

  const canNavigateBack = (currentScreen: RecordingScreen): boolean => {
    const noBackScreens: RecordingScreen[] = ['recording-active', 'processing'];
    return !noBackScreens.includes(currentScreen);
  };

  return {
    currentScreen: navigation.currentScreen,
    canGoBack: canNavigateBack(navigation.currentScreen),
    next: () => navigateToScreen(getNextScreen(navigation.currentScreen)),
    back: goBack,
  };
};
```

### Screen Transitions

```typescript
export const RecordingFlowNavigator: React.FC = () => {
  const { currentScreen, session } = useRecordingFlow();

  const renderScreen = () => {
    switch (currentScreen) {
      case 'preparation':
        return <RecordingPreparationScreen />;
      case 'permission-request':
        return <PermissionRequestScreen />;
      case 'audio-test':
        return <AudioTestScreen />;
      case 'recording-active':
        return <ActiveRecordingScreen />;
      case 'recording-paused':
        return <PausedRecordingScreen />;
      case 'playback-review':
        return <PlaybackReviewScreen />;
      case 'title-edit':
        return <TitleEditScreen />;
      case 'completion':
        return <CompletionScreen />;
      case 'success':
        return <SuccessScreen />;
      default:
        return <RecordingPreparationScreen />;
    }
  };

  return (
    <View style={styles.container}>
      <ElderlyNavigationHeader />
      {renderScreen()}
      <VoiceGuidanceOverlay />
      <ErrorBoundaryOverlay />
    </View>
  );
};
```

## 5. Audio Integration Architecture

### Optimized Audio Service Integration

```typescript
export const useOptimizedRecording = () => {
  const { session, audioService, elderlySettings } = useRecordingFlow();

  const startRecording = async (): Promise<void> => {
    try {
      // Configure for elderly users
      await audioService.optimizeForElderly();

      // Start recording with optimized settings
      const recording = await audioService.startRecording({
        quality: elderlySettings.preferredQuality,
        elderlyMode: true,
        maxDuration: elderlySettings.maxRecordingDuration,
      });

      // Update session state
      updateSession(recording);

    } catch (error) {
      handleRecordingError(error);
    }
  };

  const pauseRecording = async (): Promise<void> => {
    await audioService.pauseRecording();

    // Provide elderly-friendly feedback
    if (elderlySettings.voiceGuidanceEnabled) {
      await Speech.speak("Recording paused. Take your time.");
    }

    if (elderlySettings.hapticFeedbackLevel !== 'none') {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  return {
    startRecording,
    pauseRecording,
    stopRecording,
    getRecordingStatus: audioService.getRecordingStatus,
  };
};
```

### Audio Quality Management

```typescript
export const useElderlyAudioOptimization = () => {
  const adaptQualityForDevice = (baseQuality: AudioQuality): AudioQuality => {
    const deviceCapabilities = deviceCapabilityService.getCapabilities();

    // Optimize for elderly users on older devices
    if (deviceCapabilities?.isLowEndDevice) {
      return {
        sampleRate: 22050, // Good speech quality
        bitRate: 96000,    // Conservative for storage
        channels: 1,       // Mono sufficient for speech
        format: 'aac',     // Efficient compression
        elderlyOptimized: true,
      };
    }

    return {
      sampleRate: 44100, // High quality when possible
      bitRate: 128000,   // Clear audio for elderly users
      channels: 1,       // Consistent with elderly preferences
      format: 'aac',
      elderlyOptimized: true,
    };
  };

  return { adaptQualityForDevice };
};
```

## 6. Error Handling & Recovery

### Comprehensive Error Strategy

```typescript
export const useRecordingErrorHandling = () => {
  const { handleError, retryLastAction } = useRecordingFlow();

  const createElderlyFriendlyError = (
    code: RecordingErrorCode,
    technicalMessage: string
  ): RecordingError => {
    const elderlyMessages: Record<RecordingErrorCode, string> = {
      'PERMISSION_DENIED': 'We need permission to use your microphone to record your memories.',
      'MICROPHONE_UNAVAILABLE': 'Your microphone seems to be busy. Please close other apps and try again.',
      'STORAGE_FULL': 'Your device storage is full. Would you like help freeing up space?',
      'DEVICE_TOO_OLD': 'Your device may need an update for the best recording experience.',
      'AUDIO_QUALITY_LOW': 'Audio quality is low. Let\'s try moving to a quieter location.',
      'BACKGROUND_INTERRUPTION': 'A phone call or notification interrupted your recording.',
      'NETWORK_ERROR': 'Internet connection is needed for some features.',
      'TIMEOUT_ERROR': 'The recording took longer than expected. Let\'s try again.',
    };

    return {
      code,
      message: technicalMessage,
      elderlyFriendlyMessage: elderlyMessages[code],
      recoverable: ['MICROPHONE_UNAVAILABLE', 'AUDIO_QUALITY_LOW', 'NETWORK_ERROR'].includes(code),
      timestamp: new Date(),
    };
  };

  const handleRecordingError = async (error: Error): Promise<void> => {
    const recordingError = createElderlyFriendlyError(
      determineErrorCode(error),
      error.message
    );

    handleError(recordingError);

    // Provide voice guidance for error
    if (elderlySettings.voiceGuidanceEnabled) {
      await Speech.speak(recordingError.elderlyFriendlyMessage);
    }

    // Show recovery options
    if (recordingError.recoverable) {
      showRecoveryDialog(recordingError);
    }
  };

  return { handleRecordingError };
};
```

## 7. Performance Optimization

### Memory Management

```typescript
export const useRecordingPerformance = () => {
  const optimizeForElderlyDevice = async (): Promise<void> => {
    // Pre-allocate memory for smooth recording
    await memoryManager.allocateMemory(
      'recording_session',
      50 * 1024 * 1024, // 50MB for recording
      'audio',
      'high',
      true // elderly optimized
    );

    // Reduce background processing
    performanceMonitor.enterElderlyMode();

    // Clear unnecessary caches
    await memoryManager.clearNonEssentialCaches();
  };

  const monitorRecordingPerformance = (): void => {
    // Monitor for elderly user issues
    const checkInterval = setInterval(() => {
      const metrics = optimizedAudioService.getPerformanceMetrics();

      if (metrics.recordingLatency > 300) {
        // Latency too high for elderly users
        showPerformanceWarning('Recording may be delayed. Try restarting the app.');
      }

      if (metrics.memoryUsage > 100) {
        // Memory pressure affecting elderly experience
        optimizeMemoryUsage();
      }
    }, 5000);

    return () => clearInterval(checkInterval);
  };

  return {
    optimizeForElderlyDevice,
    monitorRecordingPerformance,
  };
};
```

## 8. Implementation Roadmap

### Phase 2.1: Core Recording Flow (Week 1-2)
- [ ] Implement new TypeScript types
- [ ] Create Zustand recording flow store
- [ ] Build basic screen components
- [ ] Integrate with existing audio service

### Phase 2.2: Elderly Optimizations (Week 3)
- [ ] Implement elderly-specific features
- [ ] Add voice guidance integration
- [ ] Optimize for older devices
- [ ] Enhanced error handling

### Phase 2.3: Navigation & Polish (Week 4)
- [ ] Complete navigation flow
- [ ] Add screen transitions
- [ ] Performance testing
- [ ] Accessibility validation

### Phase 2.4: Integration & Testing (Week 5)
- [ ] Integrate with existing memory system
- [ ] End-to-end testing
- [ ] Elderly user testing
- [ ] Bug fixes and polish

## 9. Testing Strategy

### Elderly User Testing Focus
1. **Usability Testing**: Test with actual elderly users
2. **Performance Testing**: Test on older devices (iPhone 8, Android 8+)
3. **Accessibility Testing**: Voice guidance, haptic feedback
4. **Error Scenario Testing**: Handle common mistakes gracefully
5. **Memory Testing**: Long recording sessions, interruptions

### Technical Testing
1. **Audio Quality Testing**: Various device conditions
2. **Storage Testing**: Limited device storage scenarios
3. **Permission Testing**: Different permission states
4. **Network Testing**: Offline/poor connectivity scenarios

## 10. Future Enhancements

### Phase 3 Considerations
- **AI Transcription**: Real-time transcription during recording
- **Memory Suggestions**: AI-powered topic suggestions
- **Family Integration**: Real-time sharing with family members
- **Voice Analysis**: Emotional context detection
- **Health Integration**: Memory as health indicator

This architecture provides a robust foundation for implementing an elderly-friendly recording flow that builds upon Memoria.ai's existing strengths while introducing new capabilities optimized for senior users.