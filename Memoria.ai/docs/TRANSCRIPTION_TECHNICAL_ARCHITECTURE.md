# Transcription Technical Architecture
**Feature 2: Edit Memory Screen - Audio Transcription**

## Document Status
- **Version**: 1.0
- **Last Updated**: 2025-10-06
- **Owner**: Technical PM / Engineering Team
- **Target Users**: Elderly users (60+ years)

---

## Executive Summary

This document defines the technical architecture for audio transcription in Memoria.ai, with a two-phase approach:
- **Phase 1 (MVP)**: On-device transcription using `expo-speech-recognition` (FREE, cross-platform)
- **Phase 2 (Scale)**: Cloud-based transcription using OpenAI Whisper API (Premium feature)

The architecture is designed with a **provider abstraction layer** to enable seamless switching between transcription engines without breaking changes to the UI or user experience.

---

## Architecture Overview

### High-Level Design

```
┌─────────────────────────────────────────────────────────────┐
│                    UI Layer (React Native)                   │
│  - EditMemoryScreen                                          │
│  - TranscriptionDisplay                                      │
│  - TranscriptionControls                                     │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│              TranscriptionService (Abstraction)              │
│  - Unified API for all providers                             │
│  - Provider selection logic                                  │
│  - Error handling & retry logic                              │
│  - Elderly-specific optimizations                            │
└────────────────────┬────────────────────────────────────────┘
                     │
        ┌────────────┴─────────────┐
        ▼                          ▼
┌──────────────────┐     ┌──────────────────────┐
│ MVP Provider     │     │ Future Provider       │
│ (expo-speech)    │     │ (Whisper API)         │
│ - On-device      │     │ - Cloud-based         │
│ - FREE           │     │ - Premium tier        │
│ - Cross-platform │     │ - Higher accuracy     │
└──────────────────┘     └──────────────────────┘
```

---

## Phase 1: MVP Implementation (expo-speech-recognition)

### Why expo-speech-recognition?

| Criteria | expo-speech-recognition | Alternatives |
|----------|-------------------------|--------------|
| **Cost** | FREE (no API fees) | Whisper API: $0.006/min |
| **Privacy** | On-device (elderly-friendly) | Cloud requires data upload |
| **Platform Support** | iOS, Android, Web | Varies by provider |
| **Setup Complexity** | Low (built into Expo) | Medium-High (API keys, backend) |
| **Accuracy** | Good for clear speech | Excellent (Whisper) |
| **Latency** | Real-time | Network-dependent |
| **Offline Support** | YES | NO |

### Technical Implementation

#### 1. Installation
```bash
npx expo install expo-speech-recognition
```

#### 2. Provider Interface (New File)

**Location**: `/src/services/providers/ITranscriptionProvider.ts`

```typescript
export interface TranscriptionOptions {
  language?: 'en-US' | 'zh-CN' | 'auto';
  continuous?: boolean;
  interimResults?: boolean;
  maxAlternatives?: number;
}

export interface TranscriptionResult {
  text: string;
  confidence: number;
  language: string;
  isFinal: boolean;
  timestamp: number;
}

export interface ITranscriptionProvider {
  name: string;
  isAvailable(): Promise<boolean>;
  startTranscription(options: TranscriptionOptions): Promise<void>;
  stopTranscription(): Promise<TranscriptionResult>;
  onResult(callback: (result: TranscriptionResult) => void): void;
  onError(callback: (error: Error) => void): void;
  cleanup(): void;
}
```

#### 3. Expo Speech Provider (New File)

**Location**: `/src/services/providers/ExpoSpeechProvider.ts`

