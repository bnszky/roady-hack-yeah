import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import 'react-native-url-polyfill/auto';

import { env } from '@/lib/env';

function createSupabase(): SupabaseClient | null {
  // The template values (`https://<project-ref>.supabase.co`) are not valid hosts.
  if (!env.supabaseAnonKey || !/^https:\/\/[\w-]+\.supabase\.co\/?$/.test(env.supabaseUrl)) {
    return null;
  }
  try {
    return createClient(env.supabaseUrl, env.supabaseAnonKey, {
      auth: {
        storage: AsyncStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
      },
    });
  } catch {
    return null;
  }
}

/**
 * Supabase client (auth + storage), or null when `.env.local` has no real project.
 * Session is persisted in AsyncStorage and the access token is attached to
 * backend requests by `src/api/client.ts`. The app works without it (auth is optional).
 */
export const supabase = createSupabase();
export const isSupabaseConfigured = supabase !== null;
