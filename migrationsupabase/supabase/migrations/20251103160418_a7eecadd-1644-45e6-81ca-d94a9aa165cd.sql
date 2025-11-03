-- Tabela de relatórios de viagem
CREATE TABLE IF NOT EXISTS public.travel_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  numero TEXT NOT NULL UNIQUE,
  cliente TEXT NOT NULL,
  aeronave TEXT NOT NULL,
  tripulante TEXT NOT NULL,
  tripulante2 TEXT,
  destino TEXT NOT NULL,
  data_inicio DATE NOT NULL,
  data_fim DATE NOT NULL,
  observacoes TEXT,
  total_combustivel NUMERIC DEFAULT 0,
  total_hospedagem NUMERIC DEFAULT 0,
  total_alimentacao NUMERIC DEFAULT 0,
  total_transporte NUMERIC DEFAULT 0,
  total_outros NUMERIC DEFAULT 0,
  total_tripulante NUMERIC DEFAULT 0,
  total_cliente NUMERIC DEFAULT 0,
  total_share_brasil NUMERIC DEFAULT 0,
  valor_total NUMERIC DEFAULT 0,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabela de despesas de viagem
CREATE TABLE IF NOT EXISTS public.travel_expenses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  travel_report_id UUID NOT NULL REFERENCES public.travel_reports(id) ON DELETE CASCADE,
  categoria TEXT NOT NULL,
  descricao TEXT NOT NULL,
  valor NUMERIC NOT NULL,
  pago_por TEXT NOT NULL,
  comprovante_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.travel_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.travel_expenses ENABLE ROW LEVEL SECURITY;

-- Policies for travel_reports
CREATE POLICY "Authenticated users can view travel reports"
  ON public.travel_reports FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can create travel reports"
  ON public.travel_reports FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update travel reports"
  ON public.travel_reports FOR UPDATE
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete travel reports"
  ON public.travel_reports FOR DELETE
  USING (auth.uid() IS NOT NULL);

-- Policies for travel_expenses
CREATE POLICY "Authenticated users can view travel expenses"
  ON public.travel_expenses FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can create travel expenses"
  ON public.travel_expenses FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update travel expenses"
  ON public.travel_expenses FOR UPDATE
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete travel expenses"
  ON public.travel_expenses FOR DELETE
  USING (auth.uid() IS NOT NULL);

-- Create storage bucket for travel receipts
INSERT INTO storage.buckets (id, name, public)
VALUES ('travel-receipts', 'travel-receipts', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for travel receipts
CREATE POLICY "Authenticated users can upload travel receipts"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'travel-receipts' AND auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can view travel receipts"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'travel-receipts' AND auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete travel receipts"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'travel-receipts' AND auth.uid() IS NOT NULL);