import React, { useState, useEffect, useCallback } from "react";
import { Layout } from "@/components/layout/Layout";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Users, Building, Truck, Hotel, Plus, Edit, Trash2 } from "lucide-react";
import { ContactModal } from "@/components/ContactModal";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

/**
 * Tipos simplificados (ajuste se tiver tipos reais no seu projeto)
 */
type Contact = {
  id: string;
  nome: string;
  telefone?: string;
  email?: string;
  empresa?: string;
  cargo?: string;
  categoria: "clientes" | "colaboradores" | "fornecedores" | "hoteis";
  observacoes?: string;
  endereco?: string;
  cidade?: string;
  precoSingle?: number;
  precoDuplo?: number;
  origin?: "contacts" | "hoteis" | "clients";
  created_at?: string;
  updated_at?: string;
};

type ContactFormData = {
  nome?: string;
  telefone?: string;
  email?: string;
  empresa?: string;
  cargo?: string;
  categoria?: Contact["categoria"];
  observacoes?: string;
  endereco?: string;
  cidade?: string;
};

type SupabaseContactRow = {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  company_name: string | null;
  position: string | null;
  notes: string | null;
  created_at: string | null;
  updated_at: string | null;
  category?: string | null;
  address?: string | null;
  city?: string | null;
  type?: string | null;
};

type SupabaseHotelRow = {
  id: string;
  nome: string;
  telefone: string | null;
  cidade: string | null;
  preco_single: number | null;
  preco_duplo: number | null;
  endereco: string | null;
  created_at: string | null;
  updated_at: string | null;
};

const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

const mapCategoryFromSupabase = (value?: string | null): Contact["categoria"] => {
  if (!value) return "clientes";
  const v = value.toLowerCase();
  if (v.includes("colab") || v.includes("colaborador") || v.includes("funcionario")) return "colaboradores";
  if (v.includes("fornec") || v.includes("fornecedor")) return "fornecedores";
  if (v.includes("hote") || v.includes("hotel")) return "hoteis";
  if (v.includes("cliente") || v.includes("cotista") || v.includes("clientes")) return "clientes";
  return "clientes";
};

const localToContactType = (category: Contact["categoria"]): string => {
  switch (category) {
    case "colaboradores":
      return "Colaboradores";
    case "fornecedores":
      return "Fornecedores";
    case "hoteis":
      return "Hoteis";
    case "clientes":
    default:
      return "Cotista";
  }
};

/**
 * Constrói payload que será enviado ao Supabase para a tabela contacts.
 * Retorna um objeto cujas chaves batem com as colunas da tabela public.contacts
 */
const buildContactPayload = (data: Partial<ContactFormData>) => {
  const mappedType = localToContactType(data.categoria ?? "clientes");
  return {
    name: data.nome || "",
    phone: data.telefone || null,
    email: data.email || null,
    company_name: data.empresa || null,
    position: data.cargo || null,
    notes: data.observacoes || null,
    address: data.endereco || null,
    city: data.cidade || null,
    type: mappedType,
    category: mappedType,
  };
};

const mapSupabaseContact = (row: SupabaseContactRow): Contact => ({
  id: row.id,
  nome: row.name,
  telefone: row.phone ?? "",
  email: row.email ?? undefined,
  empresa: row.company_name ?? undefined,
  cargo: row.position ?? undefined,
  categoria: mapCategoryFromSupabase(row.category ?? row.type),
  observacoes: row.notes ?? undefined,
  endereco: row.address ?? undefined,
  cidade: row.city ?? undefined,
  origin: "contacts",
  created_at: row.created_at ?? undefined,
  updated_at: row.updated_at ?? undefined,
});

const mapSupabaseHotel = (row: SupabaseHotelRow): Contact => ({
  id: row.id,
  nome: row.nome,
  telefone: row.telefone ?? "",
  categoria: "hoteis",
  endereco: row.endereco ?? undefined,
  cidade: row.cidade ?? undefined,
  precoSingle: row.preco_single ?? undefined,
  precoDuplo: row.preco_duplo ?? undefined,
  origin: "hoteis",
  created_at: row.created_at ?? undefined,
  updated_at: row.updated_at ?? undefined,
});

