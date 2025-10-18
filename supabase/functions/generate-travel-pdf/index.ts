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

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${report.numero_relatorio || "Relatório de Viagem"}</title>
  <style>
    @page { size: A4; margin: 15mm; }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      font-family: Arial, sans-serif; 
      font-size: 11pt; 
      line-height: 1.4; 
      color: #333;
      padding: 20px;
    }
    .header { 
      text-align: center; 
      margin-bottom: 30px; 
      border-bottom: 3px solid #1e40af;
      padding-bottom: 15px;
    }
    .header h1 { 
      margin: 0; 
      font-size: 24pt; 
      color: #1e40af; 
      font-weight: bold;
      letter-spacing: 2px;
    }
    .header h2 { 
      margin: 8px 0 3px 0; 
      font-size: 16pt; 
      color: #64748b; 
      font-weight: normal;
    }
    .header h3 { 
      margin: 3px 0 0 0; 
      font-size: 14pt; 
      color: #1e40af; 
      font-weight: bold;
    }
    .info-section { 
      margin: 25px 0; 
      background: #f8fafc;
      padding: 15px;
      border-radius: 8px;
      border-left: 4px solid #1e40af;
    }
    .info-row { 
      display: flex; 
      margin: 8px 0; 
      line-height: 1.6;
    }
    .info-label { 
      font-weight: bold; 
      min-width: 100px;
      color: #475569;
    }
    .info-value {
      color: #1e293b;
    }
    h3 { 
      margin: 25px 0 12px 0; 
      color: #1e40af; 
      font-size: 14pt;
      border-bottom: 2px solid #e2e8f0;
      padding-bottom: 5px;
    }
    table { 
      width: 100%; 
      border-collapse: collapse; 
      margin: 15px 0; 
      background: white;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }
    th { 
      background: #1e40af; 
      color: white; 
      padding: 12px 10px; 
      text-align: left; 
      font-weight: bold;
      font-size: 10pt;
    }
    td { 
      padding: 10px; 
      border-bottom: 1px solid #e2e8f0; 
    }
    tr:last-child td { border-bottom: none; }
    tr:hover td { background: #f8fafc; }
    .totals-table { 
      margin: 20px 0;
      background: #f8fafc;
    }
    .totals-table td { 
      padding: 10px; 
      border-bottom: 1px solid #cbd5e1;
    }
    .totals-table td:first-child { font-weight: 600; color: #475569; }
    .totals-table td:last-child { text-align: right; font-family: 'Courier New', monospace; }
    .total-row { font-weight: bold; background: #1e40af !important; color: white !important; }
    .total-row td { border-bottom: none !important; padding: 12px 10px; }
    .signatures { margin-top: 50px; display: flex; justify-content: space-between; gap: 30px; }
    .signature-box { flex: 1; text-align: center; }
    .signature-line { border-top: 2px solid #1e293b; margin-bottom: 10px; padding-top: 10px; margin-top: 40px; }
    .signature-label { font-weight: bold; color: #475569; font-size: 10pt; }
    .signature-name { color: #1e293b; margin-top: 3px; }
    .footer { text-align: center; margin-top: 40px; padding-top: 20px; border-top: 2px solid #e2e8f0; color: #64748b; font-size: 9pt; }
    .footer p { margin: 5px 0; }
    @media print { body { padding: 0; } .no-print { display: none; } }
  </style>
</head>
<body>
  <div class="header">
    <h1>SHARE</h1>
    <h2>Relatório de Despesas de Viagem</h2>
    <h3>${report.numero_relatorio || ""}</h3>
  </div>

  <div class="info-section">
    <div class="info-row">
      <span class="info-label">Cliente:</span>
      <span class="info-value">${clientName}</span>
    </div>
    <div class="info-row">
      <span class="info-label">Aeronave:</span>
      <span class="info-value">${report.aeronave || ""}</span>
    </div>
    <div class="info-row">
      <span class="info-label">Tripulante:</span>
      <span class="info-value">${report.tripulante || ""}</span>
    </div>
    ${report.description ? `
    <div class="info-row">
      <span class="info-label">Trecho:</span>
      <span class="info-value">${report.description}</span>
    </div>
    ` : ""}
    <div class="info-row">
      <span class="info-label">Período:</span>
      <span class="info-value">${new Date(report.start_date).toLocaleDateString("pt-BR")} a ${new Date(report.end_date).toLocaleDateString("pt-BR")}</span>
    </div>
  </div>

  <h3>Detalhes das Despesas</h3>
  <table>
    <thead>
      <tr>
        <th>Categoria</th>
        <th>Descrição</th>
        <th style="text-align: right;">Valor (R$)</th>
        <th>Pago Por</th>
      </tr>
    </thead>
    <tbody>
      ${expensesList.length > 0 ? expensesList.map((exp: any) => `
        <tr>
          <td>${exp.category || ""}</td>
          <td>${exp.description || ""}</td>
          <td style="text-align: right; font-family: 'Courier New', monospace;">${parseFloat(exp.amount || 0).toFixed(2).replace(".", ",")}</td>
          <td>${exp.paid_by || ""}</td>
        </tr>
      `).join("") : '<tr><td colspan="4" style="text-align: center; color: #64748b;">Nenhuma despesa cadastrada</td></tr>'}
    </tbody>
  </table>

  <h3>Totais por Categoria (R$)</h3>
  <table class="totals-table">
    <tbody>
      <tr>
        <td>Combustível:</td>
        <td>${totals.fuel.toFixed(2).replace(".", ",")}</td>
      </tr>
      <tr>
        <td>Hospedagem:</td>
        <td>${totals.lodging.toFixed(2).replace(".", ",")}</td>
      </tr>
      <tr>
        <td>Alimentação:</td>
        <td>${totals.food.toFixed(2).replace(".", ",")}</td>
      </tr>
      <tr>
        <td>Transporte:</td>
        <td>${totals.transport.toFixed(2).replace(".", ",")}</td>
      </tr>
      <tr>
        <td>Outros:</td>
        <td>${totals.other.toFixed(2).replace(".", ",")}</td>
      </tr>
      <tr class="total-row">
        <td>TOTAL GERAL:</td>
        <td>${totalGeral.toFixed(2).replace(".", ",")}</td>
      </tr>
    </tbody>
  </table>

  <h3>Totais por Pagador (R$)</h3>
  <table class="totals-table">
    <tbody>
      <tr>
        <td>Tripulante:</td>
        <td>${totals.crew.toFixed(2).replace(".", ",")}</td>
      </tr>
      <tr>
        <td>Cliente:</td>
        <td>${totals.client.toFixed(2).replace(".", ",")}</td>
      </tr>
      <tr>
        <td>ShareBrasil:</td>
        <td>${totals.sharebrasil.toFixed(2).replace(".", ",")}</td>
      </tr>
      <tr class="total-row">
        <td>TOTAL GERAL:</td>
        <td>${totalGeral.toFixed(2).replace(".", ",")}</td>
      </tr>
    </tbody>
  </table>

  <div class="signatures">
    <div class="signature-box">
      <div class="signature-line">
        <div class="signature-label">Assinatura do Tripulante(s):</div>
        <div class="signature-name">${report.tripulante || ""}</div>
      </div>
    </div>
    <div class="signature-box">
      <div class="signature-line">
        <div class="signature-label">Assinatura do Cliente:</div>
        <div class="signature-name">${clientName}</div>
      </div>
    </div>
  </div>

  <div class="footer">
    <p><strong>Gerado por Financeiro</strong></p>
    <p>Comprovantes Anexados</p>
    <p style="margin-top: 10px; font-size: 8pt;">Documento gerado em ${new Date().toLocaleDateString("pt-BR")} às ${new Date().toLocaleTimeString("pt-BR")}</p>
  </div>
  
  <script>
    window.onload = function() {
      setTimeout(function() {
        window.print();
      }, 500);
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
