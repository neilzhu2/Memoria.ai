# Topics Expansion - Implementation Checklist

**Sprint**: Phase 1 - Static Topic Library
**Timeline**: 1 week (Dec 2-8, 2025)
**Total Effort**: 12-14 hours
**Cost**: $0

---

## Pre-Sprint Setup (30 minutes)

- [ ] Read strategy document: `/docs/RECORDING_TOPICS_EXPANSION_STRATEGY.md`
- [ ] Review current topics in `/app/(tabs)/index.tsx` (lines 21-62)
- [ ] Confirm Supabase credentials working (test connection)
- [ ] Create new branch: `git checkout -b feature/expanded-topics`

---

## Day 1: Database Setup (2 hours)

### Task 1.1: Create Topics Table (30 min)

- [ ] Open Supabase SQL Editor
- [ ] Copy migration from Appendix B in strategy doc
- [ ] Run SQL migration script
- [ ] Verify table created: `SELECT * FROM recording_topics LIMIT 5;`
- [ ] Test RLS policy: `SELECT * FROM recording_topics;` (should return empty, not error)

**Verification**:
```sql
-- Should show table exists
SELECT table_name FROM information_schema.tables
WHERE table_name = 'recording_topics';

-- Should show 3 indexes created
SELECT indexname FROM pg_indexes
WHERE tablename = 'recording_topics';
```

### Task 1.2: Curate 250 Topics (90 min)

- [ ] Open Google Sheets or Excel
- [ ] Create columns: `title`, `description`, `category`, `difficulty`, `tags`
- [ ] Write 50 topics yourself (focus on elderly-relevant)
- [ ] Adapt 100 topics from memoir guides (see resources below)
- [ ] Generate 100 topics with ChatGPT (prompt provided below)
- [ ] Review all 250 for cultural sensitivity
- [ ] Export as CSV: `recording_topics_seed.csv`

**ChatGPT Prompt for Topic Generation**:
```
You are helping create prompts for elderly users (65+) to record audio memories about their lives. Generate 100 memory recording prompts organized into these categories:

Categories: childhood (15), family (15), career (15), love_relationships (10), immigration_heritage (10, focus on Chinese immigrants), war_service (10), travel_adventure (10), life_lessons (10), traditions_culture (5)

Format each as:
{
  "title": "Short prompt (5-8 words)",
  "description": "Helpful context for what to share (15-25 words)",
  "category": "category_name",
  "difficulty": "easy|medium|deep",
  "tags": ["tag1", "tag2", "tag3"]
}

Make prompts:
- Warm and inviting (not clinical)
- Specific enough to trigger memories
- Culturally sensitive (especially Chinese heritage topics)
- Age-appropriate (avoid tech/modern references)
- Open-ended (not yes/no)

Examples:
- "Describe the neighborhood where you grew up" (childhood, easy)
- "Tell me about coming to America" (immigration_heritage, medium)
- "What was your wedding day like?" (love_relationships, easy)

Generate 100 prompts now.
```

**Resources**:
- StoryCorps Great Questions: https://storycorps.org/participate/great-questions/
- MemoryLane prompt library (research competitors)
- "300 Writing Prompts for Life Story" books (Amazon)

---

## Day 2: Seed Data (2 hours)

### Task 2.1: Import CSV to Supabase (30 min)

**Option A: Manual Import (Recommended)**
- [ ] In Supabase dashboard → Table Editor → `recording_topics`
- [ ] Click "Insert" → "Import data from CSV"
- [ ] Upload `recording_topics_seed.csv`
- [ ] Map columns: title → title, description → description, etc.
- [ ] Click "Import" (should show "250 rows inserted")

**Option B: Programmatic Seed Script**
```typescript
// scripts/seedTopics.ts
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import csvParser from 'csv-parser';

const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // Use service role for seeding
);

async function seedTopics() {
  const topics: any[] = [];

  fs.createReadStream('recording_topics_seed.csv')
    .pipe(csvParser())
    .on('data', (row) => {
      topics.push({
        title: row.title,
        description: row.description,
        category: row.category,
        difficulty: row.difficulty || 'easy',
        tags: row.tags ? row.tags.split(',') : [],
        is_active: true
      });
    })
    .on('end', async () => {
      const { data, error } = await supabase
        .from('recording_topics')
        .insert(topics);

      if (error) {
        console.error('Seed error:', error);
      } else {
        console.log(`✅ Seeded ${topics.length} topics`);
      }
    });
}

seedTopics();
```

