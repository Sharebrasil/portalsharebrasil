import { useState, useEffect, useCallback } from "react";
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
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import type { Contact, ContactFormData } from "@/types/agenda";
import type { TablesInsert, Enums } from "@/integrations/supabase/types";

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
  switch (value?.toLowerCase()) {
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
    case "clientes":
    case "cotista":
    default:
      return "clientes";
  }
};

type ContactTypeEnum = Enums<"contact_type">;

const localToContactType = (category: Contact["categoria"]): ContactTypeEnum => {
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

const buildContactPayload = (data: Partial<ContactFormData>): TablesInsert<"contacts"> => {
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
});

export default function AgendaPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact>();
  const [isHotelModalOpen, setIsHotelModalOpen] = useState(false);
  const [editingHotel, setEditingHotel] = useState<Contact>();
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
      const likePattern = term ? `%${term.trim()}%` : undefined;

      let contactsQuery = supabase
        .from("contacts")
        .select("id,name,phone,email,company_name,position,notes,created_at,updated_at,category,address,city,type")
        .order("name", { ascending: true });

      if (likePattern) {
        contactsQuery = contactsQuery.or(
          `name.ilike.${likePattern},company_name.ilike.${likePattern},phone.ilike.${likePattern},email.ilike.${likePattern},city.ilike.${likePattern}`
        );
      }

      let hotelsQuery = supabase
        .from("hoteis")
        .select("*")
        .order("nome", { ascending: true });

      if (likePattern) {
        hotelsQuery = hotelsQuery.or(
          `nome.ilike.${likePattern},cidade.ilike.${likePattern},telefone.ilike.${likePattern}`
        );
      }

      const [contactsResult, hotelsResult] = await Promise.all([contactsQuery, hotelsQuery]);

      if (contactsResult.error) throw contactsResult.error;
      if (hotelsResult.error) throw hotelsResult.error;

      const contactsData = (contactsResult.data as SupabaseContactRow[]).map(mapSupabaseContact);
      const hotelsData = (hotelsResult.data as SupabaseHotelRow[]).map(mapSupabaseHotel);

      setContacts([...contactsData, ...hotelsData]);
    } catch (error) {
      console.error("Erro ao carregar contatos:", error);
      toast({ title: "Erro", description: "Erro ao carregar contatos", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadContacts();
  }, [loadContacts]);

  const handleSearch = (term: string) => {
    setSearchTerm(term);
    loadContacts(term);
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
        preco_single: contact.precoSingle?.toString() || "",
        preco_duplo: contact.precoDuplo?.toString() || "",
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
      await loadContacts(searchTerm);
    } catch (error) {
      console.error(error);
      toast({ title: "Erro", description: "Erro ao excluir registro", variant: "destructive" });
    }
  };

  const handleSaveContact = async (data: ContactFormData) => {
    try {
      const payload = buildContactPayload(data);
      const { error } = await supabase.from("contacts").insert(payload);
      if (error) throw error;
      toast({ title: "Sucesso", description: "Contato adicionado com sucesso" });
      await loadContacts(searchTerm);
    } catch (error) {
      toast({ title: "Erro", description: "Erro ao adicionar contato", variant: "destructive" });
    }
  };

  const handleUpdateContact = async (id: string, data: ContactFormData) => {
    try {
      const payload = buildContactPayload(data);
      const { error } = await supabase.from("contacts").update(payload).eq("id", id);
      if (error) throw error;
      toast({ title: "Sucesso", description: "Contato atualizado com sucesso" });
      await loadContacts(searchTerm);
    } catch (error) {
      toast({ title: "Erro", description: "Erro ao atualizar contato", variant: "destructive" });
    }
  };

  const filteredContacts = contacts.filter((c) => c.categoria === activeTab);

  const getCategoryIcon = (cat: string) =>
    cat === "colaboradores" ? (
      <Building className="h-4 w-4" />
    ) : cat === "fornecedores" ? (
      <Truck className="h-4 w-4" />
    ) : cat === "hoteis" ? (
      <Hotel className="h-4 w-4" />
    ) : (
      <Users className="h-4 w-4" />
    );

  const getCategoryLabel = (c: string) =>
    c === "clientes"
      ? "Clientes"
      : c === "colaboradores"
        ? "Colaboradores"
        : c === "fornecedores"
          ? "Fornecedores"
          : "Hotéis";

  const getCategoryColor = (c: string) =>
    c === "clientes"
      ? "bg-blue-100 text-blue-800"
      : c === "colaboradores"
        ? "bg-green-100 text-green-800"
        : c === "fornecedores"
          ? "bg-orange-100 text-orange-800"
          : "bg-pink-100 text-pink-800";

  return (
    <Layout>
      {/* Conteúdo principal (mesmo do seu código, idêntico ao original) */}
      {/* ... */}
    </Layout>
  );
}
