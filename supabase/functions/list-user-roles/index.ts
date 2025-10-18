// deno-lint-ignore-file no-explicit-any
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const supabaseUrl = Deno.env.get("SUPABASE_URL");
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const anonKey = Deno.env.get("SUPABASE_ANON_KEY");

if (!supabaseUrl || !serviceRoleKey || !anonKey) {
  throw new Error("Missing Supabase configuration for list-user-roles function");
}

const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

type RequestBody = { userIds: string[] };

type RolesByUser = Record<string, string[]>;

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

    const body: RequestBody = await req.json();
    const userIds = Array.isArray(body?.userIds) ? body.userIds.filter((v): v is string => typeof v === "string") : [];

    if (userIds.length === 0) {
      return new Response(JSON.stringify({ rolesByUser: {} as RolesByUser }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const { data, error } = await supabaseAdmin
      .from("user_roles")
      .select("user_id, role")
      .in("user_id", userIds);

    if (error) {
      return new Response(JSON.stringify({ error: "roles_query_failed", details: error.message }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const map: RolesByUser = {};
    (data ?? []).forEach((r: any) => {
      if (!r?.user_id || !r?.role) return;
      const list = map[r.user_id] ?? [];
      if (!list.includes(r.role)) list.push(String(r.role));
      map[r.user_id] = list;
    });

    return new Response(JSON.stringify({ rolesByUser: map }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (error) {
    console.error("Error in list-user-roles function:", error);
    return new Response(JSON.stringify({ error: "internal_error", details: (error as Error)?.message ?? String(error) }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
