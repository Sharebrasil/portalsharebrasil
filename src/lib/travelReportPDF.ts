import html2pdf from 'html2pdf.js';

export const CATEGORIAS_DESPESA = [
  "Combustível",
  "Hospedagem",
  "Alimentação",
  "Transporte",
  "Outros"
];

export const PAGADORES = [
  "Tripulante",
  "Cliente",
  "ShareBrasil"
];

const parseLocalDate = (value: string | Date) => {
  const s = String(value).split('T')[0];
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
};

export const formatDateBR = (value: string | Date) => {
  if (!value) return '';
  const s = String(value).split('T')[0];
  const parts = s.split('-');
  if (parts.length === 3) {
    const [y, m, d] = parts;
    return `${d}/${m}/${y}`;
  }
  try { return new Date(value).toLocaleDateString('pt-BR'); } catch { return String(value); }
};

const generatePDFConfig = (reportNumber: string) => {
  return {
    margin: 10,
    filename: `${reportNumber}-relatorio-viagem.pdf`,
    image: { type: 'jpeg' as const, quality: 0.98 },
    html2canvas: { scale: 2, useCORS: true },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' as const }
  };
};

export interface TravelExpense {
  categoria: string;
  descricao: string;
  valor: number;
  pago_por: string;
  comprovante_url?: string;
}

export interface TravelReport {
  numero: string;
  cliente: string;
  aeronave: string;
  tripulante: string;
  tripulante2?: string;
  destino: string;
  data_inicio: string;
  data_fim: string;
  observacoes?: string;
  despesas: TravelExpense[];
  total_combustivel: number;
  total_hospedagem: number;
  total_alimentacao: number;
  total_transporte: number;
  total_outros: number;
  total_tripulante: number;
  total_cliente: number;
  total_share_brasil: number;
  valor_total: number;
}

