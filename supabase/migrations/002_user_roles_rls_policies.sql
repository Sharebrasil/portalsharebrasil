-- ============================================
-- Enable RLS on user_roles table
-- ============================================
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- ============================================
-- Helper function to check if user is Admin
-- ============================================
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
    AND ur.role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- Helper function to check if user is Gestor Master
-- ============================================
CREATE OR REPLACE FUNCTION is_gestor_master()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
    AND ur.role = 'gestor_master'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- Helper function to check if user is Financeiro Master
-- ============================================
CREATE OR REPLACE FUNCTION is_financeiro_master()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
    AND ur.role = 'financeiro_master'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- Helper function to check if user has any admin roles
-- ============================================
CREATE OR REPLACE FUNCTION is_admin_role()
RETURNS boolean AS $$
BEGIN
  RETURN is_admin() OR is_gestor_master() OR is_financeiro_master();
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
GRANT EXECUTE ON FUNCTION is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION is_admin() TO anon;
GRANT EXECUTE ON FUNCTION is_gestor_master() TO authenticated;
GRANT EXECUTE ON FUNCTION is_gestor_master() TO anon;
GRANT EXECUTE ON FUNCTION is_financeiro_master() TO authenticated;
GRANT EXECUTE ON FUNCTION is_financeiro_master() TO anon;
GRANT EXECUTE ON FUNCTION is_admin_role() TO authenticated;
GRANT EXECUTE ON FUNCTION is_admin_role() TO anon;

-- ============================================
-- Enable RLS on contacts table
-- ============================================
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;

-- ============================================
-- Policy: Allow authenticated users to SELECT contacts
-- ============================================
CREATE POLICY "contacts_select_authenticated" ON public.contacts
  FOR SELECT
  TO authenticated
  USING (true);

-- ============================================
-- Policy: Allow authenticated users to INSERT contacts
-- ============================================
CREATE POLICY "contacts_insert_authenticated" ON public.contacts
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- ============================================
-- Policy: Allow authenticated users to UPDATE contacts
-- ============================================
CREATE POLICY "contacts_update_authenticated" ON public.contacts
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ============================================
-- Policy: Allow authenticated users to DELETE contacts
-- ============================================
CREATE POLICY "contacts_delete_authenticated" ON public.contacts
  FOR DELETE
  TO authenticated
  USING (true);
