-- ============================================
-- Enable RLS on user_roles table
-- ============================================
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- ============================================
-- Helper function to check if user has admin roles
-- ============================================
CREATE OR REPLACE FUNCTION is_admin_role()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
    AND ur.role IN ('admin', 'gestor_master', 'financeiro_master')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- Policy: Allow SELECT for admin roles
-- ============================================
CREATE POLICY "user_roles_select_admin" ON public.user_roles
  FOR SELECT
  USING (is_admin_role());

-- ============================================
-- Policy: Allow INSERT for admin roles
-- ============================================
CREATE POLICY "user_roles_insert_admin" ON public.user_roles
  FOR INSERT
  WITH CHECK (is_admin_role());

-- ============================================
-- Policy: Allow UPDATE for admin roles
-- ============================================
CREATE POLICY "user_roles_update_admin" ON public.user_roles
  FOR UPDATE
  USING (is_admin_role())
  WITH CHECK (is_admin_role());

-- ============================================
-- Policy: Allow DELETE for admin roles
-- ============================================
CREATE POLICY "user_roles_delete_admin" ON public.user_roles
  FOR DELETE
  USING (is_admin_role());

-- ============================================
-- Grant execute permission to authenticated users
-- ============================================
GRANT EXECUTE ON FUNCTION is_admin_role() TO authenticated;
GRANT EXECUTE ON FUNCTION is_admin_role() TO anon;
