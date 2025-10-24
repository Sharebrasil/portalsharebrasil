-- Database Export
-- Generated: 2025-10-24
-- This export contains the schema and data for the application database

-- Create custom types
CREATE TYPE public.app_role AS ENUM (
  'gestor_master',
  'admin',
  'financeiro_master',
  'tripulante'
);

-- ============================================
-- Table: user_profiles
-- ============================================

CREATE TABLE IF NOT EXISTS public.user_profiles (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  email text NOT NULL,
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
  cpf text,
  rg text,
  birth_date date,
  bank_data jsonb DEFAULT '{}'::jsonb,
  employment_status text DEFAULT 'ativo'::text,
  is_authenticated_user boolean DEFAULT true,
  CONSTRAINT user_profiles_pkey PRIMARY KEY (id),
  CONSTRAINT user_profiles_email_key UNIQUE (email),
  CONSTRAINT user_profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users (id)
);

CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON public.user_profiles USING btree (id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON public.user_profiles USING btree (email);

-- Data for user_profiles
INSERT INTO public.user_profiles (id, email, full_name, created_at, updated_at, display_name, phone, address, avatar_url, role, tipo, admission_date, salary, benefits, cpf, rg, birth_date, bank_data, employment_status, is_authenticated_user) VALUES
('34588fc8-41af-4d3c-b3c1-62a1f7bebc86', 'camilla@share.com', 'Camilla Mello', '2025-10-15 18:26:31.074375+00', '2025-10-16 18:59:44.16+00', 'Camilla', NULL, NULL, 'https://yelanwtucirrxbskwjxc.supabase.co/storage/v1/object/public/profile-avatar/34588fc8-41af-4d3c-b3c1-62a1f7bebc86/eef474c1-0c67-4af0-a735-09feb3029fcd.jpg', 'admin', NULL, NULL, NULL, NULL, NULL, NULL, NULL, '{}', NULL, true),
('893e41e8-bcd3-460f-9271-c3112202707e', 'rolffe@share.com', 'Rolffe de Lima Erbe', '2025-10-15 12:54:05+00', '2025-10-15 12:54:09+00', 'Rolffe', NULL, NULL, NULL, 'gestor_master', NULL, NULL, NULL, NULL, NULL, NULL, NULL, '{}', 'ativo', true),
('c96cc9ed-9d16-467e-89fa-561381f6085d', 'daniele@share.com', 'DANIELE CASAMARY FOGGIATO FRANÇA', '2025-10-14 23:43:01.536521+00', '2025-10-14 23:43:01.536521+00', 'Daniele', NULL, NULL, NULL, 'financeiro_master', NULL, '2022-09-05', NULL, NULL, '055.749.201-74', NULL, NULL, '{}', 'ativo', true),
('db659714-2191-4b3d-9c51-dc4190913ffb', 'augusto@share.com', 'Augusto', '2025-10-20 20:43:31.119099+00', '2025-10-20 20:43:31.119099+00', 'Augusto', NULL, NULL, NULL, 'tripulante', NULL, '2025-03-24', NULL, NULL, NULL, NULL, NULL, '{}', 'ativo', true);

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

-- Data for user_roles
INSERT INTO public.user_roles (id, user_id, role, created_at) VALUES
('35386d6c-a4b0-4ba3-ab18-277d0b70fb64', '893e41e8-bcd3-460f-9271-c3112202707e', 'gestor_master', '2025-10-15 12:54:46+00'),
('615d1e1c-f205-4263-b021-a7a535c2f0b2', '34588fc8-41af-4d3c-b3c1-62a1f7bebc86', 'admin', '2025-10-15 18:06:47+00'),
('773cb208-0e07-4ca1-898c-7d1f62546d35', 'c96cc9ed-9d16-467e-89fa-561381f6085d', 'financeiro_master', '2025-10-14 23:49:03+00');

-- ============================================
-- Table: aircraft
-- ============================================

CREATE TABLE IF NOT EXISTS public.aircraft (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  registration text NOT NULL,
  manufacturer text NOT NULL,
  model text NOT NULL,
  serial_number text NOT NULL,
  owner_name text NOT NULL,
  fuel_consumption text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  status text,
  year text,
  base text,
  CONSTRAINT aircraft_pkey PRIMARY KEY (id)
);

-- Data for aircraft
INSERT INTO public.aircraft (id, registration, manufacturer, model, serial_number, owner_name, fuel_consumption, created_at, updated_at, status, year, base) VALUES
('51ed40fd-8796-4932-b818-81362a09a01c', 'PT-TOR', 'PIPER AIRCRAFT', 'PA-46R-350T', '4692117', 'EUGENIO ROBERTO BERGAMIM', '83', '2025-10-18 23:04:06.682289+00', '2025-10-18 23:04:06.682289+00', 'inativa', '2009', 'SWJN'),
('815e2220-ad73-41c8-8526-7a1123ae986d', 'PS-AVE', 'TEXTRON AVIATION', '182T', '18283114', 'CARISMA INVESTIMENTOS E PARTICIPAÇÕES', '109', '2025-10-17 20:19:34.775857+00', '2025-10-17 20:19:34.775857+00', 'Ativa', '2020', 'SBCY'),
('b338b467-4beb-428c-8de6-2565dcb30280', 'PR-MDL', 'PIPER AIRCRAFT', 'PA-34-220T', '3449260', 'WATT - DISTRIBUIDORA BRASIL DE COMBUSTIVEIS', '109', '2025-10-17 19:59:07.700035+00', '2025-10-17 19:59:07.700035+00', 'Ativa', '2002', 'SBCY');

-- ============================================
-- Table: aerodromes
-- ============================================

CREATE TABLE IF NOT EXISTS public.aerodromes (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  icao_code text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  coordenadas text,
  CONSTRAINT aerodromes_pkey PRIMARY KEY (id),
  CONSTRAINT aerodromes_icao_code_key UNIQUE (icao_code)
);

-- Data for aerodromes (sample - partial list)
INSERT INTO public.aerodromes (id, name, icao_code, created_at, updated_at, coordenadas) VALUES
('004ae41b-ead2-4464-abee-16966037e3f2', 'SINOP', 'SBSI', '2025-10-17 15:33:22.458405+00', '2025-10-17 15:33:22.458405+00', '553510W 55°35''10"W 11536S 11°53''6"S'),
('0449c9ec-4c5a-495f-9186-93a07b884bc9', 'CORUMBÁ', 'SBCR', '2025-10-17 15:32:24.259121+00', '2025-10-17 15:32:24.259121+00', '574017W 57°40''17"W 19043S 19°04''3"S'),
('05350807-2cdf-4d23-9489-0a6963a8d65d', 'AEROCLUBE SELVA', 'SIVG', '2025-10-17 00:31:25+00', '2025-10-17 00:31:29+00', '55	26	48	W	11	52	35	S'),
('1421436f-5cee-4b22-af7b-3fbf1975b4c5', 'ITAITUBA', 'SBIH', '2025-10-17 15:32:59.446657+00', '2025-10-17 15:32:59.446657+00', '5603W 56°0''3"W 41432S 4°14''32"S'),
('2a68293f-d41c-45e6-93b4-19c680211c89', 'BRASÍLIA', 'SBBR', '2025-10-17 15:31:51.924136+00', '2025-10-17 15:31:51.924136+00', '47557W 4°75''57"W 155216S 15°52''16"S'),
('329ba9cd-da69-4e3b-baa9-84fe330cb2fd', 'BARREIRAS', 'SNBR', '2025-10-17 15:31:51.924136+00', '2025-10-17 15:31:51.924136+00', '45034W 4°50''34"W 12445S 12°44''5"S'),
('432470c0-8cea-42a9-bf3b-a994e9ecdfaf', 'CAMPO GRANDE', 'SBCG', '2025-10-17 15:35:15.302749+00', '2025-10-17 15:35:15.302749+00', '544022W 54°40''22"W 202817S 20°28''17"S'),
('52d5438e-8608-41be-9cb2-1514d9ad204e', 'CUIABÁ', 'SBCY', '2025-10-17 15:32:24.259121+00', '2025-10-17 15:32:24.259121+00', '5673W 56°7''3"W 15390S 15°39''0"S'),
('5a1e675a-ad0d-4396-87f3-ce72b13f0f77', 'ÁGUA BOA', 'SWHP', '2025-10-17 00:33:53+00', '2025-10-17 00:34:00+00', '52	9	8	W	14	1	10	S'),
('5eb230a8-0bd4-4978-a8cf-cb1b64058531', 'BARRA DO GARÇAS', 'SBBW', '2025-10-17 15:31:51.924136+00', '2025-10-17 15:31:51.924136+00', '522322S 52°23''22"S 155139W 15°51''39"W'),
('6c3b10ef-34b0-4ab0-bdab-b5af6cd8f18e', 'SORRISO', 'SBSO', '2025-10-17 15:33:22.458405+00', '2025-10-17 15:33:22.458405+00', '55408W 55°40''8"W 122822S 12°28''22"S'),
('c323c3e0-2368-4586-8f9b-079202900d8c', 'ALTA FLORESTA', 'SBAT', '2025-10-17 00:30:59.125439+00', '2025-10-17 00:30:59.125439+00', '56	6	18	W	9	51	59	S');

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

-- Data for hoteis (sample - partial list)
INSERT INTO public.hoteis (id, nome, telefone, cidade, preco_single, preco_duplo, endereco, created_at) VALUES
('2b213c8b-4cda-4744-bb59-a6ac664cdd1c', 'Holiday Inn Anhembi', '11 2107-8844', NULL, 367.00, 390.00, 'R. Prof. Milton Rodriguez, 100 - São Paulo - SP', '2025-10-14 22:35:13.435619+00'),
('357e9e1c-f2c3-43f3-a9e4-02456a23b951', 'Hotel Ibis Goiânia', '62 2795-6050', NULL, 300.00, 350.00, 'R. 21, 154 - St. Oeste - Goiânia - GO', '2025-10-14 22:35:13.435619+00'),
('3a0f3113-199a-49c0-8f1b-f30631056f35', 'Hotel Santos Dumont', '62 98246-2734', NULL, 220.00, 318.00, 'Av. Santos Dumont, 1001 - Goiânia - GO', '2025-10-14 22:35:13.435619+00'),
('84287178-45af-4594-a0f4-7ffd6f65767e', 'Plaza Hotel', '66 99621-4502', NULL, 205.00, 310.00, 'R. Três, 292 - Centro - Água Boa - MT', '2025-10-14 22:35:13.435619+00'),
('c91fd75a-bc36-4b18-9e66-d108e0e94bee', 'Hotel Líder', '66 9229-5148', NULL, 140.00, 190.00, 'R. Dez - Centro - Água Boa - MT', '2025-10-14 22:35:13.435619+00'),
('dbc07212-cf6f-4925-baf8-e7b8592ff6d2', 'New Plaza Hotel', '99 98812-1274', NULL, 160.00, 210.00, 'Av. Dr. José Bernardino, 69 - Balsas - MA', '2025-10-14 22:35:13.435619+00');

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
  CONSTRAINT logbook_months_year_check CHECK (year >= 1900 AND year <= 3000)
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

-- Data for monthly_diary_closures
INSERT INTO public.monthly_diary_closures (id, aircraft_id, month, year, total_hours, total_landings, total_fuel_added, closing_observations, closed_by, closed_at, created_at) VALUES
('01f2e78e-dbd7-4a8a-8c51-cfdedc4456d4', '51ed40fd-8796-4932-b818-81362a09a01c', 10, 2025, 0, 0, 0, NULL, NULL, '2025-10-18 23:04:06.682289+00', '2025-10-18 23:04:06.682289+00'),
('719c1228-93bf-4dcf-9e4d-8c954d6176d4', '815e2220-ad73-41c8-8526-7a1123ae986d', 10, 2025, 0, 0, 0, NULL, NULL, '2025-10-17 20:19:34.775857+00', '2025-10-17 20:19:34.775857+00'),
('8a6f54a9-e38c-466e-b1e1-27142b35fa0a', 'b338b467-4beb-428c-8de6-2565dcb30280', 10, 2025, 0, 0, 0, NULL, NULL, '2025-10-17 19:59:07.700035+00', '2025-10-17 19:59:07.700035+00');

-- ============================================
-- Notes
-- ============================================
-- This export contains the main tables with data.
-- Additional tables and triggers referenced in the original data may need to be created separately.
-- The auth.users table is managed by Supabase authentication system.
-- Some functions referenced in triggers (update_updated_at_column, _after_insert_aircraft_create_closure, _after_upsert_aircraft_create_closure)
-- need to be created separately.
