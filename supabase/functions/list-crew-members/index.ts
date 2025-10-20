import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const supabaseUrl = Deno.env.get("SUPABASE_URL");
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const anonKey = Deno.env.get("SUPABASE_ANON_KEY");

if (!supabaseUrl || !anonKey) {
  throw new Error("Missing Supabase configuration (SUPABASE_URL or SUPABASE_ANON_KEY)");
}

const hasServiceRole = Boolean(serviceRoleKey && serviceRoleKey.length > 0);

type RequestBody = { status?: string | null } | null;

type CrewMember = {
  id: string;
  full_name: string;
  canac: string;
  email: string | null;
  phone: string | null;
  photo_url: string | null;
  status: string | null;
  user_id: string | null;
  birth_date: string | null;
  created_at: string | null;
  updated_at: string | null;
};

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
      return new Response(JSON.stringify({ error: "not_authenticated" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const supabaseUser = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: authHeader } } });
    const { data: userData } = await supabaseUser.auth.getUser();
    if (!userData?.user) {
      return new Response(JSON.stringify({ error: "not_authenticated" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const jwtRoles = ((userData.user as any)?.app_metadata?.roles ?? (userData.user as any)?.user_metadata?.roles ?? []) as string[];

    let allowed = Array.isArray(jwtRoles) && jwtRoles.some((r) => ["admin", "gestor_master", "financeiro_master", "operacoes", "financeiro", "piloto_chefe"].includes(String(r)));

    if (!allowed) {
      try {
        const { data: userRolesData } = await supabaseUser
          .from("user_roles")
          .select("role")
          .eq("user_id", userData.user.id);
        const dbRoles = (userRolesData ?? []).map((r: any) => String(r.role));
        allowed = dbRoles.some((r) => ["admin", "gestor_master", "financeiro_master", "operacoes", "financeiro", "piloto_chefe"].includes(r));
      } catch {}
    }

    if (!allowed) {
      return new Response(JSON.stringify({ error: "forbidden" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    let statusFilter: string | null = null;
    try {
      const body = (await req.json()) as RequestBody;
      statusFilter = (body && typeof body === "object" ? (body as any).status : null) ?? null;
    } catch {
      statusFilter = null;
    }

    const readerClient = hasServiceRole
      ? createClient(supabaseUrl, serviceRoleKey!)
      : supabaseUser;

    let query = readerClient
      .from("crew_members")
      .select("id, full_name, canac, email, phone, photo_url, status, user_id, birth_date, created_at, updated_at")
      .order("full_name", { ascending: true });

    if (statusFilter) {
      query = query.eq("status", statusFilter);
    }

    const { data, error } = await query;

    if (error) {
      return new Response(JSON.stringify({ error: "crew_query_failed", details: error.message }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    return new Response(JSON.stringify({ crew_members: (data ?? []) as CrewMember[] }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (error) {
    console.error("Error in list-crew-members function:", error);
    return new Response(JSON.stringify({ error: "internal_error", details: (error as Error)?.message ?? String(error) }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
