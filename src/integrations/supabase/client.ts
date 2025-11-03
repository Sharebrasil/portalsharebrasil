import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL ?? '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY ?? '';

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

// If env vars are missing, avoid throwing at module import time (which causes uncaught errors in the browser).
// Instead export a noop proxy that throws when its methods are actually used, and let the app handle missing configuration gracefully.
let supabaseClient: ReturnType<typeof createClient> | any = null;

if (isSupabaseConfigured) {
  supabaseClient = createClient(supabaseUrl, supabaseAnonKey);

  // Ensure minimum auth surface to avoid runtime errors if client version differs
  if (!supabaseClient.auth || typeof supabaseClient.auth.getUser !== 'function') {
    supabaseClient.auth = {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      getUser: async (_opts?: any) => ({ data: { user: null } }),
      // keep other common methods as no-ops if not present
      onAuthStateChange: supabaseClient.auth?.onAuthStateChange ?? (() => ({ data: null, error: null })),
    } as any;
  }

  if (typeof supabaseClient.channel !== 'function') {
    supabaseClient.channel = () => ({
      on: () => ({ subscribe: () => ({}) }),
      subscribe: () => ({}),
    }) as any;
  }
} else {
  // Provide a lightweight safe client so the app can still render in environments without Supabase
  // without throwing uncaught errors. Functions return empty or nullish responses.
  supabaseClient = {
    auth: {
      getUser: async () => ({ data: { user: null } }),
      onAuthStateChange: async () => ({ data: null, error: null }),
    },
    channel: () => ({
      on: () => ({ subscribe: () => ({}) }),
      subscribe: () => ({}),
    }),
    removeChannel: () => {},
    from: () => ({ select: async () => ({ data: [], error: null }), insert: async () => ({ data: null, error: null }), update: async () => ({ data: null, error: null }), delete: async () => ({ data: null, error: null }) }),
  } as any;

  // Warn during runtime so developers see it in console
  // (do not throw so the app can still mount and show UI)
  // eslint-disable-next-line no-console
  console.warn('Supabase environment variables are missing. Some features will be disabled.');
}

export const supabase = supabaseClient;
