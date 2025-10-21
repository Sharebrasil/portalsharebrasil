import { createContext, type ReactNode, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase, isSupabaseConfigured } from "@/integrations/supabase/client";
import { isAppRole, type AppRole } from "@/lib/roles";

interface AuthContextValue {
  session: Session | null;
  user: User | null;
  roles: AppRole[];
  isLoading: boolean;
  refreshRoles: (userId?: string) => Promise<AppRole[]>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const serializeError = (err: any) => {
    if (!err) return null;
    const out: Record<string, unknown> = {};
    const keys = ["name", "message", "code", "status", "details", "hint", "stack"];
    for (const k of keys) {
      const v = (err as any)[k];
      if (v !== undefined) out[k] = v;
    }
    return Object.keys(out).length ? out : String(err);
  };

  const loadRoles = useCallback(async (userId: string | null): Promise<AppRole[]> => {
    if (!userId) {
      setRoles([]);
      return [];
    }

    if (!isSupabaseConfigured()) {
      setRoles([]);
      return [];
    }

    try {
      // Prefer RPC which may bypass RLS restrictions when implemented server-side
      const { data: rpcData, error: rpcError } = await supabase.rpc('get_user_roles', { _user_id: userId });

      if (!rpcError && rpcData) {
        const roleList = Array.isArray(rpcData) ? (rpcData as AppRole[]) : [rpcData as AppRole];
        setRoles(roleList);
        return roleList;
      }

      // Fallback: try roles from JWT/app_metadata or user_metadata (avoid querying user_roles due to RLS recursion)
      const { data: userRes } = await supabase.auth.getUser();
      const rawRoles = (userRes.user as any)?.app_metadata?.roles ?? (userRes.user as any)?.user_metadata?.roles;
      const fallbackList: AppRole[] = Array.isArray(rawRoles)
        ? (rawRoles as unknown[])
            .filter((r): r is string => typeof r === 'string')
            .filter((r): r is AppRole => isAppRole(r))
        : [];
      if (fallbackList.length) {
        setRoles(fallbackList);
        return fallbackList;
      }

      console.error("Failed to load user roles", {
        rpcError: serializeError(rpcError),
        queryError: 'skipped_user_roles_table_query_due_to_rls',
      });
      setRoles([]);
      return [];
    } catch (e) {
      console.error("Failed to load user roles", serializeError(e) ?? e);
      setRoles([]);
      return [];
    }
  }, []);

  const refreshRoles = useCallback(
    async (userId?: string) => loadRoles(userId ?? user?.id ?? null),
    [loadRoles, user]
  );

  useEffect(() => {
    let isMounted = true;

    const applyAuthState = async (nextSession: Session | null) => {
      if (!isMounted) {
        return;
      }

      setSession(nextSession);
      setUser(nextSession?.user ?? null);
      try {
        await loadRoles(nextSession?.user?.id ?? null);
      } catch (error) {
        console.error("Failed to load user roles", serializeError(error));
        setRoles([]);
      }
    };

    const initialize = async () => {
      if (!isMounted) {
        return;
      }

      setIsLoading(true);

      if (!isSupabaseConfigured()) {
        await applyAuthState(null);
        if (isMounted) setIsLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase.auth.getSession();

        if (!isMounted) {
          return;
        }

        if (error) {
          throw error;
        }

        await applyAuthState(data.session ?? null);
      } catch (error) {
        if (!isMounted) {
          return;
        }

        const err = error as any;
        const msg: string | undefined = err?.message || err?.error_description || err?.toString?.();
        if (msg && /invalid\s*refresh\s*token/i.test(msg)) {
          try {
            await supabase.auth.signOut();
          } catch {}
        }
        console.error("Failed to initialize authentication", serializeError(error));
        await applyAuthState(null);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void initialize();

    let subscription: { unsubscribe: () => void } | null = null;
    if (isSupabaseConfigured()) {
      const { data } = supabase.auth.onAuthStateChange((_event, newSession) => {
        if (!isMounted) {
          return;
        }

        (async () => {
          try {
            await applyAuthState(newSession ?? null);
          } catch (error) {
            if (!isMounted) {
              return;
            }

            console.error("Failed to handle auth state change", serializeError(error));
            await applyAuthState(null);
          }
        })();
      });
      subscription = data.subscription;
    }

    return () => {
      isMounted = false;
      subscription?.unsubscribe();
    };
  }, [loadRoles]);

  const value = useMemo(
    () => ({
      session,
      user,
      roles,
      isLoading,
      refreshRoles,
    }),
    [isLoading, refreshRoles, roles, session, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
};
