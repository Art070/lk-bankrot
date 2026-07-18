create type public.document_request_status as enum ('requested', 'submitted', 'under_review', 'accepted', 'returned');

create table public.document_requests (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.cases(id) on delete cascade,
  title text not null,
  description text not null default '',
  required boolean not null default true,
  max_files smallint not null default 15 check (max_files between 1 and 15),
  status public.document_request_status not null default 'requested',
  requested_at timestamptz not null default now(),
  submitted_at timestamptz,
  reviewed_at timestamptz,
  reviewer_comment text,
  created_at timestamptz not null default now()
);

create table public.document_request_files (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.document_requests(id) on delete cascade,
  storage_path text not null unique,
  file_name text not null,
  mime_type text not null,
  size_bytes integer not null check (size_bytes > 0),
  uploaded_at timestamptz not null default now()
);

create index document_requests_case_id_idx on public.document_requests(case_id);
create index document_request_files_request_id_idx on public.document_request_files(request_id);

alter table public.document_requests enable row level security;
alter table public.document_request_files enable row level security;

create policy "Case participants read document requests" on public.document_requests for select using (
  exists (select 1 from public.cases c where c.id = case_id and (c.client_id = auth.uid() or public.is_staff()))
);
create policy "Staff manages document requests" on public.document_requests for all using (public.is_staff()) with check (public.is_staff());
create policy "Client submits own requested documents" on public.document_requests for update using (
  status in ('requested', 'returned') and exists (select 1 from public.cases c where c.id = case_id and c.client_id = auth.uid())
) with check (status = 'submitted');

create policy "Case participants read requested files" on public.document_request_files for select using (
  exists (select 1 from public.document_requests r join public.cases c on c.id = r.case_id where r.id = request_id and (c.client_id = auth.uid() or public.is_staff()))
);
create policy "Client uploads files to own request" on public.document_request_files for insert with check (
  exists (select 1 from public.document_requests r join public.cases c on c.id = r.case_id where r.id = request_id and c.client_id = auth.uid() and r.status in ('requested', 'returned'))
);
create policy "Staff manages requested files" on public.document_request_files for all using (public.is_staff()) with check (public.is_staff());

create policy "Client uploads request objects" on storage.objects for insert with check (
  bucket_id = 'case-documents' and exists (
    select 1 from public.document_requests r join public.cases c on c.id = r.case_id
    where r.id::text = (storage.foldername(name))[1] and c.client_id = auth.uid() and r.status in ('requested', 'returned')
  )
);
create policy "Client reads request objects" on storage.objects for select using (
  bucket_id = 'case-documents' and exists (
    select 1 from public.document_request_files f join public.document_requests r on r.id = f.request_id join public.cases c on c.id = r.case_id
    where f.storage_path = name and c.client_id = auth.uid()
  )
);
