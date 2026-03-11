-- Run this SQL in Supabase SQL Editor

create table if not exists health_patients (
  id bigint generated always as identity primary key,
  first_name text not null,
  last_name text not null,
  age integer not null,
  sex text not null,
  phone text not null,
  address text not null,
  consultation_date date not null,
  diagnosis text not null,
  created_at timestamptz not null default now()
);

create table if not exists health_prescriptions (
  id bigint generated always as identity primary key,
  patient_name text not null,
  doctor text not null,
  medicines text not null,
  dosage text not null,
  date date not null,
  created_at timestamptz not null default now()
);

create table if not exists health_stock_items (
  id bigint generated always as identity primary key,
  name text not null,
  purchase_price numeric(12,2) not null,
  sale_price numeric(12,2) not null,
  quantity integer not null,
  expiration_date date not null,
  alert_threshold integer not null default 10,
  created_at timestamptz not null default now()
);

create table if not exists health_tickets (
  id bigint generated always as identity primary key,
  ticket_number text not null unique,
  patient_name text not null,
  medicines text not null,
  consultation text not null,
  total_amount numeric(12,2) not null,
  date date not null,
  created_at timestamptz not null default now()
);

create table if not exists health_transactions (
  id bigint generated always as identity primary key,
  type text not null check (type in ('income', 'expense')),
  label text not null,
  amount numeric(12,2) not null,
  date date not null,
  created_at timestamptz not null default now()
);

create table if not exists health_staff_members (
  id bigint generated always as identity primary key,
  name text not null,
  role text not null,
  phone text not null,
  schedule text not null,
  guard_start text not null,
  guard_end text not null,
  on_duty boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists health_app_settings (
  setting_key text primary key,
  setting_value text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table health_patients enable row level security;
alter table health_prescriptions enable row level security;
alter table health_stock_items enable row level security;
alter table health_tickets enable row level security;
alter table health_transactions enable row level security;
alter table health_staff_members enable row level security;
alter table health_app_settings enable row level security;

drop policy if exists "allow all health_patients" on health_patients;
drop policy if exists "allow all health_prescriptions" on health_prescriptions;
drop policy if exists "allow all health_stock_items" on health_stock_items;
drop policy if exists "allow all health_tickets" on health_tickets;
drop policy if exists "allow all health_transactions" on health_transactions;
drop policy if exists "allow all health_staff_members" on health_staff_members;
drop policy if exists "allow all health_app_settings" on health_app_settings;

drop policy if exists "authenticated health_patients" on health_patients;
drop policy if exists "authenticated health_prescriptions" on health_prescriptions;
drop policy if exists "authenticated health_stock_items" on health_stock_items;
drop policy if exists "authenticated health_tickets" on health_tickets;
drop policy if exists "authenticated health_transactions" on health_transactions;
drop policy if exists "authenticated health_staff_members" on health_staff_members;
drop policy if exists "authenticated health_app_settings" on health_app_settings;

create policy "authenticated health_patients" on health_patients
for all
to authenticated
using (true)
with check (true);

create policy "authenticated health_prescriptions" on health_prescriptions
for all
to authenticated
using (true)
with check (true);

create policy "authenticated health_stock_items" on health_stock_items
for all
to authenticated
using (true)
with check (true);

create policy "authenticated health_tickets" on health_tickets
for all
to authenticated
using (true)
with check (true);

create policy "authenticated health_transactions" on health_transactions
for all
to authenticated
using (true)
with check (true);

create policy "authenticated health_staff_members" on health_staff_members
for all
to authenticated
using (true)
with check (true);

create policy "authenticated health_app_settings" on health_app_settings
for all
to authenticated
using (true)
with check (true);

insert into public.health_app_settings (setting_key, setting_value)
values ('accounting_access_password', 'compta123')
on conflict (setting_key)
do update set
  setting_value = excluded.setting_value,
  updated_at = now();
