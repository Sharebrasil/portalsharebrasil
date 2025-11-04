import { useEffect, useMemo, useRef, useState } from "react";
// Importações de componentes de UI e hooks
import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Receipt, Download, Eye, Plus, Star, Users, Trash2, FolderPlus, FileText } from "lucide-react";

// Biblioteca para o Preview Local (ainda necessária para o botão "Visualizar")
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { numberToCurrencyWordsPtBr } from "@/lib/utils";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

// 🎯 URL EXATA FORNECIDA PELO USUÁRIO 
const EDGE_FUNCTION_URL = "https://jilmlmdgeyzubylncpjy.supabase.co/functions/v1/recibo-pdf";

// --- Configurações do Emissor FIXAS para o modelo (Simulação de Company Settings) ---
// Normalmente, você buscaria isso da tabela 'company_settings' no seu DB
const EMITTER_DEFAULT_SETTINGS = {
  name: "SHARE BRASIL SERVICOS ADMINISTRATIVOS",
  cnpj: "00.968.643/0001-26",
  address: "Avenida Presidente Arthur Bernardes, 1457, Centro-Sul",
  city: "Várzea Grande",
  state: "MT",
  phone: "(65) 99772-9847",
  logo_url: "https://example.com/share_brasil_logo.png" // Substitua pela sua URL real
};
// ---------------------------------------------------------------------------------


// [Interfaces de Dados: Mantidas, pois definem o payload para a Edge Function]

interface FavoritePayer {
  id: string;
  name: string;
  document: string;
  address: string | null;
  city: string | null;
  uf: string | null;
  user_id: string;
  created_at: string | null;
}

interface ClientSuggestion {
  id: string;
  company_name: string | null;
  cnpj: string | null;
  address: string | null;
  city: string | null;
  uf: string | null;
}

type SuggestionItem =
  | { type: "favorite"; id: string; label: string; sublabel?: string; value: FavoritePayer }
  | { type: "client"; id: string; label: string; sublabel?: string; value: ClientSuggestion };

const LOGO_FALLBACK = "https://cdn.builder.io/api/v1/image/assets%2F7985eb4f070c4737bdb55def52f94842%2Fca8ebec9b8374e83bee3347e23f6dbfb?format=webp&width=400";


interface PayerData {
  name: string;
  cpf_cnpj: string;
  address: string;
  city: string;
  uf: string;
}

interface EmitterData extends PayerData {
  // Campos da empresa que serão passados
}

interface ItemData {
  description: string;
  quantity: number | string;
  price: string; // Já formatado em BRL
  total: string; // Já formatado em BRL
}

interface ReceiptTableInsert {
  receipt_number: string;
  issue_date: string;
  amount: number;
  amount_text: string;
  service_description: string;
  number_doc: string | null;
  payoff_number: string | null;
  payer_name: string;
  payer_document: string;
  payer_address: string | null;
  payer_city: string | null;
  payer_uf: string | null;
  user_id: string;
  observacoes: string | null;
  recibo_pdf_url?: string; // Será preenchido na Edge Function
  receipt_type: "reembolso" | "pagamento";
}

interface EdgeFunctionPayload {
  filename: string;
  receipt_number: string;
  total_value: string;
  emitter: EmitterData;
  payer: PayerData;
  items: ItemData[];
  observation: string;
  amount_text: string;
  recepit_table_insert?: ReceiptTableInsert;
}


