-- Create aircraft table
CREATE TABLE public.aircraft (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  registration TEXT NOT NULL UNIQUE,
  model TEXT NOT NULL,
  manufacturer TEXT,
  status TEXT DEFAULT 'Ativa' CHECK (status IN ('Ativa', 'Inativa', 'Manutenção')),
  fuel_consumption NUMERIC,
  total_hours NUMERIC DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create logbook_entries table
CREATE TABLE public.logbook_entries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  aircraft_id UUID NOT NULL REFERENCES public.aircraft(id) ON DELETE CASCADE,
  entry_date DATE NOT NULL,
  departure_airport TEXT NOT NULL,
  arrival_airport TEXT NOT NULL,
  departure_time TIME NOT NULL,
  arrival_time TIME NOT NULL,
  flight_time_hours NUMERIC NOT NULL,
  flight_time_minutes NUMERIC NOT NULL,
  night_time_hours NUMERIC DEFAULT 0,
  night_time_minutes NUMERIC DEFAULT 0,
  total_time NUMERIC NOT NULL,
  ifr_count INTEGER DEFAULT 0,
  landings INTEGER DEFAULT 1,
  fuel_added NUMERIC DEFAULT 0,
  fuel_liters NUMERIC,
  fuel_cell NUMERIC,
  pc NUMERIC,
  isc TEXT,
  daily_rate NUMERIC,
  extras TEXT,
  flight_type TEXT,
  remarks TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.aircraft ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.logbook_entries ENABLE ROW LEVEL SECURITY;

-- Create policies for aircraft
CREATE POLICY "Allow all operations on aircraft" 
ON public.aircraft 
FOR ALL 
USING (true) 
WITH CHECK (true);

-- Create policies for logbook_entries
CREATE POLICY "Allow all operations on logbook_entries" 
ON public.logbook_entries 
FOR ALL 
USING (true) 
WITH CHECK (true);

-- Create trigger for updated_at
CREATE TRIGGER update_aircraft_updated_at
BEFORE UPDATE ON public.aircraft
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_logbook_entries_updated_at
BEFORE UPDATE ON public.logbook_entries
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Function to update aircraft total hours
CREATE OR REPLACE FUNCTION update_aircraft_total_hours()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.aircraft
  SET total_hours = (
    SELECT COALESCE(SUM(total_time), 0)
    FROM public.logbook_entries
    WHERE aircraft_id = NEW.aircraft_id
  )
  WHERE id = NEW.aircraft_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update aircraft total hours
CREATE TRIGGER update_aircraft_hours_on_entry
AFTER INSERT OR UPDATE OR DELETE ON public.logbook_entries
FOR EACH ROW
EXECUTE FUNCTION update_aircraft_total_hours();