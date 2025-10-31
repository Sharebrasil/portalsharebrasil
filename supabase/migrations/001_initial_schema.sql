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
-- INSERT: Initial Aerodromes Data
-- ============================================
INSERT INTO "public"."aerodromes" ("id", "name", "icao_code", "created_at", "updated_at", "coordenadas") VALUES
('004ae41b-ead2-4464-abee-16966037e3f2', 'SINOP', 'SBSI', '2025-10-17 15:33:22.458405+00', '2025-10-17 15:33:22.458405+00', '553510W 55°35''10"W 11536S 11°53''6"S'),
('00d8c28c-94ce-437a-9499-7a5edcd0bfc9', 'PONTES E LACERDA', 'SWBG', '2025-10-17 15:35:37.208279+00', '2025-10-17 15:35:37.208279+00', '59237W 59°23''7"W 151136S 15°11''36"S'),
('0449c9ec-4c5a-495f-9186-93a07b884bc9', 'CORUMBÁ', 'SBCR', '2025-10-17 15:32:24.259121+00', '2025-10-17 15:32:24.259121+00', '574017W 57°40''17"W 19043S 19°04''3"S'),
('04ad0924-a97e-4b9c-96c0-de8f9964b27c', 'GUAPIRAMA', 'SIRT', '2025-10-17 15:34:21.92153+00', '2025-10-17 15:34:21.92153+00', '571436W 57°14''36"W 135529S 13°55''29"S'),
('05350807-2cdf-4d23-9489-0a6963a8d65d', 'AEROCLUBE SELVA', 'SIVG', '2025-10-17 00:31:25+00', '2025-10-17 00:31:29+00', '55 26 48 W 11 52 35 S'),
('07e00ff0-9d9c-4074-bdbb-72a052cfa5ae', 'BOM FUTURO', 'SIAQ', '2025-10-17 15:34:53.543713+00', '2025-10-17 15:34:53.543713+00', '56554W 56°55''4"W 153023S 15°30''23"S'),
('0b0ac6e0-79b9-4115-a164-fb3f87c3ed7d', 'FAZ MALIBU', 'SSQM', '2025-10-17 15:34:53.543713+00', '2025-10-17 15:34:53.543713+00', '573559W 57°35''59"W 13824S 13°82''4"S'),
('0f0d9407-33e5-4a39-a76d-5fc1dbe9655a', 'ARAGARÇAS', 'SJVO', '2025-10-17 15:35:15.302749+00', '2025-10-17 15:35:15.302749+00', '521472W 52°14''72"W 155395S 15°53''95"S'),
('11e46f08-15f8-40f3-8793-984cc5131064', 'IJUÍ', 'SIJ', '2025-10-17 15:35:37.208279+00', '2025-10-17 15:35:37.208279+00', '535047W 53°50''47"W 28227S 28°22''7"S'),
('1421436f-5cee-4b22-af7b-3fbf1975b4c5', 'ITAITUBA', 'SBIH', '2025-10-17 15:32:59.446657+00', '2025-10-17 15:32:59.446657+00', '5603W 56°0''3"W 41432S 4°14''32"S'),
('1587bc97-a7c0-41a0-8e99-00646bff1d1d', 'RIO VERDE', 'SWLC', '2025-10-17 15:35:15.302749+00', '2025-10-17 15:35:15.302749+00', '505722W 50°57''22"W 17505S 17°50''5"S'),
('197be0fb-9db2-4389-8dea-71331259399a', 'FAZ TAMANDUÁ', 'SDTH', '2025-10-17 15:32:42.326349+00', '2025-10-17 15:32:42.326349+00', '573436W 57°34''36"W 13824S 13°82''4"S'),
('1c0c8e90-8721-46be-bbef-805f4f0c051b', 'MATUPÁ', 'SWXM', '2025-10-17 15:32:59.446657+00', '2025-10-17 15:32:59.446657+00', '545710W 54°57''10"W 101013S 10°10''13"S'),
('1c8c5baa-413a-4189-89cc-29496a37497d', 'MANAUS', 'SBEG', '2025-10-17 15:34:53.543713+00', '2025-10-17 15:34:53.543713+00', '6032W 60°3''2"W 3228S 3°22''8"S'),
('1ce8135c-9df5-4c03-893a-0bebe482108f', 'LUIS EDU. MAGALHAES', 'SWNB', '2025-10-17 15:32:59.446657+00', '2025-10-17 15:32:59.446657+00', '454241W 45°42''41"W 1246S 12°4''6"S'),
('1e7076e0-9178-4b51-98a4-8e999b2bb495', 'FAZ. TUCUNARÉ', 'SWTU', '2025-10-17 15:34:53.543713+00', '2025-10-17 15:34:53.543713+00', '585159W 58°51''59"W 132755S 13°27''55"S'),
('20ce7ade-8ea2-44a9-8ce3-3259b7b7101d', 'TUPÃ', 'SDTP', '2025-10-17 15:35:37.208279+00', '2025-10-17 15:35:37.208279+00', '503021W 50°30''21"W 215324S 21°53''24"S'),
('219f935e-0019-4208-b4de-4b718f9a5d23', 'QUERÊNCIA', 'SDLN', '2025-10-17 15:33:22.458405+00', '2025-10-17 15:33:22.458405+00', '5296W 52°9''6"W 123649S 12°36''49"S'),
('2445be55-ad7b-4e8c-a067-1aad11176976', 'REDENÇÃO', 'SNDC', '2025-10-17 15:36:27.06476+00', '2025-10-17 15:36:27.06476+00', '495847W 49°58''47"W 8200S 8°20''0"S'),
('2a68293f-d41c-45e6-93b4-19c680211c89', 'BRASÍLIA', 'SBBR', '2025-10-17 15:31:51.924136+00', '2025-10-17 15:31:51.924136+00', '47557W 4°75''57"W 155216S 15°52''16"S'),
('2c2b9295-c76c-476a-b4f2-63616cb49ca3', 'FAZ BOA ESPERANÇA', 'SJPW', '2025-10-17 15:32:42.326349+00', '2025-10-17 15:32:42.326349+00', '562150W 56°21''50"W 125337S 12°53''37"S'),
('329ba9cd-da69-4e3b-baa9-84fe330cb2fd', 'BARREIRAS', 'SNBR', '2025-10-17 15:31:51.924136+00', '2025-10-17 15:31:51.924136+00', '45034W 4°50''34"W 12445S 12°44''5"S'),
('32eff4d0-9d82-4449-a3fd-32ead2a4e4d8', 'FAZ SÃO JOAQUIM', 'SJIJ', '2025-10-17 15:35:15.302749+00', '2025-10-17 15:35:15.302749+00', '525457W 52°54''57"W 144892S 14°48''92"S'),
('340ace8a-9d6c-4a2c-be58-3b3d2c2fcabd', 'BIG MASTER TANGARÁ', 'SILS', '2025-10-17 15:34:21.92153+00', '2025-10-17 15:34:21.92153+00', '573629W 57°36''29"W 143812S 14°38''12"S'),
('385df641-352c-46ef-aaf3-53fe84ff8f66', 'FAZ GAIROVA', 'SIGX', '2025-10-17 15:35:37.208279+00', '2025-10-17 15:35:37.208279+00', '581415W 58°14''15"W 11121S 11°12''1"S'),
('3aff42a1-0594-43ba-b533-355b4e8ad310', 'TUPÃ PAULISTA', 'SDTI', '2025-10-17 15:33:22.458405+00', '2025-10-17 15:33:22.458405+00', '51363W 51°36''3"W 212336S 21°23''36"S'),
('3b84b59d-d767-4680-a98c-1b5569d2fa96', 'SEMEN. PETROVINA', 'SWAP', '2025-10-17 15:34:53.543713+00', '2025-10-17 15:34:53.543713+00', '54352W 54°35''2"W 165055S 16°50''55"S'),
('3c35d3d4-e298-41f4-a6d0-7491599a9116', 'NAVIRAÍ', 'SNVB', '2025-10-17 15:35:37.208279+00', '2025-10-17 15:35:37.208279+00', '54116W 54°11''6"W 23229S 23°2''9"S'),
('3fc68f38-f508-44e9-97e9-d1f74605d7c3', 'CAMPO DE MARTE', 'SBMT', '2025-10-17 15:35:37.208279+00', '2025-10-17 15:35:37.208279+00', '46383W 46°38''3"W 233040S 23°30''40"S'),
('40c193ab-79a5-4700-a623-a339c214a1da', 'FAZENDA CASTANHAIS', 'SNXG', '2025-10-17 15:36:27.06476+00', '2025-10-17 15:36:27.06476+00', '492143W 49°21''43"W 64622S 6°46''22"S'),
('42f15f91-d642-4eef-9a3c-4cb9901d4767', 'FAZ FLAMINGO CNPS', 'SJFY', '2025-10-17 15:32:42.326349+00', '2025-10-17 15:32:42.326349+00', '575641W 57°56''41"W 13515S 13°51''5"S'),
('432470c0-8cea-42a9-bf3b-a994e9ecdfaf', 'CAMPO GRANDE', 'SBCG', '2025-10-17 15:35:15.302749+00', '2025-10-17 15:35:15.302749+00', '544022W 54°40''22"W 202817S 20°28''17"S'),
('46c476d6-0c18-4cb1-a614-c177aacb2aaf', 'RIO BRACO', 'SBRB', '2025-10-17 15:34:53.543713+00', '2025-10-17 15:34:53.543713+00', '675353W 67°53''53"W 9526S 9°52''6"S'),
('48ceb9b1-f5ce-4db0-b34c-0500b59b97bb', 'CONFRESA', 'SJHG', '2025-10-17 15:32:24.259121+00', '2025-10-17 15:32:24.259121+00', '51342W 51°34''2"W 10381S 10°38''1"S'),
('49fbb721-d63f-4c4e-b5af-cafd53dea4d5', 'SANTARÉM', 'SBSN', '2025-10-17 15:35:15.302749+00', '2025-10-17 15:35:15.302749+00', '54479W 54°47''9"W 22529S 22°52''9"S'),
('4a288df1-660d-4586-8cb2-808ca81577b6', 'CACOAL', 'SSKW', '2025-10-17 15:35:37.208279+00', '2025-10-17 15:35:37.208279+00', '61273W 61°27''3"W 112944S 11°29''44"S'),
('4a997edd-6019-4400-9663-7c1efa692f7b', 'DIAMANTINO', 'SWDM', '2025-10-17 15:32:42.326349+00', '2025-10-17 15:32:42.326349+00', '56242W 56°24''2"W 142237S 14°22''37"S'),
('4adb8065-0b02-4b26-a5f7-a99dd041f85b', 'PORTO JOFRE', 'SJQI', '2025-10-17 15:34:21.92153+00', '2025-10-17 15:34:21.92153+00', '564626W 56°46''26"W 172128S 17°21''28"S'),
('4dbdeaba-8f3c-4197-80e7-b167dfaba84a', 'PRES. VENCESLAU', 'SDPV', '2025-10-17 15:33:22.458405+00', '2025-10-17 15:33:22.458405+00', '51534W 51°53''4"W 215336S 21°53''36"S'),
('4ffb90bc-2ed1-4c4e-991d-a51c3b345b16', 'SÃO JOSÉ DO RIO PRETO', 'SBSR', '2025-10-17 15:33:22.458405+00', '2025-10-17 15:33:22.458405+00', '492417W 49°24''17"W 204858S 20°48''58"S'),
('505e1b82-f380-45b7-8b3d-19b13ac724f8', 'ARAGUAINA', 'SWGN', '2025-10-17 15:35:37.208279+00', '2025-10-17 15:35:37.208279+00', '481427W 48°14''27"W 71342S 7°13''42"S'),
('52d5438e-8608-41be-9cb2-1514d9ad204e', 'CUIABÁ', 'SBCY', '2025-10-17 15:32:24.259121+00', '2025-10-17 15:32:24.259121+00', '5673W 56°7''3"W 15390S 15°39''0"S'),
('54ffc100-8c24-4e9b-8824-dfd7c3f9c4c5', 'TANGARÁ DA SERRA', 'SWTS', '2025-10-17 15:33:22.458405+00', '2025-10-17 15:33:22.458405+00', '572638W 57°26''38"W 143943S 14°39''43"S'),
('5546feda-7a98-404f-b879-3e414bc40dc7', 'SÃO PAULO', 'SBSP', '2025-10-17 15:34:53.543713+00', '2025-10-17 15:34:53.543713+00', '463759W 46°37''59"W 233236S 23°32''36"S'),
('58ecf000-1d96-4e07-9c7e-2f341e21e47d', 'XINGUARA', 'SWSX', '2025-10-17 15:36:27.06476+00', '2025-10-17 15:36:27.06476+00', '495836W 49°58''36"W 7529S 7°52''9"S'),
('5a1e675a-ad0d-4396-87f3-ce72b13f0f77', 'ÁGUA BOA', 'SWHP', '2025-10-17 00:33:53+00', '2025-10-17 00:34:00+00', '52 9 8 W 14 1 10 S'),
('5ae7cede-1fe2-49d6-b8e3-aa2f2b8283ba', 'SHEFFER SAPEZAL', 'SJIF', '2025-10-17 15:34:53.543713+00', '2025-10-17 15:34:53.543713+00', '585137W 58°51''37"W 13332S 13°33''2"S'),
('5be39ce9-5c42-4228-8af2-3704ad86b132', 'PARANATINGA', 'SWSP', '2025-10-17 15:32:59.446657+00', '2025-10-17 15:32:59.446657+00', '544418W 54°44''18"W 134331S 13°43''31"S'),
('5c0b4c2d-1557-40ff-9630-3907fb274522', 'UBERLANDIA', 'SBUL', '2025-10-17 15:33:22.458405+00', '2025-10-17 15:33:22.458405+00', '481331W 48°13''31"W 18531S 18°53''1"S'),
('5c70b8d7-71b5-4915-9e7b-6d14f7b78b18', 'SANTA MARIA CGS', 'SKG', '2025-10-17 15:34:53.543713+00', '2025-10-17 15:34:53.543713+00', '543129W 54°31''29"W 203020S 20°30''20"S'),
('5eb230a8-0bd4-4978-a8cf-cb1b64058531', 'BARRA DO GARÇAS', 'SBBW', '2025-10-17 15:31:51.924136+00', '2025-10-17 15:31:51.924136+00', '522322S 52°23''22"S 155139W 15°51''39"W');

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
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT hoteis_pkey PRIMARY KEY (id)
);

