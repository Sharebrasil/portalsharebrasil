/*
  # Atualizar Permissões e Campos do Diário de Bordo

  1. Alterações nas Tabelas
    - Adicionar campos `verified_by` e `verified_at` em `logbook_entries` (se não existirem)
    - Adicionar tabela `logbook_months` para gerenciar fechamento de mês
    - Adicionar campos de controle de fechamento

  2. Segurança
    - Atualizar políticas RLS para permitir todos os user_roles: tripulante, piloto_chefe, gestor_master, operacoes e admin possam adicionar/editar/excluir trechos
    - Apenas piloto_chefe, admin e gestor_master podem encerrar o mês
    - Após fechamento, apenas gestor_master e admin podem editar

  3. Observações
    - Todos os usuários podem visualizar o diário
    - Fechamento do mês bloqueia edições para usuários comuns
*/

-- Criar tabela logbook_months se não existir
CREATE TABLE IF NOT EXISTS public.logbook_months (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  aircraft_id UUID NOT NULL REFERENCES public.aircraft(id) ON DELETE CASCADE,
  year INTEGER NOT NULL,
  month INTEGER NOT NULL,
  is_closed BOOLEAN DEFAULT FALSE,
  closed_by UUID REFERENCES auth.users(id),
  closed_at TIMESTAMP WITH TIME ZONE,
  closing_observations TEXT,
  cell_hours_start NUMERIC DEFAULT 0,
  cell_hours_end NUMERIC DEFAULT 0,
  hobbs_hours_start NUMERIC DEFAULT 0,
  hobbs_hours_end NUMERIC DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(aircraft_id, year, month)
);

-- Adicionar coluna logbook_month_id em logbook_entries se não existir
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'logbook_entries' AND column_name = 'logbook_month_id'
  ) THEN
    ALTER TABLE public.logbook_entries ADD COLUMN logbook_month_id UUID REFERENCES public.logbook_months(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Adicionar campos de confirmação em logbook_entries se não existirem
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'logbook_entries' AND column_name = 'confirmed'
  ) THEN
    ALTER TABLE public.logbook_entries ADD COLUMN confirmed BOOLEAN DEFAULT FALSE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'logbook_entries' AND column_name = 'confirmed_by'
  ) THEN
    ALTER TABLE public.logbook_entries ADD COLUMN confirmed_by UUID REFERENCES auth.users(id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'logbook_entries' AND column_name = 'confirmed_at'
  ) THEN
    ALTER TABLE public.logbook_entries ADD COLUMN confirmed_at TIMESTAMP WITH TIME ZONE;
  END IF;
END $$;

-- Adicionar campos adicionais para corresponder ao layout da imagem
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'logbook_entries' AND column_name = 'day_time'
  ) THEN
    ALTER TABLE public.logbook_entries ADD COLUMN day_time NUMERIC DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'logbook_entries' AND column_name = 'night_hours'
  ) THEN
    ALTER TABLE public.logbook_entries ADD COLUMN night_hours NUMERIC DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'logbook_entries' AND column_name = 'cell_after'
  ) THEN
    ALTER TABLE public.logbook_entries ADD COLUMN cell_after NUMERIC;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'logbook_entries' AND column_name = 'pic_canac'
  ) THEN
    ALTER TABLE public.logbook_entries ADD COLUMN pic_canac TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'logbook_entries' AND column_name = 'sic_canac'
  ) THEN
    ALTER TABLE public.logbook_entries ADD COLUMN sic_canac TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'logbook_entries' AND column_name = 'flight_number'
  ) THEN
    ALTER TABLE public.logbook_entries ADD COLUMN flight_number TEXT;
  END IF;
END $$;

-- Habilitar RLS
ALTER TABLE public.logbook_months ENABLE ROW LEVEL SECURITY;

-- Função helper para verificar se o usuário tem uma das roles permitidas
CREATE OR REPLACE FUNCTION public.user_has_logbook_role()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role IN ('admin', 'piloto_chefe', 'gestor_master', 'operacoes', 'tripulante')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para verificar se o usuário pode fechar o mês
CREATE OR REPLACE FUNCTION public.user_can_close_month()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role IN ('admin', 'piloto_chefe', 'gestor_master')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para verificar se o usuário pode editar diário fechado
CREATE OR REPLACE FUNCTION public.user_can_edit_closed_logbook()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role IN ('admin', 'gestor_master')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Remover políticas antigas de logbook_entries
DROP POLICY IF EXISTS "Allow all operations on logbook_entries" ON public.logbook_entries;

-- Política de SELECT: Todos os usuários autenticados podem visualizar
CREATE POLICY "logbook_entries_select_policy"
ON public.logbook_entries
FOR SELECT
TO authenticated
USING (true);

-- Política de INSERT: Usuários com roles permitidas podem adicionar
CREATE POLICY "logbook_entries_insert_policy"
ON public.logbook_entries
FOR INSERT
TO authenticated
WITH CHECK (
  user_has_logbook_role()
  AND (
    NOT EXISTS (
      SELECT 1 FROM public.logbook_months
      WHERE id = logbook_month_id AND is_closed = true
    )
    OR user_can_edit_closed_logbook()
  )
);

-- Política de UPDATE: Usuários com roles permitidas podem editar (respeitando fechamento do mês)
CREATE POLICY "logbook_entries_update_policy"
ON public.logbook_entries
FOR UPDATE
TO authenticated
USING (
  user_has_logbook_role()
  AND (
    NOT EXISTS (
      SELECT 1 FROM public.logbook_months
      WHERE id = logbook_month_id AND is_closed = true
    )
    OR user_can_edit_closed_logbook()
  )
)
WITH CHECK (
  user_has_logbook_role()
  AND (
    NOT EXISTS (
      SELECT 1 FROM public.logbook_months
      WHERE id = logbook_month_id AND is_closed = true
    )
    OR user_can_edit_closed_logbook()
  )
);

-- Política de DELETE: Usuários com roles permitidas podem excluir (respeitando fechamento do mês)
CREATE POLICY "logbook_entries_delete_policy"
ON public.logbook_entries
FOR DELETE
TO authenticated
USING (
  user_has_logbook_role()
  AND (
    NOT EXISTS (
      SELECT 1 FROM public.logbook_months
      WHERE id = logbook_month_id AND is_closed = true
    )
    OR user_can_edit_closed_logbook()
  )
);

-- Políticas para logbook_months
CREATE POLICY "logbook_months_select_policy"
ON public.logbook_months
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "logbook_months_insert_policy"
ON public.logbook_months
FOR INSERT
TO authenticated
WITH CHECK (user_has_logbook_role());

CREATE POLICY "logbook_months_update_policy"
ON public.logbook_months
FOR UPDATE
TO authenticated
USING (
  user_has_logbook_role()
  AND (
    NOT is_closed OR user_can_edit_closed_logbook()
  )
)
WITH CHECK (
  user_has_logbook_role()
  AND (
    NOT is_closed OR user_can_close_month()
  )
);

-- Criar trigger para updated_at em logbook_months
CREATE TRIGGER update_logbook_months_updated_at
BEFORE UPDATE ON public.logbook_months
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_logbook_months_aircraft_year_month 
ON public.logbook_months(aircraft_id, year, month);

CREATE INDEX IF NOT EXISTS idx_logbook_entries_month 
ON public.logbook_entries(logbook_month_id);

CREATE INDEX IF NOT EXISTS idx_logbook_entries_date 
ON public.logbook_entries(entry_date);