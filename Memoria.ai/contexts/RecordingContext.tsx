import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { MemoryItem, MemoryStats, SmartExportConfig } from '@/types/memory';

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

  // Load memories from storage on app start
  useEffect(() => {
    loadMemoriesFromStorage();
  }, []);

  // Update stats when memories change
  useEffect(() => {
    refreshStats();
  }, [memories]);

  const loadMemoriesFromStorage = async () => {
    try {
      const storedMemories = await AsyncStorage.getItem(STORAGE_KEYS.MEMORIES);
      const storedCount = await AsyncStorage.getItem(STORAGE_KEYS.MEMORY_COUNT);

      if (storedMemories) {
        const parsedMemories: MemoryItem[] = JSON.parse(storedMemories).map((memory: any) => ({
          ...memory,
          date: new Date(memory.date),
          createdAt: new Date(memory.createdAt),
          updatedAt: new Date(memory.updatedAt),
        }));
        setMemories(parsedMemories);
      }

      if (storedCount) {
        setMemoryCount(parseInt(storedCount, 10));
      }
    } catch (error) {
      console.error('Error loading memories from storage:', error);
    }
  };

  const saveMemoriesToStorage = async (updatedMemories: MemoryItem[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.MEMORIES, JSON.stringify(updatedMemories));
      await AsyncStorage.setItem(STORAGE_KEYS.MEMORY_COUNT, updatedMemories.length.toString());
    } catch (error) {
      console.error('Error saving memories to storage:', error);
    }
  };

  const triggerRecording = (theme?: { id: string; title: string }) => {
    // Store the theme if provided
    setSelectedThemeFromTrigger(theme);
    // Increment trigger to signal a new recording should start
    setRecordingTrigger(prev => prev + 1);
  };

  const addMemory = async (memoryData: Omit<MemoryItem, 'id' | 'createdAt' | 'updatedAt'>): Promise<MemoryItem> => {
    const newMemory: MemoryItem = {
      ...memoryData,
      id: `memory-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const updatedMemories = [newMemory, ...memories];
    setMemories(updatedMemories);
    setMemoryCount(updatedMemories.length);
    await saveMemoriesToStorage(updatedMemories);

    return newMemory;
  };

  const removeMemory = async (memoryId: string) => {
    const updatedMemories = memories.filter(memory => memory.id !== memoryId);
    setMemories(updatedMemories);
    setMemoryCount(updatedMemories.length);
    await saveMemoriesToStorage(updatedMemories);
  };

  const updateMemory = async (memoryId: string, updates: Partial<MemoryItem>) => {
    setMemories(currentMemories => {
      const updatedMemories = currentMemories.map(memory =>
        memory.id === memoryId
          ? { ...memory, ...updates, updatedAt: new Date() }
          : memory
      );
      saveMemoriesToStorage(updatedMemories);
      return updatedMemories;
    });
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