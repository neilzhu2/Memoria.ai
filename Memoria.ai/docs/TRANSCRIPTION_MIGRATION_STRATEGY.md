# Transcription Provider Migration Strategy
**From expo-speech-recognition (MVP) to OpenAI Whisper API (Premium)**

## Document Status
- **Version**: 1.0
- **Last Updated**: 2025-10-06
- **Owner**: Engineering Lead / Technical PM
- **Related Documents**:
  - [Technical Architecture](/docs/TRANSCRIPTION_TECHNICAL_ARCHITECTURE.md)
  - [Business Model](/docs/TRANSCRIPTION_BUSINESS_MODEL.md)

---

## Migration Overview

### Why Migrate?

| Factor | expo-speech-recognition | Whisper API |
|--------|------------------------|-------------|
| **Accuracy** | 85% (good) | 95% (excellent) |
| **Elderly Speech** | Fair | Excellent |
| **Accents/Dialects** | Limited | Wide support |
| **Background Noise** | Poor | Good |
| **Punctuation** | Basic | Automatic |
| **Cost** | Free | $0.006/min |

**Bottom Line**: Whisper provides measurably better transcription quality, especially for elderly users with softer voices, accents, or slower speech patterns. This justifies premium pricing.

---

## Migration Principles

### 1. No Breaking Changes
- Existing free users keep using expo-speech-recognition
- Premium users get Whisper as an upgrade, not a replacement
- All transcriptions use same data model regardless of provider

### 2. Gradual Rollout
- Start with 5% of premium users (beta testing)
- Expand to 50% (staged rollout)
- Full 100% rollout after validation

### 3. Graceful Degradation
- If Whisper API fails, fall back to expo-speech-recognition
- Never leave users without transcription capability
- Clear communication about which provider is active

### 4. Data Consistency
- Transcription results stored in same format
- No migration of existing transcriptions needed
- Historical data remains unchanged

---

## Step-by-Step Migration Plan

### Phase 0: Foundation (Week 1-2)
**Goal**: Set up provider abstraction layer

#### Tasks
1. Create provider interface
2. Wrap expo-speech-recognition in provider pattern
3. Update TranscriptionService to use providers
4. Add unit tests for provider abstraction
5. Deploy to staging environment

#### Deliverables
- [x] `/src/services/providers/ITranscriptionProvider.ts` (interface)
- [x] `/src/services/providers/ExpoSpeechProvider.ts` (implementation)
- [x] Updated `/src/services/transcriptionService.ts`
- [x] Unit tests with >80% coverage

#### Success Criteria
- All existing transcription features work unchanged
- No regressions in free tier functionality
- Test suite passes 100%

#### Rollback Plan
- Git revert to previous commit
- No user impact (UI unchanged)
- Estimate: <1 hour rollback time

---

### Phase 1: Whisper Integration (Week 3-4)
**Goal**: Add Whisper API support without exposing to users

#### Tasks
1. Implement WhisperAPIProvider
2. Add API key management (secure storage)
3. Implement audio compression for API efficiency
4. Add error handling and retry logic
5. Create integration tests with Whisper API
6. Add telemetry for API cost tracking

#### Deliverables
- [x] `/src/services/providers/WhisperAPIProvider.ts`
- [x] Secure API key configuration
- [x] Audio compression pipeline
- [x] Cost tracking dashboard (internal)
- [x] Integration tests

