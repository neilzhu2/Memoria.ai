import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

// Supabase configuration from environment variables
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

// Custom storage implementation using expo-secure-store for auth tokens
const ExpoSecureStoreAdapter = {
  getItem: async (key: string) => {
    if (Platform.OS === 'web') {
      // Fallback to localStorage for web
      if (typeof localStorage !== 'undefined') {
        return localStorage.getItem(key);
      }
      return null;
    }
    return await SecureStore.getItemAsync(key);
  },
  setItem: async (key: string, value: string) => {
    if (Platform.OS === 'web') {
      // Fallback to localStorage for web
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(key, value);
      }
      return;
    }
    await SecureStore.setItemAsync(key, value);
  },
  removeItem: async (key: string) => {
    if (Platform.OS === 'web') {
      // Fallback to localStorage for web
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem(key);
      }
      return;
    }
    await SecureStore.deleteItemAsync(key);
  },
};

// Create Supabase client with secure storage for auth tokens
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: ExpoSecureStoreAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// Database types for type safety
export interface UserProfile {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  settings: {
    autoBackupEnabled: boolean;
    lastBackupDate: string | null;
    theme: 'light' | 'dark' | 'auto';
  };
  created_at: string;
  updated_at: string;
}

export interface Memory {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  transcription: string | null;
  audio_url: string | null;
  duration: number | null;
  date: string;
  theme: string | null;
  is_shared: boolean;
  created_at: string;
  updated_at: string;
}
