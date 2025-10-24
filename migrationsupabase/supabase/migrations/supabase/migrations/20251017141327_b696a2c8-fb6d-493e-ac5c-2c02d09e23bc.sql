-- Add financeiro_master role if not exists
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_role') THEN
    CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');
  END IF;
END $$;

-- Add new roles to existing enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'financeiro_master';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'piloto_chefe';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'operacoes';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'financeiro';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'cotista';

-- Create salaries table for fixed salaries
CREATE TABLE IF NOT EXISTS public.salaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  gross_salary NUMERIC NOT NULL DEFAULT 0,
  net_salary NUMERIC NOT NULL DEFAULT 0,
  benefits TEXT,
  position TEXT,
  department TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE public.salaries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin and financeiro_master can view all salaries"
  ON public.salaries FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'financeiro_master')
    )
  );

CREATE POLICY "Admin and financeiro_master can manage salaries"
  ON public.salaries FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'financeiro_master')
    )
  );

-- Create aircraft hourly rates table
CREATE TABLE IF NOT EXISTS public.aircraft_hourly_rates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  aircraft_id UUID REFERENCES public.aircraft(id) ON DELETE CASCADE NOT NULL,
  hourly_rate NUMERIC NOT NULL DEFAULT 0,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(aircraft_id)
);

ALTER TABLE public.aircraft_hourly_rates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin and financeiro_master can view aircraft rates"
  ON public.aircraft_hourly_rates FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'financeiro_master')
    )
  );

CREATE POLICY "Admin and financeiro_master can manage aircraft rates"
  ON public.aircraft_hourly_rates FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'financeiro_master')
    )
  );

-- Create flight payments table
CREATE TABLE IF NOT EXISTS public.flight_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  crew_member_id UUID REFERENCES public.crew_members(id) ON DELETE CASCADE NOT NULL,
  month INTEGER NOT NULL,
  year INTEGER NOT NULL,
  total_hours NUMERIC NOT NULL DEFAULT 0,
  calculated_amount NUMERIC NOT NULL DEFAULT 0,
  final_amount NUMERIC NOT NULL DEFAULT 0,
  observations TEXT,
  paid_at DATE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(crew_member_id, month, year)
);

ALTER TABLE public.flight_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin and financeiro_master can view flight payments"
  ON public.flight_payments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'financeiro_master')
    )
  );

CREATE POLICY "Admin and financeiro_master can manage flight payments"
  ON public.flight_payments FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'financeiro_master')
    )
  );

-- Create crew flight hours tracking (detailed breakdown by aircraft)
CREATE TABLE IF NOT EXISTS public.crew_flight_hours (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  crew_member_id UUID REFERENCES public.crew_members(id) ON DELETE CASCADE NOT NULL,
  aircraft_id UUID REFERENCES public.aircraft(id) ON DELETE CASCADE NOT NULL,
  total_hours NUMERIC NOT NULL DEFAULT 0,
  total_pic_hours NUMERIC NOT NULL DEFAULT 0,
  total_sic_hours NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(crew_member_id, aircraft_id)
);

ALTER TABLE public.crew_flight_hours ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view crew flight hours"
  ON public.crew_flight_hours FOR SELECT
  USING (true);

CREATE POLICY "Admin and piloto_chefe can manage crew flight hours"
  ON public.crew_flight_hours FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'piloto_chefe')
    )
  );

-- Create payslips table
CREATE TABLE IF NOT EXISTS public.payslips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  month INTEGER NOT NULL,
  year INTEGER NOT NULL,
  file_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  caption TEXT,
  uploaded_by UUID REFERENCES auth.users(id) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.payslips ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own payslips"
  ON public.payslips FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admin and financeiro_master can view all payslips"
  ON public.payslips FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'financeiro_master')
    )
  );

CREATE POLICY "Admin and financeiro_master can manage payslips"
  ON public.payslips FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'financeiro_master')
    )
  );

-- Create trigger to update crew flight hours from logbook entries
CREATE OR REPLACE FUNCTION public.update_crew_flight_hours()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  pic_crew_id UUID;
  sic_crew_id UUID;
BEGIN
  -- Find PIC crew member by CANAC
  IF NEW.pc IS NOT NULL AND NEW.pc != '' THEN
    SELECT id INTO pic_crew_id FROM public.crew_members WHERE canac = NEW.pc;
    
    IF pic_crew_id IS NOT NULL THEN
      INSERT INTO public.crew_flight_hours (crew_member_id, aircraft_id, total_hours, total_pic_hours)
      VALUES (pic_crew_id, NEW.aircraft_id, NEW.total_time, NEW.total_time)
      ON CONFLICT (crew_member_id, aircraft_id) 
      DO UPDATE SET
        total_hours = crew_flight_hours.total_hours + NEW.total_time,
        total_pic_hours = crew_flight_hours.total_pic_hours + NEW.total_time,
        updated_at = now();
    END IF;
  END IF;

  -- Find SIC crew member by CANAC
  IF NEW.isc IS NOT NULL AND NEW.isc != '' THEN
    SELECT id INTO sic_crew_id FROM public.crew_members WHERE canac = NEW.isc;
    
    IF sic_crew_id IS NOT NULL THEN
      INSERT INTO public.crew_flight_hours (crew_member_id, aircraft_id, total_hours, total_sic_hours)
      VALUES (sic_crew_id, NEW.aircraft_id, NEW.total_time, NEW.total_time)
      ON CONFLICT (crew_member_id, aircraft_id)
      DO UPDATE SET
        total_hours = crew_flight_hours.total_hours + NEW.total_time,
        total_sic_hours = crew_flight_hours.total_sic_hours + NEW.total_time,
        updated_at = now();
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- Create trigger on logbook_entries
DROP TRIGGER IF EXISTS update_crew_hours_trigger ON public.logbook_entries;
CREATE TRIGGER update_crew_hours_trigger
  AFTER INSERT ON public.logbook_entries
  FOR EACH ROW
  EXECUTE FUNCTION public.update_crew_flight_hours();

-- Create updated_at trigger for new tables
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
begin
  new.updated_at := timezone('utc', now());
  return new;
end $$ language plpgsql;

CREATE TRIGGER handle_salaries_updated_at BEFORE UPDATE ON public.salaries
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_aircraft_hourly_rates_updated_at BEFORE UPDATE ON public.aircraft_hourly_rates
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_flight_payments_updated_at BEFORE UPDATE ON public.flight_payments
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_payslips_updated_at BEFORE UPDATE ON public.payslips
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();