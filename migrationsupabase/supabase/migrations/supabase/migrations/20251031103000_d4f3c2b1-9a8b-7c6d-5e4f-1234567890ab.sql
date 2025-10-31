-- Migration: allow admin and gestor_master to manage user_roles
-- Created: 2025-10-31
-- Purpose: Enable RLS on public.user_roles and create policies so that
-- users who already have role 'admin' OR 'gestor_master' can INSERT (add)
-- user roles. Also provide safe SELECT/UPDATE/DELETE policies aligned with that.

-- IMPORTANT: To bootstrap the first admin/gestor_master use the service_role key
-- (server-side) to INSERT the initial role because RLS will block unauthenticated inserts.

-- Enable row level security
ALTER TABLE IF EXISTS public.user_roles
  ENABLE ROW LEVEL SECURITY;

-- Drop any previous conflicting policies (idempotent)
DROP POLICY IF EXISTS allow_admin_gestor_insert ON public.user_roles;
DROP POLICY IF EXISTS allow_admin_gestor_manage ON public.user_roles;
DROP POLICY IF EXISTS allow_user_select_own_roles ON public.user_roles;

-- Policy: allow users who already have 'admin' or 'gestor_master' to INSERT new roles
CREATE POLICY allow_admin_gestor_insert
  ON public.user_roles
  FOR INSERT
  TO authenticated
  USING (true)
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()::uuid
        AND ur.role IN ('admin', 'gestor_master')
    )
  );

-- Policy: allow admin and gestor_master to UPDATE and DELETE user_roles
CREATE POLICY allow_admin_gestor_manage
  ON public.user_roles
  FOR UPDATE, DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()::uuid
        AND ur.role IN ('admin', 'gestor_master')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()::uuid
        AND ur.role IN ('admin', 'gestor_master')
    )
  );

-- Policy: allow users to SELECT their own roles; admins/gestor_master can view all
CREATE POLICY allow_user_select_own_roles
  ON public.user_roles
  FOR SELECT
  TO authenticated
  USING (
    (
      auth.uid() = user_id
    )
    OR EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()::uuid
        AND ur.role IN ('admin', 'gestor_master')
    )
  );

-- Revoke public INSERT as a safety measure (optional but recommended)
REVOKE INSERT ON public.user_roles FROM public;

-- Example usage notes (run on server or through SDK with appropriate JWT):
-- 1) Bootstrap first admin using service_role (server-side, ignores RLS):
-- INSERT INTO public.user_roles (user_id, role) VALUES ('00000000-0000-0000-0000-000000000000', 'admin');

-- 2) As an authenticated user that already has 'admin' or 'gestor_master' you can add a role
--    by calling the Supabase client or executing an INSERT; the policy will allow it.

-- 3) If you prefer to rely on JWT claims instead of querying user_roles inside policies,
--    replace the EXISTS(...) checks with e.g. current_setting('jwt.claims.role', true) LIKE '%admin%'

-- End migration