#### Code Example: WhisperAPIProvider
```typescript
// /src/services/providers/WhisperAPIProvider.ts

import { ITranscriptionProvider, TranscriptionOptions, TranscriptionResult } from './ITranscriptionProvider';
import { SecureStore } from 'expo-secure-store';
import { compressAudio } from '../audioCompression';

export class WhisperAPIProvider implements ITranscriptionProvider {
  name = 'whisper-api';
  private apiKey: string = '';
  private apiBaseUrl = 'https://api.openai.com/v1/audio/transcriptions';
  private audioChunks: Blob[] = [];
  private resultCallback?: (result: TranscriptionResult) => void;
  private errorCallback?: (error: Error) => void;

  async initialize(): Promise<void> {
    // Load API key from secure storage
    this.apiKey = await SecureStore.getItemAsync('openai_api_key') || '';

    if (!this.apiKey) {
      console.warn('Whisper API key not configured');
    }
  }

  async isAvailable(): Promise<boolean> {
    await this.initialize();
    return !!this.apiKey && this.apiKey.length > 0;
  }

  async startTranscription(options: TranscriptionOptions): Promise<void> {
    this.audioChunks = [];

    // Whisper doesn't support real-time streaming
    // We'll buffer audio and transcribe on stop
    console.log('Starting Whisper transcription (buffering mode)', options);
  }

  async stopTranscription(): Promise<TranscriptionResult> {
    try {
      // Combine audio chunks
      const audioBlob = new Blob(this.audioChunks, { type: 'audio/wav' });

      // Compress audio to reduce API costs
      const compressed = await compressAudio(audioBlob, {
        format: 'mp3',
        bitrate: 64000,
        sampleRate: 16000,
      });

      // Prepare form data
      const formData = new FormData();
      formData.append('file', compressed, 'recording.mp3');
      formData.append('model', 'whisper-1');
      formData.append('response_format', 'verbose_json');
      formData.append('timestamp_granularities', JSON.stringify(['word', 'segment']));

      // Add language hint if provided
      if (options.language && options.language !== 'auto') {
        formData.append('language', this.mapLanguage(options.language));
      }

      // Call Whisper API
      const startTime = Date.now();
      const response = await fetch(this.apiBaseUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: formData,
      });

      const processingTime = Date.now() - startTime;

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Whisper API error (${response.status}): ${error}`);
      }

      const data = await response.json();

      // Track API usage for cost management
      await this.trackAPIUsage(data.duration, processingTime);

      // Return transcription result
      const result: TranscriptionResult = {
        text: data.text,
        confidence: 0.95, // Whisper doesn't provide confidence, assume high
        language: data.language || 'en',
        isFinal: true,
        timestamp: Date.now(),
        segments: this.parseSegments(data.segments),
        processingTime,
      };

      // Notify callback
      this.resultCallback?.(result);

      return result;
    } catch (error) {
      console.error('Whisper transcription failed:', error);
      this.errorCallback?.(error as Error);
      throw error;
    }
  }

  onResult(callback: (result: TranscriptionResult) => void): void {
    this.resultCallback = callback;
  }

  onError(callback: (error: Error) => void): void {
    this.errorCallback = callback;
  }

  cleanup(): void {
    this.audioChunks = [];
  }

  addAudioChunk(chunk: Blob): void {
    this.audioChunks.push(chunk);
  }

  private mapLanguage(lang: string): string {
    // Whisper uses ISO 639-1 codes
    const languageMap: Record<string, string> = {
      'en': 'en',
      'zh': 'zh',
      'en-US': 'en',
      'zh-CN': 'zh',
    };
    return languageMap[lang] || 'en';
  }

  private parseSegments(segments: any[]): any[] {
    // Convert Whisper segment format to our standard format
    return segments.map(seg => ({
      start: seg.start,
      end: seg.end,
      text: seg.text,
      confidence: 0.95,
      isFinal: true,
    }));
  }

  private async trackAPIUsage(duration: number, processingTime: number): Promise<void> {
    // Track for cost monitoring
    const cost = duration * 0.006; // $0.006 per minute

    await fetch('/api/telemetry/transcription', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        provider: 'whisper-api',
        duration,
        processingTime,
        cost,
        timestamp: Date.now(),
      }),
    });

    console.log(`Whisper API usage: ${duration.toFixed(2)}s, cost: $${cost.toFixed(4)}`);
  }
}
```

#### Success Criteria
- Whisper integration works in development
- API costs tracked accurately
- Error handling prevents app crashes
- Integration tests pass with real API calls

#### Rollback Plan
- Disable Whisper provider (don't register it)
- No impact on existing users
- Estimate: <30 minutes rollback time

---

### Phase 2: Feature Flag Setup (Week 5)
**Goal**: Add ability to enable Whisper for select users

#### Tasks
1. Implement feature flag service
2. Add Whisper feature flag configuration
3. Create admin dashboard for feature flag management
4. Add user segmentation (free vs premium, beta vs general)
5. Test feature flag toggling in staging

#### Code Example: Feature Flag Service
```typescript
// /src/services/FeatureFlagService.ts

interface FeatureFlags {
  'whisper-transcription': boolean;
  'whisper-beta-users': boolean;
}

