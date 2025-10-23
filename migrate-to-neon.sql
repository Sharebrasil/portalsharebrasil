-- Migration script to apply all Supabase migrations to Neon Database
-- Run this script in your Neon database console or via psql

-- First, create the users table with password authentication
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  full_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index on email for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Now apply all migrations from supabase/migrations/ directory
-- You need to manually copy and paste the content of each migration file
-- in chronological order:

-- 1. 20251007020405_5575e3af-b799-42c7-80c1-60527c1b5557.sql
-- 2. 20251008223535_abcc6121-6e73-44e7-861a-fd872bf58b82.sql
-- 3. 20251008225246_58bac200-f84a-4db7-b349-1b77c127750d.sql
-- 4. 20251009012410_7c5cbba8-4fb4-4894-8ba0-bffd6a4a1ad5.sql
-- 5. 20251014191635_e37dfc70-ab67-48c6-ae9e-9cda04d9982e.sql
-- 6. 20251015021425_bf09cc3e-95c6-4480-8026-1825c29b7d76.sql
-- 7. 20251016155556_add_client_logo_and_documents.sql
-- 8. 20251016155716_create_client_files_storage.sql (SKIP - Storage related)
-- 9. 20251017014058_add_observacoes_to_receipts.sql
-- 10. 20251017015804_59f2877e-86db-424d-b01d-5baa0d827f90.sql
-- 11. 20251019023749_55c62253-d5b4-42dc-b3c6-c1f43944d2a2.sql
-- 12. 20251020185341_fix_user_roles_recursion_and_add_vacation_requests.sql
-- 13. 20251020190325_fix_portal_cliente_policies.sql
-- 14. 20251021003010_update_logbook_permissions_and_fields.sql
-- 15. 20251021004600_update_flight_schedules_optional_fields.sql

-- Note: Skip any migration that references:
-- - storage buckets (Neon doesn't have storage)
-- - RLS policies that use auth.uid() (need to modify for custom auth)
-- - Supabase-specific functions like auth.users

-- After running migrations, you'll need to:
-- 1. Remove all "ALTER TABLE ... ENABLE ROW LEVEL SECURITY" statements
-- 2. Remove all "CREATE POLICY" statements (or adapt them)
-- 3. Replace references to auth.users with users table
-- 4. Replace references to auth.uid() with your custom user ID logic
