const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type Body = {
  userId?: string;
  requestId?: string | null;
};

const supabaseUrl = Deno.env.get("SUPABASE_URL");
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
const zapierWebhookUrl = Deno.env.get("ZAPIER_WEBHOOK_URL") ?? null;

if (!supabaseUrl || !serviceRoleKey || !anonKey) {
  throw new Error("Missing Supabase configuration for notify-vacation-request function");
}

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
        JSON.stringify({ error: "not_authenticated" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const supabaseUser = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: authHeader } } });
    const { data: authData } = await supabaseUser.auth.getUser();
    if (!authData?.user) {
      return new Response(
        JSON.stringify({ error: "not_authenticated" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    let body: Body = {};
    try {
      body = await req.json();
    } catch {}

    const requesterId = (body.userId && typeof body.userId === "string") ? body.userId : authData.user.id;

    const { data: requesterProfile } = await supabaseAdmin
      .from("user_profiles")
      .select("id, full_name, email")
      .eq("id", requesterId)
      .maybeSingle();

    const { data: recipientsRoles } = await supabaseAdmin
      .from("user_roles")
      .select("user_id, role")
      .in("role", ["gestor_master", "financeiro_master"]);

    const recipientIds = Array.from(new Set((recipientsRoles ?? []).map((r: any) => r.user_id))).filter(Boolean);

    const { data: recipientProfiles } = await supabaseAdmin
      .from("user_profiles")
      .select("id, email, full_name")
      .in("id", recipientIds);

    const toEmails = (recipientProfiles ?? []).map((p: any) => p.email).filter((e: any) => typeof e === "string" && e.length > 0);

    // Fetch last or requested vacation request to enrich message
    let request: any = null;
    if (body.requestId) {
      const { data } = await supabaseAdmin.from("vacation_requests").select("*").eq("id", body.requestId).maybeSingle();
      request = data ?? null;
    } else {
      const { data } = await supabaseAdmin
        .from("vacation_requests")
        .select("*")
        .eq("user_id", requesterId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      request = data ?? null;
    }

    const subject = `Solicitação de férias - ${requesterProfile?.full_name ?? requesterProfile?.email ?? requesterId}`;
    const text = `O colaborador ${requesterProfile?.full_name ?? requesterProfile?.email ?? requesterId} solicitou férias.\n` +
      (request ? `Per��odo: ${request.start_date} a ${request.end_date} (${request.days} dias).\nStatus: ${request.status}.` : "Sem detalhes do período.");

    const payload = {
      to: toEmails,
      subject,
      text,
      html: `<p>${text.replaceAll("\n", "<br/>")}</p>`
    };

    let deliveredVia = "none" as "webhook" | "db" | "none";

    if (zapierWebhookUrl && toEmails.length > 0) {
      try {
        const res = await fetch(zapierWebhookUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type: "vacation_request", ...payload }),
        });
        if (res.ok) {
          deliveredVia = "webhook";
        }
      } catch (e) {
        // If webhook fails, fall back to DB notifications
      }
    }

    if (deliveredVia !== "webhook") {
      const messages = (recipientProfiles ?? []).map((p: any) => ({
        user_id: p.id,
        message: `[Férias] ${subject}: ${text}`,
        read: false,
      }));
      if (messages.length > 0) {
        try {
          await supabaseAdmin.from("task_notifications").insert(messages);
          deliveredVia = "db";
        } catch {}
      }
    }

    return new Response(
      JSON.stringify({ ok: true, deliveredVia, recipients: toEmails }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("Error in notify-vacation-request function:", error);
    return new Response(
      JSON.stringify({ error: "internal_error", details: (error as Error)?.message ?? String(error) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
