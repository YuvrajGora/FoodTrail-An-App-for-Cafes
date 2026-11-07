import 'react-native-url-polyfill/auto';
import { AppState, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../types/database';

const rawUrl = process.env.EXPO_PUBLIC_SUPABASE_URL?.trim() || '';
const rawAnonKey = (
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  ''
).trim();

// Determine if valid production or preview credentials have been supplied
export const isSupabaseConfigured: boolean = Boolean(
  rawUrl &&
  rawAnonKey &&
  rawUrl.startsWith('https://') &&
  !rawUrl.includes('<your-project-ref>') &&
  !rawAnonKey.includes('<your-anon-api-key>')
);

export const supabaseUrl: string = isSupabaseConfigured ? rawUrl : 'https://placeholder.supabase.co';
const supabaseKey: string = isSupabaseConfigured ? rawAnonKey : 'placeholder-anon-key';

/**
 * Singleton Supabase Client instance typed with generated PostgreSQL 17 database schema.
 * Uses AsyncStorage for session persistence and disables URL session detection (standard for Expo).
 */
export const supabase: SupabaseClient<Database> = createClient<Database>(supabaseUrl, supabaseKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: isSupabaseConfigured,
    persistSession: isSupabaseConfigured,
    detectSessionInUrl: false,
  },
});

// Automatically start/stop JWT token refresh when the app transitions between foreground and background.
if (Platform.OS !== 'web' && isSupabaseConfigured) {
  AppState.addEventListener('change', (state) => {
    if (state === 'active') {
      supabase.auth.startAutoRefresh();
    } else {
      supabase.auth.stopAutoRefresh();
    }
  });
}

/**
 * Read-only connectivity check to verify client communication with Supabase Data API (public.places).
 * Completely non-destructive: only queries count from public catalogue.
 */
export async function testSupabaseConnection(): Promise<{
  ok: boolean;
  message: string;
  placeCount?: number;
}> {
  if (!isSupabaseConfigured) {
    return {
      ok: false,
      message: 'Supabase credentials are not configured in environment (EXPO_PUBLIC_SUPABASE_URL / EXPO_PUBLIC_SUPABASE_ANON_KEY). Running in guest mode.',
    };
  }

  try {
    const { count, error } = await supabase
      .from('places')
      .select('*', { count: 'exact', head: true });

    if (error) {
      return {
        ok: false,
        message: `Supabase connection query failed: ${error.message} (code: ${error.code})`,
      };
    }

    return {
      ok: true,
      message: 'Successfully connected to Supabase Data API.',
      placeCount: count ?? undefined,
    };
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return {
      ok: false,
      message: `Network or runtime error during Supabase connection test: ${errorMsg}`,
    };
  }
}
