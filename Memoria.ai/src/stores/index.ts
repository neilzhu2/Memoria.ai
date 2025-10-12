/**
 * Stores barrel export for Memoria.ai
 * Centralizes all Zustand stores for clean imports
 */

export { useMemoryStore } from './memoryStore';
export { useAudioStore } from './audioStore';
export { useUserStore } from './userStore';
export { useSettingsStore } from './settingsStore';

// Recording flow store exports
export {
  useRecordingFlow,
  useRecordingFlowState,
  useElderlySettings,
  useRecordingActions
} from '../../stores/useRecordingFlow';

// Store types exports
export type { MemoryState } from './memoryStore';
export type { AudioState } from './audioStore';
export type { UserState } from './userStore';
export type { SettingsState } from './settingsStore';

// Recording flow types
export type {
  RecordingFlowStore,
  RecordingFlowState,
  RecordingSession,
  ElderlyRecordingSettings
} from '../../types/recording-flow';

// Re-export store-related types
export * from '../types';