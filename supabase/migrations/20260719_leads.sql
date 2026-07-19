create table public.leads (
  id uuid primary key default gen_random_uuid(),
  name text,
  phone text not null,
  source text not null default 'site',
  status text not null default 'new' check (status in ('new', 'contacted', 'contracted', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index leads_status_created_at_idx on public.leads(status, created_at desc);
alter table public.leads enable row level security;
create policy "Staff manages leads" on public.leads for all using (public.is_staff()) with check (public.is_staff());

create or replace function public.set_leads_updated_at()
returns trigger language plpgsql set search_path = public as $$
begin new.updated_at = now(); return new; end;
$$;

create trigger leads_set_updated_at before update on public.leads
  for each row execute procedure public.set_leads_updated_at();
