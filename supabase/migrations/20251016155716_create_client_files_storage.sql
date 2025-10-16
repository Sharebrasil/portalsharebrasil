/*
  # Create storage bucket for client files

  1. New Storage Bucket
    - Creates `client-files` bucket for logos and documents
  
  2. Security
    - Enable RLS on storage bucket
    - Allow authenticated users to upload files
    - Allow public read access to files
  
  3. Notes
    - Stores client logos and documents (CNPJ, contracts, etc.)
*/

INSERT INTO storage.buckets (id, name, public)
VALUES ('client-files', 'client-files', true)
ON CONFLICT (id) DO NOTHING;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Allow authenticated uploads'
  ) THEN
    CREATE POLICY "Allow authenticated uploads"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (bucket_id = 'client-files');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Allow public read access'
  ) THEN
    CREATE POLICY "Allow public read access"
    ON storage.objects FOR SELECT
    TO public
    USING (bucket_id = 'client-files');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Allow authenticated updates'
  ) THEN
    CREATE POLICY "Allow authenticated updates"
    ON storage.objects FOR UPDATE
    TO authenticated
    USING (bucket_id = 'client-files')
    WITH CHECK (bucket_id = 'client-files');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Allow authenticated deletes'
  ) THEN
    CREATE POLICY "Allow authenticated deletes"
    ON storage.objects FOR DELETE
    TO authenticated
    USING (bucket_id = 'client-files');
  END IF;
END $$;