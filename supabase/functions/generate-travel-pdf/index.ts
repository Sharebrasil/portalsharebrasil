import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.75.1";

const corsHeaders: HeadersInit = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { reportId } = await req.json();

    if (!reportId) {
      throw new Error("Report ID is required");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: report, error: reportError } = await supabase
      .from("travel_reports")
      .select("*")
      .eq("id", reportId)
      .single();

    if (reportError || !report) {
      throw new Error("Report not found");
    }

    let clientName: string = report.cotista || "";
    if (report.cotista) {
      const { data: client } = await supabase
        .from("clients")
        .select("company_name")
        .eq("id", report.cotista)
        .single();

      if (client) {
        clientName = client.company_name as string;
      }
    }

    const { data: expenses, error: expensesError } = await supabase
      .from("travel_expenses")
      .select("*")
      .eq("travel_report_id", reportId);

    if (expensesError) {
      throw new Error("Error fetching expenses");
    }

    const expensesList = expenses || [];

    const totals = {
      fuel: 0,
      lodging: 0,
      food: 0,
      transport: 0,
      other: 0,
      crew: 0,
      client: 0,
      sharebrasil: 0,
    };

    expensesList.forEach((exp: any) => {
      const amount = parseFloat(exp.amount) || 0;

      if (exp.category === "Combustível") totals.fuel += amount;
      else if (exp.category === "Hospedagem") totals.lodging += amount;
      else if (exp.category === "Alimentação") totals.food += amount;
      else if (exp.category === "Transporte") totals.transport += amount;
      else totals.other += amount;

      if (exp.paid_by === "Tripulante") totals.crew += amount;
      else if (exp.paid_by === "Cliente") totals.client += amount;
      else if (exp.paid_by === "ShareBrasil") totals.sharebrasil += amount;
    });

    const totalGeral = totals.crew + totals.client + totals.sharebrasil;

    const { data: company } = await supabase
      .from("company_settings")
      .select("logo_url, name")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const start = new Date(report.start_date);
    const end = new Date(report.end_date);
    const days = Math.max(1, Math.round((end.getTime() - start.getTime()) / (24 * 60 * 60 * 1000)) + 1);

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${report.numero_relatorio || "Relatório de Viagem"}</title>
  <style>
    @page { size: A4; margin: 12mm; }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: Arial, sans-serif;
      font-size: 11pt;
      line-height: 1.45;
      color: #1f2937;
      padding: 10px;
      background: #fff;
    }
    .page {
      border: 3px solid #16a34a;
      border-radius: 10px;
      padding: 18px 18px 12px 18px;
    }
    .header {
      display: flex; align-items: center; justify-content: space-between;
      margin-bottom: 10px;
    }
    .brand { display: flex; align-items: center; gap: 10px; }
    .brand img { height: 36px; }
    .title { text-align: center; flex: 1; }
    .title h1 { font-size: 18pt; color: #1e40af; font-weight: 700; }
    .title small { display: block; color: #334155; margin-top: 3px; }
    .divider { height: 2px; background: #16a34a; margin: 8px 0 12px 0; }

    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px 24px; margin-bottom: 10px; }
    .info-item { display: flex; gap: 6px; }
    .label { font-weight: 700; color: #0f172a; }
    .muted { color: #475569; }

    h3 { margin: 12px 0 6px 0; color: #1e40af; font-size: 12pt; }

    table { width: 100%; border-collapse: collapse; background: #fff; }
    thead th { background: #e2e8f0; color: #0f172a; text-align: left; padding: 8px; font-size: 10pt; }
    tbody td { padding: 8px; border-bottom: 1px solid #e5e7eb; }
    tbody tr:last-child td { border-bottom: none; }
    td.amount, th.amount { text-align: right; font-family: 'Courier New', monospace; }

    .totals { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-top: 12px; }
    .card { border: 1px solid #e2e8f0; border-radius: 6px; }
    .card h4 { background: #f8fafc; border-bottom: 1px dashed #16a34a; color: #16a34a; padding: 8px 10px; font-size: 11pt; }
    .card table { background: transparent; }
    .card td { padding: 8px 10px; }
    .card .total { color: #1e3a8a; font-weight: 800; font-size: 12pt; }

    .signatures { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-top: 16px; }
    .sig { text-align: center; margin-top: 28px; }
    .sig .line { border-top: 1.5px solid #9ca3af; margin-bottom: 6px; padding-top: 8px; }
    .sig .label { color: #374151; font-weight: 600; }

    .attachments { margin-top: 14px; }
    .attachments h3 { color: #1e40af; }
    .attachment { margin-top: 10px; border: 1px solid #e5e7eb; border-radius: 6px; overflow: hidden; }
    .attachment .meta { padding: 8px 10px; background: #f8fafc; border-bottom: 1px solid #e5e7eb; }
    .attachment .meta div { margin: 2px 0; }
    .attachment img { width: 100%; max-height: 520px; object-fit: contain; display: block; background: #fff; }

    .footer { text-align: center; margin-top: 8px; color: #6b7280; font-size: 9pt; }
    @media print { body { padding: 0; } .no-print { display: none; } }
  </style>
</head>
<body>
  <div class="page">
    <div class="header">
      <div class="brand">
        ${company?.logo_url ? `<img src="${company.logo_url}" alt="${company?.name || 'Logo'}" />` : ''}
      </div>
      <div class="title">
        <h1>Relatório de Despesas de Viagem</h1>
        <small>${report.numero_relatorio ? `REL ${report.numero_relatorio}` : ''}${clientName ? ` - ${clientName}` : ''}</small>
      </div>
      <div style="width:36px"></div>
    </div>
    <div class="divider"></div>

    <div class="info-grid">
      <div class="info-item"><span class="label">Cliente:</span><span class="muted">${clientName}</span></div>
      <div class="info-item"><span class="label">Aeronave:</span><span class="muted">${report.aeronave || ''}</span></div>
      <div class="info-item"><span class="label">Trecho:</span><span class="muted">${report.description || '-'}</span></div>
      <div class="info-item"><span class="label">Tripulante:</span><span class="muted">${report.tripulante || ''}</span></div>
      <div class="info-item"><span class="label">Período:</span><span class="muted">${start.toLocaleDateString('pt-BR')} a ${end.toLocaleDateString('pt-BR')} (${days} dia${days>1?'s':''})</span></div>
    </div>

    <h3>Detalhes das Despesas</h3>
    <table>
      <thead>
        <tr>
          <th>Categoria</th>
          <th>Descrição</th>
          <th class="amount">Valor (R$)</th>
          <th>Pago Por</th>
        </tr>
      </thead>
      <tbody>
        ${expensesList.length > 0 ? expensesList.map((exp: any) => `
          <tr>
            <td>${exp.category || ''}</td>
            <td>${exp.description || ''}</td>
            <td class="amount">${parseFloat(exp.amount || 0).toFixed(2).replace('.', ',')}</td>
            <td>${exp.paid_by || ''}</td>
          </tr>
        `).join('') : '<tr><td colspan="4" style="text-align:center;color:#6b7280;">Nenhuma despesa cadastrada</td></tr>'}
      </tbody>
    </table>

    <div class="totals">
      <div class="card">
        <h4>Totais por Categoria (R$)</h4>
        <table>
          <tbody>
            <tr><td>Combustível:</td><td class="amount">${totals.fuel.toFixed(2).replace('.', ',')}</td></tr>
            <tr><td>Hospedagem:</td><td class="amount">${totals.lodging.toFixed(2).replace('.', ',')}</td></tr>
            <tr><td>Alimentação:</td><td class="amount">${totals.food.toFixed(2).replace('.', ',')}</td></tr>
            <tr><td>Transporte:</td><td class="amount">${totals.transport.toFixed(2).replace('.', ',')}</td></tr>
            <tr><td>Outros:</td><td class="amount">${totals.other.toFixed(2).replace('.', ',')}</td></tr>
            <tr><td class="label">TOTAL GERAL:</td><td class="amount total">${totalGeral.toFixed(2).replace('.', ',')}</td></tr>
          </tbody>
        </table>
      </div>
      <div class="card">
        <h4>Totais por Pagador (R$)</h4>
        <table>
          <tbody>
            <tr><td>Tripulante:</td><td class="amount">${totals.crew.toFixed(2).replace('.', ',')}</td></tr>
            <tr><td>Cliente:</td><td class="amount">${totals.client.toFixed(2).replace('.', ',')}</td></tr>
            <tr><td>ShareBrasil:</td><td class="amount">${totals.sharebrasil.toFixed(2).replace('.', ',')}</td></tr>
            <tr><td class="label">TOTAL GERAL:</td><td class="amount total">${totalGeral.toFixed(2).replace('.', ',')}</td></tr>
          </tbody>
        </table>
      </div>
    </div>

    <div class="signatures">
      <div class="sig">
        <div class="line"></div>
        <div class="label">Assinatura do Tripulante(s): ${report.tripulante || ''}</div>
      </div>
      <div class="sig">
        <div class="line"></div>
        <div class="label">Assinatura do Cliente: ${clientName}</div>
      </div>
    </div>

    <div class="footer">Gerado por Financeiro</div>

    <div class="attachments">
      <h3>Comprovantes Anexados</h3>
      ${expensesList.filter((e:any)=>!!e.receipt_url).map((e:any, i:number)=>`
        <div class="attachment">
          <div class="meta">
            <div><strong>Item Nº:</strong> ${i + 1}</div>
            <div><strong>Descrição:</strong> ${e.description || ''}</div>
            <div><strong>Categoria:</strong> ${e.category || ''}</div>
            <div><strong>Valor:</strong> R$ ${parseFloat(e.amount || 0).toFixed(2).replace('.', ',')}</div>
          </div>
          <img src="${e.receipt_url}" alt="Comprovante ${i + 1}" />
        </div>
      `).join('')}
    </div>
  </div>

  <script>
    window.onload = function() {
      setTimeout(function() { window.print(); }, 500);
    };
  </script>
</body>
</html>
    `;

    return new Response(html, {
      headers: {
        ...corsHeaders,
        "Content-Type": "text/html; charset=utf-8",
      },
    });
  } catch (error) {
    console.error("Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
