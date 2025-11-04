import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DollarSign, Building, Upload } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Layout } from "@/components/layout/Layout";

export default function CompanySettings() {
  const [companyConfig, setCompanyConfig] = useState({
    id: "",
    razaoSocial: "",
    nomeFantasia: "",
    cnpj: "",
    endereco: "",
    cidade: "",
    estado: "",
    cep: "",
    telefone: "",
    email: "",
    logoUrl: ""
  });

  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  
  useEffect(() => {
    loadCompanySettings();
  }, []);

  const loadCompanySettings = async () => {
    const { data, error } = await supabase
      .from("company_settings" as any)
      .select("*")
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error("Erro ao carregar configurações:", error);
      return;
    }

    if (data) {
      setCompanyConfig({
        id: (data as any).id,
        razaoSocial: (data as any).razao_social || "",
        nomeFantasia: (data as any).nome_fantasia || "",
        cnpj: (data as any).cnpj || "",
        endereco: (data as any).endereco || "",
        cidade: (data as any).cidade || "",
        estado: (data as any).estado || "",
        cep: (data as any).cep || "",
        telefone: (data as any).telefone || "",
        email: (data as any).email || "",
        logoUrl: (data as any).logo_url || ""
      });
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error("Por favor, selecione uma imagem válida");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error("A imagem deve ter no máximo 2MB");
      return;
    }

    setLogoFile(file);
  };

  const uploadLogo = async () => {
    if (!logoFile) return null;

    setUploadingLogo(true);
    const fileExt = logoFile.name.split('.').pop();
    const fileName = `${Math.random()}.${fileExt}`;
    const filePath = `logos/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('company-logos')
      .upload(filePath, logoFile);

    if (uploadError) {
      console.error("Erro ao fazer upload:", uploadError);
      toast.error("Erro ao fazer upload do logo");
      setUploadingLogo(false);
      return null;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('company-logos')
      .getPublicUrl(filePath);

    setUploadingLogo(false);
    return publicUrl;
  };

  const saveCompanySettings = async () => {
    let logoUrl = companyConfig.logoUrl;

    if (logoFile) {
      const uploadedUrl = await uploadLogo();
      if (uploadedUrl) {
        logoUrl = uploadedUrl;
      } else {
        return;
      }
    }

    const settingsData = {
      razao_social: companyConfig.razaoSocial,
      nome_fantasia: companyConfig.nomeFantasia,
      cnpj: companyConfig.cnpj,
      endereco: companyConfig.endereco,
      cidade: companyConfig.cidade,
      estado: companyConfig.estado,
      cep: companyConfig.cep,
      telefone: companyConfig.telefone,
      email: companyConfig.email,
      logo_url: logoUrl
    };

    if (companyConfig.id) {
      const { error } = await supabase
        .from("company_settings" as any)
        .update(settingsData)
        .eq("id", companyConfig.id);

      if (error) {
        toast.error("Erro ao atualizar configurações");
        console.error(error);
        return;
      }
    } else {
      const { data, error } = await supabase
        .from("company_settings" as any)
        .insert(settingsData)
        .select()
        .single();

      if (error) {
        toast.error("Erro ao salvar configurações");
        console.error(error);
        return;
      }

      if (data) {
        setCompanyConfig(prev => ({ ...prev, id: (data as any).id }));
      }
    }
    
    setCompanyConfig(prev => ({ ...prev, logoUrl }));
    setLogoFile(null);
    toast.success("Configurações salvas com sucesso!");
  };

  return (
    <Layout>
      <div className="p-6 space-y-6">
        <div className="flex items-center space-x-2">
          <DollarSign className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold text-foreground">Configuração da Empresa</h1>
        </div>

        <Tabs defaultValue="config" className="w-full">
          <TabsList className="grid w-full grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
            <TabsTrigger value="config">Config. Empresa</TabsTrigger>
          </TabsList>

          <TabsContent value="config" className="space-y-4">
            <Card className="bg-gradient-card border-border shadow-card">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Building className="mr-2 h-5 w-5 text-primary" />
                  Configuração da Empresa
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="razaoSocial">Razão Social *</Label>
                    <Input
                      id="razaoSocial"
                      value={companyConfig.razaoSocial}
                      onChange={(e) => setCompanyConfig({...companyConfig, razaoSocial: e.target.value})}
                      placeholder="Digite a razão social"
                    />
                  </div>
                  <div>
                    <Label htmlFor="nomeFantasia">Nome Fantasia</Label>
                    <Input
                      id="nomeFantasia"
                      value={companyConfig.nomeFantasia}
                      onChange={(e) => setCompanyConfig({...companyConfig, nomeFantasia: e.target.value})}
                      placeholder="Digite o nome fantasia"
                    />
                  </div>
                  <div>
                    <Label htmlFor="cnpj">CNPJ *</Label>
                    <Input
                      id="cnpj"
                      value={companyConfig.cnpj}
                      onChange={(e) => setCompanyConfig({...companyConfig, cnpj: e.target.value})}
                      placeholder="00.000.000/0000-00"
                    />
                  </div>
                  <div>
                    <Label htmlFor="telefone">Telefone</Label>
                    <Input
                      id="telefone"
                      value={companyConfig.telefone}
                      onChange={(e) => setCompanyConfig({...companyConfig, telefone: e.target.value})}
                      placeholder="(00) 0000-0000"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Label htmlFor="endereco">Endereço</Label>
                    <Input
                      id="endereco"
                      value={companyConfig.endereco}
                      onChange={(e) => setCompanyConfig({...companyConfig, endereco: e.target.value})}
                      placeholder="Rua, Número - Bairro"
                    />
                  </div>
                  <div>
                    <Label htmlFor="cidade">Cidade</Label>
                    <Input
                      id="cidade"
                      value={companyConfig.cidade}
                      onChange={(e) => setCompanyConfig({...companyConfig, cidade: e.target.value})}
                      placeholder="Digite a cidade"
                    />
                  </div>
                  <div>
                    <Label htmlFor="estado">Estado</Label>
                    <Input
                      id="estado"
                      value={companyConfig.estado}
                      onChange={(e) => setCompanyConfig({...companyConfig, estado: e.target.value})}
                      placeholder="UF"
                      maxLength={2}
                    />
                  </div>
                  <div>
                    <Label htmlFor="cep">CEP</Label>
                    <Input
                      id="cep"
                      value={companyConfig.cep}
                      onChange={(e) => setCompanyConfig({...companyConfig, cep: e.target.value})}
                      placeholder="00000-000"
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">E-mail</Label>
                    <Input
                      id="email"
                      type="email"
                      value={companyConfig.email}
                      onChange={(e) => setCompanyConfig({...companyConfig, email: e.target.value})}
                      placeholder="contato@empresa.com"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Label htmlFor="logo">Logo da Empresa (PNG/JPG)</Label>
                    <div className="flex items-center gap-4">
                      <Input
                        id="logo"
                        type="file"
                        accept="image/png,image/jpeg,image/jpg"
                        onChange={handleLogoUpload}
                        className="flex-1"
                      />
                      {(companyConfig.logoUrl || logoFile) && (
                        <img 
                          src={logoFile ? URL.createObjectURL(logoFile) : companyConfig.logoUrl} 
                          alt="Logo" 
                          className="h-12 w-12 object-contain rounded border p-1"
                        />
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {logoFile ? `Arquivo selecionado: ${logoFile.name}` : 'Máximo 2MB. Formatos PNG/JPG recomendados.'}
                    </p>
                  </div>
                </div>
                <Button 
                  onClick={saveCompanySettings} 
                  className="w-full bg-primary hover:bg-primary/90"
                  disabled={uploadingLogo}
                >
                  {uploadingLogo ? (
                    <span className="flex items-center justify-center">
                      <Upload className="mr-2 h-4 w-4 animate-pulse" /> Enviando logo...
                    </span>
                  ) : (
                    "Salvar Configurações"
                  )}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
