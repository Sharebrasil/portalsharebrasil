-- Create favorite_routes table for storing frequently used flight routes
CREATE TABLE IF NOT EXISTS public.favorite_routes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  departure_airport TEXT NOT NULL,
  arrival_airport TEXT NOT NULL,
  route TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.favorite_routes ENABLE ROW LEVEL SECURITY;

-- Create policy for authenticated users
CREATE POLICY "Allow all operations on favorite_routes"
  ON public.favorite_routes
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Create trigger for updated_at
CREATE TRIGGER update_favorite_routes_updated_at
  BEFORE UPDATE ON public.favorite_routes
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();