/**
 * Memory Data Types for Memoria.ai
 *
 * Defines TypeScript interfaces for memory management,
 * smart export functionality, and memory statistics.
 */

// Core memory data structure
export interface MemoryItem {
  id: string;
  title: string;
  description?: string;
  date: Date;
  duration: number; // in seconds
  audioPath?: string;
  transcription?: string;
  tags: string[];
  isShared: boolean;
  familyMembers: string[];
  createdAt: Date;
  updatedAt: Date;
}

// Memory statistics for dashboard
export interface MemoryStats {
  totalMemories: number;
  totalDuration: number; // in seconds
  memoriesThisWeek: number;
  memoriesThisMonth: number;
  favoriteTopics: string[];
  averageRecordingLength: number;
}

// Smart export configuration
export interface SmartExportConfig {
  type: 'full' | 'recent' | 'custom';
  dateRange?: {
    start: Date;
    end: Date;
  };
  includeAudio: boolean;
  includeTranscriptions: boolean;
  format: 'pdf' | 'docx' | 'html';
  familySharing: boolean;
}

// Smart export props for components
export interface SmartExportProps {
  memoryCount: number;
  isVisible: boolean;
  isGenerating: boolean;
  onExport: (config: SmartExportConfig) => Promise<void>;
  onCancel: () => void;
}

// Memory list filtering and sorting
export interface MemoryFilter {
  searchTerm?: string;
  dateRange?: {
    start: Date;
    end: Date;
  };
  tags?: string[];
  sortBy: 'date' | 'duration' | 'title';
  sortOrder: 'asc' | 'desc';
}

// Memory list component props
export interface MemoryListProps {
  memories: MemoryItem[];
  filter: MemoryFilter;
  onFilterChange: (filter: MemoryFilter) => void;
  onMemorySelect: (memory: MemoryItem) => void;
  onMemoryDelete: (memoryId: string) => void;
  loading: boolean;
}

// Recording session data
export interface RecordingSession {
  id: string;
  startTime: Date;
  endTime?: Date;
  duration: number;
  topic: string;
  status: 'preparing' | 'recording' | 'paused' | 'completed' | 'cancelled';
  filePath?: string;
}

// Progressive disclosure state for elderly users
export interface ProgressiveDisclosureState {
  showAdvancedOptions: boolean;
  showDetailedStats: boolean;
  showTechnicalInfo: boolean;
  helpLevel: 'basic' | 'intermediate' | 'advanced';
}