/*
  # Atualizar campos opcionais em flight_schedules

  1. Alterações
    - Tornar flight_time opcional (remover NOT NULL)
    - Tornar destination opcional (remover NOT NULL)
    - client_id já é opcional
    - passengers já tem valor padrão
  
  2. Segurança
    - Mantém as políticas RLS existentes
    - Permite que qualquer usuário autenticado crie e modifique agendamentos
*/

-- Tornar flight_time opcional
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'flight_schedules' 
    AND column_name = 'flight_time'
    AND is_nullable = 'NO'
  ) THEN
    ALTER TABLE public.flight_schedules ALTER COLUMN flight_time DROP NOT NULL;
  END IF;
END $$;

-- Tornar destination opcional
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'flight_schedules' 
    AND column_name = 'destination'
    AND is_nullable = 'NO'
  ) THEN
    ALTER TABLE public.flight_schedules ALTER COLUMN destination DROP NOT NULL;
  END IF;
END $$;