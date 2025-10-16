/*
  # Add logo and documents support for clients

  1. Changes to clients table
    - Add `logo_url` column to store client logo
    - Add `documents` jsonb column to store array of document metadata
  
  2. Security
    - No RLS changes needed as clients table inherits existing policies
  
  3. Notes
    - Documents will be stored in Supabase Storage
    - The documents column will store metadata (name, url, type, uploaded_at)
*/

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'clients' AND column_name = 'logo_url'
  ) THEN
    ALTER TABLE clients ADD COLUMN logo_url text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'clients' AND column_name = 'documents'
  ) THEN
    ALTER TABLE clients ADD COLUMN documents jsonb DEFAULT '[]'::jsonb;
  END IF;
END $$;