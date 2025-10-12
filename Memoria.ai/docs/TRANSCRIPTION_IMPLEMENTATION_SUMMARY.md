# Transcription Feature Implementation Summary
**Quick Reference for Engineering Team**

## Document Purpose
This is your **TL;DR guide** to implementing Feature 2: Edit Memory Screen with audio transcription. For detailed information, refer to the comprehensive documents linked below.

---

## What We're Building

**MVP (Phase 1)**: On-device transcription using `expo-speech-recognition`
- FREE for all users
- Good accuracy (85%)
- Works offline
- No API costs

**Future (Phase 2)**: Cloud transcription using OpenAI Whisper API
- Premium tier feature ($4.99/month)
- Excellent accuracy (95%)
- Better for elderly speech patterns
- Cost: $0.006/minute

---

## Key Architecture Decisions

### 1. Provider Abstraction Pattern
We're building a **provider-agnostic** transcription service that can switch between different transcription engines without changing UI code.

```typescript
ITranscriptionProvider (interface)
    ├── ExpoSpeechProvider (MVP)
    └── WhisperAPIProvider (Future)
```

**Why?**
- Easy to add new providers later
- A/B test different providers
- Graceful fallback if one provider fails
- No vendor lock-in

### 2. Freemium Business Model

| Tier | Price | Transcription | Quality |
|------|-------|--------------|---------|
| Free | $0 | On-device (expo-speech) | 85% accurate |
| Premium | $4.99/mo | Cloud (Whisper API) | 95% accurate |

**Target**: 15% conversion rate (free → premium)

### 3. Elderly-First Design

All transcription features optimized for elderly users:
- Larger fonts (20px vs 16px)
- High contrast mode
- Voice guidance
- Slower processing for better accuracy
- Contextual keywords (family, health, memories)

---

## Files You'll Create

### Core Interface
```
/src/services/providers/ITranscriptionProvider.ts
```
**Purpose**: Common interface all transcription providers must implement

**Key Methods**:
- `isAvailable()`: Check if provider can run on device
- `startTranscription(options)`: Begin transcription
- `stopTranscription()`: End and return results
- `onResult(callback)`: Real-time transcription updates
- `cleanup()`: Free resources

### MVP Provider
```
/src/services/providers/ExpoSpeechProvider.ts
```
**Purpose**: Wraps expo-speech-recognition in our provider interface

**Dependencies**:
```bash
npx expo install expo-speech-recognition
```

**Key Features**:
- Real-time transcription
- Language detection (English/Chinese)
- Elderly-optimized settings (longer pause tolerance)
- No API costs

### Future Provider
```
/src/services/providers/WhisperAPIProvider.ts
```
**Purpose**: Integrates OpenAI Whisper API for premium users

**Key Features**:
- Higher accuracy (95%)
- Automatic punctuation
- Cost tracking ($0.006/min)
- Audio compression (reduce upload time)
- Caching (avoid redundant API calls)

### Updated Service
```
/src/services/transcriptionService.ts (MODIFY EXISTING)
```
**Changes Required**:
- Import provider interface
- Register providers (expo-speech, Whisper)
- Add provider selection logic
- Implement automatic fallback
- Add elderly-specific post-processing

### UI Components
```
/components/transcription/TranscriptionDisplay.tsx
/components/transcription/TranscriptionControls.tsx
```
**Purpose**: User interface for transcription feature

**Key Features**:
- Large, elderly-friendly buttons
- Real-time transcription display
- Confidence indicators
- Manual edit capability
- Retry button

---

## Implementation Phases

### Phase 1: MVP (Weeks 1-2)
**Goal**: Ship free tier with on-device transcription

**Tasks**:
1. Create `ITranscriptionProvider.ts` interface
2. Implement `ExpoSpeechProvider.ts`
3. Update `transcriptionService.ts` to use provider pattern
4. Build transcription UI components
5. Write unit tests (>80% coverage)
6. Test with elderly users

**Success Criteria**:
- All existing features still work
- Free users can transcribe recordings
- Test suite passes
- No regressions

**Time Estimate**: 2 weeks (1 engineer)

### Phase 2: Premium Foundation (Weeks 3-4)
**Goal**: Integrate Whisper API (not exposed to users yet)

**Tasks**:
1. Implement `WhisperAPIProvider.ts`
2. Add API key management (secure storage)
3. Implement audio compression
4. Add cost tracking telemetry
5. Write integration tests with real API

**Success Criteria**:
- Whisper integration works in development
- API costs tracked accurately
- Error handling prevents crashes
- Integration tests pass

**Time Estimate**: 2 weeks (1 engineer)

