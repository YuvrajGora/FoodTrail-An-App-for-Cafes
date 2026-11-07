import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { isSupabaseConfigured, supabase } from '../lib/supabase';
import { initializeUserPartition } from '../lib/storage';

export interface SignUpParams {
  email: string;
  password: string;
  displayName: string;
}

export interface SignInParams {
  email: string;
  password: string;
}

export interface AuthResult {
  success: boolean;
  message?: string;
  requiresEmailConfirmation?: boolean;
}

export interface AuthContextValue {
  session: Session | null;
  user: User | null;
  loading: boolean;
  isGuest: boolean;
  isConfigured: boolean;
  signUp: (params: SignUpParams) => Promise<AuthResult>;
  signIn: (params: SignInParams) => Promise<AuthResult>;
  signOut: () => Promise<{ success: boolean; message?: string }>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(() => isSupabaseConfigured);

  // Initialize session and subscribe to auth state changes
  useEffect(() => {
    let mounted = true;

    if (!isSupabaseConfigured) {
      return;
    }

    // 1. Fetch current persisted session
    supabase.auth
      .getSession()
      .then(async ({ data: { session: initialSession }, error }) => {
        if (!mounted) return;
        if (error) {
          console.warn('FoodTrail Auth: Error reading initial session:', error.message);
        }
        if (initialSession?.user?.id) {
          await initializeUserPartition(initialSession.user.id);
        }
        setSession(initialSession);
        setUser(initialSession?.user ?? null);
        setLoading(false);
      })
      .catch((err) => {
        if (!mounted) return;
        console.warn('FoodTrail Auth: Unexpected error reading session:', err);
        setLoading(false);
      });

    // 2. Listen to real-time auth events (login, logout, token refresh)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      if (!mounted) return;

      if (newSession?.user?.id) {
        await initializeUserPartition(newSession.user.id);
      }

      setSession(newSession);
      setUser(newSession?.user ?? null);
      setLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signUp = useCallback(async (params: SignUpParams): Promise<AuthResult> => {
    if (!isSupabaseConfigured) {
      return {
        success: false,
        message: 'Cloud authentication is not configured in this environment.',
      };
    }

    const trimmedEmail = params.email.trim();
    const trimmedDisplayName = params.displayName.trim();

    if (!trimmedEmail || !trimmedEmail.includes('@')) {
      return { success: false, message: 'Please provide a valid email address.' };
    }
    if (!params.password || params.password.length < 6) {
      return { success: false, message: 'Password must be at least 6 characters long.' };
    }
    if (!trimmedDisplayName) {
      return { success: false, message: 'Please provide your name or explorer handle.' };
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email: trimmedEmail,
        password: params.password,
        options: {
          data: {
            display_name: trimmedDisplayName,
            full_name: trimmedDisplayName,
            name: trimmedDisplayName,
          },
        },
      });

      if (error) {
        if (error.message.toLowerCase().includes('already registered')) {
          return {
            success: false,
            message: 'An account with this email already exists. Please log in instead.',
          };
        }
        return { success: false, message: error.message };
      }

      // If Supabase has email confirmations enabled, user exists but session is null
      if (data.user && !data.session) {
        return {
          success: true,
          requiresEmailConfirmation: true,
          message:
            'Account created successfully! Please check your email inbox to confirm your address before logging in.',
        };
      }

      if (data.user?.id) {
        await initializeUserPartition(data.user.id);
      }

      return {
        success: true,
        message: 'Welcome to FoodTrail! Your account has been created.',
      };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      return {
        success: false,
        message: `Network or server error during sign up: ${msg}`,
      };
    }
  }, []);

  const signIn = useCallback(async (params: SignInParams): Promise<AuthResult> => {
    if (!isSupabaseConfigured) {
      return {
        success: false,
        message: 'Cloud authentication is not configured in this environment.',
      };
    }

    const trimmedEmail = params.email.trim();
    if (!trimmedEmail || !trimmedEmail.includes('@')) {
      return { success: false, message: 'Please enter a valid email address.' };
    }
    if (!params.password) {
      return { success: false, message: 'Please enter your password.' };
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: trimmedEmail,
        password: params.password,
      });

      if (error) {
        const lower = error.message.toLowerCase();
        if (lower.includes('invalid login credentials') || lower.includes('invalid credentials')) {
          return {
            success: false,
            message: 'Invalid email or password. Please verify your credentials.',
          };
        }
        if (lower.includes('email not confirmed')) {
          return {
            success: false,
            message: 'Email not confirmed. Please check your inbox for the confirmation link.',
          };
        }
        return { success: false, message: error.message };
      }

      if (data.user?.id) {
        await initializeUserPartition(data.user.id);
      }

      return {
        success: true,
        message: 'Signed in successfully.',
      };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      return {
        success: false,
        message: `Network error during sign in: ${msg}`,
      };
    }
  }, []);

  const signOut = useCallback(async (): Promise<{ success: boolean; message?: string }> => {
    try {
      if (isSupabaseConfigured) {
        const { error } = await supabase.auth.signOut();
        if (error) {
          console.warn('FoodTrail Auth: Remote sign out returned error:', error.message);
        }
      }
      setSession(null);
      setUser(null);
      return { success: true, message: 'Signed out successfully. Switched to local guest mode.' };
    } catch (err) {
      setSession(null);
      setUser(null);
      const msg = err instanceof Error ? err.message : String(err);
      return { success: true, message: `Signed out locally (${msg})` };
    }
  }, []);

  const isGuest = useMemo(() => !loading && !user, [loading, user]);

  const value = useMemo(
    () => ({
      session,
      user,
      loading,
      isGuest,
      isConfigured: isSupabaseConfigured,
      signUp,
      signIn,
      signOut,
    }),
    [session, user, loading, isGuest, signUp, signIn, signOut]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
