-- Short, human-readable status shown first in the client mobile cabinet.
create table public.case_client_updates (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null unique references public.cases(id) on delete cascade,
  tone text not null default 'good' check (tone in ('good', 'action', 'attention')),
  headline text not null default 'Делом занимаются юристы',
  body text not null default 'Все необходимые материалы получены. Мы продолжаем работу по вашему делу.',
  action_label text,
  action_href text,
  updated_by uuid references public.profiles(id),
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index case_client_updates_case_id_idx on public.case_client_updates(case_id);
alter table public.case_client_updates enable row level security;

create policy "Case participants read client update" on public.case_client_updates for select using (
  exists (select 1 from public.cases c where c.id = case_id and (c.client_id = auth.uid() or public.is_staff()))
);
create policy "Staff manages client updates" on public.case_client_updates for all using (public.is_staff()) with check (public.is_staff());

create or replace function public.set_case_client_update_updated_at()
returns trigger language plpgsql set search_path = public as $$
begin new.updated_at = now(); return new; end;
$$;

create trigger case_client_updates_set_updated_at
  before update on public.case_client_updates
  for each row execute procedure public.set_case_client_update_updated_at();