```typescript
import * as SpeechRecognition from 'expo-speech-recognition';
import { ITranscriptionProvider, TranscriptionOptions, TranscriptionResult } from './ITranscriptionProvider';

export class ExpoSpeechProvider implements ITranscriptionProvider {
  name = 'expo-speech-recognition';
  private resultCallback?: (result: TranscriptionResult) => void;
  private errorCallback?: (error: Error) => void;
  private recognitionSubscription?: any;
  private accumulatedText = '';
  private isRunning = false;

  async isAvailable(): Promise<boolean> {
    try {
      const available = await SpeechRecognition.getPermissionsAsync();
      return available.status === 'granted' || available.canAskAgain;
    } catch (error) {
      console.error('Speech recognition not available:', error);
      return false;
    }
  }

  async startTranscription(options: TranscriptionOptions): Promise<void> {
    // Request permissions
    const { status } = await SpeechRecognition.requestPermissionsAsync();
    if (status !== 'granted') {
      throw new Error('Speech recognition permission denied');
    }

    // Configure recognition
    const recognitionOptions = {
      lang: this.mapLanguage(options.language || 'auto'),
      interimResults: options.interimResults ?? true,
      maxAlternatives: options.maxAlternatives ?? 1,
      continuous: options.continuous ?? true,
      // Elderly-specific optimizations
      contextualStrings: this.getElderlyContextKeywords(),
    };

    // Start recognition
    this.isRunning = true;
    this.accumulatedText = '';

    this.recognitionSubscription = SpeechRecognition.addSpeechRecognitionListener(
      (event) => {
        if (event.results && event.results.length > 0) {
          const result = event.results[0];
          const transcript = result.transcript || '';
          const confidence = result.confidence || 0.8;

          this.accumulatedText = transcript;

          const transcriptionResult: TranscriptionResult = {
            text: transcript,
            confidence,
            language: options.language || 'en-US',
            isFinal: result.isFinal ?? false,
            timestamp: Date.now(),
          };

          this.resultCallback?.(transcriptionResult);
        }

        if (event.error) {
          this.errorCallback?.(new Error(event.error));
        }
      }
    );

    await SpeechRecognition.start(recognitionOptions);
  }

  async stopTranscription(): Promise<TranscriptionResult> {
    this.isRunning = false;

    if (this.recognitionSubscription) {
      this.recognitionSubscription.remove();
      this.recognitionSubscription = null;
    }

    await SpeechRecognition.stop();

    return {
      text: this.accumulatedText,
      confidence: 0.85,
      language: 'en-US',
      isFinal: true,
      timestamp: Date.now(),
    };
  }

  onResult(callback: (result: TranscriptionResult) => void): void {
    this.resultCallback = callback;
  }

  onError(callback: (error: Error) => void): void {
    this.errorCallback = callback;
  }

  cleanup(): void {
    if (this.isRunning) {
      this.stopTranscription();
    }
  }

  private mapLanguage(lang: string): string {
    const languageMap: Record<string, string> = {
      'en': 'en-US',
      'zh': 'zh-CN',
      'auto': 'en-US', // Default to English for MVP
    };
    return languageMap[lang] || lang;
  }

  private getElderlyContextKeywords(): string[] {
    // Contextual strings to improve recognition accuracy for elderly users
    return [
      'family', 'children', 'grandchildren', 'memory', 'remember',
      'hospital', 'doctor', 'medicine', 'health',
      'garden', 'cooking', 'friends', 'neighbors',
      // Chinese equivalents
      '家人', '孩子', '孙子', '回忆', '记得',
      '医院', '医生', '药', '健康',
      '花园', '做饭', '朋友', '邻居'
    ];
  }
}
```

#### 4. Updated TranscriptionService (Modify Existing)

**Location**: `/src/services/transcriptionService.ts`

**Changes Required**:

```typescript
import { ITranscriptionProvider } from './providers/ITranscriptionProvider';
import { ExpoSpeechProvider } from './providers/ExpoSpeechProvider';
import { WhisperAPIProvider } from './providers/WhisperAPIProvider'; // Future

export class TranscriptionService {
  private providers: Map<string, ITranscriptionProvider> = new Map();
  private activeProvider: ITranscriptionProvider;
  private featureFlagService: FeatureFlagService; // For A/B testing

  constructor() {
    // Register providers
    this.registerProvider(new ExpoSpeechProvider());
    // Future: this.registerProvider(new WhisperAPIProvider());

    // Select default provider (MVP: expo-speech)
    this.activeProvider = this.providers.get('expo-speech-recognition')!;

    this.featureFlagService = new FeatureFlagService();
  }

  private registerProvider(provider: ITranscriptionProvider): void {
    this.providers.set(provider.name, provider);
  }

  async selectProvider(name: string): Promise<void> {
    const provider = this.providers.get(name);
    if (!provider) {
      throw new Error(`Provider ${name} not registered`);
    }

    const available = await provider.isAvailable();
    if (!available) {
      throw new Error(`Provider ${name} not available on this device`);
    }

    // Cleanup old provider
    this.activeProvider.cleanup();

    // Switch to new provider
    this.activeProvider = provider;
    console.log(`Switched to transcription provider: ${name}`);
  }

  async autoSelectProvider(userTier: 'free' | 'premium'): Promise<void> {
    // Business logic: Free users get expo-speech, Premium users get Whisper
    if (userTier === 'premium' && this.providers.has('whisper-api')) {
      await this.selectProvider('whisper-api');
    } else {
      await this.selectProvider('expo-speech-recognition');
    }
  }

  async startRealtimeTranscription(options?: TranscriptionOptions): Promise<void> {
    const defaultOptions: TranscriptionOptions = {
      language: 'auto',
      continuous: true,
      interimResults: true,
      maxAlternatives: 1,
    };

    await this.activeProvider.startTranscription({ ...defaultOptions, ...options });

    // Set up callbacks
    this.activeProvider.onResult((result) => {
      // Apply elderly-specific post-processing
      const enhanced = this.enhanceForElderly(result);
      this.notifyListeners('transcription:update', enhanced);
    });

    this.activeProvider.onError((error) => {
      this.notifyListeners('transcription:error', error);
    });
  }

  async stopRealtimeTranscription(): Promise<TranscriptionResult> {
    return await this.activeProvider.stopTranscription();
  }

  private enhanceForElderly(result: TranscriptionResult): TranscriptionResult {
    let text = result.text;

    // Remove filler words
    text = text.replace(/\b(um+|uh+|er+)\b/gi, '');

    // Normalize spacing
    text = text.replace(/\s+/g, ' ').trim();

    // Apply punctuation if confidence is high
    if (result.confidence > 0.8 && result.isFinal) {
      text = this.addAutoPunctuation(text);
    }

    return {
      ...result,
      text,
    };
  }

  private addAutoPunctuation(text: string): string {
    // Simple punctuation logic
    if (!/[.!?]$/.test(text)) {
      text += '.';
    }
    return text;
  }

  // ... rest of existing methods
}
```

### Elderly-Specific Optimizations

#### 1. Slower Speech Rate Handling
```typescript
// In ExpoSpeechProvider
recognitionOptions = {
  ...recognitionOptions,
  // Allow longer pauses before finalizing (elderly users speak slower)
  speechTimeoutMs: 2000, // 2 seconds instead of default 1s
  endpointerSensitivity: 0.3, // Less sensitive to pauses
};
```

#### 2. Noise Reduction
```typescript
// Pre-process audio before transcription
async preprocessAudioForElderly(audioUri: string): Promise<string> {
  // Use expo-av to apply:
  // - Noise gate (remove background noise)
  // - Volume normalization (elderly may speak quietly)
  // - Low-pass filter (reduce environmental sounds)

  const { sound } = await Audio.Sound.createAsync({ uri: audioUri });
  await sound.setIsMutedAsync(false);
  await sound.setVolumeAsync(1.0);

  // Apply audio processing...

  return processedAudioUri;
}
```

#### 3. Confidence Thresholds
```typescript
// Lower confidence threshold for elderly users
const ELDERLY_CONFIDENCE_THRESHOLD = 0.65; // vs 0.80 for general users

if (result.confidence < ELDERLY_CONFIDENCE_THRESHOLD) {
  // Show UI hint: "Not sure I heard that clearly. Could you repeat?"
  this.showConfidenceWarning();
}
```

---

## Phase 2: Whisper API Migration

### Whisper API Provider (Future Implementation)

**Location**: `/src/services/providers/WhisperAPIProvider.ts`

