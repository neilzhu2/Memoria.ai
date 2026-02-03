import { supabase } from '@/lib/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ============================================
// Types
// ============================================

export interface TopicCategory {
  id: string;
  name: string;
  display_name: string;
  description: string | null;
  icon: string | null;
  sort_order: number;
}

export interface RecordingTopic {
  id: string;
  category_id: string | null;
  prompt: string;
  difficulty_level: 'easy' | 'medium' | 'deep';
  tags: string[];
  category?: TopicCategory; // Joined from category table
}

export interface TopicHistoryEntry {
  topic_id: string;
  shown_at: string;
  was_used: boolean;
  memory_id?: string;
}

// ============================================
// Cache Keys
// ============================================

const CACHE_KEYS = {
  CATEGORIES: '@memoria_topic_categories',
  TOPICS: '@memoria_recording_topics',
  HISTORY: '@memoria_topic_history',
  LAST_SYNC: '@memoria_topics_last_sync',
};

const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
const TOPIC_REPEAT_WINDOW_DAYS = 30;

// ============================================
// Topics Service
// ============================================

class TopicsService {
  // ----------------------------------------
  // Cache Management
  // ----------------------------------------

  private async isCacheValid(): Promise<boolean> {
    try {
      const lastSync = await AsyncStorage.getItem(CACHE_KEYS.LAST_SYNC);
      if (!lastSync) return false;

      const lastSyncTime = parseInt(lastSync, 10);
      const now = Date.now();
      return now - lastSyncTime < CACHE_DURATION;
    } catch (error) {
      console.error('Error checking cache validity:', error);
      return false;
    }
  }

  private async setCacheTimestamp(): Promise<void> {
    try {
      await AsyncStorage.setItem(CACHE_KEYS.LAST_SYNC, Date.now().toString());
    } catch (error) {
      console.error('Error setting cache timestamp:', error);
    }
  }

  // ----------------------------------------
  // Categories
  // ----------------------------------------

  async getCategories(forceRefresh = false): Promise<TopicCategory[]> {
    try {
      // Try cache first (if not forcing refresh)
      if (!forceRefresh && (await this.isCacheValid())) {
        const cached = await AsyncStorage.getItem(CACHE_KEYS.CATEGORIES);
        if (cached) {
          return JSON.parse(cached);
        }
      }

      // Fetch from Supabase
      const { data, error } = await supabase
        .from('topic_categories')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      if (error) throw error;

      const categories = data || [];

      // Cache the result
      await AsyncStorage.setItem(
        CACHE_KEYS.CATEGORIES,
        JSON.stringify(categories)
      );
      await this.setCacheTimestamp();

      return categories;
    } catch (error) {
      console.error('Error fetching categories:', error);

      // Fallback to cache on error
      const cached = await AsyncStorage.getItem(CACHE_KEYS.CATEGORIES);
      if (cached) {
        return JSON.parse(cached);
      }

      return [];
    }
  }

  // ----------------------------------------
  // Topics
  // ----------------------------------------

  async getAllTopics(forceRefresh = false): Promise<RecordingTopic[]> {
    try {
      // Try cache first
      if (!forceRefresh && (await this.isCacheValid())) {
        const cached = await AsyncStorage.getItem(CACHE_KEYS.TOPICS);
        if (cached) {
          return JSON.parse(cached);
        }
      }

      // Fetch from Supabase with category join
      const { data, error } = await supabase
        .from('recording_topics')
        .select(
          `
          *,
          category:topic_categories(*)
        `
        )
        .eq('is_active', true);

      if (error) throw error;

      const topics = (data || []).map((topic: any) => ({
        ...topic,
        category: Array.isArray(topic.category)
          ? topic.category[0]
          : topic.category,
      }));

      // Cache the result
      await AsyncStorage.setItem(CACHE_KEYS.TOPICS, JSON.stringify(topics));
      await this.setCacheTimestamp();

      return topics;
    } catch (error) {
      console.error('Error fetching topics:', error);

      // Fallback to cache
      const cached = await AsyncStorage.getItem(CACHE_KEYS.TOPICS);
      if (cached) {
        return JSON.parse(cached);
      }

      return [];
    }
  }

  async getTopicsByCategory(categoryId: string): Promise<RecordingTopic[]> {
    const allTopics = await this.getAllTopics();
    return allTopics.filter((topic) => topic.category_id === categoryId);
  }

  // ----------------------------------------
  // Topic History (Local Only for Now)
  // ----------------------------------------