- [ ] Run: `npx ts-node scripts/seedTopics.ts`

### Task 2.2: Verify Seed Data (15 min)

```sql
-- Total count (should be 250)
SELECT COUNT(*) FROM recording_topics;

-- Distribution by category
SELECT category, COUNT(*) as count
FROM recording_topics
GROUP BY category
ORDER BY count DESC;

-- Sample 10 random topics
SELECT title, category, difficulty
FROM recording_topics
ORDER BY RANDOM()
LIMIT 10;

-- Check for duplicates (should be 0)
SELECT title, COUNT(*)
FROM recording_topics
GROUP BY title
HAVING COUNT(*) > 1;
```

- [ ] All checks pass
- [ ] Screenshot results and save to `/docs/screenshots/topics_seed_verification.png`

### Task 2.3: Create Topic Categories Config (15 min)

```typescript
// constants/TopicCategories.ts
export const TOPIC_CATEGORIES = [
  { id: 'all', label: 'All Topics', icon: '🌟', color: '#FFD700' },
  { id: 'family', label: 'Family', icon: '👨‍👩‍👧‍👦', color: '#FF6B6B' },
  { id: 'childhood', label: 'Childhood', icon: '🎈', color: '#4ECDC4' },
  { id: 'career', label: 'Career', icon: '💼', color: '#45B7D1' },
  { id: 'love_relationships', label: 'Love & Life', icon: '💕', color: '#FFA07A' },
  { id: 'immigration_heritage', label: 'Heritage', icon: '🌏', color: '#98D8C8' },
  { id: 'war_service', label: 'Service', icon: '🎖️', color: '#C9A0DC' },
  { id: 'travel_adventure', label: 'Travel', icon: '✈️', color: '#F7B731' },
  { id: 'life_lessons', label: 'Life Lessons', icon: '💡', color: '#95E1D3' },
  { id: 'traditions_culture', label: 'Traditions', icon: '🏮', color: '#FDA7DF' },
  { id: 'challenges_triumphs', label: 'Triumphs', icon: '🏆', color: '#F8CDDA' },
  { id: 'daily_life', label: 'Daily Life', icon: '🏡', color: '#DDA15E' },
] as const;

export type TopicCategory = typeof TOPIC_CATEGORIES[number]['id'];
```

- [ ] Create file: `/constants/TopicCategories.ts`
- [ ] Copy code above
- [ ] Verify TypeScript compiles

---

## Day 3: Backend Service (3 hours)

### Task 3.1: Create Topic Service (90 min)

