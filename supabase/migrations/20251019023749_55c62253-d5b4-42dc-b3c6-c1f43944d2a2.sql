-- Add employee-related fields to user_profiles
ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS admission_date DATE,
ADD COLUMN IF NOT EXISTS salary NUMERIC(10, 2),
ADD COLUMN IF NOT EXISTS benefits TEXT,
ADD COLUMN IF NOT EXISTS cpf TEXT,
ADD COLUMN IF NOT EXISTS rg TEXT,
ADD COLUMN IF NOT EXISTS birth_date DATE,
ADD COLUMN IF NOT EXISTS bank_data JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS employment_status TEXT DEFAULT 'ativo',
ADD COLUMN IF NOT EXISTS is_authenticated_user BOOLEAN DEFAULT true;

-- Create employee_documents table
CREATE TABLE IF NOT EXISTS public.employee_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  document_name TEXT NOT NULL,
  document_type TEXT NOT NULL,
  file_url TEXT,
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create employee_vacations table
CREATE TABLE IF NOT EXISTS public.employee_vacations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  days_count INTEGER NOT NULL,
  status TEXT DEFAULT 'pendente',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.employee_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_vacations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for employee_documents
CREATE POLICY "Admin and managers can view all employee documents"
ON public.employee_documents FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role IN ('admin', 'gestor_master', 'financeiro_master')
  )
  OR employee_id = auth.uid()
);

CREATE POLICY "Admin and managers can insert employee documents"
ON public.employee_documents FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role IN ('admin', 'gestor_master', 'financeiro_master')
  )
);

CREATE POLICY "Admin and managers can update employee documents"
ON public.employee_documents FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role IN ('admin', 'gestor_master', 'financeiro_master')
  )
);

CREATE POLICY "Admin and managers can delete employee documents"
ON public.employee_documents FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role IN ('admin', 'gestor_master', 'financeiro_master')
  )
);

-- RLS Policies for employee_vacations
CREATE POLICY "Admin and managers can view all employee vacations"
ON public.employee_vacations FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role IN ('admin', 'gestor_master', 'financeiro_master')
  )
  OR employee_id = auth.uid()
);

CREATE POLICY "Admin and managers can insert employee vacations"
ON public.employee_vacations FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role IN ('admin', 'gestor_master', 'financeiro_master')
  )
);

CREATE POLICY "Admin and managers can update employee vacations"
ON public.employee_vacations FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role IN ('admin', 'gestor_master', 'financeiro_master')
  )
);

CREATE POLICY "Admin and managers can delete employee vacations"
ON public.employee_vacations FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role IN ('admin', 'gestor_master', 'financeiro_master')
  )
);

-- Add trigger for updated_at
CREATE TRIGGER update_employee_documents_updated_at
  BEFORE UPDATE ON public.employee_documents
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_employee_vacations_updated_at
  BEFORE UPDATE ON public.employee_vacations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();