-- ============================================
-- Table: travel_reports
-- ============================================
CREATE TABLE IF NOT EXISTS public.travel_reports (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  numero text NOT NULL UNIQUE,
  aeronave text NOT NULL,
  tripulante text NOT NULL,
  tripulante2 text NULL,
  destino text NOT NULL,
  data_inicio date NOT NULL,
  data_fim date NOT NULL,
  observacoes text NULL,
  total_combustivel numeric(10, 2) DEFAULT 0,
  total_hospedagem numeric(10, 2) DEFAULT 0,
  total_alimentacao numeric(10, 2) DEFAULT 0,
  total_transporte numeric(10, 2) DEFAULT 0,
  total_outros numeric(10, 2) DEFAULT 0,
  total_tripulante numeric(10, 2) DEFAULT 0,
  total_cliente numeric(10, 2) DEFAULT 0,
  total_share_brasil numeric(10, 2) DEFAULT 0,
  valor_total numeric(10, 2) DEFAULT 0,
  created_by uuid NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  status text DEFAULT 'draft',
  pdf_path text NULL,
  report_number text NOT NULL DEFAULT '',
  client_id uuid NULL,
  aircraft_id uuid NULL,
  pdf_url text NULL,
  CONSTRAINT travel_reports_pkey PRIMARY KEY (id),
  CONSTRAINT travel_reports_numero_key UNIQUE (numero),
  CONSTRAINT travel_reports_aircraft_id_fkey FOREIGN KEY (aircraft_id) REFERENCES public.aircraft (id) ON DELETE SET NULL,
  CONSTRAINT travel_reports_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.clients (id) ON DELETE SET NULL,
  CONSTRAINT travel_reports_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users (id) ON DELETE SET NULL
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_travel_reports_numero ON public.travel_reports USING btree (numero);
CREATE INDEX IF NOT EXISTS idx_travel_reports_aeronave ON public.travel_reports USING btree (aeronave);
CREATE INDEX IF NOT EXISTS idx_travel_reports_data_inicio ON public.travel_reports USING btree (data_inicio DESC);
CREATE INDEX IF NOT EXISTS idx_travel_reports_pdf_path ON public.travel_reports USING btree (pdf_path) WHERE (pdf_path IS NOT NULL);
CREATE INDEX IF NOT EXISTS idx_travel_reports_created_by ON public.travel_reports USING btree (created_by);
CREATE INDEX IF NOT EXISTS idx_travel_reports_client_id ON public.travel_reports USING btree (client_id);

-- Create trigger for updated_at
CREATE TRIGGER travel_reports_update_updated_at
BEFORE UPDATE ON public.travel_reports
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- Enable RLS on travel_reports table
-- ============================================
ALTER TABLE public.travel_reports ENABLE ROW LEVEL SECURITY;

-- ============================================
-- Policy: Allow authenticated users to SELECT travel_reports
-- ============================================
CREATE POLICY "travel_reports_select_authenticated" ON public.travel_reports
  FOR SELECT
  TO authenticated
  USING (true);

-- ============================================
-- Policy: Allow authenticated users to INSERT travel_reports
-- ============================================
CREATE POLICY "travel_reports_insert_authenticated" ON public.travel_reports
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- ============================================
-- Policy: Allow authenticated users to UPDATE travel_reports
-- ============================================
CREATE POLICY "travel_reports_update_authenticated" ON public.travel_reports
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ============================================
-- Policy: Allow authenticated users to DELETE travel_reports
-- ============================================
CREATE POLICY "travel_reports_delete_authenticated" ON public.travel_reports
  FOR DELETE
  TO authenticated
  USING (true);