```typescript
// services/topicService.ts
import { supabase } from '@/lib/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface Topic {
  id: string;
  title: string;
  description: string;
  category: string;
  difficulty: 'easy' | 'medium' | 'deep';
  tags: string[];
  popularity_score: number;
  is_active: boolean;
}

const CACHE_KEY_PREFIX = 'topics_cache_';
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

export class TopicService {
  /**
   * Get topics by category with caching
   */
  static async getTopicsByCategory(
    category: string,
    limit = 50
  ): Promise<Topic[]> {
    const cacheKey = `${CACHE_KEY_PREFIX}${category}`;

    // Try cache first
    try {
      const cached = await AsyncStorage.getItem(cacheKey);
      if (cached) {
        const { data, timestamp } = JSON.parse(cached);
        if (Date.now() - timestamp < CACHE_DURATION) {
          console.log(`✅ Topics cache hit: ${category}`);
          return data;
        }
      }
    } catch (err) {
      console.warn('Cache read failed:', err);
    }

    // Fetch from Supabase
    const query = supabase
      .from('recording_topics')
      .select('*')
      .eq('is_active', true)
      .order('popularity_score', { ascending: false })
      .limit(limit);

    if (category !== 'all') {
      query.eq('category', category);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Topic fetch error:', error);
      throw error;
    }

    // Cache results
    try {
      await AsyncStorage.setItem(
        cacheKey,
        JSON.stringify({ data, timestamp: Date.now() })
      );
    } catch (err) {
      console.warn('Cache write failed:', err);
    }

    return data || [];
  }

  /**
   * Get daily topics for user (smart rotation)
   */
  static async getDailyTopics(
    userId: string,
    count = 10
  ): Promise<Topic[]> {
    // 1. Get user's recorded topics from memories
    const recordedTopicIds = await this.getUserRecordedTopics(userId);

    // 2. Get user's category preferences (if available)
    const preferences = await this.getUserCategoryPreferences(userId);

    // 3. Fetch topics excluding already recorded
    const { data, error } = await supabase
      .from('recording_topics')
      .select('*')
      .eq('is_active', true)
      .not('id', 'in', `(${recordedTopicIds.join(',')})`)
      .order('popularity_score', { ascending: false })
      .limit(count * 3); // Fetch 3x for filtering

    if (error || !data) {
      console.error('Daily topics fetch error:', error);
      return [];
    }

    // 4. Smart sample based on preferences
    return this.weightedSample(data, preferences, count);
  }

  /**
   * Get topics user has already recorded
   */
  private static async getUserRecordedTopics(
    userId: string
  ): Promise<string[]> {
    const { data } = await supabase
      .from('memories')
      .select('theme') // Assuming 'theme' column stores topic title
      .eq('user_id', userId);

    // Extract topic IDs from theme data
    // (Implementation depends on how you store topic references)
    return data?.map(m => m.theme).filter(Boolean) || [];
  }

  /**
   * Get user's category preferences
   */
  private static async getUserCategoryPreferences(
    userId: string
  ): Promise<Record<string, number>> {
    const { data } = await supabase
      .from('user_profiles')
      .select('settings')
      .eq('user_id', userId)
      .single();

    return data?.settings?.topic_preferences?.favorite_categories || {};
  }

  /**
   * Weighted random sampling
   */
  private static weightedSample(
    topics: Topic[],
    categoryWeights: Record<string, number>,
    count: number
  ): Topic[] {
    // Simple implementation: prioritize preferred categories
    const weighted = topics.map(topic => ({
      topic,
      weight: categoryWeights[topic.category] || 1
    }));

    // Sort by weight * random
    weighted.sort((a, b) => {
      return (b.weight * Math.random()) - (a.weight * Math.random());
    });

    return weighted.slice(0, count).map(w => w.topic);
  }

  /**
   * Clear cache (for testing)
   */
  static async clearCache(): Promise<void> {
    const keys = await AsyncStorage.getAllKeys();
    const cacheKeys = keys.filter(k => k.startsWith(CACHE_KEY_PREFIX));
    await AsyncStorage.multiRemove(cacheKeys);
  }
}
```

- [ ] Create file: `/services/topicService.ts`
- [ ] Copy code above
- [ ] Add to `/services/index.ts` exports

### Task 3.2: Add Topic Types (30 min)

```typescript
// types/topic.ts
export interface Topic {
  id: string;
  title: string;
  description: string;
  category: TopicCategory;
  difficulty: 'easy' | 'medium' | 'deep';
  tags: string[];
  popularity_score: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export type TopicCategory =
  | 'all'
  | 'family'
  | 'childhood'
  | 'career'
  | 'love_relationships'
  | 'immigration_heritage'
  | 'war_service'
  | 'travel_adventure'
  | 'life_lessons'
  | 'traditions_culture'
  | 'challenges_triumphs'
  | 'daily_life';

export interface TopicFilter {
  category?: TopicCategory;
  difficulty?: 'easy' | 'medium' | 'deep';
  tags?: string[];
  searchQuery?: string;
}
```

- [ ] Create file: `/types/topic.ts`
- [ ] Add to `/types/index.ts` exports

### Task 3.3: Write Unit Tests (60 min)

```typescript
// services/__tests__/topicService.test.ts
import { TopicService } from '../topicService';
import { supabase } from '@/lib/supabase';

jest.mock('@/lib/supabase');

describe('TopicService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getTopicsByCategory', () => {
    it('fetches all topics when category is "all"', async () => {
      const mockTopics = [
        { id: '1', title: 'Topic 1', category: 'family' },
        { id: '2', title: 'Topic 2', category: 'career' }
      ];

      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue({ data: mockTopics, error: null })
      });

      const result = await TopicService.getTopicsByCategory('all', 50);

      expect(result).toEqual(mockTopics);
    });

    it('filters by category when specified', async () => {
      // Test implementation
    });

    it('caches results for 24 hours', async () => {
      // Test implementation
    });
  });

  describe('getDailyTopics', () => {
    it('excludes topics user has already recorded', async () => {
      // Test implementation
    });

    it('returns requested count of topics', async () => {
      // Test implementation
    });
  });
});
```

