import { useEffect, useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { FilePlus2, Plane, Upload, FileText, Trash2, DollarSign } from "lucide-react";

interface Selection {
  clientId: string;
  aircraftId: string;
  companyName: string;
  registration: string;
}

const PortalClienteColaborador = () => {
  const [cnpj, setCnpj] = useState("");
  const [registration, setRegistration] = useState("");
  const [loading, setLoading] = useState(false);
  const [selection, setSelection] = useState<Selection | null>(null);

  // portal data form
  const [dataType, setDataType] = useState("documento");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [submittingData, setSubmittingData] = useState(false);
  const [portalData, setPortalData] = useState<any[]>([]);

  // reconciliation form
  const [recDesc, setRecDesc] = useState("");
  const [recCategory, setRecCategory] = useState("Outros");
  const [recAmount, setRecAmount] = useState("");
  const [savingRec, setSavingRec] = useState(false);

  useEffect(() => {
    if (!selection) return;
    void loadPortalData(selection);
  }, [selection]);

  const handleFind = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data: clients, error: clientError } = await supabase
        .from("clients")
        .select("id, cnpj, company_name, aircraft_id")
        .like("cnpj", `${cnpj}%`);
      if (clientError) throw clientError;
      if (!clients || clients.length === 0) {
        toast.error("Cliente não encontrado");
        return;
      }

      const { data: aircraft, error: aircraftError } = await supabase
        .from("aircraft")
        .select("id, registration")
        .eq("registration", registration.toUpperCase())
        .single();
      if (aircraftError || !aircraft) {
        toast.error("Aeronave não encontrada");
        return;
      }

      const clientWithAircraft = clients.find((c: any) => c.aircraft_id === aircraft.id);
      if (!clientWithAircraft) {
        toast.error("Cliente não tem acesso a essa aeronave");
        return;
      }

      setSelection({
        clientId: clientWithAircraft.id,
        aircraftId: aircraft.id,
        companyName: clientWithAircraft.company_name,
        registration: aircraft.registration,
      });
      toast.success("Cliente carregado");
    } catch (err) {
      console.error(err);
      toast.error("Erro ao buscar dados");
    } finally {
      setLoading(false);
    }
  };

  const loadPortalData = async (s: Selection) => {
    try {
      const { data, error } = await supabase
        .from("client_portal_data")
        .select("*")
        .eq("client_id", s.clientId)
        .eq("aircraft_id", s.aircraftId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      setPortalData(data || []);
    } catch (err) {
      console.error("Erro ao carregar dados do portal:", err);
    }
  };

  const handleUploadData = async () => {
    if (!selection) return;
    if (!file && !description) {
      toast.error("Informe um arquivo ou uma descrição");
      return;
    }
    setSubmittingData(true);
    try {
      let fileUrl: string | null = null;
      let fileName: string | null = null;

      if (file) {
        const ext = file.name.split(".").pop();
        const name = `${selection.clientId}-${selection.registration}-${Date.now()}.${ext}`;
        const path = `portal-data/${name}`;
        const { error: uploadError } = await supabase.storage
          .from("client-portal-files")
          .upload(path, file);
        if (uploadError) throw uploadError;
        const { data: urlData } = supabase.storage.from("client-portal-files").getPublicUrl(path);
        fileUrl = urlData.publicUrl;
        fileName = file.name;
      }

      const { error: insertError } = await supabase.from("client_portal_data").insert({
        client_id: selection.clientId,
        aircraft_id: selection.aircraftId,
        data_type: dataType,
        description: description || null,
        file_url: fileUrl,
        file_name: fileName,
      });
      if (insertError) throw insertError;

      toast.success("Dados adicionados ao portal");
      setDescription("");
      setFile(null);
      await loadPortalData(selection);
    } catch (err) {
      console.error("Erro ao salvar dados:", err);
      toast.error("Erro ao salvar dados");
    } finally {
      setSubmittingData(false);
    }
  };

  const handleCreateReconciliation = async () => {
    if (!selection) return;
    if (!recDesc || !recAmount) {
      toast.error("Preencha descrição e valor");
      return;
    }
    setSavingRec(true);
    try {
      const amount = Number(String(recAmount).replace(/[^0-9.,]/g, '').replace(',', '.'));
      const { error } = await supabase.from("client_reconciliations").insert({
        client_id: selection.clientId,
        aircraft_registration: selection.registration,
        description: recDesc,
        amount,
        category: recCategory,
        status: "pendente",
      });
      if (error) throw error;
      toast.success("Pagamento pendente criado");
      setRecDesc("");
      setRecAmount("");
    } catch (err) {
      console.error("Erro ao criar pendência:", err);
      toast.error("Erro ao criar pendência");
    } finally {
      setSavingRec(false);
    }
  };

  const handleDeleteData = async (id: string) => {
    if (!selection) return;
    try {
      const { error } = await supabase.from("client_portal_data").delete().eq("id", id);
      if (error) throw error;
      toast.success("Registro removido");
      await loadPortalData(selection);
    } catch (err) {
      console.error("Erro ao remover registro:", err);
      toast.error("Erro ao remover registro");
    }
  };

  return (
    <Layout>
      <div className="container mx-auto py-8 space-y-6">
        {!selection ? (
          <Card>
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                  <Plane className="w-8 h-8 text-primary" />
                </div>
              </div>
              <CardTitle>Portal do Cliente — Colaborador</CardTitle>
              <CardDescription>Digite os 4 primeiros dígitos do CNPJ e a matrícula da aeronave</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleFind} className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="cnpj">CNPJ (4 primeiros dígitos)</Label>
                  <Input id="cnpj" value={cnpj} onChange={(e) => setCnpj(e.target.value.slice(0, 4))} maxLength={4} required placeholder="1234" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="registration">Matrícula</Label>
                  <Input id="registration" value={registration} onChange={(e) => setRegistration(e.target.value.toUpperCase())} required placeholder="PR-ABC" />
                </div>
                <div className="md:col-span-2">
                  <Button type="submit" className="w-full" disabled={loading}>{loading ? "Carregando..." : "Acessar"}</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold">{selection.companyName}</h1>
                <p className="text-muted-foreground">Aeronave: {selection.registration}</p>
              </div>
              <Button variant="outline" onClick={() => setSelection(null)}>Trocar cliente</Button>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><FilePlus2 className="w-5 h-5" />Adicionar dados ao Portal</CardTitle>
                  <CardDescription>Envie documentos ou registros visíveis para o cliente</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4">
                    <div className="space-y-2">
                      <Label>Tipo</Label>
                      <Input value={dataType} onChange={(e) => setDataType(e.target.value)} placeholder="documento, boleto, nota fiscal..." />
                    </div>
                    <div className="space-y-2">
                      <Label>Descrição</Label>
                      <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Ex.: Boleto de hangaragem - Outubro" />
                    </div>
                    <div className="space-y-2">
                      <Label>Arquivo (opcional)</Label>
                      <Input type="file" accept="image/*,.pdf" onChange={(e) => setFile(e.target.files?.[0] || null)} />
                    </div>
                    <Button onClick={handleUploadData} disabled={submittingData} className="w-full">
                      <Upload className="w-4 h-4 mr-2" />
                      {submittingData ? "Enviando..." : "Adicionar ao Portal"}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><DollarSign className="w-5 h-5" />Criar pagamento pendente</CardTitle>
                  <CardDescription>Adicione cobranças que aparecerão no portal do cliente</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Descrição</Label>
                    <Input value={recDesc} onChange={(e) => setRecDesc(e.target.value)} placeholder="Ex.: Hangaragem 10/2024" />
                  </div>
                  <div className="space-y-2">
                    <Label>Categoria</Label>
                    <Input value={recCategory} onChange={(e) => setRecCategory(e.target.value)} placeholder="Categoria" />
                  </div>
                  <div className="space-y-2">
                    <Label>Valor (R$)</Label>
                    <Input value={recAmount} onChange={(e) => setRecAmount(e.target.value)} placeholder="0,00" />
                  </div>
                  <Button onClick={handleCreateReconciliation} disabled={savingRec} className="w-full">{savingRec ? "Salvando..." : "Criar pendência"}</Button>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><FileText className="w-5 h-5" />Registros já enviados</CardTitle>
                <CardDescription>Arquivos e registros disponíveis no portal</CardDescription>
              </CardHeader>
              <CardContent>
                {portalData.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Nenhum registro encontrado.</p>
                ) : (
                  <div className="space-y-3">
                    {portalData.map((d: any) => (
                      <div key={d.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <FileText className="w-4 h-4 text-primary" />
                          <div>
                            <p className="font-medium">{d.file_name || d.data_type}</p>
                            <p className="text-xs text-muted-foreground">{new Date(d.created_at).toLocaleDateString("pt-BR")}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {d.file_url && (
                            <Button variant="ghost" size="sm" onClick={() => window.open(d.file_url, "_blank")}>Abrir</Button>
                          )}
                          <Button variant="destructive" size="sm" onClick={() => handleDeleteData(d.id)}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default PortalClienteColaborador;
