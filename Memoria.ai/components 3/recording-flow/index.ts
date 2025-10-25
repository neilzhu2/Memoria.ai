/**
 * Recording Flow Components Export Index
 *
 * Centralized exports for all recording flow components,
 * organized for elderly-friendly memory recording experience.
 */

// ========================================
// Screen Components
// ========================================
export { RecordingFlowContainer } from './screens/RecordingFlowContainer';
export { RecordingPreparationScreen } from './screens/RecordingPreparationScreen';
export { PermissionRequestScreen } from './screens/PermissionRequestScreen';
export { AudioTestScreen } from './screens/AudioTestScreen';
export { TopicSelectionScreen } from './screens/TopicSelectionScreen';
export { ActiveRecordingScreen } from './screens/ActiveRecordingScreen';
export { PausedRecordingScreen } from './screens/PausedRecordingScreen';
export { PlaybackReviewScreen } from './screens/PlaybackReviewScreen';
export { TitleEditScreen } from './screens/TitleEditScreen';
export { CompletionScreen } from './screens/CompletionScreen';
export { SuccessScreen } from './screens/SuccessScreen';
export { ErrorRecoveryScreen } from './screens/ErrorRecoveryScreen';

// ========================================
// UI Components
// ========================================
export { ElderlyRecordingButton } from './ui/ElderlyRecordingButton';
export { AudioVisualizer } from './ui/AudioVisualizer';
export { RecordingTimer } from './ui/RecordingTimer';
export { VoiceGuidancePanel } from './ui/VoiceGuidancePanel';
export { ElderlyNavigationHeader } from './ui/ElderlyNavigationHeader';
export { AudioQualityIndicator } from './ui/AudioQualityIndicator';
export { RecordingProgressBar } from './ui/RecordingProgressBar';
export { ElderlyButton } from './ui/ElderlyButton';
export { ElderlyTextInput } from './ui/ElderlyTextInput';
export { ElderlyCard } from './ui/ElderlyCard';

// ========================================
// Feature Components
// ========================================
export { PermissionExplanation } from './features/PermissionExplanation';
export { TopicDisplay } from './features/TopicDisplay';
export { RecordingInstructions } from './features/RecordingInstructions';
export { PlaybackControls } from './features/PlaybackControls';
export { TranscriptionPreview } from './features/TranscriptionPreview';
export { SharingOptions } from './features/SharingOptions';
export { ErrorDisplay } from './features/ErrorDisplay';
export { RecoveryOptions } from './features/RecoveryOptions';

// ========================================
// Overlay Components
// ========================================
export { VoiceGuidanceOverlay } from './overlays/VoiceGuidanceOverlay';
export { ErrorBoundaryOverlay } from './overlays/ErrorBoundaryOverlay';
export { PerformanceMonitorOverlay } from './overlays/PerformanceMonitorOverlay';
export { AccessibilityOverlay } from './overlays/AccessibilityOverlay';

// ========================================
// Hook Components
// ========================================
export { useRecordingFlow } from './hooks/useRecordingFlow';
export { useElderlyOptimization } from './hooks/useElderlyOptimization';
export { useAudioFeedback } from './hooks/useAudioFeedback';
export { useVoiceGuidance } from './hooks/useVoiceGuidance';
export { useRecordingNavigation } from './hooks/useRecordingNavigation';

// ========================================
// Type Exports
// ========================================
export type {
  RecordingFlowProps,
  ElderlyRecordingProps,
  AudioFeedbackProps,
  VoiceGuidanceProps,
  NavigationProps,
} from './types';