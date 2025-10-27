import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Session, User, AuthError } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { Alert } from 'react-native';
import * as SecureStore from 'expo-secure-store';

interface UserProfile {
  display_name: string | null;
  avatar_url: string | null;
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
        .select('display_name, avatar_url')
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

      // Create user profile in database
      if (data.user) {
        const { error: profileError } = await supabase
          .from('user_profiles')
          .insert({
            id: data.user.id,
            display_name: displayName || null,
            settings: {
              autoBackupEnabled: false,
              lastBackupDate: null,
              theme: 'auto',
            },
          });

        if (profileError) {
          console.error('Error creating user profile:', profileError);
        }
      }

      return { error: null };
    } catch (error) {
      console.error('Sign up error:', error);
      return { error: error as AuthError };
    }
  };

  const signIn = async (email: string, password: string) => {
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

      // Force clear local auth storage first
      console.log('AuthContext: Clearing local auth storage');
      try {
        await SecureStore.deleteItemAsync('supabase.auth.token');
      } catch (e) {
        console.log('AuthContext: Error clearing token (may not exist):', e);
      }

      // Clear local state immediately
      setUser(null);
      setSession(null);
      setUserProfile(null);
      console.log('AuthContext: Local state cleared');

      // Try to sign out from Supabase (but don't wait if it times out)
      const timeout = new Promise((resolve) => setTimeout(() => resolve({ timeout: true }), 5000));
      const signOutPromise = supabase.auth.signOut();

      const result = await Promise.race([signOutPromise, timeout]);

      if (result && 'timeout' in result) {
        console.warn('AuthContext: Sign out timed out after 5 seconds');
      } else {
        const { error } = result as any;
        if (error) {
          console.error('AuthContext: Sign out error:', error);
        } else {
          console.log('AuthContext: Sign out successful');
        }
      }
    } catch (error) {
      console.error('AuthContext: Sign out exception:', error);
      // Still clear local state even if error
      setUser(null);
      setSession(null);
      setUserProfile(null);
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
