import { useState, useEffect } from "react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Save, Folder, Plus, Trash2, Upload, Download, Eye, FileText } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import html2pdf from "html2pdf.js";

export default function RelatorioViagem() {
  const [reports, setReports] = useState<any[]>([]);
  const [currentReport, setCurrentReport] = useState<any>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);
  const [clients, setClients] = useState<any[]>([]);
  const [aircraft, setAircraft] = useState<any[]>([]);
  const [crewMembers, setCrewMembers] = useState<any[]>([]);
  const [selectedClient, setSelectedClient] = useState<string>('');
  const [currentFullName, setCurrentFullName] = useState<string>('');
  const [history, setHistory] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState<boolean>(false);
  const [pdfModalOpen, setPdfModalOpen] = useState(false);
  const [pdfModalUrl, setPdfModalUrl] = useState<string | null>(null);

  const CATEGORIAS_DESPESA = ["Combustível", "Hospedagem", "Alimentação", "Transporte", "Outros"];
  const PAGADORES = ["Tripulante 1", "Tripulante 2", "Cliente", "ShareBrasil"];

  const toFolder = (s: string) => (s || 'sem_cliente')
    .normalize('NFKD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9-_]/g, '_');

  const toInputDateLocal = (date: Date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const formatDateBR = (value?: string) => {
    if (!value) return '';
    const s = String(value).split('T')[0];
    const parts = s.split('-');
    if (parts.length === 3) {
      const [y, m, d] = parts;
      return `${d}/${m}/${y}`;
    }
    return value;
  };

  const parseLocalDate = (value: string) => {
    const s = String(value).split('T')[0];
    const [y, m, d] = s.split('-').map(Number);
    return new Date(y, (m || 1) - 1, d || 1);
  };

  const triggerDownload = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => { try { URL.revokeObjectURL(url); } catch { } }, 1000);
  };

  // Carregar dados
  useEffect(() => {
    loadClients();
    loadAircraft();
    loadCrewMembers();
    loadCurrentUser();
    refreshHistory();
  }, []);

  const loadClients = async () => {
    const { data } = await supabase.from('clients').select('id, company_name').order('company_name');
    setClients(data || []);
  };

  const loadAircraft = async () => {
    const { data } = await supabase.from('aircraft').select('id, registration, model').order('registration');
    setAircraft(data || []);
  };

  const loadCrewMembers = async () => {
    const { data, error } = await supabase.from('crew_members').select('id, full_name, canac').order('full_name');
    if (error) {
      console.error('Erro ao carregar tripulantes:', error);
      toast({ title: "Erro ao carregar tripulantes", description: error.message, variant: "destructive" });
      return;
    }
    setCrewMembers(data || []);
  };

  const loadCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data: profile } = await supabase.from('profiles').select('full_name').eq('id', user.id).single();
    setCurrentFullName((profile as any)?.full_name || user.email || '');
  };

  const refreshHistory = async () => {
    setLoadingHistory(true);
    const { data } = await (supabase as any)
      .from('travel_report_history')
      .select('*')
      .order('created_at', { ascending: false });
    setHistory(data || []);
    setLoadingHistory(false);
  };

  const generateReportNumber = async (cliente: string) => {
    const yy = String(new Date().getFullYear()).slice(-2);
    const { data } = await supabase
      .from('travel_reports')
      .select('numero_relatorio')
      .ilike('numero_relatorio', `%/${yy}`)
      .order('created_at', { ascending: false })
      .limit(1);

    let max = 0;
    if (data && data[0]) {
      const match = data[0].numero_relatorio.match(/REL\s*(\d+)/i);
      if (match) max = parseInt(match[1]);
    }
    return `REL${String(max + 1).padStart(3, '0')}/${yy}`;
  };

  const createNewReport = () => {
    setCurrentReport({
      numero: '',
      cliente: '',
      aeronave: '',
      tripulante: '',
      tripulante2: '',
      destino: '',
      data_inicio: toInputDateLocal(new Date()),
      data_fim: toInputDateLocal(new Date()),
      despesas: [{ categoria: '', descricao: '', valor: '', pago_por: '', comprovante_url: '' }],
      total_combustivel: 0,
      total_hospedagem: 0,
      total_alimentacao: 0,
      total_transporte: 0,
      total_outros: 0,
      total_tripulante: 0,
      total_cliente: 0,
      total_share_brasil: 0,
      valor_total: 0,
      observacoes: '',
      status: 'draft'
    });
    setIsCreating(true);
  };

  const calculateTotals = (despesas: any[]) => {
    const totals = {
      total_combustivel: 0,
      total_hospedagem: 0,
      total_alimentacao: 0,
      total_transporte: 0,
      total_outros: 0,
      total_tripulante: 0,
      total_cliente: 0,
      total_share_brasil: 0
    };

    despesas.forEach(d => {
      const valor = Number(d.valor) || 0;
      switch (d.categoria) {
        case 'Combustível': totals.total_combustivel += valor; break;
        case 'Hospedagem': totals.total_hospedagem += valor; break;
        case 'Alimentação': totals.total_alimentacao += valor; break;
        case 'Transporte': totals.total_transporte += valor; break;
        default: totals.total_outros += valor;
      }
      switch (d.pago_por) {
        case 'Tripulante 1':
        case 'Tripulante 2':
        case 'Tripulante': totals.total_tripulante += valor; break;
        case 'Cliente': totals.total_cliente += valor; break;
        case 'ShareBrasil': totals.total_share_brasil += valor; break;
      }
    });

    const valor_total = totals.total_tripulante + totals.total_cliente + totals.total_share_brasil;
    setCurrentReport((prev: any) => ({ ...prev, ...totals, valor_total }));
  };

  const handleInputChange = (field: string, value: any) => {
    setCurrentReport({ ...currentReport, [field]: value });
  };

  const handleDespesaChange = (index: number, field: string, value: any) => {
    const newDespesas = [...currentReport.despesas];
    newDespesas[index][field] = value;
    setCurrentReport({ ...currentReport, despesas: newDespesas });
    calculateTotals(newDespesas);
  };

  const addDespesa = () => {
    setCurrentReport({
      ...currentReport,
      despesas: [...currentReport.despesas, { categoria: '', descricao: '', valor: '', pago_por: '', comprovante_url: '' }]
    });
  };

  const removeDespesa = (index: number) => {
    const newDespesas = currentReport.despesas.filter((_: any, i: number) => i !== index);
    setCurrentReport({ ...currentReport, despesas: newDespesas });
    calculateTotals(newDespesas);
  };

  const handleFileUpload = async (index: number, file: File) => {
    if (!file) return;
    setUploadingIndex(index);
    try {
      const reader = new FileReader();
      reader.onload = () => {
        handleDespesaChange(index, 'comprovante_url', String(reader.result));
        toast({
          title: "Upload concluído!",
          description: `Comprovante da despesa ${index + 1} adicionado com sucesso.`,
          variant: "default"
        });
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Erro no upload:', error);
      toast({
        title: "Erro no upload",
        description: "Não foi possível carregar o arquivo.",
        variant: "destructive"
      });
    }
    setUploadingIndex(null);
  };

  const saveReport = async (status = 'draft') => {
    if (!currentReport) return;

    if (status === 'finalized') {
      const missing = [];
      if (!currentReport.cliente) missing.push('Cliente');
      if (!currentReport.aeronave) missing.push('Aeronave');
      if (!currentReport.tripulante) missing.push('Tripulante');
      if (!currentReport.destino) missing.push('Trecho');
      if (missing.length) {
        toast({ title: "Campos obrigatórios", description: `Preencha: ${missing.join(', ')}`, variant: "destructive" });
        return;
      }
    }

    if (!currentReport.numero) {
      currentReport.numero = await generateReportNumber(currentReport.cliente);
    }

    if (status === 'draft') {
      toast({ title: "Rascunho salvo!", variant: "default" });
      return;
    }

    const pdfBlob = await generatePDF(currentReport, { download: false });
    if (!pdfBlob) {
      toast({ title: "Erro ao gerar PDF", variant: "destructive" });
      return;
    }

    triggerDownload(pdfBlob, `${currentReport.numero}-relatorio-viagem.pdf`);

    const folder = toFolder(currentReport.cliente);
    const pdfPath = `${folder}/${String(currentReport.numero).replace(/[\\/]/g, '-')}.pdf`;

    const { error: uploadErr } = await supabase.storage
      .from('travel-reports')
      .upload(pdfPath, pdfBlob, { upsert: true, contentType: 'application/pdf' });

    if (uploadErr) {
      toast({ title: "Erro ao salvar PDF", variant: "destructive" });
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    const payload = {
      numero_relatorio: currentReport.numero,
      cliente: currentReport.cliente,
      aeronave: currentReport.aeronave,
      tripulante: currentReport.tripulante,
      destination: currentReport.destino,
      start_date: currentReport.data_inicio,
      end_date: currentReport.data_fim,
      description: currentReport.observacoes,
      status: 'submitted',
      total_amount: Number(currentReport.valor_total || 0),
      expense_count: currentReport.despesas.length,
      has_receipts: currentReport.despesas.some((d: any) => !!d.comprovante_url),
      user_id: user?.id
    };

    const { data: dbRow } = await (supabase as any)
      .from('travel_reports')
      .upsert([payload], { onConflict: 'numero_relatorio' })
      .select()
      .single();

    await (supabase as any).from('travel_report_history').insert([{
      report_id: dbRow?.id,
      numero_relatorio: currentReport.numero,
      cliente: currentReport.cliente,
      pdf_path: pdfPath,
      metadata: { status: 'submitted', destination: currentReport.destino }
    }]);

    await refreshHistory();
    toast({ title: "Relatório finalizado e salvo!", variant: "default" });
    setIsCreating(false);
  };

  const generatePDF = async (report: any, options?: { download?: boolean }): Promise<Blob | null> => {
    setIsGeneratingPdf(true);
    const download = !(options && options.download === false);

    try {
      const htmlContent = generateHTMLReport(report);
      const element = document.createElement('div');
      element.innerHTML = htmlContent;

      const opt = {
        margin: 10,
        filename: `${report.numero}-relatorio-viagem.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
      };

      const worker: any = (html2pdf() as any).set(opt).from(element).toPdf();
      const blob: Blob = await worker.get('pdf').then((pdf: any) => pdf.output('blob'));
      if (download) await worker.save();

      return blob;
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      return null;
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const generateHTMLReport = (report: any) => {
    const calcDays = () => {
      if (report?.data_inicio && report?.data_fim) {
        const inicio = parseLocalDate(report.data_inicio);
        const fim = parseLocalDate(report.data_fim);
        const diffTime = Math.abs(fim.getTime() - inicio.getTime());
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
      }
      return 1;
    };

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
        .header { display: grid; grid-template-columns: 160px 1fr 160px; align-items: center; gap: 6px; margin-bottom: 10px; padding-bottom: 10px; border-bottom: 2px solid #22c55e; }
        .logo-box { width: 160px; display: flex; align-items: center; justify-content: center; }
        .logo-box img { max-width: 100%; max-height: 120px; object-fit: contain; }
        .header-title { text-align: center; }
        .header-title h1 { color: #1e3a8a; font-size: 20px; font-weight: bold; margin-bottom: 4px; }
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
        .receipt-item { 
            margin-bottom: 20px; 
            border: 1px solid #eee; 
            padding: 10px; 
            border-radius: 4px; 
            /* IMPEDE A QUEBRA DE PÁGINA ENTRE A LEGENDA E A IMAGEM */
            page-break-inside: avoid; 
        }
        .receipt-caption { 
            font-size: 11px; 
            margin-bottom: 5px; 
            font-weight: bold; 
            color: #1e3a8a; 
        }
        .receipt-image { 
            max-width: 100%; 
            height: auto; 
            max-height: 800px; 
            display: block; 
            margin-top: 10px; 
            border: 1px solid #ddd; 
            /* GARANTE QUE A IMAGEM TENTE FICAR INTEIRA NA PÁGINA */
            page-break-after: avoid; 
        }
        .signature-box { margin-top: 40px; display: flex; justify-content: space-around; text-align: center; }
        .signature-line { border-bottom: 1px solid #333; width: 40%; margin-top: 50px; padding-bottom: 5px; font-size: 12px; }
        .footer { margin-top: 30px; padding-top: 15px; border-top: 1px solid #ddd; text-align: center; font-size: 10px; color: #777; }
      </style>
    </head>
    <body>
      <div class="report-container">
        <div class="header">
          <div class="logo-box"><img src="/logo.share.png" alt="Logo" /></div>
          <div class="header-title">
            <h1>Relatório de Despesa de Viagem</h1>
            <div>${report.numero} - ${report.cliente}</div>
          </div>
        </div>
        <div class="info-section">
          <div class="info-grid">
            <div class="info-item"><strong>Cliente:</strong> ${report.cliente}</div>
            <div class="info-item"><strong>Aeronave:</strong> ${report.aeronave}</div>
            <div class="info-item"><strong>Tripulante:</strong> ${[report.tripulante, report.tripulante2].filter(v => v).join(' e ')}</div>
            <div class="info-item"><strong>Trecho:</strong> ${report.destino}</div>
            <div class="info-item"><strong>Período:</strong> ${formatDateBR(report.data_inicio)} a ${formatDateBR(report.data_fim)} (${calcDays()} dias)</div>
          </div>
          ${report.observacoes ? `<div><strong>Observações:</strong><p>${report.observacoes}</p></div>` : ''}
        </div>
        <table class="despesas-table">
          <thead><tr><th>Categoria</th><th>Descrição</th><th>Valor (R$)</th><th>Pago Por</th></tr></thead>
          <tbody>
            ${report.despesas.map((d: any) => `
              <tr>
                <td>${d.categoria}</td>
                <td>${d.descricao}</td>
                <td style="text-align:right;">${Number(d.valor || 0).toFixed(2).replace('.', ',')}</td>
                <td>${d.pago_por}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        <div class="totals-grid">
          <div class="totals-box">
            <h3>Totais por Categoria (R$)</h3>
            <div class="total-row"><span>Combustível:</span> <span>${(report.total_combustivel || 0).toFixed(2).replace('.', ',')}</span></div>
            <div class="total-row"><span>Hospedagem:</span> <span>${(report.total_hospedagem || 0).toFixed(2).replace('.', ',')}</span></div>
            <div class="total-row"><span>Alimentação:</span> <span>${(report.total_alimentacao || 0).toFixed(2).replace('.', ',')}</span></div>
            <div class="total-row"><span>Transporte:</span> <span>${(report.total_transporte || 0).toFixed(2).replace('.', ',')}</span></div>
            <div class="total-row"><span>Outros:</span> <span>${(report.total_outros || 0).toFixed(2).replace('.', ',')}</span></div>
            <div class="total-final total-row"><span>TOTAL:</span> <span>${(report.valor_total || 0).toFixed(2).replace('.', ',')}</span></div>
          </div>
          <div class="totals-box">
            <h3>Totais por Pagador (R$)</h3>
            <div class="total-row"><span>Tripulante:</span> <span>${(report.total_tripulante || 0).toFixed(2).replace('.', ',')}</span></div>
            <div class="total-row"><span>Cliente:</span> <span>${(report.total_cliente || 0).toFixed(2).replace('.', ',')}</span></div>
            <div class="total-row"><span>ShareBrasil:</span> <span>${(report.total_share_brasil || 0).toFixed(2).replace('.', ',')}</span></div>
            <div class="total-final total-row"><span>TOTAL:</span> <span>${(report.valor_total || 0).toFixed(2).replace('.', ',')}</span></div>
          </div>
        </div>
        <div class="signature-box">
          <div class="signature-line">Assinatura Tripulante</div>
          <div class="signature-line">Assinatura Cliente</div>
        </div>
        <div class="footer">Gerado por ${currentFullName}</div>
      </div>
      <div class="receipts-section">
        <h2>Comprovantes</h2>
        ${report.despesas.filter((d: any) => d.comprovante_url).map((d: any, i: number) => `
          <div class="receipt-item">
            <p class="receipt-caption">Comprovante ${i + 1}: ${d.categoria} - ${d.descricao} (R$ ${Number(d.valor || 0).toFixed(2).replace('.', ',')})</p>
            <img class="receipt-image" src="${d.comprovante_url}" alt="Comprovante" />
          </div>
        `).join('')}
      </div>
    </body>
    </html>`;
  };

  const openHistory = async (item: any) => {
    const { data } = await supabase.storage.from('travel-reports').createSignedUrl(item.pdf_path, 604800);
    if (data?.signedUrl) window.open(data.signedUrl, '_blank');
  };

  const deleteHistory = async (item: any) => {
    if (!confirm('Excluir este PDF?')) return;
    await supabase.storage.from('travel-reports').remove([item.pdf_path]);
    await (supabase as any).from('travel_report_history').delete().eq('id', item.id);
    refreshHistory();
    toast({ title: "PDF excluído", variant: "default" });
  };

  if (isCreating && currentReport) {
    return (
      <Layout>
        <div className="p-6 space-y-6">
          <div className="flex items-center gap-4 mb-6">
            <Button variant="ghost" onClick={() => setIsCreating(false)}><ArrowLeft /></Button>
            <h1 className="text-2xl font-bold">{currentReport.numero || 'Novo Relatório'}</h1>
            <Button onClick={() => saveReport('draft')} disabled={isGeneratingPdf}>
              <Save className="mr-2" /> Salvar Rascunho
            </Button>
            <Button onClick={() => saveReport('finalized')} disabled={isGeneratingPdf}>
              <Download className="mr-2" /> Salvar e Exportar PDF
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Cliente *</label>
              <Select value={currentReport.cliente} onValueChange={(v) => handleInputChange('cliente', v)}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {clients.map((c) => <SelectItem key={c.id} value={c.company_name}>{c.company_name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Aeronave *</label>
              <Select value={currentReport.aeronave} onValueChange={(v) => handleInputChange('aeronave', v)}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {aircraft.map((a) => <SelectItem key={a.id} value={a.registration}>{a.registration} - {a.model}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Tripulante 1 *</label>
              <Select value={currentReport.tripulante} onValueChange={(v) => handleInputChange('tripulante', v)}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {crewMembers.map((c) => <SelectItem key={c.id} value={c.full_name}>{c.full_name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Tripulante 2</label>
              <Select value={currentReport.tripulante2} onValueChange={(v) => handleInputChange('tripulante2', v)}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {crewMembers.map((c) => <SelectItem key={c.id} value={c.full_name}>{c.full_name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Trecho *</label>
              <Input value={currentReport.destino} onChange={(e) => handleInputChange('destino', e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-medium">Data Início</label>
              <Input type="date" value={currentReport.data_inicio} onChange={(e) => handleInputChange('data_inicio', e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-medium">Data Fim</label>
              <Input type="date" value={currentReport.data_fim} onChange={(e) => handleInputChange('data_fim', e.target.value)} />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium">Observações</label>
            <Textarea value={currentReport.observacoes} onChange={(e) => handleInputChange('observacoes', e.target.value)} rows={3} />
          </div>

          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Despesas</h2>
              <Button onClick={addDespesa} size="sm"><Plus className="mr-2" /> Adicionar</Button>
            </div>
            {currentReport.despesas.map((d: any, i: number) => (
              <div key={i} className="grid grid-cols-12 gap-2 mb-2 p-4 border rounded">
                <Select value={d.categoria} onValueChange={(v) => handleDespesaChange(i, 'categoria', v)}>
                  <SelectTrigger className="col-span-2"><SelectValue placeholder="Categoria" /></SelectTrigger>
                  <SelectContent>{CATEGORIAS_DESPESA.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
                <Input className="col-span-4" placeholder="Descrição" value={d.descricao} onChange={(e) => handleDespesaChange(i, 'descricao', e.target.value)} />
                <Input className="col-span-2" type="number" placeholder="Valor" value={d.valor} onChange={(e) => handleDespesaChange(i, 'valor', e.target.value)} />
                <Select value={d.pago_por} onValueChange={(v) => handleDespesaChange(i, 'pago_por', v)}>
                  <SelectTrigger className="col-span-2"><SelectValue placeholder="Pago por" /></SelectTrigger>
                  <SelectContent>{PAGADORES.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                </Select>
                <label className="col-span-1 flex items-center justify-center cursor-pointer border rounded hover:bg-muted">
                  <Upload size={16} />
                  <input type="file" className="hidden" accept="image/*,application/pdf" onChange={(e) => e.target.files && handleFileUpload(i, e.target.files[0])} />
                </label>
                <Button variant="ghost" size="sm" className="col-span-1" onClick={() => removeDespesa(i)}><Trash2 size={16} /></Button>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-4 p-4 bg-muted rounded">
            <div><strong>Total Geral:</strong> R$ {(currentReport.valor_total || 0).toFixed(2)}</div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Relatórios de Viagem</h1>
          <Button onClick={createNewReport}><Plus className="mr-2" /> Novo Relatório</Button>
        </div>

        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Histórico de PDFs</h2>
          {loadingHistory ? <p>Carregando...</p> : (
            <div className="grid gap-4">
              {history.map((item) => (
                <div key={item.id} className="flex items-center justify-between p-4 border rounded">
                  <div>
                    <p className="font-medium">{item.numero_relatorio} - {item.cliente}</p>
                    <p className="text-sm text-muted-foreground">{new Date(item.created_at).toLocaleDateString('pt-BR')}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => openHistory(item)}><Eye className="mr-2" /> Ver</Button>
                    <Button variant="outline" size="sm" onClick={() => deleteHistory(item)}><Trash2 className="mr-2" /> Excluir</Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}