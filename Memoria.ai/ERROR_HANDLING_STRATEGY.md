# Error Handling & Permission Management Strategy

## Overview

This document outlines a comprehensive error handling and permission management strategy for Memoria.ai Phase 2 recording flow, specifically designed for elderly users who need clear, supportive guidance when things go wrong.

## Core Principles for Elderly Users

### 1. Never Blame the User
- **No Technical Jargon**: Explain errors in plain language
- **Assume Good Intent**: Users are trying to do the right thing
- **Provide Hope**: Always offer a path forward
- **Be Patient**: Allow multiple attempts without frustration

### 2. Clear Communication
- **Simple Language**: Use everyday words, not technical terms
- **Visual Cues**: Icons and colors to support text
- **Voice Guidance**: Spoken explanations for complex issues
- **Multiple Channels**: Text, voice, and visual feedback

### 3. Gentle Recovery
- **Auto-Fix When Possible**: Resolve issues automatically
- **Guided Recovery**: Step-by-step help to fix problems
- **Multiple Paths**: Different ways to achieve the same goal
- **Safe Fallbacks**: Always have a working alternative

## Error Classification System

### 1. Critical Errors (Cannot Continue)

```typescript
const CRITICAL_ERRORS = {
  'DEVICE_INCOMPATIBLE': {
    elderlyMessage: "Your device is not compatible with recording. You may need to use a different device or update your software.",
    technicalMessage: "Device does not meet minimum requirements for audio recording",
    recovery: null, // No recovery possible
    helpArticle: "device-compatibility",
    voiceGuidance: "I'm sorry, but your device cannot record audio. You may need help updating your device or using a different one.",
    severity: 'critical' as const,
    canRetry: false,
    showSupport: true,
  },
  'PERMISSION_PERMANENTLY_DENIED': {
    elderlyMessage: "We need permission to use your microphone, but it's been turned off. Let me help you turn it back on in your device settings.",
    technicalMessage: "Microphone permission permanently denied",
    recovery: 'GUIDE_TO_SETTINGS',
    helpArticle: "enable-microphone-permissions",
    voiceGuidance: "To record your memories, we need to access your microphone. I'll help you enable this in your settings.",
    severity: 'critical' as const,
    canRetry: true,
    showSupport: true,
  },
  'STORAGE_CRITICALLY_LOW': {
    elderlyMessage: "Your device is almost out of storage space. We need to free up some space before you can record.",
    technicalMessage: "Insufficient storage space for recording",
    recovery: 'STORAGE_MANAGEMENT',
    helpArticle: "free-up-storage",
    voiceGuidance: "Your device is running out of space. Let me help you free up some room for your recordings.",
    severity: 'critical' as const,
    canRetry: true,
    showSupport: true,
  },
} as const;
```

### 2. Major Errors (Significantly Impact Experience)

```typescript
const MAJOR_ERRORS = {
  'MICROPHONE_HARDWARE_ISSUE': {
    elderlyMessage: "There seems to be a problem with your microphone. Try restarting your device, or check if another app is using it.",
    technicalMessage: "Microphone hardware unavailable or in use",
    recovery: 'HARDWARE_TROUBLESHOOTING',
    helpArticle: "microphone-troubleshooting",
    voiceGuidance: "Your microphone isn't working properly. Let's try some simple fixes together.",
    severity: 'major' as const,
    canRetry: true,
    showSupport: true,
  },
  'AUDIO_QUALITY_POOR': {
    elderlyMessage: "The recording quality is not very good. This might be due to background noise or being too far from your device.",
    technicalMessage: "Audio input quality below acceptable threshold",
    recovery: 'AUDIO_QUALITY_IMPROVEMENT',
    helpArticle: "improve-recording-quality",
    voiceGuidance: "The sound quality could be better. Let me help you find a quieter spot or get closer to your device.",
    severity: 'major' as const,
    canRetry: true,
    showSupport: false,
  },
  'NETWORK_CONNECTIVITY_LOST': {
    elderlyMessage: "Your internet connection was lost. Don't worry - your recording is safe, but some features won't work until you're back online.",
    technicalMessage: "Network connectivity lost during session",
    recovery: 'OFFLINE_MODE',
    helpArticle: "offline-recording",
    voiceGuidance: "You've lost internet connection, but that's okay. Your recording will still work.",
    severity: 'major' as const,
    canRetry: true,
    showSupport: false,
  },
} as const;
```

