import React, { useState, useEffect } from 'react';
import { ChevronLeft, Save, Send, FileText, Download, MessageCircle, Plus, Trash2, Calendar, MapPin, DollarSign, Clock, Plane, Receipt, Upload, ArrowLeft, Folder, Eye, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { supabase } from '@/integrations/supabase/client';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import html2pdf from 'html2pdf.js';
import MobileNavigation from '@/components/ui/MobileNavigation';

const TravelReports = () => {
  const navigate = useNavigate();
  const [reports, setReports] = useState([]);
  const [currentReport, setCurrentReport] = useState(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [uploadingIndex, setUploadingIndex] = useState(null);
  const [cliente, setCliente] = useState<any[]>([]);
  const [aeronaves, setAeronaves] = useState<any[]>([]);
  const [tripulantesList, setTripulantesList] = useState<string[]>([]);
  const [selectedCliente, setSelectedCliente] = useState<string>('');
  const [currentFullName, setCurrentFullName] = useState<string>('');
  const [history, setHistory] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState<boolean>(false);

  // Modal de visualização de PDF
  const [pdfModalOpen, setPdfModalOpen] = useState(false);
  const [pdfModalUrl, setPdfModalUrl] = useState<string | null>(null);
  const openPdfModal = (url: string) => { setPdfModalUrl(url); setPdfModalOpen(true); };

  const triggerDownload = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => { try { URL.revokeObjectURL(url); } catch {} }, 1000);
  };

  // Constantes do sistema
  const CATEGORIAS_DESPESA = [
    "Combustível",
    "Hospedagem",
    "Alimentação",
    "Transporte",
    "Outros"
  ];

  const PAGADORES = [
    "Tripulante",
    "Cliente",
    "ShareBrasil"
  ];

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
    try { return new Date(value as string).toLocaleDateString('pt-BR'); } catch { return String(value); }
  };
  const parseLocalDate = (value: string) => {
    const s = String(value).split('T')[0];
    const [y, m, d] = s.split('-').map(Number);
    return new Date(y, (m || 1) - 1, d || 1);
  };

  const getReportPdfUrl = async (report?: any): Promise<string | null> => {
    try {
      const targetReport = report || currentReport;
      if (!targetReport?.numero) return null;
      const safeNum = String(targetReport.numero || '').replace(/[\\/]/g, '-');
      const candidatePath = targetReport?.cliente ? `${toFolder(targetReport.cliente)}/${safeNum}.pdf` : null;

      const trySign = async (p: string | null) => {
        if (!p) return null;
        const { data: signed, error } = await supabase.storage.from('report-history').createSignedUrl(p, 604800);
        if (!error && signed?.signedUrl) return signed.signedUrl as string;
        const pub = supabase.storage.from('report-history').getPublicUrl(p).data.publicUrl as string | null;
        return pub || null;
      };

      // 1) tenta caminho direto pelo cliente/número
      let url = await trySign(candidatePath);
      if (url) return url;

      // 2) fallback: consulta histórico apenas por PDFs
      const { data } = await (supabase as any)
        .from('travel_report_history')
        .select('pdf_path')
        .eq('numero_relatorio', targetReport.numero)
        .like('pdf_path', '%.pdf')
        .order('created_at', { ascending: false })
        .limit(1);
      const pathFromHistory = (data && data[0]?.pdf_path) || null;
      url = await trySign(pathFromHistory);
      return url;
    } catch {
      return null;
    }
  };

  // Ações do histórico: abrir direto e excluir
  const openHistoryDirect = async (item: any) => {
    try {
      const { data: signed } = await supabase.storage.from('report-history').createSignedUrl(item.pdf_path, 604800);
      const url = signed?.signedUrl || '';
      if (!url) { alert('URL do PDF não encontrada.'); return; }
      window.open(url, '_blank');
    } catch (e) {
      alert('Não foi possível abrir o PDF.');
    }
  };

  const deleteHistoryItem = async (item: any) => {
    const ok = confirm('Tem certeza que deseja excluir este PDF do histórico? Esta ação não pode ser desfeita.');
    if (!ok) return;
    try {
      try { await supabase.storage.from('report-history').remove([item.pdf_path]); } catch {}
      try { await (supabase as any).from('travel_report_history').delete().eq('id', item.id); } catch {}
      setHistory((prev:any[]) => prev.filter((h:any) => h.id !== item.id));
      alert('Excluído com sucesso.');
    } catch (e) {
      alert('Erro ao excluir.');
    }
  };

  // Carregar relatórios salvos
  useEffect(() => {
    const savedReports = JSON.parse(localStorage.getItem('travelReports') || '[]');
    setReports(savedReports);
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const { data, error } = await supabase.from('clients').select('id, company_name').order('company_name');
        if (!error) {
          setCliente((data || []).map((c: any) => ({ id: c.id, nome: c.company_name })));
        }
      } catch (e) {
        // ignore
      }
    })();
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await supabase.from('aircraft').select('id, registration, model').order('registration');
        setAeronaves((data || []).map((a: any) => ({ id: a.id, prefixo: a.registration, modelo: a.model })));
      } catch (e) {
        // ignore
      }
    })();
  }, []);

  // carregar nomes de tripulantes para sugestão (auto-complete livre)
  useEffect(() => {
    (async () => {
      try {
        const { data, error } = await supabase.from('crew_members').select('full_name').order('full_name');
        if (!error) setTripulantesList((data || []).map((t:any)=>t.full_name).filter(Boolean));
      } catch (e) { /* noop */ }
    })();
  }, []);

  // Obter nome do perfil atual para o rodapé do PDF
  useEffect(() => {
    (async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        let name: string | null = null;
        try {
          const { data: profile } = await supabase
            .from('user_profiles')
            .select('full_name')
            .eq('id', user.id)
            .maybeSingle();
          name = (profile as any)?.full_name || null;
        } catch {}
        setCurrentFullName(name || (user.user_metadata && (user.user_metadata as any).full_name) || user.email || '');
      } catch {}
    })();
  }, []);

  // Carregar/atualizar histórico de PDFs do Supabase
  const refreshHistory = async () => {
    try {
      setLoadingHistory(true);
      const { data, error } = await (supabase as any)
        .from('travel_report_history')
        .select('id, numero_relatorio, cliente, pdf_path, created_at')
        .like('pdf_path', '%.pdf')
        .order('created_at', { ascending: false });
      if (!error) setHistory(data || []);
    } finally {
      setLoadingHistory(false);
    }
  };
  useEffect(() => { refreshHistory(); }, []);

  // Revogar URL de Blob quando fechar o modal
  useEffect(() => {
    if (!pdfModalOpen && pdfModalUrl && pdfModalUrl.startsWith('blob:')) {
      try { URL.revokeObjectURL(pdfModalUrl); } catch {}
      setPdfModalUrl(null);
    }
  }, [pdfModalOpen]);

  // Helpers de visualização
  const dbClienteNames = (cliente || []).map((c:any) => String(c?.nome || '').trim()).filter(Boolean);
  const reportClienteNames = Array.from(new Set((reports || []).map((r:any) => String(r?.cliente || '').trim()).filter(Boolean)));
  const historyClienteNames = Array.from(new Set((history || []).map((h:any) => String(h?.cliente || '').trim()).filter(Boolean)));
  const allClienteFolders = Array.from(new Set([
    ...dbClienteNames,
    ...reportClienteNames,
    ...historyClienteNames,
  ].filter(Boolean))).sort((a, b) => String(a).localeCompare(String(b), 'pt-BR'));
  const visibleReports = (selectedCliente ? (reports || []).filter((r:any) => r?.cliente === selectedCliente) : (reports || []))
    .filter((r:any) => r?.status !== 'finalized');
  const uniqueTripulantes = Array.from(new Set((tripulantesList || []).filter(Boolean))).sort((a, b) => String(a).localeCompare(String(b), 'pt-BR'));
  const OUTRO_OPTION = '__OUTRO__';
  const [showSecondTripulante, setShowSecondTripulante] = useState<boolean>(false);
  const [isOutroTripulante, setIsOutroTripulante] = useState<boolean>(false);
  useEffect(() => {
    const t = currentReport?.tripulante || '';
    if (t && !uniqueTripulantes.includes(t)) setIsOutroTripulante(true);
    else setIsOutroTripulante(false);
  }, [currentReport?.tripulante, uniqueTripulantes.join('|')]);
  const tripulanteSelectValue = isOutroTripulante
    ? OUTRO_OPTION
    : (uniqueTripulantes.includes(currentReport?.tripulante || '') ? (currentReport?.tripulante || '') : '');

  const [isOutroTripulante2, setIsOutroTripulante2] = useState<boolean>(false);
  useEffect(() => {
    const t2 = currentReport?.tripulante2 || '';
    if (t2 && !uniqueTripulantes.includes(t2)) setIsOutroTripulante2(true);
    else setIsOutroTripulante2(false);
  }, [currentReport?.tripulante2, uniqueTripulantes.join('|')]);
  const tripulante2SelectValue = isOutroTripulante2
    ? OUTRO_OPTION
    : (uniqueTripulantes.includes(currentReport?.tripulante2 || '') ? (currentReport?.tripulante2 || '') : '');

  // Salvar relatórios
  const saveReports = (updatedReports) => {
    localStorage.setItem('travelReports', JSON.stringify(updatedReports));
    setReports(updatedReports);
  };

  // Excluir relatório salvo (rascunho local)
  const deleteReport = (numero) => {
    if (!numero) return;
    const ok = confirm('Tem certeza que deseja excluir este relatório? Esta ação não pode ser desfeita.');
    if (!ok) return;
    const updated = reports.filter((r) => r.numero !== numero);
    saveReports(updated);
    alert('Relatório excluído com sucesso.');
  };

  // Excluir relatório criado/finalizado (apaga Storage + tabelas + local)
  const deleteCreatedReport = async (report: any) => {
    if (!report?.numero) { alert('Relatório inválido.'); return; }
    const ok = confirm(`Excluir o relatório ${report.numero}? Esta ação não pode ser desfeita.`);
    if (!ok) return;
    try {
      const folder = toFolder(report.cliente);
      const pdfPath = `${folder}/${String(report.numero || '').replace(/[\\/]/g, '-')}.pdf`;
      const jsonPath = `${folder}/${String(report.numero || '').replace(/[\\/]/g, '-')}.json`;
      try { await supabase.storage.from('report-history').remove([pdfPath]); } catch {}
      try { await supabase.storage.from('report-history').remove([jsonPath]); } catch {}
      try { await (supabase as any).from('travel_report_history').delete().or(`numero_relatorio.eq.${report.numero},pdf_path.eq.${pdfPath}`); } catch {}
      try {
        if (report.db_id) {
          await (supabase as any).from('travel_reports').delete().eq('id', report.db_id);
        } else {
          await (supabase as any).from('travel_reports').delete().eq('report_number', report.numero);
        }
      } catch {}
      saveReports((reports || []).filter((r:any)=> r.numero !== report.numero));
      setHistory((prev:any[]) => (prev || []).filter((h:any)=> h.numero_relatorio !== report.numero && h.pdf_path !== pdfPath));
      alert('Relatório excluído com sucesso.');
    } catch (e) {
      alert('Não foi possível excluir completamente. Verifique sua conexão e tente novamente.');
    }
  };

  // Gerar número sequencial local (fallback) com sufixo do ano e reset anual por cliente
  // Formato: ABC001/2025 (3 letras do cliente + número sequencial + ano)
  const generateReportNumberLocal = (cliente) => {
    const yyyy = String(new Date().getFullYear());
    if (!cliente) return `XXX001/${yyyy}`;

    // Extrair 3 primeiras letras do cliente (maiúsculas)
    const clienteLetras = cliente.substring(0, 3).toUpperCase().padEnd(3, 'X');

    // Encontrar o número máximo para este cliente no ano atual
    const maxNumber = (reports || [])
      .filter((report:any) => report.cliente === cliente)
      .reduce((max:number, report:any) => {
        const raw = String(report.numero || '');
        const yearSuffix = (raw.match(/\/(\d{4})\b/) || [null, null])[1];
        const createdYear = (()=>{ try { return String(report.createdAt || '').slice(0,4); } catch { return null; } })();
        const isSameYear = yearSuffix ? (yearSuffix === yyyy) : (createdYear === yyyy);
        if (!isSameYear) return max;
        const match = raw.match(/\d+/);
        if (match) {
          const num = parseInt(match[0]);
          return num > max ? num : max;
        }
        return max;
      }, 0);

    return `${clienteLetras}${String(maxNumber + 1).padStart(3, '0')}/${yyyy}`;
  };

  // Usar a função RPC generate_travel_report_number do banco
  const allocateReportNumber = async (cliente: string) => {
    try {
      const { data, error } = await (supabase as any).rpc('generate_travel_report_number', {
        p_client_name: cliente
      });

      if (error) {
        console.error('Erro ao gerar número via RPC:', error);
        return generateReportNumberLocal(cliente);
      }

      if (data) {
        return data as string;
      }

      return generateReportNumberLocal(cliente);
    } catch (e) {
      console.error('Erro ao chamar RPC generate_travel_report_number:', e);
      return generateReportNumberLocal(cliente);
    }
  };

  // Wrapper síncrono para gerar número quando necessário na UI
  const generateReportNumber = (cliente: string) => generateReportNumberLocal(cliente);

  // Criar novo relatorio
  const createNewReport = () => {
    const lastCreated = (()=>{ try { return localStorage.getItem('last_created_tripulante_name') || ''; } catch { return ''; } })();
    const newReport = {
      numero: '',
      cliente: '',
      aeronave: '',
      tripulante: lastCreated || '',
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
      status: 'draft', // draft, finalized
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    } as any;

    if (lastCreated) { try { localStorage.removeItem('last_created_tripulante_name'); } catch {} }

    setCurrentReport(newReport);
    setIsCreating(true);
  };

  // Calcular totais
  const calculateTotals = (despesas) => {
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

    despesas.forEach(despesa => {
      const valor = Number(despesa.valor) || 0;
      
      // Totais por categoria
      switch (despesa.categoria) {
        case 'Combustível':
          totals.total_combustivel += valor;
          break;
        case 'Hospedagem':
          totals.total_hospedagem += valor;
          break;
        case 'Alimentação':
          totals.total_alimentacao += valor;
          break;
        case 'Transporte':
          totals.total_transporte += valor;
          break;
        default:
          totals.total_outros += valor;
      }

      // Totais por pagador
      switch (despesa.pago_por) {
        case 'Tripulante':
          totals.total_tripulante += valor;
          break;
        case 'Cliente':
          totals.total_cliente += valor;
          break;
        case 'ShareBrasil':
          totals.total_share_brasil += valor;
          break;
      }
    });

    const valor_total = totals.total_tripulante + totals.total_cliente + totals.total_share_brasil;

    setCurrentReport(prev => ({
      ...prev,
      ...totals,
      valor_total
    }));
  };

  // Calcular dias da viagem
  const calculateDays = () => {
    if (currentReport?.data_inicio && currentReport?.data_fim) {
      const inicio = new Date(currentReport.data_inicio);
      const fim = new Date(currentReport.data_fim);
      const diffTime = Math.abs(fim.getTime() - inicio.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
      return diffDays;
    }
    return 1;
  };

  // Salvar rascunho local ou finalizar (gera PDF e persiste no Supabase)
  const saveReport = async (status = 'draft') => {
    if (!currentReport) return;

    const updatedReport: any = {
      ...currentReport,
      status,
      updatedAt: new Date().toISOString()
    };

    // Validação apenas ao finalizar
    if (status === 'finalized') {
      const missing = [] as string[];
      if (!updatedReport.cliente) missing.push('Cliente');
      if (!updatedReport.aeronave) missing.push('Aeronave');
      if (!updatedReport.tripulante) missing.push('Tripulante');
      if (!updatedReport.destino) missing.push('Trecho');
      if (!updatedReport.data_inicio) missing.push('Data Início');
      if (missing.length) {
        alert(`Preencha os campos obrigatórios: ${missing.join(', ')}.`);
        return;
      }
    }

    // Geração de número para rascunho (sempre garantir um identificador único)
    try {
      if (!updatedReport.numero) {
        if (updatedReport.cliente) {
          try {
            updatedReport.numero = await allocateReportNumber(updatedReport.cliente);
          } catch {
            updatedReport.numero = generateReportNumberLocal(updatedReport.cliente);
          }
        } else {
          updatedReport.numero = `rascunho_${Date.now()}`;
        }
      }
    } catch {}

    // Se não for finalização, salvar apenas localmente (rascunho)
    if (status !== 'finalized') {
      try {
        if (!updatedReport.numero && updatedReport.cliente) {
          try {
            updatedReport.numero = await allocateReportNumber(updatedReport.cliente);
          } catch {
            updatedReport.numero = generateReportNumberLocal(updatedReport.cliente);
          }
        }
      } catch {}

      const existingIndex = reports.findIndex(r => r.numero === updatedReport.numero);
      let updatedReports;
      if (existingIndex >= 0) {
        updatedReports = [...reports];
        updatedReports[existingIndex] = updatedReport;
      } else {
        updatedReports = [...reports, updatedReport];
      }
      saveReports(updatedReports);
      setCurrentReport(updatedReport);
      alert('Rascunho salvo!');
      return;
    }

    // Finalização: gerar PDF antes de persistir
    setCurrentReport(updatedReport);
    // Garantir número REAL do relatório antes do PDF (não rascunho_*)
    try {
      if (!updatedReport.numero || updatedReport.numero.startsWith('rascunho_')) {
        if (updatedReport.cliente) {
          updatedReport.numero = await allocateReportNumber(updatedReport.cliente);
        }
      }
    } catch {
      if (!updatedReport.numero || updatedReport.numero.startsWith('rascunho_')) {
        updatedReport.numero = generateReportNumberLocal(updatedReport.cliente);
      }
    }

    const pdfBlob = await generatePDF(updatedReport, { download: false });
    if (!pdfBlob) {
      setCurrentReport(prev => ({ ...prev, status: 'draft' }));
      alert('Falha ao gerar PDF. Relatório NÃO foi salvo no banco.');
      return;
    }

    // Baixar localmente imediatamente após finalizar
    try {
      const filename = `${updatedReport.numero}-relatorio-viagem.pdf`;
      triggerDownload(pdfBlob, filename);
    } catch {}

    // PASSO 1: Upload do PDF no Storage primeiro
    const toFolderSafe = (s: string) => (s || 'sem_cliente')
      .normalize('NFKD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9-_]/g, '_');

    const folder = toFolderSafe(updatedReport.cliente);
    const pdfPath = `${folder}/${String(updatedReport.numero || '').replace(/[\\/]/g, '-')}.pdf`;
    let pdfUploadSuccess = false;

    try {
      const { error: upErr } = await supabase.storage.from('report-history').upload(pdfPath, pdfBlob, {
        upsert: true,
        contentType: 'application/pdf'
      });
      if (upErr) throw upErr;
      pdfUploadSuccess = true;
    } catch (e) {
      console.error('Falha ao enviar PDF ao Storage:', e);
      alert('Não foi possível fazer upload do PDF. O relatório não será salvo.');
      return;
    }

    // PASSO 2: Persistir no Supabase apenas ao finalizar (após upload bem-sucedido)
    const dbStatus = 'submitted';
    try {
      const { data: { user } } = await supabase.auth.getUser();

      // Garantir que numero NUNCA é null ou rascunho_ antes de persistir
      let finalNumber = updatedReport.numero;
      if (!finalNumber || finalNumber.startsWith('rascunho_')) {
        try {
          if (updatedReport.cliente) {
            finalNumber = await allocateReportNumber(updatedReport.cliente);
          }
        } catch {
          finalNumber = generateReportNumberLocal(updatedReport.cliente);
        }
      }

      const payload: any = {
        report_number: finalNumber,
        client_name: updatedReport.cliente || null,
        aircraft_registration: updatedReport.aeronave || null,
        crew_member_name: updatedReport.tripulante || null,
        crew_member_name_2: updatedReport.tripulante2 || null,
        destination: updatedReport.destino,
        start_date: updatedReport.data_inicio,
        end_date: updatedReport.data_fim || null,
        observations: updatedReport.observacoes || null,
        status: dbStatus,
        total_amount: Number(updatedReport.valor_total || 0),
        pdf_url: null,
        created_by: user?.id || null,
      };

      let dbRow: any | null = null;
      if (updatedReport.db_id) {
        const { data, error } = await supabase
          .from('travel_reports')
          .update(payload)
          .eq('id', updatedReport.db_id)
          .select()
          .single();
        if (error) throw error;
        dbRow = data;
      } else {
        const insertRes = await supabase
          .from('travel_reports')
          .insert(payload)
          .select()
          .single();
        if (insertRes.error) throw insertRes.error;
        dbRow = insertRes.data;
      }

      if (dbRow) {
        updatedReport.numero = dbRow.report_number || finalNumber || '';
        updatedReport.db_id = dbRow.id;
      }

      // PASSO 3: Registrar histórico com pdf_path (obrigatório)
      if (pdfUploadSuccess) {
        try {
          const ins = await (supabase as any)
            .from('travel_report_history')
            .insert({
              report_id: updatedReport.db_id || null,
              numero_relatorio: finalNumber || updatedReport.numero,
              cliente: updatedReport.cliente,
              pdf_path: pdfPath,
              metadata: {
                status: 'submitted',
                destination: updatedReport.destino,
                start_date: updatedReport.data_inicio,
                end_date: updatedReport.data_fim,
                totals: { valor_total: updatedReport.valor_total }
              }
            })
            .select('*')
            .single();
          if (!ins.error && ins.data) {
            setHistory((prev:any[]) => [ins.data, ...(prev || [])]);
          } else {
            console.warn('Erro ao inserir histórico:', ins.error);
            await refreshHistory();
          }
        } catch (e) {
          console.error('Falha ao registrar histórico:', e);
          await refreshHistory();
        }
      }

    } catch (e: any) {
      console.error('Falha ao salvar no banco:', e);

      const ensureString = (v: any) => {
        if (v == null) return '';
        if (typeof v === 'string') return v;
        try { return JSON.stringify(v); } catch { return String(v); }
      };

      const lower = ensureString(
        (e && (e.message || e.error_description || e.error || e.details))
      ).toLowerCase();

      let friendly = [
        ensureString(e?.message),
        ensureString(e?.details),
        ensureString(e?.hint),
        ensureString(e?.code),
        typeof e?.error === 'string' ? e.error : ensureString(e?.error?.message || e?.error)
      ].filter(Boolean).join(' - ');

      if (!friendly) friendly = ensureString(e) || 'Erro desconhecido.';
      if (lower.includes('failed to fetch') || lower.includes('network') || lower.includes('load failed')) {
        friendly = 'Não foi possível contatar o banco. Verifique sua conexão e tente novamente.';
      }
      alert(`Falha ao salvar no banco: ${friendly}`);
      // Não retornar aqui: manter local para evitar perda
    }

    // Atualiza localStorage (backup)
    const existingIndex = reports.findIndex(r => r.numero === updatedReport.numero);
    let updatedReports;
    if (existingIndex >= 0) {
      updatedReports = [...reports];
      updatedReports[existingIndex] = updatedReport;
    } else {
      updatedReports = [...reports, updatedReport];
    }
    saveReports(updatedReports);
    setCurrentReport(updatedReport);
    alert('Relatório finalizado e salvo!');
  };

  // Atualizar campo do formulário (sem gerar número automático; número será definido ao final)
  const handleInputChange = (field, value) => {
    const updated = { ...currentReport, [field]: value };
    setCurrentReport(updated);
  };

  // Atualizar despesa
  const handleDespesaChange = (index, field, value) => {
    const newDespesas = [...currentReport.despesas];
    newDespesas[index][field] = field === 'valor' ? value : value;
    setCurrentReport(prev => ({ ...prev, despesas: newDespesas }));
    calculateTotals(newDespesas);
  };

  // Adicionar despesa
  const addDespesa = () => {
    setCurrentReport(prev => ({
      ...prev,
      despesas: [...prev.despesas, { categoria: '', descricao: '', valor: '', pago_por: '', comprovante_url: '' }]
    }));
  };

  // Remover despesa
  const removeDespesa = (index) => {
    const newDespesas = currentReport.despesas.filter((_, i) => i !== index);
    setCurrentReport(prev => ({ ...prev, despesas: newDespesas }));
    calculateTotals(newDespesas);
  };

  // Simular upload de arquivo
  const handleFileUpload = async (index, file) => {
    if (!file) return;
    setUploadingIndex(index);
    try {
      // Converte o arquivo local em Data URL para embutir no PDF (evita CORS)
      const toDataUrl = (f: File) => new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = reject;
        reader.readAsDataURL(f);
      });
      const dataUrl = await toDataUrl(file);
      handleDespesaChange(index, 'comprovante_url', dataUrl);
    } catch (error) {
      console.error('Erro no upload:', error);
    }
    setUploadingIndex(null);
  };

  // Gerar PDF usando html2pdf.js (retorna Blob do PDF; download é opcional)
  const generatePDF = async (reportParam?: any, options?: { download?: boolean }): Promise<Blob | null> => {
    const report = reportParam || currentReport;
    if (!report) {
      alert('Relatório inválido.');
      return null;
    }

    setIsGeneratingPdf(true);

    const download = !(options && options.download === false);

    try {
      const htmlContent = generateHTMLReport(report);
      // Criar elemento temporário
      const element = document.createElement('div');
      element.innerHTML = htmlContent;

      // Substitui PDFs anexados por uma nota textual
      try {
        const receiptImgs = Array.from(element.querySelectorAll('.receipt-image')) as HTMLImageElement[];
        for (const ri of receiptImgs) {
          const src = ri.getAttribute('src') || '';
          if (src.startsWith('data:application/pdf')) {
            const note = document.createElement('div');
            note.textContent = 'PDF anexado (não é exibido no PDF).';
            (note as HTMLElement).setAttribute('style', 'font-size:12px;color:#555;margin-top:6px;');
            ri.replaceWith(note);
          }
        }
      } catch {}

      // Converter imagens externas para data URLs (fallback se CORS bloquear)
      const imgs = Array.from(element.querySelectorAll('img'));

      const fetchToDataUrl = async (url) => {
        try {
          const res = await fetch(url, { mode: 'cors' });
          if (!res.ok) throw new Error('network');
          const blob = await res.blob();
          return await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(String(reader.result));
            reader.onerror = reject;
            reader.readAsDataURL(blob);
          });
        } catch (e) {
          return null;
        }
      };

      for (const img of imgs) {
        try {
          const src = img.getAttribute('src') || '';
          if (!src) { img.remove(); continue; }
          if (src.startsWith('data:')) continue;
          const abs = new URL(src, window.location.href).href;
          const dataUrl = await fetchToDataUrl(abs);
          if (dataUrl) {
            img.setAttribute('src', dataUrl as string);
          } else {
            // se não for possível obter (CORS/404), remove a imagem para evitar erro
            console.warn('Não foi possível carregar imagem para PDF:', src);
            img.remove();
          }
        } catch (e) {
          img.remove();
        }
      }

      // Se a logo for muito grande, adicionar página exclusiva com a logo em tamanho integral
      try {
        const logoEl = element.querySelector('#report-logo');
        if (logoEl && logoEl.getAttribute('src')) {
          const src = logoEl.getAttribute('src');
          await new Promise<void>((resolve) => {
            const im = new Image();
            im.onload = () => {
              if (im.naturalWidth > 1200 || im.naturalHeight > 300) {
                const full = element.querySelector('#fullpage-logo');
                if (full) {
                  (full as HTMLElement).style.display = 'block';
                  (full as HTMLElement).innerHTML = `<img src="${src}" alt="Logo Completa" style="width:100%;height:auto;" />`;
                }
              }
              resolve();
            };
            im.src = src as string;
          });
        }
      } catch {}

      // Para imagens de comprovante muito altas, quebrar página antes de exibi-las
      try {
        const receiptImgs = Array.from(element.querySelectorAll('.receipt-image')) as HTMLImageElement[];
        for (const ri of receiptImgs) {
          const src = ri.getAttribute('src');
          if (!src) continue;
          await new Promise<void>((resolve) => {
            const im = new Image();
            im.onload = () => {
              // Se a imagem for muito alta, força quebra de página antes dela.
              if (im.naturalHeight > 1000) {
                const parent = ri.closest('.receipt-item') as HTMLElement | null;
                if (parent) parent.style.pageBreakBefore = 'always';
              }
              resolve();
            };
            im.src = src;
          });
        }
      } catch {}

      // Remover o elemento fullpage-logo que não é necessário
      try {
        const fullpageLogo = element.querySelector('#fullpage-logo');
        if (fullpageLogo) {
          fullpageLogo.remove();
        }
      } catch {}

      // Remover possíveis logos duplicadas após o cabeçalho
      try {
        const allLogos = Array.from(element.querySelectorAll('img')) as HTMLImageElement[];
        let foundMainLogo = false;
        for (const img of allLogos) {
          if (img.id === 'report-logo') {
            foundMainLogo = true;
            continue;
          }
          // Remove qualquer outra imagem que seja a logo (por src ou alt)
          const src = img.getAttribute('src') || '';
          const alt = img.getAttribute('alt') || '';
          if (foundMainLogo && (src.includes('logo.share') || alt.toLowerCase().includes('share') || alt.toLowerCase().includes('brasil'))) {
            img.remove();
          }
        }
      } catch {}

      const opt = {
        margin: 10,
        filename: `${report.numero}-relatorio-viagem.pdf`,
        image: { type: 'jpeg' as const, quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' as const }
      };

      // Gera PDF, obtém Blob e salva o arquivo localmente
      const worker: any = (html2pdf() as any).set(opt).from(element).toPdf();
      const blob: Blob = await worker.get('pdf').then((pdf: any) => pdf.output('blob'));
      if (download) {
        await worker.save();
      }

      alert('PDF gerado com sucesso!');
      return blob;
    } catch (error) {
      console.error('Erro:', error);
      alert('Erro ao gerar PDF: ' + (error?.message || error));
      return null;
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  // Gerar HTML do relatório
  const generateHTMLReport = (report: any) => {
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
            body {
                font-family: Arial, sans-serif;
                padding: 20px;
                color: #333;
                background: white;
            }
            .report-container {
                border: 2px solid #22c55e;
                padding: 20px;
                border-radius: 8px;
            }
            .header {
                display: grid;
                grid-template-columns: 160px 1fr 160px;
                align-items: center;
                gap: 6px;
                margin-bottom: 10px;
                padding-bottom: 10px;
                border-bottom: 2px solid #22c55e;
            }
            .logo {
                width: 120px;
                height: auto;
            }
            .logo-box {
                width: 160px;
                height: auto;
                background: transparent;
                border: none;
                border-radius: 0;
                display: flex;
                align-items: center;
                justify-content: center;
                overflow: visible;
            }
            .logo-box img {
                max-width: 100%;
                max-height: 120px;
                object-fit: contain;
            }
            .header-title {
                grid-column: 2 / 3;
                text-align: center;
                align-self: center;
            }
            .header-title h1 {
                color: #1e3a8a;
                font-size: 20px;
                font-weight: bold;
                margin-bottom: 4px;
                line-height: 1.2;
            }
            .header-info {
                display: flex;
                justify-content: center;
                gap: 8px;
                font-size: 14px;
            }
            .info-section {
                background: white;
                padding: 15px;
                margin-bottom: 15px;
            }
            .info-grid {
                display: grid;
                grid-template-columns: repeat(3, 1fr);
                gap: 15px;
                margin-bottom: 20px;
            }
            .info-item {
                font-size: 13px;
            }
            .info-item strong {
                color: #1e3a8a;
            }
            .despesas-table {
                width: 100%;
                border-collapse: collapse;
                margin-bottom: 20px;
                font-size: 12px;
            }
            .despesas-table th, .despesas-table td {
                border: 1px solid #ddd;
                padding: 8px;
                text-align: left;
            }
            .despesas-table th {
                background-color: #f2f2f2;
                color: #1e3a8a;
                font-weight: bold;
            }
            .totals-grid {
                display: grid;
                grid-template-columns: repeat(2, 1fr);
                gap: 15px;
                margin-top: 20px;
            }
            .totals-box {
                border: 1px solid #ccc;
                padding: 15px;
                border-radius: 4px;
            }
            .totals-box h3 {
                color: #22c55e;
                margin-bottom: 10px;
                font-size: 14px;
                border-bottom: 1px dashed #22c55e;
                padding-bottom: 5px;
            }
            .total-row {
                display: flex;
                justify-content: space-between;
                font-size: 13px;
                padding: 3px 0;
            }
            .total-final {
                font-weight: bold;
                font-size: 16px;
                color: #1e3a8a;
                margin-top: 10px;
                border-top: 2px solid #22c55e;
                padding-top: 5px;
            }
            .receipts-section {
                margin-top: 30px;
                border-top: 2px dashed #ccc;
                padding-top: 15px;
            }
            .receipts-section h2 {
                color: #1e3a8a;
                font-size: 16px;
                margin-bottom: 15px;
            }
            .receipt-item {
                margin-bottom: 20px;
                border: 1px solid #eee;
                padding: 10px;
                border-radius: 4px;
                page-break-inside: avoid;
            }
            .receipt-item p {
                font-size: 12px;
                margin: 2px 0;
            }
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
            .footer {
                margin-top: 30px;
                padding-top: 15px;
                border-top: 1px solid #ddd;
                text-align: center;
                font-size: 10px;
                color: #777;
            }
            .signature-box {
                margin-top: 40px;
                display: flex;
                justify-content: space-around;
                text-align: center;
            }
            .signature-line {
                border-bottom: 1px solid #333;
                width: 40%;
                margin-top: 50px;
                padding-bottom: 5px;
                font-size: 12px;
            }
            #fullpage-logo {
                display: none;
                width: 100%;
                height: auto;
                margin: 0 auto;
                text-align: center;
                page-break-after: always;
            }
        </style>
    </head>
    <body>
        <div id="fullpage-logo" style="display:none;"></div>
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


  // Renderização
  if (isCreating && currentReport) {
    // Conteúdo de criação/edição do relatório
    return (
      <Layout showRightSidebar={true}>
        <div className="p-4 space-y-4 bg-gray-950 min-h-screen">
        <div className="flex items-center space-x-2 border-b pb-4 mb-4 bg-gray-900" style={{ backgroundColor: 'rgba(99, 236, 216, 0.15)' }}>
          <button onClick={() => { setIsCreating(false); setCurrentReport(null); }} className="p-2 rounded-full hover:bg-gray-100">
            <ArrowLeft size={24} />
          </button>
          <h1 className="text-xl font-bold flex-1">
            {currentReport.numero && currentReport.numero.startsWith('rascunho_') ? 'Novo Rascunho' : (currentReport.numero || 'Novo Relatório')}
          </h1>
          <button
            onClick={() => saveReport('draft')}
            disabled={isGeneratingPdf}
            className="flex items-center space-x-1 text-white disabled:opacity-50"
            style={{ backgroundColor: 'rgba(21, 146, 250, 1)', borderRadius: 10, margin: '15px 30px 7px 17px', padding: '7px 15px 11px' }}
          >
            <Save size={20} />
            <span>Salvar</span>
          </button>
        </div>

        <div className="space-y-4">
          
          <h2 className="text-lg font-semibold border-b pb-2 flex items-center text-gray-100 border-gray-700"><Folder size={18} className="mr-2 text-blue-400" /> Informações da Viagem</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col">
              <label className="text-sm font-medium mb-1 text-gray-200">Cliente *</label>
              <Select 
                value={currentReport.cliente || ''} 
                onValueChange={(value) => {
                  handleInputChange('cliente', value);
                  // Se for um rascunho temporário, recalcula o número ao escolher o cliente
                  if (currentReport.numero && currentReport.numero.startsWith('rascunho_')) {
                    handleInputChange('numero', generateReportNumber(value));
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o Cliente" />
                </SelectTrigger>
                <SelectContent>
                  {cliente.map((c) => (
                    <SelectItem key={c.id} value={c.nome}>{c.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col">
              <label className="text-sm font-medium mb-1 text-gray-200">Aeronave *</label>
              <Select 
                value={currentReport.aeronave || ''} 
                onValueChange={(value) => handleInputChange('aeronave', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a Aeronave" />
                </SelectTrigger>
                <SelectContent>
                  {aeronaves.map((a) => (
                    <SelectItem key={a.id} value={a.prefixo}>{a.prefixo} ({a.modelo})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col">
              <div className="flex items-center justify-between mb-1">
                <label className="text-sm font-medium text-gray-200">Tripulante *</label>
                {!showSecondTripulante && (
                  <button
                    type="button"
                    onClick={() => setShowSecondTripulante(true)}
                    className="p-1 rounded hover:bg-gray-100"
                    aria-label="Adicionar segundo tripulante"
                    title="Adicionar segundo tripulante"
                  >
                    <Plus size={16} />
                  </button>
                )}
              </div>
              <Select
                value={tripulanteSelectValue}
                onValueChange={(value) => {
                  if (value === OUTRO_OPTION) {
                    setIsOutroTripulante(true);
                    handleInputChange('tripulante', ''); // Limpa para o usuário digitar
                  } else {
                    setIsOutroTripulante(false);
                    handleInputChange('tripulante', value);
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione ou Digite o Nome" />
                </SelectTrigger>
                <SelectContent>
                  {uniqueTripulantes.map((t) => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                  <SelectItem value={OUTRO_OPTION}>[Outro: Digitar]</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {isOutroTripulante || !tripulanteSelectValue ? (
              <div className="flex flex-col">
                <label className="text-sm font-medium mb-1 text-gray-200">Nome do Tripulante *</label>
                <input
                  type="text"
                  value={currentReport.tripulante || ''}
                  onChange={(e) => handleInputChange('tripulante', e.target.value)}
                  placeholder="Digite o nome completo"
                  className="p-2 border rounded-md bg-gray-800 border-gray-600 text-gray-100 placeholder-gray-500"
                />
              </div>
            ) : null}

            {showSecondTripulante && (
              <div className="flex flex-col">
                <div className="flex items-center justify-between mb-1">
                  <label className="text-sm font-medium text-gray-200">Tripulante 2</label>
                </div>
                <Select
                  value={tripulante2SelectValue}
                  onValueChange={(value) => {
                    if (value === OUTRO_OPTION) {
                      setIsOutroTripulante2(true);
                      handleInputChange('tripulante2', '');
                    } else {
                      setIsOutroTripulante2(false);
                      handleInputChange('tripulante2', value);
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione ou Digite o Nome" />
                  </SelectTrigger>
                  <SelectContent>
                    {uniqueTripulantes.map((t) => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                    <SelectItem value={OUTRO_OPTION}>[Outro: Digitar]</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
            {showSecondTripulante && (isOutroTripulante2 || !tripulante2SelectValue) ? (
              <div className="flex flex-col">
                <label className="text-sm font-medium mb-1 text-gray-200">Nome do Tripulante 2</label>
                <input
                  type="text"
                  value={currentReport.tripulante2 || ''}
                  onChange={(e) => handleInputChange('tripulante2', e.target.value)}
                  placeholder="Digite o nome completo"
                  className="p-2 border rounded-md bg-gray-800 border-gray-600 text-gray-100 placeholder-gray-500"
                />
              </div>
            ) : null}

            <div className="flex flex-col">
              <label className="text-sm font-medium mb-1 text-gray-200">Trecho *</label>
              <input
                type="text"
                value={currentReport.destino || ''}
                onChange={(e) => handleInputChange('destino', e.target.value)}
                placeholder="Cidade/País"
                className="p-2 border rounded-md bg-gray-800 border-gray-600 text-gray-100 placeholder-gray-500"
              />
            </div>
            <div className="flex flex-col">
              <label className="text-sm font-medium mb-1 text-gray-200">Data Início *</label>
              <input
                type="date"
                value={currentReport.data_inicio || ''}
                onChange={(e) => handleInputChange('data_inicio', e.target.value)}
                className="p-2 border rounded-md bg-gray-800 border-gray-600 text-gray-100 placeholder-gray-500"
              />
            </div>
            <div className="flex flex-col">
              <label className="text-sm font-medium mb-1 text-gray-200">Data Fim</label>
              <input
                type="date"
                value={currentReport.data_fim || ''}
                onChange={(e) => handleInputChange('data_fim', e.target.value)}
                className="p-2 border rounded-md bg-gray-800 border-gray-600 text-gray-100 placeholder-gray-500"
              />
            </div>
            <div className="col-span-2 flex flex-col">
              <label className="text-sm font-medium mb-1 text-gray-200">Observações</label>
              <textarea
                value={currentReport.observacoes || ''}
                onChange={(e) => handleInputChange('observacoes', e.target.value)}
                placeholder="Notas ou informações adicionais sobre a viagem"
                className="p-2 border rounded-md h-20 bg-gray-800 border-gray-600 text-gray-100 placeholder-gray-500"
              />
            </div>
          </div>

          <h2 className="text-lg font-semibold border-b pb-2 pt-4 flex items-center text-gray-100 border-gray-700"><DollarSign size={18} className="mr-2 text-green-500" /> Despesas ({currentReport.despesas.length})</h2>
          
          <div className="space-y-4">
            {currentReport.despesas.map((despesa, index) => (
              <div key={index} className="border p-4 rounded-lg bg-gray-900 relative">
                <div className="absolute top-2 right-2 flex space-x-2">
                  <button onClick={() => removeDespesa(index)} className="p-1 rounded-full text-red-500 hover:bg-red-900">
                    <Trash2 size={18} />
                  </button>
                </div>
                
                <h3 className="text-md font-medium mb-3 text-blue-200">Despesa #{index + 1}</h3>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div className="flex flex-col">
                    <label className="text-xs font-medium mb-1 text-gray-200">Categoria</label>
                    <Select 
                      value={despesa.categoria || ''} 
                      onValueChange={(value) => handleDespesaChange(index, 'categoria', value)}
                    >
                      <SelectTrigger className="text-xs">
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        {CATEGORIAS_DESPESA.map((cat) => (
                          <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex flex-col">
                    <label className="text-xs font-medium mb-1 text-gray-200">Valor (R$)</label>
                    <input
                      type="number"
                      value={despesa.valor || ''}
                      onChange={(e) => handleDespesaChange(index, 'valor', e.target.value)}
                      placeholder="0.00"
                      className="p-2 border rounded-md text-sm bg-gray-800 border-gray-600 text-gray-100 placeholder-gray-500"
                    />
                  </div>
                  <div className="flex flex-col">
                    <label className="text-xs font-medium mb-1 text-gray-200">Pago Por</label>
                    <Select 
                      value={despesa.pago_por || ''} 
                      onValueChange={(value) => handleDespesaChange(index, 'pago_por', value)}
                    >
                      <SelectTrigger className="text-xs">
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        {PAGADORES.map((pag) => (
                          <SelectItem key={pag} value={pag}>{pag}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex flex-col">
                    <label className="text-xs font-medium mb-1">Comprovante</label>
                    <label className={`flex items-center justify-center p-2 border rounded-md cursor-pointer text-sm ${despesa.comprovante_url ? 'bg-green-900 border-green-600 text-green-300' : 'bg-gray-800 border-gray-600 hover:bg-gray-700'}`}>
                      {uploadingIndex === index ? (
                        <span>Carregando...</span>
                      ) : (
                        <>
                          {despesa.comprovante_url ? <Receipt size={16} className="mr-1" /> : <Upload size={16} className="mr-1" />}
                          <span>{despesa.comprovante_url ? 'Comprovante OK' : 'Anexar PDF/Imagem'}</span>
                        </>
                      )}
                      <input 
                        type="file" 
                        onChange={(e) => handleFileUpload(index, e.target.files?.[0])} 
                        className="hidden" 
                        accept="image/*,application/pdf"
                      />
                    </label>
                  </div>
                </div>
                <div className="flex flex-col">
                  <label className="text-xs font-medium mb-1 text-gray-200">Descrição</label>
                  <input
                    type="text"
                    value={despesa.descricao || ''}
                    onChange={(e) => handleDespesaChange(index, 'descricao', e.target.value)}
                    placeholder="Breve descrição da despesa"
                    className="p-2 border rounded-md text-sm bg-gray-800 border-gray-600 text-gray-100 placeholder-gray-500"
                  />
                </div>
              </div>
            ))}
          </div>
          
          <button onClick={addDespesa} className="w-full flex items-center justify-center space-x-2 p-2 border-2 border-dashed border-gray-600 text-gray-400 rounded-md hover:border-blue-400 hover:text-blue-400 transition">
            <Plus size={20} />
            <span>Adicionar Despesa</span>
          </button>

          <button
            onClick={() => saveReport('finalized')}
            disabled={isGeneratingPdf}
            className="w-full flex items-center justify-center space-x-2 p-2 bg-green-500 text-white rounded-md hover:bg-green-600 disabled:opacity-50 mt-4"
          >
            <Send size={20} />
            <span>Finalizar</span>
          </button>

          <h2 className="text-lg font-semibold border-b pb-2 pt-4 flex items-center text-gray-100 border-gray-700"><Clock size={18} className="mr-2 text-red-500" /> Resumo e Totais</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="border p-4 rounded-lg bg-gray-900 shadow-sm border-gray-700">
              <h3 className="text-md font-bold mb-2 text-blue-300">Totais por Categoria</h3>
              <div className="space-y-1 text-sm text-gray-200">
                <div className="flex justify-between"><span>Combustível:</span> <span className="font-semibold">R$ {currentReport.total_combustivel.toFixed(2).replace('.', ',')}</span></div>
                <div className="flex justify-between"><span>Hospedagem:</span> <span className="font-semibold">R$ {currentReport.total_hospedagem.toFixed(2).replace('.', ',')}</span></div>
                <div className="flex justify-between"><span>Alimentação:</span> <span className="font-semibold">R$ {currentReport.total_alimentacao.toFixed(2).replace('.', ',')}</span></div>
                <div className="flex justify-between"><span>Transporte:</span> <span className="font-semibold">R$ {currentReport.total_transporte.toFixed(2).replace('.', ',')}</span></div>
                <div className="flex justify-between"><span>Outros:</span> <span className="font-semibold">R$ {currentReport.total_outros.toFixed(2).replace('.', ',')}</span></div>
                <div className="flex justify-between pt-2 border-t border-gray-700 font-bold text-lg text-green-400"><span>TOTAL GERAL:</span> <span>R$ {currentReport.valor_total.toFixed(2).replace('.', ',')}</span></div>
              </div>
            </div>
            <div className="border p-4 rounded-lg bg-gray-900 shadow-sm border-gray-700">
              <h3 className="text-md font-bold mb-2 text-blue-300">Totais por Pagador</h3>
              <div className="space-y-1 text-sm text-gray-200">
                <div className="flex justify-between"><span>Tripulante:</span> <span className="font-semibold">R$ {currentReport.total_tripulante.toFixed(2).replace('.', ',')}</span></div>
                <div className="flex justify-between"><span>Cliente:</span> <span className="font-semibold">R$ {currentReport.total_cliente.toFixed(2).replace('.', ',')}</span></div>
                <div className="flex justify-between"><span>ShareBrasil:</span> <span className="font-semibold">R$ {currentReport.total_share_brasil.toFixed(2).replace('.', ',')}</span></div>
                <div className="flex justify-between pt-2 border-t border-gray-700 font-bold text-lg text-green-400"><span>TOTAL GERAL:</span> <span>R$ {currentReport.valor_total.toFixed(2).replace('.', ',')}</span></div>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-4 border-t border-gray-700 pt-4">
            <button onClick={() => saveReport('draft')} disabled={isGeneratingPdf} className="flex items-center space-x-1 p-2 bg-yellow-400 text-white rounded-md hover:bg-yellow-500 disabled:opacity-50">
              <Save size={20} />
              <span>Salvar Rascunho</span>
            </button>
            <button onClick={() => saveReport('finalized')} disabled={isGeneratingPdf} className="flex items-center space-x-1 p-2 bg-green-500 text-white rounded-md hover:bg-green-600 disabled:opacity-50">
              <Send size={20} />
              <span>Finalizar e Gerar PDF</span>
            </button>
          </div>

        </div>

        {/* Modal de Visualização de PDF */}
        <Dialog open={pdfModalOpen} onOpenChange={setPdfModalOpen}>
          <DialogContent className="max-w-5xl w-[95vw] h-[90vh] p-0">
            <DialogHeader className="px-6 pt-4">
              <DialogTitle>Visualizar PDF</DialogTitle>
            </DialogHeader>
            <div className="px-6 pb-4 flex gap-2">
              {pdfModalUrl && (
                <>
                  <a href={pdfModalUrl} target="_blank" rel="noreferrer" className="px-3 py-2 bg-blue-600 text-white rounded-md flex items-center gap-2">
                    <ExternalLink size={16} /> Abrir em nova aba
                  </a>
                  <a href={pdfModalUrl} download className="px-3 py-2 bg-green-600 text-white rounded-md flex items-center gap-2">
                    <Download size={16} /> Baixar
                  </a>
                </>
              )}
            </div>
            <div className="w-full h-full">
              {pdfModalUrl ? (
                <iframe src={pdfModalUrl} className="w-full h-full" />
              ) : (
                <div className="p-6 text-sm">Carregando...</div>
              )}
            </div>
          </DialogContent>
        </Dialog>

        <MobileNavigation />
      </div>
      </Layout>
    );
  }

  // Conteúdo da lista de relatórios
  return (
    <Layout showRightSidebar={false}>
      <div className="p-4 space-y-4">
        <h1 className="text-2xl font-bold flex items-center justify-between">
        <span>Relatórios de Viagem</span>
        <button onClick={createNewReport} className="flex items-center space-x-1 p-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 w-[70.5px] max-w-[67px] h-[39px] sm:w-auto sm:max-w-none sm:h-auto">
          <Plus size={20} />
          <span className="text-xs leading-8 sm:text-base sm:leading-6">Novo</span>
        </button>
      </h1>

      <div className="flex items-center space-x-4">
        <Select 
          value={selectedCliente} 
          onValueChange={(v) => setSelectedCliente(v === '__ALL__' ? '' : v)}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filtrar por Cliente" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__ALL__">Todos os Clientes</SelectItem>
            {allClienteFolders.map((c) => (
              <SelectItem key={c} value={c}>{c}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className="text-sm text-gray-500">{visibleReports.length} Rascunho(s) Local</span>
      </div>

      <div className="space-y-3">
        <h2 className="text-lg font-semibold border-b pb-2">Rascunhos Locais ({visibleReports.length})</h2>
        {visibleReports.length === 0 ? (
          <p className="text-gray-500">Nenhum rascunho salvo localmente.</p>
        ) : (
          <div className="space-y-2">
            {visibleReports.sort((a,b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()).map((report) => (
              <div key={report.numero} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{report.cliente || 'Sem Cliente'}: {report.numero}</p>
                  <p className="text-sm text-gray-500 truncate">{report.destino || 'Trecho Não Informado'} - R$ {report.valor_total.toFixed(2).replace('.', ',')}</p>
                  <p className="text-xs text-gray-400">Última edição: {new Date(report.updatedAt).toLocaleDateString('pt-BR')} {new Date(report.updatedAt).toLocaleTimeString('pt-BR')}</p>
                </div>
                <div className="flex space-x-2 ml-4">
                  {report.status !== 'finalized' && (
                    <button onClick={() => { setCurrentReport(report); setIsCreating(true); }} className="p-2 bg-blue-100 text-blue-600 rounded-full hover:bg-blue-200" title="Editar Rascunho">
                      <FileText size={18} />
                    </button>
                  )}
                  {report.status !== 'finalized' && (
                    <button onClick={() => deleteReport(report.numero)} className="p-2 bg-red-100 text-red-600 rounded-full hover:bg-red-200" title="Excluir Rascunho">
                      <Trash2 size={18} />
                    </button>
                  )}
                  {report.status === 'finalized' && (
                    <>
                      <button
                        onClick={async () => {
                          const url = await getReportPdfUrl(report);
                          if (url) {
                            window.open(url, '_blank');
                          } else {
                            alert('PDF não encontrado.');
                          }
                        }}
                        className="p-2 bg-white border text-green-700 rounded-full hover:bg-green-50"
                        title="Visualizar PDF"
                      >
                        <Eye size={18} />
                      </button>
                      <button
                        onClick={async () => {
                          const url = await getReportPdfUrl(report);
                          if (url) {
                            window.open(url, '_blank');
                          } else {
                            alert('PDF não encontrado.');
                          }
                        }}
                        className="p-2 bg-green-200 text-green-700 rounded-full hover:bg-green-300"
                        title="Baixar PDF"
                      >
                        <Download size={18} />
                      </button>
                      <button
                        onClick={() => deleteCreatedReport(report)}
                        className="p-2 bg-red-100 text-red-600 rounded-full hover:bg-red-200"
                        title="Excluir Relatório"
                      >
                        <Trash2 size={18} />
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      <div className="space-y-3 pt-4 border-t">
        <h2 className="text-lg font-semibold border-b pb-2 flex items-center">
          Histórico de PDFs Enviados
          {loadingHistory && <span className="ml-2 text-sm text-gray-500">(Carregando...)</span>}
        </h2>

        {history.length === 0 && !loadingHistory ? (
          <p className="text-gray-500">Nenhum relatório finalizado encontrado no histórico.</p>
        ) : (
          <div className="space-y-2">
            {history.map((item) => (
              <div key={item.id} className="flex items-center justify-between p-3 border rounded-lg bg-green-50">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-green-800 truncate">{item.cliente || 'Sem Cliente'}: {item.numero_relatorio}</p>
                  <p className="text-xs text-gray-500">Enviado em: {new Date(item.created_at).toLocaleDateString('pt-BR')} {new Date(item.created_at).toLocaleTimeString('pt-BR')}</p>
                </div>
                <div className="flex space-x-2 ml-4">
                  <button
                    onClick={async () => {
                      let url: string | null = null;
                      try {
                        const { data, error } = await supabase.storage.from('report-history').createSignedUrl(item.pdf_path, 3600);
                        if (!error) url = data?.signedUrl || null;
                      } catch {}
                      if (!url) {
                        url = supabase.storage.from('report-history').getPublicUrl(item.pdf_path).data.publicUrl as string | null;
                      }
                      if (url) window.open(url, '_blank');
                      else alert('URL do PDF não encontrada.');
                    }}
                    className="p-2 bg-white border text-green-700 rounded-full hover:bg-green-50"
                    title="Visualizar PDF"
                  >
                    <Eye size={18} />
                  </button>
                  <button
                    onClick={() => openHistoryDirect(item)}
                    className="p-2 bg-green-200 text-green-700 rounded-full hover:bg-green-300"
                    title="Abrir PDF"
                  >
                    <FileText size={18} />
                  </button>
                  <button
                    onClick={() => deleteHistoryItem(item)}
                    className="p-2 bg-red-100 text-red-600 rounded-full hover:bg-red-200"
                    title="Excluir"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Modal de Visualização de PDF */}
      <Dialog open={pdfModalOpen} onOpenChange={setPdfModalOpen}>
        <DialogContent className="max-w-5xl w-[95vw] h-[90vh] p-0">
          <DialogHeader className="px-6 pt-4">
            <DialogTitle>Visualizar PDF</DialogTitle>
          </DialogHeader>
          <div className="px-6 pb-4 flex gap-2">
            {pdfModalUrl && (
              <>
                <a href={pdfModalUrl} target="_blank" rel="noreferrer" className="px-3 py-2 bg-blue-600 text-white rounded-md flex items-center gap-2">
                  <ExternalLink size={16} /> Abrir em nova aba
                </a>
                <a href={pdfModalUrl} download className="px-3 py-2 bg-green-600 text-white rounded-md flex items-center gap-2">
                  <Download size={16} /> Baixar
                </a>
              </>
            )}
          </div>
          <div className="w-full h-full">
            {pdfModalUrl ? (
              <iframe src={pdfModalUrl} className="w-full h-full" />
            ) : (
              <div className="p-6 text-sm">Carregando...</div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <MobileNavigation />
    </div>
    </Layout>
  );
};

export default TravelReports;
