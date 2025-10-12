/**
 * Navigation Types for Memoria.ai Asymmetric Tab System
 *
 * Defines TypeScript interfaces for the 3-tab asymmetric navigation:
 * [🏠 Home] [🎙️ FAB] [📖 My Life]
 */

// Navigation types for Expo Router (uses different navigation system than @react-navigation)
// These interfaces define the parameter structure for our tab routes

// Root tab navigator param list
export type RootTabParamList = {
  home: undefined;
  mylife: {
    section?: 'memories' | 'profile';
    memoryId?: string;
  };
};

// Expo Router navigation prop types (simpler than @react-navigation)
export interface HomeScreenProps {
  // Expo Router provides navigation via hooks, not props
  // These interfaces are for future extensibility
}

export interface MyLifeScreenProps {
  // Route params come from useLocalSearchParams() hook in Expo Router
  // These interfaces are for future extensibility
}

// Tab bar configuration types
export interface TabBarConfig {
  activeTintColor: string;
  inactiveTintColor: string;
  backgroundColor: string;
  height: number;
  paddingBottom: number;
  paddingTop: number;
}

// Asymmetric tab layout types
export interface AsymmetricTabConfig {
  homeTabWidth: number;
  fabWidth: number;
  myLifeTabWidth: number;
  totalWidth: number;
}

// Tab accessibility types
export interface TabAccessibilityConfig {
  label: string;
  hint?: string;
  testID: string;
  role?: string;
}