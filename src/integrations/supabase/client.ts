import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const isSupabaseConfigured = (): boolean => Boolean(SUPABASE_URL && SUPABASE_PUBLISHABLE_KEY);

let _client: SupabaseClient<Database> | null = null;

function getClient(): SupabaseClient<Database> {
  if (!_client) {
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase configuration missing: set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.');
    }
    _client = createClient<Database>(SUPABASE_URL!, SUPABASE_PUBLISHABLE_KEY!, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    });
  }
  return _client;
}

export const supabase: SupabaseClient<Database> = new Proxy({} as SupabaseClient<Database>, {
  get(_target, prop, receiver) {
    const client = getClient();
    // @ts-ignore
    return Reflect.get(client, prop, receiver);
  },
});
