/**
 * Memory Store using Zustand for Memoria.ai
 * Manages memory data with optimizations for elderly users
 */

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import {
  Memory,
  MemoryFilters,
  MemorySort,
  CreateMemoryRequest,
  UpdateMemoryRequest,
  MemoryStats,
  LoadingState
} from '../types';

interface MemoryState {
  // State
  memories: Memory[];
  filteredMemories: Memory[];
  currentMemory: Memory | null;
  filters: MemoryFilters;
  sort: MemorySort;
  stats: MemoryStats | null;
  loadingState: LoadingState;

  // Actions
  setMemories: (memories: Memory[]) => void;
  addMemory: (memory: Memory) => void;
  updateMemory: (id: string, updates: Partial<Memory>) => void;
  deleteMemory: (id: string) => void;
  setCurrentMemory: (memory: Memory | null) => void;

  // Filtering and sorting
  setFilters: (filters: MemoryFilters) => void;
  setSort: (sort: MemorySort) => void;
  applyFiltersAndSort: () => void;
  clearFilters: () => void;

  // Search functionality optimized for elderly users
  searchMemories: (query: string) => void;
  getRecentMemories: (limit?: number) => Memory[];
  getFavoriteMemories: () => Memory[];

  // Statistics
  calculateStats: () => void;

  // Loading states
  setLoading: (isLoading: boolean, error?: string) => void;

  // Bulk operations
  toggleFavoriteMemory: (id: string) => void;
  archiveMemory: (id: string) => void;
  unarchiveMemory: (id: string) => void;
}

export const useMemoryStore = create<MemoryState>()(
  subscribeWithSelector((set, get) => ({
    // Initial state
    memories: [],
    filteredMemories: [],
    currentMemory: null,
    filters: {},
    sort: { field: 'createdAt', direction: 'desc' },
    stats: null,
    loadingState: { isLoading: false },

    // Basic CRUD operations
    setMemories: (memories) => {
      set({ memories });
      get().applyFiltersAndSort();
      get().calculateStats();
    },

    addMemory: (memory) => {
      const { memories } = get();
      const newMemories = [memory, ...memories];
      set({ memories: newMemories });
      get().applyFiltersAndSort();
      get().calculateStats();
    },

    updateMemory: (id, updates) => {
      const { memories } = get();
      const updatedMemories = memories.map(memory =>
        memory.id === id
          ? { ...memory, ...updates, updatedAt: new Date() }
          : memory
      );
      set({ memories: updatedMemories });
      get().applyFiltersAndSort();
      get().calculateStats();
    },

    deleteMemory: (id) => {
      const { memories, currentMemory } = get();
      const filteredMemories = memories.filter(memory => memory.id !== id);
      set({
        memories: filteredMemories,
        currentMemory: currentMemory?.id === id ? null : currentMemory
      });
      get().applyFiltersAndSort();
      get().calculateStats();
    },

    setCurrentMemory: (memory) => set({ currentMemory: memory }),

    // Filtering and sorting
    setFilters: (filters) => {
      set({ filters });
      get().applyFiltersAndSort();
    },

    setSort: (sort) => {
      set({ sort });
      get().applyFiltersAndSort();
    },

    clearFilters: () => {
      set({ filters: {} });
      get().applyFiltersAndSort();
    },

    applyFiltersAndSort: () => {
      const { memories, filters, sort } = get();
      let filtered = [...memories];

      // Apply filters
      if (filters.searchQuery) {
        const query = filters.searchQuery.toLowerCase();
        filtered = filtered.filter(memory =>
          memory.title.toLowerCase().includes(query) ||
          memory.transcription.toLowerCase().includes(query) ||
          memory.description?.toLowerCase().includes(query) ||
          memory.tags.some(tag => tag.toLowerCase().includes(query))
        );
      }

      if (filters.language && filters.language !== 'all') {
        filtered = filtered.filter(memory => memory.language === filters.language);
      }

      if (filters.dateRange) {
        filtered = filtered.filter(memory => {
          const createdAt = new Date(memory.createdAt);
          return createdAt >= filters.dateRange!.start &&
                 createdAt <= filters.dateRange!.end;
        });
      }

      if (filters.tags && filters.tags.length > 0) {
        filtered = filtered.filter(memory =>
          filters.tags!.some(tag => memory.tags.includes(tag))
        );
      }

      if (filters.isFavorite !== undefined) {
        filtered = filtered.filter(memory => memory.isFavorite === filters.isFavorite);
      }

      if (filters.isArchived !== undefined) {
        filtered = filtered.filter(memory => memory.isArchived === filters.isArchived);
      }

      // Apply sorting
      filtered.sort((a, b) => {
        const aValue = a[sort.field];
        const bValue = b[sort.field];

        if (aValue < bValue) return sort.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return sort.direction === 'asc' ? 1 : -1;
        return 0;
      });

      set({ filteredMemories: filtered });
    },

    // Search functionality
    searchMemories: (query) => {
      set({ filters: { ...get().filters, searchQuery: query } });
      get().applyFiltersAndSort();
    },

    getRecentMemories: (limit = 10) => {
      const { memories } = get();
      return memories
        .filter(memory => !memory.isArchived)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, limit);
    },

    getFavoriteMemories: () => {
      const { memories } = get();
      return memories
        .filter(memory => memory.isFavorite && !memory.isArchived)
        .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    },

    // Statistics calculation
    calculateStats: () => {
      const { memories } = get();
      const activeMemories = memories.filter(memory => !memory.isArchived);

      const stats: MemoryStats = {
        totalCount: activeMemories.length,
        totalDuration: activeMemories.reduce((sum, memory) => sum + memory.duration, 0),
        averageDuration: activeMemories.length > 0
          ? activeMemories.reduce((sum, memory) => sum + memory.duration, 0) / activeMemories.length
          : 0,
        favoriteCount: activeMemories.filter(memory => memory.isFavorite).length,
        languageBreakdown: {
          english: activeMemories.filter(memory => memory.language === 'en').length,
          chinese: activeMemories.filter(memory => memory.language === 'zh').length,
        }
      };

      set({ stats });
    },

    // Loading state management
    setLoading: (isLoading, error) => {
      set({ loadingState: { isLoading, error } });
    },

    // Quick actions for elderly users
    toggleFavoriteMemory: (id) => {
      const { memories } = get();
      const memory = memories.find(m => m.id === id);
      if (memory) {
        get().updateMemory(id, { isFavorite: !memory.isFavorite });
      }
    },

    archiveMemory: (id) => {
      get().updateMemory(id, { isArchived: true });
    },

    unarchiveMemory: (id) => {
      get().updateMemory(id, { isArchived: false });
    },
  }))
);