```typescript
import { ITranscriptionProvider, TranscriptionOptions, TranscriptionResult } from './ITranscriptionProvider';

export class WhisperAPIProvider implements ITranscriptionProvider {
  name = 'whisper-api';
  private apiKey: string;
  private apiBaseUrl = 'https://api.openai.com/v1/audio/transcriptions';
  private audioBuffer: Blob[] = [];
  private isRecording = false;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async isAvailable(): Promise<boolean> {
    // Check if API key is configured
    return !!this.apiKey && this.apiKey.length > 0;
  }

  async startTranscription(options: TranscriptionOptions): Promise<void> {
    this.isRecording = true;
    this.audioBuffer = [];

    // Whisper doesn't support streaming, so we buffer audio
    // and transcribe in chunks or on stop
    console.log('Buffering audio for Whisper API transcription');
  }

  async stopTranscription(): Promise<TranscriptionResult> {
    this.isRecording = false;

    // Combine audio buffer into single file
    const audioBlob = new Blob(this.audioBuffer, { type: 'audio/wav' });

    // Send to Whisper API
    const formData = new FormData();
    formData.append('file', audioBlob, 'recording.wav');
    formData.append('model', 'whisper-1');
    formData.append('language', 'en'); // or detect from options
    formData.append('response_format', 'verbose_json'); // Get timestamps

    const response = await fetch(this.apiBaseUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Whisper API error: ${response.statusText}`);
    }

    const data = await response.json();

    return {
      text: data.text,
      confidence: 0.95, // Whisper doesn't provide confidence, assume high
      language: data.language,
      isFinal: true,
      timestamp: Date.now(),
    };
  }

  onResult(callback: (result: TranscriptionResult) => void): void {
    // Whisper is non-streaming, so we don't emit interim results
    // Could implement chunked transcription here in future
  }

  onError(callback: (error: Error) => void): void {
    // Store error callback
  }

  cleanup(): void {
    this.audioBuffer = [];
    this.isRecording = false;
  }
}
```

### API Cost Optimization Strategies

#### 1. Chunked Transcription
```typescript
// Only send to Whisper API after user stops speaking
// This reduces API calls compared to continuous streaming

const CHUNK_DURATION = 10; // seconds
const MIN_AUDIO_LENGTH = 3; // seconds (don't transcribe very short audio)

async transcribeChunk(audioBlob: Blob): Promise<void> {
  const duration = await this.getAudioDuration(audioBlob);

  if (duration < MIN_AUDIO_LENGTH) {
    console.log('Audio too short, skipping API call');
    return;
  }

  // Proceed with API call...
}
```

#### 2. Caching
```typescript
// Cache transcription results to avoid re-transcribing edited recordings
import AsyncStorage from '@react-native-async-storage/async-storage';

async getCachedTranscription(audioHash: string): Promise<string | null> {
  const key = `transcription_${audioHash}`;
  return await AsyncStorage.getItem(key);
}

async cacheTranscription(audioHash: string, text: string): Promise<void> {
  const key = `transcription_${audioHash}`;
  await AsyncStorage.setItem(key, text);
}
```

#### 3. Compression
```typescript
// Compress audio before sending to API to reduce costs
// Whisper accepts multiple formats: mp3, wav, m4a, etc.

async compressAudio(audioUri: string): Promise<Blob> {
  // Convert to MP3 at lower bitrate
  // MP3 at 64kbps is sufficient for speech
  // This can reduce file size by 80%

  return compressedAudioBlob;
}
```

---

## Abstraction Layer Benefits

### 1. Easy A/B Testing
```typescript
// Test both providers with different user segments
const shouldUseWhisper = await featureFlagService.isEnabled(
  'whisper-transcription',
  { userId, userTier: 'premium' }
);

await transcriptionService.selectProvider(
  shouldUseWhisper ? 'whisper-api' : 'expo-speech-recognition'
);
```

### 2. Graceful Fallback
```typescript
// If Whisper API fails, fallback to on-device
try {
  await transcriptionService.selectProvider('whisper-api');
  await transcriptionService.startRealtimeTranscription();
} catch (error) {
  console.warn('Whisper API unavailable, falling back to on-device');
  await transcriptionService.selectProvider('expo-speech-recognition');
  await transcriptionService.startRealtimeTranscription();
}
```

### 3. Provider-Specific Features
```typescript
// Expose provider capabilities to UI
const capabilities = transcriptionService.getCapabilities();