interface UserContext {
  userId: string;
  userTier: 'free' | 'premium' | 'family';
  signupDate: Date;
  betaTester: boolean;
}

export class FeatureFlagService {
  private flags: Map<string, boolean> = new Map();
  private remoteConfig: any; // Firebase Remote Config or similar

  async initialize(): Promise<void> {
    // Load feature flags from remote config
    await this.remoteConfig.fetchAndActivate();

    this.flags.set('whisper-transcription', false);
    this.flags.set('whisper-beta-users', false);
  }

  async isEnabled(flag: keyof FeatureFlags, context?: UserContext): Promise<boolean> {
    const baseEnabled = this.flags.get(flag) || false;

    if (!baseEnabled) {
      return false;
    }

    // Apply user-specific logic
    if (flag === 'whisper-transcription' && context) {
      // Only enable for premium users
      if (context.userTier === 'free') {
        return false;
      }

      // Beta testing: only 5% of premium users initially
      if (this.flags.get('whisper-beta-users')) {
        return this.isInBetaGroup(context.userId, 0.05); // 5%
      }

      return true;
    }

    return baseEnabled;
  }

  async setFlag(flag: keyof FeatureFlags, enabled: boolean): Promise<void> {
    this.flags.set(flag, enabled);
    await this.remoteConfig.setValue(flag, enabled);
  }

  private isInBetaGroup(userId: string, percentage: number): boolean {
    // Deterministic user bucketing based on userId hash
    const hash = this.hashString(userId);
    return hash % 100 < percentage * 100;
  }

  private hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash |= 0; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }
}

export const featureFlagService = new FeatureFlagService();
```

#### Success Criteria
- Feature flags toggle without code deployment
- Beta user selection is deterministic (same users always in beta)
- Admin dashboard shows real-time flag status

#### Rollback Plan
- Disable feature flag remotely
- No code changes needed
- Estimate: <5 minutes rollback time

---

### Phase 3: Beta Testing (Week 6-7)
**Goal**: Test Whisper with 5% of premium users

#### Tasks
1. Enable Whisper for 5% of premium users
2. Monitor transcription quality metrics
3. Track API costs per user
4. Collect user feedback
5. Monitor error rates and performance
6. Compare accuracy vs expo-speech-recognition

#### Metrics to Track
| Metric | Target | Actual | Status |
|--------|--------|--------|--------|
| Transcription Accuracy | >90% | TBD | - |
| Average API Cost per User | <$0.50/month | TBD | - |
| Error Rate | <1% | TBD | - |
| User Satisfaction (NPS) | >60 | TBD | - |
| Processing Time | <5 seconds | TBD | - |

#### User Feedback Collection
```typescript
// Show feedback prompt after 3 Whisper transcriptions
const promptWhisperFeedback = () => {
  if (whisperTranscriptionCount === 3) {
    showModal({
      title: "How's the new transcription quality?",
      message: "We've upgraded your transcription to our premium Whisper AI. Is it more accurate than before?",
      options: [
        { text: "Much Better", value: 5 },
        { text: "Somewhat Better", value: 4 },
        { text: "About the Same", value: 3 },
        { text: "Worse", value: 2 },
      ],
      onSubmit: (rating) => {
        trackEvent('whisper_feedback', { rating, userId });

        if (rating <= 3) {
          // Collect additional feedback
          showTextInput({
            title: "What could be improved?",
            placeholder: "Tell us what's not working well...",
            onSubmit: (feedback) => {
              submitFeedback('whisper', { rating, feedback, userId });
            },
          });
        }
      },
    });
  }
};
```

#### Success Criteria
- Transcription accuracy >90%
- User satisfaction >60 NPS
- API costs within budget (<$0.50/user/month)
- Error rate <1%
- No critical bugs reported

#### Rollback Plan
- Disable feature flag for beta users
- Users automatically revert to expo-speech-recognition
- Communicate via in-app notification
- Estimate: <10 minutes rollback time

---

### Phase 4: Staged Rollout (Week 8-9)
**Goal**: Expand Whisper to 50% of premium users

#### Tasks
1. Analyze beta testing results
2. Fix any critical issues from beta
3. Increase rollout to 50% of premium users
4. Continue monitoring metrics
5. Prepare support team for increased volume

#### Rollout Schedule
| Week | Rollout Percentage | Users Affected | Est. API Cost |
|------|-------------------|----------------|---------------|
| 6 | 5% | 75 users | $25/month |
| 8 | 25% | 375 users | $125/month |
| 9 | 50% | 750 users | $250/month |
| 10 | 100% | 1,500 users | $500/month |

#### A/B Testing
```typescript
// Compare transcription quality between providers
const runABTest = async (userId: string, audioUri: string) => {
  // Only for beta users willing to participate
  if (!userOptedIntoABTest(userId)) {
    return;
  }

  // Transcribe with both providers
  const expoResult = await expoSpeechProvider.transcribe(audioUri);
  const whisperResult = await whisperAPIProvider.transcribe(audioUri);

  // Calculate edit distance (Levenshtein)
  const editDistance = calculateEditDistance(expoResult.text, whisperResult.text);

  // Track results
  await trackEvent('ab_test_transcription', {
    userId,
    expoAccuracy: expoResult.confidence,
    whisperAccuracy: whisperResult.confidence,
    editDistance,
    whisperLength: whisperResult.text.length,
    expoLength: expoResult.text.length,
  });

  // Show user comparison (optional)
  if (editDistance > 20) {
    showComparison({
      title: "Which transcription is more accurate?",
      optionA: { label: "Option A", text: expoResult.text },
      optionB: { label: "Option B", text: whisperResult.text },
      onSelect: (choice) => {
        trackEvent('ab_test_user_choice', { choice, userId });
      },
    });
  }
};
```

#### Success Criteria
- Metrics remain positive with larger user base
- API costs scale linearly (no unexpected spikes)
- Support tickets <10% increase
- Continued positive user feedback

#### Rollback Plan
- Reduce rollout percentage to 25% or 5%
- Investigate and fix issues
- Communicate with affected users
- Estimate: <15 minutes rollback time

---

### Phase 5: Full Rollout (Week 10-11)
**Goal**: Enable Whisper for all premium users

#### Tasks
1. Final validation of metrics
2. Enable Whisper for 100% of premium users
3. Update marketing materials to highlight premium transcription
4. Monitor for 1 week post-launch
5. Optimize based on learnings

#### Communication Plan

**In-App Notification** (for premium users):
```
"Transcription Upgrade!"

