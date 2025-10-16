import { Contact, FuelStation, Hotel } from "@/types/agenda";

// Mock data
const mockContacts: Contact[] = [
  {
    id: "1",
    nome: "João Silva",
    telefone: "(11) 99999-1234",
    email: "joao@email.com",
    empresa: "Tech Solutions",
    cargo: "Gerente",
    categoria: "clientes",
    observacoes: "Cliente preferencial",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "2",
    nome: "Maria Santos",
    telefone: "(11) 88888-5678",
    email: "maria@empresa.com",
    empresa: "Logística Express",
    cargo: "Coordenadora",
    categoria: "fornecedores",
    observacoes: "Fornecedor de transporte",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "3",
    nome: "Carlos Oliveira",
    telefone: "(11) 77777-9012",
    email: "carlos@interno.com",
    empresa: "Nossa Empresa",
    cargo: "Desenvolvedor",
    categoria: "colaboradores",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

const mockFuelStations: FuelStation[] = [
  {
    id: "1",
    nome: "Posto Petrobrás Centro",
    telefone: "(11) 3333-4444",
    endereco: "Av. Paulista, 1000",
    cidade: "São Paulo",
    combustiveis: ["Gasolina", "Etanol", "Diesel"],
    horario_funcionamento: "24h",
    observacoes: "Aceita cartão corporativo",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "2",
    nome: "Shell Express",
    telefone: "(11) 2222-3333",
    endereco: "Rod. Anhanguera, km 25",
    cidade: "São Paulo",
    combustiveis: ["Gasolina", "Diesel", "GNV"],
    horario_funcionamento: "06:00 - 22:00",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

const mockHotels: Hotel[] = [
  {
    id: "1",
    hotel: "Hotel Central Plaza",
    telefone: "(11) 1111-2222",
    endereco: "Rua Augusta, 500",
    cidade: "São Paulo",
    preco_sgl: 150.00,
    preco_dbl: 200.00,
    observacoes: "Café da manhã incluso",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "2",
    hotel: "Pousada do Viajante",
    telefone: "(11) 5555-6666",
    endereco: "Av. Brigadeiro Faria Lima, 200",
    cidade: "São Paulo",
    preco_sgl: 120.00,
    preco_dbl: 180.00,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

// Simulate API delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const mockBackend = {
  agenda: {
    async getContacts() {
      await delay(500);
      return { contacts: mockContacts };
    },

    async getFuelStations() {
      await delay(300);
      return { fuelStations: mockFuelStations };
    },

    async getHotels() {
      await delay(300);
      return { hotels: mockHotels };
    },

    async searchContacts(term: string) {
      await delay(400);
      const filtered = mockContacts.filter(contact =>
        contact.nome.toLowerCase().includes(term.toLowerCase()) ||
        contact.empresa?.toLowerCase().includes(term.toLowerCase()) ||
        contact.telefone.includes(term)
      );
      return { contacts: filtered };
    },

    async createContact(contactData: Omit<Contact, 'id'>) {
      await delay(600);
      const newContact: Contact = {
        ...contactData,
        id: Math.random().toString(36).substr(2, 9),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      mockContacts.push(newContact);
      return { contact: newContact };
    },

    async updateContact(id: string, updates: Partial<Contact>) {
      await delay(600);
      const index = mockContacts.findIndex(c => c.id === id);
      if (index === -1) throw new Error('Contact not found');
      
      const updatedContact = {
        ...mockContacts[index],
        ...updates,
        updated_at: new Date().toISOString(),
      };
      mockContacts[index] = updatedContact;
      return { contact: updatedContact };
    },

    async deleteContact(id: string) {
      await delay(400);
      const index = mockContacts.findIndex(c => c.id === id);
      if (index === -1) throw new Error('Contact not found');
      
      mockContacts.splice(index, 1);
      return { success: true };
    },
  },
};