if (capabilities.supportsLanguageDetection) {
  // Show language auto-detect option
}

if (capabilities.supportsRealtimeStreaming) {
  // Show live transcription UI
} else {
  // Show "Processing..." after recording ends
}
```

---

## UI Integration

### Edit Memory Screen Components

#### 1. Transcription Display Component

**Location**: `/components/transcription/TranscriptionDisplay.tsx`

```typescript
interface TranscriptionDisplayProps {
  text: string;
  confidence: number;
  isRealtime: boolean;
  onEdit: (newText: string) => void;
}

export const TranscriptionDisplay: React.FC<TranscriptionDisplayProps> = ({
  text,
  confidence,
  isRealtime,
  onEdit,
}) => {
  return (
    <View style={styles.container}>
      {/* Real-time indicator */}
      {isRealtime && (
        <View style={styles.realtimeIndicator}>
          <Text style={styles.realtimeText}>Listening...</Text>
          <ActivityIndicator size="small" color="#007AFF" />
        </View>
      )}

      {/* Confidence indicator (elderly-friendly) */}
      {confidence < 0.7 && (
        <View style={styles.confidenceWarning}>
          <Icon name="alert-circle" size={20} color="#FF9500" />
          <Text style={styles.warningText}>
            I might have missed some words. You can edit below.
          </Text>
        </View>
      )}

      {/* Editable text area (large font for elderly) */}
      <TextInput
        style={styles.transcriptionText}
        value={text}
        onChangeText={onEdit}
        multiline
        placeholder="Your words will appear here..."
        placeholderTextColor="#999"
        // Elderly-friendly settings
        fontSize={20}
        lineHeight={30}
        autoCorrect={true}
        spellCheck={true}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#fff',
  },
  transcriptionText: {
    fontSize: 20, // Large for elderly users
    lineHeight: 30,
    color: '#000',
    minHeight: 200,
  },
  confidenceWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#FFF3CD',
    borderRadius: 8,
    marginBottom: 16,
  },
  warningText: {
    marginLeft: 8,
    fontSize: 16,
    color: '#856404',
  },
  realtimeIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  realtimeText: {
    fontSize: 16,
    color: '#007AFF',
    marginRight: 8,
  },
});
```

#### 2. Transcription Controls Component

**Location**: `/components/transcription/TranscriptionControls.tsx`

```typescript
interface TranscriptionControlsProps {
  isTranscribing: boolean;
  onStart: () => void;
  onStop: () => void;
  onRetry: () => void;
}

export const TranscriptionControls: React.FC<TranscriptionControlsProps> = ({
  isTranscribing,
  onStart,
  onStop,
  onRetry,
}) => {
  return (
    <View style={styles.container}>
      {!isTranscribing ? (
        <TouchableOpacity
          style={styles.startButton}
          onPress={onStart}
          accessibilityLabel="Start transcribing your voice"
          accessibilityHint="Converts your voice to text"
        >
          <Icon name="mic" size={32} color="#fff" />
          <Text style={styles.buttonText}>Tap to Speak</Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity
          style={styles.stopButton}
          onPress={onStop}
          accessibilityLabel="Stop transcribing"
        >
          <Icon name="stop" size={32} color="#fff" />
          <Text style={styles.buttonText}>Stop</Text>
        </TouchableOpacity>
      )}

      <TouchableOpacity
        style={styles.retryButton}
        onPress={onRetry}
        accessibilityLabel="Try transcribing again"
      >
        <Icon name="refresh" size={24} color="#007AFF" />
        <Text style={styles.retryText}>Try Again</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    alignItems: 'center',
  },
  startButton: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  stopButton: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#FF3B30',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    marginTop: 8,
    fontSize: 18,
    color: '#fff',
    fontWeight: '600',
  },
  retryButton: {
    marginTop: 20,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  retryText: {
    marginLeft: 8,
    fontSize: 16,
    color: '#007AFF',
  },
});
```

---

## Error Handling

### Elderly-Friendly Error Messages

```typescript
export class TranscriptionErrorHandler {
  static getElderlyFriendlyMessage(error: Error): string {
    const errorMap: Record<string, string> = {
      'PERMISSION_DENIED':
        "I need your permission to listen to your voice. Please allow microphone access in Settings.",

      'NETWORK_ERROR':
        "Can't connect right now. Don't worry, you can record and I'll transcribe later when you're back online.",

      'PROVIDER_UNAVAILABLE':
        "The voice-to-text feature isn't available on your device. You can still type your memory.",

      'LOW_CONFIDENCE':
        "I couldn't hear that clearly. Try speaking a bit louder or moving to a quieter place.",

      'AUDIO_TOO_SHORT':
        "That recording was too short. Please speak for at least 3 seconds.",

      'API_QUOTA_EXCEEDED':
        "You've reached your monthly transcription limit. You can still record voice memories!",
    };

    return errorMap[error.message] ||
      "Something went wrong. Don't worry, your recording is safe. You can try again or type instead.";
  }