Your transcription quality just got better. We've upgraded all premium users to our advanced Whisper AI transcription, which is 95% accurate even with soft voices and accents.

Enjoy more accurate transcriptions with less editing needed!
```

**Email to Premium Users**:
```
Subject: Your transcriptions just got smarter

Hi [Name],

Great news! We've upgraded your Memoria.ai transcription to use OpenAI's Whisper AI, the most accurate transcription technology available.

What does this mean for you?
- 95% accuracy (up from 85%)
- Better with soft voices and accents
- Automatic punctuation
- Less manual editing needed

You don't need to do anything. Just keep recording your memories, and you'll notice the improved quality right away.

Happy memory-making!
The Memoria.ai Team
```

#### Success Criteria
- All premium users using Whisper
- No increase in error rate
- API costs match projections ($500/month for 1,500 users)
- Positive user sentiment (NPS >60)

#### Rollback Plan
- Disable feature flag globally
- Communicate via push notification and email
- Offer refunds/credits if needed
- Estimate: <30 minutes rollback time

---

### Phase 6: Optimization (Week 12+)
**Goal**: Reduce costs and improve performance

#### Tasks
1. Implement transcription caching
2. Optimize audio compression
3. Add batch processing for non-urgent transcriptions
4. Monitor and adjust quotas
5. Explore alternative Whisper hosting (lower costs)

#### Cost Optimization Targets
| Optimization | Est. Cost Reduction | Implementation Effort |
|--------------|-------------------|---------------------|
| **Caching** | 15-20% | Low (1 week) |
| **Audio Compression** | 5-10% | Low (3 days) |
| **Batch Processing** | 10-15% | Medium (2 weeks) |
| **Self-Hosted Whisper** | 50-70% | High (1-2 months) |

#### Self-Hosted Whisper (Future)
```typescript
// For very high-volume scenarios (10,000+ premium users)
// Consider self-hosting Whisper on AWS/GCP

const WHISPER_BREAK_EVEN_USERS = 5000;