### 3. Minor Errors (Inconvenient but Manageable)

```typescript
const MINOR_ERRORS = {
  'RECORDING_INTERRUPTED': {
    elderlyMessage: "Your recording was interrupted by a phone call or notification. The part you already recorded is saved.",
    technicalMessage: "Recording session interrupted by system event",
    recovery: 'RESUME_OR_RESTART',
    helpArticle: "handle-interruptions",
    voiceGuidance: "Something interrupted your recording, but don't worry - what you recorded so far is safe.",
    severity: 'minor' as const,
    canRetry: true,
    showSupport: false,
  },
  'TRANSCRIPTION_DELAYED': {
    elderlyMessage: "Converting your speech to text is taking longer than usual. Your voice recording is perfectly safe.",
    technicalMessage: "Transcription service experiencing delays",
    recovery: 'CONTINUE_WITHOUT_TRANSCRIPTION',
    helpArticle: "transcription-issues",
    voiceGuidance: "The text version of your recording is taking a little longer, but your voice recording is ready.",
    severity: 'minor' as const,
    canRetry: true,
    showSupport: false,
  },
  'LOW_BATTERY_WARNING': {
    elderlyMessage: "Your device battery is getting low. Consider plugging in your charger to make sure your recording isn't interrupted.",
    technicalMessage: "Device battery below recommended level for recording",
    recovery: 'BATTERY_OPTIMIZATION',
    helpArticle: "battery-tips",
    voiceGuidance: "Your battery is getting low. You might want to plug in your charger.",
    severity: 'minor' as const,
    canRetry: true,
    showSupport: false,
  },
} as const;
```

### 4. Informational (User Guidance)

```typescript
const INFORMATIONAL_MESSAGES = {
  'FIRST_TIME_USER': {
    elderlyMessage: "Welcome! This is your first recording. I'll guide you through each step to make sure everything goes smoothly.",
    technicalMessage: "First-time user onboarding",
    recovery: 'EXTENDED_GUIDANCE',
    helpArticle: "getting-started",
    voiceGuidance: "Welcome to memory recording! I'm here to help you every step of the way.",
    severity: 'info' as const,
    canRetry: false,
    showSupport: false,
  },
  'ENVIRONMENT_TOO_NOISY': {
    elderlyMessage: "It's quite noisy where you are. For the best recording, try finding a quieter spot if possible.",
    technicalMessage: "High ambient noise detected",
    recovery: 'NOISE_REDUCTION_TIPS',
    helpArticle: "recording-environment",
    voiceGuidance: "It's a bit noisy here. If you can find a quieter spot, your recording will sound even better.",
    severity: 'info' as const,
    canRetry: false,
    showSupport: false,
  },
} as const;
```

## Permission Management Strategy

### 1. Permission States & Handling

```typescript
enum PermissionState {
  UNDETERMINED = 'undetermined',
  GRANTED = 'granted',
  DENIED = 'denied',
  RESTRICTED = 'restricted', // iOS parental controls
  PERMANENTLY_DENIED = 'permanently_denied',
}

interface PermissionHandler {
  checkPermission(): Promise<PermissionState>;
  requestPermission(): Promise<PermissionState>;
  explainPermission(): void;
  guideToSettings(): void;
  handleDenial(): void;
}
```

### 2. Microphone Permission Flow

#### A. Initial Check (Silent)
```typescript
class MicrophonePermissionManager {
  async checkInitialPermission(): Promise<PermissionState> {
    try {
      const { status } = await Audio.getPermissionsAsync();
      return this.mapExpoStatusToState(status);
    } catch (error) {
      // Log error but don't show to user yet
      return PermissionState.UNDETERMINED;
    }
  }

  async handlePermissionFlow(elderlySettings: ElderlyRecordingSettings): Promise<boolean> {
    const currentState = await this.checkInitialPermission();

    switch (currentState) {
      case PermissionState.GRANTED:
        return true;

      case PermissionState.UNDETERMINED:
        return await this.requestWithExplanation(elderlySettings);

      case PermissionState.DENIED:
        return await this.handleDeniedPermission(elderlySettings);

      case PermissionState.PERMANENTLY_DENIED:
        return await this.handlePermanentDenial(elderlySettings);

      case PermissionState.RESTRICTED:
        return await this.handleRestrictedPermission(elderlySettings);

      default:
        return false;
    }
  }
}
```

