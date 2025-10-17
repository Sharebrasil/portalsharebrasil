import { createClient } from "npm:@supabase/supabase-js@2.32.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type CreateUserRequest = {
  email?: string;
  password?: string;
  roles?: string[] | null;
  role?: string | null;
  fullName?: string;
  tipo?: string | null;
};

const supabaseUrl = Deno.env.get("SUPABASE_URL");
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const anonKey = Deno.env.get("SUPABASE_ANON_KEY");

if (!supabaseUrl || !serviceRoleKey || !anonKey) {
  throw new Error("Missing Supabase configuration for create-user function");
}

const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

const passwordStrength = (password: string) => {
  const lengthOk = password.length >= 8;
  const upper = /[A-Z]/.test(password);
  const lower = /[a-z]/.test(password);
  const digit = /[0-9]/.test(password);
  const special = /[^A-Za-z0-9]/.test(password);
  return { lengthOk, upper, lower, digit, special, valid: lengthOk && upper && lower && digit && special };
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
      return new Response(JSON.stringify({ error: "Não autenticado" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const supabase = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: authHeader } } });

    const { data: userData } = await supabase.auth.getUser();
    if (!userData?.user) {
      return new Response(JSON.stringify({ error: "Não autenticado" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const requesterId = userData.user.id;

    const { data: rolesData, error: rolesError } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", requesterId);

    if (rolesError) {
      return new Response(JSON.stringify({ error: "Erro ao verificar permissões" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const isAllowed = (rolesData ?? []).some((r: { role: string }) => ["admin", "gestor_master", "financeiro_master"].includes(r.role));
    if (!isAllowed) {
      return new Response(JSON.stringify({ error: "Sem permissão para criar usuários" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const body = (await req.json()) as CreateUserRequest;

    if (!body.email || !body.password) {
      return new Response(JSON.stringify({ error: "email_and_password_required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const strength = passwordStrength(body.password);
    if (!strength.valid) {
      return new Response(JSON.stringify({ error: "weak_password", details: strength }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const rolesInput = body.roles ?? (body.role ? [body.role] : []);
    const uniqueRoles = Array.from(new Set(rolesInput));

    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email: body.email,
      password: body.password,
      email_confirm: false,
      user_metadata: { roles: uniqueRoles },
    });

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const createdUser = data.user;
    if (!createdUser?.id) {
      return new Response(JSON.stringify({ error: "user_creation_failed" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (uniqueRoles.length > 0) {
      const rows = uniqueRoles.map((role) => ({ user_id: createdUser.id, role }));
      const { error: rolesErr } = await supabaseAdmin.from("user_roles").insert(rows);
      if (rolesErr) {
        await supabaseAdmin.auth.admin.deleteUser(createdUser.id);
        return new Response(JSON.stringify({ error: "role_assignment_failed", details: rolesErr.message }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
    }

    const profilePayload = {
      id: createdUser.id,
      email: body.email,
      full_name: body.fullName ?? body.email,
      display_name: body.fullName ?? body.email,
      tipo: body.tipo ?? null,
      updated_at: new Date().toISOString(),
    };

    const { error: profileErr } = await supabaseAdmin.from("user_profiles").upsert(profilePayload, { onConflict: "id" });
    if (profileErr) {
      return new Response(JSON.stringify({ error: "profile_upsert_failed", details: profileErr.message }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    await supabaseAdmin.auth.admin.updateUserById(createdUser.id, { email_confirm: false });

    return new Response(JSON.stringify({ user: data.user, strength }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (error) {
    console.error("Error in create-user function:", error);
    return new Response(JSON.stringify({ error: "internal_error", details: (error as Error)?.message ?? String(error) }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
