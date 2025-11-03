import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type Aerodromo = Database["public"]["Tables"]["aerodromes"]["Row"];

const aerodromesQueryKey = ["aerodromes-list"];

/**
 * Hook para buscar todos os aeródromos cadastrados na tabela 'aerodromes'.
 * Retorna uma lista ordenada pelo código ICAO.
 */
export const useAerodromes = () => {
  const query = useQuery({
    queryKey: aerodromesQueryKey,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("aerodromes")
        .select("id, icao_code, name, coordenadas")
        .order("icao_code", { ascending: true });

      if (error) {
        console.error("Erro ao buscar aeródromos:", error);
        throw error;
      }

      return (data as Aerodromo[]) || [];
    },
  });

  return {
    aerodromes: query.data ?? [],
    isLoadingAerodromes: query.isLoading,
    refetchAerodromes: query.refetch,
    errorAerodromes: query.error,
  };
};