#### B. Request with Explanation
```typescript
async requestWithExplanation(settings: ElderlyRecordingSettings): Promise<boolean> {
  // Show explanation screen first
  await this.showPermissionExplanation(settings);

  // Voice guidance
  if (settings.voiceGuidanceEnabled) {
    await Speech.speak(
      "To record your memories, we need permission to use your microphone. This is completely safe and your recordings stay private on your device.",
      { rate: settings.voiceGuidanceRate }
    );
  }

  try {
    const { status } = await Audio.requestPermissionsAsync();

    if (status === 'granted') {
      await this.celebratePermissionGranted(settings);
      return true;
    } else {
      await this.handlePermissionDenied(settings);
      return false;
    }
  } catch (error) {
    await this.handlePermissionError(error, settings);
    return false;
  }
}

private async showPermissionExplanation(settings: ElderlyRecordingSettings): Promise<void> {
  // Show modal with:
  // - Clear explanation of why permission is needed
  // - What data is accessed (microphone only)
  // - How data is used (recording memories)
  // - Privacy assurances (stays on device)
  // - Large, clear buttons
}
```

#### C. Handle Denied Permission
```typescript
async handleDeniedPermission(settings: ElderlyRecordingSettings): Promise<boolean> {
  // Check if this is the first denial or subsequent
  const denialCount = await this.getDenialCount();

  if (denialCount === 1) {
    // First denial - gentle explanation and retry
    return await this.handleFirstDenial(settings);
  } else {
    // Multiple denials - guide to settings
    return await this.guideToDeviceSettings(settings);
  }
}

private async handleFirstDenial(settings: ElderlyRecordingSettings): Promise<boolean> {
  if (settings.voiceGuidanceEnabled) {
    await Speech.speak(
      "I understand you might be cautious about permissions. Your privacy is very important. The microphone is only used when you're actively recording a memory, and nothing is shared without your permission.",
      { rate: settings.voiceGuidanceRate }
    );
  }

  // Show retry dialog with more detailed explanation
  return new Promise((resolve) => {
    Alert.alert(
      "Microphone Permission Needed",
      "To record your memories, we need access to your microphone. This is completely safe and private. Would you like to try again?",
      [
        {
          text: "Not Now",
          style: "cancel",
          onPress: () => resolve(false),
        },
        {
          text: "Yes, Try Again",
          onPress: async () => {
            const result = await this.requestWithExplanation(settings);
            resolve(result);
          },
        },
      ]
    );
  });
}
```

### 3. Settings Integration

```typescript
class DeviceSettingsGuide {
  async guideToMicrophoneSettings(settings: ElderlyRecordingSettings): Promise<void> {
    const platform = Platform.OS;

    if (settings.voiceGuidanceEnabled) {
      const instruction = platform === 'ios'
        ? "I'll help you enable microphone access. We need to go to Settings, then Privacy & Security, then Microphone, and turn on Memoria AI."
        : "I'll help you enable microphone access. We need to go to Settings, then Apps, then Memoria AI, then Permissions, and turn on Microphone.";

      await Speech.speak(instruction, { rate: settings.voiceGuidanceRate });
    }

    // Show platform-specific visual guide
    this.showVisualGuide(platform, settings);

    // Optionally open device settings
    if (platform === 'ios') {
      Linking.openURL('app-settings:');
    } else {
      IntentLauncher.startActivityAsync(
        IntentLauncher.ActivityAction.APPLICATION_DETAILS_SETTINGS,
        { data: 'package:' + Application.applicationId }
      );
    }
  }

  private showVisualGuide(platform: string, settings: ElderlyRecordingSettings): void {
    // Show step-by-step screenshots of settings navigation
    // Highlight each step clearly
    // Use arrows and annotations
    // Provide "Done" button to return to app
  }
}
```

## Error Recovery Strategies

### 1. Auto-Recovery (When Possible)

```typescript
class AutoRecoveryManager {
  async attemptAutoRecovery(error: RecordingError): Promise<boolean> {
    switch (error.code) {
      case 'MICROPHONE_TEMPORARILY_UNAVAILABLE':
        return await this.retryMicrophoneAccess();

      case 'AUDIO_SESSION_INTERRUPTED':
        return await this.restoreAudioSession();

      case 'NETWORK_TEMPORARILY_UNAVAILABLE':
        return await this.enableOfflineMode();

      case 'LOW_STORAGE_SPACE':
        return await this.cleanupTempFiles();

      default:
        return false; // Cannot auto-recover
    }
  }

  private async retryMicrophoneAccess(): Promise<boolean> {
    // Wait for other apps to release microphone
    await new Promise(resolve => setTimeout(resolve, 2000));

    try {
      const recording = new Audio.Recording();
      await recording.prepareToRecordAsync(Audio.RECORDING_OPTIONS_PRESET_HIGH_QUALITY);
      await recording.unloadAsync();
      return true;
    } catch {
      return false;
    }
  }
}
```

