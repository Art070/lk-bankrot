-- Personal data required to prepare the debtor block of a bankruptcy application.
create type public.marital_status as enum ('single', 'married', 'divorced', 'widowed');
create type public.employment_status as enum ('employed', 'self_employed', 'unemployed', 'retired', 'other');

create table public.client_details (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null unique references public.profiles(id) on delete cascade,
  birth_date date not null,
  birth_place text not null,
  passport_series text not null,
  passport_number text not null,
  passport_issued_by text not null,
  passport_issued_date date not null,
  passport_department_code text,
  registration_postcode text,
  registration_region text not null,
  registration_city text,
  registration_locality text,
  registration_street text not null,
  registration_building text not null,
  registration_apartment text,
  residence_address text,
  marital_status public.marital_status,
  employment_status public.employment_status,
  is_individual_entrepreneur boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.client_details enable row level security;
create policy "Client reads own application profile" on public.client_details for select using (client_id = auth.uid());
create policy "Staff manages application profiles" on public.client_details for all using (public.is_staff()) with check (public.is_staff());

create or replace function public.set_client_details_updated_at()
returns trigger language plpgsql set search_path = public as $$
begin new.updated_at = now(); return new; end;
$$;

create trigger client_details_set_updated_at
  before update on public.client_details
  for each row execute procedure public.set_client_details_updated_at();
