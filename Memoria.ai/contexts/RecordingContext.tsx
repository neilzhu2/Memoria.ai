import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';

import { MemoryItem, MemoryStats, SmartExportConfig } from '@/types/memory';
import { supabase } from '@/lib/supabase';
import { useAuth } from './AuthContext';
import Analytics from '@/services/analytics';
import topicsService from '@/services/topics';

interface RecordingContextType {
  // Recording controls
  triggerRecording: (theme?: { id: string; title: string }) => void;
  isRecording: boolean;
  setIsRecording: (recording: boolean) => void;
  recordingTrigger: number;
  selectedThemeFromTrigger?: { id: string; title: string };

  // Memory management
  memoryCount: number;
  memories: MemoryItem[];
  addMemory: (memory: Omit<MemoryItem, 'id' | 'createdAt' | 'updatedAt'>) => Promise<MemoryItem>;
  removeMemory: (memoryId: string) => Promise<void>;
  updateMemory: (memoryId: string, updates: Partial<MemoryItem>) => Promise<void>;

  // Memory statistics
  memoryStats: MemoryStats;
  refreshStats: () => void;

  // Smart export
  generateSmartExport: (config: SmartExportConfig) => Promise<{ success: boolean; filePath?: string; error?: string }>;
  isExporting: boolean;
}

const RecordingContext = createContext<RecordingContextType | undefined>(undefined);

const STORAGE_KEYS = {
  MEMORIES: '@memoria_memories',
  MEMORY_COUNT: '@memoria_memory_count',
};