  async getTopicHistory(): Promise<TopicHistoryEntry[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const historyKey = `${CACHE_KEYS.HISTORY}_${user.id}`;
      const cached = await AsyncStorage.getItem(historyKey);
      return cached ? JSON.parse(cached) : [];
    } catch (error) {
      console.error('Error fetching topic history:', error);
      return [];
    }
  }

  async addToHistory(
    topicId: string,
    wasUsed = false,
    memoryId?: string
  ): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const historyKey = `${CACHE_KEYS.HISTORY}_${user.id}`;
      const history = await this.getTopicHistory();

      const newEntry: TopicHistoryEntry = {
        topic_id: topicId,
        shown_at: new Date().toISOString(),
        was_used: wasUsed,
        memory_id: memoryId,
      };

      // Add to local history
      const updatedHistory = [newEntry, ...history];
      await AsyncStorage.setItem(historyKey, JSON.stringify(updatedHistory));

      // Also save to Supabase for persistence
      await supabase.from('user_topic_history').insert({
        user_id: user.id,
        topic_id: topicId,
        shown_at: newEntry.shown_at,
        was_used: wasUsed,
        memory_id: memoryId,
      });
    } catch (error) {
      console.error('Error adding to topic history:', error);
    }
  }

  async getRecentlyShownTopicIds(): Promise<string[]> {
    try {
      const history = await this.getTopicHistory();
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - TOPIC_REPEAT_WINDOW_DAYS);

      return history
        .filter((entry) => new Date(entry.shown_at) > cutoffDate)
        .map((entry) => entry.topic_id);
    } catch (error) {
      console.error('Error getting recently shown topics:', error);
      return [];
    }
  }

  // ----------------------------------------
  // Get Next Topic (Smart Selection)
  // ----------------------------------------

  async getNextTopic(categoryId?: string): Promise<RecordingTopic | null> {
    try {
      // Get all topics (filtered by category if specified)
      const allTopics = categoryId
        ? await this.getTopicsByCategory(categoryId)
        : await this.getAllTopics();

      if (allTopics.length === 0) return null;

      // Get recently shown topic IDs
      const recentlyShown = await this.getRecentlyShownTopicIds();

      // Filter out recently shown topics
      let availableTopics = allTopics.filter(
        (topic) => !recentlyShown.includes(topic.id)
      );

      // If all topics have been shown recently, reset and use all topics
      if (availableTopics.length === 0) {
        availableTopics = allTopics;
      }

      // Randomly select a topic
      const randomIndex = Math.floor(Math.random() * availableTopics.length);
      const selectedTopic = availableTopics[randomIndex];

      // Track that this topic was shown
      await this.addToHistory(selectedTopic.id, false);

      return selectedTopic;
    } catch (error) {
      console.error('Error getting next topic:', error);
      return null;
    }
  }

  async getNextTopics(
    count: number,
    categoryId?: string
  ): Promise<RecordingTopic[]> {
    try {
      const allTopics = categoryId
        ? await this.getTopicsByCategory(categoryId)
        : await this.getAllTopics();

      if (allTopics.length === 0) return [];

      const recentlyShown = await this.getRecentlyShownTopicIds();

      // Filter out recently shown topics
      let availableTopics = allTopics.filter(
        (topic) => !recentlyShown.includes(topic.id)
      );

      // If not enough topics, add back recently shown ones
      if (availableTopics.length < count) {
        availableTopics = allTopics;
      }

      // Shuffle and take requested count
      const shuffled = [...availableTopics].sort(() => Math.random() - 0.5);
      const selectedTopics = shuffled.slice(0, count);

      // Track all selected topics as shown
      for (const topic of selectedTopics) {
        await this.addToHistory(topic.id, false);
      }

      return selectedTopics;
    } catch (error) {
      console.error('Error getting next topics:', error);
      return [];
    }
  }

  // ----------------------------------------
  // Mark Topic as Used
  // ----------------------------------------

  async markTopicAsUsed(topicId: string, memoryId: string): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Update local history
      const historyKey = `${CACHE_KEYS.HISTORY}_${user.id}`;
      const history = await this.getTopicHistory();

      const updatedHistory = history.map((entry) => {
        if (entry.topic_id === topicId && !entry.memory_id) {
          return { ...entry, was_used: true, memory_id: memoryId };
        }
        return entry;
      });

      await AsyncStorage.setItem(historyKey, JSON.stringify(updatedHistory));

      // Update Supabase
      await supabase
        .from('user_topic_history')
        .update({ was_used: true, memory_id: memoryId })
        .eq('user_id', user.id)
        .eq('topic_id', topicId)
        .is('memory_id', null);
    } catch (error) {
      console.error('Error marking topic as used:', error);
    }
  }

  // ----------------------------------------
  // Sync History from Supabase
  // ----------------------------------------

  async syncHistoryFromSupabase(): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('user_topic_history')
        .select('*')
        .eq('user_id', user.id)
        .order('shown_at', { ascending: false })
        .limit(100); // Only sync last 100 entries

      if (error) throw error;

      const historyEntries: TopicHistoryEntry[] = (data || []).map(
        (entry: any) => ({
          topic_id: entry.topic_id,
          shown_at: entry.shown_at,
          was_used: entry.was_used,
          memory_id: entry.memory_id,
        })
      );

      const historyKey = `${CACHE_KEYS.HISTORY}_${user.id}`;
      await AsyncStorage.setItem(historyKey, JSON.stringify(historyEntries));
    } catch (error) {
      console.error('Error syncing history from Supabase:', error);
    }
  }

  // ----------------------------------------
  // Force Refresh All Data
  // ----------------------------------------

  async refreshAllData(): Promise<void> {
    try {
      await Promise.all([
        this.getCategories(true),
        this.getAllTopics(true),
        this.syncHistoryFromSupabase(),
      ]);
    } catch (error) {
      console.error('Error refreshing all data:', error);
    }
  }

  // ----------------------------------------
  // Clear Cache (for testing/debugging)
  // ----------------------------------------

  async clearCache(): Promise<void> {
    try {
      await AsyncStorage.multiRemove([
        CACHE_KEYS.CATEGORIES,
        CACHE_KEYS.TOPICS,
        CACHE_KEYS.LAST_SYNC,
      ]);
    } catch (error) {
      console.error('Error clearing cache:', error);
    }
  }
}

// ============================================
// Export Singleton Instance
// ============================================

const topicsService = new TopicsService();
export default topicsService;
