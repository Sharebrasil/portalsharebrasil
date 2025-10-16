import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Building, Save, FileText, Upload, FileImage, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export default function ConfigEmpresa() {
  const [companyData, setCompanyData] = useState({
    razaoSocial: "Aviation Solutions Ltda",
    nomeFantasia: "Aviation Solutions",
    cnpj: "12.345.678/0001-90",
    ie: "123.456.789.123",
    endereco: "Av. das Américas, 1000",
    cidade: "Rio de Janeiro",
    estado: "RJ",
    cep: "22640-100",
    telefone: "(21) 3333-4444",
    email: "contato@aviationsolutions.com.br",
    website: "https://www.aviationsolutions.com.br",
    atividade: "Aviação Executiva",
    observacoes: "Empresa especializada em aviação executiva e serviços aeroportuários"
  });

  const [logoPreview, setLogoPreview] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const [recordId, setRecordId] = useState<string | null>(null);

  useEffect(() => {
    const loadSettings = async () => {
      const { data, error } = await supabase
        .from("company_settings")
        .select("id, name, name_fantasy, cnpj, address, city, state, phone, email, zip_code, logo_url")
        .order("created_at", { ascending: false })
        .limit(1);

      if (error) {
        console.error("Erro ao carregar configurações:", error);
        toast({
          title: "Falha ao carregar",
          description: "Não foi possível carregar as configurações atuais.",
          variant: "destructive",
        });
        return;
      }

      const row = data?.[0];
      if (row) {
        setRecordId(row.id);
        setCompanyData((prev) => ({
          ...prev,
          razaoSocial: row.name || prev.razaoSocial,
          nomeFantasia: row.name_fantasy || prev.nomeFantasia,
          cnpj: row.cnpj || prev.cnpj,
          endereco: row.address || prev.endereco,
          cidade: row.city || prev.cidade,
          estado: row.state || prev.estado,
          cep: row.zip_code || prev.cep,
          telefone: row.phone || prev.telefone,
          email: row.email || prev.email,
        }));
        if (row.logo_url) setLogoPreview(row.logo_url);
      }
    };

    loadSettings();
  }, []);

  const handleInputChange = (field: string, value: string) => {
    setCompanyData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setLogoPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        name: companyData.razaoSocial,
        name_fantasy: companyData.nomeFantasia || null,
        cnpj: companyData.cnpj || null,
        address: companyData.endereco || null,
        city: companyData.cidade || null,
        state: companyData.estado || null,
        zip_code: companyData.cep || null,
        phone: companyData.telefone || null,
        email: companyData.email || null,
        logo_url: logoPreview || null,
      };

      if (recordId) {
        const { error } = await supabase
          .from("company_settings")
          .update(payload)
          .eq("id", recordId);
        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from("company_settings")
          .insert(payload)
          .select("id")
          .single();
        if (error) throw error;
        setRecordId(data.id);
      }
      toast({
        title: "Configurações salvas",
        description: "As informações da empresa foram atualizadas com sucesso.",
      });
    } catch (e: any) {
      console.error(e);
      toast({
        title: "Erro ao salvar",
        description: e?.message || "Tente novamente mais tarde.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Layout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Configuração da Empresa</h1>
            <p className="text-muted-foreground mt-2">
              Configure os dados da empresa que aparecerão nos recibos e relatórios
            </p>
          </div>
          <Button className="flex items-center gap-2" onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {saving ? "Salvando..." : "Salvar Configurações"}
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileImage className="h-5 w-5" />
                Logo da Empresa
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col items-center space-y-4">
                {logoPreview ? (
                  <div className="w-32 h-32 border border-border rounded-lg overflow-hidden bg-muted flex items-center justify-center">
                    <img
                      src={logoPreview}
                      alt="Logo da empresa"
                      className="max-w-full max-h-full object-contain"
                    />
                  </div>
                ) : (
                  <div className="w-32 h-32 border-2 border-dashed border-border rounded-lg flex items-center justify-center bg-muted">
                    <div className="text-center">
                      <Building className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">Sem logo</p>
                    </div>
                  </div>
                )}

                <div className="w-full">
                  <Label htmlFor="logo-upload" className="cursor-pointer">
                    <div className="flex items-center justify-center gap-2 p-2 border border-border rounded-lg hover:bg-muted transition-colors">
                      <Upload className="h-4 w-4" />
                      <span className="text-sm">Escolher Logo</span>
                    </div>
                  </Label>
                  <input
                    id="logo-upload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleLogoUpload}
                  />
                </div>

                <p className="text-xs text-muted-foreground text-center">
                  Formatos aceitos: PNG, JPG, JPEG<br />
                  Tamanho recomendado: 300x300px
                </p>
              </div>
            </CardContent>
          </Card>

          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building className="h-5 w-5" />
                  Dados da Empresa
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="razao-social">Razão Social</Label>
                  <Input
                    id="razao-social"
                    value={companyData.razaoSocial}
                    onChange={(e) => handleInputChange("razaoSocial", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="nome-fantasia">Nome Fantasia</Label>
                  <Input
                    id="nome-fantasia"
                    value={companyData.nomeFantasia}
                    onChange={(e) => handleInputChange("nomeFantasia", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cnpj">CNPJ</Label>
                  <Input
                    id="cnpj"
                    value={companyData.cnpj}
                    onChange={(e) => handleInputChange("cnpj", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endereco">Endereço</Label>
                  <Input
                    id="endereco"
                    value={companyData.endereco}
                    onChange={(e) => handleInputChange("endereco", e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="cidade">Cidade</Label>
                    <Input
                      id="cidade"
                      value={companyData.cidade}
                      onChange={(e) => handleInputChange("cidade", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="estado">Estado</Label>
                    <Input
                      id="estado"
                      value={companyData.estado}
                      onChange={(e) => handleInputChange("estado", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cep">CEP</Label>
                    <Input
                      id="cep"
                      value={companyData.cep}
                      onChange={(e) => handleInputChange("cep", e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">E-mail</Label>
                  <Input
                    id="email"
                    type="email"
                    value={companyData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>


            <Card>
              <CardHeader>
                <CardTitle>Preview do Cabeçalho dos Documentos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="border border-border rounded-lg p-6 bg-background">
                  <div className="flex items-start gap-4">
                    {logoPreview && (
                      <div className="w-16 h-16 flex-shrink-0">
                        <img
                          src={logoPreview}
                          alt="Logo"
                          className="w-full h-full object-contain"
                        />
                      </div>
                    )}
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-foreground">{companyData.razaoSocial}</h3>
                      <p className="text-sm text-muted-foreground">{companyData.nomeFantasia}</p>
                      <p className="text-sm text-muted-foreground">CNPJ: {companyData.cnpj}</p>
                      <p className="text-sm text-muted-foreground">
                        {companyData.endereco}, {companyData.cidade} - {companyData.estado}, {companyData.cep}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Email: {companyData.email}
                      </p>
                    </div>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Este cabeçalho aparecerá nos recibos, relatórios de viagem e cobranças
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
}
