-- Five-stage client journey. Legal rules remain preliminary until a staff member confirms them.
create type public.bankruptcy_route as enum ('mfc', 'court', 'consultation');

create table public.client_diagnostics (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null unique references public.cases(id) on delete cascade,
  total_debt numeric(14,2) not null check (total_debt >= 0),
  creditor_count smallint not null check (creditor_count >= 0),
  has_only_home boolean not null default false,
  has_car boolean not null default false,
  monthly_income numeric(14,2),
  enforcement_closed boolean not null default false,
  route public.bankruptcy_route not null,
  submitted_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewed_by uuid references public.profiles(id),
  reviewer_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index client_diagnostics_case_id_idx on public.client_diagnostics(case_id);
alter table public.client_diagnostics enable row level security;

create policy "Case participants read diagnostics" on public.client_diagnostics for select using (
  exists (select 1 from public.cases c where c.id = case_id and (c.client_id = auth.uid() or public.is_staff()))
);
create policy "Client creates own diagnostic" on public.client_diagnostics for insert with check (
  exists (select 1 from public.cases c where c.id = case_id and c.client_id = auth.uid())
);
create policy "Client updates own diagnostic" on public.client_diagnostics for update using (
  exists (select 1 from public.cases c where c.id = case_id and c.client_id = auth.uid())
) with check (
  exists (select 1 from public.cases c where c.id = case_id and c.client_id = auth.uid())
);
create policy "Staff manages diagnostics" on public.client_diagnostics for all using (public.is_staff()) with check (public.is_staff());

create or replace function public.set_client_diagnostic_updated_at()
returns trigger language plpgsql set search_path = public as $$
begin new.updated_at = now(); return new; end;
$$;

create trigger client_diagnostics_set_updated_at
  before update on public.client_diagnostics
  for each row execute procedure public.set_client_diagnostic_updated_at();