- [ ] Create test file
- [ ] Write 5-7 test cases
- [ ] Run: `npm test -- topicService`
- [ ] All tests pass

---

## Day 4: Frontend Components (3 hours)

### Task 4.1: Create Category Chip Component (45 min)

```typescript
// components/CategoryChip.tsx
import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import * as Haptics from 'expo-haptics';

interface CategoryChipProps {
  id: string;
  label: string;
  icon: string;
  color: string;
  selected: boolean;
  onPress: () => void;
}

export const CategoryChip: React.FC<CategoryChipProps> = ({
  id,
  label,
  icon,
  color,
  selected,
  onPress
}) => {
  const handlePress = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  return (
    <TouchableOpacity
      style={[
        styles.chip,
        selected && { backgroundColor: color, borderColor: color }
      ]}
      onPress={handlePress}
      accessibilityLabel={`Filter by ${label}`}
      accessibilityRole="button"
      accessibilityState={{ selected }}
    >
      <Text style={styles.icon}>{icon}</Text>
      <Text style={[styles.label, selected && styles.labelSelected]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    backgroundColor: '#FFFFFF',
    marginRight: 8,
  },
  icon: {
    fontSize: 18,
    marginRight: 6,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666666',
  },
  labelSelected: {
    color: '#FFFFFF',
  },
});
```

- [ ] Create file: `/components/CategoryChip.tsx`
- [ ] Test in Storybook (if available) or HomeScreen

### Task 4.2: Update HomeScreen (2 hours)

```typescript
// app/(tabs)/index.tsx
// MODIFICATIONS to existing file

import { TopicService } from '@/services/topicService';
import { TOPIC_CATEGORIES } from '@/constants/TopicCategories';
import { CategoryChip } from '@/components/CategoryChip';
import type { Topic } from '@/types/topic';

// Add state for categories and topics
const [selectedCategory, setSelectedCategory] = useState('all');
const [topics, setTopics] = useState<Topic[]>([]);
const [loading, setLoading] = useState(true);

// Replace hardcoded DAILY_TOPICS with dynamic fetch
useEffect(() => {
  loadTopics(selectedCategory);
}, [selectedCategory]);

const loadTopics = async (category: string) => {
  setLoading(true);
  try {
    const fetchedTopics = await TopicService.getTopicsByCategory(category, 50);
    setTopics(fetchedTopics);
  } catch (error) {
    console.error('Failed to load topics:', error);
    Toast.show({
      type: 'error',
      text1: 'Failed to load topics',
      text2: 'Using default topics...'
    });
    // Fallback to hardcoded topics
    setTopics(DAILY_TOPICS);
  } finally {
    setLoading(false);
  }
};

// Add category filter UI (before topic cards)
<ScrollView
  horizontal
  showsHorizontalScrollIndicator={false}
  style={styles.categoryScroll}
  contentContainerStyle={styles.categoryScrollContent}
>
  {TOPIC_CATEGORIES.map(category => (
    <CategoryChip
      key={category.id}
      {...category}
      selected={selectedCategory === category.id}
      onPress={() => setSelectedCategory(category.id)}
    />
  ))}
</ScrollView>

// Update topic card to use dynamic topics
<Text style={styles.topicTitle}>
  {topics[navState.currentIndex]?.title || 'Loading...'}
</Text>
<Text style={styles.topicDescription}>
  {topics[navState.currentIndex]?.description || ''}
</Text>

// Add loading state
{loading && (
  <ActivityIndicator size="large" color={Colors.primary} />
)}
```

- [ ] Open `/app/(tabs)/index.tsx`
- [ ] Add imports
- [ ] Add state variables
- [ ] Add `loadTopics()` function
- [ ] Add category scroll view
- [ ] Replace hardcoded topics with `topics[currentIndex]`
- [ ] Test: Category filtering works
- [ ] Test: Swipe navigation still works

**Styles to Add**:
```typescript
categoryScroll: {
  marginBottom: 16,
  maxHeight: 50,
},
categoryScrollContent: {
  paddingHorizontal: 20,
  gap: 8,
}
```

---

## Day 5: Analytics Integration (2 hours)

