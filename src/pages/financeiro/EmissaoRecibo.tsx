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
}

type SuggestionItem =
  | { type: "favorite"; id: string; label: string; sublabel?: string; value: FavoritePayer }
  | { type: "client"; id: string; label: string; sublabel?: string; value: ClientSuggestion };

const EDGE_PDF_URL = "https://yelanwtucirrxbskwjxc.supabase.co/functions/v1/recibo-pdf";

export default function EmissaoRecibo() {
  const { user, session } = useAuth();
  const { toast } = useToast();

  const [numero, setNumero] = useState("");
  const [dataEmissao, setDataEmissao] = useState<string>("");
  const [valor, setValor] = useState<string>("");
  const [valorExtenso, setValorExtenso] = useState<string>("");
  const [servico, setServico] = useState("");

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

  const canSaveFavorite = useMemo(() => !!(pagadorNome && pagadorDocumento && user?.id), [pagadorNome, pagadorDocumento, user?.id]);

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
          .select("id, company_name, cnpj, address")
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
      .select("name, cnpj, address, city, state")
      .order("created_at", { ascending: false })
      .limit(1);
    return data && data.length > 0 ? data[0] : null;
  };

  const generatePdf = async (recNumber: string) => {
    const company = await fetchCompanySettings();
    const amountNum = parseFloat(valor || "0");
    const issueDate = (dataEmissao && dataEmissao.length >= 10) ? dataEmissao : new Date().toISOString().slice(0, 10);

    const emitterAddress = company ? [company.address, company.city, company.state].filter(Boolean).join(", ") : "";
    const payerAddress = [pagadorEndereco, pagadorCidade, pagadorUF].filter(Boolean).join(", ");

    const payload = {
      filename: `recibo-${recNumber}.pdf`,
      receipt_number: recNumber,
      total_value: formatBRL(amountNum),
      emitter: {
        name: company?.name || "",
        cpf_cnpj: company?.cnpj || "",
        address: emitterAddress,
      },
      payer: {
        name: pagadorNome,
        cpf_cnpj: pagadorDocumento,
        address: payerAddress,
      },
      items: [
        { description: servico, quantity: 1, price: formatBRL(amountNum), total: formatBRL(amountNum) },
      ],
      observation: "",
      amount_text: valorExtenso,
      recepit_table_insert: null,
      issue_date: issueDate,
    } as const;

    const res = await fetch(EDGE_PDF_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const msg = await res.text();
      throw new Error(msg || "Falha ao gerar PDF");
    }

    const { url } = await res.json();
    return url as string;
  };

  const onVisualizar = async () => {
    await maybeSaveFavorite();
    const rec = await saveReceipt();
    if (rec) {
      try {
        const url = await generatePdf(rec);
        toast({ title: "Pré-visualização pronta", description: url });
      } catch (e: any) {
        toast({ title: "Erro ao gerar PDF", description: String(e?.message || e) });
      }
    }
  };

  const onGerarPDF = async () => {
    await maybeSaveFavorite();
    const rec = await saveReceipt();
    if (rec) {
      try {
        const url = await generatePdf(rec);
        toast({ title: "PDF gerado e salvo", description: url });
        window.open(url, "_blank", "noopener,noreferrer");
      } catch (e: any) {
        toast({ title: "Erro ao gerar PDF", description: String(e?.message || e) });
      }
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
    </Layout>
  );
}
