import { useCallback } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import type { Tables, TablesInsert } from "@/integrations/supabase/types";

export type UserProfile = Tables<"user_profiles">;

const profileQueryKey = (userId?: string) => ["user-profile", userId];

const buildDefaultProfile = (user: User): TablesInsert<"user_profiles"> => ({
  id: user.id,
  email: user.email ?? "",
  full_name: (user.user_metadata?.full_name as string | undefined) ?? user.email ?? "",
  display_name: (user.user_metadata?.display_name as string | undefined) ?? null,
  tipo: null,
  avatar_url: null,
  address: null,
  phone: null,
});

export const useUserProfile = (user: User | null | undefined) => {
  const queryClient = useQueryClient();

  const query = useQuery<UserProfile | null>({
    queryKey: profileQueryKey(user?.id),
    enabled: Boolean(user?.id),
    queryFn: async () => {
      if (!user?.id) {
        return null;
      }

      const { data, error } = await supabase
        .from("user_profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();

      if (error) {
        throw error;
      }

      if (data) {
        return data as UserProfile;
      }

      const defaultProfile = buildDefaultProfile(user);
      const { data: inserted, error: insertError } = await supabase
        .from("user_profiles")
        .insert(defaultProfile)
        .select()
        .single();

      if (insertError) {
        throw insertError;
      }

      return inserted as UserProfile;
    },
  });

  const updateProfile = useMutation({
    mutationFn: async (input: Partial<UserProfile>) => {
      if (!user?.id) {
        throw new Error("Usuário não autenticado");
      }

      const updates = {
        ...input,
        updated_at: new Date().toISOString(),
      } as Partial<UserProfile>;

      const { data, error } = await supabase
        .from("user_profiles")
        .update(updates)
        .eq("id", user.id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return data as UserProfile;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(profileQueryKey(user?.id), data);
    },
  });

  const invalidate = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: profileQueryKey(user?.id) });
  }, [queryClient, user?.id]);

  return {
    profile: query.data ?? null,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error,
    refetch: query.refetch,
    updateProfile: updateProfile.mutateAsync,
    isUpdating: updateProfile.isPending,
    invalidate,
  };
};
