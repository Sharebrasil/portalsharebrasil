export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type AppRole = 'gestor_master' | 'admin' | 'financeiro_master' | 'tripulante';

export interface Database {
  public: {
    Tables: {
      user_profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string;
          created_at: string | null;
          updated_at: string | null;
          display_name: string | null;
          phone: number | null;
          address: string | null;
          avatar_url: string | null;
          role: AppRole | null;
          tipo: string | null;
          admission_date: string | null;
          salary: number | null;
          benefits: string | null;
          cpf: string | null;
          rg: string | null;
          birth_date: string | null;
          bank_data: Json;
          employment_status: string | null;
          is_authenticated_user: boolean | null;
        };
        Insert: {
          id?: string;
          email: string;
          full_name: string;
          created_at?: string | null;
          updated_at?: string | null;
          display_name?: string | null;
          phone?: number | null;
          address?: string | null;
          avatar_url?: string | null;
          role?: AppRole | null;
          tipo?: string | null;
          admission_date?: string | null;
          salary?: number | null;
          benefits?: string | null;
          cpf?: string | null;
          rg?: string | null;
          birth_date?: string | null;
          bank_data?: Json;
          employment_status?: string | null;
          is_authenticated_user?: boolean | null;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string;
          created_at?: string | null;
          updated_at?: string | null;
          display_name?: string | null;
          phone?: number | null;
          address?: string | null;
          avatar_url?: string | null;
          role?: AppRole | null;
          tipo?: string | null;
          admission_date?: string | null;
          salary?: number | null;
          benefits?: string | null;
          cpf?: string | null;
          rg?: string | null;
          birth_date?: string | null;
          bank_data?: Json;
          employment_status?: string | null;
          is_authenticated_user?: boolean | null;
        };
      };
      aircraft: {
        Row: {
          id: string;
          registration: string;
          manufacturer: string;
          model: string;
          serial_number: string;
          owner_name: string;
          fuel_consumption: string;
          created_at: string | null;
          updated_at: string | null;
          status: string | null;
          year: string | null;
          base: string | null;
        };
        Insert: {
          id?: string;
          registration: string;
          manufacturer: string;
          model: string;
          serial_number: string;
          owner_name: string;
          fuel_consumption: string;
          created_at?: string | null;
          updated_at?: string | null;
          status?: string | null;
          year?: string | null;
          base?: string | null;
        };
        Update: {
          id?: string;
          registration?: string;
          manufacturer?: string;
          model?: string;
          serial_number?: string;
          owner_name?: string;
          fuel_consumption?: string;
          created_at?: string | null;
          updated_at?: string | null;
          status?: string | null;
          year?: string | null;
          base?: string | null;
        };
      };
      aerodromes: {
        Row: {
          id: string;
          name: string;
          icao_code: string;
          created_at: string | null;
          updated_at: string | null;
          coordenadas: string | null;
        };
        Insert: {
          id?: string;
          name: string;
          icao_code: string;
          created_at?: string | null;
          updated_at?: string | null;
          coordenadas?: string | null;
        };
        Update: {
          id?: string;
          name?: string;
          icao_code?: string;
          created_at?: string | null;
          updated_at?: string | null;
          coordenadas?: string | null;
        };
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      app_role: AppRole;
    };
  };
}
