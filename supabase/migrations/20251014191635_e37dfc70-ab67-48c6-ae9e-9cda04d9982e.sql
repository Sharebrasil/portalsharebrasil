-- Create flight schedules table
CREATE TABLE public.flight_schedules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  aircraft_id UUID REFERENCES public.aircraft(id),
  crew_member_id UUID REFERENCES public.crew_members(id),
  client_id UUID REFERENCES public.clients(id),
  flight_date DATE NOT NULL,
  flight_time TIME NOT NULL,
  origin TEXT NOT NULL,
  destination TEXT NOT NULL,
  estimated_duration TEXT,
  passengers INTEGER DEFAULT 1,
  flight_type TEXT DEFAULT 'executivo',
  contact TEXT,
  observations TEXT,
  status TEXT NOT NULL DEFAULT 'pendente',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create flight plans table
CREATE TABLE public.flight_plans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  flight_schedule_id UUID REFERENCES public.flight_schedules(id) ON DELETE CASCADE,
  aircraft_registration TEXT NOT NULL,
  aircraft_type TEXT,
  flight_rule TEXT,
  flight_type TEXT,
  aircraft_count INTEGER DEFAULT 1,
  wake_category TEXT,
  equipment TEXT,
  departure_airport TEXT NOT NULL,
  departure_time TIMESTAMP WITH TIME ZONE,
  cruise_speed TEXT,
  flight_level TEXT,
  route TEXT,
  destination_airport TEXT NOT NULL,
  total_time TEXT,
  alternate_airport TEXT,
  second_alternate_airport TEXT,
  fuel_endurance TEXT,
  people_on_board INTEGER,
  emergency_radio TEXT,
  survival_equipment TEXT,
  jackets TEXT,
  dinghies_count INTEGER,
  dinghies_capacity INTEGER,
  aircraft_color TEXT,
  remarks TEXT,
  pilot_name TEXT,
  distance_km NUMERIC,
  estimated_flight_time TEXT,
  required_fuel NUMERIC,
  estimated_arrival TIME,
  payload_weight NUMERIC,
  zero_fuel_weight NUMERIC,
  takeoff_weight NUMERIC,
  landing_weight NUMERIC,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create flight checklists table
CREATE TABLE public.flight_checklists (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  flight_plan_id UUID REFERENCES public.flight_plans(id) ON DELETE CASCADE,
  checklist_type TEXT NOT NULL,
  items JSONB NOT NULL DEFAULT '[]',
  completed BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.flight_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.flight_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.flight_checklists ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Allow all operations on flight_schedules"
ON public.flight_schedules FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on flight_plans"
ON public.flight_plans FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on flight_checklists"
ON public.flight_checklists FOR ALL USING (true) WITH CHECK (true);

-- Create trigger for updated_at
CREATE TRIGGER update_flight_schedules_updated_at
BEFORE UPDATE ON public.flight_schedules
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_flight_plans_updated_at
BEFORE UPDATE ON public.flight_plans
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_flight_checklists_updated_at
BEFORE UPDATE ON public.flight_checklists
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();