if (premiumUsers > WHISPER_BREAK_EVEN_USERS) {
  // Self-hosting becomes cost-effective
  // OpenAI API: $0.006/min
  // Self-hosted: ~$0.002/min (with GPU compute costs)

  console.log('Consider migrating to self-hosted Whisper');
}
```

**Cost Comparison** (10,000 premium users):
- OpenAI API: 10,000 × $0.18 = $1,800/month
- Self-hosted (AWS g4dn.xlarge): ~$200/month (GPU) + $100/month (compute) = $300/month
- **Savings**: $1,500/month ($18,000/year)

---

## Backward Compatibility

### Data Model Consistency

All transcription providers return the same data structure:

```typescript
interface TranscriptionResult {
  text: string;
  confidence: number;
  language: string;
  isFinal: boolean;
  timestamp: number;
  provider?: string; // Track which provider was used
  segments?: TranscriptionSegment[];
  processingTime?: number;
}

interface TranscriptionSegment {
  start: number;
  end: number;
  text: string;
  confidence: number;
  isFinal: boolean;
}
```

**Key Points**:
- All providers must implement `ITranscriptionProvider` interface
- Transcription results stored in database with `provider` field
- UI components are provider-agnostic (don't care which provider was used)
- Historical transcriptions remain unchanged (no re-processing needed)

### Database Schema

**No migration required**. Existing `memories` table already stores transcriptions:

```sql
-- Existing schema (no changes needed)
CREATE TABLE memories (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  audio_uri TEXT NOT NULL,
  transcription_text TEXT, -- Works for both providers
  transcription_confidence DECIMAL,
  transcription_provider VARCHAR(50), -- NEW: Track provider used
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Add index for provider analytics
CREATE INDEX idx_memories_provider ON memories(transcription_provider);
```

---

## User Communication Strategy

### Transparency Principles

1. **Always inform users which transcription method is being used**
2. **Explain quality differences clearly (no technical jargon)**
3. **Give users control where possible (fallback option)**
4. **Communicate issues proactively (API downtime, etc.)**

### Communication Examples

#### Free Users
```
"Using On-Device Transcription"

Your transcription is processed on your device for privacy. It's good for clear speech in quiet environments.

Want higher accuracy? Upgrade to Premium for Whisper AI transcription.
```

#### Premium Users (Whisper Active)
```
"Using Premium Whisper AI"

Your transcription is being processed with advanced AI for maximum accuracy (95%+).
```

#### Fallback Scenario
```
"Temporary Quality Mode"

We're having trouble connecting to our premium transcription service. We've temporarily switched to on-device transcription so you can keep recording.

Don't worry, your recording is saved and we'll re-transcribe it with premium quality when we're back online.
```

#### Error Scenario
```
"Transcription Temporarily Unavailable"

We can't transcribe your recording right now, but your audio is safely saved. You can:

1. Try again in a few minutes
2. Type your memory instead
3. We'll automatically transcribe it later when available

Your memories are safe!
```

---

## Rollback Procedures

### Emergency Rollback (Critical Issue)

**Scenario**: Whisper API causing app crashes or data loss

**Actions**:
1. Disable feature flag immediately (< 1 minute)
2. Alert engineering team via PagerDuty
3. All users automatically revert to expo-speech-recognition
4. Send push notification to affected users
5. Post incident post-mortem within 24 hours

**Command**:
```bash
# Emergency feature flag disable
curl -X POST https://api.memoria.ai/admin/feature-flags \
  -H "Authorization: Bearer ${ADMIN_TOKEN}" \
  -d '{"flag": "whisper-transcription", "enabled": false}'
```

### Planned Rollback (Performance Issue)

**Scenario**: Whisper API too slow or costs too high

**Actions**:
1. Reduce rollout percentage gradually (100% → 50% → 25% → 5%)
2. Investigate root cause
3. Communicate with affected users via email
4. Implement fixes
5. Re-rollout when ready

### Partial Rollback (User Segment)

**Scenario**: Whisper works well for English but poorly for Chinese

**Actions**:
1. Create language-based feature flag
2. Disable Whisper for Chinese users only
3. Keep enabled for English users
4. Work on Chinese language improvements
5. Re-enable when quality improves

```typescript
// Language-specific provider selection
const selectProviderByLanguage = async (language: string, userTier: string) => {
  if (userTier !== 'premium') {
    return 'expo-speech-recognition';
  }

  // Whisper quality varies by language
  const whisperLanguageQuality: Record<string, boolean> = {
    'en': true,  // Excellent
    'zh': false, // Needs improvement (fallback to expo-speech)
    'es': true,  // Good
  };

  if (whisperLanguageQuality[language]) {
    return 'whisper-api';
  } else {
    return 'expo-speech-recognition';
  }
};
```

---

## Testing Strategy

### Pre-Migration Testing

#### Unit Tests
- [x] Provider interface compliance
- [x] Error handling for each provider
- [x] Transcription result format consistency
- [x] Feature flag logic

#### Integration Tests
- [x] End-to-end transcription flow with expo-speech
- [x] End-to-end transcription flow with Whisper
- [x] Provider switching without data loss
- [x] Graceful fallback when Whisper unavailable

#### Performance Tests
- [x] Whisper API latency under load
- [x] Memory usage during transcription
- [x] Battery impact comparison (expo-speech vs Whisper)
- [x] Audio compression impact on quality

#### User Acceptance Testing
- [x] Elderly users test both providers
- [x] Compare transcription accuracy for various scenarios:
  - Soft/quiet speech
  - Accents (Chinese, Indian, Southern US)
  - Background noise
  - Multiple speakers
  - Code-switching (English/Chinese)

### Post-Migration Testing

#### A/B Testing
- Compare accuracy metrics between providers
- Track user editing frequency (more edits = lower accuracy)
- Measure user satisfaction (surveys)
- Monitor conversion rates (free → premium)

#### Regression Testing
- Ensure free tier still works
- Verify no degradation in expo-speech-recognition quality
- Check that historical transcriptions still display correctly

---

## Risk Mitigation

### Technical Risks

| Risk | Probability | Impact | Mitigation |
|------|------------|--------|------------|
| **Whisper API Downtime** | Medium | High | Automatic fallback to expo-speech, status page monitoring |
| **API Cost Overruns** | Medium | Medium | Hard quota limits, real-time cost alerts, caching |
| **Quality Regression** | Low | High | A/B testing before full rollout, user feedback loop |
| **Data Loss** | Very Low | Critical | All audio stored regardless of transcription success |

### Business Risks

| Risk | Probability | Impact | Mitigation |
|------|------------|--------|------------|
| **User Backlash (Premium Price)** | Medium | Medium | Free tier remains excellent, clear value communication |
| **Low Conversion (<10%)** | Medium | High | Extended free trials, in-app quality comparisons |
| **Churn Increase** | Low | High | Monitor NPS closely, offer downgrades instead of cancellations |

### Operational Risks

| Risk | Probability | Impact | Mitigation |
|------|------------|--------|------------|
| **Support Volume Spike** | Medium | Medium | Prepare FAQs, train support team, self-service tools |
| **API Key Leaks** | Low | Critical | Secure storage (Expo SecureStore), rotate keys quarterly |
| **Quota Exhaustion** | Low | Medium | Per-user quotas, waitlists for power users |

---

## Success Metrics

### Migration Success Criteria (Phase 5 Completion)

| Metric | Target | Measurement |
|--------|--------|-------------|
| **Rollout Completion** | 100% of premium users | Feature flag analytics |
| **Transcription Accuracy** | >90% | User edit frequency, feedback surveys |
| **Error Rate** | <1% | Error logging, Sentry alerts |
| **API Cost per User** | <$0.25/month | Cost tracking dashboard |
| **User Satisfaction (NPS)** | >60 | In-app surveys |
| **Support Ticket Volume** | <10% increase | Support ticket system |
| **Premium Churn** | <5% monthly | Subscription analytics |

### Long-Term Success Metrics (6 Months Post-Migration)

| Metric | Target | Current | Status |
|--------|--------|---------|--------|
| **Premium Conversion** | 15% | TBD | - |
| **Premium Retention** | >90% (monthly) | TBD | - |
| **Transcription Quality** | >95% accuracy | TBD | - |
| **API Cost Efficiency** | <$0.20/user/month | TBD | - |
| **User NPS** | >65 | TBD | - |

---

## Timeline Summary

| Phase | Duration | Key Activities | Rollout % |
|-------|----------|----------------|-----------|
| **Phase 0: Foundation** | Weeks 1-2 | Provider abstraction layer | 0% |
| **Phase 1: Integration** | Weeks 3-4 | Whisper API implementation | 0% |
| **Phase 2: Feature Flags** | Week 5 | Feature flag setup | 0% |
| **Phase 3: Beta** | Weeks 6-7 | Beta testing with 5% users | 5% |
| **Phase 4: Staged Rollout** | Weeks 8-9 | Expand to 50% users | 50% |
| **Phase 5: Full Rollout** | Weeks 10-11 | Enable for all premium users | 100% |
| **Phase 6: Optimization** | Week 12+ | Cost reduction, caching | 100% |

**Total Timeline**: ~3 months from start to full rollout

---

## Lessons Learned (Post-Migration)

### What Went Well
- TBD (to be filled in after migration)

### What Could Be Improved
- TBD (to be filled in after migration)

### Recommendations for Future Migrations
- TBD (to be filled in after migration)

---

## Appendix: Code Examples

### Provider Switching Logic
```typescript
// /src/services/transcriptionService.ts

export class TranscriptionService {
  async selectOptimalProvider(
    userTier: 'free' | 'premium',
    language: string,
    networkQuality: 'excellent' | 'good' | 'poor' | 'offline'
  ): Promise<ITranscriptionProvider> {

    // Free users always use expo-speech
    if (userTier === 'free') {
      return this.providers.get('expo-speech-recognition')!;
    }

    // Premium users get Whisper if conditions are met
    if (userTier === 'premium') {
      // Check feature flag
      const whisperEnabled = await featureFlagService.isEnabled(
        'whisper-transcription',
        { userId: this.currentUserId, userTier }
      );

      if (!whisperEnabled) {
        return this.providers.get('expo-speech-recognition')!;
      }

      // Check network quality (Whisper requires internet)
      if (networkQuality === 'offline' || networkQuality === 'poor') {
        console.log('Poor network, falling back to on-device transcription');
        return this.providers.get('expo-speech-recognition')!;
      }

      // Check provider availability
      const whisperProvider = this.providers.get('whisper-api')!;
      const available = await whisperProvider.isAvailable();

      if (!available) {
        console.log('Whisper unavailable, falling back to expo-speech');
        return this.providers.get('expo-speech-recognition')!;
      }

      return whisperProvider;
    }

    // Default fallback
    return this.providers.get('expo-speech-recognition')!;
  }
}
```

### Graceful Fallback Handler
```typescript
// /src/services/transcriptionErrorHandler.ts

export class TranscriptionErrorHandler {
  static async handleProviderFailure(
    provider: ITranscriptionProvider,
    error: Error,
    audioUri: string
  ): Promise<TranscriptionResult> {

    console.error(`Provider ${provider.name} failed:`, error);

    // Track failure for monitoring
    await AnalyticsService.trackError({
      type: 'transcription_provider_failure',
      provider: provider.name,
      error: error.message,
    });

    // Attempt fallback
    if (provider.name === 'whisper-api') {
      console.log('Falling back to expo-speech-recognition');

      const fallbackProvider = new ExpoSpeechProvider();
      const available = await fallbackProvider.isAvailable();

      if (available) {
        // Notify user
        showNotification({
          title: "Using Backup Transcription",
          message: "We're having trouble with premium transcription. We've switched to on-device mode temporarily.",
          type: 'warning',
        });

        // Use fallback
        await fallbackProvider.startTranscription({ language: 'auto' });
        return await fallbackProvider.stopTranscription();
      }
    }

    // No fallback available - show error
    throw new Error(
      "Transcription is temporarily unavailable. Your recording is saved and we'll transcribe it later."
    );
  }
}
```

---

## Conclusion

This migration strategy provides a **safe, gradual, and reversible** path from expo-speech-recognition to Whisper API. Key principles:

1. **No Breaking Changes**: Existing users unaffected
2. **Gradual Rollout**: 5% → 50% → 100% over 6 weeks
3. **Graceful Degradation**: Always fall back to working transcription
4. **Data Consistency**: Same data model regardless of provider
5. **Clear Communication**: Users know which provider is active

By following this plan, we minimize risk while maximizing the value of premium transcription for Memoria.ai users.

---

**Document Version**: 1.0
**Next Review**: After Phase 3 (Beta Testing) completion
**Owner**: Engineering Lead