### 2. Guided Recovery (User Assistance)

```typescript
class GuidedRecoveryManager {
  async startGuidedRecovery(
    error: RecordingError,
    settings: ElderlyRecordingSettings
  ): Promise<RecoveryResult> {
    const recoverySteps = this.getRecoverySteps(error.code);

    for (const step of recoverySteps) {
      const success = await this.executeRecoveryStep(step, settings);
      if (success) {
        return { success: true, step: step.name };
      }
    }

    return { success: false, step: 'all_steps_failed' };
  }

  private getRecoverySteps(errorCode: string): RecoveryStep[] {
    const stepMap: Record<string, RecoveryStep[]> = {
      'MICROPHONE_HARDWARE_ISSUE': [
        { name: 'close_other_apps', userAction: true },
        { name: 'restart_audio_system', userAction: false },
        { name: 'device_restart_suggestion', userAction: true },
      ],
      'AUDIO_QUALITY_POOR': [
        { name: 'environment_check', userAction: true },
        { name: 'microphone_position', userAction: true },
        { name: 'volume_adjustment', userAction: false },
      ],
      'STORAGE_LOW': [
        { name: 'cleanup_cache', userAction: false },
        { name: 'guided_storage_cleanup', userAction: true },
        { name: 'storage_management_tips', userAction: true },
      ],
    };

    return stepMap[errorCode] || [];
  }
}
```

### 3. Fallback Options

```typescript
class FallbackManager {
  async provideFallbackOptions(error: RecordingError): Promise<FallbackOption[]> {
    const options: FallbackOption[] = [];

    switch (error.code) {
      case 'MICROPHONE_UNAVAILABLE':
        options.push({
          title: "Use External Microphone",
          description: "Connect headphones with a microphone",
          action: () => this.guideExternalMicrophone(),
          elderlyFriendly: true,
        });
        break;

      case 'STORAGE_FULL':
        options.push({
          title: "Record Shorter Memory",
          description: "Try recording a shorter memory for now",
          action: () => this.enableShortRecordingMode(),
          elderlyFriendly: true,
        });
        break;

      case 'TRANSCRIPTION_FAILED':
        options.push({
          title: "Continue Without Text",
          description: "Your voice recording is perfect. Skip the text version for now",
          action: () => this.skipTranscription(),
          elderlyFriendly: true,
        });
        break;
    }

    return options;
  }
}
```

## User Communication Strategy

### 1. Error Messages for Elderly Users

```typescript
interface ElderlyErrorMessage {
  title: string;           // Short, clear title
  explanation: string;     // What happened in simple terms
  impact: string;          // What this means for the user
  nextSteps: string;       // What to do next
  voiceScript: string;     // What to speak aloud
  visualAids: string[];    // Icons, colors, animations to show
}

const ERROR_MESSAGES: Record<string, ElderlyErrorMessage> = {
  'MICROPHONE_PERMISSION_DENIED': {
    title: "Microphone Access Needed",
    explanation: "We need permission to use your microphone to record your memories.",
    impact: "Without this, we can't record your voice.",
    nextSteps: "Let me help you enable microphone access in your settings.",
    voiceScript: "To record your memories, we need to access your microphone. This is completely safe and private. Let me help you enable this.",
    visualAids: ["microphone-icon", "settings-animation", "privacy-shield"],
  },
};
```

### 2. Progressive Error Disclosure

```typescript
class ProgressiveErrorDisclosure {
  showError(error: RecordingError, settings: ElderlyRecordingSettings): void {
    // Step 1: Simple notification
    this.showSimpleNotification(error);

    // Step 2: If user needs more info
    setTimeout(() => {
      if (!this.isErrorResolved()) {
        this.showDetailedExplanation(error, settings);
      }
    }, 5000);

    // Step 3: If still not resolved
    setTimeout(() => {
      if (!this.isErrorResolved()) {
        this.offerPersonalHelp(error, settings);
      }
    }, 15000);
  }

  private showSimpleNotification(error: RecordingError): void {
    // Toast or small banner with basic message
    // Large, friendly icon
    // Single action button
  }

  private showDetailedExplanation(error: RecordingError, settings: ElderlyRecordingSettings): void {
    // Modal with more details
    // Step-by-step instructions
    // Visual aids and screenshots
    // Voice explanation available
  }

  private offerPersonalHelp(error: RecordingError, settings: ElderlyRecordingSettings): void {
    // Offer to contact support
    // Family member notification option
    // Detailed diagnostic information collection
  }
}
```

