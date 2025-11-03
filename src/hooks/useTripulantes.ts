import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

// --- 1. Definição do Tipo (adaptado da sua estrutura 'crew_members')
export type Tripulante = Tables<"crew_members">;

// --- 2. Chave da Query (Identificador para o React Query)
const tripulantesQueryKey = ["tripulantes-crew-members"];

/**
 * Hook para buscar todos os membros ativos da tripulação (crew_members).
 * Retorna uma lista ordenada pelo nome completo.
 */
export const useTripulantes = () => {
  const query = useQuery<Tripulante[] | null>({
    queryKey: tripulantesQueryKey,
    queryFn: async () => {
      // 🎯 Busca na tabela 'crew_members'
      const { data, error } = await supabase
        .from("crew_members")
        // Seleciona colunas essenciais, como full_name, para o seu formulário.
        .select("id, full_name, canac, email, status")
        .eq("status", "active") // Filtra apenas membros ativos (baseado no seu default)
        .order("full_name", { ascending: true });

      if (error) {
        console.error("Erro ao buscar tripulantes:", error);
        throw error;
      }

      // Retorna a lista de dados.
      return (data as Tripulante[]) || null;
    },
  });

  return {
    tripulantes: query.data ?? [],
    isLoadingTripulantes: query.isLoading,
    refetchTripulantes: query.refetch,
    errorTripulantes: query.error,
  };
};
