export type ContactCategory = "clientes" | "colaboradores" | "fornecedores" | "hoteis";

export type ContactOrigin = "contacts" | "hoteis" | "clients";

export interface Contact {
  id: string;
  nome: string;
  telefone: string;
  email?: string;
  empresa?: string;
  cargo?: string;
  categoria: ContactCategory;
  observacoes?: string;
  endereco?: string;
  cidade?: string;
  precoSingle?: number;
  precoDuplo?: number;
  origin?: ContactOrigin;
  created_at?: string;
  updated_at?: string;
}

export type ContactFormData = Omit<Contact, "id" | "created_at" | "updated_at" | "origin">;

export interface FuelStation {
  id: string;
  nome: string;
  telefone: string;
  endereco?: string;
  cidade: string;
  combustiveis: string[];
  horario_funcionamento?: string;
  observacoes?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Hotel {
  id?: string;
  hotel: string;
  telefone: string;
  endereco?: string;
  cidade: string;
  preco_sgl: number;
  preco_dbl: number;
  observacoes?: string;
  created_at?: string;
  updated_at?: string;
}
