import Toast from 'react-native-toast-message';
import * as Haptics from 'expo-haptics';

/**
 * Toast Notification Service for Memoria.ai
 *
 * Optimized for elderly users with:
 * - Clear, encouraging language
 * - Longer display durations
 * - Haptic feedback
 * - Large text and high contrast
 *
 * Based on TOAST_NOTIFICATION_SYSTEM_DESIGN.md
 */

export type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastOptions {
  type: ToastType;
  title: string;
  message?: string;
  duration?: number; // milliseconds, 0 = no auto-dismiss
  haptic?: boolean;
  position?: 'top' | 'bottom';
}

class ToastService {
  /**
   * Show a toast notification
   */
  show(options: ToastOptions) {
    const {
      type,
      title,
      message,
      duration = 4000, // Default 4s (longer than typical 2-3s)
      haptic = true,
      position = 'bottom', // Default to bottom position
    } = options;

    // Trigger haptic feedback based on toast type
    if (haptic) {
      this.triggerHaptic(type);
    }

    Toast.show({
      type,
      text1: title,
      text2: message,
      position,
      visibilityTime: duration,
      autoHide: duration > 0,
      topOffset: 60,
      bottomOffset: 140, // Space to clear center recording button and tab bar
    });
  }

  /**
   * Success toast - for completed actions
   */
  success(title: string, message?: string, duration?: number) {
    this.show({
      type: 'success',
      title,
      message,
      duration: duration || 3000,
    });
  }

  /**
   * Error toast - for failures
   */
  error(title: string, message?: string, duration?: number) {
    this.show({
      type: 'error',
      title,
      message,
      duration: duration || 0, // Errors don't auto-dismiss by default
    });
  }

  /**
   * Warning toast - for important notices
   */
  warning(title: string, message?: string, duration?: number) {
    this.show({
      type: 'warning',
      title,
      message,
      duration: duration || 5000,
    });
  }

  /**
   * Info toast - for general information
   */
  info(title: string, message?: string, duration?: number) {
    this.show({
      type: 'info',
      title,
      message,
      duration: duration || 4000,
    });
  }

  /**
   * Hide current toast
   */
  hide() {
    Toast.hide();
  }

  /**
   * Trigger appropriate haptic feedback based on toast type
   */
  private triggerHaptic(type: ToastType) {
    switch (type) {
      case 'success':
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        break;
      case 'error':
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        break;
      case 'warning':
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        break;
      case 'info':
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        break;
    }
  }

  // ========================================
  // Pre-configured Memory Operation Toasts
  // ========================================

  memorySaved() {
    this.success('Memory Saved!', 'Your recording has been saved successfully.');
  }

  memoryUpdated() {
    this.success('Changes Saved!', 'Your memory has been updated.');
  }

  memoryDeleted() {
    this.success('Memory Deleted', 'The memory has been removed from your collection.');
  }

  memorySaveFailed(error?: string) {
    this.error(
      'Could Not Save Memory',
      error || 'Please try again. Your recording is still available.',
      0 // Don't auto-dismiss
    );
  }

  memoryUpdateFailed() {
    this.error(
      'Could Not Save Changes',
      'Please try again. Your original memory is safe.',
      0
    );
  }

  memoryDeleteFailed() {
    this.error(
      'Could Not Delete Memory',
      'Please try again.',
      0
    );
  }

  // ========================================
  // Pre-configured Recording Operation Toasts
  // ========================================

  recordingStarted() {
    this.info('Recording Started', 'Speak clearly into your device.');
  }

  recordingStopped() {
    this.info('Recording Stopped', 'Ready to save your memory.');
  }

  recordingPaused() {
    this.info('Recording Paused', 'Tap the button to continue.');
  }

  recordingResumed() {
    this.info('Recording Resumed', 'Continue speaking...');
  }

  recordingTooShort() {
    this.warning(
      'Recording Too Short',
      'Please record for at least 3 seconds.',
      5000
    );
  }

  recordingTooLong() {
    this.warning(
      'Recording Limit Reached',
      'Maximum recording time is 10 minutes. Your recording has been stopped.',
      6000
    );
  }

  recordingFailed() {
    this.error(
      'Recording Failed',
      'Please check your microphone and try again.',
      0
    );
  }

  // ========================================
  // Pre-configured Transcription Toasts
  // ========================================

  transcriptionStarted() {
    this.info('Creating Text Version', 'This will take a moment...', 3000);
  }

  transcriptionComplete() {
    this.success('Text Version Ready!', 'You can now edit the transcription.', 3000);
  }

  transcriptionFailed() {
    this.warning(
      'Could Not Create Text Version',
      'Your audio recording is safe. You can try again later.',
      5000
    );
  }

  // ========================================
  // Pre-configured Permission Toasts
  // ========================================

  microphonePermissionDenied() {
    this.error(
      'Microphone Access Needed',
      'Please allow microphone access in Settings to record memories.',
      0
    );
  }

  storagePermissionDenied() {
    this.error(
      'Storage Access Needed',
      'Please allow storage access in Settings to save memories.',
      0
    );
  }

  // ========================================
  // Pre-configured Export Toasts
  // ========================================

  exportStarted() {
    this.info('Creating Your Export', 'This may take a moment...', 3000);
  }

  exportComplete(filePath?: string) {
    this.success(
      'Export Complete!',
      'Your memories have been exported successfully.',
      4000
    );
  }

  exportFailed() {
    this.error(
      'Could Not Create Export',
      'Please try again.',
      0
    );
  }

  // ========================================
  // Pre-configured Playback Toasts
  // ========================================

  audioLoadFailed() {
    this.error(
      'Could Not Load Audio',
      'The recording file may be damaged. Please try another memory.',
      0
    );
  }

  audioPlaybackError() {
    this.error(
      'Playback Error',
      'Could not play the recording. Please try again.',
      5000
    );
  }
}

// Export singleton instance
export const toastService = new ToastService();
