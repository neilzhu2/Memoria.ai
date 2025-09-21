/**
 * Main types barrel export for Memoria.ai
 * Centralizes all TypeScript interfaces for clean imports
 */

// Memory types
export * from './memory';

// Audio types
export * from './audio';

// User and settings types
export * from './user';

// Navigation types
export * from './navigation';

// Common utility types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
}

export interface LoadingState {
  isLoading: boolean;
  error?: string;
}

// Accessibility-specific types
export interface AccessibilityConfig {
  minimumTouchTarget: number; // 60px minimum for elderly users
  fontSize: number;
  highContrast: boolean;
  reducedMotion: boolean;
}

// Performance monitoring types (important for older devices)
export interface PerformanceMetrics {
  appStartTime: number;
  memoryUsage: number;
  renderTime: number;
  audioProcessingTime: number;
}

// Error handling types
export interface AppError {
  code: string;
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: Date;
  context?: Record<string, any>;
}

// Storage types
export interface StorageConfig {
  maxMemories: number;
  maxAudioFileSize: number; // in bytes
  compressionEnabled: boolean;
  encryptionEnabled: boolean;
}