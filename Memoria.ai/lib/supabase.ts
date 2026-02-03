import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Supabase configuration from environment variables
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

// Create Supabase client with AsyncStorage directly (official Supabase React Native configuration)
// This is the recommended stable configuration from Supabase docs
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
  global: {
    headers: {
      'X-Client-Info': 'supabase-js-react-native',
    },
  },
  db: {
    schema: 'public',
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
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