const generateHTMLReport = (report: TravelReport, currentFullName = 'Usuário') => {
  const calcDays = () => {
    if (report?.data_inicio && report?.data_fim) {
      const inicio = parseLocalDate(report.data_inicio);
      const fim = parseLocalDate(report.data_fim);
      const diffTime = Math.abs(fim.getTime() - inicio.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
      return diffDays;
    }
    return 1;
  };

  const formattedNumero = (() => {
    const raw = String(report?.numero || '').toUpperCase();
    const numMatch = raw.match(/REL\s*(\d+)/);
    const yearMatch = raw.match(/\/(\d{2})\b/);
    if (numMatch) {
      const n = String(numMatch[1]).padStart(3, '0');
      const y = yearMatch ? `/${yearMatch[1]}` : '';
      return `REL ${n}${y}`;
    }
    return raw || 'N/A';
  })();

  return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <title>Relatório de Viagem - ${report.numero}</title>
        <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: Arial, sans-serif; padding: 20px; color: #333; background: white; }
            .report-container { border: 2px solid #22c55e; padding: 20px; border-radius: 8px; }
            .header {
                display: grid;
                grid-template-columns: 160px 1fr 160px;
                align-items: center;
                gap: 6px;
                margin-bottom: 10px;
                padding-bottom: 10px;
                border-bottom: 2px solid #22c55e;
            }
            .logo-box { width: 160px; height: auto; display: flex; align-items: center; justify-content: center; overflow: visible; }
            .logo-box img { max-width: 100%; max-height: 120px; object-fit: contain; }
            .header-title { grid-column: 2 / 3; text-align: center; align-self: center; }
            .header-title h1 { color: #1e3a8a; font-size: 20px; font-weight: bold; margin-bottom: 4px; line-height: 1.2; }
            .header-info { display: flex; justify-content: center; gap: 8px; font-size: 14px; }
            .info-section { background: white; padding: 15px; margin-bottom: 15px; }
            .info-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin-bottom: 20px; }
            .info-item { font-size: 13px; }
            .info-item strong { color: #1e3a8a; }
            .despesas-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 12px; }
            .despesas-table th, .despesas-table td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            .despesas-table th { background-color: #f2f2f2; color: #1e3a8a; font-weight: bold; }
            .totals-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; margin-top: 20px; }
            .totals-box { border: 1px solid #ccc; padding: 15px; border-radius: 4px; }
            .totals-box h3 { color: #22c55e; margin-bottom: 10px; font-size: 14px; border-bottom: 1px dashed #22c55e; padding-bottom: 5px; }
            .total-row { display: flex; justify-content: space-between; font-size: 13px; padding: 3px 0; }
            .total-final { font-weight: bold; font-size: 16px; color: #1e3a8a; margin-top: 10px; border-top: 2px solid #22c55e; padding-top: 5px; }
            .receipts-section { margin-top: 30px; border-top: 2px dashed #ccc; padding-top: 15px; }
            .receipts-section h2 { color: #1e3a8a; font-size: 16px; margin-bottom: 15px; }
            .receipt-item { margin-bottom: 20px; border: 1px solid #eee; padding: 10px; border-radius: 4px; page-break-inside: avoid; }
            .receipt-item p { font-size: 12px; margin: 2px 0; }
            .receipt-image {
                max-width: 100%;
                height: auto;
                max-height: 800px;
                display: block;
                margin-top: 10px;
                border: 1px solid #ddd;
                object-fit: contain;
                page-break-before: auto;
                page-break-after: auto;
            }
            .footer { margin-top: 30px; padding-top: 15px; border-top: 1px solid #ddd; text-align: center; font-size: 10px; color: #777; }
            .signature-box { margin-top: 40px; display: flex; justify-content: space-around; text-align: center; }
            .signature-line { border-bottom: 1px solid #333; width: 40%; margin-top: 50px; padding-bottom: 5px; font-size: 12px; }
        </style>
    </head>
    <body>
        <div class="report-container">
            <div class="header">
                <div class="logo-box">
                    <img id="report-logo" src="${window.location.origin}/logo.share.png" alt="Share Logo" />
                </div>
                <div class="header-title">
                    <h1>Relatório de Despesa de Viagem</h1>
                    <div class="header-info">
                        <span>${formattedNumero} - ${report.cliente || 'N/A'}</span>
                    </div>
                </div>
            </div>

            <div class="info-section">
                <div class="info-grid">
                    <div class="info-item"><strong>Cliente:</strong> ${report.cliente || 'N/A'}</div>
                    <div class="info-item"><strong>Aeronave:</strong> ${report.aeronave || 'N/A'}</div>
                    <div class="info-item"><strong>Tripulante:</strong> ${[report.tripulante, report.tripulante2].filter(v => v && String(v).trim()).join(' e ') || 'N/A'}</div>
                    <div class="info-item"><strong>Trecho:</strong> ${report.destino || 'N/A'}</div>
                    <div class="info-item"><strong>Período:</strong> ${report.data_inicio ? formatDateBR(report.data_inicio) : 'N/A'} a ${report.data_fim ? formatDateBR(report.data_fim) : 'N/A'} (${calcDays()} dias)</div>
                </div>
                ${report.observacoes && String(report.observacoes).trim() ? `
                <div>
                    <strong>Observações:</strong>
                    <p style="margin-top: 5px; font-size: 13px;">${String(report.observacoes).trim()}</p>
                </div>
                ` : ''}
            </div>

            <div class="despesas-section">
                <h2 style="color: #1e3a8a; font-size: 16px; margin-bottom: 10px;">Detalhes das Despesas</h2>
                <table class="despesas-table">
                    <thead>
                        <tr>
                            <th style="width: 20%;">Categoria</th>
                            <th style="width: 50%;">Descrição</th>
                            <th style="width: 15%; text-align: right;">Valor (R$)</th>
                            <th style="width: 15%;">Pago Por</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${report.despesas.map(d => `
                            <tr>
                                <td>${d.categoria || 'Outros'}</td>
                                <td>${d.descricao || 'N/A'}</td>
                                <td style="text-align: right;">${(Number(d.valor) || 0).toFixed(2).replace('.', ',')}</td>
                                <td>${d.pago_por || 'N/A'}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>

            <div class="totals-grid">
                <div class="totals-box">
                    <h3>Totais por Categoria (R$)</h3>
                    <div class="total-row"><span>Combustível:</span> <span>${(report.total_combustivel || 0).toFixed(2).replace('.', ',')}</span></div>
                    <div class="total-row"><span>Hospedagem:</span> <span>${(report.total_hospedagem || 0).toFixed(2).replace('.', ',')}</span></div>
                    <div class="total-row"><span>Alimentação:</span> <span>${(report.total_alimentacao || 0).toFixed(2).replace('.', ',')}</span></div>
                    <div class="total-row"><span>Transporte:</span> <span>${(report.total_transporte || 0).toFixed(2).replace('.', ',')}</span></div>
                    <div class="total-row"><span>Outros:</span> <span>${(report.total_outros || 0).toFixed(2).replace('.', ',')}</span></div>
                    <div class="total-final total-row"><span>TOTAL GERAL:</span> <span>${(report.valor_total || 0).toFixed(2).replace('.', ',')}</span></div>
                </div>
                <div class="totals-box">
                    <h3>Totais por Pagador (R$)</h3>
                    <div class="total-row"><span>Tripulante:</span> <span>${(report.total_tripulante || 0).toFixed(2).replace('.', ',')}</span></div>
                    <div class="total-row"><span>Cliente:</span> <span>${(report.total_cliente || 0).toFixed(2).replace('.', ',')}</span></div>
                    <div class="total-row"><span>ShareBrasil:</span> <span>${(report.total_share_brasil || 0).toFixed(2).replace('.', ',')}</span></div>
                    <div class="total-final total-row"><span>TOTAL GERAL:</span> <span>${(report.valor_total || 0).toFixed(2).replace('.', ',')}</span></div>
                </div>
            </div>

            <div class="signature-box">
                <div class="signature-line">Assinatura do Tripulante(s): ${[report.tripulante, report.tripulante2].filter(v => v && String(v).trim()).join(' / ') || 'N/A'}</div>
                <div class="signature-line">Assinatura do Cliente: ${report.cliente || 'N/A'}</div>
            </div>

            <div class="footer">
                Gerado por ${currentFullName}
            </div>
        </div>
        
        <div class="receipts-section">
            <h2>Comprovantes Anexados</h2>
            ${report.despesas
                .filter(d => d.comprovante_url)
                .map((d, index) => `
                    <div class="receipt-item">
                        <p><strong>Item Nº:</strong> ${index + 1}</p>
                        <p><strong>Descrição:</strong> ${d.descricao || 'N/A'}</p>
                        <p><strong>Categoria:</strong> ${d.categoria || 'Outros'}</p>
                        <p><strong>Valor:</strong> R$ ${(Number(d.valor) || 0).toFixed(2).replace('.', ',')}</p>
                        <img class="receipt-image" src="${d.comprovante_url}" alt="Comprovante ${index + 1}" />
                    </div>
                `).join('')}
                ${!report.despesas.some(d => d.comprovante_url) ? '<p style="font-size: 13px;">Nenhum comprovante anexado.</p>' : ''}
        </div>

    </body>
    </html>
    `;
};

export const generatePDF = async (report: TravelReport, currentFullName?: string) => {
  const htmlContent = generateHTMLReport(report, currentFullName);
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = htmlContent;
  tempDiv.style.position = 'absolute';
  tempDiv.style.left = '-9999px';
  document.body.appendChild(tempDiv);

  try {
    const config = generatePDFConfig(report.numero);
    await html2pdf().set(config).from(tempDiv).save();
  } finally {
    document.body.removeChild(tempDiv);
  }
};