### Task 5.1: Add Topic Analytics Events (60 min)

```typescript
// services/analytics.ts (MODIFY existing file)

// Add new event types to AnalyticsEvent union
export type AnalyticsEvent =
  | 'app_opened'
  | 'user_signed_up'
  // ... existing events
  | 'topic_viewed'
  | 'topic_category_selected'
  | 'recording_from_topic';

// Add topic-specific tracking methods
export const Analytics = {
  // ... existing methods

  trackTopicViewed(topic: Topic, source: 'swipe' | 'category' | 'daily') {
    return this.track('topic_viewed', {
      topic_id: topic.id,
      topic_title: topic.title,
      category: topic.category,
      difficulty: topic.difficulty,
      source,
      timestamp: new Date().toISOString()
    });
  },

  trackCategorySelected(categoryId: string, previousCategory: string) {
    return this.track('topic_category_selected', {
      category_id: categoryId,
      previous_category: previousCategory,
      timestamp: new Date().toISOString()
    });
  },

  trackRecordingFromTopic(
    topic: Topic,
    userModified: boolean,
    recordingDuration?: number
  ) {
    return this.track('recording_from_topic', {
      topic_id: topic.id,
      topic_title: topic.title,
      category: topic.category,
      user_modified_topic: userModified,
      recording_duration: recordingDuration,
      timestamp: new Date().toISOString()
    });
  }
};
```

- [ ] Modify `/services/analytics.ts`
- [ ] Add new event types
- [ ] Add tracking methods
- [ ] Verify TypeScript compiles

### Task 5.2: Integrate Analytics in HomeScreen (30 min)

```typescript
// app/(tabs)/index.tsx (ADD analytics calls)

// Track when user views a topic (on swipe)
const handleTopicChange = (newIndex: number) => {
  const topic = topics[newIndex];
  if (topic) {
    Analytics.trackTopicViewed(topic, 'swipe');
  }
};

// Track category selection
const handleCategorySelect = (categoryId: string) => {
  Analytics.trackCategorySelected(categoryId, selectedCategory);
  setSelectedCategory(categoryId);
};

// Track recording from topic
const handleRecordPress = async () => {
  const topic = topics[navState.currentIndex];
  await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

  Analytics.trackRecordingFromTopic(topic, false);

  setSelectedTopic({
    id: topic.id,
    title: topic.title
  });
  setSkipThemeSelection(true);
  setShowRecordingFlow(true);
};
```

- [ ] Add analytics calls to HomeScreen
- [ ] Test: Events fire in Supabase `analytics_events` table
- [ ] Verify event payload structure correct

### Task 5.3: Create Analytics Dashboard Query (30 min)

```sql
-- File: docs/analytics_queries.sql
-- Queries for analyzing topic engagement

-- 1. Most viewed topics (last 7 days)
SELECT
  event_properties->>'topic_title' as topic,
  event_properties->>'category' as category,
  COUNT(*) as views
FROM analytics_events
WHERE event_name = 'topic_viewed'
  AND created_at > NOW() - INTERVAL '7 days'
GROUP BY topic, category
ORDER BY views DESC
LIMIT 20;

-- 2. Category popularity
SELECT
  event_properties->>'category_id' as category,
  COUNT(*) as selections
FROM analytics_events
WHERE event_name = 'topic_category_selected'
  AND created_at > NOW() - INTERVAL '7 days'
GROUP BY category
ORDER BY selections DESC;

-- 3. Topic-to-recording conversion rate
SELECT
  category,
  total_views,
  total_recordings,
  ROUND((total_recordings::DECIMAL / total_views) * 100, 2) as conversion_rate
FROM (
  SELECT
    event_properties->>'category' as category,
    COUNT(*) FILTER (WHERE event_name = 'topic_viewed') as total_views,
    COUNT(*) FILTER (WHERE event_name = 'recording_from_topic') as total_recordings
  FROM analytics_events
  WHERE event_name IN ('topic_viewed', 'recording_from_topic')
    AND created_at > NOW() - INTERVAL '7 days'
  GROUP BY category
) t
WHERE total_views > 0
ORDER BY conversion_rate DESC;

-- 4. Topics never recorded (opportunity analysis)
SELECT
  rt.title,
  rt.category,
  rt.difficulty,
  rt.popularity_score
FROM recording_topics rt
LEFT JOIN (
  SELECT DISTINCT event_properties->>'topic_id' as topic_id
  FROM analytics_events
  WHERE event_name = 'recording_from_topic'
) ae ON rt.id::TEXT = ae.topic_id
WHERE ae.topic_id IS NULL
  AND rt.is_active = true
ORDER BY rt.popularity_score DESC;
```

