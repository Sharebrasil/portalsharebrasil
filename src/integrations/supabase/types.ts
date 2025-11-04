export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      aerodromes: {
        Row: {
          coordenadas: string | null
          created_at: string | null
          icao_code: string
          id: string
          name: string
          updated_at: string | null
        }
        Insert: {
          coordenadas?: string | null
          created_at?: string | null
          icao_code: string
          id?: string
          name: string
          updated_at?: string | null
        }
        Update: {
          coordenadas?: string | null
          created_at?: string | null
          icao_code?: string
          id?: string
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      aircraft: {
        Row: {
          base: string | null
          cell_hours_before: number | null
          cell_hours_current: number | null
          cell_hours_prev: number | null
          created_at: string | null
          fuel_consumption: number | null
          horimeter_active: number | null
          horimeter_end: number | null
          horimeter_start: number | null
          id: string
          manufacturer: string
          model: string
          owner_name: string
          registration: string
          serial_number: string
          status: string
          updated_at: string | null
          year: string | null
        }
        Insert: {
          base?: string | null
          cell_hours_before?: number | null
          cell_hours_current?: number | null
          cell_hours_prev?: number | null
          created_at?: string | null
          fuel_consumption?: number | null
          horimeter_active?: number | null
          horimeter_end?: number | null
          horimeter_start?: number | null
          id?: string
          manufacturer: string
          model: string
          owner_name: string
          registration: string
          serial_number: string
          status?: string
          updated_at?: string | null
          year?: string | null
        }
        Update: {
          base?: string | null
          cell_hours_before?: number | null
          cell_hours_current?: number | null
          cell_hours_prev?: number | null
          created_at?: string | null
          fuel_consumption?: number | null
          horimeter_active?: number | null
          horimeter_end?: number | null
          horimeter_start?: number | null
          id?: string
          manufacturer?: string
          model?: string
          owner_name?: string
          registration?: string
          serial_number?: string
          status?: string
          updated_at?: string | null
          year?: string | null
        }
        Relationships: []
      }
      aircraft_hourly_rates: {
        Row: {
          aircraft_id: string
          created_at: string | null
          effective_date: string
          hourly_rate: number
          id: string
        }
        Insert: {
          aircraft_id: string
          created_at?: string | null
          effective_date: string
          hourly_rate: number
          id?: string
        }
        Update: {
          aircraft_id?: string
          created_at?: string | null
          effective_date?: string
          hourly_rate?: number
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "aircraft_hourly_rates_aircraft_id_fkey"
            columns: ["aircraft_id"]
            isOneToOne: false
            referencedRelation: "aircraft"
            referencedColumns: ["id"]
          },
        ]
      }
      birthdays: {
        Row: {
          category: Database["public"]["Enums"]["contact_type"] | null
          created_at: string | null
          data_aniversario: string
          empresa: string | null
          id: string
          nome: string
          updated_at: string | null
        }
        Insert: {
          category?: Database["public"]["Enums"]["contact_type"] | null
          created_at?: string | null
          data_aniversario: string
          empresa?: string | null
          id?: string
          nome: string
          updated_at?: string | null
        }
        Update: {
          category?: Database["public"]["Enums"]["contact_type"] | null
          created_at?: string | null
          data_aniversario?: string
          empresa?: string | null
          id?: string
          nome?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      client_portal_data: {
        Row: {
          amount: number | null
          client_id: string
          created_at: string | null
          data_type: string
          description: string | null
          due_date: string | null
          file_path: string | null
          id: string
          status: string | null
          updated_at: string | null
          uploaded_by: string | null
        }
        Insert: {
          amount?: number | null
          client_id: string
          created_at?: string | null
          data_type: string
          description?: string | null
          due_date?: string | null
          file_path?: string | null
          id?: string
          status?: string | null
          updated_at?: string | null
          uploaded_by?: string | null
        }
        Update: {
          amount?: number | null
          client_id?: string
          created_at?: string | null
          data_type?: string
          description?: string | null
          due_date?: string | null
          file_path?: string | null
          id?: string
          status?: string | null
          updated_at?: string | null
          uploaded_by?: string | null
        }
        Relationships: []
      }
      clients: {
        Row: {
          address: string | null
          aircraft_id: string | null
          city: string | null
          cnpj: string | null
          cnpj_card_url: string | null
          company_name: string | null
          created_at: string | null
          documents: Json | null
          email: string | null
          financial_contact: string | null
          id: string
          inscricao_estadual: string | null
          logo_url: string | null
          observations: string | null
          phone: string | null
          share_percentage: number | null
          status: string | null
          uf: string | null
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          aircraft_id?: string | null
          city?: string | null
          cnpj?: string | null
          cnpj_card_url?: string | null
          company_name?: string | null
          created_at?: string | null
          documents?: Json | null
          email?: string | null
          financial_contact?: string | null
          id?: string
          inscricao_estadual?: string | null
          logo_url?: string | null
          observations?: string | null
          phone?: string | null
          share_percentage?: number | null
          status?: string | null
          uf?: string | null
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          aircraft_id?: string | null
          city?: string | null
          cnpj?: string | null
          cnpj_card_url?: string | null
          company_name?: string | null
          created_at?: string | null
          documents?: Json | null
          email?: string | null
          financial_contact?: string | null
          id?: string
          inscricao_estadual?: string | null
          logo_url?: string | null
          observations?: string | null
          phone?: string | null
          share_percentage?: number | null
          status?: string | null
          uf?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "clients_aircraft_id_fkey"
            columns: ["aircraft_id"]
            isOneToOne: false
            referencedRelation: "aircraft"
            referencedColumns: ["id"]
          },
        ]
      }
      contacts: {
        Row: {
          address: string | null
          category: Database["public"]["Enums"]["contact_type"] | null
          city: string | null
          company_name: string | null
          created_at: string | null
          email: string | null
          id: string
          name: string
          notes: string | null
          phone: string | null
          position: string | null
          type: Database["public"]["Enums"]["contact_type"]
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          category?: Database["public"]["Enums"]["contact_type"] | null
          city?: string | null
          company_name?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          name: string
          notes?: string | null
          phone?: string | null
          position?: string | null
          type: Database["public"]["Enums"]["contact_type"]
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          category?: Database["public"]["Enums"]["contact_type"] | null
          city?: string | null
          company_name?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          name?: string
          notes?: string | null
          phone?: string | null
          position?: string | null
          type?: Database["public"]["Enums"]["contact_type"]
          updated_at?: string | null
        }
        Relationships: []
      }
      crew_flight_hours: {
        Row: {
          aircraft_id: string
          created_at: string | null
          crew_member_id: string
          id: string
          month: number
          total_hours: number | null
          updated_at: string | null
          year: number
        }
        Insert: {
          aircraft_id: string
          created_at?: string | null
          crew_member_id: string
          id?: string
          month: number
          total_hours?: number | null
          updated_at?: string | null
          year: number
        }
        Update: {
          aircraft_id?: string
          created_at?: string | null
          crew_member_id?: string
          id?: string
          month?: number
          total_hours?: number | null
          updated_at?: string | null
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "crew_flight_hours_aircraft_id_fkey"
            columns: ["aircraft_id"]
            isOneToOne: false
            referencedRelation: "aircraft"
            referencedColumns: ["id"]
          },
        ]
      }
      crew_licenses: {
        Row: {
          created_at: string | null
          crew_member_id: string | null
          expiry_date: string | null
          id: string
          issue_date: string | null
          issuing_authority: string | null
          license_number: string
          license_type: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          crew_member_id?: string | null
          expiry_date?: string | null
          id?: string
          issue_date?: string | null
          issuing_authority?: string | null
          license_number: string
          license_type: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          crew_member_id?: string | null
          expiry_date?: string | null
          id?: string
          issue_date?: string | null
          issuing_authority?: string | null
          license_number?: string
          license_type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "crew_licenses_crew_member_id_fkey"
            columns: ["crew_member_id"]
            isOneToOne: false
            referencedRelation: "crew_members"
            referencedColumns: ["id"]
          },
        ]
      }
      crew_members: {
        Row: {
          birth_date: string | null
          canac: string
          created_at: string | null
          email: string | null
          full_name: string
          id: string
          phone: string | null
          photo_url: string | null
          status: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          birth_date?: string | null
          canac: string
          created_at?: string | null
          email?: string | null
          full_name: string
          id?: string
          phone?: string | null
          photo_url?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          birth_date?: string | null
          canac?: string
          created_at?: string | null
          email?: string | null
          full_name?: string
          id?: string
          phone?: string | null
          photo_url?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      favorite_payers: {
        Row: {
          address: string | null
          city: string | null
          created_at: string | null
          document: string | null
          id: string
          name: string
          uf: string | null
          user_id: string
        }
        Insert: {
          address?: string | null
          city?: string | null
          created_at?: string | null
          document?: string | null
          id?: string
          name: string
          uf?: string | null
          user_id: string
        }
        Update: {
          address?: string | null
          city?: string | null
          created_at?: string | null
          document?: string | null
          id?: string
          name?: string
          uf?: string | null
          user_id?: string
        }
        Relationships: []
      }
      favorite_routes: {
        Row: {
          arrival_airport: string
          created_at: string | null
          departure_airport: string
          id: string
          name: string
          route: string
          updated_at: string | null
        }
        Insert: {
          arrival_airport: string
          created_at?: string | null
          departure_airport: string
          id?: string
          name: string
          route: string
          updated_at?: string | null
        }
        Update: {
          arrival_airport?: string
          created_at?: string | null
          departure_airport?: string
          id?: string
          name?: string
          route?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      favorite_services: {
        Row: {
          created_at: string | null
          description: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          description: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          description?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      flight_checklists: {
        Row: {
          checklist_type: string
          created_at: string | null
          flight_plan_id: string | null
          id: string
          items: Json | null
          updated_at: string | null
        }
        Insert: {
          checklist_type: string
          created_at?: string | null
          flight_plan_id?: string | null
          id?: string
          items?: Json | null
          updated_at?: string | null
        }
        Update: {
          checklist_type?: string
          created_at?: string | null
          flight_plan_id?: string | null
          id?: string
          items?: Json | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "flight_checklists_flight_plan_id_fkey"
            columns: ["flight_plan_id"]
            isOneToOne: false
            referencedRelation: "flight_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      flight_documents: {
        Row: {
          created_at: string | null
          description: string | null
          file_path: string
          file_size: number | null
          file_type: string | null
          id: string
          name: string
          uploaded_by: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          file_path: string
          file_size?: number | null
          file_type?: string | null
          id?: string
          name: string
          uploaded_by?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          file_path?: string
          file_size?: number | null
          file_type?: string | null
          id?: string
          name?: string
          uploaded_by?: string | null
        }
        Relationships: []
      }
      flight_payments: {
        Row: {
          amount: number
          created_at: string | null
          flight_schedule_id: string | null
          id: string
          notes: string | null
          payment_date: string
          payment_method: string | null
          updated_at: string | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          flight_schedule_id?: string | null
          id?: string
          notes?: string | null
          payment_date: string
          payment_method?: string | null
          updated_at?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          flight_schedule_id?: string | null
          id?: string
          notes?: string | null
          payment_date?: string
          payment_method?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "flight_payments_flight_schedule_id_fkey"
            columns: ["flight_schedule_id"]
            isOneToOne: false
            referencedRelation: "flight_schedules"
            referencedColumns: ["id"]
          },
        ]
      }
      flight_plans: {
        Row: {
          aircraft_id: string | null
          alternate_airport: string | null
          arrival_airport: string
          created_at: string | null
          created_by: string | null
          cruise_altitude: string | null
          departure_airport: string
          estimated_time: string | null
          flight_date: string
          flight_schedule_id: string | null
          fuel_endurance: string | null
          id: string
          pilot_in_command: string
          remarks: string | null
          route: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          aircraft_id?: string | null
          alternate_airport?: string | null
          arrival_airport: string
          created_at?: string | null
          created_by?: string | null
          cruise_altitude?: string | null
          departure_airport: string
          estimated_time?: string | null
          flight_date: string
          flight_schedule_id?: string | null
          fuel_endurance?: string | null
          id?: string
          pilot_in_command: string
          remarks?: string | null
          route?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          aircraft_id?: string | null
          alternate_airport?: string | null
          arrival_airport?: string
          created_at?: string | null
          created_by?: string | null
          cruise_altitude?: string | null
          departure_airport?: string
          estimated_time?: string | null
          flight_date?: string
          flight_schedule_id?: string | null
          fuel_endurance?: string | null
          id?: string
          pilot_in_command?: string
          remarks?: string | null
          route?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "flight_plans_aircraft_id_fkey"
            columns: ["aircraft_id"]
            isOneToOne: false
            referencedRelation: "aircraft"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "flight_plans_flight_schedule_id_fkey"
            columns: ["flight_schedule_id"]
            isOneToOne: false
            referencedRelation: "flight_schedules"
            referencedColumns: ["id"]
          },
        ]
      }
      flight_schedules: {
        Row: {
          aircraft_id: string | null
          client_id: string | null
          contact: string | null
          created_at: string | null
          crew_member_id: string | null
          destination: string
          estimated_duration: string | null
          flight_date: string
          flight_time: string
          flight_type: string | null
          id: string
          observations: string | null
          origin: string
          passengers: number | null
          status: string
          updated_at: string | null
        }
        Insert: {
          aircraft_id?: string | null
          client_id?: string | null
          contact?: string | null
          created_at?: string | null
          crew_member_id?: string | null
          destination: string
          estimated_duration?: string | null
          flight_date: string
          flight_time: string
          flight_type?: string | null
          id?: string
          observations?: string | null
          origin: string
          passengers?: number | null
          status?: string
          updated_at?: string | null
        }
        Update: {
          aircraft_id?: string | null
          client_id?: string | null
          contact?: string | null
          created_at?: string | null
          crew_member_id?: string | null
          destination?: string
          estimated_duration?: string | null
          flight_date?: string
          flight_time?: string
          flight_type?: string | null
          id?: string
          observations?: string | null
          origin?: string
          passengers?: number | null
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "flight_schedules_aircraft_id_fkey"
            columns: ["aircraft_id"]
            isOneToOne: false
            referencedRelation: "aircraft"
            referencedColumns: ["id"]
          },
        ]
      }
      hoteis: {
        Row: {
          cidade: string | null
          created_at: string | null
          endereco: string | null
          id: string
          nome: string
          preco_duplo: number | null
          preco_single: number | null
          telefone: string | null
          updated_at: string | null
        }
        Insert: {
          cidade?: string | null
          created_at?: string | null
          endereco?: string | null
          id?: string
          nome: string
          preco_duplo?: number | null
          preco_single?: number | null
          telefone?: string | null
          updated_at?: string | null
        }
        Update: {
          cidade?: string | null
          created_at?: string | null
          endereco?: string | null
          id?: string
          nome?: string
          preco_duplo?: number | null
          preco_single?: number | null
          telefone?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      hotel_reservations: {
        Row: {
          booking_reference: string | null
          checkin_date: string
          checkout_date: string
          city: string | null
          confirmation_code: string | null
          country: string | null
          created_at: string | null
          guests: number | null
          hotel_address: string | null
          hotel_name: string
          id: string
          nights: number | null
          notes: string | null
          room_type: string | null
          status: string | null
          total_amount: number | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          booking_reference?: string | null
          checkin_date: string
          checkout_date: string
          city?: string | null
          confirmation_code?: string | null
          country?: string | null
          created_at?: string | null
          guests?: number | null
          hotel_address?: string | null
          hotel_name: string
          id?: string
          nights?: number | null
          notes?: string | null
          room_type?: string | null
          status?: string | null
          total_amount?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          booking_reference?: string | null
          checkin_date?: string
          checkout_date?: string
          city?: string | null
          confirmation_code?: string | null
          country?: string | null
          created_at?: string | null
          guests?: number | null
          hotel_address?: string | null
          hotel_name?: string
          id?: string
          nights?: number | null
          notes?: string | null
          room_type?: string | null
          status?: string | null
          total_amount?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      logbook_entries: {
        Row: {
          aircraft_id: string | null
          arrival_airport: string
          arrival_time: string | null
          copilot: string | null
          created_at: string | null
          departure_airport: string
          departure_time: string | null
          flight_date: string
          flight_nature: string | null
          flight_time: number | null
          fuel_added: number | null
          id: string
          landings: number | null
          observations: string | null
          pilot_in_command: string | null
          updated_at: string | null
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          aircraft_id?: string | null
          arrival_airport: string
          arrival_time?: string | null
          copilot?: string | null
          created_at?: string | null
          departure_airport: string
          departure_time?: string | null
          flight_date: string
          flight_nature?: string | null
          flight_time?: number | null
          fuel_added?: number | null
          id?: string
          landings?: number | null
          observations?: string | null
          pilot_in_command?: string | null
          updated_at?: string | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          aircraft_id?: string | null
          arrival_airport?: string
          arrival_time?: string | null
          copilot?: string | null
          created_at?: string | null
          departure_airport?: string
          departure_time?: string | null
          flight_date?: string
          flight_nature?: string | null
          flight_time?: number | null
          fuel_added?: number | null
          id?: string
          landings?: number | null
          observations?: string | null
          pilot_in_command?: string | null
          updated_at?: string | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "logbook_entries_aircraft_id_fkey"
            columns: ["aircraft_id"]
            isOneToOne: false
            referencedRelation: "aircraft"
            referencedColumns: ["id"]
          },
        ]
      }
      logbook_months: {
        Row: {
          aircraft_id: string
          cell_hours_end: number | null
          cell_hours_start: number | null
          closed_at: string | null
          closed_by: string | null
          created_at: string | null
          diarias: number | null
          hobbs_hours_end: number | null
          hobbs_hours_start: number | null
          id: string
          is_closed: boolean | null
          month: number
          year: number
        }
        Insert: {
          aircraft_id: string
          cell_hours_end?: number | null
          cell_hours_start?: number | null
          closed_at?: string | null
          closed_by?: string | null
          created_at?: string | null
          diarias?: number | null
          hobbs_hours_end?: number | null
          hobbs_hours_start?: number | null
          id?: string
          is_closed?: boolean | null
          month: number
          year: number
        }
        Update: {
          aircraft_id?: string
          cell_hours_end?: number | null
          cell_hours_start?: number | null
          closed_at?: string | null
          closed_by?: string | null
          created_at?: string | null
          diarias?: number | null
          hobbs_hours_end?: number | null
          hobbs_hours_start?: number | null
          id?: string
          is_closed?: boolean | null
          month?: number
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "logbook_months_aircraft_id_fkey"
            columns: ["aircraft_id"]
            isOneToOne: false
            referencedRelation: "aircraft"
            referencedColumns: ["id"]
          },
        ]
      }
      manutencoes: {
        Row: {
          aeronave_id: string | null
          created_at: string | null
          custo_estimado: number | null
          data_programada: string
          etapa: string
          id: string
          mecanico: string
          observacoes: string | null
          oficina: string | null
          tipo: string
          updated_at: string | null
        }
        Insert: {
          aeronave_id?: string | null
          created_at?: string | null
          custo_estimado?: number | null
          data_programada: string
          etapa?: string
          id?: string
          mecanico: string
          observacoes?: string | null
          oficina?: string | null
          tipo: string
          updated_at?: string | null
        }
        Update: {
          aeronave_id?: string | null
          created_at?: string | null
          custo_estimado?: number | null
          data_programada?: string
          etapa?: string
          id?: string
          mecanico?: string
          observacoes?: string | null
          oficina?: string | null
          tipo?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "manutencoes_aeronave_id_fkey"
            columns: ["aeronave_id"]
            isOneToOne: false
            referencedRelation: "aircraft"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string | null
          id: string
          message: string
          read: boolean | null
          task_id: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          message: string
          read?: boolean | null
          task_id?: string | null
          title: string
          type?: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          message?: string
          read?: boolean | null
          task_id?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      monthly_diary_closures: {
        Row: {
          aircraft_id: string
          closed_at: string | null
          closed_by: string | null
          closing_observations: string | null
          created_at: string | null
          id: string
          month: number
          total_fuel_added: number
          total_hours: number
          total_landings: number
          year: number
        }
        Insert: {
          aircraft_id: string
          closed_at?: string | null
          closed_by?: string | null
          closing_observations?: string | null
          created_at?: string | null
          id?: string
          month: number
          total_fuel_added?: number
          total_hours?: number
          total_landings?: number
          year: number
        }
        Update: {
          aircraft_id?: string
          closed_at?: string | null
          closed_by?: string | null
          closing_observations?: string | null
          created_at?: string | null
          id?: string
          month?: number
          total_fuel_added?: number
          total_hours?: number
          total_landings?: number
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "monthly_diary_closures_aircraft_id_fkey"
            columns: ["aircraft_id"]
            isOneToOne: false
            referencedRelation: "aircraft"
            referencedColumns: ["id"]
          },
        ]
      }
      receipts: {
        Row: {
          amount: number
          amount_text: string | null
          created_at: string | null
          id: string
          issue_date: string
          number_doc: string | null
          observacoes: string | null
          payer_address: string | null
          payer_city: string | null
          payer_document: string | null
          payer_name: string
          payer_uf: string | null
          payoff_number: string | null
          receipt_number: string
          service_description: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          amount: number
          amount_text?: string | null
          created_at?: string | null
          id?: string
          issue_date: string
          number_doc?: string | null
          observacoes?: string | null
          payer_address?: string | null
          payer_city?: string | null
          payer_document?: string | null
          payer_name: string
          payer_uf?: string | null
          payoff_number?: string | null
          receipt_number: string
          service_description: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          amount?: number
          amount_text?: string | null
          created_at?: string | null
          id?: string
          issue_date?: string
          number_doc?: string | null
          observacoes?: string | null
          payer_address?: string | null
          payer_city?: string | null
          payer_document?: string | null
          payer_name?: string
          payer_uf?: string | null
          payoff_number?: string | null
          receipt_number?: string
          service_description?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      salaries: {
        Row: {
          base_salary: number
          created_at: string | null
          crew_member_id: string | null
          effective_date: string
          flight_hour_rate: number | null
          id: string
          updated_at: string | null
        }
        Insert: {
          base_salary: number
          created_at?: string | null
          crew_member_id?: string | null
          effective_date: string
          flight_hour_rate?: number | null
          id?: string
          updated_at?: string | null
        }
        Update: {
          base_salary?: number
          created_at?: string | null
          crew_member_id?: string | null
          effective_date?: string
          flight_hour_rate?: number | null
          id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      tasks: {
        Row: {
          assigned_to: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          due_date: string | null
          id: string
          priority: string | null
          status: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          assigned_to?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          priority?: string | null
          status?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          assigned_to?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          priority?: string | null
          status?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      travel_expenses: {
        Row: {
          categoria: string
          comprovante_url: string | null
          created_at: string | null
          descricao: string
          id: string
          pago_por: string
          travel_report_id: string
          valor: number
        }
        Insert: {
          categoria: string
          comprovante_url?: string | null
          created_at?: string | null
          descricao: string
          id?: string
          pago_por: string
          travel_report_id: string
          valor: number
        }
        Update: {
          categoria?: string
          comprovante_url?: string | null
          created_at?: string | null
          descricao?: string
          id?: string
          pago_por?: string
          travel_report_id?: string
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "travel_expenses_travel_report_id_fkey"
            columns: ["travel_report_id"]
            isOneToOne: false
            referencedRelation: "travel_reports"
            referencedColumns: ["id"]
          },
        ]
      }
      travel_reports: {
        Row: {
          aeronave: string
          cliente: string
          created_at: string | null
          created_by: string | null
          data_fim: string
          data_inicio: string
          destino: string
          id: string
          numero: string
          observacoes: string | null
          total_alimentacao: number | null
          total_cliente: number | null
          total_combustivel: number | null
          total_hospedagem: number | null
          total_outros: number | null
          total_share_brasil: number | null
          total_transporte: number | null
          total_tripulante: number | null
          tripulante: string
          tripulante2: string | null
          updated_at: string | null
          valor_total: number | null
        }
        Insert: {
          aeronave: string
          cliente: string
          created_at?: string | null
          created_by?: string | null
          data_fim: string
          data_inicio: string
          destino: string
          id?: string
          numero: string
          observacoes?: string | null
          total_alimentacao?: number | null
          total_cliente?: number | null
          total_combustivel?: number | null
          total_hospedagem?: number | null
          total_outros?: number | null
          total_share_brasil?: number | null
          total_transporte?: number | null
          total_tripulante?: number | null
          tripulante: string
          tripulante2?: string | null
          updated_at?: string | null
          valor_total?: number | null
        }
        Update: {
          aeronave?: string
          cliente?: string
          created_at?: string | null
          created_by?: string | null
          data_fim?: string
          data_inicio?: string
          destino?: string
          id?: string
          numero?: string
          observacoes?: string | null
          total_alimentacao?: number | null
          total_cliente?: number | null
          total_combustivel?: number | null
          total_hospedagem?: number | null
          total_outros?: number | null
          total_share_brasil?: number | null
          total_transporte?: number | null
          total_tripulante?: number | null
          tripulante?: string
          tripulante2?: string | null
          updated_at?: string | null
          valor_total?: number | null
        }
        Relationships: []
      }
      user_profiles: {
        Row: {
          address: string | null
          avatar_url: string | null
          created_at: string | null
          display_name: string | null
          email: string
          full_name: string
          id: string
          phone: string | null
          tipo: string | null
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          avatar_url?: string | null
          created_at?: string | null
          display_name?: string | null
          email: string
          full_name: string
          id: string
          phone?: string | null
          tipo?: string | null
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          avatar_url?: string | null
          created_at?: string | null
          display_name?: string | null
          email?: string
          full_name?: string
          id?: string
          phone?: string | null
          tipo?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_roles: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"][]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role:
      | "admin"
      | "financeiro_master"
      | "gestor_master"
      | "financeiro"
      | "operacoes"
      | "piloto_chefe"
      | "tripulante"
      | "cotista"
      contact_type: "Colaboradores" | "Fornecedores" | "Hoteis" | "Cliente"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
  | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
  | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
  ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
    DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
  : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
    DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
  ? R
  : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
    DefaultSchema["Views"])
  ? (DefaultSchema["Tables"] &
    DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
      Row: infer R
    }
  ? R
  : never
  : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
  | keyof DefaultSchema["Tables"]
  | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
  ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
  : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
    Insert: infer I
  }
  ? I
  : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
    Insert: infer I
  }
  ? I
  : never
  : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
  | keyof DefaultSchema["Tables"]
  | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
  ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
  : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
    Update: infer U
  }
  ? U
  : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
    Update: infer U
  }
  ? U
  : never
  : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
  | keyof DefaultSchema["Enums"]
  | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
  ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
  : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
  ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
  : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
  | keyof DefaultSchema["CompositeTypes"]
  | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
  ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
  : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
  ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never

export const Constants = {
  public: {
    Enums: {
      app_role: [
        "admin",
        "financeiro_master",
        "gestor_master",
        "financeiro",
        "operacoes",
        "piloto_chefe",
        "tripulante",
        "cotista",
      ],
      contact_type: ["Colaboradores", "Fornecedores", "Hoteis", "Cliente"],
    },
  },
} as const
