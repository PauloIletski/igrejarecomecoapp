import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

import { env } from '@/lib/env';

export const supabase = env.isSupabaseConfigured
  ? createClient(env.supabaseUrl, env.supabasePublishableKey, {
      auth: {
        storage: AsyncStorage,
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: false,
      },
      global: {
        headers: {
          'X-Client-Info': 'igreja-recomeco-mobile',
        },
      },
    })
  : null;

export function getSupabase() {
  if (!supabase) {
    throw new Error('Supabase nao configurado.');
  }

  return supabase;
}
