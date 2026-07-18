-- Optional client check-in shown after signing the contract.
create table public.client_checkins (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null unique references public.cases(id) on delete cascade,
  answers jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

alter table public.client_checkins enable row level security;

create policy "Case participants read client check-in" on public.client_checkins for select using (
  exists (select 1 from public.cases c where c.id = case_id and (c.client_id = auth.uid() or public.is_staff()))
);
create policy "Client manages own check-in" on public.client_checkins for all using (
  exists (select 1 from public.cases c where c.id = case_id and c.client_id = auth.uid())
) with check (
  exists (select 1 from public.cases c where c.id = case_id and c.client_id = auth.uid())
);
create policy "Staff manages client check-ins" on public.client_checkins for all using (public.is_staff()) with check (public.is_staff());

create or replace function public.set_client_checkin_updated_at()
returns trigger language plpgsql set search_path = public as $$
begin new.updated_at = now(); return new; end;
$$;

create trigger client_checkins_set_updated_at
  before update on public.client_checkins
  for each row execute procedure public.set_client_checkin_updated_at();