### Phase 3: Feature Flags (Week 5)
**Goal**: Add ability to enable Whisper for select users

**Tasks**:
1. Implement feature flag service
2. Add remote config (Firebase or similar)
3. Create admin dashboard for flag management
4. Add user segmentation logic

**Success Criteria**:
- Feature flags toggle without deployment
- Can enable Whisper for 5% of users
- Rollback in <5 minutes

**Time Estimate**: 1 week (1 engineer)

### Phase 4-6: Rollout (Weeks 6-11)
**Goal**: Gradually roll out Whisper to all premium users

**Schedule**:
- Week 6-7: 5% beta testing
- Week 8-9: 50% staged rollout
- Week 10-11: 100% full rollout

**Time Estimate**: 6 weeks (ongoing monitoring, no full-time dev)

---

## Code Architecture

### Provider Interface
```typescript
// /src/services/providers/ITranscriptionProvider.ts

export interface TranscriptionOptions {
  language?: 'en-US' | 'zh-CN' | 'auto';
  continuous?: boolean;
  interimResults?: boolean;
}

export interface TranscriptionResult {
  text: string;
  confidence: number;
  language: string;
  isFinal: boolean;
  timestamp: number;
  provider?: string; // Track which provider was used
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

### Service Integration
```typescript
// /src/services/transcriptionService.ts (simplified)

import { ITranscriptionProvider } from './providers/ITranscriptionProvider';
import { ExpoSpeechProvider } from './providers/ExpoSpeechProvider';
import { WhisperAPIProvider } from './providers/WhisperAPIProvider';

export class TranscriptionService {
  private providers: Map<string, ITranscriptionProvider> = new Map();
  private activeProvider: ITranscriptionProvider;

  constructor() {
    // Register providers
    this.providers.set('expo-speech', new ExpoSpeechProvider());
    // Future: this.providers.set('whisper-api', new WhisperAPIProvider());

    // Default to expo-speech (MVP)
    this.activeProvider = this.providers.get('expo-speech')!;
  }

  async selectProvider(name: string): Promise<void> {
    const provider = this.providers.get(name);
    if (!provider) {
      throw new Error(`Provider ${name} not found`);
    }

    const available = await provider.isAvailable();
    if (!available) {
      throw new Error(`Provider ${name} not available`);
    }

    this.activeProvider.cleanup();
    this.activeProvider = provider;
  }

  async autoSelectProvider(userTier: 'free' | 'premium'): Promise<void> {
    if (userTier === 'premium' && this.providers.has('whisper-api')) {
      await this.selectProvider('whisper-api');
    } else {
      await this.selectProvider('expo-speech');
    }
  }

  async startTranscription(options?: TranscriptionOptions): Promise<void> {
    await this.activeProvider.startTranscription(options || {});

    this.activeProvider.onResult((result) => {
      // Apply elderly-specific enhancements
      const enhanced = this.enhanceForElderly(result);
      this.notifyListeners('transcription:update', enhanced);
    });

    this.activeProvider.onError((error) => {
      // Handle error, possibly fallback to other provider
      this.handleProviderError(error);
    });
  }

  async stopTranscription(): Promise<TranscriptionResult> {
    return await this.activeProvider.stopTranscription();
  }

  private enhanceForElderly(result: TranscriptionResult): TranscriptionResult {
    let text = result.text;

    // Remove filler words
    text = text.replace(/\b(um+|uh+|er+)\b/gi, '');

    // Normalize spacing
    text = text.replace(/\s+/g, ' ').trim();

    // Add punctuation if high confidence
    if (result.confidence > 0.8 && result.isFinal && !/[.!?]$/.test(text)) {
      text += '.';
    }

    return { ...result, text };
  }

