-- Add new fields to aircraft table
ALTER TABLE public.aircraft
ADD COLUMN IF NOT EXISTS manufacturer text,
ADD COLUMN IF NOT EXISTS model text,
ADD COLUMN IF NOT EXISTS serial_number text,
ADD COLUMN IF NOT EXISTS owner_name text;

-- Create aerodromes table
CREATE TABLE IF NOT EXISTS public.aerodromes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  icao_code text NOT NULL UNIQUE,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on aerodromes
ALTER TABLE public.aerodromes ENABLE ROW LEVEL SECURITY;

-- Create policies for aerodromes
CREATE POLICY "Allow all operations on aerodromes"
ON public.aerodromes
FOR ALL
USING (true)
WITH CHECK (true);

-- Add trigger for aerodromes updated_at
CREATE TRIGGER update_aerodromes_updated_at
BEFORE UPDATE ON public.aerodromes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add verified_by field to logbook_entries
ALTER TABLE public.logbook_entries
ADD COLUMN IF NOT EXISTS verified_by uuid REFERENCES public.user_profiles(id),
ADD COLUMN IF NOT EXISTS verified_at timestamp with time zone;