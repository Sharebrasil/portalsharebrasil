import { createClient } from "npm:@supabase/supabase-js@2.32.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type UpdateUserRequest = {
  userId?: string;
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
  throw new Error("Missing Supabase configuration for update-user function");
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
      return new Response(JSON.stringify({ error: "Sem permissão para atualizar usuários" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const body = (await req.json()) as UpdateUserRequest;
    if (!body.userId) {
      return new Response(JSON.stringify({ error: "user_id_required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (body.password) {
      const strength = passwordStrength(body.password);
      if (!strength.valid) {
        return new Response(JSON.stringify({ error: "weak_password", details: strength }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
    }

    const updates: { email?: string; password?: string; user_metadata?: Record<string, unknown> } = {};

    if (body.email) updates.email = body.email;
    if (body.password) updates.password = body.password;

    const rolesInput = body.roles ?? (body.role ? [body.role] : null);
    if (rolesInput !== null) {
      updates.user_metadata = { roles: Array.from(new Set(rolesInput)) };
    }

    let updatedUser = null as unknown;

    if (Object.keys(updates).length > 0) {
      const { data, error } = await supabaseAdmin.auth.admin.updateUserById(body.userId, updates);
      if (error) {
        return new Response(JSON.stringify({ error: error.message }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      updatedUser = data.user;
    } else {
      const { data, error } = await supabaseAdmin.auth.admin.getUserById(body.userId);
      if (error) {
        return new Response(JSON.stringify({ error: error.message }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      updatedUser = data.user;
    }

    if (rolesInput !== null) {
      const { error: delErr } = await supabaseAdmin.from("user_roles").delete().eq("user_id", body.userId);
      if (delErr) {
        return new Response(JSON.stringify({ error: "role_cleanup_failed", details: delErr.message }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      const rolesToInsert = Array.from(new Set(rolesInput));
      if (rolesToInsert.length > 0) {
        const { error: insErr } = await supabaseAdmin.from("user_roles").insert(rolesToInsert.map((role) => ({ user_id: body.userId!, role })));
        if (insErr) {
          return new Response(JSON.stringify({ error: "role_assignment_failed", details: insErr.message }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }
      }
    }

    if (body.email || body.fullName || body.tipo) {
      const profilePayload: Record<string, unknown> = {
        id: body.userId,
        updated_at: new Date().toISOString(),
      };
      if (body.email) profilePayload.email = body.email;
      if (body.fullName) {
        profilePayload.full_name = body.fullName;
        profilePayload.display_name = body.fullName;
      }
      if (body.tipo !== undefined) profilePayload.tipo = body.tipo;

      const { error: profileErr } = await supabaseAdmin.from("user_profiles").upsert(profilePayload, { onConflict: "id" });
      if (profileErr) {
        return new Response(JSON.stringify({ error: "profile_upsert_failed", details: profileErr.message }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
    }

    return new Response(JSON.stringify({ user: updatedUser }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (error) {
    console.error("Error in update-user function:", error);
    return new Response(JSON.stringify({ error: "internal_error", details: (error as Error)?.message ?? String(error) }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