export default function AgendaPage(): JSX.Element {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingContact, setEditingContact] = useState<Contact | undefined>(undefined);
  const [isHotelModalOpen, setIsHotelModalOpen] = useState<boolean>(false);
  const [editingHotel, setEditingHotel] = useState<Contact | undefined>(undefined);
  const [activeTab, setActiveTab] = useState<"clientes" | "colaboradores" | "fornecedores" | "hoteis">("clientes");
  const [hotelForm, setHotelForm] = useState({
    nome: "",
    telefone: "",
    cidade: "",
    endereco: "",
    preco_single: "",
    preco_duplo: "",
  });
  const { toast } = useToast();

  const loadContacts = useCallback(async (term?: string) => {
    try {
      setLoading(true);
      const likePattern = term ? `%${term}%` : undefined;

      // contacts query
      let contactsQuery = supabase
        .from("contacts")
        .select("id,name,phone,email,company_name,position,notes,created_at,updated_at,category,address,city,type")
        .order("name", { ascending: true });

      if (likePattern) {
        contactsQuery = contactsQuery.or(
          `name.ilike.${likePattern},company_name.ilike.${likePattern},phone.ilike.${likePattern},email.ilike.${likePattern},city.ilike.${likePattern}`
        );
      }

      // hoteis query
      let hotelsQuery = supabase
        .from("hoteis")
        .select("*")
        .order("nome", { ascending: true });

      if (likePattern) {
        hotelsQuery = hotelsQuery.or(`nome.ilike.${likePattern},cidade.ilike.${likePattern},telefone.ilike.${likePattern}`);
      }

      const [contactsResult, hotelsResult] = await Promise.all([contactsQuery, hotelsQuery]);

      if (contactsResult.error) throw contactsResult.error;
      if (hotelsResult.error) throw hotelsResult.error;

      const contactsData = (contactsResult.data as SupabaseContactRow[] | null)?.map(mapSupabaseContact) ?? [];
      const hotelsData = (hotelsResult.data as SupabaseHotelRow[] | null)?.map(mapSupabaseHotel) ?? [];

      setContacts([...contactsData, ...hotelsData]);
    } catch (error) {
      console.error("Erro ao carregar contatos:", error);
      toast({
        title: "Erro",
        description: "Erro ao carregar os contatos",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadContacts();
  }, [loadContacts]);

  const handleSearch = (term: string) => {
    setSearchTerm(term);
    loadContacts(term.trim() ? term.trim() : undefined);
  };

  const handleAddContact = () => {
    setEditingContact(undefined);
    setIsModalOpen(true);
  };

  const handleAddHotel = () => {
    setEditingHotel(undefined);
    setHotelForm({ nome: "", telefone: "", cidade: "", endereco: "", preco_single: "", preco_duplo: "" });
    setIsHotelModalOpen(true);
  };

  const handleEditContact = (contact: Contact) => {
    if (contact.origin === "hoteis") {
      setEditingHotel(contact);
      setHotelForm({
        nome: contact.nome || "",
        telefone: contact.telefone || "",
        cidade: contact.cidade || "",
        endereco: contact.endereco || "",
        preco_single: contact.precoSingle !== undefined ? String(contact.precoSingle) : "",
        preco_duplo: contact.precoDuplo !== undefined ? String(contact.precoDuplo) : "",
      });
      setIsHotelModalOpen(true);
      return;
    }

    setEditingContact(contact);
    setIsModalOpen(true);
  };

  const handleDeleteContact = async (contact: Contact) => {
    try {
      if (contact.origin === "hoteis") {
        const { error } = await supabase.from("hoteis").delete().eq("id", contact.id);
        if (error) throw error;
        toast({ title: "Sucesso", description: "Hotel excluído com sucesso" });
      } else {
        const { error } = await supabase.from("contacts").delete().eq("id", contact.id);
        if (error) throw error;
        toast({ title: "Sucesso", description: "Contato excluído com sucesso" });
      }
      await loadContacts(searchTerm.trim() ? searchTerm.trim() : undefined);
    } catch (error) {
      console.error("Erro ao excluir:", error);
      toast({ title: "Erro", description: "Erro ao excluir registro", variant: "destructive" });
    }
  };

  const handleSaveContact = async (contactData: ContactFormData) => {
    try {
      const payload = buildContactPayload(contactData);
      const { error } = await supabase.from("contacts").insert(payload);
      if (error) throw error;
      toast({ title: "Sucesso", description: "Contato adicionado com sucesso" });
      setIsModalOpen(false);
      await loadContacts(searchTerm.trim() ? searchTerm.trim() : undefined);
    } catch (error) {
      console.error("Erro ao adicionar contato:", error);
      toast({ title: "Erro", description: "Erro ao adicionar contato", variant: "destructive" });
    }
  };

  const handleUpdateContact = async (id: string, updates: ContactFormData) => {
    try {
      const payload = buildContactPayload(updates);
      const { error } = await supabase.from("contacts").update(payload).eq("id", id);
      if (error) throw error;
      toast({ title: "Sucesso", description: "Contato atualizado com sucesso" });
      setIsModalOpen(false);
      setEditingContact(undefined);
      await loadContacts(searchTerm.trim() ? searchTerm.trim() : undefined);
    } catch (error) {
      console.error("Erro ao atualizar contato:", error);
      toast({ title: "Erro", description: "Erro ao atualizar contato", variant: "destructive" });
    }
  };

  const filteredContacts = contacts.filter((c) => c.categoria === activeTab);

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "colaboradores":
        return <Building className="h-4 w-4" />;
      case "fornecedores":
        return <Truck className="h-4 w-4" />;
      case "hoteis":
        return <Hotel className="h-4 w-4" />;
      default:
        return <Users className="h-4 w-4" />;
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case "clientes":
        return "Clientes";
      case "colaboradores":
        return "Colaboradores";
      case "fornecedores":
        return "Fornecedores";
      case "hoteis":
        return "Hotéis";
      default:
        return "Outros";
    }
  };

  return (
    <Layout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Agenda & Contatos</h1>
            <p className="text-muted-foreground mt-2">Gerencie todos os seus contatos organizados por categorias</p>
          </div>

          {activeTab === "hoteis" ? (
            <Button onClick={handleAddHotel} className="flex items-center gap-2">
              <Plus className="h-4 w-4" /> Adicionar Hotel
            </Button>
          ) : (
            <Button onClick={handleAddContact} className="flex items-center gap-2">
              <Plus className="h-4 w-4" /> Adicionar Contato
            </Button>
          )}
        </div>

        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Buscar por nome ou empresa..."
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
          <TabsList className="mt-2">
            <TabsTrigger value="clientes">Clientes</TabsTrigger>
            <TabsTrigger value="colaboradores">Colaboradores</TabsTrigger>
            <TabsTrigger value="fornecedores">Fornecedores</TabsTrigger>
            <TabsTrigger value="hoteis">Hotéis</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="w-full mt-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-muted-foreground">Carregando...</div>
            </div>
          ) : filteredContacts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="text-muted-foreground">
                {searchTerm ? `Nenhum contato encontrado para "${searchTerm}".` : "Nenhum contato cadastrado ainda."}
              </div>
            </div>
          ) : (
            <div className="space-y-8">
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  {getCategoryIcon(activeTab)}
                  <h2 className="text-xl font-semibold text-foreground">{getCategoryLabel(activeTab)}</h2>
                  <Badge variant="secondary">{filteredContacts.length}</Badge>
                </div>

                <div className="space-y-3">
                  {filteredContacts.map((contact) => (
                    <Card key={contact.id} className="hover:shadow-lg transition-shadow group">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3 flex-1">
                            <div className="flex items-center gap-2">
                              {getCategoryIcon(contact.categoria)}
                              <div>
                                <h3 className="font-semibold text-foreground">{contact.nome}</h3>
                                <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                                  {contact.telefone && <span>{contact.telefone}</span>}
                                  {contact.email && (
                                    <>
                                      <span>•</span>
                                      <span>{contact.email}</span>
                                    </>
                                  )}
                                  {contact.empresa && (
                                    <>
                                      <span>•</span>
                                      <span>{contact.empresa}</span>
                                    </>
                                  )}
                                  {contact.cidade && (
                                    <>
                                      <span>•</span>
                                      <span>{contact.cidade}</span>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            {contact.cargo && (
                              <Badge variant="outline" className="text-xs">
                                {contact.cargo}
                              </Badge>
                            )}
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                              <Button variant="ghost" size="sm" onClick={() => handleEditContact(contact)} className="h-6 w-6 p-0">
                                <Edit className="h-3 w-3" />
                              </Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-destructive hover:text-destructive">
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Excluir contato</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Tem certeza que deseja excluir o contato "{contact.nome}"? Esta ação não pode ser desfeita.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => handleDeleteContact(contact)}
                                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                    >
                                      Excluir
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </div>
                        </div>

                        {(contact.precoSingle !== undefined || contact.precoDuplo !== undefined) && (
                          <div className="text-xs text-muted-foreground mt-2 flex flex-wrap gap-3">
                            {contact.precoSingle !== undefined && <span>Single: {currencyFormatter.format(contact.precoSingle)}</span>}
                            {contact.precoDuplo !== undefined && <span>Duplo: {currencyFormatter.format(contact.precoDuplo)}</span>}
                          </div>
                        )}

                        {contact.observacoes && (
                          <div className="text-xs text-muted-foreground mt-2 pt-2 border-t border-border">
                            <span className="font-medium">Observações:</span> {contact.observacoes}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        <ContactModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setEditingContact(undefined);
          }}
          contact={editingContact}
          onSave={handleSaveContact}
          onUpdate={handleUpdateContact}
        />

        <Dialog open={isHotelModalOpen} onOpenChange={setIsHotelModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingHotel ? "Editar Hotel" : "Adicionar Hotel"}</DialogTitle>
              <DialogDescription>Preencha os dados do hotel</DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <Label htmlFor="hotel_nome">Nome *</Label>
                <Input id="hotel_nome" value={hotelForm.nome} onChange={(e) => setHotelForm({ ...hotelForm, nome: e.target.value })} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="hotel_telefone">Telefone</Label>
                  <Input id="hotel_telefone" value={hotelForm.telefone} onChange={(e) => setHotelForm({ ...hotelForm, telefone: e.target.value })} />
                </div>
                <div>
                  <Label htmlFor="hotel_cidade">Cidade</Label>
                  <Input id="hotel_cidade" value={hotelForm.cidade} onChange={(e) => setHotelForm({ ...hotelForm, cidade: e.target.value })} />
                </div>
              </div>
              <div>
                <Label htmlFor="hotel_endereco">Endereço</Label>
                <Input id="hotel_endereco" value={hotelForm.endereco} onChange={(e) => setHotelForm({ ...hotelForm, endereco: e.target.value })} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="hotel_preco_single">Preço Single</Label>
                  <Input
                    id="hotel_preco_single"
                    type="number"
                    step="0.01"
                    value={hotelForm.preco_single}
                    onChange={(e) => setHotelForm({ ...hotelForm, preco_single: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="hotel_preco_duplo">Preço Duplo</Label>
                  <Input
                    id="hotel_preco_duplo"
                    type="number"
                    step="0.01"
                    value={hotelForm.preco_duplo}
                    onChange={(e) => setHotelForm({ ...hotelForm, preco_duplo: e.target.value })}
                  />
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsHotelModalOpen(false)}>
                Cancelar
              </Button>
              <Button
                onClick={async () => {
                  try {
                    if (!hotelForm.nome) {
                      toast({ title: "Campos obrigatórios", description: "Nome é obrigatório", variant: "destructive" });
                      return;
                    }

                    const payload = {
                      nome: hotelForm.nome,
                      telefone: hotelForm.telefone || null,
                      cidade: hotelForm.cidade || null,
                      endereco: hotelForm.endereco || null,
                      preco_single: hotelForm.preco_single !== "" ? Number(hotelForm.preco_single) : null,
                      preco_duplo: hotelForm.preco_duplo !== "" ? Number(hotelForm.preco_duplo) : null,
                    };

                    if (editingHotel) {
                      const { error } = await supabase.from("hoteis").update(payload).eq("id", editingHotel.id);
                      if (error) throw error;
                      toast({ title: "Sucesso", description: "Hotel atualizado com sucesso" });
                    } else {
                      const { error } = await supabase.from("hoteis").insert(payload);
                      if (error) throw error;
                      toast({ title: "Sucesso", description: "Hotel cadastrado com sucesso" });
                    }

                    setIsHotelModalOpen(false);
                    setEditingHotel(undefined);
                    await loadContacts(searchTerm.trim() ? searchTerm.trim() : undefined);
                  } catch (error) {
                    console.error("Erro ao salvar hotel:", error);
                    toast({ title: "Erro", description: "Erro ao salvar hotel", variant: "destructive" });
                  }
                }}
              >
                {editingHotel ? "Atualizar" : "Cadastrar"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}