  private async handleProviderError(error: Error): Promise<void> {
    console.error('Transcription provider error:', error);

    // Attempt fallback to expo-speech if Whisper fails
    if (this.activeProvider.name === 'whisper-api') {
      console.log('Falling back to expo-speech');
      await this.selectProvider('expo-speech');
      // Notify user of temporary quality degradation
      this.notifyListeners('transcription:fallback', {
        message: "Using backup transcription temporarily",
      });
    }
  }
}
```

---

## Testing Requirements

### Unit Tests
**Location**: `/src/services/__tests__/`

**Coverage Required**: >80%

**Key Test Cases**:
- Provider registration and selection
- Automatic provider selection based on user tier
- Graceful fallback when provider unavailable
- Elderly text enhancements (filler removal, punctuation)
- Error handling

**Example Test**:
```typescript
describe('TranscriptionService', () => {
  it('should select expo-speech for free users', async () => {
    const service = new TranscriptionService();
    await service.autoSelectProvider('free');
    expect(service.activeProvider.name).toBe('expo-speech');
  });

  it('should remove filler words from transcription', () => {
    const service = new TranscriptionService();
    const input = { text: 'um so I think uh yeah', confidence: 0.9 };
    const result = service.enhanceForElderly(input);
    expect(result.text).toBe('so I think yeah');
  });
});
```

### Integration Tests
**Location**: `/src/components/__tests__/`

**Key Test Cases**:
- Full transcription flow (start → transcribe → stop)
- UI updates in real-time
- Manual editing of transcription
- Retry on error

**Example Test**:
```typescript
describe('EditMemoryScreen', () => {
  it('should start transcription when mic button pressed', async () => {
    const { getByLabelText } = render(<EditMemoryScreen />);
    const micButton = getByLabelText('Start transcribing');

    fireEvent.press(micButton);

    await waitFor(() => {
      expect(screen.getByText('Listening...')).toBeOnTheScreen();
    });
  });
});
```

### User Testing
**Target Users**: 5-10 elderly users (60+ years old)

**Test Scenarios**:
1. Record a short memory (1 minute)
2. Review transcription accuracy
3. Edit transcription if needed
4. Save memory

**Success Metrics**:
- 80% can complete task without help
- Transcription accuracy >85%
- User satisfaction >4.0/5.0

---

## Cost Management

### API Cost Tracking
```typescript
// Track every Whisper API call
async function trackTranscriptionCost(
  userId: string,
  duration: number,
  cost: number
): Promise<void> {
  await analytics.track({
    event: 'transcription_api_call',
    userId,
    provider: 'whisper-api',
    duration,
    cost,
    timestamp: Date.now(),
  });

  // Check if user exceeded quota
  const monthlyUsage = await getUserMonthlyUsage(userId);
  if (monthlyUsage > PREMIUM_MONTHLY_QUOTA) {
    await notifyUserQuotaExceeded(userId);
  }
}
```

### Cost Optimization
1. **Caching**: Don't re-transcribe unchanged audio (15-20% savings)
2. **Compression**: Compress audio before API upload (faster, not cheaper)
3. **Quotas**: Limit premium users to 300 minutes/month ($1.80 max cost)
4. **Batch Processing**: Queue non-urgent transcriptions for off-peak hours

---

## Elderly-Specific Optimizations

### 1. UI/UX
- Large fonts (20px minimum)
- High contrast colors
- Large touch targets (120px buttons)
- Voice feedback for status changes
- Simple, single-purpose screens

### 2. Speech Recognition
- Longer pause tolerance (2 seconds vs 1 second)
- Lower confidence threshold (0.65 vs 0.80)
- Contextual keywords (family, health, memories)
- Slower speech rate handling

### 3. Error Handling
- Elderly-friendly error messages (no technical jargon)
- Always provide alternative (manual typing)
- Auto-save to prevent data loss
- Retry button prominently displayed

**Example Error Message**:
```
BAD: "Transcription failed: ERR_NETWORK_TIMEOUT"

GOOD: "Can't connect right now. Don't worry, your recording is safe.
       You can type your memory instead, or try again later."
```

---

## Error Handling

### Graceful Degradation
Always fall back to a working state:

```typescript
try {
  // Try premium Whisper API
  await whisperProvider.transcribe(audioUri);
} catch (error) {
  console.error('Whisper failed, falling back to expo-speech');

  // Fallback to free tier
  await expoSpeechProvider.transcribe(audioUri);

  // Notify user
  showNotification({
    title: "Using Backup Transcription",
    message: "We're having trouble with premium transcription. We've switched to on-device mode temporarily.",
  });
}
```

### Common Error Scenarios

| Error | Cause | Solution | User Message |
|-------|-------|----------|--------------|
| PERMISSION_DENIED | Mic permission not granted | Request permission | "Please allow microphone access in Settings" |
| NETWORK_ERROR | No internet for Whisper | Fallback to expo-speech | "Using on-device transcription (offline mode)" |
| API_QUOTA_EXCEEDED | User hit monthly limit | Suggest upgrade or wait | "You've reached your monthly limit. Upgrade or wait until next month." |
| AUDIO_TOO_SHORT | Recording <3 seconds | Prompt to re-record | "That was too short. Please speak for at least 3 seconds." |

---

## Performance Targets

| Metric | Target | Measurement |
|--------|--------|-------------|
| **Transcription Latency** | <5 seconds | Time from stop to result |
| **Memory Usage** | <50 MB | During active transcription |
| **Battery Impact** | <5% per hour | Continuous transcription |
| **Accuracy (Free Tier)** | >85% | User edit frequency |
| **Accuracy (Premium)** | >95% | User edit frequency |
| **Error Rate** | <1% | Failed transcriptions / total |

---

## Rollback Plan

### If Something Goes Wrong
1. **Immediate**: Disable feature flag (< 1 minute)
2. **Short-term**: Reduce rollout percentage (5 minutes)
3. **Long-term**: Revert code deployment (30 minutes)

### Rollback Command
```bash
# Disable Whisper feature flag remotely
curl -X POST https://api.memoria.ai/admin/feature-flags \
  -H "Authorization: Bearer ${ADMIN_TOKEN}" \
  -d '{"flag": "whisper-transcription", "enabled": false}'
