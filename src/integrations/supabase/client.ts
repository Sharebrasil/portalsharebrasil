import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL ?? '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY ?? '';

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

// If env vars are missing, avoid throwing at module import time (which causes uncaught errors in the browser).
// Instead export a noop proxy that throws when its methods are actually used, and let the app handle missing configuration gracefully.
let supabaseClient: ReturnType<typeof createClient> | any = null;

if (isSupabaseConfigured) {
  supabaseClient = createClient(supabaseUrl, supabaseAnonKey);
} else {
  // lightweight proxy that throws a clear error on any usage
  const errorMessage = 'Supabase is not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.';
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabaseClient = new Proxy({}, {
    get() {
      return () => {
        throw new Error(errorMessage);
      };
    },
  }) as any;
  // also warn during runtime so developers see it in console
  // (do not throw so the app can still mount and show UI)
  // eslint-disable-next-line no-console
  console.warn('Supabase environment variables are missing. Some features will be disabled.');
}

export const supabase = supabaseClient;
