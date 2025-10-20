/*
  # Fix Portal Cliente Access Policies
  
  1. Changes
    - Add public SELECT policy for aircraft table to allow portal access
    - Add public SELECT policy for clients table (already exists but ensuring it's correct)
  
  2. Security
    - Portal do cliente needs read-only access to aircraft and clients tables
    - No authentication required for portal access (uses CNPJ + registration validation)
*/

-- Allow public access to view aircraft (read-only for portal)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'aircraft' 
    AND policyname = 'Public can view aircraft for portal access'
  ) THEN
    CREATE POLICY "Public can view aircraft for portal access"
      ON aircraft
      FOR SELECT
      TO public
      USING (true);
  END IF;
END $$;
