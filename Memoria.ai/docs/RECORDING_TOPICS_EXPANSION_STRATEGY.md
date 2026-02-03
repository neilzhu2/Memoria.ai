# Recording Topics/Prompts Expansion Strategy

**Document Owner**: Technical Product Manager
**Last Updated**: December 2, 2025
**Status**: Strategic Recommendation
**Decision Required By**: Pre-Apple Approval (Dec 2025)

---

## Executive Summary

**Current State**: 8 hardcoded topics in home screen
**User Vision**: Thousands of topics + AI personalization + user preferences
**Recommendation**: **Hybrid Phased Approach** - Start with expanded static library (Phase 1), add AI personalization post-launch (Phase 2)
**Timeline**: Phase 1 before launch (1 week), Phase 2 post-validation (Q1 2026)
**Cost**: Phase 1 = $0, Phase 2 = ~$50-150/month (AI API costs)

---

## 1. Product Strategy: MVP vs Long-Term

### ✅ Recommended Approach: **Hybrid Phased Strategy**

**Phase 1 (Pre-Launch)**: Expanded Static Library (200-500 topics)
**Phase 2 (Post-Launch)**: AI Personalization Layer
**Phase 3 (Future)**: User Preference System

### Why This Approach?

| Criteria | Static Topics Only | AI Only | Hybrid Phased |
|----------|-------------------|---------|---------------|
| Pre-launch cost | $0 | $50-150/mo | $0 |
| Works offline | ✅ Yes | ❌ No | ✅ Yes (Phase 1) |
| Personalized | ❌ No | ✅ Yes | ⚡ Later |
| Elderly-friendly | ✅ Simple | ⚠️ Complex | ✅ Progressive |
| App Store safe | ✅ Yes | ⚠️ Review risk | ✅ Yes |
| Scalable | ⚠️ Limited | ✅ Yes | ✅ Yes |

**Decision**: Start simple (static), validate with users, add AI when we have budget/data.

---

## 2. Phased Roadmap

### 🎯 Phase 1: Expanded Static Library (Pre-Launch - 1 Week)

**Timeline**: Before Apple Approval (Dec 2025)
**Effort**: 6-8 hours
**Cost**: $0

#### What to Build

1. **Create Topic Library** (4 hours)
   - Expand from 8 to 200-500 curated topics
   - Organize into 10-15 categories
   - Store in Supabase `recording_topics` table

2. **Add Category Filtering** (2 hours)
   - Filter chips on home screen (Family, Career, Childhood, etc.)
   - Swipe to browse within category
   - Track category preferences in analytics

3. **Smart Topic Rotation** (1 hour)
   - Daily topic algorithm (not random - smart rotation)
   - Prioritize unrecorded topics
   - Mix popular + niche topics

4. **Database Schema** (1 hour)
```sql
CREATE TABLE recording_topics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL, -- 'family', 'career', 'childhood', 'travel', etc.
  difficulty TEXT DEFAULT 'easy', -- 'easy', 'medium', 'deep'
  popularity_score INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for category filtering
CREATE INDEX idx_topics_category ON recording_topics(category);
CREATE INDEX idx_topics_popularity ON recording_topics(popularity_score DESC);
```

#### Success Metrics (Phase 1)
- Users swipe through 5+ topics per session (engagement)
- 30%+ of users record from suggested topic (conversion)
- Users explore 2+ categories (discovery)

---

### 🚀 Phase 2: AI Personalization (Post-Launch - Q1 2026)

**Timeline**: After 100+ users, 40%+ retention validated
**Effort**: 2-3 weeks
**Cost**: ~$50-150/month (API calls)

#### What to Build

1. **AI Follow-Up Generator** (1 week)
   - Analyze past recordings (transcriptions)
   - Generate 3-5 personalized follow-up questions
   - Example: "You mentioned your first job - tell me about your first boss"
   - Use GPT-4o-mini (cheap) via OpenAI API

2. **Memory Context Extraction** (3 days)
   - Parse transcriptions for entities (people, places, events)
   - Build user memory graph in Supabase
   - Track recording themes over time

3. **Smart Topic Recommendations** (3 days)
   - Hybrid algorithm: 60% static library + 40% AI-generated
   - Prioritize topics user hasn't covered
   - Seasonal/occasion-based suggestions (birthdays, holidays)

