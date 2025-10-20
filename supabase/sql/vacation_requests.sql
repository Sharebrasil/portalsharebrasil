-- Create table for vacation requests
create table if not exists public.vacation_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.user_profiles (id) on delete cascade,
  start_date date not null,
  end_date date not null,
  days integer not null check (days > 0),
  status text not null default 'pending' check (status in ('pending','approved','rejected','cancelled')),
  remarks text,
  approver_id uuid null references public.user_profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz null
);

create index if not exists vacation_requests_user_id_idx on public.vacation_requests (user_id);
create index if not exists vacation_requests_created_at_idx on public.vacation_requests (created_at desc);

alter table public.vacation_requests enable row level security;

-- Owner can see and create own requests
create policy if not exists vacation_requests_select_own
  on public.vacation_requests for select
  using (auth.uid() = user_id);

create policy if not exists vacation_requests_insert_own
  on public.vacation_requests for insert
  with check (auth.uid() = user_id);

-- Admin and masters can manage all
create policy if not exists vacation_requests_read_admin
  on public.vacation_requests for select
  using (
    exists (
      select 1 from public.user_roles ur
      where ur.user_id = auth.uid() and ur.role in ('admin','gestor_master','financeiro_master')
    )
  );

create policy if not exists vacation_requests_update_admin
  on public.vacation_requests for update
  using (
    exists (
      select 1 from public.user_roles ur
      where ur.user_id = auth.uid() and ur.role in ('admin','gestor_master','financeiro_master')
    )
  )
  with check (
    exists (
      select 1 from public.user_roles ur
      where ur.user_id = auth.uid() and ur.role in ('admin','gestor_master','financeiro_master')
    )
  );
