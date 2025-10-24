import { createContext, type ReactNode, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { isAppRole, type AppRole } from "@/lib/roles";
import * as auth from "@/lib/auth";
import type { User } from "@/lib/auth";

interface AuthContextValue {
  user: User | null;
  roles: AppRole[];
  isLoading: boolean;
  refreshRoles: (userId?: string) => Promise<AppRole[]>;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (email: string, password: string, fullName?: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadRoles = useCallback(async (userId: string | null): Promise<AppRole[]> => {
    if (!userId) {
      setRoles([]);
      return [];
    }

    try {
      const res = await fetch(`/api/auth/roles?userId=${encodeURIComponent(userId)}`);
      if (!res.ok) {
        setRoles([]);
        return [];
      }

      const data = await res.json();
      const roleList = (data.roles || []).filter((r: string): r is AppRole => isAppRole(r));

      setRoles(roleList);
      return roleList;
    } catch (e) {
      console.error("Failed to load user roles", e);
      setRoles([]);
      return [];
    }
  }, []);

  const refreshRoles = useCallback(
    async (userId?: string) => loadRoles(userId ?? user?.id ?? null),
    [loadRoles, user]
  );

  const signIn = useCallback(async (email: string, password: string) => {
    try {
      const response = await auth.signIn(email, password);

      if (response.error) {
        return { error: response.error };
      }

      if (response.user && response.token) {
        setUser(response.user);
        auth.setStoredToken(response.token);
        await loadRoles(response.user.id);
      }

      return { error: null };
    } catch (error) {
      console.error('Sign in error:', error);
      return { error: 'Failed to sign in' };
    }
  }, [loadRoles]);

  const signUp = useCallback(async (email: string, password: string, fullName?: string) => {
    try {
      const response = await auth.signUp(email, password, fullName);

      if (response.error) {
        return { error: response.error };
      }

      if (response.user && response.token) {
        setUser(response.user);
        auth.setStoredToken(response.token);
        await loadRoles(response.user.id);
      }

      return { error: null };
    } catch (error) {
      console.error('Sign up error:', error);
      return { error: 'Failed to create account' };
    }
  }, [loadRoles]);

  const signOut = useCallback(async () => {
    try {
      auth.removeStoredToken();
      setUser(null);
      setRoles([]);
    } catch (error) {
      console.error('Sign out error:', error);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    const initialize = async () => {
      if (!isMounted) return;

      setIsLoading(true);

      try {
        const isAutoAdmin = (import.meta.env.VITE_AUTO_ADMIN === 'true') || Boolean(import.meta.env.DEV);

        const token = auth.getStoredToken();

        // Dev-only shortcut: if auto-admin is enabled and there's no stored token,
        // set a temporary admin user and roles so the dashboard opens without a password.
        if (isAutoAdmin && !token) {
          const devUser: User = {
            id: 'dev-admin',
            email: 'admin@local',
            full_name: 'Administrador',
            created_at: new Date().toISOString(),
          };

          setUser(devUser);
          setRoles(['admin']);
          setIsLoading(false);
          return;
        }

        if (!token) {
          setUser(null);
          setRoles([]);
          return;
        }

        const verifiedUser = await auth.verifyToken(token);

        if (!isMounted) return;

        if (verifiedUser) {
          setUser(verifiedUser);
          await loadRoles(verifiedUser.id);
        } else {
          auth.removeStoredToken();
          setUser(null);
          setRoles([]);
        }
      } catch (error) {
        if (!isMounted) return;
        console.error("Failed to initialize authentication", error);
        auth.removeStoredToken();
        setUser(null);
        setRoles([]);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void initialize();

    return () => {
      isMounted = false;
    };
  }, [loadRoles]);

  const value = useMemo(
    () => ({
      user,
      roles,
      isLoading,
      refreshRoles,
      signIn,
      signUp,
      signOut,
    }),
    [isLoading, refreshRoles, roles, user, signIn, signUp, signOut]
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