#### AI Architecture (Phase 2)

```typescript
// services/aiTopicGenerator.ts
interface AITopicService {
  generateFollowUps(memoryId: string): Promise<Topic[]>;
  analyzeRecordingThemes(userId: string): Promise<ThemeAnalysis>;
  suggestNextTopics(userId: string, count: number): Promise<Topic[]>;
}

// Cost-optimized approach
const API_COSTS = {
  gpt4oMini: '$0.15/1M input tokens, $0.60/1M output tokens',
  averageCallCost: '$0.002-0.005', // 2-5 topics per call
  monthlyEstimate: '100 users × 10 calls/mo = $20-50/mo'
};
```

#### Free-Tier AI Alternatives
- **Google Gemini Flash 2.0**: 1M tokens/day free (enough for 1000+ daily calls)
- **Anthropic Claude Haiku**: $0.25/1M tokens (5x cheaper than GPT-4)
- **Ollama + Llama 3.2**: Fully free, self-hosted (requires server)

**Recommendation for Solo Founder**: Start with Gemini Flash free tier, migrate to paid when validated.

---

### 📊 Phase 3: User Preference System (Q2 2026)

**Timeline**: After AI validation (500+ users)
**Effort**: 1-2 weeks
**Cost**: Included in AI costs

#### What to Build

1. **Topic Preference Survey** (3 days)
   - Onboarding: "What topics interest you?" (multi-select)
   - 15 categories: Family, Career, Travel, War/Service, Immigration, Love, etc.
   - Save preferences in `user_profiles.settings.topic_preferences`

2. **Personalized Topic Feed** (4 days)
   - Weight topics by user preferences
   - ML-style collaborative filtering (users like you also recorded...)
   - A/B test: personalized vs random

3. **Topic Request Feature** (3 days)
   - Family members can request topics (already in DB schema!)
   - Show requested topics at top of feed
   - Notification: "Your grandson requested a memory about..."

---

## 3. Prioritization Matrix

### What to Build Now (Phase 1 - Pre-Launch)

| Feature | Impact | Effort | Priority | Build Now? |
|---------|--------|--------|----------|------------|
| 200-500 curated topics | High | 4h | P0 | ✅ YES |
| Category filtering | Medium | 2h | P1 | ✅ YES |
| Smart rotation algorithm | Medium | 1h | P1 | ✅ YES |
| Topic database schema | High | 1h | P0 | ✅ YES |

**Total Phase 1 Effort**: 6-8 hours
**Phase 1 Value**: Addresses 80% of user need ("I want more topics") at zero cost

### What to Build Later (Phase 2-3 - Post-Launch)

| Feature | Impact | Effort | When? |
|---------|--------|--------|-------|
| AI follow-up questions | High | 1wk | Q1 2026 (100+ users) |
| Memory graph analysis | Medium | 3d | Q1 2026 |
| User preference survey | Medium | 3d | Q2 2026 (500+ users) |
| Family topic requests | Medium | 3d | Q2 2026 (family sharing live) |

---

## 4. User Segmentation

### Should Topics Differ by User Type?

**Current Users**:
- Elderly users (65+): 90% of target audience
- Family members (25-50): 10% (will grow in Phase 5 - Family Sharing)

#### Recommendation: **One Feed, Smart Filtering**

| User Segment | Topic Strategy | Rationale |
|--------------|----------------|-----------|
| Elderly users | Show all categories, surface "easy" difficulty first | Primary users, need gentle onboarding |
| Family members | Same feed, but prioritize "family questions" category | Will use "request topics" feature more |
| New users | Onboarding survey → personalize from day 1 | Improve activation rate |

**Do NOT build separate topic pools** - Adds complexity, breaks discovery.

---

## 5. Scope Definition: How Many Topics?

### ✅ Recommended Launch Target: **250 Topics**

| Tier | Topic Count | Rationale | Status |
|------|-------------|-----------|--------|
| MVP (Current) | 8 topics | Too few, users see repeats quickly | ✅ Live |
| **Launch Target** | 250 topics | Sweet spot: variety + curation quality | 🎯 Build This |
| Ambitious | 500 topics | Diminishing returns, curation burden | ⏳ Post-launch |
| "Thousands" | 2000+ topics | AI-generated only, quality risk | ❌ Not needed |

