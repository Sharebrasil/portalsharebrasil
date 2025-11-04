-- ============================================
-- Table: employee_salaries
-- ============================================
CREATE TABLE IF NOT EXISTS public.employee_salaries (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  position text,
  department text,
  gross_salary numeric(10, 2) NOT NULL,
  net_salary numeric(10, 2),
  benefits text,
  effective_date date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT employee_salaries_pkey PRIMARY KEY (id),
  CONSTRAINT employee_salaries_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users (id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_employee_salaries_user_id ON public.employee_salaries USING btree (user_id);
CREATE INDEX IF NOT EXISTS idx_employee_salaries_effective_date ON public.employee_salaries USING btree (effective_date);

-- ============================================
-- Enable RLS on employee_salaries table
-- ============================================
ALTER TABLE public.employee_salaries ENABLE ROW LEVEL SECURITY;

-- ============================================
-- Policy: Allow SELECT for authenticated users (own data)
-- ============================================
CREATE POLICY "employee_salaries_select_own" ON public.employee_salaries
  FOR SELECT
  USING (auth.uid() = user_id);

-- ============================================
-- Policy: Allow SELECT for admin roles
-- ============================================
CREATE POLICY "employee_salaries_select_admin" ON public.employee_salaries
  FOR SELECT
  USING (is_admin_role());

-- ============================================
-- Policy: Allow INSERT for admin roles
-- ============================================
CREATE POLICY "employee_salaries_insert_admin" ON public.employee_salaries
  FOR INSERT
  WITH CHECK (is_admin_role());

-- ============================================
-- Policy: Allow UPDATE for admin roles
-- ============================================
CREATE POLICY "employee_salaries_update_admin" ON public.employee_salaries
  FOR UPDATE
  USING (is_admin_role())
  WITH CHECK (is_admin_role());

-- ============================================
-- Policy: Allow DELETE for admin roles
-- ============================================
CREATE POLICY "employee_salaries_delete_admin" ON public.employee_salaries
  FOR DELETE
  USING (is_admin_role());
