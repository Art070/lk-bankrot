-- Terms shown to the client in the "Contract and payments" section.
alter table public.cases
  add column if not exists contract_number text,
  add column if not exists contract_date date,
  add column if not exists payment_plan text not null default 'not_set' check (payment_plan in ('not_set', 'one_time', 'installments')),
  add column if not exists additional_expenses_note text;
