/*
  # Fix user_roles recursion and add vacation_requests table

  1. Changes
    - Drop problematic RLS policy causing infinite recursion on user_roles
    - Create vacation_requests table with proper RLS policies
    
  2. Security
    - Users can view and create their own vacation requests
    - Admins/masters can manage all vacation requests
*/

-- Drop the policy causing infinite recursion
DROP POLICY IF EXISTS "Admins and masters can view all roles" ON public.user_roles;

-- Create vacation_requests table
CREATE TABLE IF NOT EXISTS public.vacation_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.user_profiles (id) ON DELETE CASCADE,
  start_date date NOT NULL,
  end_date date NOT NULL,
  days integer NOT NULL CHECK (days > 0),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected','cancelled')),
  remarks text,
  approver_id uuid REFERENCES public.user_profiles (id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz
);

CREATE INDEX IF NOT EXISTS vacation_requests_user_id_idx ON public.vacation_requests (user_id);
CREATE INDEX IF NOT EXISTS vacation_requests_created_at_idx ON public.vacation_requests (created_at DESC);

ALTER TABLE public.vacation_requests ENABLE ROW LEVEL SECURITY;

-- Owner can see and create own requests
CREATE POLICY "Users can view own vacation requests"
  ON public.vacation_requests FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own vacation requests"
  ON public.vacation_requests FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Admin and masters can view all
CREATE POLICY "Admins can view all vacation requests"
  ON public.vacation_requests FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid() 
      AND ur.role IN ('admin','gestor_master','financeiro_master')
    )
  );

-- Admin and masters can update all
CREATE POLICY "Admins can update vacation requests"
  ON public.vacation_requests FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid() 
      AND ur.role IN ('admin','gestor_master','financeiro_master')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid() 
      AND ur.role IN ('admin','gestor_master','financeiro_master')
    )
  );