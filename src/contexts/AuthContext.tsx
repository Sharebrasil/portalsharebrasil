import { createContext, type ReactNode, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import type { AppRole } from "@/lib/roles";

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

  const loadRoles = useCallback(async (userId: string | null): Promise<AppRole[]> => {
    if (!userId) {
      setRoles([]);
      return [];
    }

    const { data, error } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId);

    if (error) {
      console.error("Failed to load user roles", error);
      setRoles([]);
      return [];
    }

    const roleList = (data ?? [])
      .map((entry) => entry.role)
      .filter((role): role is AppRole => Boolean(role));

    setRoles(roleList);
    return roleList;
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
        console.error("Failed to load user roles", error);
        setRoles([]);
      }
    };

    const initialize = async () => {
      if (!isMounted) {
        return;
      }

      setIsLoading(true);
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

        console.error("Failed to initialize authentication", error);
        await applyAuthState(null);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void initialize();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
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

          console.error("Failed to handle auth state change", error);
          await applyAuthState(null);
        }
      })();
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
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