  static shouldRetryAutomatically(error: Error): boolean {
    const retryableErrors = [
      'NETWORK_ERROR',
      'TEMPORARY_FAILURE',
      'TIMEOUT',
    ];

    return retryableErrors.includes(error.message);
  }

  static async handleError(
    error: Error,
    context: 'recording' | 'transcription'
  ): Promise<void> {
    const message = this.getElderlyFriendlyMessage(error);

    // Log for debugging
    console.error(`Transcription error [${context}]:`, error);

    // Show user-friendly message
    Alert.alert(
      'Oops!',
      message,
      [
        { text: 'Try Again', onPress: () => this.retry() },
        { text: 'Type Instead', onPress: () => this.switchToTyping() },
      ]
    );

    // Track error for analytics
    await AnalyticsService.trackError({
      type: 'transcription_error',
      message: error.message,
      context,
      userAge: '65+',
    });
  }
}
```

---

## Testing Strategy

### Unit Tests

**Location**: `/src/services/__tests__/transcriptionService.test.ts`

```typescript
describe('TranscriptionService', () => {
  describe('Provider Selection', () => {
    it('should select expo-speech provider by default', async () => {
      const service = new TranscriptionService();
      expect(service.activeProvider.name).toBe('expo-speech-recognition');
    });

    it('should switch to Whisper for premium users', async () => {
      const service = new TranscriptionService();
      await service.autoSelectProvider('premium');
      expect(service.activeProvider.name).toBe('whisper-api');
    });

    it('should fallback to expo-speech if Whisper unavailable', async () => {
      const service = new TranscriptionService();
      // Mock Whisper as unavailable
      jest.spyOn(WhisperAPIProvider.prototype, 'isAvailable').mockResolvedValue(false);

      await service.selectProviderWithFallback('whisper-api');
      expect(service.activeProvider.name).toBe('expo-speech-recognition');
    });
  });

  describe('Elderly Optimizations', () => {
    it('should remove filler words from transcription', () => {
      const service = new TranscriptionService();
      const input = { text: 'um so I uh think that uh yeah', confidence: 0.9 };
      const result = service.enhanceForElderly(input);
      expect(result.text).toBe('so I think that yeah');
    });

    it('should add auto-punctuation for high-confidence results', () => {
      const service = new TranscriptionService();
      const input = { text: 'this is a test', confidence: 0.95, isFinal: true };
      const result = service.enhanceForElderly(input);
      expect(result.text).toBe('this is a test.');
    });
  });
});
```

### Integration Tests

**Location**: `/src/components/__tests__/EditMemoryScreen.integration.test.tsx`

```typescript
describe('Edit Memory Screen - Transcription', () => {
  it('should start transcription when mic button pressed', async () => {
    const { getByLabelText } = render(<EditMemoryScreen />);
    const micButton = getByLabelText('Start transcribing your voice');

    fireEvent.press(micButton);

    await waitFor(() => {
      expect(screen.getByText('Listening...')).toBeOnTheScreen();
    });
  });

  it('should display transcription results in real-time', async () => {
    const { getByLabelText, getByDisplayValue } = render(<EditMemoryScreen />);

    // Start transcription
    fireEvent.press(getByLabelText('Start transcribing your voice'));

    // Simulate real-time results
    act(() => {
      transcriptionService.emit('transcription:update', {
        text: 'Hello world',
        confidence: 0.9,
      });
    });

    expect(getByDisplayValue('Hello world')).toBeOnTheScreen();
  });

  it('should allow manual editing of transcribed text', async () => {
    const { getByPlaceholderText } = render(<EditMemoryScreen />);
    const textInput = getByPlaceholderText('Your words will appear here...');

    fireEvent.changeText(textInput, 'Edited transcription');

    expect(textInput.props.value).toBe('Edited transcription');
  });
});
```

---

## Performance Considerations

### Memory Management
```typescript
// Cleanup on unmount to prevent memory leaks
useEffect(() => {
  return () => {
    transcriptionService.cleanup();
  };
}, []);
```

### Battery Optimization
```typescript
// Limit continuous transcription time for elderly users
const MAX_TRANSCRIPTION_TIME = 5 * 60 * 1000; // 5 minutes