- [ ] Create file: `/docs/analytics_queries.sql`
- [ ] Test queries in Supabase SQL Editor
- [ ] Bookmark for weekly review

---

## Day 6: Testing & QA (2 hours)

### Task 6.1: Manual Testing Checklist (60 min)

**Topic Loading**:
- [ ] Topics load on HomeScreen initial render
- [ ] Loading indicator shows while fetching
- [ ] Fallback to default topics if fetch fails
- [ ] Cache works (second load is instant)

**Category Filtering**:
- [ ] All 12 category chips render
- [ ] Tapping category filters topics correctly
- [ ] "All" category shows topics from all categories
- [ ] Selected category has visual highlight
- [ ] Haptic feedback on category tap

**Topic Browsing**:
- [ ] Swipe left/right navigates topics
- [ ] Previous/Next buttons work
- [ ] Topic title and description update on navigation
- [ ] No blank screens or missing topics
- [ ] Topics don't repeat within same category (first 50)

**Recording from Topic**:
- [ ] Green mic button opens recording flow
- [ ] Topic title pre-filled in recording screen
- [ ] User can edit topic title before recording
- [ ] Recording saved with correct topic reference

**Analytics**:
- [ ] `topic_viewed` event fires on swipe
- [ ] `topic_category_selected` fires on category tap
- [ ] `recording_from_topic` fires on recording save
- [ ] Events visible in Supabase `analytics_events` table

**Edge Cases**:
- [ ] No internet: cached topics load
- [ ] Empty category: shows "No topics in this category"
- [ ] First-time user: topics load without cache
- [ ] User recorded all topics: shows "You've recorded all topics!"

### Task 6.2: Automated Tests (30 min)

```typescript
// __tests__/integration/topicsFlow.test.tsx
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import HomeScreen from '@/app/(tabs)/index';
import { TopicService } from '@/services/topicService';

jest.mock('@/services/topicService');

describe('Topics Flow Integration', () => {
  it('loads and displays topics on mount', async () => {
    const mockTopics = [
      { id: '1', title: 'Test Topic 1', category: 'family' },
      { id: '2', title: 'Test Topic 2', category: 'career' }
    ];

    (TopicService.getTopicsByCategory as jest.Mock).mockResolvedValue(mockTopics);

    const { getByText } = render(<HomeScreen />);

    await waitFor(() => {
      expect(getByText('Test Topic 1')).toBeTruthy();
    });
  });

  it('filters topics by category', async () => {
    // Test implementation
  });

  it('tracks analytics on topic view', async () => {
    // Test implementation
  });
});
```

- [ ] Write integration tests
- [ ] Run: `npm test -- topicsFlow`
- [ ] All tests pass

### Task 6.3: Beta User Testing (30 min)

**Recruit 3-5 beta testers** (family/friends 65+):
- [ ] Send TestFlight build
- [ ] Ask to browse topics for 5 minutes
- [ ] Ask: "Did you find interesting topics?"
- [ ] Ask: "Were categories helpful or confusing?"
- [ ] Ask: "How many topics did you swipe through?"

**Success Criteria**:
- Users browse 5+ topics per session
- 2+ users say "I like the variety"
- No confusion about category filtering
- No technical issues reported

---

## Day 7: Polish & Launch (2 hours)

### Task 7.1: Performance Optimization (45 min)

- [ ] Test topic loading time: <500ms (target)
- [ ] If slow, implement pagination (load 20 at a time)
- [ ] Optimize images/icons (category chips)
- [ ] Test on slow network (3G simulation)
- [ ] Memory usage check (no leaks)

**Performance Checklist**:
```typescript
// Add to topicService.ts
const METRICS = {
  loadTime: 0,
  cacheHitRate: 0
};

// Measure load time
const start = Date.now();
const topics = await TopicService.getTopicsByCategory(category);
METRICS.loadTime = Date.now() - start;

console.log(`📊 Topics loaded in ${METRICS.loadTime}ms`);
// Target: <500ms
```