export function RecordingProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth(); // Get current user from AuthContext
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTrigger, setRecordingTrigger] = useState(0);
  const [selectedThemeFromTrigger, setSelectedThemeFromTrigger] = useState<{ id: string; title: string } | undefined>();
  const [memoryCount, setMemoryCount] = useState(0);
  const [memories, setMemories] = useState<MemoryItem[]>([]);
  const [memoryStats, setMemoryStats] = useState<MemoryStats>({
    totalMemories: 0,
    totalDuration: 0,
    memoriesThisWeek: 0,
    memoriesThisMonth: 0,
    favoriteTopics: [],
    averageRecordingLength: 0,
  });
  const [isExporting, setIsExporting] = useState(false);

  // Load memories from Supabase when user changes
  useEffect(() => {
    if (user) {
      console.log('RecordingContext: User logged in, loading memories for user:', user.id);
      loadMemoriesFromSupabase(user.id);
    } else {
      console.log('RecordingContext: No user, clearing all memories');
      // Clear all memories when user logs out
      setMemories([]);
      setMemoryCount(0);
      setMemoryStats({
        totalMemories: 0,
        totalDuration: 0,
        memoriesThisWeek: 0,
        memoriesThisMonth: 0,
        favoriteTopics: [],
        averageRecordingLength: 0,
      });
    }
  }, [user]); // Re-run when user changes (login/logout)

  // Update stats when memories change
  useEffect(() => {
    refreshStats();
  }, [memories]);

  // Load memories from Supabase for specific user
  const loadMemoriesFromSupabase = async (userId: string) => {
    try {
      console.log('[loadMemories] START - Loading memories from Supabase for user:', userId);

      // Check if user is authenticated
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      console.log('[loadMemories] Session check:', {
        hasSession: !!session,
        sessionError: sessionError?.message,
        userId: session?.user?.id,
      });

      if (!session) {
        console.error('[loadMemories] ERROR: No active session found');
        return;
      }

      console.log('[loadMemories] Preparing SELECT query...');

      const startTime = Date.now();

      // Create the SELECT query with timeout, including category information
      const selectPromise = supabase
        .from('memories')
        .select(`
          *,
          recording_topics:topic_id (
            id,
            category:topic_categories (
              id,
              name,
              display_name,
              icon
            )
          )
        `)
        .eq('user_id', userId)  // Filter by user_id
        .order('created_at', { ascending: false });

      // Add a 30 second timeout
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Supabase SELECT timeout after 30 seconds')), 30000)
      );

      console.log('[loadMemories] Executing SELECT query (30s timeout)...');
      const { data, error } = await Promise.race([selectPromise, timeoutPromise]) as any;

      const endTime = Date.now();
      console.log(`[loadMemories] SELECT query completed in ${endTime - startTime}ms`);

      if (error) {
        console.error('[loadMemories] Supabase error:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
          fullError: JSON.stringify(error),
        });
        return;
      }

      console.log('[loadMemories] SUCCESS - Loaded', data?.length || 0, 'memories from Supabase');

      if (data) {
        console.log('[loadMemories] Transforming data to MemoryItem format...');
        // Transform database records to MemoryItem format
        const transformedMemories: MemoryItem[] = data.map((record: any) => {
          // Extract category from nested recording_topics relationship
          const category = record.recording_topics?.category
            ? (Array.isArray(record.recording_topics.category)
              ? record.recording_topics.category[0]
              : record.recording_topics.category)
            : null;

          return {
            id: record.id,
            title: record.title,
            description: record.description || '',
            audioPath: record.audio_url,  // Map audio_url to audioPath
            duration: record.duration,
            date: new Date(record.date),
            tags: record.theme ? [record.theme] : [],  // Map theme to tags array
            transcription: record.transcription,
            isShared: record.is_shared || false,
            familyMembers: [],  // Not stored in DB yet
            createdAt: new Date(record.created_at),
            updatedAt: new Date(record.updated_at),
            topicId: record.topic_id || undefined,
            category: category ? {
              id: category.id,
              name: category.name,
              display_name: category.display_name,
              icon: category.icon,
            } : undefined,
          };
        });

        console.log('[loadMemories] Setting state with', transformedMemories.length, 'memories');
        setMemories(transformedMemories);
        setMemoryCount(transformedMemories.length);
        console.log('[loadMemories] COMPLETE - State updated successfully');
      }
    } catch (error) {
      console.error('[loadMemories] EXCEPTION caught:', {
        error,
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      });
    }
  };

  const triggerRecording = (theme?: { id: string; title: string }) => {
    // Store the theme if provided
    setSelectedThemeFromTrigger(theme);
    // Increment trigger to signal a new recording should start
    setRecordingTrigger(prev => prev + 1);
  };

  const addMemory = async (memoryData: Omit<MemoryItem, 'id' | 'createdAt' | 'updatedAt'>): Promise<MemoryItem> => {
    console.log('[addMemory] START - Adding memory to Supabase');
    console.log('[addMemory] Memory data:', {
      title: memoryData.title,
      duration: memoryData.duration,
      audioPath: memoryData.audioPath?.substring(0, 50) + '...',
      hasDescription: !!memoryData.description,
      tagsCount: memoryData.tags?.length || 0,
    });

    if (!user) {
      console.error('[addMemory] ERROR: No user logged in');
      throw new Error('No user logged in');
    }

    console.log('[addMemory] User ID:', user.id);

    try {
      console.log('[addMemory] Preparing Supabase insert...');
      const insertData = {
        user_id: user.id,
        title: memoryData.title,
        description: memoryData.description || null,
        audio_url: memoryData.audioPath,  // Map audioPath to audio_url for database
        duration: memoryData.duration,
        date: memoryData.date.toISOString(),
        transcription: memoryData.transcription || null,
        theme: memoryData.tags?.[0] || null,  // Use first tag as theme
        is_shared: memoryData.isShared || false,
        topic_id: memoryData.topicId || null,  // Save the topic ID for auto-dismiss
      };
      console.log('[addMemory] Insert data prepared:', {
        ...insertData,
        audio_url: insertData.audio_url?.substring(0, 50) + '...',
      });

      console.log('[addMemory] Calling Supabase insert...');
      const startTime = Date.now();

      // Insert into Supabase with timeout
      // Include category data in the response
      const insertPromise = supabase
        .from('memories')
        .insert(insertData)
        .select(`
          *,
          recording_topics:topic_id (
            id,
            category:topic_categories (
              id,
              name,
              display_name,
              icon
            )
          )
        `)
        .single();

      // Add a 30 second timeout
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Supabase insert timeout after 30 seconds')), 30000)
      );

      console.log('[addMemory] Waiting for Supabase response (30s timeout)...');
      const { data, error } = await Promise.race([insertPromise, timeoutPromise]) as any;

      const endTime = Date.now();
      console.log(`[addMemory] Supabase insert completed in ${endTime - startTime}ms`);

      if (error) {
        console.error('[addMemory] Supabase error:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
          fullError: JSON.stringify(error),
        });
        console.error('[addMemory] Insert data that caused error:', insertData);
        throw error;
      }

      if (!data) {
        console.error('[addMemory] ERROR: No data returned from Supabase');
        throw new Error('No data returned from Supabase');
      }

      console.log('[addMemory] Memory inserted successfully:', {
        id: data.id,
        title: data.title,
        created_at: data.created_at,
      });

      // Transform to MemoryItem and add to local state
      console.log('[addMemory] Transforming to MemoryItem...');

      // Extract category from nested recording_topics relationship
      const category = data.recording_topics?.category
        ? (Array.isArray(data.recording_topics.category)
          ? data.recording_topics.category[0]
          : data.recording_topics.category)
        : null;

      const newMemory: MemoryItem = {
        id: data.id,
        title: data.title,
        description: data.description || '',
        audioPath: data.audio_url,  // Map audio_url to audioPath for MemoryItem
        duration: data.duration,
        date: new Date(data.date),
        tags: data.theme ? [data.theme] : [],  // Map theme to tags array
        transcription: data.transcription,
        isShared: data.is_shared || false,
        familyMembers: [],  // Not stored in DB yet
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at),
        topicId: data.topic_id || undefined,  // Include topic ID
        category: category ? {
          id: category.id,
          name: category.name,
          display_name: category.display_name,
          icon: category.icon,
        } : undefined,
      };

      console.log('[addMemory] Updating local state...');
      const updatedMemories = [newMemory, ...memories];
      setMemories(updatedMemories);
      setMemoryCount(updatedMemories.length);

      console.log('[addMemory] SUCCESS - Memory saved and state updated');
      console.log('[addMemory] Total memories now:', updatedMemories.length);

      // Track analytics
      Analytics.track('recording_saved', {
        duration_seconds: data.duration,
        has_transcription: !!data.transcription,
        has_theme: !!data.theme,
      });

      // Mark topic as used for history tracking
      if (data.topic_id) {
        console.log('[addMemory] Marking topic as used:', data.topic_id);
        await topicsService.markTopicAsUsed(data.topic_id, data.id);
      }

      return newMemory;
    } catch (error) {
      console.error('[addMemory] EXCEPTION caught:', {
        error,
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      });
      throw error;
    }
  };

  const removeMemory = async (memoryId: string) => {
    if (!user) {
      throw new Error('No user logged in');
    }

    try {
      console.log('RecordingContext: Deleting memory from Supabase:', memoryId);

      // Find the memory to get the audio path for file deletion
      const memory = memories.find(m => m.id === memoryId);

      // Delete audio file from filesystem if it exists
      if (memory?.audioPath) {
        try {
          const fileInfo = await FileSystem.getInfoAsync(memory.audioPath);
          if (fileInfo.exists) {
            console.log('RecordingContext: Deleting audio file:', memory.audioPath);
            await FileSystem.deleteAsync(memory.audioPath);
            console.log('RecordingContext: Audio file deleted successfully');
          }
        } catch (fileError) {
          console.error('RecordingContext: Error deleting audio file:', fileError);
          // Continue with memory deletion even if file deletion fails
        }
      }

      // Delete from Supabase
      const { error } = await supabase
        .from('memories')
        .delete()
        .eq('id', memoryId)
        .eq('user_id', user.id);  // Ensure user can only delete their own memories

      if (error) {
        console.error('RecordingContext: Error deleting memory:', error);
        throw error;
      }

      console.log('RecordingContext: Memory deleted successfully from Supabase');

      // Update local state
      const updatedMemories = memories.filter(memory => memory.id !== memoryId);
      setMemories(updatedMemories);
      setMemoryCount(updatedMemories.length);
    } catch (error) {
      console.error('RecordingContext: Exception deleting memory:', error);
      throw error;
    }
  };

  const updateMemory = async (memoryId: string, updates: Partial<MemoryItem>) => {
    if (!user) {
      throw new Error('No user logged in');
    }

    try {
      console.log('RecordingContext: Updating memory in Supabase:', memoryId);

      // Prepare update data (transform MemoryItem fields to database columns)
      const dbUpdates: any = {};
      if (updates.title !== undefined) dbUpdates.title = updates.title;
      if (updates.description !== undefined) dbUpdates.description = updates.description;
      if (updates.audioPath !== undefined) dbUpdates.audio_url = updates.audioPath;  // Map audioPath to audio_url
      if (updates.duration !== undefined) dbUpdates.duration = updates.duration;
      if (updates.date !== undefined) dbUpdates.date = updates.date.toISOString();
      if (updates.tags !== undefined) dbUpdates.theme = updates.tags[0] || null;  // Map first tag to theme
      if (updates.transcription !== undefined) dbUpdates.transcription = updates.transcription;
      if (updates.isShared !== undefined) dbUpdates.is_shared = updates.isShared;

      // Update in Supabase
      const { error } = await supabase
        .from('memories')
        .update(dbUpdates)
        .eq('id', memoryId)
        .eq('user_id', user.id);  // Ensure user can only update their own memories

      if (error) {
        console.error('RecordingContext: Error updating memory:', error);
        throw error;
      }

      console.log('RecordingContext: Memory updated successfully in Supabase');

      // Update local state
      setMemories(currentMemories => {
        return currentMemories.map(memory =>
          memory.id === memoryId
            ? { ...memory, ...updates, updatedAt: new Date() }
            : memory
        );
      });
    } catch (error) {
      console.error('RecordingContext: Exception updating memory:', error);
      throw error;
    }
  };

  const refreshStats = () => {
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const totalDuration = memories.reduce((sum, memory) => sum + memory.duration, 0);
    const memoriesThisWeek = memories.filter(memory => memory.date >= oneWeekAgo).length;
    const memoriesThisMonth = memories.filter(memory => memory.date >= oneMonthAgo).length;

    // Calculate favorite topics
    const tagFrequency: { [key: string]: number } = {};
    memories.forEach(memory => {
      memory.tags.forEach(tag => {
        tagFrequency[tag] = (tagFrequency[tag] || 0) + 1;
      });
    });

    const favoriteTopics = Object.entries(tagFrequency)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([topic]) => topic);

    const averageRecordingLength = memories.length > 0 ? Math.round(totalDuration / memories.length) : 0;

    setMemoryStats({
      totalMemories: memories.length,
      totalDuration,
      memoriesThisWeek,
      memoriesThisMonth,
      favoriteTopics,
      averageRecordingLength,
    });
  };

  const generateSmartExport = async (config: SmartExportConfig): Promise<{ success: boolean; filePath?: string; error?: string }> => {
    setIsExporting(true);

    try {
      // Simulate export generation delay
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Filter memories based on config
      let memoriesToExport = memories;

      if (config.type === 'recent') {
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        memoriesToExport = memories.filter(memory => memory.date >= thirtyDaysAgo);
      } else if (config.type === 'custom' && config.dateRange) {
        memoriesToExport = memories.filter(
          memory => memory.date >= config.dateRange!.start && memory.date <= config.dateRange!.end
        );
      }

      // For demo purposes, we'll just return a success response
      // In a real app, this would generate the actual file
      const fileName = `memoria-export-${Date.now()}.${config.format}`;
      const filePath = `/exports/${fileName}`;

      setIsExporting(false);
      return {
        success: true,
        filePath,
      };
    } catch (error) {
      setIsExporting(false);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Export failed',
      };
    }
  };

  return (
    <RecordingContext.Provider
      value={{
        // Recording controls
        triggerRecording,
        isRecording,
        setIsRecording,
        recordingTrigger,
        selectedThemeFromTrigger,

        // Memory management
        memoryCount,
        memories,
        addMemory,
        removeMemory,
        updateMemory,

        // Memory statistics
        memoryStats,
        refreshStats,

        // Smart export
        generateSmartExport,
        isExporting,
      }}
    >
      {children}
    </RecordingContext.Provider>
  );
}

export function useRecording() {
  const context = useContext(RecordingContext);
  if (context === undefined) {
    throw new Error('useRecording must be used within a RecordingProvider');
  }
  return context;
}