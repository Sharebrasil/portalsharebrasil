-- Políticas RLS para o bucket profile-avatar
-- Permitir que usuários vejam seus próprios avatares
CREATE POLICY "Users can view own avatar"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'profile-avatar' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Permitir que usuários façam upload de seus próprios avatares
CREATE POLICY "Users can upload own avatar"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'profile-avatar'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Permitir que usuários atualizem seus próprios avatares
CREATE POLICY "Users can update own avatar"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'profile-avatar'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Permitir que usuários excluam seus próprios avatares
CREATE POLICY "Users can delete own avatar"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'profile-avatar'
  AND auth.uid()::text = (storage.foldername(name))[1]
);