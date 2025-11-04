import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export type Cliente = Tables<"clients">;

const clientesQueryKey = ["clients"];

/**
 * Hook para buscar todos os clientes cadastrados.
 * Retorna uma lista de clientes ordenada pelo nome da empresa.
 */
export const useClientes = () => {
  const query = useQuery<Cliente[] | null>({
    queryKey: clientesQueryKey,
    // Garante que a query é executada assim que o hook é chamado
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clients")
        .select("*")
        .eq("status", "ativo");

      if (error) {
        // É crucial lançar o erro para que o React Query o capture
        console.error("Erro ao buscar clientes:", error);
        throw error;
      }

      // Retorna a lista de dados ordenada por nome (ou null se vazia)
      const clients = (data as Cliente[]) || [];
      return clients.sort((a, b) =>
        (a.company_name || '').localeCompare(b.company_name || '', 'pt-BR')
      ) || null;
    },
  });

  return {
    clientes: query.data ?? [],
    isLoadingClientes: query.isLoading, // Nome mais específico para evitar conflito
    refetchClientes: query.refetch,
    errorClientes: query.error,
  };
};
