import { useState, useEffect, useCallback } from "react";
import { Layout } from "@/components/layout/Layout";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  AlertDialogTrigger, // Added import
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import type { Contact, ContactFormData } from "@/types/agenda";
import type { TablesInsert } from "@/integrations/supabase/types";

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
  preco_single: string | number | null;
  preco_duplo: string | number | null;
  endereco: string | null;
};

const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

const mapCategoryFromSupabase = (value?: string | null): Contact["categoria"] => {
  switch (value) {
    case "clientes":
    case "cliente":
      return "clientes";
    case "colaboradores":
    case "colaborador":
    case "funcionario":
      return "colaboradores";
    case "fornecedores":
    case "fornecedor":
      return "fornecedores";
    case "hoteis":
    case "hotel":
      return "hoteis";
    default:
      return "clientes";
  }
};

const mapCategoryToSupabaseType = (category: Contact["categoria"]): string => {
  switch (category) {
    case "clientes":
      return "cliente";
    case "colaboradores":
      return "funcionario";
    default:
      return "outro";
  }
};

const buildContactPayload = (data: Partial<ContactFormData>): TablesInsert<'contacts'> => {
  const payload: TablesInsert<'contacts'> = {
    name: data.nome || "", // Ensure name is always present
    type: mapCategoryToSupabaseType(data.categoria || "clientes"), // Ensure type is always present
  };

  if (data.nome !== undefined) payload.name = data.nome;
  if (data.telefone !== undefined) payload.phone = data.telefone || null;
  if (data.email !== undefined) payload.email = data.email || null;
  if (data.empresa !== undefined) payload.company_name = data.empresa || null;
  if (data.cargo !== undefined) payload.position = data.cargo || null;
  if (data.observacoes !== undefined) payload.notes = data.observacoes || null;
  if (data.endereco !== undefined) payload.address = data.endereco || null;
  if (data.cidade !== undefined) payload.city = data.cidade || null;
  if (data.categoria !== undefined) {
    payload.category = data.categoria;
    payload.type = mapCategoryToSupabaseType(data.categoria);
  }

  return payload;
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
  precoSingle: row.preco_single !== null ? Number(row.preco_single) : undefined,
  precoDuplo: row.preco_duplo !== null ? Number(row.preco_duplo) : undefined,
  origin: "hoteis",
});

