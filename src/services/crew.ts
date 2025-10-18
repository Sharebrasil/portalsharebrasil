import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import type { AppRole } from "@/lib/roles"; // Import AppRole

type UserProfileRow = Database["public"]["Tables"]["user_profiles"]["Row"];
type UserRoleRow = Database["public"]["Tables"]["user_roles"]["Row"];

export type CrewRole = AppRole; // Use AppRole directly

export interface CrewMember {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  avatar_url: string | null;
  roles: CrewRole[];
}

export const CREW_ROLE_LABELS: Record<CrewRole, string> = {
  tripulante: "Tripulante",
  piloto_chefe: "Piloto Chefe",
  admin: "Administrador", // Add other AppRoles if they can be assigned to crew members
  financeiro: "Financeiro",
  financeiro_master: "Financeiro Master",
  operacoes: "Operações",
};

export async function fetchCrewMembers(): Promise<CrewMember[]> {
  const { data, error } = await supabase.functions.invoke("list-crew");
  if (error) {
    throw new Error(error.message ?? "Erro ao carregar tripulantes");
  }
  const crew = (data as { crew?: CrewMember[] } | CrewMember[]) ?? [];
  const list = Array.isArray(crew) ? crew : (crew.crew ?? []);
  return list
    .map((m) => ({
      ...m,
      phone: m.phone !== null && m.phone !== undefined ? String(m.phone) : null,
    }))
    .sort((a, b) => (a.full_name || "").localeCompare(b.full_name || "", "pt-BR"));
}
