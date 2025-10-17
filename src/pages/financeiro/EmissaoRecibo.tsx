import { useEffect, useMemo, useRef, useState } from "react";
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
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { numberToCurrencyWordsPtBr } from "@/lib/utils";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface FavoritePayer {
  id: string;
  name: string;
  document: string;
  address: string | null;
  city: string | null;
  state: string | null;
  user_id: string;
  created_at: string | null;
}

interface ClientSuggestion {
  id: string;
  company_name: string | null;
  cnpj: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
}

type SuggestionItem =
  | { type: "favorite"; id: string; label: string; sublabel?: string; value: FavoritePayer }
  | { type: "client"; id: string; label: string; sublabel?: string; value: ClientSuggestion };

const LOGO_FALLBACK = "https://cdn.builder.io/api/v1/image/assets%2F7985eb4f070c4737bdb55def52f94842%2Fca8ebec9b8374e83bee3347e23f6dbfb?format=webp&width=400";

export default function EmissaoRecibo() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [numero, setNumero] = useState("");
  const [dataEmissao, setDataEmissao] = useState<string>("");
  const [valor, setValor] = useState<string>("");
  const [valorExtenso, setValorExtenso] = useState<string>("");
  const [servico, setServico] = useState("");
  const [numeroDoc, setNumeroDoc] = useState("");
  const [prazoMaximoQuitacao, setPrazoMaximoQuitacao] = useState<string>("");

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

  useEffect(() => {
    const n = parseFloat(valor.replace(",", "."));
    if (!isNaN(n)) setValorExtenso(numberToCurrencyWordsPtBr(n));
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
            .select("id, name, document, address, city, state, user_id, created_at")
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
        // Ignore if table doesn't exist; we'll still show client suggestions
      }

      try {
        const clientsRes = await supabase
          .from("clients")
          .select("id, company_name, cnpj, address, city, state")
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
        // No clients available
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
      setPagadorUF(s.value.state ?? "");
    } else {
      setPagadorNome(s.value.company_name ?? "");
      setPagadorDocumento(s.value.cnpj ?? "");
      setPagadorEndereco(s.value.address ?? "");
      setPagadorCidade(s.value.city ?? "");
      setPagadorUF(s.value.state ?? "");
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
        state: pagadorUF || null,
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
    const { data } = await supabase.from("favorite_payers" as any).select("id, name, document, address, city, state, user_id, created_at").eq("user_id", user.id).order("created_at", { ascending: false });
    setFavoritePayers((data as any) ?? []);
  };

  useEffect(() => {
    if (!user?.id) return;
    void loadFavoriteDescriptions();
    void loadReceipts();
    void loadFavoritePayers();
  }, [user?.id]);

  const saveReceipt = async (): Promise<string | null> => {
    if (!user?.id) {
      toast({ title: "Sessão necessária", description: "Faça login para salvar o recibo." });
      return null;
    }
    const recNumber = await ensureNumero();
    const issueDate = (dataEmissao && dataEmissao.length >= 10) ? dataEmissao : new Date().toISOString().slice(0, 10);
    const amountNum = parseFloat(valor || "0");

    if (!recNumber || !issueDate || !amountNum || !valorExtenso.trim() || !servico.trim() || !pagadorNome.trim() || !pagadorDocumento.trim()) {
      toast({ title: "Preencha os campos obrigatórios", description: "Número, data, valor, valor por extenso, serviço e dados do pagador." });
      return null;
    }

    const { error } = await supabase.from("receipts" as any).insert({
      receipt_number: recNumber,
      issue_date: issueDate,
      amount: amountNum,
      amount_text: valorExtenso,
      service_description: servico,
      number_doc: numeroDoc || null,
      payoff_number: prazoMaximoQuitacao || null,
      payer_name: pagadorNome,
      payer_document: pagadorDocumento,
      payer_address: pagadorEndereco || null,
      payer_city: pagadorCidade || null,
      payer_state: pagadorUF || null,
      user_id: user.id,
    });

    if (error) {
      toast({ title: "Erro ao salvar recibo", description: "Verifique se a tabela receipts existe no Supabase." });
      return null;
    }

    toast({ title: "Recibo salvo", description: recNumber });
    return recNumber;
  };

  const fetchCompanySettings = async () => {
    const { data } = await supabase
      .from("company_settings")
      .select("name, cnpj, address, city, state, logo_url")
      .order("created_at", { ascending: false })
      .limit(1);
    return data && data.length > 0 ? data[0] : null;
  };

  interface ReceiptData {
    receipt_number: string;
    issue_date: string;
    amount: number;
    amount_text: string;
    service_description: string;
    payer_name: string;
    payer_document: string;
    payer_address?: string;
    payer_city?: string;
    payer_uf?: string;
    number_doc?: string;
    payoff_number?: string;
  }

  interface CompanyData {
    name: string;
    cnpj: string;
    address: string;
    city: string;
    uf: string;
    phone?: string;
  }

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("pt-BR");
  };

  function wrapText(text: string, maxWidth: number, fontRef: any, fontSize: number): string[] {
    const words = text.split(" ");
    const lines: string[] = [];
    let currentLine = "";
    for (const word of words) {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      const testWidth = fontRef.widthOfTextAtSize(testLine, fontSize);
      if (testWidth > maxWidth && currentLine) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    }
    if (currentLine) lines.push(currentLine);
    return lines;
  }

  export const generateReceiptPDF = async (
    receipt: ReceiptData,
    company: CompanyData
  ): Promise<Uint8Array> => {
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([595, 420]);
    const { width, height } = page.getSize();

    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    try {
      const logoUrl = "/logo.share.png";
      const logoBytes = await fetch(logoUrl).then((r) => r.arrayBuffer());
      const logoImage = await pdfDoc.embedPng(logoBytes);
      const logoWidth = 80;
      const logoHeight = 50;
      page.drawImage(logoImage, {
        x: 30,
        y: height - logoHeight - 20,
        width: logoWidth,
        height: logoHeight,
      });
    } catch {}

    const titleText = "RECIBO DE PAGAMENTO";
    const titleWidth = fontBold.widthOfTextAtSize(titleText, 14);
    page.drawText(titleText, {
      x: (width - titleWidth) / 2,
      y: height - 40,
      size: 14,
      font: fontBold,
      color: rgb(0, 0, 0),
    });

    const boxX = width - 170;
    const boxY = height - 95;
    const boxWidth = 140;
    const boxHeight = 60;
    page.drawRectangle({ x: boxX, y: boxY, width: boxWidth, height: boxHeight, borderColor: rgb(0, 0, 0), borderWidth: 1, color: rgb(0.95, 0.95, 0.95) });
    page.drawText(formatBRL(receipt.amount), { x: boxX + 10, y: boxY + 35, size: 12, font: fontBold });
    page.drawText(`Número do recibo:`, { x: boxX + 10, y: boxY + 18, size: 8, font });
    page.drawText(receipt.receipt_number, { x: boxX + 10, y: boxY + 8, size: 10, font: fontBold });

    let yPos = height - 110;
    page.drawText("Emissor", { x: 30, y: yPos, size: 10, font: fontBold });
    yPos -= 15; page.drawText(company.name, { x: 30, y: yPos, size: 9, font: fontBold });
    yPos -= 13; page.drawText(`CNPJ: ${company.cnpj}`, { x: 30, y: yPos, size: 8, font });
    yPos -= 13; page.drawText(company.phone || "/ (65) 98173-0641", { x: 30, y: yPos, size: 8, font });
    yPos -= 13; page.drawText(`${company.address},`, { x: 30, y: yPos, size: 8, font });
    yPos -= 13; page.drawText(`${company.city} - ${company.uf}`, { x: 30, y: yPos, size: 8, font });

    yPos = height - 110;
    const payerX = 310;
    page.drawText("Pagador", { x: payerX, y: yPos, size: 10, font: fontBold });
    yPos -= 15;
    const payerNameLines = wrapText(receipt.payer_name, 250, font, 9);
    payerNameLines.forEach((line) => { page.drawText(line, { x: payerX, y: yPos, size: 9, font: fontBold }); yPos -= 13; });
    page.drawText(`CNPJ: ${receipt.payer_document}`, { x: payerX, y: yPos, size: 8, font });

    yPos -= 25;
    page.drawLine({ start: { x: 30, y: yPos }, end: { x: width - 30, y: yPos }, thickness: 1, color: rgb(0, 0, 0) });

    yPos -= 18;
    page.drawText("DESCRIÇÃO", { x: 35, y: yPos, size: 9, font: fontBold });
    page.drawText("QUANT.", { x: width - 220, y: yPos, size: 9, font: fontBold });
    page.drawText("PREÇO", { x: width - 160, y: yPos, size: 9, font: fontBold });
    page.drawText("TOTAL", { x: width - 90, y: yPos, size: 9, font: fontBold });

    yPos -= 8;
    page.drawLine({ start: { x: 30, y: yPos }, end: { x: width - 30, y: yPos }, thickness: 0.5, color: rgb(0, 0, 0) });

    yPos -= 15;
    let fullDescription = receipt.service_description;
    if (receipt.number_doc) fullDescription += ` - NºDOC ${receipt.number_doc}`;
    const descriptionLines = wrapText(fullDescription, width - 280, font, 9);
    descriptionLines.forEach((line, idx) => { page.drawText(line, { x: 35, y: yPos - idx * 12, size: 9, font }); });
    page.drawText("1", { x: width - 220, y: yPos, size: 9, font });
    page.drawText(formatBRL(receipt.amount), { x: width - 160, y: yPos, size: 9, font });
    page.drawText(formatBRL(receipt.amount), { x: width - 90, y: yPos, size: 9, font });
    yPos -= descriptionLines.length * 12 + 10;

    page.drawLine({ start: { x: width - 180, y: yPos }, end: { x: width - 30, y: yPos }, thickness: 0.5, color: rgb(0, 0, 0) });

    yPos -= 15; page.drawText("Subtotal:", { x: width - 180, y: yPos, size: 9, font });
    page.drawText(formatBRL(receipt.amount), { x: width - 90, y: yPos, size: 9, font });
    yPos -= 12; page.drawText("Desconto:", { x: width - 180, y: yPos, size: 9, font });
    page.drawText("R$ 0,00", { x: width - 90, y: yPos, size: 9, font });
    yPos -= 15; page.drawText("Total:", { x: width - 180, y: yPos, size: 10, font: fontBold });
    page.drawText(formatBRL(receipt.amount), { x: width - 90, y: yPos, size: 10, font: fontBold });

    yPos -= 35;
    const observacaoText = receipt.service_description.includes("REFERENTE A TARIFA")
      ? `Observação: ${receipt.service_description}${receipt.number_doc ? ' - NºDOC ' + receipt.number_doc : ''}. PRAZO PARA QUITAÇÃO ${receipt.payoff_number ? formatDate(receipt.payoff_number) : ''}.`
      : `Observação: ${receipt.service_description}.`;
    const obsLines = wrapText(observacaoText, width - 80, font, 8);
    obsLines.forEach((line, idx) => { page.drawText(line, { x: 30, y: yPos - idx * 11, size: 8, font }); });
    yPos -= obsLines.length * 11 + 15;

    page.drawText(`Declaração:`, { x: 30, y: yPos, size: 8, font: fontBold });
    yPos -= 12;
    const declaracaoText = `Recebemos de ${receipt.payer_name}, a importância de ${receipt.amount_text}, referente aos itens listados acima. Para maior clareza, firmo o presente recibo para que produza seus efeitos, dando plena, geral e irrevogável quitação pelo valor recebido.`;
    const declLines = wrapText(declaracaoText, width - 60, font, 8);
    declLines.forEach((line, idx) => { page.drawText(line, { x: 30, y: yPos - idx * 11, size: 8, font }); });

    const bytes = await pdfDoc.save();
    return bytes;
  };

  const drawPdf = async (recNumber: string): Promise<Uint8Array> => {
    const company = await fetchCompanySettings();

    const companyData: CompanyData = {
      name: company?.name || "SHARE BRASIL SERVICOS ADMINISTRATIVOS",
      cnpj: company?.cnpj || "30.898.549/0001-06",
      address: company?.address || "Avenida Presidente Arthur Bernardes, 1457, Centro-Sul",
      city: company?.city || "Várzea Grande",
      uf: (company as any)?.uf || (company as any)?.state || "MT",
      phone: "/ (65) 98173-0641",
    };

    const receiptData: ReceiptData = {
      receipt_number: recNumber,
      issue_date: dataEmissao || new Date().toISOString().slice(0, 10),
      amount: parseFloat(valor || "0"),
      amount_text: valorExtenso,
      service_description: servico,
      payer_name: pagadorNome,
      payer_document: pagadorDocumento,
      payer_address: pagadorEndereco || undefined,
      payer_city: pagadorCidade || undefined,
      payer_uf: pagadorUF || undefined,
      number_doc: numeroDoc || undefined,
      payoff_number: prazoMaximoQuitacao || undefined,
    };

    return await generateReceiptPDF(receiptData, companyData);
  };

  const uploadPdfAndGetUrl = async (bytes: Uint8Array, recNumber: string) => {
    if (!user?.id) throw new Error("Sem usuário");
    const path = `${user.id}/recibo-${recNumber}.pdf`;
    const { error } = await supabase.storage.from("recibos").upload(path, new Blob([bytes], { type: "application/pdf" }), { upsert: true });
    if (error) throw error;
    const { data, error: signErr } = await supabase.storage.from("recibos").createSignedUrl(path, 60 * 60);
    if (signErr) throw signErr;
    return data.signedUrl as string;
  };

  const onVisualizar = async () => {
    await maybeSaveFavorite();
    const rec = await ensureNumero();
    try {
      const bytes = await drawPdf(rec);
      const blob = new Blob([bytes], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      setPreviewUrl(url);
      setIsPreviewOpen(true);
      toast({ title: "Pré-visualização pronta" });
    } catch (e: any) {
      toast({ title: "Erro ao gerar PDF", description: String(e?.message || e) });
    }
  };

  const onGerarPDF = async () => {
    await maybeSaveFavorite();
    const rec = await saveReceipt();
    if (!rec) return;
    try {
      const bytes = await drawPdf(rec);
      const url = await uploadPdfAndGetUrl(bytes, rec);
      toast({ title: "PDF gerado e salvo", description: url });
      window.open(url, "_blank", "noopener,noreferrer");
      await loadReceipts();
    } catch (e: any) {
      toast({ title: "Erro ao gerar/enviar PDF", description: String(e?.message || e) });
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
          <Button className="flex items-center gap-2">
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
                  <Input placeholder="Nova descrição" value={newFavoriteDescription} onChange={(e)=>setNewFavoriteDescription(e.target.value)} />
                  <Button onClick={async()=>{
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
                        <Button variant="outline" size="sm" onClick={()=>setServico(d.description)}>Usar</Button>
                        <Button variant="destructive" size="sm" onClick={async()=>{ await supabase.from("favorite_services" as any).delete().eq("id", d.id); await loadFavoriteDescriptions(); }}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  {favoriteDescriptions.length===0 && <div className="text-sm text-muted-foreground">Nenhuma descrição favorita</div>}
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
                    <div className="text-sm">{r.receipt_number} • {new Date(r.issue_date).toLocaleDateString()} • {formatBRL(r.amount)}</div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={async()=>{ const path = `${user?.id}/recibo-${r.receipt_number}.pdf`; const { data } = await supabase.storage.from("recibos").createSignedUrl(path, 300); if (data?.signedUrl) window.open(data.signedUrl, "_blank"); }}>
                        Ver
                      </Button>
                      <Button variant="outline" size="sm" onClick={async()=>{ const path = `${user?.id}/recibo-${r.receipt_number}.pdf`; const { data } = await supabase.storage.from("recibos").createSignedUrl(path, 300); if (data?.signedUrl) window.open(data.signedUrl, "_blank"); }}>
                        Baixar
                      </Button>
                      <Button variant="destructive" size="sm" onClick={async()=>{ const path = `${user?.id}/recibo-${r.receipt_number}.pdf`; await supabase.storage.from("recibos").remove([path]); await supabase.from("receipts" as any).delete().eq("id", r.id); await loadReceipts(); }}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
                {recentReceipts.length===0 && <div className="text-sm text-muted-foreground">Nenhum recibo</div>}
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
                      <Button variant="outline" size="sm" onClick={()=>applySuggestion({ type: "favorite", id: p.id, label: p.name, sublabel: p.document, value: p })}>Usar</Button>
                      <Button variant="destructive" size="sm" onClick={async()=>{ await supabase.from("favorite_payers" as any).delete().eq("id", p.id); await loadFavoritePayers(); }}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
                {favoritePayers.length===0 && <div className="text-sm text-muted-foreground">Nenhum pagador favorito</div>}
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
                <Label htmlFor="valor-extenso">Valor por Extenso</Label>
                <Input
                  id="valor-extenso"
                  placeholder="Ex.: Um mil reais e cinquenta centavos"
                  value={valorExtenso}
                  onChange={(e) => setValorExtenso(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="servico">Descrição do Serviço</Label>
                <Textarea id="servico" placeholder="Descreva os serviços prestados" rows={3} value={servico} onChange={(e) => setServico(e.target.value)} />
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="numero-doc"><p>Número Doc</p></Label>
                  <Input id="numero-doc" placeholder="Ex.: 4004" value={numeroDoc} onChange={(e)=>setNumeroDoc(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="prazo">PRAZO MÁXIMO DE QUITAÇÃO</Label>
                  <Input id="prazo" type="date" value={prazoMaximoQuitacao} onChange={(e)=>setPrazoMaximoQuitacao(e.target.value)} />
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
                                <div className="font-medium">{s.label}</div>
                                {s.sublabel && <div className="text-xs text-muted-foreground">{s.sublabel}</div>}
                              </div>
                            </div>
                          </button>
                        ))}
                      {suggestions.some((s) => s.type === "favorite") && suggestions.some((s) => s.type === "client") && (
                        <div className="h-px bg-border my-1" />
                      )}
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
                                <div className="font-medium">{s.label}</div>
                                {s.sublabel && <div className="text-xs text-muted-foreground">{s.sublabel}</div>}
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
                <Input id="pagador-documento" placeholder="000.000.000-00" value={pagadorDocumento} onChange={(e) => setPagadorDocumento(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pagador-endereco">Endereço</Label>
                <Input id="pagador-endereco" placeholder="Endereço completo" value={pagadorEndereco} onChange={(e) => setPagadorEndereco(e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="pagador-cidade">Cidade</Label>
                  <Input id="pagador-cidade" placeholder="Cidade" value={pagadorCidade} onChange={(e) => setPagadorCidade(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pagador-uf">UF</Label>
                  <Input id="pagador-uf" placeholder="UF" value={pagadorUF} onChange={(e) => setPagadorUF(e.target.value)} />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <Checkbox id="add-favorito" checked={addAsFavorite} onCheckedChange={(v) => setAddAsFavorite(Boolean(v))} />
                <Label htmlFor="add-favorito" className="cursor-pointer">Adicionar como favorito</Label>
              </div>

              <div className="flex gap-2 pt-4">
                <Button variant="outline" className="flex-1" onClick={onVisualizar}>
                  <Eye className="h-4 w-4 mr-2" />
                  Visualizar
                </Button>
                <Button className="flex-1" onClick={onGerarPDF}>
                  <Download className="h-4 w-4 mr-2" />
                  Gerar PDF
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Recibos Emitidos Recentemente</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-muted-foreground">
              <Receipt className="mx-auto h-12 w-12 mb-2 opacity-50" />
              <p>Nenhum recibo emitido ainda</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-4xl h-[80vh]">
          <DialogHeader>
            <DialogTitle>Pré-visualização do Recibo</DialogTitle>
          </DialogHeader>
          <div className="w-full h-full">
            {previewUrl && <iframe src={previewUrl} className="w-full h-full rounded" />}
          </div>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