### Topic Breakdown (250 Total)

| Category | Count | Examples |
|----------|-------|----------|
| Childhood & Family | 40 | "Your childhood home", "Favorite family meal" |
| Career & Work | 35 | "First job", "Proudest work achievement" |
| Love & Relationships | 30 | "How you met your spouse", "First date" |
| Immigration & Heritage | 25 | Chinese elderly focus: "Coming to America", "Hometown in China" |
| War & Service | 20 | "Military service", "Living through WWII" |
| Travel & Adventure | 20 | "Most memorable trip", "Place you'd revisit" |
| Life Lessons | 20 | "Best advice received", "If you could do it again..." |
| Traditions & Culture | 20 | "Family traditions", "Cultural celebrations" |
| Challenges & Triumphs | 15 | "Hardest time of your life", "How you overcame..." |
| Daily Life & Hobbies | 15 | "Favorite hobby", "Typical day growing up" |
| Miscellaneous | 10 | Seasonal, niche topics |

**Curation Strategy**:
- Write 50 yourself (1 day)
- Adapt 100 from memoir writing guides (3 hours)
- Generate 100 with AI + human review (2 hours)

---

## 6. Feature Sequencing

### When Does This Fit in Roadmap?

**Current Roadmap** (from `/ROADMAP.md`):
- ✅ Phase 0: MVP Complete (Oct 2025)
- 🔄 Phase 1: Clean Schema & Core Features (Nov 2025 - Current)
- ⏳ Phase 2: UI Polish & Elderly Optimization (Late Nov 2025)
- ⏳ Phase 3: Transcription & Dev Build (Dec 2025)
- ⏳ Phase 4: Beta Release (Jan 2026)

### ✅ Recommendation: **Insert as Phase 1.5 (This Week)**

