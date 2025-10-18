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
      abastecimentos: {
        Row: {
          abastecedor: string
          abastecimento_galoes: number | null
          aircraft_id: string | null
          ano: string | null
          client_id: string | null
          comanda: string
          created_at: string | null
          data: string
          id: string
          litros: number
          local: string | null
          nota_fiscal: string | null
          observacoes: string | null
          trecho: string | null
          updated_at: string | null
          valor_total: number
          valor_unitario: number
          vencimento: string | null
        }
        Insert: {
          abastecedor: string
          abastecimento_galoes?: number | null
          aircraft_id?: string | null
          ano?: string | null
          client_id?: string | null
          comanda: string
          created_at?: string | null
          data: string
          id?: string
          litros: number
          local?: string | null
          nota_fiscal?: string | null
          observacoes?: string | null
          trecho?: string | null
          updated_at?: string | null
          valor_total: number
          valor_unitario: number
          vencimento?: string | null
        }
        Update: {
          abastecedor?: string
          abastecimento_galoes?: number | null
          aircraft_id?: string | null
          ano?: string | null
          client_id?: string | null
          comanda?: string
          created_at?: string | null
          data?: string
          id?: string
          litros?: number
          local?: string | null
          nota_fiscal?: string | null
          observacoes?: string | null
          trecho?: string | null
          updated_at?: string | null
          valor_total?: number
          valor_unitario?: number
          vencimento?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "abastecimentos_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
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
          created_at: string | null
          fuel_consumption: string
          id: string
          manufacturer: string
          model: string
          owner_name: string
          registration: string
          serial_number: string
          status: string | null
          updated_at: string | null
          year: string | null
        }
        Insert: {
          base?: string | null
          created_at?: string | null
          fuel_consumption: string
          id?: string
          manufacturer: string
          model: string
          owner_name: string
          registration: string
          serial_number: string
          status?: string | null
          updated_at?: string | null
          year?: string | null
        }
        Update: {
          base?: string | null
          created_at?: string | null
          fuel_consumption?: string
          id?: string
          manufacturer?: string
          model?: string
          owner_name?: string
          registration?: string
          serial_number?: string
          status?: string | null
          updated_at?: string | null
          year?: string | null
        }
        Relationships: []
      }
      aircraft_hourly_rates: {
        Row: {
          aircraft_id: string
          created_at: string | null
          hourly_rate: number
          id: string
          status: string | null
          updated_at: string | null
        }
        Insert: {
          aircraft_id: string
          created_at?: string | null
          hourly_rate?: number
          id?: string
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          aircraft_id?: string
          created_at?: string | null
          hourly_rate?: number
          id?: string
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "aircraft_hourly_rates_aircraft_id_fkey"
            columns: ["aircraft_id"]
            isOneToOne: true
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
      client_reconciliations: {
        Row: {
          aircraft_registration: string | null
          amount: number
          category: string | null
          client_id: string | null
          created_at: string | null
          description: string
          id: string
          paid_date: string | null
          sent_date: string | null
          status: string
          travel_report_id: string | null
          updated_at: string | null
        }
        Insert: {
          aircraft_registration?: string | null
          amount?: number
          category?: string | null
          client_id?: string | null
          created_at?: string | null
          description: string
          id?: string
          paid_date?: string | null
          sent_date?: string | null
          status?: string
          travel_report_id?: string | null
          updated_at?: string | null
        }
        Update: {
          aircraft_registration?: string | null
          amount?: number
          category?: string | null
          client_id?: string | null
          created_at?: string | null
          description?: string
          id?: string
          paid_date?: string | null
          sent_date?: string | null
          status?: string
          travel_report_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "client_reconciliations_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_reconciliations_travel_report_id_fkey"
            columns: ["travel_report_id"]
            isOneToOne: false
            referencedRelation: "travel_reports"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          address: string | null
          aircraft_id: string | null
          city: string | null
          cnpj: string | null
          cnpj_card_url: string | null
          company_name: string | null
          contact_id: string | null
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
          contact_id?: string | null
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
          contact_id?: string | null
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
          {
            foreignKeyName: "clients_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      company_settings: {
        Row: {
          address: string | null
          city: string | null
          cnpj: string | null
          created_at: string | null
          email: string | null
          id: string
          logo_url: string | null
          name: string
          name_fantasy: string | null
          phone: string | null
          state: string | null
          updated_at: string | null
          zip_code: string | null
        }
        Insert: {
          address?: string | null
          city?: string | null
          cnpj?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          logo_url?: string | null
          name: string
          name_fantasy?: string | null
          phone?: string | null
          state?: string | null
          updated_at?: string | null
          zip_code?: string | null
        }
        Update: {
          address?: string | null
          city?: string | null
          cnpj?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          logo_url?: string | null
          name?: string
          name_fantasy?: string | null
          phone?: string | null
          state?: string | null
          updated_at?: string | null
          zip_code?: string | null
        }
        Relationships: []
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
          total_hours: number
          total_ifr_hours: number | null
          total_pic_hours: number
          total_sic_hours: number
          updated_at: string | null
        }
        Insert: {
          aircraft_id: string
          created_at?: string | null
          crew_member_id: string
          id?: string
          total_hours?: number
          total_ifr_hours?: number | null
          total_pic_hours?: number
          total_sic_hours?: number
          updated_at?: string | null
        }
        Update: {
          aircraft_id?: string
          created_at?: string | null
          crew_member_id?: string
          id?: string
          total_hours?: number
          total_ifr_hours?: number | null
          total_pic_hours?: number
          total_sic_hours?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "crew_flight_hours_aircraft_id_fkey"
            columns: ["aircraft_id"]
            isOneToOne: false
            referencedRelation: "aircraft"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crew_flight_hours_crew_member_id_fkey"
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
      crew_reconciliations: {
        Row: {
          aircraft_registration: string | null
          amount: number
          category: string | null
          client_id: string | null
          created_at: string | null
          crew_member_name: string
          description: string
          id: string
          paid_date: string | null
          status: string
          travel_report_id: string | null
          updated_at: string | null
        }
        Insert: {
          aircraft_registration?: string | null
          amount?: number
          category?: string | null
          client_id?: string | null
          created_at?: string | null
          crew_member_name: string
          description: string
          id?: string
          paid_date?: string | null
          status?: string
          travel_report_id?: string | null
          updated_at?: string | null
        }
        Update: {
          aircraft_registration?: string | null
          amount?: number
          category?: string | null
          client_id?: string | null
          created_at?: string | null
          crew_member_name?: string
          description?: string
          id?: string
          paid_date?: string | null
          status?: string
          travel_report_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "crew_reconciliations_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crew_reconciliations_travel_report_id_fkey"
            columns: ["travel_report_id"]
            isOneToOne: false
            referencedRelation: "travel_reports"
            referencedColumns: ["id"]
          },
        ]
      }
      documentos: {
        Row: {
          aircraft_id: string | null
          created_at: string | null
          document_url: string | null
          id: string
          name: string
          status: string | null
          updated_at: string | null
          valid_until: string
        }
        Insert: {
          aircraft_id?: string | null
          created_at?: string | null
          document_url?: string | null
          id?: string
          name: string
          status?: string | null
          updated_at?: string | null
          valid_until: string
        }
        Update: {
          aircraft_id?: string | null
          created_at?: string | null
          document_url?: string | null
          id?: string
          name?: string
          status?: string | null
          updated_at?: string | null
          valid_until?: string
        }
        Relationships: [
          {
            foreignKeyName: "documentos_aircraft_id_fkey"
            columns: ["aircraft_id"]
            isOneToOne: false
            referencedRelation: "aircraft"
            referencedColumns: ["id"]
          },
        ]
      }
      expense_attachments: {
        Row: {
          created_at: string | null
          expense_id: string | null
          file_name: string | null
          file_size: number | null
          file_type: string | null
          file_url: string
          id: string
        }
        Insert: {
          created_at?: string | null
          expense_id?: string | null
          file_name?: string | null
          file_size?: number | null
          file_type?: string | null
          file_url: string
          id?: string
        }
        Update: {
          created_at?: string | null
          expense_id?: string | null
          file_name?: string | null
          file_size?: number | null
          file_type?: string | null
          file_url?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "expense_attachments_expense_id_fkey"
            columns: ["expense_id"]
            isOneToOne: false
            referencedRelation: "expenses"
            referencedColumns: ["id"]
          },
        ]
      }
      expenses: {
        Row: {
          amount: number
          created_at: string | null
          description: string
          id: string
          travel_report_id: string | null
          type: string
        }
        Insert: {
          amount: number
          created_at?: string | null
          description: string
          id?: string
          travel_report_id?: string | null
          type: string
        }
        Update: {
          amount?: number
          created_at?: string | null
          description?: string
          id?: string
          travel_report_id?: string | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "expenses_travel_report_id_fkey"
            columns: ["travel_report_id"]
            isOneToOne: false
            referencedRelation: "travel_reports"
            referencedColumns: ["id"]
          },
        ]
      }
      favorite_payers: {
        Row: {
          address: string | null
          city: string | null
          created_at: string | null
          document: string
          id: string
          name: string
          uf: string | null
          user_id: string
        }
        Insert: {
          address?: string | null
          city?: string | null
          created_at?: string | null
          document: string
          id?: string
          name: string
          uf?: string | null
          user_id: string
        }
        Update: {
          address?: string | null
          city?: string | null
          created_at?: string | null
          document?: string
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
          completed: boolean | null
          created_at: string | null
          flight_plan_id: string | null
          id: string
          items: Json
          updated_at: string | null
        }
        Insert: {
          checklist_type: string
          completed?: boolean | null
          created_at?: string | null
          flight_plan_id?: string | null
          id?: string
          items?: Json
          updated_at?: string | null
        }
        Update: {
          checklist_type?: string
          completed?: boolean | null
          created_at?: string | null
          flight_plan_id?: string | null
          id?: string
          items?: Json
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
          caption: string | null
          category: string
          created_at: string | null
          file_size: number | null
          file_type: string | null
          file_url: string | null
          id: string
          name: string
          parent_folder_id: string | null
          type: string
          updated_at: string | null
          uploaded_by: string | null
        }
        Insert: {
          caption?: string | null
          category: string
          created_at?: string | null
          file_size?: number | null
          file_type?: string | null
          file_url?: string | null
          id?: string
          name: string
          parent_folder_id?: string | null
          type: string
          updated_at?: string | null
          uploaded_by?: string | null
        }
        Update: {
          caption?: string | null
          category?: string
          created_at?: string | null
          file_size?: number | null
          file_type?: string | null
          file_url?: string | null
          id?: string
          name?: string
          parent_folder_id?: string | null
          type?: string
          updated_at?: string | null
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "flight_documents_parent_folder_id_fkey"
            columns: ["parent_folder_id"]
            isOneToOne: false
            referencedRelation: "flight_documents"
            referencedColumns: ["id"]
          },
        ]
      }
      flight_notifications: {
        Row: {
          channels: Json | null
          created_at: string | null
          enabled: boolean | null
          flight_id: string | null
          id: string
          message: string | null
          read_at: string | null
          scheduled_time: string
          sent_at: string | null
          title: string
          type: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          channels?: Json | null
          created_at?: string | null
          enabled?: boolean | null
          flight_id?: string | null
          id?: string
          message?: string | null
          read_at?: string | null
          scheduled_time: string
          sent_at?: string | null
          title: string
          type: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          channels?: Json | null
          created_at?: string | null
          enabled?: boolean | null
          flight_id?: string | null
          id?: string
          message?: string | null
          read_at?: string | null
          scheduled_time?: string
          sent_at?: string | null
          title?: string
          type?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "flight_notifications_flight_id_fkey"
            columns: ["flight_id"]
            isOneToOne: false
            referencedRelation: "flights"
            referencedColumns: ["id"]
          },
        ]
      }
      flight_payments: {
        Row: {
          calculated_amount: number
          created_at: string | null
          crew_member_id: string
          final_amount: number
          id: string
          month: number
          observations: string | null
          paid_at: string | null
          total_hours: number
          updated_at: string | null
          year: number
        }
        Insert: {
          calculated_amount?: number
          created_at?: string | null
          crew_member_id: string
          final_amount?: number
          id?: string
          month: number
          observations?: string | null
          paid_at?: string | null
          total_hours?: number
          updated_at?: string | null
          year: number
        }
        Update: {
          calculated_amount?: number
          created_at?: string | null
          crew_member_id?: string
          final_amount?: number
          id?: string
          month?: number
          observations?: string | null
          paid_at?: string | null
          total_hours?: number
          updated_at?: string | null
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "flight_payments_crew_member_id_fkey"
            columns: ["crew_member_id"]
            isOneToOne: false
            referencedRelation: "crew_members"
            referencedColumns: ["id"]
          },
        ]
      }
      flight_plans: {
        Row: {
          aircraft_color: string | null
          aircraft_count: number | null
          aircraft_registration: string
          aircraft_type: string | null
          alternate_airport: string | null
          created_at: string | null
          cruise_speed: string | null
          departure_airport: string
          departure_time: string | null
          destination_airport: string
          dinghies_capacity: number | null
          dinghies_count: number | null
          distance_km: number | null
          emergency_radio: string | null
          equipment: string | null
          estimated_arrival: string | null
          estimated_flight_time: string | null
          flight_level: string | null
          flight_rule: string | null
          flight_schedule_id: string | null
          flight_type: string | null
          fuel_endurance: string | null
          id: string
          jackets: string | null
          landing_weight: number | null
          payload_weight: number | null
          people_on_board: number | null
          pilot_name: string | null
          remarks: string | null
          required_fuel: number | null
          route: string | null
          second_alternate_airport: string | null
          survival_equipment: string | null
          takeoff_weight: number | null
          total_time: string | null
          updated_at: string | null
          wake_category: string | null
          zero_fuel_weight: number | null
        }
        Insert: {
          aircraft_color?: string | null
          aircraft_count?: number | null
          aircraft_registration: string
          aircraft_type?: string | null
          alternate_airport?: string | null
          created_at?: string | null
          cruise_speed?: string | null
          departure_airport: string
          departure_time?: string | null
          destination_airport: string
          dinghies_capacity?: number | null
          dinghies_count?: number | null
          distance_km?: number | null
          emergency_radio?: string | null
          equipment?: string | null
          estimated_arrival?: string | null
          estimated_flight_time?: string | null
          flight_level?: string | null
          flight_rule?: string | null
          flight_schedule_id?: string | null
          flight_type?: string | null
          fuel_endurance?: string | null
          id?: string
          jackets?: string | null
          landing_weight?: number | null
          payload_weight?: number | null
          people_on_board?: number | null
          pilot_name?: string | null
          remarks?: string | null
          required_fuel?: number | null
          route?: string | null
          second_alternate_airport?: string | null
          survival_equipment?: string | null
          takeoff_weight?: number | null
          total_time?: string | null
          updated_at?: string | null
          wake_category?: string | null
          zero_fuel_weight?: number | null
        }
        Update: {
          aircraft_color?: string | null
          aircraft_count?: number | null
          aircraft_registration?: string
          aircraft_type?: string | null
          alternate_airport?: string | null
          created_at?: string | null
          cruise_speed?: string | null
          departure_airport?: string
          departure_time?: string | null
          destination_airport?: string
          dinghies_capacity?: number | null
          dinghies_count?: number | null
          distance_km?: number | null
          emergency_radio?: string | null
          equipment?: string | null
          estimated_arrival?: string | null
          estimated_flight_time?: string | null
          flight_level?: string | null
          flight_rule?: string | null
          flight_schedule_id?: string | null
          flight_type?: string | null
          fuel_endurance?: string | null
          id?: string
          jackets?: string | null
          landing_weight?: number | null
          payload_weight?: number | null
          people_on_board?: number | null
          pilot_name?: string | null
          remarks?: string | null
          required_fuel?: number | null
          route?: string | null
          second_alternate_airport?: string | null
          survival_equipment?: string | null
          takeoff_weight?: number | null
          total_time?: string | null
          updated_at?: string | null
          wake_category?: string | null
          zero_fuel_weight?: number | null
        }
        Relationships: [
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
            foreignKeyName: "flight_schedules_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      flights: {
        Row: {
          aircraft: string | null
          airline_id: string | null
          arrival_airport_id: string | null
          arrival_city: string | null
          arrival_code: string
          arrival_gate: string | null
          arrival_terminal: string | null
          arrival_time: string
          baggage_allowance: Json | null
          boarding_group: string | null
          booking_reference: string | null
          checked_in: boolean | null
          confirmation_code: string | null
          created_at: string | null
          departure_airport_id: string | null
          departure_city: string | null
          departure_code: string
          departure_gate: string | null
          departure_terminal: string | null
          departure_time: string
          duration: string | null
          fare_class: string | null
          flight_number: string
          id: string
          meal_preference: string | null
          qr_code: string | null
          seat: string | null
          seat_preference: string | null
          status: string | null
          ticket_number: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          aircraft?: string | null
          airline_id?: string | null
          arrival_airport_id?: string | null
          arrival_city?: string | null
          arrival_code: string
          arrival_gate?: string | null
          arrival_terminal?: string | null
          arrival_time: string
          baggage_allowance?: Json | null
          boarding_group?: string | null
          booking_reference?: string | null
          checked_in?: boolean | null
          confirmation_code?: string | null
          created_at?: string | null
          departure_airport_id?: string | null
          departure_city?: string | null
          departure_code: string
          departure_gate?: string | null
          departure_terminal?: string | null
          departure_time: string
          duration?: string | null
          fare_class?: string | null
          flight_number: string
          id?: string
          meal_preference?: string | null
          qr_code?: string | null
          seat?: string | null
          seat_preference?: string | null
          status?: string | null
          ticket_number?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          aircraft?: string | null
          airline_id?: string | null
          arrival_airport_id?: string | null
          arrival_city?: string | null
          arrival_code?: string
          arrival_gate?: string | null
          arrival_terminal?: string | null
          arrival_time?: string
          baggage_allowance?: Json | null
          boarding_group?: string | null
          booking_reference?: string | null
          checked_in?: boolean | null
          confirmation_code?: string | null
          created_at?: string | null
          departure_airport_id?: string | null
          departure_city?: string | null
          departure_code?: string
          departure_gate?: string | null
          departure_terminal?: string | null
          departure_time?: string
          duration?: string | null
          fare_class?: string | null
          flight_number?: string
          id?: string
          meal_preference?: string | null
          qr_code?: string | null
          seat?: string | null
          seat_preference?: string | null
          status?: string | null
          ticket_number?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      fuel_suppliers: {
        Row: {
          avgas_price: number | null
          city_name: string
          contact_person: string | null
          created_at: string | null
          icao_code: string
          id: string
          jet_price: number | null
          phone: string | null
          supplier_name: string
          updated_at: string | null
        }
        Insert: {
          avgas_price?: number | null
          city_name: string
          contact_person?: string | null
          created_at?: string | null
          icao_code: string
          id?: string
          jet_price?: number | null
          phone?: string | null
          supplier_name: string
          updated_at?: string | null
        }
        Update: {
          avgas_price?: number | null
          city_name?: string
          contact_person?: string | null
          created_at?: string | null
          icao_code?: string
          id?: string
          jet_price?: number | null
          phone?: string | null
          supplier_name?: string
          updated_at?: string | null
        }
        Relationships: []
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
        }
        Relationships: []
      }
      logbook_entries: {
        Row: {
          aircraft_commander: string | null
          aircraft_id: string
          arrival_airport: string
          arrival_time: string | null
          cell_after: number | null
          cell_before: number | null
          cell_disp: number | null
          confirmed: boolean | null
          created_at: string | null
          daily_rate: number | null
          day_time: number | null
          departure_airport: string
          departure_time: string | null
          entry_date: string
          extras: string | null
          flight_number: string | null
          flight_time_hours: number | null
          flight_time_minutes: number | null
          flight_type_code: string | null
          fuel_added: number | null
          fuel_liters: number | null
          id: string
          ifr_count: number | null
          landings: number | null
          logbook_month_id: string
          night_hours: number | null
          pic_canac: string | null
          sic_canac: string | null
          total_time: number | null
        }
        Insert: {
          aircraft_commander?: string | null
          aircraft_id: string
          arrival_airport: string
          arrival_time?: string | null
          cell_after?: number | null
          cell_before?: number | null
          cell_disp?: number | null
          confirmed?: boolean | null
          created_at?: string | null
          daily_rate?: number | null
          day_time?: number | null
          departure_airport: string
          departure_time?: string | null
          entry_date: string
          extras?: string | null
          flight_number?: string | null
          flight_time_hours?: number | null
          flight_time_minutes?: number | null
          flight_type_code?: string | null
          fuel_added?: number | null
          fuel_liters?: number | null
          id?: string
          ifr_count?: number | null
          landings?: number | null
          logbook_month_id: string
          night_hours?: number | null
          pic_canac?: string | null
          sic_canac?: string | null
          total_time?: number | null
        }
        Update: {
          aircraft_commander?: string | null
          aircraft_id?: string
          arrival_airport?: string
          arrival_time?: string | null
          cell_after?: number | null
          cell_before?: number | null
          cell_disp?: number | null
          confirmed?: boolean | null
          created_at?: string | null
          daily_rate?: number | null
          day_time?: number | null
          departure_airport?: string
          departure_time?: string | null
          entry_date?: string
          extras?: string | null
          flight_number?: string | null
          flight_time_hours?: number | null
          flight_time_minutes?: number | null
          flight_type_code?: string | null
          fuel_added?: number | null
          fuel_liters?: number | null
          id?: string
          ifr_count?: number | null
          landings?: number | null
          logbook_month_id?: string
          night_hours?: number | null
          pic_canac?: string | null
          sic_canac?: string | null
          total_time?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "logbook_entries_aircraft_id_fkey"
            columns: ["aircraft_id"]
            isOneToOne: false
            referencedRelation: "aircraft"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "logbook_entries_flight_number_fkey"
            columns: ["flight_number"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "logbook_entries_logbook_month_id_fkey"
            columns: ["logbook_month_id"]
            isOneToOne: false
            referencedRelation: "logbook_months"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "logbook_entries_pic_canac_fkey"
            columns: ["pic_canac"]
            isOneToOne: false
            referencedRelation: "crew_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "logbook_entries_sic_canac_fkey"
            columns: ["sic_canac"]
            isOneToOne: false
            referencedRelation: "crew_members"
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
        Relationships: []
      }
      message_reads: {
        Row: {
          id: string
          message_id: string
          read_at: string | null
          user_id: string
        }
        Insert: {
          id?: string
          message_id: string
          read_at?: string | null
          user_id: string
        }
        Update: {
          id?: string
          message_id?: string
          read_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "message_reads_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          author_id: string
          author_name: string
          author_role: string | null
          content: string
          created_at: string | null
          id: string
          is_pinned: boolean | null
          target_roles: Database["public"]["Enums"]["app_role"][] | null
          target_type: string
          target_user_id: string | null
          updated_at: string | null
        }
        Insert: {
          author_id: string
          author_name: string
          author_role?: string | null
          content: string
          created_at?: string | null
          id?: string
          is_pinned?: boolean | null
          target_roles?: Database["public"]["Enums"]["app_role"][] | null
          target_type: string
          target_user_id?: string | null
          updated_at?: string | null
        }
        Update: {
          author_id?: string
          author_name?: string
          author_role?: string | null
          content?: string
          created_at?: string | null
          id?: string
          is_pinned?: boolean | null
          target_roles?: Database["public"]["Enums"]["app_role"][] | null
          target_type?: string
          target_user_id?: string | null
          updated_at?: string | null
        }
        Relationships: []
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
      pagamentos: {
        Row: {
          amount: number
          category: string
          clients_id: string | null
          created_at: string | null
          description: string
          due_date: string
          id: string
          invoice_number: string | null
          receipt_url: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          amount: number
          category: string
          clients_id?: string | null
          created_at?: string | null
          description: string
          due_date: string
          id?: string
          invoice_number?: string | null
          receipt_url?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          amount?: number
          category?: string
          clients_id?: string | null
          created_at?: string | null
          description?: string
          due_date?: string
          id?: string
          invoice_number?: string | null
          receipt_url?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pagamentos_clients_id_fkey"
            columns: ["clients_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      payslips: {
        Row: {
          caption: string | null
          created_at: string | null
          file_name: string
          file_url: string
          id: string
          month: number
          updated_at: string | null
          uploaded_by: string
          user_id: string
          year: number
        }
        Insert: {
          caption?: string | null
          created_at?: string | null
          file_name: string
          file_url: string
          id?: string
          month: number
          updated_at?: string | null
          uploaded_by: string
          user_id: string
          year: number
        }
        Update: {
          caption?: string | null
          created_at?: string | null
          file_name?: string
          file_url?: string
          id?: string
          month?: number
          updated_at?: string | null
          uploaded_by?: string
          user_id?: string
          year?: number
        }
        Relationships: []
      }
      receipt_sequence: {
        Row: {
          id: string
          last_number: number
          user_id: string
          year: number
        }
        Insert: {
          id?: string
          last_number?: number
          user_id: string
          year: number
        }
        Update: {
          id?: string
          last_number?: number
          user_id?: string
          year?: number
        }
        Relationships: []
      }
      receipts: {
        Row: {
          amount: number
          amount_text: string
          created_at: string | null
          id: string
          issue_date: string
          number_doc: string | null
          observacoes: string | null
          payer_address: string | null
          payer_city: string | null
          payer_document: string
          payer_name: string
          payer_uf: string | null
          payoff_number: string | null
          receipt_number: string
          recibo_pdf_url: string | null
          service_description: string
          user_id: string
        }
        Insert: {
          amount: number
          amount_text: string
          created_at?: string | null
          id?: string
          issue_date: string
          number_doc?: string | null
          observacoes?: string | null
          payer_address?: string | null
          payer_city?: string | null
          payer_document: string
          payer_name: string
          payer_uf?: string | null
          payoff_number?: string | null
          receipt_number: string
          recibo_pdf_url?: string | null
          service_description: string
          user_id: string
        }
        Update: {
          amount?: number
          amount_text?: string
          created_at?: string | null
          id?: string
          issue_date?: string
          number_doc?: string | null
          observacoes?: string | null
          payer_address?: string | null
          payer_city?: string | null
          payer_document?: string
          payer_name?: string
          payer_uf?: string | null
          payoff_number?: string | null
          receipt_number?: string
          recibo_pdf_url?: string | null
          service_description?: string
          user_id?: string
        }
        Relationships: []
      }
      report_sequences: {
        Row: {
          client_id: string | null
          created_at: string | null
          id: string
          last_number: number
          updated_at: string | null
          year: number
        }
        Insert: {
          client_id?: string | null
          created_at?: string | null
          id?: string
          last_number?: number
          updated_at?: string | null
          year: number
        }
        Update: {
          client_id?: string | null
          created_at?: string | null
          id?: string
          last_number?: number
          updated_at?: string | null
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "report_sequences_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: true
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      salaries: {
        Row: {
          benefits: string | null
          created_at: string | null
          department: string | null
          gross_salary: number
          id: string
          net_salary: number
          position: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          benefits?: string | null
          created_at?: string | null
          department?: string | null
          gross_salary?: number
          id?: string
          net_salary?: number
          position?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          benefits?: string | null
          created_at?: string | null
          department?: string | null
          gross_salary?: number
          id?: string
          net_salary?: number
          position?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      task_notifications: {
        Row: {
          created_at: string | null
          id: string
          message: string
          read: boolean | null
          task_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          message: string
          read?: boolean | null
          task_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          message?: string
          read?: boolean | null
          task_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_notifications_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          assigned_to: string | null
          created_at: string | null
          description: string | null
          due_date: string | null
          id: string
          priority: string
          requested_by: string | null
          status: string
          title: string
          updated_at: string | null
        }
        Insert: {
          assigned_to?: string | null
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          priority?: string
          requested_by?: string | null
          status?: string
          title: string
          updated_at?: string | null
        }
        Update: {
          assigned_to?: string | null
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          priority?: string
          requested_by?: string | null
          status?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      travel_expenses: {
        Row: {
          amount: number
          category: string
          created_at: string | null
          description: string
          id: string
          paid_by: string
          receipt_url: string | null
          travel_report_id: string | null
          updated_at: string | null
        }
        Insert: {
          amount: number
          category: string
          created_at?: string | null
          description: string
          id?: string
          paid_by: string
          receipt_url?: string | null
          travel_report_id?: string | null
          updated_at?: string | null
        }
        Update: {
          amount?: number
          category?: string
          created_at?: string | null
          description?: string
          id?: string
          paid_by?: string
          receipt_url?: string | null
          travel_report_id?: string | null
          updated_at?: string | null
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
          aeronave: string | null
          cotista: string | null
          created_at: string | null
          description: string | null
          destination: string
          end_date: string | null
          expense_count: number | null
          has_receipts: boolean | null
          id: string
          numero_relatorio: string | null
          start_date: string
          status: Database["public"]["Enums"]["travel_report_status"] | null
          total_amount: number | null
          tripulante: string | null
          type: Database["public"]["Enums"]["travel_type"]
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          aeronave?: string | null
          cotista?: string | null
          created_at?: string | null
          description?: string | null
          destination: string
          end_date?: string | null
          expense_count?: number | null
          has_receipts?: boolean | null
          id?: string
          numero_relatorio?: string | null
          start_date: string
          status?: Database["public"]["Enums"]["travel_report_status"] | null
          total_amount?: number | null
          tripulante?: string | null
          type?: Database["public"]["Enums"]["travel_type"]
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          aeronave?: string | null
          cotista?: string | null
          created_at?: string | null
          description?: string | null
          destination?: string
          end_date?: string | null
          expense_count?: number | null
          has_receipts?: boolean | null
          id?: string
          numero_relatorio?: string | null
          start_date?: string
          status?: Database["public"]["Enums"]["travel_report_status"] | null
          total_amount?: number | null
          tripulante?: string | null
          type?: Database["public"]["Enums"]["travel_type"]
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "travel_reports_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
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
          phone: number | null
          role: Database["public"]["Enums"]["app_role"] | null
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
          phone?: number | null
          role?: Database["public"]["Enums"]["app_role"] | null
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
          phone?: number | null
          role?: Database["public"]["Enums"]["app_role"] | null
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
      voos: {
        Row: {
          aeronave_id: string | null
          created_at: string | null
          date: string
          destination: string
          hours: number
          id: string
        }
        Insert: {
          aeronave_id?: string | null
          created_at?: string | null
          date: string
          destination: string
          hours: number
          id?: string
        }
        Update: {
          aeronave_id?: string | null
          created_at?: string | null
          date?: string
          destination?: string
          hours?: number
          id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_license_status: {
        Args: { expiry_date: string }
        Returns: string
      }
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
      aircraft_status: "ativo" | "inativo" | "manutenção"
      app_role:
      | "admin"
      | "tripulante"
      | "financeiro"
      | "financeiro_master"
      | "piloto_chefe"
      | "operacoes"
      | "cotista"
      | "gestor_master"
      contact_type: "Colaboradores" | "Fornecedores" | "Hoteis" | "Cotista"
      travel_report_status: "draft" | "submitted" | "approved" | "rejected"
      travel_type: "company" | "personal"
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
      aircraft_status: ["ativo", "inativo", "manutenção"],
      app_role: [
        "admin",
        "tripulante",
        "financeiro",
        "financeiro_master",
        "piloto_chefe",
        "operacoes",
        "cotista",
        "gestor_master",
      ],
      contact_type: ["Colaboradores", "Fornecedores", "Hoteis", "Cotista"],
      travel_report_status: ["draft", "submitted", "approved", "rejected"],
      travel_type: ["company", "personal"],
    },
  },
} as const
