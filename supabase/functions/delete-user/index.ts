import { createClient } from "npm:@supabase/supabase-js@2.32.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type DeleteUserRequest = {
  userId?: string;
};

const supabaseUrl = Deno.env.get("SUPABASE_URL");
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const anonKey = Deno.env.get("SUPABASE_ANON_KEY");

if (!supabaseUrl || !serviceRoleKey || !anonKey) {
  throw new Error("Missing Supabase configuration for delete-user function");
}

// Admin client for privileged operations
const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (req.method !== "POST") {
      return new Response("Method not allowed", { status: 405, headers: corsHeaders });
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Não autenticado" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Regular client using anon key, forwarding end-user token for RLS/identity
    const supabase = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: userData, error: getUserError } = await supabase.auth.getUser();
    if (getUserError || !userData?.user) {
      return new Response(
        JSON.stringify({ error: "Não autenticado" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const requesterId = userData.user.id;

    const { data: roles, error: rolesError } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", requesterId);

    if (rolesError) {
      return new Response(
        JSON.stringify({ error: "Erro ao verificar permissões" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const allowed = (roles ?? []).some((r: { role: string }) =>
      ["admin", "gestor_master", "financeiro_master"].includes(r.role)
    );

    if (!allowed) {
      return new Response(
        JSON.stringify({ error: "Sem permissão para excluir usuários" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const body = (await req.json()) as DeleteUserRequest;
    if (!body?.userId) {
      return new Response(
        JSON.stringify({ error: "user_id_required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Prevent self-deletion if desired (safety); allow if not required by business rules
    // if (body.userId === requesterId) {
    //   return new Response(
    //     JSON.stringify({ error: "Operação não permitida" }),
    //     { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    //   );
    // }

    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(body.userId);
    if (deleteError) {
      return new Response(
        JSON.stringify({ error: deleteError.message }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const profileCleanup = supabaseAdmin
      .from("user_profiles")
      .delete()
      .eq("id", body.userId);

    const rolesCleanup = supabaseAdmin
      .from("user_roles")
      .delete()
      .eq("user_id", body.userId);

    const [{ error: profileError }, { error: rolesCleanupError }] = await Promise.all([
      profileCleanup,
      rolesCleanup,
    ]);

    if (profileError || rolesCleanupError) {
      return new Response(
        JSON.stringify({
          error: "cleanup_failed",
          details: profileError?.message ?? rolesCleanupError?.message ?? "",
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    return new Response(
      JSON.stringify({ message: "Usuário excluído com sucesso" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("Error in delete-user function:", error);
    return new Response(
      JSON.stringify({ error: "internal_error", details: (error as Error)?.message ?? String(error) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
