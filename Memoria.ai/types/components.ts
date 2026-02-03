/**
 * Component Prop Types for Memoria.ai
 *
 * Defines TypeScript interfaces for all component props
 * used throughout the asymmetric navigation system.
 */

import { ViewStyle, TextStyle } from 'react-native';
import { MemoryItem, MemoryStats, SmartExportConfig } from './memory';

// Base component props
export interface BaseComponentProps {
  style?: ViewStyle;
  testID?: string;
  accessibilityLabel?: string;
  accessibilityHint?: string;
}

// Icon props for tab bar and components
export interface IconProps extends BaseComponentProps {
  name: string;
  size: number;
  color: string;
  focused?: boolean;
}

// Dashboard stats card props
export interface StatsCardProps extends BaseComponentProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: string;
  color?: string;
  onPress?: () => void;
}

// Home dashboard props
export interface HomeDashboardProps extends BaseComponentProps {
  memoryStats: MemoryStats;
  recentMemories: MemoryItem[];
  onRecordPress: () => void;
  onViewMemoriesPress: () => void;
  onSmartExportPress: () => void;
}

// Memory card props for list display
export interface MemoryCardProps extends BaseComponentProps {
  memory: MemoryItem;
  onPress: () => void;
  onLongPress?: () => void;
  showDetails?: boolean;
  isSelected?: boolean;
}

// My Life section navigation props
export interface MyLifeSectionProps extends BaseComponentProps {
  activeSection: 'memories' | 'profile';
  onSectionChange: (section: 'memories' | 'profile') => void;
  memoryCount: number;
}

// Profile section component props
export interface ProfileSectionProps extends BaseComponentProps {
  userName: string;
  userEmail?: string;
  profileImage?: string;
  onEditProfile: () => void;
  onSettingsPress: () => void;
  onFamilySharingPress: () => void;
}

// Recording controls props
export interface RecordingControlsProps extends BaseComponentProps {
  isRecording: boolean;
  duration: number;
  onStartRecording: () => void;
  onStopRecording: () => void;
  onPauseRecording: () => void;
  disabled?: boolean;
}

// Floating Action Button props
export interface FloatingActionButtonProps extends BaseComponentProps {
  onPress: () => void;
  isRecording: boolean;
  size?: 'small' | 'medium' | 'large';
  position?: 'center' | 'right';
  disabled?: boolean;
}

// Tab bar background props
export interface TabBarBackgroundProps extends BaseComponentProps {
  colorScheme: 'light' | 'dark';
  asymmetricConfig: {
    homeWidth: number;
    fabWidth: number;
    myLifeWidth: number;
  };
}

// Elderly-friendly button props
export interface ElderlyButtonProps extends BaseComponentProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  loading?: boolean;
  icon?: string;
  hapticFeedback?: boolean;
}

// Smart export modal props
export interface SmartExportModalProps extends BaseComponentProps {
  visible: boolean;
  memoryCount: number;
  onExport: (config: SmartExportConfig) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

// Settings option props
export interface SettingsOptionProps extends BaseComponentProps {
  icon: string;
  title: string;
  description?: string;
  onPress: () => void;
  rightElement?: React.ReactNode;
  disabled?: boolean;
}

// Accessibility enhancement props
export interface AccessibilityEnhancedProps {
  announceOnFocus?: boolean;
  hapticOnPress?: boolean;
  largeText?: boolean;
  highContrast?: boolean;
}

// Combined props for main screens
export interface ScreenContainerProps extends BaseComponentProps, AccessibilityEnhancedProps {
  children: React.ReactNode;
  backgroundColor?: string;
  safeArea?: boolean;
  scrollable?: boolean;
  keyboardAware?: boolean;
}