export default function AgendaPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>("todos");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | undefined>();
  const { toast } = useToast();

  const loadContacts = useCallback(
    async (term?: string) => {
      try {
        setLoading(true);
        const normalizedTerm = term?.trim();
        const likePattern = normalizedTerm ? `%${normalizedTerm}%` : undefined;

        const contactsQuery = supabase
          .from("contacts")
          .select("id,name,phone,email,company_name,position,notes,created_at,updated_at,category,address,city,type")
          .order("name", { ascending: true });

        if (likePattern) {
          contactsQuery.or(
            `name.ilike.${likePattern},company_name.ilike.${likePattern},phone.ilike.${likePattern},email.ilike.${likePattern},city.ilike.${likePattern}`
          );
        }

        const hotelsQuery = supabase
          .from("hoteis")
          .select("*")
          .order("nome", { ascending: true });

        if (likePattern) {
          hotelsQuery.or(`nome.ilike.${likePattern},cidade.ilike.${likePattern},telefone.ilike.${likePattern}`);
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
    },
    [toast]
  );

  useEffect(() => {
    loadContacts();
  }, [loadContacts]);

  const handleSearch = async (term: string) => {
    setSearchTerm(term);
    await loadContacts(term.trim() ? term : undefined);
  };

  const handleAddContact = () => {
    setEditingContact(undefined);
    setIsModalOpen(true);
  };

  const handleEditContact = (contact: Contact) => {
    if (contact.origin === "hoteis") {
      toast({
        title: "Ação não disponível",
        description: "Atualize os dados de hotéis diretamente na base de hotéis.",
      });
      return;
    }

    setEditingContact(contact);
    setIsModalOpen(true);
  };

  const handleDeleteContact = async (contact: Contact) => {
    if (contact.origin === "hoteis") {
      toast({
        title: "Ação não disponível",
        description: "Exclua hotéis pelo cadastro específico de hotéis.",
      });
      return;
    }

    try {
      const { error } = await supabase.from("contacts").delete().eq("id", contact.id);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Contato excluído com sucesso",
      });

      await loadContacts(searchTerm.trim() ? searchTerm : undefined);
    } catch (error) {
      console.error("Erro ao excluir contato:", error);
      toast({
        title: "Erro",
        description: "Erro ao excluir contato",
        variant: "destructive",
      });
    }
  };

  const handleSaveContact = async (contactData: ContactFormData) => {
    try {
      const payload = buildContactPayload(contactData);
      const { error } = await supabase.from("contacts").insert(payload);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Contato adicionado com sucesso",
      });

      await loadContacts(searchTerm.trim() ? searchTerm : undefined);
    } catch (error) {
      console.error("Erro ao adicionar contato:", error);
      toast({
        title: "Erro",
        description: "Erro ao adicionar contato",
        variant: "destructive",
      });
      throw error;
    }
  };

  const handleUpdateContact = async (id: string, updates: ContactFormData) => {
    try {
      const payload = buildContactPayload(updates);
      const { error } = await supabase.from("contacts").update(payload).eq("id", id);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Contato atualizado com sucesso",
      });

      await loadContacts(searchTerm.trim() ? searchTerm : undefined);
    } catch (error) {
      console.error("Erro ao atualizar contato:", error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar contato",
        variant: "destructive",
      });
      throw error;
    }
  };

  const filteredContacts = contacts.filter((contact) => {
    if (activeTab === "todos") return true;
    return contact.categoria === activeTab;
  });

  const groupedContacts = filteredContacts.reduce((acc, contact) => {
    if (!acc[contact.categoria]) {
      acc[contact.categoria] = [];
    }
    acc[contact.categoria].push(contact);
    return acc;
  }, {} as Record<Contact["categoria"], Contact[]>);

  const categories = [
    { id: "todos", label: "Todos", icon: <Search className="h-4 w-4" /> },
    { id: "colaboradores", label: "Colaboradores", icon: <Building className="h-4 w-4" /> },
    { id: "fornecedores", label: "Fornecedores", icon: <Truck className="h-4 w-4" /> },
    { id: "hoteis", label: "Hotéis", icon: <Hotel className="h-4 w-4" /> },
  ];

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

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "clientes":
        return "bg-blue-100 text-blue-800";
      case "colaboradores":
        return "bg-green-100 text-green-800";
      case "fornecedores":
        return "bg-orange-100 text-orange-800";
      case "hoteis":
        return "bg-pink-100 text-pink-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <Layout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Agenda & Contatos</h1>
            <p className="text-muted-foreground mt-2">
              Gerencie todos os seus contatos organizados por categorias
            </p>
          </div>
          <Button onClick={handleAddContact} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Adicionar Contato
          </Button>
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

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            {categories.map((category) => (
              <TabsTrigger key={category.id} value={category.id} className="flex items-center gap-2">
                {category.icon}
                <span className="hidden sm:inline">{category.label}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value={activeTab} className="mt-6">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-muted-foreground">Carregando...</div>
              </div>
            ) : filteredContacts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="text-muted-foreground">
                  {searchTerm
                    ? `Nenhum contato encontrado para "${searchTerm}".`
                    : "Nenhum contato cadastrado ainda."}
                </div>
              </div>
            ) : (
              <div className="space-y-8">
                {Object.entries(groupedContacts).map(([category, contactsList]) => (
                  <div key={category} className="space-y-4">
                    <div className="flex items-center gap-2">
                      {getCategoryIcon(category)}
                      <h2 className="text-xl font-semibold text-foreground">
                        {getCategoryLabel(category)}
                      </h2>
                      <Badge variant="secondary">{contactsList.length}</Badge>
                    </div>

                    <div className="space-y-3">
                      {contactsList.map((contact) => (
                        <Card key={contact.id} className="hover:shadow-lg transition-shadow group">
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3 flex-1">
                                <div className="flex items-center gap-2">
                                  {getCategoryIcon(contact.categoria)}
                                  <div>
                                    <h3 className="font-semibold text-foreground">
                                      {contact.nome}
                                    </h3>
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
                                {contact.origin !== "hoteis" && (
                                  <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleEditContact(contact)}
                                      className="h-6 w-6 p-0"
                                    >
                                      <Edit className="h-3 w-3" />
                                    </Button>
                                    <AlertDialog>
                                      <AlertDialogTrigger asChild>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                                        >
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
                                )}
                              </div>
                            </div>

                            {(contact.precoSingle !== undefined || contact.precoDuplo !== undefined) && (
                              <div className="text-xs text-muted-foreground mt-2 flex flex-wrap gap-3">
                                {contact.precoSingle !== undefined && (
                                  <span>Single: {currencyFormatter.format(contact.precoSingle)}</span>
                                )}
                                {contact.precoDuplo !== undefined && (
                                  <span>Duplo: {currencyFormatter.format(contact.precoDuplo)}</span>
                                )}
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
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        <ContactModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          contact={editingContact}
          onSave={handleSaveContact}
          onUpdate={handleUpdateContact}
        />
      </div>
    </Layout>
  );
}