```

---

## Success Metrics

### Technical Metrics
- Transcription accuracy: >90%
- Error rate: <1%
- API cost per user: <$0.25/month
- Test coverage: >80%

### Business Metrics
- Premium conversion: 15% (by Month 12)
- User satisfaction (NPS): >60
- Premium churn: <5% monthly
- LTV / CAC ratio: >5.0

### User Experience Metrics
- Time to first transcription: <30 seconds
- Transcription edit rate: <20% (most transcriptions accurate enough)
- Feature adoption: >70% of users try transcription
- Retry rate: <10% (most transcriptions work first try)

---

## Dependencies

### NPM Packages
```json
{
  "expo-speech-recognition": "latest",
  "@react-native-async-storage/async-storage": "^2.1.2",
  "expo-secure-store": "~14.2.4"
}
```

### External APIs
- OpenAI Whisper API (Premium tier only)
- API key required (stored in Expo SecureStore)

### Platform Requirements
- iOS 13+ (for expo-speech-recognition)
- Android 6.0+ (for expo-speech-recognition)
- Internet connection (Premium tier only)

---

## Key Contacts

| Role | Responsibility | Contact |
|------|---------------|---------|
| **Technical Lead** | Architecture decisions, code review | TBD |
| **Product Manager** | Feature prioritization, user testing | TBD |
| **Designer** | UI/UX, accessibility | TBD |
| **QA Lead** | Testing strategy, test cases | TBD |

---

## Related Documents

1. **[TRANSCRIPTION_TECHNICAL_ARCHITECTURE.md](/Users/lihanzhu/Desktop/Memoria/Memoria.ai/docs/TRANSCRIPTION_TECHNICAL_ARCHITECTURE.md)**
   - Deep dive into technical design
   - Complete code examples
   - Architecture diagrams
   - ~10,000 words, read time: 45 minutes

2. **[TRANSCRIPTION_BUSINESS_MODEL.md](/Users/lihanzhu/Desktop/Memoria/Memoria.ai/docs/TRANSCRIPTION_BUSINESS_MODEL.md)**
   - Cost analysis and projections
   - Pricing strategy
   - Revenue model
   - ~6,000 words, read time: 30 minutes

3. **[TRANSCRIPTION_MIGRATION_STRATEGY.md](/Users/lihanzhu/Desktop/Memoria/Memoria.ai/docs/TRANSCRIPTION_MIGRATION_STRATEGY.md)**
   - Step-by-step migration plan
   - Rollout schedule
   - Risk mitigation
   - ~8,000 words, read time: 40 minutes

---

## Quick Start

### For Immediate Implementation (Today)

1. **Read this document** (15 minutes)
2. **Install expo-speech-recognition** (5 minutes)
   ```bash
   npx expo install expo-speech-recognition
   ```
3. **Create provider interface** (30 minutes)
   - Copy from TRANSCRIPTION_TECHNICAL_ARCHITECTURE.md
   - Save to `/src/services/providers/ITranscriptionProvider.ts`
4. **Implement ExpoSpeechProvider** (2 hours)
   - Copy template from TRANSCRIPTION_TECHNICAL_ARCHITECTURE.md
   - Test on simulator
5. **Update TranscriptionService** (1 hour)
   - Modify existing service to use provider pattern
6. **Write unit tests** (2 hours)
   - Test provider registration
   - Test provider selection logic
7. **Build UI components** (3 hours)
   - TranscriptionDisplay
   - TranscriptionControls
8. **Test with elderly users** (4 hours)
   - 5-10 user testing sessions
   - Gather feedback
9. **Ship MVP** (Phase 1 complete!)

**Total Time**: ~2 weeks (1 engineer)

---

## Questions?

If anything is unclear:
1. Check the detailed documents (linked above)
2. Ask in #memoria-dev Slack channel
3. Schedule 1:1 with Technical PM
4. Review existing `/src/services/transcriptionService.ts` code

---

**Document Version**: 1.0
**Last Updated**: 2025-10-06
**Next Review**: After Phase 1 (MVP) completion
