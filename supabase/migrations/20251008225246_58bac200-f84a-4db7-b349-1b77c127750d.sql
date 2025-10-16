-- Add fields to aircraft table for monthly tracking
ALTER TABLE public.aircraft
ADD COLUMN IF NOT EXISTS cell_hours_before NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS cell_hours_current NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS cell_hours_prev NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS horimeter_start NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS horimeter_end NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS horimeter_active NUMERIC DEFAULT 0;

-- Create monthly_diary_closures table
CREATE TABLE IF NOT EXISTS public.monthly_diary_closures (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  aircraft_id UUID NOT NULL REFERENCES public.aircraft(id) ON DELETE CASCADE,
  month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
  year INTEGER NOT NULL,
  total_hours NUMERIC NOT NULL DEFAULT 0,
  total_landings INTEGER NOT NULL DEFAULT 0,
  total_fuel_added NUMERIC NOT NULL DEFAULT 0,
  closing_observations TEXT,
  closed_by UUID REFERENCES auth.users(id),
  closed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(aircraft_id, month, year)
);

-- Enable RLS
ALTER TABLE public.monthly_diary_closures ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Allow all operations on monthly_diary_closures"
ON public.monthly_diary_closures
FOR ALL
USING (true)
WITH CHECK (true);

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_monthly_closures_aircraft_date 
ON public.monthly_diary_closures(aircraft_id, year, month);