export default function EmissaoRecibo() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [numero, setNumero] = useState("");
  const [dataEmissao, setDataEmissao] = useState<string>(formatDateLocalYYYYMMDD(new Date())); // Default para hoje
  const [valor, setValor] = useState<string>("");
  const [valorExtenso, setValorExtenso] = useState<string>("");
  const [servico, setServico] = useState("");
  const [numeroDoc, setNumeroDoc] = useState("");
  const [prazoMaximoQuitacao, setPrazoMaximoQuitacao] = useState<string>("");
  const [observacoes, setObservacoes] = useState("");
  const [receiptType, setReceiptType] = useState<"reembolso" | "pagamento">("reembolso");

  const [pagadorNome, setPagadorNome] = useState("");
  const [pagadorDocumento, setPagadorDocumento] = useState("");
  const [pagadorEndereco, setPagadorEndereco] = useState("");
  const [pagadorCidade, setPagadorCidade] = useState("");
  const [pagadorUF, setPagadorUF] = useState("");
  const [addAsFavorite, setAddAsFavorite] = useState(false);

  const [suggestions, setSuggestions] = useState<SuggestionItem[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const debounceRef = useRef<number | null>(null);

  const [favoriteDescriptions, setFavoriteDescriptions] = useState<{ id: string; description: string }[]>([]);
  const [newFavoriteDescription, setNewFavoriteDescription] = useState("");
  const [recentReceipts, setRecentReceipts] = useState<{ id: string; receipt_number: string; issue_date: string; amount: number }[]>([]);
  const [favoritePayers, setFavoritePayers] = useState<FavoritePayer[]>([]);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const canSaveFavorite = useMemo(() => !!(pagadorNome && pagadorDocumento && user?.id), [pagadorNome, pagadorDocumento, user?.id]);


  // --- Funções Auxiliares (mantidas e adaptadas) ---
  useEffect(() => {
    const n = parseFloat(valor.replace(",", "."));
    if (!isNaN(n)) setValorExtenso(numberToCurrencyWordsPtBr(n));
    else setValorExtenso("");
  }, [valor]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // [Lógica de Sugestão e Autocomplete: Mantida]
  useEffect(() => {
    if (debounceRef.current) {
      window.clearTimeout(debounceRef.current);
    }
    if (pagadorNome.trim().length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    debounceRef.current = window.setTimeout(async () => {
      const term = pagadorNome.trim();
      const results: SuggestionItem[] = [];

      try {
        if (user?.id) {
          const favRes = await supabase
            .from("favorite_payers" as any)
            .select("id, name, document, address, city, uf, user_id, created_at")
            .eq("user_id", user.id)
            .ilike("name", `%${term}%`)
            .limit(5);

          const favs: FavoritePayer[] = favRes.data ?? [];
          favs.forEach((f) =>
            results.push({
              type: "favorite",
              id: f.id,
              label: f.name,
              sublabel: f.document,
              value: f,
            })
          );
        }
      } catch (error) {
        // Ignorar se a tabela não existir
      }

      try {
        const clientsRes = await supabase
          .from("clients")
          .select("id, company_name, cnpj, address, city, uf")
          .ilike("company_name", `%${term}%`)
          .limit(5);
        const clients: ClientSuggestion[] = clientsRes.data ?? [];
        clients.forEach((c) =>
          results.push({
            type: "client",
            id: c.id,
            label: c.company_name ?? "Sem nome",
            sublabel: c.cnpj ?? undefined,
            value: c,
          })
        );
      } catch (error) {
        // Ignorar
      }

      setSuggestions(results);
      setShowSuggestions(results.length > 0);
    }, 300);
  }, [pagadorNome, user?.id]);

  const applySuggestion = (s: SuggestionItem) => {
    if (s.type === "favorite") {
      setPagadorNome(s.value.name);
      setPagadorDocumento(s.value.document ?? "");
      setPagadorEndereco(s.value.address ?? "");
      setPagadorCidade(s.value.city ?? "");
      setPagadorUF(s.value.uf ?? "");
    } else {
      setPagadorNome(s.value.company_name ?? "");
      setPagadorDocumento(s.value.cnpj ?? "");
      setPagadorEndereco(s.value.address ?? "");
      setPagadorCidade(s.value.city ?? "");
      setPagadorUF(s.value.uf ?? "");
    }
    setShowSuggestions(false);
  };

  const maybeSaveFavorite = async () => {
    if (!addAsFavorite) return;
    if (!canSaveFavorite) {
      toast({ title: "Dados incompletos", description: "Preencha nome e documento do pagador." });
      return;
    }
    try {
      const { error } = await supabase.from("favorite_payers" as any).insert({
        name: pagadorNome,
        document: pagadorDocumento,
        address: pagadorEndereco || null,
        city: pagadorCidade || null,
        uf: pagadorUF || null,
        user_id: user?.id,
      });
      if (error) throw error;
      toast({ title: "Favorito salvo", description: "Pagador adicionado aos favoritos." });
    } catch (e: any) {
      toast({
        title: "Não foi possível salvar favorito",
        description: "Verifique se a tabela favorite_payers existe no Supabase.",
      });
    }
  };

  const getYearSuffix = (dateStr?: string) => {
    const d = dateStr ? new Date(dateStr) : new Date();
    const yy = d.getFullYear() % 100;
    return yy.toString().padStart(2, "0");
  };

  const random3 = () => Math.floor(Math.random() * 1000).toString().padStart(3, "0");

  const generateUniqueReceiptNumber = async (yearSuffix: string): Promise<string> => {
    for (let i = 0; i < 10; i++) {
      const candidate = `${random3()}/${yearSuffix}`;
      const { data, error } = await supabase
        .from("receipts" as any)
        .select("id")
        .eq("receipt_number", candidate)
        .limit(1);
      if (!error && (!data || data.length === 0)) return candidate;
    }
    throw new Error("Falha ao gerar número único de recibo");
  };

  const ensureNumero = async () => {
    const yy = getYearSuffix(dataEmissao);
    if (!numero || !numero.endsWith(`/${yy}`)) {
      const n = await generateUniqueReceiptNumber(yy);
      setNumero(n);
      return n;
    }
    return numero;
  };

  const formatBRL = (num: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(num);

  const loadFavoriteDescriptions = async () => {
    if (!user?.id) return;
    const { data } = await supabase.from("favorite_services" as any).select("id, description").eq("user_id", user.id).order("created_at", { ascending: false });
    setFavoriteDescriptions((data as any) ?? []);
  };

  const loadReceipts = async () => {
    if (!user?.id) return;
    const { data } = await supabase.from("receipts" as any).select("id, receipt_number, issue_date, amount").eq("user_id", user.id).order("issue_date", { ascending: false });
    setRecentReceipts((data as any) ?? []);
  };

  const loadFavoritePayers = async () => {
    if (!user?.id) return;
    const { data } = await supabase.from("favorite_payers" as any).select("id, name, document, address, city, uf, user_id, created_at").eq("user_id", user.id).order("created_at", { ascending: false });
    setFavoritePayers((data as any) ?? []);
  };

  useEffect(() => {
    if (!user?.id) return;
    void loadFavoriteDescriptions();
    void loadReceipts();
    void loadFavoritePayers();
  }, [user?.id]);

  function formatDateLocalYYYYMMDD(d: Date): string {
    const y = d.getFullYear();
    const m = (d.getMonth() + 1).toString().padStart(2, "0");
    const day = d.getDate().toString().padStart(2, "0");
    return `${y}-${m}-${day}`;
  }

  const formatDateDisplay = (dateStr: string) => {
    if (!dateStr) return "";
    if (/^\d{4}-\d{2}-\d{2}/.test(dateStr)) {
      const [y, m, d] = dateStr.slice(0, 10).split("-");
      return `${d}/${m}/${y}`;
    }
    return new Date(dateStr).toLocaleDateString("pt-BR");
  };

  const fetchCompanySettings = async () => {
    // Em vez de buscar do DB, usamos as configurações fixas do modelo.
    // Se você quiser buscar do DB, descomente o código original:
    // const { data } = await supabase.from("company_settings").select("name, cnpj, address, city, state, phone, logo_url").order("created_at", { ascending: false }).limit(1);
    // return data && data.length > 0 ? data[0] : null;

    return EMITTER_DEFAULT_SETTINGS;
  };

  // --- CHAMADA PARA A EDGE FUNCTION (Gerar/Upload) ---
  const callEdgeFunctionToGeneratePDF = async (recNumber: string, emitter: any): Promise<string> => {
    const amountNum = parseFloat(valor || "0");
    const formattedAmount = formatBRL(amountNum);

    if (!recNumber || !dataEmissao || !amountNum || !servico.trim() || !pagadorNome.trim() || !pagadorDocumento.trim()) {
      throw new Error("Preencha os campos obrigatórios (Número, Data, Valor, Serviço e dados do Pagador).");
    }

    const payload: EdgeFunctionPayload = {
      filename: `recibo-${recNumber}.pdf`,
      receipt_number: recNumber,
      total_value: formattedAmount,
      amount_text: valorExtenso || numberToCurrencyWordsPtBr(amountNum),
      observation: observacoes || '',

      emitter: {
        name: emitter?.name || "EMISSOR",
        cpf_cnpj: emitter?.cnpj || '',
        address: emitter?.address || '',
        city: emitter?.city || '',
        uf: emitter?.state || '',
      },

      payer: {
        name: pagadorNome,
        cpf_cnpj: pagadorDocumento,
        address: pagadorEndereco || '',
        city: pagadorCidade || '',
        uf: pagadorUF || '',
      },

      items: [{
        description: servico,
        quantity: 1,
        price: formattedAmount,
        total: formattedAmount,
      }],

      recepit_table_insert: {
        receipt_number: recNumber,
        issue_date: (dataEmissao && dataEmissao.length >= 10) ? dataEmissao : formatDateLocalYYYYMMDD(new Date()),
        amount: amountNum,
        amount_text: valorExtenso || numberToCurrencyWordsPtBr(amountNum),
        service_description: servico,
        number_doc: numeroDoc || null,
        payoff_number: prazoMaximoQuitacao || null,
        payer_name: pagadorNome,
        payer_document: pagadorDocumento,
        payer_address: pagadorEndereco || null,
        payer_city: pagadorCidade || null,
        payer_uf: pagadorUF || null,
        user_id: user!.id,
        observacoes: observacoes || null,
        receipt_type: receiptType,
      }
    };

    const response = await fetch(EDGE_FUNCTION_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabase.auth.session()?.access_token || ''}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Erro de rede ou função desconhecido.' }));
      throw new Error(`Erro ${response.status}: ${errorData.error || response.statusText}`);
    }

    const data: { url: string } = await response.json();
    return data.url;
  };


  // --- FUNÇÃO AJUSTADA: Gera PDF e faz Upload via Edge Function ---
  const onGerarPDF = async () => {
    try {
      if (!user?.id) {
        toast({ title: "Sessão necessária", description: "Faça login para gerar o recibo." });
        return;
      }

      const recNumber = await ensureNumero();

      // 1. Obter as configurações da empresa (Emissor) - Usando as settings fixas do modelo
      const company = await fetchCompanySettings();

      // 2. Chamar a Edge Function para Gerar PDF, Upload no Storage e Inserir no DB
      const publicUrl = await callEdgeFunctionToGeneratePDF(recNumber, company);

      // 3. Feedback e Preparar Preview
      setPreviewUrl(publicUrl);
      setIsPreviewOpen(true);
      toast({ title: "Recibo gerado", description: recNumber });
      await loadReceipts();
      await maybeSaveFavorite();

    } catch (e: any) {
      toast({ title: "Erro ao gerar PDF", description: e?.message || "Verifique se a Edge Function está implantada e a URL correta." });
    }
  };

  // --- FUNÇÃO AJUSTADA: Visualizar (Recria o PDF localmente para o preview) ---
  const onVisualizar = async () => {
    try {
      const recNumber = await ensureNumero();

      const drawPdf = async (recNumber: string): Promise<Uint8Array> => {
        const company = await fetchCompanySettings(); // Pega as settings
        const amountNum = parseFloat(valor || "0");
        const pdfDoc = await PDFDocument.create();
        const page = pdfDoc.addPage([595, 842]); // A4
        const { width, height } = page.getSize();
        const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
        const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
        const MARGIN = 50;
        let y = height - 80;

        const wrapText = (text: string, maxWidth: number, fontRef: any, size: number): string[] => {
          const words = text.split(/\s+/);
          const lines: string[] = [];
          let line = "";
          for (const w of words) {
            const test = line ? `${line} ${w}` : w;
            if (fontRef.widthOfTextAtSize(test, size) > maxWidth && line) {
              lines.push(line);
              line = w;
            } else {
              line = test;
            }
          }
          if (line) lines.push(line);
          return lines;
        };

        // --- Layout do Modelo (Ajustado para o Preview Local) ---
        let logoImage: any = null;
        try {
          const logoBytes = await fetch(company?.logo_url || LOGO_FALLBACK).then(r => r.arrayBuffer());
          logoImage = await pdfDoc.embedPng(logoBytes);
          page.drawImage(logoImage, { x: MARGIN, y: y - 35, width: 80, height: 35 });
        } catch {
          page.drawText(company?.name || "EMISSOR", { x: MARGIN, y: y, size: 10, font: bold });
        }

        const title = "RECIBO DE PAGAMENTO";
        page.drawText(title, {
          x: width / 2 - bold.widthOfTextAtSize(title, 16) / 2,
          y: y - 10,
          size: 16,
          font: bold
        });

        // Caixa de Valor (Canto Superior Direito)
        const valueBox = {
          width: 110,
          height: 50,
          x: width - MARGIN - 110,
          y: y - 50
        };

        page.drawRectangle({
          x: valueBox.x,
          y: valueBox.y,
          width: valueBox.width,
          height: valueBox.height,
          borderColor: rgb(0.6, 0.6, 0.6),
          borderWidth: 1
        });

        page.drawText(formatBRL(amountNum), {
          x: valueBox.x + 10,
          y: valueBox.y + 30,
          size: 12,
          font: bold
        });

        // Número do Recibo na Caixa
        page.drawText("Número do recibo:", {
          x: valueBox.x + 10,
          y: valueBox.y + 18,
          size: 7,
          font
        });

        page.drawText(recNumber, {
          x: valueBox.x + 10,
          y: valueBox.y + 8,
          size: 8,
          font
        });

        // Dados do Emissor (Canto Superior Esquerdo, Abaixo do Logo)
        y -= 80;
        const xEmitter = MARGIN;
        page.drawText("Emissor:", { x: xEmitter, y, size: 8, font: bold });
        y -= 12;

        const emitterLines = [
          company?.name || "EMISSOR",
          company?.cnpj ? `CNPJ: ${company.cnpj}` : "",
          company?.address || "",
          company?.city && company?.state ? `${company.city} - ${company.state}, ${company?.phone}` : ""
        ].filter(Boolean);

        emitterLines.forEach(line => {
          page.drawText(line, { x: xEmitter, y, size: 7, font });
          y -= 10;
        });

        // Dados do Pagador (Canto Superior Centralizado)
        let yPayer = height - 160;
        const xPayer = width / 2 - 10; // Centralizado

        page.drawText("Pagador:", { x: xPayer, y: yPayer, size: 8, font: bold });
        yPayer -= 12;

        page.drawText(pagadorNome.toUpperCase(), { x: xPayer, y: yPayer, size: 8, font: bold });
        yPayer -= 10;

        page.drawText(`CNPJ: ${pagadorDocumento}`, { x: xPayer, y: yPayer, size: 7, font });
        yPayer -= 10;

        // Título da Descrição
        y = Math.min(y, yPayer) - 30;
        let tableY = y;

        page.drawText("DESCRIÇÃO", { x: MARGIN + 5, y: tableY, size: 9, font: bold });
        page.drawText("TOTAL", { x: width - MARGIN - 60, y: tableY, size: 9, font: bold });
        tableY -= 3;

        page.drawLine({ start: { x: MARGIN, y: tableY }, end: { x: width - MARGIN, y: tableY }, thickness: 1, color: rgb(0, 0, 0) });
        tableY -= 15;

        // Descrição do Serviço
        const descLines = wrapText(servico, width - MARGIN * 2 - 100, font, 8);
        descLines.forEach((line, idx) => {
          page.drawText(line, { x: MARGIN + 5, y: tableY - (idx * 12), size: 8, font });
          if (idx === 0) {
            page.drawText(formatBRL(amountNum), {
              x: width - MARGIN - 60,
              y: tableY - (idx * 12),
              size: 8,
              font
            });
          }
        });
        tableY -= (descLines.length * 12) + 15;

        page.drawLine({ start: { x: MARGIN, y: tableY }, end: { x: width - MARGIN, y: tableY }, thickness: 0.5 });
        tableY -= 30;

        // Bloco de Observações (adaptado do modelo)
        const valorExtensoText = valorExtenso || numberToCurrencyWordsPtBr(amountNum);

        const obsText = receiptType === "pagamento"
          ? `Declaração: Recebemos de ${pagadorNome.toUpperCase()}, a importância de ${valorExtensoText.toLowerCase()}, referente aos itens listados acima. Para maior clareza, firmo o presente recibo para que produza seus efeitos, dando plena, geral e irrevogável quitação pelo valor recebido.`
          : `OBS: Declaro, para os devidos fins, que o presente recibo é emitido antecipadamente a título de solicitação de reembolso referente às despesas efetuadas por esta empresa em benefício do cliente acima identificado.\n\nRessalta-se que o presente documento somente terá validade e produzirá seus efeitos legais após a efetiva quitação do valor nele indicado, mediante comprovação do respectivo pagamento.\n\nPara maior clareza e segurança das partes, firmo o presente recibo, que permanecerá condicionado ao cumprimento integral da obrigação de pagamento até a data de quitação.`;

        // Adiciona a observação do modelo (sem o "OBS:" inicial, pois já está na variável)
        const obsLines = wrapText(obsText, width - MARGIN * 2, font, 8);
        obsLines.forEach((line, idx) => {
          page.drawText(line, { x: MARGIN, y: tableY - (idx * 10), size: 8, font });
        });
        tableY -= (obsLines.length * 10) + 30;

        // Data e Cidade
        const todayLocal = new Date();
        const issueDateFormatted = todayLocal.toLocaleDateString("pt-BR").split("/");
        const cityText = company?.city || pagadorCidade || "Várzea Grande";
        const monthNames = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
        const month = monthNames[todayLocal.getMonth()];
        const year = todayLocal.getFullYear();
        const day = todayLocal.getDate();

        const dataCidadeText = `${cityText}, ${day} de ${month} de ${year}`;

        page.drawText(dataCidadeText, { x: MARGIN, y: tableY, size: 9, font: bold });

        // Assinatura
        const signY = tableY - 80;

        if (logoImage) {
          page.drawImage(logoImage, {
            x: width / 2 - 40,
            y: signY + 15,
            width: 80,
            height: 30
          });
        }

        page.drawLine({
          start: { x: width / 2 - 100, y: signY },
          end: { x: width / 2 + 100, y: signY },
          thickness: 0.5
        });

        const sigText = "setor financeiro Share Brasil";
        page.drawText(sigText, {
          x: width / 2 - font.widthOfTextAtSize(sigText, 7) / 2,
          y: signY - 12,
          size: 7,
          font
        });

        const bytes = await pdfDoc.save();
        return bytes;
      };

      const bytes = await drawPdf(recNumber);
      const blob = new Blob([bytes], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      setPreviewUrl(url);
      setIsPreviewOpen(true);
    } catch (e: any) {
      toast({ title: "Erro ao gerar preview", description: e?.message || "" });
    }
  };


  // --- FUNÇÃO AJUSTADA: Download de Recibo Existente ---
  const onDownloadReciboExistente = async (receiptNumber: string) => {
    try {
      const fileName = `recibo-${receiptNumber}.pdf`;
      const downloadUrl = `${EDGE_FUNCTION_URL}?file=${encodeURIComponent(fileName)}`;
      window.open(downloadUrl, '_blank');

    } catch (e: any) {
      toast({ title: "Erro no Download", description: e?.message || "Falha ao iniciar download via Edge Function." });
    }
  };

  return (
    <Layout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Emissão de Recibo</h1>
            <p className="text-muted-foreground mt-2">Gere recibos para pagamentos e serviços prestados</p>
          </div>
          <Button className="flex items-center gap-2" onClick={() => { /* Limpar campos */ }}>
            <Plus className="h-4 w-4" />
            Novo Recibo
          </Button>
        </div>

        <Tabs defaultValue="descricoes" className="w-full">
          <TabsList className="grid w-full grid-cols-3 max-w-xl mt-2">
            <TabsTrigger value="descricoes">Descrição favoritas</TabsTrigger>
            <TabsTrigger value="recibos">Recibos</TabsTrigger>
            <TabsTrigger value="pagadores">Pagador favoritos</TabsTrigger>
          </TabsList>

          <TabsContent value="descricoes">
            <Card className="mt-4">
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><FileText className="h-4 w-4" /> Descrições favoritas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input placeholder="Nova descrição" value={newFavoriteDescription} onChange={(e) => setNewFavoriteDescription(e.target.value)} />
                  <Button onClick={async () => {
                    if (!user?.id || !newFavoriteDescription.trim()) return;
                    const { error } = await supabase.from("favorite_services" as any).insert({ description: newFavoriteDescription.trim(), user_id: user.id });
                    if (!error) { setNewFavoriteDescription(""); await loadFavoriteDescriptions(); toast({ title: "Descrição adicionada" }); }
                    else toast({ title: "Erro", description: error.message });
                  }}>
                    <FolderPlus className="h-4 w-4 mr-2" /> Adicionar
                  </Button>
                </div>
                <div className="space-y-2">
                  {favoriteDescriptions.map(d => (
                    <div key={d.id} className="flex items-center justify-between rounded border p-2">
                      <span className="text-sm">{d.description}</span>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => setServico(d.description)}>Usar</Button>
                        <Button variant="destructive" size="sm" onClick={async () => { await supabase.from("favorite_services" as any).delete().eq("id", d.id); await loadFavoriteDescriptions(); }}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  {favoriteDescriptions.length === 0 && <div className="text-sm text-muted-foreground">Nenhuma descrição favorita</div>}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="recibos">
            <Card className="mt-4">
              <CardHeader>
                <CardTitle>Recibos</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {recentReceipts.map(r => (
                  <div key={r.id} className="flex items-center justify-between rounded border p-2">
                    <div className="text-sm">{r.receipt_number} • {formatDateDisplay(r.issue_date)} • {formatBRL(r.amount)}</div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={async () => {
                        const path = `recibo-${r.receipt_number}.pdf`;
                        const { data } = supabase.storage.from("recibos").getPublicUrl(path);
                        if (data?.publicUrl) window.open(data.publicUrl, "_blank");
                      }}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => onDownloadReciboExistente(r.receipt_number)}>
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button variant="destructive" size="sm" onClick={async () => {
                        const path = `recibo-${r.receipt_number}.pdf`;
                        await supabase.storage.from("recibos").remove([path]);
                        await supabase.from("receipts" as any).delete().eq("id", r.id);
                        await loadReceipts();
                      }}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
                {recentReceipts.length === 0 && <div className="text-sm text-muted-foreground">Nenhum recibo</div>}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="pagadores">
            <Card className="mt-4">
              <CardHeader>
                <CardTitle>Pagadores favoritos</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {favoritePayers.map(p => (
                  <div key={p.id} className="flex items-center justify-between rounded border p-2">
                    <div className="text-sm">
                      <div className="font-medium">{p.name}</div>
                      <div className="text-muted-foreground text-xs">{p.document}</div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => applySuggestion({ type: "favorite", id: p.id, label: p.name, sublabel: p.document, value: p })}>Usar</Button>
                      <Button variant="destructive" size="sm" onClick={async () => { await supabase.from("favorite_payers" as any).delete().eq("id", p.id); await loadFavoritePayers(); }}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
                {favoritePayers.length === 0 && <div className="text-sm text-muted-foreground">Nenhum pagador favorito</div>}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Receipt className="h-5 w-5" />
                Dados do Recibo
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="numero">Número do Recibo</Label>
                  <Input id="numero" placeholder="001/2024" value={numero} onChange={(e) => setNumero(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="data">Data de Emissão</Label>
                  <Input id="data" type="date" value={dataEmissao} onChange={(e) => setDataEmissao(e.target.value)} />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="valor">Valor (R$)</Label>
                <Input id="valor" type="number" placeholder="0,00" step="0.01" value={valor} onChange={(e) => setValor(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Tipo de Recibo</Label>
                <RadioGroup value={receiptType} onValueChange={(v) => setReceiptType(v as "reembolso" | "pagamento")} className="grid grid-cols-2 gap-3">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem id="tipo-reembolso" value="reembolso" />
                    <Label htmlFor="tipo-reembolso" className="cursor-pointer">Solicitação de reembolso</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem id="tipo-pagamento" value="pagamento" />
                    <Label htmlFor="tipo-pagamento" className="cursor-pointer">Pagamento realizado</Label>
                  </div>
                </RadioGroup>
              </div>
              <div className="space-y-2">
                <Label htmlFor="observacoes">Observações (opcional)</Label>
                <Textarea id="observacoes" placeholder="Observações adicionais" rows={2} value={observacoes} onChange={(e) => setObservacoes(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="servico">Descrição do Serviço</Label>
                <Textarea id="servico" placeholder="Descreva os serviços prestados" rows={3} value={servico} onChange={(e) => setServico(e.target.value)} />
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="numero-doc"><p>Número Doc</p></Label>
                  <Input id="numero-doc" placeholder="Ex.: REC2025.044 (se diferente do número do recibo)" value={numeroDoc} onChange={(e) => setNumeroDoc(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="prazo">Prazo Máximo de Quitação</Label>
                  <Input id="prazo" type="date" value={prazoMaximoQuitacao} onChange={(e) => setPrazoMaximoQuitacao(e.target.value)} />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Dados do Pagador</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2 relative" ref={containerRef}>
                <Label htmlFor="pagador-nome">Nome/Razão Social</Label>
                <Input
                  id="pagador-nome"
                  placeholder="Comece a digitar para buscar favoritos ou clientes"
                  value={pagadorNome}
                  onChange={(e) => setPagadorNome(e.target.value)}
                  onFocus={() => setShowSuggestions(suggestions.length > 0)}
                />
                {showSuggestions && (
                  <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover text-popover-foreground shadow-md">
                    <div className="max-h-64 overflow-auto p-2 space-y-1">
                      {suggestions.length === 0 && (
                        <div className="text-sm text-muted-foreground p-2">Sem resultados</div>
                      )}
                      {suggestions
                        .filter((s) => s.type === "favorite")
                        .map((s) => (
                          <button
                            key={s.id}
                            type="button"
                            className="w-full text-left px-3 py-2 rounded hover:bg-accent"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => applySuggestion(s)}
                          >
                            <div className="flex items-center gap-2">
                              <Star className="h-4 w-4 text-primary" />
                              <div>
                                <span className="font-medium">{s.label}</span>
                                <span className="text-xs text-muted-foreground ml-2">{s.sublabel}</span>
                              </div>
                            </div>
                          </button>
                        ))}
                      {suggestions
                        .filter((s) => s.type === "client")
                        .map((s) => (
                          <button
                            key={s.id}
                            type="button"
                            className="w-full text-left px-3 py-2 rounded hover:bg-accent"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => applySuggestion(s)}
                          >
                            <div className="flex items-center gap-2">
                              <Users className="h-4 w-4 text-muted-foreground" />
                              <div>
                                <span className="font-medium">{s.label}</span>
                                <span className="text-xs text-muted-foreground ml-2">{s.sublabel}</span>
                              </div>
                            </div>
                          </button>
                        ))}
                    </div>
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="pagador-documento">CPF/CNPJ</Label>
                <Input id="pagador-documento" placeholder="00.000.000/0000-00" value={pagadorDocumento} onChange={(e) => setPagadorDocumento(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pagador-endereco">Endereço (Rua, Número, Bairro)</Label>
                <Input id="pagador-endereco" placeholder="Rua, Número, Bairro" value={pagadorEndereco} onChange={(e) => setPagadorEndereco(e.target.value)} />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-2 space-y-2">
                  <Label htmlFor="pagador-cidade">Cidade</Label>
                  <Input id="pagador-cidade" placeholder="Cidade" value={pagadorCidade} onChange={(e) => setPagadorCidade(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pagador-uf">UF</Label>
                  <Input id="pagador-uf" placeholder="UF" maxLength={2} value={pagadorUF} onChange={(e) => setPagadorUF(e.target.value.toUpperCase())} />
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox id="save-favorite" checked={addAsFavorite} onCheckedChange={(checked) => setAddAsFavorite(!!checked)} disabled={!canSaveFavorite} />
                <Label htmlFor="save-favorite">Adicionar como pagador favorito</Label>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <Button variant="secondary" onClick={onVisualizar} disabled={!valor || !servico}>
            <Eye className="h-4 w-4 mr-2" /> Visualizar (Preview Local)
          </Button>
          <Button onClick={onGerarPDF} disabled={!valor || !servico || !pagadorNome}>
            <Download className="h-4 w-4 mr-2" /> Gerar PDF e Salvar
          </Button>
        </div>
      </div>

      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="sm:max-w-[800px] h-[90vh]">
          <DialogHeader>
            <DialogTitle>Pré-visualização do Recibo {numero}</DialogTitle>
          </DialogHeader>
          <div className="h-full">
            {previewUrl && (
              <iframe src={previewUrl} className="w-full h-full border-none" title="Recibo Preview" />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}