CREATE INDEX IF NOT EXISTS idx_hoteis_cidade ON public.hoteis USING btree (cidade);
CREATE INDEX IF NOT EXISTS idx_hoteis_nome ON public.hoteis USING btree (nome);

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

CREATE TRIGGER hoteis_update_updated_at BEFORE UPDATE ON public.hoteis
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- INSERT: Initial Hotels Data
-- ============================================
INSERT INTO "public"."hoteis" ("id", "nome", "telefone", "cidade", "preco_single", "preco_duplo", "endereco", "created_at") VALUES
('172c81fc-9cf0-405d-83ec-de391241987d', 'HOTEL CNP BRASIL - CAMPO NOVO DO PARECIS', '65 9254-0732', NULL, NULL, NULL, 'Av. Brasil, 115 - Centro, Campo Novo do Parecis - MT, 78360-000', '2025-10-14 22:35:13.435619+00'),
('17428294-3c82-4569-9acd-9d2c8eebf7f0', 'HOTEL BARRIL - PRIMAVERA DO LESTE', '(66) 3498-1247', NULL, NULL, NULL, 'Av. Cuiabá, 333 - Centro, Primavera do Leste - MT, 78850-000', '2025-10-14 22:35:13.435619+00'),
('183fe9e8-0848-4832-a5ba-191685ae799d', 'PILÕES PALACE HOTEL - MINEIROS GO', '(64) 3661-1547', NULL, NULL, NULL, 'Rua 13, 13 Setor Centro e Oeste - Centro, Mineiros - GO, 75830-074', '2025-10-14 22:35:13.435619+00'),
('285fcb38-98e2-41dc-94c1-315650f73d13', 'HOTEL BRAVO CITY - PRIMAVERA DO LESTE', '(66) 3498-1799', NULL, NULL, NULL, 'Av. São Paulo, 350 - Jardim Riva, Primavera do Leste - MT, 78850-000', '2025-10-14 22:35:13.435619+00'),
('2ac9886f-50f3-4af6-a160-cb1e6571956c', 'HOTEL ÁGUAS VERDES - LUCAS DO RIO VERDE', '(65) 9986-5159', NULL, NULL, NULL, 'R. São Lourenço do Oeste, 1391 - 1391 - S - S - Alvorada, Lucas do Rio Verde - MT, 78455-000', '2025-10-14 22:35:13.435619+00'),
('2b213c8b-4cda-4744-bb59-a6ac664cdd1c', 'Holiday Inn Anhembi', '11 2107-8844', NULL, '367.00', '390.00', 'R. Prof. Milton Rodriguez, 100 - São Paulo - SP', '2025-10-14 22:35:13.435619+00'),
('3104d568-af6e-40a6-b086-132af6912c2a', 'HOTEL IMPERIAL PALACE - SORRISO', '(66) 99604-5101', NULL, NULL, NULL, 'Av, Perimetral Sudeste, 9675, Sorriso - MT, 78890-000', '2025-10-14 22:35:13.435619+00'),
('32fbf82a-75a1-443f-992f-b03783f00af4', 'HOTEL IBIS GOIÂNIA', '(62) 2795-6050', NULL, NULL, NULL, 'R. 21, 154 - St. Oeste, Goiânia - GO, 74120-120', '2025-10-14 22:35:13.435619+00'),
('357e9e1c-f2c3-43f3-a9e4-02456a23b951', 'Hotel Ibis Goiânia', '62 2795-6050', NULL, '300.00', '350.00', 'R. 21, 154 - St. Oeste - Goiânia - GO', '2025-10-14 22:35:13.435619+00'),
('3975d4ad-43d1-4ea7-88e5-108e723baed0', 'ESTÂNCIA BAHIA - PT-OPC', '65 99944-1578', NULL, NULL, NULL, '', '2025-10-14 22:35:13.435619+00'),
('39f624df-a5fd-4b98-8fed-e3e1d0744a5f', 'DALLAS PALACE HOTEL - CAMPO NOVO DO PARECIS', '(65) 3382-1385', NULL, NULL, NULL, 'Av. Brasil 854ne - Centro, Campo Novo do Parecis - MT, 78360-000', '2025-10-14 22:35:13.435619+00'),
('3a0f3113-199a-49c0-8f1b-f30631056f35', 'Hotel Santos Dumont', '62 98246-2734', NULL, '220.00', '318.00', 'Av. Santos Dumont, 1001 - Goiânia - GO', '2025-10-14 22:35:13.435619+00'),
('3f7a4d20-b9ca-4af4-a6c7-233e689311bc', 'HOTEL PIRATININGA - RONDONÓPOLIS', '(66) 3411-5800', NULL, NULL, NULL, 'R. Fernando Corrêa da Costa, 624 - Centro, Rondonópolis', '2025-10-14 22:35:13.435619+00'),
('4b54a953-d82e-4765-a502-70326f6680e9', 'HOTEL AVENIDA - MATUPÁ', '(66) 3595-2275', NULL, NULL, NULL, 'R. 2, 3901 - ZC1-002, Matupá - MT, 78525-000', '2025-10-14 22:35:13.435619+00'),
('500a17ab-2c41-4374-9ce3-ee04f2b83419', 'HOTEL VITÓRIA RÉGIA - RIO VERDE GO', '(64) 3611-4100', NULL, NULL, NULL, 'R. Rosulino Ferreira Guimarães, 621 - Centro, Rio Verde - GO, 75901-265', '2025-10-14 22:35:13.435619+00'),
('5f417335-75be-41fc-84c8-fca6543c3f18', 'HOTEL BIANCH - PRIMAVERA DO LESTE', '(66) 3498-1862', NULL, NULL, NULL, 'Av São João, 785 - centro - Primavera do Leste - MT', '2025-10-14 22:35:13.435619+00'),
('716a7737-ff76-4d4b-838d-bc19705e5ff0', 'HOTEL SANTOS DUMONT - GOIÂNIA', '(62) 98246-2734', NULL, NULL, NULL, 'Av. Santos Dumont, 1001 - Santa Genoveva, Goiânia - GO, 74672-420', '2025-10-14 22:35:13.435619+00'),
('7984c3a6-8f5f-463e-9f1b-bb8b3eb4a0b4', 'PLAZA HOTEL - ÁGUA BOA', '(66) 99621-4502', NULL, NULL, NULL, 'R. Três, 292 - Centro, Água Boa - MT, 78635-000', '2025-10-14 22:35:13.435619+00'),
('84287178-45af-4594-a0f4-7ffd6f65767e', 'Plaza Hotel', '66 99621-4502', NULL, '205.00', '310.00', 'R. Três, 292 - Centro - Água Boa - MT', '2025-10-14 22:35:13.435619+00'),
('87b86fdb-38e8-4456-b647-10ac8fe902ea', 'PLAZA HOTEL - MINEIROS GO', '(64) 9950-2853', NULL, NULL, NULL, 'BR-364 - Zona Rural, Mineiros - GO, 75830-000', '2025-10-14 22:35:13.435619+00'),
('8be78f27-e8f2-4492-af57-d67d62137b01', 'HOLIDAY INN ANHEMBI - SÃO PAULO', '(11) 2107-8844', NULL, NULL, NULL, 'Rua Professor Milton Rodriguez #100 - Parque Anhembi, São Paulo - SP, 02009-040', '2025-10-14 22:35:13.435619+00'),
('923f2255-2693-43b3-9364-fe1b7da545d1', 'FLAMBOYANT - PORTO VELHO', '(69) 3225-2102', NULL, NULL, NULL, 'Av. Tiradentes, 2979 - Industrial, Porto Velho - RO, 76821-001', '2025-10-14 22:35:13.435619+00'),
('a21816c7-b6c2-4307-9bc0-4c37c8412c7c', 'HOTEL ANA DÁLIA - SORRISO', '(66) 99726-8050', NULL, NULL, NULL, 'Av. Luiz Amadeu Lodi, 1395 - Bom Jesus, Sorriso - MT, 78896-130', '2025-10-14 22:35:13.435619+00'),
('a356a42c-ef9e-4d7d-b105-37fcadb9c2ed', 'HOTEL ACAPU - RIO VERDE GO', '(64) 3612-1095', NULL, NULL, NULL, 'Rua Demolíncio de Carvalho, Quadra O, Lotes 8 ao 15 - Jardim Brasilia, Rio Verde - GO, 75906-275', '2025-10-14 22:35:13.435619+00'),
('af5b78e5-a79a-46a8-8db8-270d86eb0067', 'HOTEL ECOS CLASSIC - PORTO VELHO', '(69) 2181-5481', NULL, NULL, NULL, 'Rua Paulo Leal, 611, Centro 76804-106 Porto Velho, RO', '2025-10-14 22:35:13.435619+00'),
('bd970a2e-4ae8-4367-b462-85f88fc9b1c0', 'HOTEL TROPICAL - CONFRESA', '(66) 98449-8648', NULL, NULL, NULL, 'Av. Brasil, 627 - Jardim do Éden, Confresa - MT, 78652-000', '2025-10-14 22:35:13.435619+00'),
('bf59a1c0-6818-4915-a409-bbce14f3ff49', 'LIBERTE PALACE HOTEL - RIO VERDE GO', '(64) 3613-2607', NULL, NULL, NULL, 'Perímetro Urbano 388, BR-060, Rio Verde - GO, 75904-900', '2025-10-14 22:35:13.435619+00'),
('c1252dca-a3a2-4de6-a56c-00cd12d32d8f', 'HOTEL HLN - SÃO PAULO', '(11) 99462-9412', NULL, NULL, NULL, 'R. Cel. Antônio de Carvalho, 269 - Santana, São Paulo - SP, 02032-030', '2025-10-14 22:35:13.435619+00'),
('c23d0e51-5b57-436a-be21-f2510dc08928', 'NEW PLAZA HOTEL - BALSAS', '(99) 98812-1274', NULL, NULL, NULL, 'Av. Dr. José Bernandino, Nº 69 - Centro, Balsas - MA, 65800-000', '2025-10-14 22:35:13.435619+00'),
('c72fa651-2122-4aed-b4b0-f98bf4125245', 'BATISTELA HOTEL - PRIMAVERA DO LESTE', '(66) 99930-1095', NULL, NULL, NULL, 'Av. Campo Grande, 905 - Jardim Riva, Primavera do Leste - MT, 78850-000', '2025-10-14 22:35:13.435619+00'),
('c91fd75a-bc36-4b18-9e66-d108e0e94bee', 'Hotel Líder', '66 9229-5148', NULL, '140.00', '190.00', 'R. Dez - Centro - Água Boa - MT', '2025-10-14 22:35:13.435619+00'),
('cce3f0fd-6669-4e9c-ba25-643cc3393d4b', 'HOTEL RIOS - BALSAS', '(99) 98529-9393', NULL, NULL, NULL, 'Av. Gov. Luiz Rocha, N° 216 - Potosi, Balsas - MA, 65800-000', '2025-10-14 22:35:13.435619+00'),
('d80ce2f4-a3f6-41e4-8437-466b3cdfe2f1', 'SEDNA PALACE - GUARANTÃ', '(66) 3552-2500', NULL, NULL, NULL, 'Av. Pioneiro Jose Nelson Coutinho, 875 - Centro, Guarantã do Norte - MT, 78520-000', '2025-10-14 22:35:13.435619+00'),
('d9977be4-4e96-4b75-a454-ebcd45308727', 'HOTEL ESPLANADA - GUARANTÃ', '(66) 9668-6689', NULL, NULL, NULL, 'R. Pioneiro Genésio Minetto, 333 - Centro, Guarantã do Norte - MT, 78520-000', '2025-10-14 22:35:13.435619+00'),
('dbc07212-cf6f-4925-baf8-e7b8592ff6d2', 'New Plaza Hotel', '99 98812-1274', NULL, '160.00', '210.00', 'Av. Dr. José Bernardino, 69 - Balsas - MA', '2025-10-14 22:35:13.435619+00'),
('dd27f42e-fa98-4ea2-8a14-66ee0810e9b9', 'COMERCIAL FIT TRANSAMERICA - SORRISO', '(66) 3545-2900', NULL, NULL, NULL, 'Av. Blumenau, 2235 - Bela Vista, Sorriso - MT, 78890-001', '2025-10-14 22:35:13.435619+00'),
('e70b2ccc-c680-42a4-88df-823dadeea21d', 'HOTEL LIDER - ÁGUA BOA', '(66) 9229-5148', NULL, NULL, NULL, 'R. Dez - Centro, Água Boa - MT, 78635-000', '2025-10-14 22:35:13.435619+00'),
('e98aa79f-6e39-4fb6-84ea-02e18049b0d6', 'IBIS ERECHIM', '(54) 3712-0443', NULL, NULL, NULL, 'R. Carlos Miranda, 71 - Fátima, Erechim - RS, 99709-292', '2025-10-14 22:35:13.435619+00'),
('f5c47a88-a6eb-40a3-905a-3bce8c0659af', 'HOTEL VIVENDAS - ERECHIM', '(54) 3522-4100', NULL, NULL, NULL, 'Av. Caldas Júnior, 1740 - Boa Vista, Erechim - RS, 99714-050', '2025-10-14 22:35:13.435619+00'),
('f939fc00-fb45-4686-bdf6-18b1bc5270da', 'HOTEL REAL - CONFRESA', '(66) 98404-4931', NULL, NULL, NULL, 'Av. Airton Senna, 34 - Centro, Confresa - MT, 78652-000', '2025-10-14 22:35:13.435619+00'),
('fe5eb04f-864a-4ba9-9d13-389121ddaa4b', 'TRANSAMERICA RONDONÓPOLIS', '(66) 99292-6835', NULL, NULL, NULL, 'Av. Lions Internacional, 1235 - Vila Aurora I, Rondonópolis - MT, 78740-046', '2025-10-14 22:35:13.435619+00'),
('fe876118-e079-4166-acf3-979c97ccf647', 'TRANSAMERICA LUCAS - LUCAS DO RIO VERDE', '(65) 99663-6888', NULL, NULL, NULL, 'Av. das Acácias, 2425W - Parque das Emas, Lucas do Rio Verde - MT, 78455-000', '2025-10-14 22:35:13.435619+00');
