import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Session, User, AuthError } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface UserProfile {
  display_name: string | null;
  avatar_url: string | null;
  date_of_birth: string | null;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  userProfile: UserProfile | null;
  loading: boolean;
  signUp: (email: string, password: string, displayName?: string) => Promise<{ error: AuthError | null }>;
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: AuthError | null }>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<{ error: Error | null }>;
  updateEmail: (newEmail: string) => Promise<{ error: AuthError | null }>;
  updatePassword: (newPassword: string) => Promise<{ error: AuthError | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch user profile from database
  const fetchUserProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('display_name, avatar_url, date_of_birth')
        .eq('id', userId)
        .single();

      if (error) {
        // If profile doesn't exist, create it
        if (error.code === 'PGRST116') {
          console.log('AuthContext: Profile does not exist, creating...');
          const { data: newProfile, error: createError } = await supabase
            .from('user_profiles')
            .insert({
              id: userId,
              display_name: null,
              avatar_url: null,
              date_of_birth: null,
              settings: {
                autoBackupEnabled: false,
                lastBackupDate: null,
                theme: 'auto',
              },
            })
            .select()
            .single();

          if (createError) {
            console.error('AuthContext: Error creating profile:', createError);
            return null;
          }

          console.log('AuthContext: Profile created successfully');
          return newProfile;
        }

        console.error('AuthContext: Error fetching user profile:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('AuthContext: Error fetching user profile:', error);
      return null;
    }
  };

  useEffect(() => {
    let mounted = true;

    // Get initial session with timeout
    const initAuth = async () => {
      try {
        console.log('AuthContext: Initializing auth...');

        // DEV-ONLY: Validate and clean AsyncStorage on Fast Refresh
        // This prevents "weird data" issues when reloading during development
        if (__DEV__) {
          try {
            const keys = await AsyncStorage.getAllKeys();
            const supabaseKeys = keys.filter(key =>
              key.includes('supabase') ||
              key.includes('@supabase') ||
              key.includes('sb-') ||
              key.startsWith('supabase.auth.token')
            );

            // Check if there are partial/corrupted keys (e.g., just token but no session)
            // This happens when Metro Fast Refresh interrupts auth operations
            if (supabaseKeys.length > 0) {
              console.log('AuthContext: [DEV] Found', supabaseKeys.length, 'Supabase keys');

              // Try to read them - if any throw errors or return malformed data, clear all
              for (const key of supabaseKeys) {
                try {
                  const value = await AsyncStorage.getItem(key);
                  if (value) {
                    // Try to parse as JSON - if it's corrupted, this will throw
                    JSON.parse(value);
                  }
                } catch (parseError) {
                  console.warn('AuthContext: [DEV] Corrupted key detected:', key);
                  console.log('AuthContext: [DEV] Clearing all Supabase keys due to corruption');
                  await AsyncStorage.multiRemove(supabaseKeys);
                  break;
                }
              }
            }
          } catch (error) {
            console.error('AuthContext: [DEV] Error validating storage:', error);
          }
        }

        const { data: { session } } = await supabase.auth.getSession();
        console.log('AuthContext: Got session:', session ? 'User logged in' : 'No session');

        if (!mounted) return;

        setSession(session);
        setUser(session?.user ?? null);

        // Fetch user profile if user exists
        if (session?.user) {
          console.log('AuthContext: Fetching user profile...');
          const profile = await fetchUserProfile(session.user.id);
          console.log('AuthContext: Got profile:', profile);
          if (mounted) {
            setUserProfile(profile);
          }
        }
      } catch (error) {
        console.error('AuthContext: Error initializing auth:', error);
      } finally {
        if (mounted) {
          console.log('AuthContext: Setting loading to false');
          setLoading(false);
        }
      }
    };

    // Set a maximum timeout of 5 seconds to prevent infinite loading
    const maxTimeout = setTimeout(() => {
      if (mounted) {
        console.warn('AuthContext: Timeout reached, forcing loading to false');
        setLoading(false);
      }
    }, 5000);

    initAuth();

    // Listen for auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      console.log('AuthContext: Auth state changed:', _event);
      if (!mounted) return;

      setSession(session);
      setUser(session?.user ?? null);

      // Fetch user profile if user exists
      if (session?.user) {
        const profile = await fetchUserProfile(session.user.id);
        if (mounted) {
          setUserProfile(profile);
        }
      } else {
        setUserProfile(null);
      }
    });

    return () => {
      mounted = false;
      clearTimeout(maxTimeout);
      subscription.unsubscribe();
    };
  }, []);

  const signUp = async (email: string, password: string, displayName?: string) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            display_name: displayName,
          },
        },
      });

      if (error) {
        return { error };
      }

      // Note: user_profiles row will be created automatically by database trigger
      // The trigger is defined in supabase-setup.sql (on_auth_user_created)
      console.log('Sign up successful, user profile will be created by database trigger');

      return { error: null };
    } catch (error) {
      console.error('Sign up error:', error);
      return { error: error as AuthError };
    }
  };

  const signIn = async (email: string, password: string) => {
    console.log('🔵 CODE VERSION: AuthContext.tsx v3.0 (Nov 4, 2025 - AsyncStorage + Clear on Logout)');
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { error };
      }

      return { error: null };
    } catch (error) {
      console.error('Sign in error:', error);
      return { error: error as AuthError };
    }
  };

  const signOut = async () => {
    try {
      console.log('AuthContext: signOut called - starting sign out process');

      // Clear local state immediately
      setUser(null);
      setSession(null);
      setUserProfile(null);
      console.log('AuthContext: Local state cleared');

      // Sign out from Supabase
      console.log('AuthContext: Calling Supabase signOut');
      const { error } = await supabase.auth.signOut();

      if (error) {
        console.error('AuthContext: Sign out error:', error);
      } else {
        console.log('AuthContext: Sign out successful');
      }

      // CRITICAL FIX: Clear Supabase AsyncStorage keys to prevent corruption
      // This prevents the "auth hangs after logout" bug
      console.log('AuthContext: Clearing Supabase AsyncStorage keys');
      try {
        const keys = await AsyncStorage.getAllKeys();
        const supabaseKeys = keys.filter(key =>
          key.includes('supabase') ||
          key.includes('@supabase') ||
          key.includes('sb-') ||
          key.startsWith('supabase.auth.token')
        );

        if (supabaseKeys.length > 0) {
          console.log(`AuthContext: Removing ${supabaseKeys.length} Supabase keys:`, supabaseKeys);
          await AsyncStorage.multiRemove(supabaseKeys);
          console.log('AuthContext: Supabase AsyncStorage cleared successfully');
        } else {
          console.log('AuthContext: No Supabase keys found to clear');
        }
      } catch (storageError) {
        // Don't fail the logout if storage clearing fails
        console.error('AuthContext: Error clearing AsyncStorage (non-critical):', storageError);
      }

      console.log('AuthContext: Sign out complete');
    } catch (error) {
      console.error('AuthContext: Sign out exception:', error);
      // Local state already cleared above
    }
  };

  const resetPassword = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: 'memoria://reset-password',
      });

      if (error) {
        return { error };
      }

      return { error: null };
    } catch (error) {
      console.error('Reset password error:', error);
      return { error: error as AuthError };
    }
  };

  const updateProfile = async (updates: Partial<UserProfile>) => {
    try {
      console.log('AuthContext: updateProfile called with:', updates);

      if (!user) {
        console.error('AuthContext: No user logged in');
        return { error: new Error('No user logged in') };
      }

      console.log('AuthContext: Updating profile for user:', user.id);

      const { data, error } = await supabase
        .from('user_profiles')
        .update(updates)
        .eq('id', user.id)
        .select();

      console.log('AuthContext: Update result:', { data, error });

      if (error) {
        console.error('AuthContext: Error updating profile:', error);
        return { error };
      }

      // Update local state
      console.log('AuthContext: Updating local state');
      setUserProfile(prev => prev ? { ...prev, ...updates } : null);

      console.log('AuthContext: Profile update complete');
      return { error: null };
    } catch (error) {
      console.error('AuthContext: Exception in updateProfile:', error);
      return { error: error as Error };
    }
  };

  const updateEmail = async (newEmail: string) => {
    try {
      const { error } = await supabase.auth.updateUser({
        email: newEmail,
      });

      if (error) {
        return { error };
      }

      return { error: null };
    } catch (error) {
      console.error('Error updating email:', error);
      return { error: error as AuthError };
    }
  };

  const updatePassword = async (newPassword: string) => {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        return { error };
      }

      return { error: null };
    } catch (error) {
      console.error('Error updating password:', error);
      return { error: error as AuthError };
    }
  };

  const value = {
    user,
    session,
    userProfile,
    loading,
    signUp,
    signIn,
    signOut,
    resetPassword,
    updateProfile,
    updateEmail,
    updatePassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