### Task 7.2: Error Handling (30 min)

- [ ] Network error: Show toast, use cached topics
- [ ] Empty category: Show "No topics yet" message
- [ ] Database error: Log to Sentry, fallback gracefully
- [ ] User offline: Show offline indicator, use cache

**Error UI**:
```typescript
// Add to HomeScreen
{error && (
  <View style={styles.errorContainer}>
    <Text style={styles.errorText}>
      Unable to load topics. Using offline cache.
    </Text>
    <TouchableOpacity onPress={() => loadTopics(selectedCategory)}>
      <Text style={styles.retryText}>Retry</Text>
    </TouchableOpacity>
  </View>
)}
```

### Task 7.3: Accessibility Audit (30 min)

- [ ] Screen reader test: All topics readable
- [ ] Category chips have accessibility labels
- [ ] Recording button has clear label
- [ ] High contrast mode support
- [ ] Font scaling support (Settings > Display > Text Size)

**Accessibility Checklist**:
```typescript
// Verify these attributes exist
<TouchableOpacity
  accessibilityLabel={`Topic: ${topic.title}`}
  accessibilityHint="Swipe to see more topics, tap green button to record"
  accessibilityRole="button"
>
```

### Task 7.4: Documentation (15 min)

- [ ] Update `/ROADMAP.md`: Mark topics expansion complete
- [ ] Add entry to `/WORKLOG.md` with today's date
- [ ] Create `/docs/TOPICS_USAGE_GUIDE.md` (user-facing)
- [ ] Screenshot new UI for App Store submission

**WORKLOG Entry Template**:
```markdown
## Session Summary (Dec 8, 2025)

**Focus**: Topics Expansion - Phase 1 Complete

**Completed**:
- ✅ Created `recording_topics` table (250 topics)
- ✅ Built TopicService with caching
- ✅ Added category filtering UI
- ✅ Integrated analytics tracking
- ✅ QA tested with 5 beta users

**Files Modified**:
- `app/(tabs)/index.tsx` - Added category filtering
- `services/topicService.ts` - NEW topic service
- `constants/TopicCategories.ts` - NEW category config
- Supabase: `recording_topics` table

**Metrics**:
- 250 curated topics (12 categories)
- Load time: 320ms avg (target: <500ms)
- Cache hit rate: 85%
- Beta users browsed 8.2 topics avg (target: 5+)

**Time Invested**: ~12 hours over 7 days
**Cost**: $0
```

---

## Post-Sprint Review (30 min)

### Success Metrics Check

| Metric | Target | Actual | Status |
|--------|--------|--------|--------|
| Topics count | 250 | __ | ☐ |
| Load time | <500ms | __ms | ☐ |
| Cache hit rate | >70% | __% | ☐ |
| Beta user satisfaction | 4/5 | __/5 | ☐ |
| Zero critical bugs | 0 | __ | ☐ |

- [ ] All metrics met
- [ ] Demo to stakeholder (yourself!)
- [ ] Deploy to TestFlight
- [ ] Celebrate! 🎉

---

## Git Workflow

### Commit Strategy

**Day 1**: Database setup
```bash
git add supabase-migrations/002_recording_topics.sql
git commit -m "feat(topics): Add recording_topics table and seed data

- Create topics table with RLS policies
- Seed 250 curated topics across 12 categories
- Add indexes for category and popularity filtering"
```

**Day 3**: Backend service
```bash
git add services/topicService.ts types/topic.ts
git commit -m "feat(topics): Implement TopicService with caching

- Add getTopicsByCategory with AsyncStorage cache
- Add getDailyTopics with smart rotation
- Add comprehensive TypeScript types"
```

**Day 4**: Frontend components
```bash
git add app/(tabs)/index.tsx components/CategoryChip.tsx constants/TopicCategories.ts
git commit -m "feat(topics): Add category filtering UI to HomeScreen

- Create CategoryChip component with 12 categories
- Update HomeScreen with category scroll view
- Replace hardcoded topics with dynamic fetch"
```

**Day 5**: Analytics
```bash
git add services/analytics.ts
git commit -m "feat(analytics): Track topic engagement events

- Add topic_viewed, category_selected, recording_from_topic events
- Integrate analytics into HomeScreen
- Add SQL queries for topic analytics dashboard"
```

