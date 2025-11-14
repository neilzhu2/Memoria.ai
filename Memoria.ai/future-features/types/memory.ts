/**
 * Memory-related TypeScript interfaces for Memoria.ai
 * Designed for elderly users with accessibility in mind
 */

export interface Memory {
  id: string;
  title: string;
  description?: string;
  audioFilePath: string;
  transcription: string;
  language: 'en' | 'zh' | 'auto';
  duration: number; // in seconds
  createdAt: Date;
  updatedAt: Date;
  tags: string[];
  isFavorite: boolean;
  isArchived: boolean;
  confidence: number; // transcription confidence 0-1
}

export interface MemoryFilters {
  searchQuery?: string;
  language?: 'en' | 'zh' | 'all';
  dateRange?: {
    start: Date;
    end: Date;
  };
  tags?: string[];
  isFavorite?: boolean;
  isArchived?: boolean;
}

export interface MemorySort {
  field: 'createdAt' | 'updatedAt' | 'title' | 'duration';
  direction: 'asc' | 'desc';
}

export interface MemoryStats {
  totalCount: number;
  totalDuration: number;
  averageDuration: number;
  favoriteCount: number;
  languageBreakdown: {
    english: number;
    chinese: number;
  };
}

export interface CreateMemoryRequest {
  title: string;
  description?: string;
  audioFilePath: string;
  language: 'en' | 'zh' | 'auto';
  tags?: string[];
}

export interface UpdateMemoryRequest {
  id: string;
  title?: string;
  description?: string;
  tags?: string[];
  isFavorite?: boolean;
  isArchived?: boolean;
}