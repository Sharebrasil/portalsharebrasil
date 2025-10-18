// deno-lint-ignore-file no-explicit-any
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type CrewMember = {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  avatar_url: string | null;
  roles: string[];
};

const supabaseUrl = Deno.env.get("SUPABASE_URL");
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const anonKey = Deno.env.get("SUPABASE_ANON_KEY");

if (!supabaseUrl || !serviceRoleKey || !anonKey) {
  throw new Error("Missing Supabase configuration for list-crew function");
}

const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (req.method !== "GET") {
      return new Response("Method not allowed", { status: 405, headers: corsHeaders });
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Não autenticado" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const supabase = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: authHeader } } });
    const { data: userData } = await supabase.auth.getUser();
    if (!userData?.user) {
      return new Response(JSON.stringify({ error: "Não autenticado" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const roles = ((userData.user as any)?.user_metadata?.roles ?? []) as string[];
    const allowed = Array.isArray(roles) && roles.some((r) => ["admin", "gestor_master", "financeiro_master", "operacoes", "financeiro", "piloto_chefe"].includes(String(r)));
    if (!allowed) {
      return new Response(JSON.stringify({ error: "Sem permissão" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const targetRoles = ["tripulante", "piloto_chefe"];

    const { data: roleAssignments, error: rolesError } = await supabaseAdmin
      .from("user_roles")
      .select("user_id, role")
      .in("role", targetRoles);

    if (rolesError) {
      return new Response(JSON.stringify({ error: "roles_query_failed", details: rolesError.message }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const userIds = Array.from(new Set((roleAssignments ?? []).map((r: any) => r.user_id).filter(Boolean)));
    if (userIds.length === 0) {
      return new Response(JSON.stringify({ crew: [] as CrewMember[] }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const { data: profiles, error: profilesError } = await supabaseAdmin
      .from("user_profiles")
      .select("id, full_name, email, phone, avatar_url")
      .in("id", userIds);

    if (profilesError) {
      return new Response(JSON.stringify({ error: "profiles_query_failed", details: profilesError.message }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const rolesByUser = new Map<string, string[]>();
    (roleAssignments ?? []).forEach((r: any) => {
      if (!r?.user_id || !r?.role) return;
      const list = rolesByUser.get(r.user_id) ?? [];
      if (!list.includes(r.role)) list.push(String(r.role));
      rolesByUser.set(r.user_id, list);
    });

    const crew: CrewMember[] = (profiles ?? []).map((p: any) => ({
      id: p.id,
      full_name: p.full_name,
      email: p.email,
      phone: p.phone ?? null,
      avatar_url: p.avatar_url ?? null,
      roles: rolesByUser.get(p.id) ?? [],
    }));

    crew.sort((a, b) => (a.full_name || "").localeCompare(b.full_name || "", "pt-BR"));

    return new Response(JSON.stringify({ crew }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (error) {
    console.error("Error in list-crew function:", error);
    return new Response(JSON.stringify({ error: "internal_error", details: (error as Error)?.message ?? String(error) }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
