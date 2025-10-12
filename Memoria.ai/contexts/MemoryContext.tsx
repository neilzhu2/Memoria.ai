import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { MemoryItem, MemoryStats, MemoryFilter, SmartExportConfig } from '@/types/memory';

interface MemoryContextType {
  // Memory data
  memories: MemoryItem[];
  memoryStats: MemoryStats;

  // Memory management
  addMemory: (memory: Omit<MemoryItem, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateMemory: (id: string, updates: Partial<MemoryItem>) => void;
  deleteMemory: (id: string) => void;
  getMemory: (id: string) => MemoryItem | undefined;

  // Filtering and search
  filteredMemories: MemoryItem[];
  filter: MemoryFilter;
  updateFilter: (newFilter: Partial<MemoryFilter>) => void;

  // Smart export functionality
  shouldShowExport: boolean;
  isExporting: boolean;
  exportMemoirs: (config: SmartExportConfig) => Promise<void>;

  // Progressive disclosure for elderly users
  showAdvancedFeatures: boolean;
  toggleAdvancedFeatures: () => void;

  // Loading states
  isLoading: boolean;
  error: string | null;
}

const MemoryContext = createContext<MemoryContextType | undefined>(undefined);

export function MemoryProvider({ children }: { children: ReactNode }) {
  const [memories, setMemories] = useState<MemoryItem[]>([]);
  const [filter, setFilter] = useState<MemoryFilter>({
    sortBy: 'date',
    sortOrder: 'desc'
  });
  const [showAdvancedFeatures, setShowAdvancedFeatures] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Calculate memory statistics
  const memoryStats: MemoryStats = React.useMemo(() => {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const totalDuration = memories.reduce((sum, memory) => sum + memory.duration, 0);
    const memoriesThisWeek = memories.filter(memory => memory.date >= weekAgo).length;
    const memoriesThisMonth = memories.filter(memory => memory.date >= monthAgo).length;

    // Extract favorite topics from tags
    const allTags = memories.flatMap(memory => memory.tags);
    const tagCounts = allTags.reduce((acc, tag) => {
      acc[tag] = (acc[tag] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const favoriteTopics = Object.entries(tagCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([tag]) => tag);

    return {
      totalMemories: memories.length,
      totalDuration,
      memoriesThisWeek,
      memoriesThisMonth,
      favoriteTopics,
      averageRecordingLength: memories.length > 0 ? Math.round(totalDuration / memories.length) : 0
    };
  }, [memories]);

  // Filter and sort memories
  const filteredMemories = React.useMemo(() => {
    let filtered = [...memories];

    // Apply search term filter
    if (filter.searchTerm) {
      const searchLower = filter.searchTerm.toLowerCase();
      filtered = filtered.filter(memory =>
        memory.title.toLowerCase().includes(searchLower) ||
        memory.description?.toLowerCase().includes(searchLower) ||
        memory.transcription?.toLowerCase().includes(searchLower) ||
        memory.tags.some(tag => tag.toLowerCase().includes(searchLower))
      );
    }

    // Apply date range filter
    if (filter.dateRange) {
      filtered = filtered.filter(memory =>
        memory.date >= filter.dateRange!.start &&
        memory.date <= filter.dateRange!.end
      );
    }

    // Apply tag filter
    if (filter.tags && filter.tags.length > 0) {
      filtered = filtered.filter(memory =>
        filter.tags!.some(tag => memory.tags.includes(tag))
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;

      switch (filter.sortBy) {
        case 'date':
          aValue = a.date.getTime();
          bValue = b.date.getTime();
          break;
        case 'duration':
          aValue = a.duration;
          bValue = b.duration;
          break;
        case 'title':
          aValue = a.title.toLowerCase();
          bValue = b.title.toLowerCase();
          break;
        default:
          return 0;
      }

      if (filter.sortOrder === 'desc') {
        return aValue < bValue ? 1 : aValue > bValue ? -1 : 0;
      } else {
        return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
      }
    });

    return filtered;
  }, [memories, filter]);

  // Progressive disclosure: Show export when user has 3+ memories
  const shouldShowExport = memories.length >= 3;

  // Memory management functions
  const addMemory = useCallback((memoryData: Omit<MemoryItem, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newMemory: MemoryItem = {
      ...memoryData,
      id: `memory_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    setMemories(prev => [newMemory, ...prev]);
  }, []);

  const updateMemory = useCallback((id: string, updates: Partial<MemoryItem>) => {
    setMemories(prev => prev.map(memory =>
      memory.id === id
        ? { ...memory, ...updates, updatedAt: new Date() }
        : memory
    ));
  }, []);

  const deleteMemory = useCallback((id: string) => {
    setMemories(prev => prev.filter(memory => memory.id !== id));
  }, []);

  const getMemory = useCallback((id: string) => {
    return memories.find(memory => memory.id === id);
  }, [memories]);

  const updateFilter = useCallback((newFilter: Partial<MemoryFilter>) => {
    setFilter(prev => ({ ...prev, ...newFilter }));
  }, []);

  const toggleAdvancedFeatures = useCallback(() => {
    setShowAdvancedFeatures(prev => !prev);
  }, []);

  const exportMemoirs = useCallback(async (config: SmartExportConfig) => {
    setIsExporting(true);
    setError(null);

    try {
      // Simulate export process for demo
      await new Promise(resolve => setTimeout(resolve, 2000));

      // In a real implementation, this would:
      // 1. Filter memories based on config
      // 2. Generate the memoir document
      // 3. Save or share the file
      // 4. Handle family sharing if enabled

      console.log('Export completed with config:', config);
    } catch (err) {
      setError('Failed to export memoir. Please try again.');
    } finally {
      setIsExporting(false);
    }
  }, []);

  const contextValue: MemoryContextType = {
    memories,
    memoryStats,
    addMemory,
    updateMemory,
    deleteMemory,
    getMemory,
    filteredMemories,
    filter,
    updateFilter,
    shouldShowExport,
    isExporting,
    exportMemoirs,
    showAdvancedFeatures,
    toggleAdvancedFeatures,
    isLoading,
    error
  };

  return (
    <MemoryContext.Provider value={contextValue}>
      {children}
    </MemoryContext.Provider>
  );
}

export function useMemories() {
  const context = useContext(MemoryContext);
  if (context === undefined) {
    throw new Error('useMemories must be used within a MemoryProvider');
  }
  return context;
}

// Hook for memory statistics with elderly-friendly formatting
export function useMemoryStats() {
  const { memoryStats, showAdvancedFeatures } = useMemories();

  // Format duration for elderly users (simple, clear)
  const formatDuration = (seconds: number): string => {
    if (seconds < 60) return `${seconds} seconds`;
    const minutes = Math.round(seconds / 60);
    if (minutes < 60) return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
    const hours = Math.round(minutes / 60);
    return `${hours} hour${hours !== 1 ? 's' : ''}`;
  };

  const formattedStats = {
    ...memoryStats,
    totalDurationFormatted: formatDuration(memoryStats.totalDuration),
    averageRecordingLengthFormatted: formatDuration(memoryStats.averageRecordingLength)
  };

  return {
    stats: formattedStats,
    showAdvanced: showAdvancedFeatures,
    formatDuration
  };
}