**Why Now**:
- Takes only 6-8 hours (doesn't delay UI polish)
- High user value ("more topics" is #1 request assumption)
- Sets up infrastructure for Phase 2 AI features
- Improves App Store screenshots (shows variety)

**Updated Roadmap**:
```
Phase 1: Clean Schema ← YOU ARE HERE
  ├─ [x] Profile image upload (Nov 23)
  ├─ [x] Feedback system (Nov 27)
  ├─ [ ] RLS audit (Nov 29) ← NEXT
  └─ [ ] 📍 TOPICS EXPANSION (Dec 2) ← INSERT HERE (1 week)

Phase 2: UI Polish (Late Nov → Early Dec)
  └─ [After topics expansion]

Phase 3: Transcription & Dev Build (Dec 2025)
  └─ [AI topic generation depends on transcription API]
```

**Sequencing Logic**:
1. Build Phase 1 topics (static library) → Before Apple submission
2. Wait for Apple approval
3. Build Phase 2 (AI) → After launch, when we have transcription data

---

## 7. Success Metrics

### How to Measure If Topics Feature Works

#### Phase 1 Metrics (Static Library)

| Metric | Target | How to Measure | Good/Bad Threshold |
|--------|--------|----------------|-------------------|
| Topic engagement rate | 40%+ | % sessions where user swipes 3+ topics | Good: >40%, Bad: <20% |
| Recording from topic | 30%+ | % recordings that used suggested topic | Good: >30%, Bad: <15% |
| Category exploration | 2+ categories | Avg categories viewed per session | Good: 2+, Bad: 1 |
| Topic variety used | 50+ unique | # unique topics recorded across all users | Good: >50, Bad: <20 |

**Analytics Implementation**:
```typescript
// Add to /services/analytics.ts
Analytics.track('topic_viewed', {
  topic_id: string,
  category: string,
  source: 'swipe' | 'category_filter'
});

Analytics.track('recording_from_topic', {
  topic_id: string,
  category: string,
  user_modified_topic: boolean // Did they edit the title?
});
```

#### Phase 2 Metrics (AI Personalization)

| Metric | Target | Measurement |
|--------|--------|-------------|
| AI topic click rate | 50%+ | % of AI topics clicked vs static |
| Follow-up recording rate | 40%+ | % of AI follow-ups that lead to recording |
| User perceived value | 4.0+ | Survey: "AI suggestions are helpful" (1-5) |
| API cost per user | <$0.50/mo | Monthly API spend ÷ active users |

---

## 8. Cost/Benefit Analysis

### Phase 1: Static Library (Pre-Launch)

**Costs**:
- Development time: 6-8 hours (solo founder = $0)
- Curation time: 6 hours (write/adapt 250 topics)
- Database storage: ~0.01MB (Supabase free tier)
- **Total: $0**

**Benefits**:
- Solves #1 user complaint ("too few topics")
- Increases session duration (more browsing = more recording)
- Improves App Store appeal (screenshot variety)
- Foundation for AI features (Phase 2)

**ROI**: ∞ (infinite return on zero cost investment)

---

### Phase 2: AI Personalization (Post-Launch)

**Costs**:
- Development: 2-3 weeks (solo founder time)
- API costs (Gemini Flash Free Tier):
  - 0-100 users: $0/month (free tier sufficient)
  - 100-500 users: $0-20/month
  - 500-1000 users: $20-50/month
  - 1000+ users: $50-150/month (consider self-hosted)
- **Year 1 Total: ~$200-500**

**Benefits**:
- 2x recording frequency (users get personalized prompts)
- Higher retention (users feel "understood")
- Competitive moat (no other memory app has this)
- Enables family features (AI suggests questions for Grandpa)

**ROI Calculation**:
```
Assumptions:
- 500 active users post-launch
- AI increases recording rate from 2/week to 3/week (+50%)
- Higher engagement → +10% retention improvement
- Retention increase → +50 users stay vs churn
- LTV per user: $50 (future premium tier)

ROI = ($50 × 50 users) - $500 API cost = $2,000 net benefit
```

**Breakeven**: 10 additional retained users (easily achievable)

---

### Cost Optimization Strategies

#### Free/Low-Cost AI Options

1. **Google Gemini Flash 2.0** (Recommended for MVP)
   - Free tier: 1500 requests/day (RPD)
   - Cost: $0 for first 500 users
   - Quality: 90% as good as GPT-4o-mini

2. **Anthropic Claude Haiku**
   - Cost: $0.25/1M input tokens (5x cheaper than GPT)
   - Quality: Excellent for creative prompts
   - Free tier: 5M tokens/month for new accounts

3. **Self-Hosted Llama 3.2** (For >1000 users)
   - One-time setup: 8 hours
   - Server cost: $20/month (Hetzner VPS)
   - Unlimited requests, full data privacy

**Recommendation**: Start with Gemini free tier → Claude Haiku paid → Self-hosted if scale requires.

---

## 9. Technical Implementation Plan

### Phase 1 Implementation (1 Week Sprint)

#### Day 1-2: Database Setup (6 hours)

**Task 1.1**: Create topics table in Supabase
```sql
-- Run in Supabase SQL Editor
CREATE TABLE recording_topics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  difficulty TEXT DEFAULT 'easy',
  tags TEXT[], -- For future filtering
  popularity_score INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_topics_category ON recording_topics(category);
CREATE INDEX idx_topics_active ON recording_topics(is_active) WHERE is_active = true;
CREATE INDEX idx_topics_popularity ON recording_topics(popularity_score DESC);

-- Enable RLS
ALTER TABLE recording_topics ENABLE ROW LEVEL SECURITY;

-- Public read access (all users see same topics)
CREATE POLICY "Anyone can view active topics" ON recording_topics
  FOR SELECT
  USING (is_active = true);

-- Admin-only write access
CREATE POLICY "Only admins can manage topics" ON recording_topics
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'admin');
```

**Task 1.2**: Seed 250 topics
```typescript
// scripts/seedTopics.ts
import { supabase } from './lib/supabase';

const TOPICS = [
  {
    title: "Talk about your first job",
    description: "Share memories about your early career experiences, colleagues, and what you learned.",
    category: "career",
    difficulty: "easy",
    tags: ["work", "career", "youth"]
  },
  // ... 249 more topics
];

async function seedTopics() {
  const { data, error } = await supabase
    .from('recording_topics')
    .insert(TOPICS);

  console.log(`Seeded ${data.length} topics`);
}
```

---

#### Day 3-4: Frontend Implementation (8 hours)

**Task 2.1**: Create topic service
```typescript
// services/topicService.ts
export class TopicService {
  async getTopicsByCategory(category: string): Promise<Topic[]> {
    const { data } = await supabase
      .from('recording_topics')
      .select('*')
      .eq('category', category)
      .eq('is_active', true)
      .order('popularity_score', { ascending: false })
      .limit(50);
    return data || [];
  }

  async getDailyTopics(userId: string, count = 10): Promise<Topic[]> {
    // Smart rotation algorithm:
    // 1. Get user's recorded topics from memories table
    // 2. Exclude already recorded topics
    // 3. Weight by category preferences
    // 4. Randomize within weighted pool

    const recordedTopics = await this.getUserRecordedTopics(userId);
    const preferences = await this.getUserCategoryPreferences(userId);

    return this.smartSample(count, recordedTopics, preferences);
  }

  private smartSample(
    count: number,
    exclude: string[],
    categoryWeights: Record<string, number>
  ): Topic[] {
    // Implementation: weighted random sampling
    // Prioritize: unrecorded > preferred categories > high popularity
  }
}
```

**Task 2.2**: Update HomeScreen with categories
```typescript
// app/(tabs)/index.tsx (modifications)

const CATEGORIES = [
  { id: 'all', label: 'All Topics', icon: '🌟' },
  { id: 'family', label: 'Family', icon: '👨‍👩‍👧‍👦' },
  { id: 'career', label: 'Career', icon: '💼' },
  { id: 'childhood', label: 'Childhood', icon: '🎈' },
  { id: 'travel', label: 'Travel', icon: '✈️' },
  // ... more categories
];

function HomeScreen() {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [topics, setTopics] = useState<Topic[]>([]);

  useEffect(() => {
    loadTopics(selectedCategory);
  }, [selectedCategory]);

  return (
    <View>
      {/* Category Filter Chips */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {CATEGORIES.map(cat => (
          <CategoryChip
            key={cat.id}
            selected={selectedCategory === cat.id}
            onPress={() => setSelectedCategory(cat.id)}
          />
        ))}
      </ScrollView>

      {/* Topic Cards (existing swipe logic) */}
      <TopicCard topic={topics[currentIndex]} />
    </View>
  );
}
```

---

#### Day 5: Analytics Integration (2 hours)

**Task 3.1**: Add topic tracking
```typescript
// Modify existing analytics service
// File: /services/analytics.ts

export const Analytics = {
  // ... existing events

  trackTopicViewed(topic: Topic, source: 'swipe' | 'category') {
    return this.track('topic_viewed', {
      topic_id: topic.id,
      topic_title: topic.title,
      category: topic.category,
      source,
      timestamp: new Date().toISOString()
    });
  },

  trackRecordingFromTopic(topic: Topic, userModified: boolean) {
    return this.track('recording_from_topic', {
      topic_id: topic.id,
      category: topic.category,
      user_modified_topic: userModified,
      timestamp: new Date().toISOString()
    });
  }
};

// Usage in HomeScreen
const handleRecordPress = () => {
  Analytics.trackRecordingFromTopic(currentTopic, false);
  setShowRecordingFlow(true);
};
```

---

#### Day 6-7: Testing & Polish (4 hours)

**Checklist**:
- [ ] Verify 250 topics load correctly
- [ ] Test category filtering (all 10-15 categories)
- [ ] Test swipe navigation with new topic pool
- [ ] Verify analytics events fire correctly
- [ ] Edge case: User has recorded all topics in category (show message)
- [ ] Performance: Load time <500ms for topic fetch
- [ ] Accessibility: Screen reader announces topic changes

---

## 10. Risk Assessment & Mitigation

### Technical Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Topic pool too small (250 not enough) | Medium | Low | Monitor analytics, add 50 more monthly |
| Users ignore categories, want chronological | Low | Medium | A/B test: category vs timeline view |
| Database query slow (250+ topics) | Low | Medium | Implement caching, limit to 50 per category |
| Topic quality poor (boring prompts) | Medium | High | User feedback form, iterate monthly |

### Product Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| AI costs exceed budget (Phase 2) | Medium | Medium | Start with free tier, monitor usage closely |
| Users want custom topic creation | High | Low | Add "Create custom topic" button (1 hour) |
| Elderly users confused by categories | Low | High | Usability test, simplify to 5 categories if needed |
| App Store rejects AI features (Phase 2) | Low | High | Submit without AI first, add as update |

---

## 11. Coordination with Specialist Teams

### Native App Architect: Technical Feasibility

**Question for Architect**:
> "Can we fetch 250 topics from Supabase and cache locally without performance issues? Should we paginate or load all at once?"

**Expected Recommendation**:
- Load 50 topics per category (lazy loading)
- Cache in AsyncStorage for offline access
- Refresh cache on app open (background fetch)

**Implementation**:
```typescript
// Architect's recommended approach
class TopicCache {
  private cache = new Map<string, Topic[]>();

  async getTopics(category: string): Promise<Topic[]> {
    if (this.cache.has(category)) {
      return this.cache.get(category)!;
    }

    const topics = await TopicService.fetch(category);
    this.cache.set(category, topics);
    await AsyncStorage.setItem(`topics_${category}`, JSON.stringify(topics));

    return topics;
  }
}
```

---

### UX Research Strategist: User Preferences

**Question for UX Researcher**:
> "Should we show elderly users a topic preference survey on day 1, or wait until day 7 when they understand the app better?"

**Expected Recommendation**:
- Skip onboarding survey (cognitive overload for elderly)
- Infer preferences from behavior (what they record)
- Optional survey in settings (advanced users only)

**User Research Plan** (Post-Launch):
1. A/B test: Category filter ON vs OFF (does it improve engagement?)
2. User interviews: "Which topics resonated most?" (validate curation quality)
3. Analytics: Track category distribution (are some ignored?)

---

## 12. Go/No-Go Decision Framework

### Should You Build This Feature Now?

**Use this scorecard to decide:**

| Criteria | Weight | Score (1-5) | Weighted Score |
|----------|--------|-------------|----------------|
| Solves user pain point | 30% | 5 | 1.5 |
| Low development cost (<1 week) | 25% | 5 | 1.25 |
| High ROI (value >> cost) | 20% | 5 | 1.0 |
| Aligns with roadmap | 15% | 4 | 0.6 |
| No new dependencies | 10% | 5 | 0.5 |
| **TOTAL** | 100% | - | **4.85/5.0** |

**Decision Threshold**: Score >3.5 = GO
**Result**: ✅ **STRONG GO** - Build Phase 1 immediately

---

## 13. Alternative Approaches Considered

### Option A: AI-First (Generate All Topics On-Demand)

**Pros**:
- Infinite variety
- Truly personalized
- No curation burden

**Cons**:
- $50-150/month cost (prohibitive for pre-launch)
- Requires internet (bad for elderly users)
- Quality inconsistent (AI hallucinations)
- App Store review risk (AI content)

**Verdict**: ❌ Rejected for Phase 1, viable for Phase 2

---

### Option B: User-Generated Topics Only

**Pros**:
- Zero curation work
- Community-driven content
- Viral potential (share your topics)

**Cons**:
- Cold start problem (no topics on day 1)
- Quality control nightmare (spam, inappropriate content)
- Moderation burden (not feasible for solo founder)

**Verdict**: ❌ Rejected, not suitable for elderly demographic

---

### Option C: Keep 8 Topics, Rotate Daily

**Pros**:
- Zero work required
- Simple UX

**Cons**:
- Doesn't solve user problem ("I want more topics")
- Low engagement (users see repeats)
- Wasted potential (competitors will have more)

**Verdict**: ❌ Status quo not acceptable

---

## 14. Competitive Analysis

### How Do Competitors Handle Topics?

| Competitor | Topic Strategy | Count | Personalization |
|------------|---------------|-------|-----------------|
| StoryWorth | Weekly email prompts | 260+ | No (same for all users) |
| MemoryLane | Static library | 500+ | No |
| Remento | Static + custom | 300+ | Family can request |
| **Memoria (Current)** | Static | 8 | No |
| **Memoria (Proposed)** | Hybrid: 250 static + AI | 250-∞ | ✅ Yes (Phase 2) |

**Competitive Positioning**:
- Phase 1 (250 topics): Match StoryWorth, below MemoryLane
- Phase 2 (AI personalization): **Unique differentiator** - no competitor has this

---

## 15. Final Recommendation

### ✅ Build Phase 1 This Week

**What**: Expand from 8 to 250 curated topics with category filtering
**When**: Before Apple submission (Dec 2025)
**Effort**: 6-8 hours development + 6 hours curation = 2 days total
**Cost**: $0
**Risk**: Very low (isolated feature, no dependencies)

**Action Items**:
1. ✅ Approve this strategy document
2. [ ] Curate 250 topics (spreadsheet → CSV)
3. [ ] Create `recording_topics` table in Supabase
4. [ ] Build topic service + category UI
5. [ ] Add analytics tracking
6. [ ] User test with 3-5 elderly beta testers
7. [ ] Launch with App Store submission

---

### ⏳ Defer Phase 2 Until Post-Launch

**What**: AI-generated personalized topics
**When**: Q1 2026 (after 100+ users validated)
**Effort**: 2-3 weeks
**Cost**: $0-50/month (start with free tier)
**Risk**: Medium (API costs, quality control)

**Trigger Criteria** (all must be met):
- ✅ 100+ active users
- ✅ 40%+ weekly retention
- ✅ Transcription API working (needed for AI context)
- ✅ $500/month in funding/revenue (to cover AI costs)

---

### ❌ Skip Phase 3 (User Preferences) Until Phase 5

**What**: Onboarding survey, preference settings
**When**: Q2 2026 (with Family Sharing feature)
**Rationale**: Topic requests already in roadmap (Phase 5), build together

---

## 16. Success Criteria

### How Will We Know Phase 1 Succeeded?

**Quantitative Metrics** (30 days post-launch):
- [ ] Topic engagement rate >40% (users swipe 3+ topics per session)
- [ ] Recording from topic >30% (% recordings using suggested topic)
- [ ] Category exploration >2 per session
- [ ] User retention +5% improvement vs baseline

**Qualitative Signals**:
- [ ] User feedback: "I love the variety of topics" (3+ mentions)
- [ ] App Store reviews mention topics positively
- [ ] Support tickets decrease ("What should I record?")

**Failure Criteria** (triggers re-evaluation):
- Topic engagement <20% (users don't swipe through topics)
- Recording conversion <15% (users ignore suggestions)
- User feedback: "Too many topics, overwhelmed"

**Contingency Plan**: If Phase 1 fails, revert to 8 topics + add "Request a topic" form

---

## 17. Next Steps

### Immediate Actions (This Week)

**Day 1 (Today - Dec 2)**:
1. [ ] Review and approve this strategy document
2. [ ] Decide: Build Phase 1 now OR defer until post-launch

**Day 2-3 (Dec 3-4)**:
1. [ ] Curate 250 topics (spreadsheet template provided below)
2. [ ] Create Supabase table and seed data
3. [ ] Build topic service and caching

**Day 4-5 (Dec 5-6)**:
1. [ ] Update HomeScreen with category filtering
2. [ ] Add analytics tracking
3. [ ] QA testing

**Day 6-7 (Dec 7-8)**:
1. [ ] Beta test with 3-5 users
2. [ ] Iterate based on feedback
3. [ ] Merge to main branch

---

### Appendix A: Topic Curation Template

**Spreadsheet Structure** (Google Sheets):

| title | description | category | difficulty | tags |
|-------|-------------|----------|------------|------|
| Talk about your first job | Share memories about your early career... | career | easy | work,career,youth |
| Describe your childhood home | Paint a picture of where you grew up... | childhood | easy | home,family,nostalgia |
| ... | ... | ... | ... | ... |

**Categories** (15 total):
1. childhood (40 topics)
2. family (40 topics)
3. career (35 topics)
4. love_relationships (30 topics)
5. immigration_heritage (25 topics) ← Chinese elderly focus
6. war_service (20 topics)
7. travel_adventure (20 topics)
8. life_lessons (20 topics)
9. traditions_culture (20 topics)
10. challenges_triumphs (15 topics)
11. daily_life (15 topics)
12. education (10 topics)
13. health_wellness (5 topics)
14. technology_change (5 topics)
15. miscellaneous (10 topics)

**Sample Topics by Category**: (Full list in separate CSV file)

---

### Appendix B: Database Migration Script

```sql
-- File: supabase-migrations/002_recording_topics.sql
-- Run this in Supabase SQL Editor

-- ============================================================================
-- RECORDING TOPICS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS recording_topics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  difficulty TEXT DEFAULT 'easy' CHECK (difficulty IN ('easy', 'medium', 'deep')),
  tags TEXT[] DEFAULT '{}',
  popularity_score INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  metadata JSONB DEFAULT '{}', -- For future extensions
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_topics_category ON recording_topics(category) WHERE is_active = true;
CREATE INDEX idx_topics_popularity ON recording_topics(popularity_score DESC) WHERE is_active = true;
CREATE INDEX idx_topics_tags ON recording_topics USING GIN(tags);

-- RLS Policies
ALTER TABLE recording_topics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active topics" ON recording_topics
  FOR SELECT
  USING (is_active = true);

-- Admin policy (for future admin panel)
CREATE POLICY "Admins can manage topics" ON recording_topics
  FOR ALL
  USING (
    auth.jwt() ->> 'email' IN (
      SELECT email FROM auth.users WHERE raw_user_meta_data->>'role' = 'admin'
    )
  );

-- Trigger for updated_at
CREATE TRIGGER update_recording_topics_updated_at
  BEFORE UPDATE ON recording_topics
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- USER TOPIC PREFERENCES (Optional - Phase 3)
-- ============================================================================

-- Add to existing user_profiles.settings JSONB
-- No new table needed, just update settings structure:
-- settings: {
--   topic_preferences: {
--     favorite_categories: ['family', 'childhood'],
--     excluded_categories: [],
--     difficulty_preference: 'easy'
--   }
-- }

-- ============================================================================
-- ANALYTICS: Track topic engagement
-- ============================================================================

-- Modify existing analytics_events table to include topic-specific events
-- No schema change needed, just new event types:
-- - topic_viewed
-- - recording_from_topic
-- - category_selected

-- ============================================================================
-- SEED DATA (Sample - Full seed in separate file)
-- ============================================================================

INSERT INTO recording_topics (title, description, category, difficulty, tags)
VALUES
  ('Talk about your first job', 'Share memories about your early career experiences, colleagues, and what you learned.', 'career', 'easy', ARRAY['work', 'career', 'youth']),
  ('Describe your childhood home', 'Paint a picture of where you grew up, the rooms, the neighborhood, and special memories.', 'childhood', 'easy', ARRAY['home', 'family', 'nostalgia']),
  -- ... 248 more topics
;

-- Verify seed
SELECT category, COUNT(*) as count
FROM recording_topics
WHERE is_active = true
GROUP BY category
ORDER BY count DESC;

-- Expected output:
-- family: 40
-- childhood: 40
-- career: 35
-- ... (250 total)

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
```

---

### Appendix C: Cost Projection Model

**Phase 2 AI Costs** (Conservative Estimates):

| Users | Requests/Month | Token Usage | Cost (Gemini Free) | Cost (Claude Haiku) |
|-------|----------------|-------------|-------------------|---------------------|
| 0-100 | 1,000 | 500K tokens | $0 | $0.13 |
| 100-500 | 5,000 | 2.5M tokens | $0 | $0.63 |
| 500-1K | 10,000 | 5M tokens | $0 | $1.25 |
| 1K-5K | 50,000 | 25M tokens | $12.50 | $6.25 |
| 5K-10K | 100,000 | 50M tokens | $25.00 | $12.50 |

**Assumptions**:
- Each user generates 10 AI requests/month
- Average 500 tokens per request (100 input + 400 output)
- Gemini free tier: 1M tokens/day = 30M/month free
- Claude Haiku: $0.25/1M input, $1.25/1M output tokens

**Breakeven Analysis**:
- With 1000 users @ $12.50/month cost
- Need retention improvement to retain just 1 additional user ($50 LTV future)
- ROI: 400% return in Year 1

---

## Document Control

**Approvals Required**:
- [ ] Solo Founder (You) - Product strategy approval
- [ ] Native App Architect - Technical feasibility review
- [ ] UX Research Strategist - User research plan validation

**Next Review Date**: After Phase 1 launch (Jan 2026)

**Change Log**:
- 2025-12-02: Initial document created
- [Future updates...]

---

**END OF STRATEGY DOCUMENT**

Total Length: ~15,000 words
Reading Time: ~45 minutes
Implementation Time: 1-3 weeks (phased)