## Error Prevention Strategies

### 1. Proactive Checks

```typescript
class ErrorPreventionManager {
  async performPreFlightChecks(): Promise<PreFlightResult> {
    const checks = await Promise.all([
      this.checkMicrophoneAccess(),
      this.checkStorageSpace(),
      this.checkBatteryLevel(),
      this.checkNetworkConnectivity(),
      this.checkAudioQuality(),
    ]);

    return {
      canProceed: checks.every(check => check.passed),
      warnings: checks.filter(check => !check.passed),
      recommendations: this.generateRecommendations(checks),
    };
  }

  private async checkStorageSpace(): Promise<CheckResult> {
    const availableSpace = await FileSystem.getFreeDiskStorageAsync();
    const requiredSpace = 50 * 1024 * 1024; // 50MB minimum

    if (availableSpace < requiredSpace) {
      return {
        passed: false,
        warning: "Storage space is running low",
        elderlyMessage: "Your device is running out of space. We need some room to save your recordings.",
        action: () => this.guideStorageCleanup(),
      };
    }

    return { passed: true };
  }
}
```

### 2. Environmental Awareness

```typescript
class EnvironmentalMonitor {
  startMonitoring(settings: ElderlyRecordingSettings): void {
    // Monitor audio levels for environment assessment
    this.monitorBackgroundNoise();

    // Monitor device orientation and movement
    this.monitorDeviceStability();

    // Monitor interruption sources
    this.monitorPotentialInterruptions();
  }

  private async monitorBackgroundNoise(): Promise<void> {
    const noiseLevel = await this.measureBackgroundNoise();

    if (noiseLevel > 50) { // dB threshold
      this.suggestQuieterEnvironment();
    }
  }

  private suggestQuieterEnvironment(): void {
    // Gentle suggestion to find quieter space
    // Visual indicator of noise level
    // Tips for reducing background noise
  }
}
```

## Analytics & Learning

### 1. Error Tracking

```typescript
interface ErrorAnalytics {
  errorCode: string;
  timestamp: Date;
  userAge?: number;
  userExperience: 'beginner' | 'intermediate' | 'experienced';
  deviceInfo: DeviceInfo;
  contextInfo: {
    screenAtError: string;
    timeInSession: number;
    previousErrors: string[];
  };
  resolutionInfo: {
    resolvedAutomatically: boolean;
    userActionsRequired: string[];
    timeToResolution: number;
    finalResolution: 'success' | 'abandoned' | 'support_needed';
  };
}
```

### 2. Adaptive Error Handling

```typescript
class AdaptiveErrorHandler {
  async handleError(error: RecordingError, userProfile: UserProfile): Promise<void> {
    // Adapt response based on user's history
    const userErrorHistory = await this.getUserErrorHistory(userProfile.id);
    const adaptedResponse = this.adaptResponseToUser(error, userErrorHistory);

    // Show appropriate level of detail
    if (userProfile.techSavviness === 'beginner') {
      await this.showSimplifiedError(adaptedResponse);
    } else {
      await this.showStandardError(adaptedResponse);
    }

    // Learn from resolution
    this.trackErrorResolution(error, userProfile);
  }
}
```

## Implementation Checklist

### Phase 1: Core Error Handling
- [ ] Basic error classification system
- [ ] Simple error messages for elderly users
- [ ] Auto-recovery for common issues
- [ ] Permission request flow with explanation

### Phase 2: Enhanced Recovery
- [ ] Guided recovery processes
- [ ] Visual guides for settings navigation
- [ ] Fallback options for each error type
- [ ] Progressive error disclosure

### Phase 3: Advanced Features
- [ ] Predictive error prevention
- [ ] Environmental monitoring
- [ ] Adaptive error handling based on user profile
- [ ] Analytics and learning system

This comprehensive error handling strategy ensures that elderly users receive supportive, clear guidance when issues arise, with multiple pathways to resolution and minimal frustration.