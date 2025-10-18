import { useMemo } from "react";
import type { AppRole } from "@/lib/roles";
import { useAuth } from "@/contexts/AuthContext";

export function useUserRole() {
  const { roles, isLoading, refreshRoles } = useAuth();

  const roleSet = useMemo(() => new Set<AppRole>(roles), [roles]);

  const hasRole = (role: AppRole | string) => roleSet.has(role as AppRole);
  const hasAnyRole = (someRoles: Array<AppRole | string>) => someRoles.some((r) => hasRole(r));

  const isAdmin = hasRole("admin");
  const isFinanceiroMaster = hasRole("financeiro_master");
  const isGestorMaster = hasRole("gestor_master" as AppRole);

  return {
    userRoles: roles,
    hasRole,
    hasAnyRole,
    isAdmin,
    isFinanceiroMaster,
    isGestorMaster,
    isLoading,
    refreshRoles,
  };
}
