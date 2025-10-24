-- ============================================
-- Share Brasil - Complete Database Schema
-- ============================================

-- Create custom types/enums
CREATE TYPE public.app_role AS ENUM (
  'gestor_master',
  'admin',
  'financeiro_master',
  'tripulante',
  'piloto_chefe'
);

-- ============================================
-- Table: user_profiles
-- ============================================
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  full_name text NOT NULL,
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  display_name text,
  phone numeric,
  address text,
  avatar_url text,
  role public.app_role,
  tipo text,
  admission_date date,
  salary numeric(10, 2),
  benefits text,
  cpf text UNIQUE,
  rg text,
  birth_date date,
  bank_data jsonb DEFAULT '{}'::jsonb,
  employment_status text DEFAULT 'ativo'::text,
  is_authenticated_user boolean DEFAULT true,
  CONSTRAINT user_profiles_pkey PRIMARY KEY (id),
  CONSTRAINT user_profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users (id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON public.user_profiles USING btree (id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON public.user_profiles USING btree (email);

-- ============================================
-- Table: user_roles
-- ============================================
CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  role public.app_role NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT user_roles_pkey PRIMARY KEY (id),
  CONSTRAINT user_roles_user_id_role_key UNIQUE (user_id, role),
  CONSTRAINT user_roles_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users (id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles USING btree (user_id);

-- ============================================
-- Table: aircraft
-- ============================================
CREATE TABLE IF NOT EXISTS public.aircraft (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  registration text NOT NULL UNIQUE,
  manufacturer text NOT NULL,
  model text NOT NULL,
  serial_number text NOT NULL,
  owner_name text NOT NULL,
  fuel_consumption text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  status text DEFAULT 'Ativa',
  year text,
  base text,
  CONSTRAINT aircraft_pkey PRIMARY KEY (id)
);

CREATE INDEX IF NOT EXISTS idx_aircraft_registration ON public.aircraft USING btree (registration);
CREATE INDEX IF NOT EXISTS idx_aircraft_status ON public.aircraft USING btree (status);

-- ============================================
-- Table: aerodromes
-- ============================================
CREATE TABLE IF NOT EXISTS public.aerodromes (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  icao_code text NOT NULL UNIQUE,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  coordenadas text,
  CONSTRAINT aerodromes_pkey PRIMARY KEY (id)
);

CREATE INDEX IF NOT EXISTS idx_aerodromes_icao_code ON public.aerodromes USING btree (icao_code);

-- ============================================
-- Table: hoteis
-- ============================================
CREATE TABLE IF NOT EXISTS public.hoteis (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  telefone text,
  cidade text,
  preco_single numeric(10, 2),
  preco_duplo numeric(10, 2),
  endereco text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  CONSTRAINT hoteis_pkey PRIMARY KEY (id)
);

-- ============================================
-- Table: crew_members
-- ============================================
CREATE TABLE IF NOT EXISTS public.crew_members (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  full_name text NOT NULL,
  email text NOT NULL UNIQUE,
  phone text,
  pilot_license text,
  license_expiry date,
  medical_expiry date,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT crew_members_pkey PRIMARY KEY (id),
  CONSTRAINT crew_members_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users (id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_crew_members_user_id ON public.crew_members USING btree (user_id);
CREATE INDEX IF NOT EXISTS idx_crew_members_email ON public.crew_members USING btree (email);

-- ============================================
-- Table: crew_flight_hours
-- ============================================
CREATE TABLE IF NOT EXISTS public.crew_flight_hours (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  crew_member_id uuid NOT NULL,
  aircraft_id uuid NOT NULL,
  month integer NOT NULL,
  year integer NOT NULL,
  total_hours numeric(10, 2) DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT crew_flight_hours_pkey PRIMARY KEY (id),
  CONSTRAINT crew_flight_hours_crew_member_id_fkey FOREIGN KEY (crew_member_id) REFERENCES crew_members (id) ON DELETE CASCADE,
  CONSTRAINT crew_flight_hours_aircraft_id_fkey FOREIGN KEY (aircraft_id) REFERENCES aircraft (id) ON DELETE CASCADE,
  CONSTRAINT crew_flight_hours_month_check CHECK (month >= 1 AND month <= 12),
  CONSTRAINT crew_flight_hours_year_check CHECK (year >= 1900)
);

CREATE INDEX IF NOT EXISTS idx_crew_flight_hours_crew_member_id ON public.crew_flight_hours USING btree (crew_member_id);
CREATE INDEX IF NOT EXISTS idx_crew_flight_hours_aircraft_id ON public.crew_flight_hours USING btree (aircraft_id);

-- ============================================
-- Table: clients
-- ============================================
CREATE TABLE IF NOT EXISTS public.clients (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text,
  phone text,
  address text,
  company_name text,
  cnpj text UNIQUE,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT clients_pkey PRIMARY KEY (id)
);

CREATE INDEX IF NOT EXISTS idx_clients_name ON public.clients USING btree (name);
CREATE INDEX IF NOT EXISTS idx_clients_email ON public.clients USING btree (email);

-- ============================================
-- Table: contacts
-- ============================================
CREATE TABLE IF NOT EXISTS public.contacts (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  origin text NOT NULL,
  name text NOT NULL,
  email text,
  phone text,
  city text,
  role text,
  company text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT contacts_pkey PRIMARY KEY (id)
);

CREATE INDEX IF NOT EXISTS idx_contacts_origin ON public.contacts USING btree (origin);
CREATE INDEX IF NOT EXISTS idx_contacts_name ON public.contacts USING btree (name);

-- ============================================
-- Table: flight_schedules
-- ============================================
CREATE TABLE IF NOT EXISTS public.flight_schedules (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  aircraft_id uuid NOT NULL,
  client_id uuid,
  scheduled_date date NOT NULL,
  departure_airport text,
  arrival_airport text,
  flight_hours numeric(10, 2),
  status text DEFAULT 'agendado',
  notes text,
  created_by uuid,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT flight_schedules_pkey PRIMARY KEY (id),
  CONSTRAINT flight_schedules_aircraft_id_fkey FOREIGN KEY (aircraft_id) REFERENCES aircraft (id) ON DELETE CASCADE,
  CONSTRAINT flight_schedules_client_id_fkey FOREIGN KEY (client_id) REFERENCES clients (id) ON DELETE SET NULL,
  CONSTRAINT flight_schedules_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users (id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_flight_schedules_aircraft_id ON public.flight_schedules USING btree (aircraft_id);
CREATE INDEX IF NOT EXISTS idx_flight_schedules_scheduled_date ON public.flight_schedules USING btree (scheduled_date);
CREATE INDEX IF NOT EXISTS idx_flight_schedules_status ON public.flight_schedules USING btree (status);

-- ============================================
-- Table: flight_plans
-- ============================================
CREATE TABLE IF NOT EXISTS public.flight_plans (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  flight_schedule_id uuid NOT NULL,
  aircraft_registration text NOT NULL,
  departure_airport text NOT NULL,
  arrival_airport text NOT NULL,
  estimated_duration numeric(10, 2),
  crew_members jsonb,
  fuel_quantity numeric(10, 2),
  cargo_weight numeric(10, 2),
  notes text,
  status text DEFAULT 'planejado',
  created_by uuid,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT flight_plans_pkey PRIMARY KEY (id),
  CONSTRAINT flight_plans_flight_schedule_id_fkey FOREIGN KEY (flight_schedule_id) REFERENCES flight_schedules (id) ON DELETE CASCADE,
  CONSTRAINT flight_plans_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users (id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_flight_plans_flight_schedule_id ON public.flight_plans USING btree (flight_schedule_id);
CREATE INDEX IF NOT EXISTS idx_flight_plans_status ON public.flight_plans USING btree (status);

-- ============================================
-- Table: flight_checklists
-- ============================================
CREATE TABLE IF NOT EXISTS public.flight_checklists (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  flight_plan_id uuid NOT NULL,
  item_name text NOT NULL,
  is_completed boolean DEFAULT false,
  notes text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT flight_checklists_pkey PRIMARY KEY (id),
  CONSTRAINT flight_checklists_flight_plan_id_fkey FOREIGN KEY (flight_plan_id) REFERENCES flight_plans (id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_flight_checklists_flight_plan_id ON public.flight_checklists USING btree (flight_plan_id);

-- ============================================
-- Table: favorite_routes
-- ============================================
CREATE TABLE IF NOT EXISTS public.favorite_routes (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  departure_airport text NOT NULL,
  arrival_airport text NOT NULL,
  route text,
  created_by uuid,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT favorite_routes_pkey PRIMARY KEY (id),
  CONSTRAINT favorite_routes_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users (id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_favorite_routes_created_by ON public.favorite_routes USING btree (created_by);

-- ============================================
-- Table: logbook_entries
-- ============================================
CREATE TABLE IF NOT EXISTS public.logbook_entries (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  aircraft_id uuid NOT NULL,
  departure_airport text NOT NULL,
  arrival_airport text NOT NULL,
  flight_date date NOT NULL,
  departure_time time,
  arrival_time time,
  flight_hours numeric(10, 2),
  hobbs_start numeric(10, 2),
  hobbs_end numeric(10, 2),
  cell_hours_start numeric(10, 2),
  cell_hours_end numeric(10, 2),
  landings integer DEFAULT 0,
  fuel_added numeric(10, 2),
  fuel_price_per_liter numeric(10, 2),
  crew_members jsonb,
  notes text,
  created_by uuid,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT logbook_entries_pkey PRIMARY KEY (id),
  CONSTRAINT logbook_entries_aircraft_id_fkey FOREIGN KEY (aircraft_id) REFERENCES aircraft (id) ON DELETE CASCADE,
  CONSTRAINT logbook_entries_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users (id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_logbook_entries_aircraft_id ON public.logbook_entries USING btree (aircraft_id);
CREATE INDEX IF NOT EXISTS idx_logbook_entries_flight_date ON public.logbook_entries USING btree (flight_date);

-- ============================================
-- Table: logbook_months
-- ============================================
CREATE TABLE IF NOT EXISTS public.logbook_months (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  aircraft_id uuid NOT NULL,
  year integer NOT NULL,
  month integer NOT NULL,
  cell_hours_start numeric(10, 2) DEFAULT 0,
  cell_hours_end numeric(10, 2) DEFAULT 0,
  hobbs_hours_start numeric(10, 2) DEFAULT 0,
  hobbs_hours_end numeric(10, 2) DEFAULT 0,
  is_closed boolean DEFAULT false,
  closed_by uuid,
  closed_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  diarias numeric,
  CONSTRAINT logbook_months_pkey PRIMARY KEY (id),
  CONSTRAINT logbook_months_aircraft_id_year_month_key UNIQUE (aircraft_id, year, month),
  CONSTRAINT logbook_months_aircraft_id_fkey FOREIGN KEY (aircraft_id) REFERENCES aircraft (id) ON DELETE CASCADE,
  CONSTRAINT logbook_months_closed_by_fkey FOREIGN KEY (closed_by) REFERENCES auth.users (id),
  CONSTRAINT logbook_months_month_check CHECK (month >= 1 AND month <= 12),
  CONSTRAINT logbook_months_year_check CHECK (year >= 1900)
);

CREATE INDEX IF NOT EXISTS idx_logbook_months_aircraft ON public.logbook_months USING btree (aircraft_id);
CREATE INDEX IF NOT EXISTS idx_logbook_months_aircraft_year_month ON public.logbook_months USING btree (aircraft_id, year, month);

-- ============================================
-- Table: monthly_diary_closures
-- ============================================
CREATE TABLE IF NOT EXISTS public.monthly_diary_closures (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  aircraft_id uuid NOT NULL,
  month integer NOT NULL,
  year integer NOT NULL,
  total_hours numeric NOT NULL DEFAULT 0,
  total_landings integer NOT NULL DEFAULT 0,
  total_fuel_added numeric NOT NULL DEFAULT 0,
  closing_observations text,
  closed_by uuid,
  closed_at timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT monthly_diary_closures_pkey PRIMARY KEY (id),
  CONSTRAINT monthly_diary_closures_aircraft_id_month_year_key UNIQUE (aircraft_id, month, year),
  CONSTRAINT monthly_diary_closures_aircraft_id_fkey FOREIGN KEY (aircraft_id) REFERENCES aircraft (id),
  CONSTRAINT monthly_diary_closures_closed_by_fkey FOREIGN KEY (closed_by) REFERENCES auth.users (id),
  CONSTRAINT monthly_diary_closures_month_check CHECK (month >= 1 AND month <= 12)
);

CREATE INDEX IF NOT EXISTS idx_monthly_closures_aircraft_date ON public.monthly_diary_closures USING btree (aircraft_id, year, month);

-- ============================================
-- Table: tasks
-- ============================================
CREATE TABLE IF NOT EXISTS public.tasks (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  status text DEFAULT 'aberto',
  priority text DEFAULT 'media',
  assigned_to uuid,
  created_by uuid,
  due_date date,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT tasks_pkey PRIMARY KEY (id),
  CONSTRAINT tasks_assigned_to_fkey FOREIGN KEY (assigned_to) REFERENCES auth.users (id) ON DELETE SET NULL,
  CONSTRAINT tasks_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users (id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON public.tasks USING btree (assigned_to);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON public.tasks USING btree (status);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON public.tasks USING btree (due_date);

-- ============================================
-- Table: messages
-- ============================================
CREATE TABLE IF NOT EXISTS public.messages (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  author_id uuid NOT NULL,
  author_name text NOT NULL,
  content text NOT NULL,
  target_type text NOT NULL,
  target_user_id uuid,
  target_roles text[] DEFAULT '{}',
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT messages_pkey PRIMARY KEY (id),
  CONSTRAINT messages_author_id_fkey FOREIGN KEY (author_id) REFERENCES auth.users (id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_messages_author_id ON public.messages USING btree (author_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages USING btree (created_at);
CREATE INDEX IF NOT EXISTS idx_messages_target_user_id ON public.messages USING btree (target_user_id);

-- ============================================
-- Table: salaries
-- ============================================
CREATE TABLE IF NOT EXISTS public.salaries (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  crew_member_id uuid NOT NULL,
  base_salary numeric(10, 2) NOT NULL,
  meal_allowance numeric(10, 2) DEFAULT 0,
  flight_hour_rate numeric(10, 2) DEFAULT 0,
  effective_date date NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT salaries_pkey PRIMARY KEY (id),
  CONSTRAINT salaries_crew_member_id_fkey FOREIGN KEY (crew_member_id) REFERENCES crew_members (id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_salaries_crew_member_id ON public.salaries USING btree (crew_member_id);

-- ============================================
-- Table: aircraft_hourly_rates
-- ============================================
CREATE TABLE IF NOT EXISTS public.aircraft_hourly_rates (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  aircraft_id uuid NOT NULL,
  hourly_rate numeric(10, 2) NOT NULL,
  effective_date date NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT aircraft_hourly_rates_pkey PRIMARY KEY (id),
  CONSTRAINT aircraft_hourly_rates_aircraft_id_fkey FOREIGN KEY (aircraft_id) REFERENCES aircraft (id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_aircraft_hourly_rates_aircraft_id ON public.aircraft_hourly_rates USING btree (aircraft_id);

-- ============================================
-- Table: flight_payments
-- ============================================
CREATE TABLE IF NOT EXISTS public.flight_payments (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  crew_member_id uuid NOT NULL,
  flight_schedule_id uuid,
  month integer NOT NULL,
  year integer NOT NULL,
  flight_hours numeric(10, 2) DEFAULT 0,
  hourly_rate numeric(10, 2) DEFAULT 0,
  total_amount numeric(10, 2) DEFAULT 0,
  status text DEFAULT 'pendente',
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT flight_payments_pkey PRIMARY KEY (id),
  CONSTRAINT flight_payments_crew_member_id_fkey FOREIGN KEY (crew_member_id) REFERENCES crew_members (id) ON DELETE CASCADE,
  CONSTRAINT flight_payments_flight_schedule_id_fkey FOREIGN KEY (flight_schedule_id) REFERENCES flight_schedules (id) ON DELETE SET NULL,
  CONSTRAINT flight_payments_crew_month_year_key UNIQUE (crew_member_id, month, year)
);

CREATE INDEX IF NOT EXISTS idx_flight_payments_crew_member_id ON public.flight_payments USING btree (crew_member_id);
CREATE INDEX IF NOT EXISTS idx_flight_payments_status ON public.flight_payments USING btree (status);

-- ============================================
-- Table: payslips
-- ============================================
CREATE TABLE IF NOT EXISTS public.payslips (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  crew_member_id uuid NOT NULL,
  month integer NOT NULL,
  year integer NOT NULL,
  salary numeric(10, 2) DEFAULT 0,
  meal_allowance numeric(10, 2) DEFAULT 0,
  flight_payments numeric(10, 2) DEFAULT 0,
  fuel_discount numeric(10, 2) DEFAULT 0,
  other_deductions numeric(10, 2) DEFAULT 0,
  inss numeric(10, 2) DEFAULT 0,
  ir numeric(10, 2) DEFAULT 0,
  net_salary numeric(10, 2) DEFAULT 0,
  gross_salary numeric(10, 2) DEFAULT 0,
  payment_date date,
  notes text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT payslips_pkey PRIMARY KEY (id),
  CONSTRAINT payslips_crew_member_id_fkey FOREIGN KEY (crew_member_id) REFERENCES crew_members (id) ON DELETE CASCADE,
  CONSTRAINT payslips_crew_month_year_key UNIQUE (crew_member_id, month, year)
);

CREATE INDEX IF NOT EXISTS idx_payslips_crew_member_id ON public.payslips USING btree (crew_member_id);
CREATE INDEX IF NOT EXISTS idx_payslips_payment_date ON public.payslips USING btree (payment_date);

-- ============================================
-- Table: receipts
-- ============================================
CREATE TABLE IF NOT EXISTS public.receipts (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  receipt_number text NOT NULL UNIQUE,
  payer_name text NOT NULL,
  service_description text NOT NULL,
  amount numeric(10, 2) NOT NULL,
  emission_date date NOT NULL,
  payment_date date,
  notes text,
  observacoes text,
  created_by uuid,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT receipts_pkey PRIMARY KEY (id),
  CONSTRAINT receipts_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users (id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_receipts_receipt_number ON public.receipts USING btree (receipt_number);
CREATE INDEX IF NOT EXISTS idx_receipts_emission_date ON public.receipts USING btree (emission_date);

-- ============================================
-- Table: favorite_payers
-- ============================================
CREATE TABLE IF NOT EXISTS public.favorite_payers (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  created_by uuid,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT favorite_payers_pkey PRIMARY KEY (id),
  CONSTRAINT favorite_payers_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users (id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_favorite_payers_created_by ON public.favorite_payers USING btree (created_by);

-- ============================================
-- Table: favorite_descriptions
-- ============================================
CREATE TABLE IF NOT EXISTS public.favorite_descriptions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  description text NOT NULL,
  created_by uuid,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT favorite_descriptions_pkey PRIMARY KEY (id),
  CONSTRAINT favorite_descriptions_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users (id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_favorite_descriptions_created_by ON public.favorite_descriptions USING btree (created_by);

-- ============================================
-- Table: ctm_tracking
-- ============================================
CREATE TABLE IF NOT EXISTS public.ctm_tracking (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  crew_member_id uuid NOT NULL,
  ctm_date date NOT NULL,
  ctm_hours numeric(10, 2) DEFAULT 0,
  notes text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT ctm_tracking_pkey PRIMARY KEY (id),
  CONSTRAINT ctm_tracking_crew_member_id_fkey FOREIGN KEY (crew_member_id) REFERENCES crew_members (id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_ctm_tracking_crew_member_id ON public.ctm_tracking USING btree (crew_member_id);
CREATE INDEX IF NOT EXISTS idx_ctm_tracking_ctm_date ON public.ctm_tracking USING btree (ctm_date);

-- ============================================
-- Function: update_updated_at_column
-- ============================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- Triggers for updated_at
-- ============================================
CREATE TRIGGER user_profiles_update_updated_at BEFORE UPDATE ON public.user_profiles
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER aircraft_update_updated_at BEFORE UPDATE ON public.aircraft
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER aerodromes_update_updated_at BEFORE UPDATE ON public.aerodromes
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER crew_members_update_updated_at BEFORE UPDATE ON public.crew_members
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER crew_flight_hours_update_updated_at BEFORE UPDATE ON public.crew_flight_hours
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER flight_schedules_update_updated_at BEFORE UPDATE ON public.flight_schedules
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER flight_plans_update_updated_at BEFORE UPDATE ON public.flight_plans
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER flight_checklists_update_updated_at BEFORE UPDATE ON public.flight_checklists
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER favorite_routes_update_updated_at BEFORE UPDATE ON public.favorite_routes
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER logbook_entries_update_updated_at BEFORE UPDATE ON public.logbook_entries
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER logbook_months_update_updated_at BEFORE UPDATE ON public.logbook_months
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER clients_update_updated_at BEFORE UPDATE ON public.clients
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER contacts_update_updated_at BEFORE UPDATE ON public.contacts
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER tasks_update_updated_at BEFORE UPDATE ON public.tasks
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER salaries_update_updated_at BEFORE UPDATE ON public.salaries
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER aircraft_hourly_rates_update_updated_at BEFORE UPDATE ON public.aircraft_hourly_rates
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER flight_payments_update_updated_at BEFORE UPDATE ON public.flight_payments
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER payslips_update_updated_at BEFORE UPDATE ON public.payslips
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER receipts_update_updated_at BEFORE UPDATE ON public.receipts
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER ctm_tracking_update_updated_at BEFORE UPDATE ON public.ctm_tracking
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
