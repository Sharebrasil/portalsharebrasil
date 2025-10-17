export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      aerodromes: {
        Row: {
          created_at: string | null
          icao_code: string
          id: string
          name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          icao_code: string
          id?: string
          name: string
          updated_at?: string | null
        }
        Update: {
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
          cell_hours_before: number | null
          cell_hours_current: number | null
          cell_hours_prev: number | null
          created_at: string | null
          fuel_consumption: number | null
          horimeter_active: number | null
          horimeter_end: number | null
          horimeter_start: number | null
          id: string
          manufacturer: string | null
          model: string
          owner_name: string | null
          registration: string
          serial_number: string | null
          status: string | null
          total_hours: number | null
          updated_at: string | null
        }
        Insert: {
          cell_hours_before?: number | null
          cell_hours_current?: number | null
          cell_hours_prev?: number | null
          created_at?: string | null
          fuel_consumption?: number | null
          horimeter_active?: number | null
          horimeter_end?: number | null
          horimeter_start?: number | null
          id?: string
          manufacturer?: string | null
          model: string
          owner_name?: string | null
          registration: string
          serial_number?: string | null
          status?: string | null
          total_hours?: number | null
          updated_at?: string | null
        }
        Update: {
          cell_hours_before?: number | null
          cell_hours_current?: number | null
          cell_hours_prev?: number | null
          created_at?: string | null
          fuel_consumption?: number | null
          horimeter_active?: number | null
          horimeter_end?: number | null
          horimeter_start?: number | null
          id?: string
          manufacturer?: string | null
          model?: string
          owner_name?: string | null
          registration?: string
          serial_number?: string | null
          status?: string | null
          total_hours?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      airlines: {
        Row: {
          active: boolean | null
          code: string
          country: string | null
          created_at: string | null
          iata_code: string | null
          icao_code: string | null
          id: string
          logo_url: string | null
          name: string
          updated_at: string | null
          website: string | null
        }
        Insert: {
          active?: boolean | null
          code: string
          country?: string | null
          created_at?: string | null
          iata_code?: string | null
          icao_code?: string | null
          id?: string
          logo_url?: string | null
          name: string
          updated_at?: string | null
          website?: string | null
        }
        Update: {
          active?: boolean | null
          code?: string
          country?: string | null
          created_at?: string | null
          iata_code?: string | null
          icao_code?: string | null
          id?: string
          logo_url?: string | null
          name?: string
          updated_at?: string | null
          website?: string | null
        }
        Relationships: []
      }
      airports: {
        Row: {
          active: boolean | null
          city: string
          country: string
          created_at: string | null
          elevation: number | null
          iata_code: string
          icao_code: string | null
          id: string
          latitude: number | null
          longitude: number | null
          name: string
          timezone: string | null
          updated_at: string | null
        }
        Insert: {
          active?: boolean | null
          city: string
          country: string
          created_at?: string | null
          elevation?: number | null
          iata_code: string
          icao_code?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          name: string
          timezone?: string | null
          updated_at?: string | null
        }
        Update: {
          active?: boolean | null
          city?: string
          country?: string
          created_at?: string | null
          elevation?: number | null
          iata_code?: string
          icao_code?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          name?: string
          timezone?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      birthdays: {
        Row: {
          category: string | null
          created_at: string | null
          data_aniversario: string
          empresa: string | null
          id: string
          nome: string
          updated_at: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          data_aniversario: string
          empresa?: string | null
          id?: string
          nome: string
          updated_at?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          data_aniversario?: string
          empresa?: string | null
          id?: string
          nome?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      clients: {
        Row: {
          address: string | null
          aircraft: string | null
          cnpj: string | null
          cnpj_card_url: string | null
          company_name: string | null
          contact_id: string | null
          created_at: string | null
          email: string | null
          financial_contact: string | null
          id: string
          inscricao_estadual: string | null
          observations: string | null
          phone: string | null
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          aircraft?: string | null
          cnpj?: string | null
          cnpj_card_url?: string | null
          company_name?: string | null
          contact_id?: string | null
          created_at?: string | null
          email?: string | null
          financial_contact?: string | null
          id?: string
          inscricao_estadual?: string | null
          observations?: string | null
          phone?: string | null
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          aircraft?: string | null
          cnpj?: string | null
          cnpj_card_url?: string | null
          company_name?: string | null
          contact_id?: string | null
          created_at?: string | null
          email?: string | null
          financial_contact?: string | null
          id?: string
          inscricao_estadual?: string | null
          observations?: string | null
          phone?: string | null
          updated_at?: string | null
        }
        Relationships: [
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
          id: string
          name: string
          name_fantasy: string | null
          cnpj: string | null
          address: string | null
          city: string | null
          state: string | null
          zip_code: string | null
          phone: string | null
          email: string | null
          logo_url: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          name: string
          name_fantasy?: string | null
          cnpj?: string | null
          address?: string | null
          city?: string | null
          state?: string | null
          zip_code?: string | null
          phone?: string | null
          email?: string | null
          logo_url?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          name?: string
          name_fantasy?: string | null
          cnpj?: string | null
          address?: string | null
          city?: string | null
          state?: string | null
          zip_code?: string | null
          phone?: string | null
          email?: string | null
          logo_url?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      contacts: {
        Row: {
          address: string | null
          category: string | null
          city: string | null
          company_name: string | null
          created_at: string | null
          email: string | null
          id: string
          name: string
          notes: string | null
          phone: string | null
          position: string | null
          type: string
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          category?: string | null
          city?: string | null
          company_name?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          name: string
          notes?: string | null
          phone?: string | null
          position?: string | null
          type: string
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          category?: string | null
          city?: string | null
          company_name?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          name?: string
          notes?: string | null
          phone?: string | null
          position?: string | null
          type?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      crew_licenses: {
        Row: {
          crew_member_id: string
          expiry_date: string
          id: string
          issue_date: string | null
          license_number: string | null
          license_type: string
        }
        Insert: {
          crew_member_id: string
          expiry_date: string
          id?: string
          issue_date?: string | null
          license_number?: string | null
          license_type: string
        }
        Update: {
          crew_member_id?: string
          expiry_date?: string
          id?: string
          issue_date?: string | null
          license_number?: string | null
          license_type?: string
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
          avatar_url: string | null
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
          avatar_url?: string | null
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
          avatar_url?: string | null
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
        Relationships: [
          {
            foreignKeyName: "crew_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
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
            foreignKeyName: "flight_schedules_aircraft_id_fkey"
            columns: ["aircraft_id"]
            isOneToOne: false
            referencedRelation: "aircraft"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "flight_schedules_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "flight_schedules_crew_member_id_fkey"
            columns: ["crew_member_id"]
            isOneToOne: false
            referencedRelation: "crew_members"
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
        Relationships: [
          {
            foreignKeyName: "flights_airline_id_fkey"
            columns: ["airline_id"]
            isOneToOne: false
            referencedRelation: "airlines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "flights_arrival_airport_id_fkey"
            columns: ["arrival_airport_id"]
            isOneToOne: false
            referencedRelation: "airports"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "flights_departure_airport_id_fkey"
            columns: ["departure_airport_id"]
            isOneToOne: false
            referencedRelation: "airports"
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
          aircraft_id: string
          arrival_airport: string
          arrival_time: string
          created_at: string | null
          daily_rate: number | null
          departure_airport: string
          departure_time: string
          entry_date: string
          extras: string | null
          flight_time_hours: number
          flight_time_minutes: number
          flight_type: string | null
          fuel_added: number | null
          fuel_cell: number | null
          fuel_liters: number | null
          id: string
          ifr_count: number | null
          isc: string | null
          landings: number | null
          night_time_hours: number | null
          night_time_minutes: number | null
          pc: number | null
          remarks: string | null
          total_time: number
          updated_at: string | null
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          aircraft_id: string
          arrival_airport: string
          arrival_time: string
          created_at?: string | null
          daily_rate?: number | null
          departure_airport: string
          departure_time: string
          entry_date: string
          extras?: string | null
          flight_time_hours: number
          flight_time_minutes: number
          flight_type?: string | null
          fuel_added?: number | null
          fuel_cell?: number | null
          fuel_liters?: number | null
          id?: string
          ifr_count?: number | null
          isc?: string | null
          landings?: number | null
          night_time_hours?: number | null
          night_time_minutes?: number | null
          pc?: number | null
          remarks?: string | null
          total_time: number
          updated_at?: string | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          aircraft_id?: string
          arrival_airport?: string
          arrival_time?: string
          created_at?: string | null
          daily_rate?: number | null
          departure_airport?: string
          departure_time?: string
          entry_date?: string
          extras?: string | null
          flight_time_hours?: number
          flight_time_minutes?: number
          flight_type?: string | null
          fuel_added?: number | null
          fuel_cell?: number | null
          fuel_liters?: number | null
          id?: string
          ifr_count?: number | null
          isc?: string | null
          landings?: number | null
          night_time_hours?: number | null
          night_time_minutes?: number | null
          pc?: number | null
          remarks?: string | null
          total_time?: number
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
          {
            foreignKeyName: "logbook_entries_verified_by_fkey"
            columns: ["verified_by"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
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
          target_roles: string[] | null
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
          target_roles?: string[] | null
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
          target_roles?: string[] | null
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
        Relationships: [
          {
            foreignKeyName: "tasks_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_requested_by_fkey"
            columns: ["requested_by"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
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
          {
            foreignKeyName: "task_notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
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
          status: string | null
          total_amount: number | null
          tripulante: string | null
          type: string
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
          status?: string | null
          total_amount?: number | null
          tripulante?: string | null
          type: string
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
          status?: string | null
          total_amount?: number | null
          tripulante?: string | null
          type?: string
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
          role: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: string
          user_id?: string
        }
        Relationships: []
      }
      manutencoes: {
        Row: {
          id: string
          tipo: string
          aeronave_id: string | null
          data_programada: string
          mecanico: string
          etapa: string
          oficina: string | null
          observacoes: string | null
          custo_estimado: number | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          tipo: string
          aeronave_id?: string | null
          data_programada: string
          mecanico: string
          etapa?: string
          oficina?: string | null
          observacoes?: string | null
          custo_estimado?: number | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          tipo?: string
          aeronave_id?: string | null
          data_programada?: string
          mecanico?: string
          etapa?: string
          oficina?: string | null
          observacoes?: string | null
          custo_estimado?: number | null
          created_at?: string | null
          updated_at?: string | null
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
        Returns: string[]
      }
      has_role: {
        Args: {
          _role: string
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "tripulante" | "piloto_chefe" | "admin" | "financeiro_master" | "financeiro" | "operacoes"
      contact_type: "Colaboradores" | "Fornecedores" | "Hoteis" | "Clientes"
      travel_report_status: "draft" | "submitted" | "approved" | "rejected"
      travel_type: "company" | "personal"
      user_role: "admin" | "manager" | "member"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Database

type DefaultSchema = Database["public"]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
      DefaultSchema["Views"])
  ? (DefaultSchema["Tables"] &
      DefaultSchema["Views"])[PublicTableNameOrOptions] extends {
      Row: infer R
    }
    ? R
    : never
  : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][PublicTableNameOrOptions] extends {
      Insert: infer I
    }
    ? I
    : never
  : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][PublicTableNameOrOptions] extends {
      Update: infer U
    }
    ? U
    : never
  : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof DefaultSchema["Enums"]
  ? DefaultSchema["Enums"][PublicEnumNameOrOptions]
  : never
