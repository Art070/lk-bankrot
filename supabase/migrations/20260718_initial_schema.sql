create type public.app_role as enum ('admin', 'manager', 'client');
create type public.document_type as enum ('contract', 'court', 'payment', 'notice');
create type public.payment_status as enum ('paid', 'upcoming', 'overdue');
create type public.notification_type as enum ('date', 'document', 'message', 'system');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  role public.app_role not null default 'client',
  phone text,
  inn text,
  created_at timestamptz not null default now()
);

create table public.cases (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.profiles(id) on delete cascade,
  case_number text not null unique,
  court text not null,
  case_status text not null default 'initiation',
  open_date date not null,
  next_hearing date,
  total_debt numeric(14,2) not null default 0,
  contract_total numeric(14,2) not null default 0,
  remaining_payment numeric(14,2) not null default 0,
  created_at timestamptz not null default now()
);

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.cases(id) on delete cascade,
  due_date date not null,
  amount numeric(14,2) not null check (amount >= 0),
  description text not null,
  status public.payment_status not null default 'upcoming',
  method text,
  created_at timestamptz not null default now()
);

create table public.documents (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.cases(id) on delete cascade,
  title text not null,
  document_type public.document_type not null,
  document_date date not null,
  storage_path text not null,
  size_kb integer not null default 0,
  viewed_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.profiles(id) on delete cascade,
  notification_type public.notification_type not null,
  title text not null,
  body text not null,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.cases(id) on delete cascade,
  author_id uuid not null references public.profiles(id),
  body text not null check (char_length(body) between 1 and 4000),
  created_at timestamptz not null default now()
);

create index cases_client_id_idx on public.cases(client_id);
create index payments_case_id_idx on public.payments(case_id);
create index documents_case_id_idx on public.documents(case_id);
create index notifications_client_id_idx on public.notifications(client_id);
create index messages_case_id_idx on public.messages(case_id);

create or replace function public.is_staff()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('admin', 'manager')
  );
$$;

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    coalesce((new.raw_user_meta_data ->> 'role')::public.app_role, 'client')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.cases enable row level security;
alter table public.payments enable row level security;
alter table public.documents enable row level security;
alter table public.notifications enable row level security;
alter table public.messages enable row level security;

create policy "Users read own profile or staff read all" on public.profiles for select
  using (id = auth.uid() or public.is_staff());
create policy "Staff update profiles" on public.profiles for update using (public.is_staff()) with check (public.is_staff());

create policy "Client or staff reads case" on public.cases for select
  using (client_id = auth.uid() or public.is_staff());
create policy "Staff manages cases" on public.cases for all using (public.is_staff()) with check (public.is_staff());

create policy "Case access for payments" on public.payments for select
  using (exists (select 1 from public.cases c where c.id = case_id and (c.client_id = auth.uid() or public.is_staff())));
create policy "Staff manages payments" on public.payments for all using (public.is_staff()) with check (public.is_staff());

create policy "Case access for documents" on public.documents for select
  using (exists (select 1 from public.cases c where c.id = case_id and (c.client_id = auth.uid() or public.is_staff())));
create policy "Staff manages documents" on public.documents for all using (public.is_staff()) with check (public.is_staff());

create policy "Client or staff reads notifications" on public.notifications for select
  using (client_id = auth.uid() or public.is_staff());
create policy "Staff manages notifications" on public.notifications for all using (public.is_staff()) with check (public.is_staff());

create policy "Case access for messages" on public.messages for select
  using (exists (select 1 from public.cases c where c.id = case_id and (c.client_id = auth.uid() or public.is_staff())));
create policy "Case participant adds messages" on public.messages for insert
  with check (author_id = auth.uid() and exists (select 1 from public.cases c where c.id = case_id and (c.client_id = auth.uid() or public.is_staff())));

insert into storage.buckets (id, name, public) values ('case-documents', 'case-documents', false)
on conflict (id) do nothing;

create policy "Case participants read documents" on storage.objects for select using (
  bucket_id = 'case-documents' and exists (
    select 1 from public.documents d join public.cases c on c.id = d.case_id
    where d.storage_path = name and (c.client_id = auth.uid() or public.is_staff())
  )
);
create policy "Staff uploads case documents" on storage.objects for insert with check (
  bucket_id = 'case-documents' and public.is_staff()
);
create policy "Staff updates case documents" on storage.objects for update using (
  bucket_id = 'case-documents' and public.is_staff()
);
create policy "Staff deletes case documents" on storage.objects for delete using (
  bucket_id = 'case-documents' and public.is_staff()
);

create or replace function public.mark_document_viewed(document_id uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  update public.documents d set viewed_at = coalesce(d.viewed_at, now())
  where d.id = document_id
    and exists (select 1 from public.cases c where c.id = d.case_id and c.client_id = auth.uid());
  if not found then raise exception 'Document not found'; end if;
end;
$$;

create or replace function public.mark_notifications_read()
returns void language sql security definer set search_path = public as $$
  update public.notifications set read_at = coalesce(read_at, now()) where client_id = auth.uid();
$$;

create or replace function public.mark_notification_read(notification_id uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  update public.notifications set read_at = coalesce(read_at, now())
  where id = notification_id and client_id = auth.uid();
  if not found then raise exception 'Notification not found'; end if;
end;
$$;