useEffect(() => {
  if (isTranscribing) {
    const timeout = setTimeout(() => {
      handleStopTranscription();
      Alert.alert(
        'Recording Paused',
        'Recordings longer than 5 minutes are automatically paused to save battery. Tap "Continue" to keep recording.',
        [
          { text: 'Stop', onPress: handleSave },
          { text: 'Continue', onPress: handleStartTranscription },
        ]
      );
    }, MAX_TRANSCRIPTION_TIME);

    return () => clearTimeout(timeout);
  }
}, [isTranscribing]);
```

---

## Accessibility

### Screen Reader Support
```typescript
<TouchableOpacity
  accessible={true}
  accessibilityRole="button"
  accessibilityLabel="Start voice transcription"
  accessibilityHint="Converts your spoken words into text"
  accessibilityState={{ disabled: !isReady }}
>
  <Text>Tap to Speak</Text>
</TouchableOpacity>
```

### Voice Feedback for Transcription Status
```typescript
import * as Speech from 'expo-speech';

async function announceTranscriptionStatus(status: string): Promise<void> {
  const messages = {
    started: "Transcription started. I'm listening to you now.",
    stopped: "Transcription stopped. Your words have been saved.",
    error: "There was a problem. Please try again.",
  };

  await Speech.speak(messages[status], {
    language: 'en',
    pitch: 1.0,
    rate: 0.8, // Slower for elderly users
  });
}
```

---

## Migration Checklist

When implementing Phase 2 (Whisper API):

- [ ] Create `WhisperAPIProvider.ts` implementing `ITranscriptionProvider`
- [ ] Add API key configuration in app settings
- [ ] Update `TranscriptionService` to register Whisper provider
- [ ] Implement feature flag for gradual rollout
- [ ] Add cost tracking and quota management
- [ ] Update UI to show "Premium" badge on Whisper feature
- [ ] Add A/B testing metrics (accuracy comparison)
- [ ] Update user settings to allow provider selection
- [ ] Implement graceful fallback if Whisper API is down
- [ ] Update documentation and user guides

---

## Next Steps

1. **Immediate** (This Sprint):
   - Install `expo-speech-recognition`
   - Implement `ITranscriptionProvider` interface
   - Create `ExpoSpeechProvider`
   - Update `TranscriptionService` to use provider pattern
   - Build transcription UI components

2. **Short-term** (Next 2 Sprints):
   - Add elderly-specific optimizations
   - Implement error handling with user-friendly messages
   - Add unit and integration tests
   - Conduct user testing with elderly participants

3. **Long-term** (Next Quarter):
   - Evaluate Whisper API integration
   - Build business model and pricing
   - Implement premium tier features
   - Conduct accuracy comparison study

---

## References

- [expo-speech-recognition Documentation](https://docs.expo.dev/versions/latest/sdk/speech-recognition/)
- [OpenAI Whisper API Documentation](https://platform.openai.com/docs/guides/speech-to-text)
- [React Native Accessibility Guidelines](https://reactnative.dev/docs/accessibility)
- Memoria.ai: `/src/services/transcriptionService.ts` (existing implementation)
