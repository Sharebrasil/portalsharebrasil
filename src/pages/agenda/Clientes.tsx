import { useState, useEffect } from "react";
import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ClienteCard } from "@/components/clientes/ClienteCard";
import { Plus, Search, Building, Upload, FileText, X, Image, ChevronLeft, Edit, Phone, Mail, MapPin, Folder } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ClientDocument {
  name: string;
  url: string;
  type: string;
  uploaded_at: string;
}

interface Cliente {
  id: string;
  company_name: string;
  cnpj: string;
  inscricao_estadual?: string;
  address?: string;
  city?: string;
  uf?: string;
  phone?: string;
  email?: string;
  financial_contact?: string;
  observations?: string;
  cnpj_card_url?: string;
  aircraft?: string;
  aircraft_id?: string | null;
  logo_url?: string;
  documents?: ClientDocument[];
  status?: string | null;
}

interface AircraftOption {
  id: string;
  registration: string;
  model: string;
}

export default function Clientes() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [viewingCliente, setViewingCliente] = useState<Cliente | null>(null);
  const [editingCliente, setEditingCliente] = useState<Cliente | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [showInactive, setShowInactive] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    company_name: "",
    cnpj: "",
    inscricao_estadual: "",
    address: "",
    city: "",
    uf: "",
    phone: "",
    email: "",
    financial_contact: "",
    observations: "",
    aircraft_id: "",
    status: "ativo",
  });
  const [aircraftOptions, setAircraftOptions] = useState<AircraftOption[]>([]);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [documentFiles, setDocumentFiles] = useState<File[]>([]);
  const [uploadingFiles, setUploadingFiles] = useState(false);
  const [previewDoc, setPreviewDoc] = useState<ClientDocument | null>(null);

  useEffect(() => {
    loadClientes();
    loadAircraftOptions();
  }, []);

  const loadClientes = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("clients")
        .select("*, aircraft:aircraft_id(id, registration, model)")
        .order("company_name");

      if (error) throw error;
      const mapped: Cliente[] = ((data as any[]) || []).map((row: any) => ({
        ...row,
        aircraft: row.aircraft ? `${row.aircraft.registration} - ${row.aircraft.model}` : undefined,
      }));
      setClientes(mapped);
    } catch (error) {
      console.error("Erro ao carregar clientes:", error);
      toast({
        title: "Erro",
        description: "Erro ao carregar clientes",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadAircraftOptions = async () => {
    const { data, error } = await supabase
      .from("aircraft")
      .select("id, registration, model")
      .order("registration");
    if (!error) setAircraftOptions((data as any) || []);
  };

  const handleViewCliente = (cliente: Cliente) => {
    setViewingCliente(cliente);
  };

  const handleCloseView = () => {
    setViewingCliente(null);
  };

  const handleOpenDialog = (cliente?: Cliente) => {
    setViewingCliente(null);
    if (cliente) {
      setEditingCliente(cliente);
      setFormData({
        company_name: cliente.company_name || "",
        cnpj: cliente.cnpj || "",
        inscricao_estadual: cliente.inscricao_estadual || "",
        address: cliente.address || "",
        city: cliente.city || "",
        uf: cliente.uf || "",
        phone: cliente.phone || "",
        email: cliente.email || "",
        financial_contact: cliente.financial_contact || "",
        observations: cliente.observations || "",
        aircraft_id: cliente.aircraft_id || "",
        status: (cliente.status as string | null) ?? "ativo",
      });
      setLogoPreview(cliente.logo_url || null);
    } else {
      setEditingCliente(null);
      setFormData({
        company_name: "",
        cnpj: "",
        inscricao_estadual: "",
        address: "",
        city: "",
        uf: "",
        phone: "",
        email: "",
        financial_contact: "",
        observations: "",
        aircraft_id: "",
        status: "ativo",
      });
      setLogoPreview(null);
    }
    setLogoFile(null);
    setDocumentFiles([]);
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingCliente(null);
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDocumentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setDocumentFiles((prev) => [...prev, ...files]);
  };

  const removeDocument = (index: number) => {
    setDocumentFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const uploadFile = async (file: File, path: string) => {
    const fileExt = file.name.split(".").pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = `${path}/${fileName}`;

    const { error: uploadError, data } = await supabase.storage
      .from("client-files")
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    const { data: urlData } = supabase.storage
      .from("client-files")
      .getPublicUrl(filePath);

    return urlData.publicUrl;
  };

  const handleSave = async () => {
    try {
      if (!formData.company_name || !formData.cnpj) {
        toast({
          title: "Campos obrigatórios",
          description: "Nome da empresa e CNPJ são obrigatórios",
          variant: "destructive",
        });
        return;
      }

      setUploadingFiles(true);

      let logoUrl = editingCliente?.logo_url;
      let existingDocs = editingCliente?.documents || [];

      if (logoFile) {
        logoUrl = await uploadFile(logoFile, "logos");
      }

      const newDocs: ClientDocument[] = [];
      for (const file of documentFiles) {
        const url = await uploadFile(file, "documents");
        newDocs.push({
          name: file.name,
          url,
          type: file.type,
          uploaded_at: new Date().toISOString(),
        });
      }

      const updatedData = {
        company_name: formData.company_name,
        cnpj: formData.cnpj,
        inscricao_estadual: formData.inscricao_estadual,
        address: formData.address,
        city: formData.city,
        uf: formData.uf,
        phone: formData.phone,
        email: formData.email,
        financial_contact: formData.financial_contact,
        observations: formData.observations,
        aircraft_id: formData.aircraft_id || null,
        status: (formData as any).status ?? "ativo",
        logo_url: logoUrl,
        documents: [...existingDocs, ...newDocs],
      };

      if (editingCliente) {
        const { error } = await supabase
          .from("clients")
          .update(updatedData)
          .eq("id", editingCliente.id);

        if (error) throw error;

        toast({
          title: "Sucesso",
          description: "Cliente atualizado com sucesso",
        });
      } else {
        const { error } = await supabase
          .from("clients")
          .insert([updatedData]);

        if (error) throw error;

        toast({
          title: "Sucesso",
          description: "Cliente cadastrado com sucesso",
        });
      }

      handleCloseDialog();
      loadClientes();
    } catch (error) {
      console.error("Erro ao salvar cliente:", error);
      toast({
        title: "Erro",
        description: "Erro ao salvar cliente",
        variant: "destructive",
      });
    } finally {
      setUploadingFiles(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;

    try {
      const { error } = await supabase
        .from("clients")
        .delete()
        .eq("id", deleteId);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Cliente excluído com sucesso",
      });

      loadClientes();
    } catch (error) {
      console.error("Erro ao excluir cliente:", error);
      toast({
        title: "Erro",
        description: "Erro ao excluir cliente",
        variant: "destructive",
      });
    } finally {
      setDeleteId(null);
    }
  };

  const filteredClientes = clientes.filter((cliente) =>
    cliente.company_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cliente.cnpj?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cliente.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const isActive = (status?: string | null) => {
    const s = String(status ?? '').toLowerCase();
    return s === 'active' || s === 'ativo' || s === '';
  };

  const activeClientes = filteredClientes.filter((c) => isActive(c.status));
  const inactiveClientes = filteredClientes.filter((c) => !isActive(c.status));

  return (
    <Layout>
      {!viewingCliente && (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Clientes / Cotistas</h1>
            <p className="text-muted-foreground mt-2">
              Gerencie o cadastro de clientes e cotistas
            </p>
          </div>
          <Button onClick={() => handleOpenDialog()} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Novo Cadastro
          </Button>
        </div>

        {/* Cards de Resumo */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card onClick={() => setShowInactive(false)} className="cursor-pointer">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Building className="h-8 w-8 text-primary" />
                <div>
                  <p className="text-2xl font-bold">{activeClientes.length}</p>
                  <p className="text-sm text-muted-foreground">Total de Clientes</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card onClick={() => setShowInactive(true)} className="cursor-pointer">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Folder className="h-8 w-8 text-muted-foreground" />
                <div>
                  <p className="text-2xl font-bold">{inactiveClientes.length}</p>
                  <p className="text-sm text-muted-foreground">Clientes Inativos</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filtros e Busca */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Cadastros</CardTitle>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar cliente..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-muted-foreground">Carregando...</div>
              </div>
            ) : filteredClientes.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Building className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Nenhum cliente cadastrado</p>
                <Button onClick={() => handleOpenDialog()} className="mt-4" variant="outline">
                  <Plus className="h-4 w-4 mr-2" />
                  Cadastrar Primeiro Cliente
                </Button>
              </div>
            ) : (
              <>
                {activeClientes.length > 0 && (
                  <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                    {activeClientes.map((cliente) => (
                      <ClienteCard
                        key={cliente.id}
                        cliente={cliente}
                        onView={handleViewCliente}
                        onEdit={handleOpenDialog}
                        onDelete={setDeleteId}
                      />
                    ))}
                  </div>
                )}

                {inactiveClientes.length > 0 && (
                  <div className="space-y-3 mt-8">
                    <button
                      type="button"
                      className="w-full flex items-center justify-between rounded-md border border-border bg-card px-4 py-3 text-left"
                      onClick={() => setShowInactive((v) => !v)}
                      aria-expanded={showInactive}
                    >
                      <div className="flex items-center gap-2">
                        <Folder className="h-5 w-5 text-muted-foreground" />
                        <span className="text-xl font-semibold text-foreground">Clientes Inativos</span>
                        <Badge variant="secondary">{inactiveClientes.length}</Badge>
                      </div>
                      <span className="text-sm text-muted-foreground">{showInactive ? 'Ocultar' : 'Abrir pasta'}</span>
                    </button>

                    {showInactive && (
                      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                        {inactiveClientes.map((cliente) => (
                          <ClienteCard
                            key={cliente.id}
                            cliente={cliente}
                            onView={handleViewCliente}
                            onEdit={handleOpenDialog}
                            onDelete={setDeleteId}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
      )}

      {/* Perfil do Cliente - renderizado dentro do projeto */}
      {viewingCliente && (
        <div className="p-6 space-y-6">
          <Button variant="ghost" onClick={handleCloseView} className="flex items-center gap-2 w-fit">
            <ChevronLeft className="h-4 w-4" />
            Voltar para Contatos
          </Button>

          <div className="rounded-xl border bg-gradient-subtle shadow-card">
            <div className="p-6 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Avatar className="h-14 w-14">
                  {viewingCliente.logo_url && (
                    <AvatarImage src={viewingCliente.logo_url} alt={viewingCliente.company_name} />
                  )}
                  <AvatarFallback className="bg-secondary text-lg font-semibold">
                    {viewingCliente.company_name
                      .split(' ')
                      .map((p) => p[0])
                      .filter(Boolean)
                      .slice(0, 2)
                      .join('')
                      .toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h2 className="text-2xl font-bold leading-tight">{viewingCliente.company_name}</h2>
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    <Badge variant="secondary">Cliente</Badge>
                    <Badge variant="outline">{viewingCliente.cnpj}</Badge>
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => handleOpenDialog(viewingCliente)}>
                  <Edit className="h-4 w-4 mr-2" /> Editar
                </Button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Informações de Contato</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                {viewingCliente.phone && (
                  <div className="flex items-center gap-2"><Phone className="h-4 w-4 text-muted-foreground" /><span>{viewingCliente.phone}</span></div>
                )}
                {viewingCliente.email && (
                  <div className="flex items-center gap-2 break-all"><Mail className="h-4 w-4 text-muted-foreground" /><span>{viewingCliente.email}</span></div>
                )}
                {(viewingCliente.address || viewingCliente.city || viewingCliente.uf) && (
                  <div className="flex items-center gap-2"><MapPin className="h-4 w-4 text-muted-foreground" /><span>{[viewingCliente.address, [viewingCliente.city, viewingCliente.uf].filter(Boolean).join(' - ')].filter(Boolean).join(' | ')}</span></div>
                )}
                {viewingCliente.financial_contact && (
                  <div className="flex items-center gap-2"><Building className="h-4 w-4 text-muted-foreground" /><span>Contato Financeiro: {viewingCliente.financial_contact}</span></div>
                )}
                {!viewingCliente.phone && !viewingCliente.email && !viewingCliente.address && !viewingCliente.city && !viewingCliente.uf && !viewingCliente.financial_contact && (
                  <p className="text-muted-foreground">Nenhuma informa��ão de contato.</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Outras Informações</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                {viewingCliente.inscricao_estadual && (
                  <div><span className="text-muted-foreground">Inscrição Estadual:</span> {viewingCliente.inscricao_estadual}</div>
                )}
                {viewingCliente.aircraft && (
                  <div><span className="text-muted-foreground">Aeronave:</span> {viewingCliente.aircraft}</div>
                )}
                {viewingCliente.observations && (
                  <div>
                    <span className="text-muted-foreground">Observações:</span>
                    <p className="mt-1 whitespace-pre-wrap">{viewingCliente.observations}</p>
                  </div>
                )}
                {!viewingCliente.inscricao_estadual && !viewingCliente.aircraft && !viewingCliente.observations && (
                  <p className="text-muted-foreground">Nenhuma informação adicional.</p>
                )}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Documentos</CardTitle>
            </CardHeader>
            <CardContent>
              {viewingCliente.documents && viewingCliente.documents.length > 0 ? (
                <div className="space-y-2">
                  {viewingCliente.documents.map((doc, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => setPreviewDoc(doc)}
                      className="w-full text-left flex items-center gap-3 p-3 border rounded-lg hover:bg-accent transition-colors"
                    >
                      <FileText className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate">{doc.name}</p>
                        <p className="text-xs text-muted-foreground">{new Date(doc.uploaded_at).toLocaleDateString('pt-BR')}</p>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Nenhum documento anexado.</p>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Visualizador de Documento */}
      <Dialog open={!!previewDoc} onOpenChange={(open) => { if (!open) setPreviewDoc(null); }}>
        <DialogContent className="max-w-5xl w-[95vw] h-[85vh] p-0 overflow-hidden">
          <div className="h-full w-full">
            {previewDoc && (previewDoc.type?.includes("pdf") || previewDoc.name.toLowerCase().endsWith(".pdf")) ? (
              <iframe
                src={`${previewDoc.url}#toolbar=1&navpanes=0`}
                className="w-full h-full"
                title={previewDoc.name}
              />
            ) : (
              <div className="p-6 space-y-3">
                <p className="text-sm text-muted-foreground">Visualização não suportada. Faça o download abaixo.</p>
                <a href={previewDoc?.url} target="_blank" rel="noopener noreferrer" className="underline">Baixar arquivo</a>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog de Cadastro/Edição */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingCliente ? "Editar Cliente" : "Novo Cliente"}
            </DialogTitle>
            <DialogDescription>
              Preencha as informações do cliente / cotista
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="info" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="info">Informações</TabsTrigger>
              <TabsTrigger value="files">Logo e Documentos</TabsTrigger>
            </TabsList>

            <TabsContent value="info" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label htmlFor="company_name">Nome da Empresa *</Label>
                <Input
                  id="company_name"
                  value={formData.company_name}
                  onChange={(e) =>
                    setFormData({ ...formData, company_name: e.target.value })
                  }
                  placeholder="Razão Social"
                />
              </div>

              <div>
                <Label htmlFor="cnpj">CNPJ *</Label>
                <Input
                  id="cnpj"
                  value={formData.cnpj}
                  onChange={(e) => setFormData({ ...formData, cnpj: e.target.value })}
                  placeholder="00.000.000/0000-00"
                />
              </div>

              <div>
                <Label htmlFor="inscricao_estadual">Inscrição Estadual</Label>
                <Input
                  id="inscricao_estadual"
                  value={formData.inscricao_estadual}
                  onChange={(e) =>
                    setFormData({ ...formData, inscricao_estadual: e.target.value })
                  }
                  placeholder="000.000.000.000"
                />
              </div>

              <div className="col-span-2">
                <Label htmlFor="address">Endereço</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) =>
                    setFormData({ ...formData, address: e.target.value })
                  }
                  placeholder="Rua, número, bairro"
                />
              </div>

              <div>
                <Label htmlFor="city">Cidade</Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  placeholder="São Paulo"
                />
              </div>

              <div>
                <Label htmlFor="uf">UF</Label>
                <Input
                  id="uf"
                  value={formData.uf}
                  onChange={(e) => setFormData({ ...formData, uf: e.target.value.toUpperCase().slice(0,2) })}
                  placeholder="SP"
                  maxLength={2}
                />
              </div>

              <div>
                <Label htmlFor="phone">Telefone</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="(00) 00000-0000"
                />
              </div>

              <div>
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="contato@empresa.com"
                />
              </div>

              <div>
                <Label htmlFor="financial_contact">Contato Financeiro</Label>
                <Input
                  id="financial_contact"
                  value={formData.financial_contact}
                  onChange={(e) =>
                    setFormData({ ...formData, financial_contact: e.target.value })
                  }
                  placeholder="Nome do responsável financeiro"
                />
              </div>

              <div>
                <Label htmlFor="aircraft_id">Aeronave</Label>
                <Select value={formData.aircraft_id} onValueChange={(v) => setFormData({ ...formData, aircraft_id: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a aeronave" />
                  </SelectTrigger>
                  <SelectContent>
                    {aircraftOptions.map((a) => (
                      <SelectItem key={a.id} value={a.id}>
                        {a.registration} - {a.model}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="status">Status</Label>
                <Select value={(formData as any).status} onValueChange={(v) => setFormData({ ...formData, status: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ativo">Ativo</SelectItem>
                    <SelectItem value="inativo">Inativo</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="col-span-2">
                <Label htmlFor="observations">Observações</Label>
                <Textarea
                  id="observations"
                  value={formData.observations}
                  onChange={(e) =>
                    setFormData({ ...formData, observations: e.target.value })
                  }
                  placeholder="Informações adicionais sobre o cliente"
                  rows={3}
                />
              </div>
            </div>
          </TabsContent>

            <TabsContent value="files" className="space-y-4 mt-4">
              <div className="space-y-6">
                <div className="space-y-4">
                  <div>
                    <Label>Logo da Empresa</Label>
                    <p className="text-sm text-muted-foreground mb-2">
                      Fa��a upload da logo da empresa (formatos: PNG, JPG, SVG)
                    </p>
                  </div>

                  <div className="flex items-center gap-4">
                    {logoPreview && (
                      <Avatar className="h-20 w-20">
                        <AvatarImage src={logoPreview} alt="Logo" />
                        <AvatarFallback>
                          <Image className="h-8 w-8" />
                        </AvatarFallback>
                      </Avatar>
                    )}
                    <div className="flex-1">
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={handleLogoChange}
                        className="cursor-pointer"
                      />
                    </div>
                  </div>
                </div>

                <div className="border-t pt-4 space-y-4">
                  <div>
                    <Label>Documentos</Label>
                    <p className="text-sm text-muted-foreground mb-2">
                      Anexe documentos como CNPJ, contratos, etc.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Input
                      type="file"
                      multiple
                      onChange={handleDocumentChange}
                      className="cursor-pointer"
                    />
                  </div>

                  {documentFiles.length > 0 && (
                    <div className="space-y-2">
                      <Label className="text-sm">Novos documentos:</Label>
                      {documentFiles.map((file, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-2 border rounded-lg"
                        >
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">{file.name}</span>
                            <span className="text-xs text-muted-foreground">
                              ({(file.size / 1024).toFixed(1)} KB)
                            </span>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeDocument(index)}
                            className="h-6 w-6 p-0"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}

                  {editingCliente?.documents && editingCliente.documents.length > 0 && (
                    <div className="space-y-2">
                      <Label className="text-sm">Documentos existentes:</Label>
                      {editingCliente.documents.map((doc, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-2 border rounded-lg bg-muted/50"
                        >
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-muted-foreground" />
                            <a
                              href={doc.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm hover:underline"
                            >
                              {doc.name}
                            </a>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={handleCloseDialog}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={uploadingFiles}>
              {uploadingFiles ? "Salvando..." : editingCliente ? "Atualizar" : "Cadastrar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de Confirmação de Exclusão */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Cliente</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este cliente? Esta ação n��o pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Layout>
  );
}