**Day 7**: Final PR
```bash
git add .
git commit -m "feat(topics): Complete Phase 1 topic expansion

Summary:
- Expanded from 8 to 250 curated topics
- Added 12 category filters with smart caching
- Integrated analytics tracking
- QA tested with 5 beta users

Metrics:
- Load time: 320ms avg
- Cache hit rate: 85%
- Beta users browsed 8.2 topics avg

🤖 Generated with Claude Code
Co-Authored-By: Claude <noreply@anthropic.com>"

git push origin feature/expanded-topics
```

### Create Pull Request

```markdown
# PR Title: feat(topics): Expand recording topics from 8 to 250 with category filtering

## Summary
Implements Phase 1 of Topics Expansion Strategy. Replaces 8 hardcoded topics with 250 curated topics organized into 12 categories, with smart caching and analytics tracking.

## Changes
- Database: Created `recording_topics` table with 250 seed topics
- Backend: New `TopicService` with category filtering and caching
- Frontend: Category filter chips, dynamic topic loading
- Analytics: Track `topic_viewed`, `category_selected`, `recording_from_topic`

## Testing
- [x] 250 topics load correctly
- [x] Category filtering works
- [x] Swipe navigation intact
- [x] Analytics events fire
- [x] Cache improves load time
- [x] Beta tested with 5 users (avg 8.2 topics browsed)

## Screenshots
[Attach: Category filters, Topic cards, Analytics dashboard]

## Performance
- Load time: 320ms avg (target: <500ms) ✅
- Cache hit rate: 85% (target: >70%) ✅
- Memory: No leaks detected ✅

## Checklist
- [x] TypeScript types added
- [x] Unit tests written (5 test cases)
- [x] Integration tests pass
- [x] Accessibility labels added
- [x] Documentation updated (ROADMAP, WORKLOG)
- [x] No breaking changes

## Related Issues
- Closes #XX (if applicable)

## Next Steps
- Phase 2: AI topic personalization (Q1 2026)
- Monitor analytics for 30 days
- Iterate based on user feedback
```

---

## Troubleshooting Guide

### Common Issues

**Issue**: Topics not loading
- Check Supabase connection: `supabase status`
- Verify RLS policies: Run SELECT query manually
- Check console logs for errors
- Clear cache: `TopicService.clearCache()`

**Issue**: Category filtering broken
- Verify `category` column in database matches `TopicCategories.ts`
- Check capitalization (should be lowercase: `family`, not `Family`)
- Test with SQL: `SELECT DISTINCT category FROM recording_topics;`

**Issue**: Analytics not firing
- Check Supabase `analytics_events` table exists
- Verify user authentication (analytics require user_id)
- Check network tab in React Native Debugger
- Enable verbose logging: `Analytics.setDebug(true);`

**Issue**: Slow performance
- Reduce fetch limit: `getTopicsByCategory(category, 20)`
- Enable caching: Verify AsyncStorage working
- Optimize images: Compress category chip icons
- Profile with React DevTools

---

## Roll-back Plan (If Things Go Wrong)

### Emergency Revert Steps

1. **Revert Git Changes**:
```bash
git reset --hard HEAD~1  # Undo last commit
git push --force origin feature/expanded-topics
```

2. **Restore Hardcoded Topics**:
- Uncomment old `DAILY_TOPICS` array in `index.tsx`
- Remove `TopicService` calls
- Remove category filtering UI

3. **Database Rollback** (if needed):
```sql
DROP TABLE IF EXISTS recording_topics CASCADE;
```

4. **Notify Users** (if already in production):
- Send in-app message: "We're improving topics, back to basics temporarily"
- ETA for fix: 24-48 hours

---

## Success Celebration Checklist

When Phase 1 is complete:

- [ ] Take screenshot of 250 topics in Supabase
- [ ] Record demo video (swipe through categories)
- [ ] Share with beta testers: "More topics are here!"
- [ ] Update LinkedIn/Twitter (if public): "Just shipped 250 memory prompts for Memoria.ai"
- [ ] Treat yourself (coffee, walk, game)
- [ ] Plan Phase 2 (AI personalization) for Q1 2026

---

**END OF IMPLEMENTATION CHECKLIST**

This checklist complements `/docs/RECORDING_TOPICS_EXPANSION_STRATEGY.md`.
Estimated completion time: 12-14 hours over 7 days.

Good luck! 🚀
