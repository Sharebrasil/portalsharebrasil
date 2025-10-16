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
import { Receipt, Download, Eye, Plus, Star, Users } from "lucide-react";

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

export default function EmissaoRecibo() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [numero, setNumero] = useState("");
  const [dataEmissao, setDataEmissao] = useState<string>("");
  const [valor, setValor] = useState<string>("");
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

  const onVisualizar = async () => {
    await maybeSaveFavorite();
    toast({ title: "Visualização", description: "Pré-visualização do recibo." });
  };

  const onGerarPDF = async () => {
    await maybeSaveFavorite();
    toast({ title: "PDF", description: "Geração de PDF ainda não implementada." });
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
                <Input id="valor-extenso" placeholder="Será preenchido automaticamente" disabled />
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
