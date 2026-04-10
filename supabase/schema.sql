-- PulsoMD Database Schema
-- Run this in the Supabase SQL Editor

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ============================================================
-- TABLES
-- ============================================================

create table clinics (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  doctor_name text,
  specialty text,
  city text,
  state text,
  years_operating integer,
  patients_per_month integer,
  rooms integer,
  invited_at timestamptz,
  onboarded_at timestamptz,
  questionnaire_completed_at timestamptz,
  created_at timestamptz default now()
);

create table users (
  id uuid primary key references auth.users on delete cascade,
  email text,
  full_name text,
  role text check (role in ('admin', 'doctor', 'assistant')) default 'doctor',
  clinic_id uuid references clinics(id),
  created_at timestamptz default now()
);

create table invitations (
  id uuid primary key default uuid_generate_v4(),
  email text not null,
  clinic_name text not null,
  doctor_name text not null,
  token text unique not null default uuid_generate_v4()::text,
  sent_by uuid references users(id),
  sent_at timestamptz default now(),
  used_at timestamptz
);

create table questionnaire_responses (
  id uuid primary key default uuid_generate_v4(),
  clinic_id uuid references clinics(id) on delete cascade,
  section text not null,
  question_key text not null,
  answer text,
  answered_at timestamptz default now(),
  unique(clinic_id, question_key)
);

create table insights (
  id uuid primary key default uuid_generate_v4(),
  clinic_id uuid references clinics(id) on delete cascade,
  category text,
  title text,
  description text,
  action_steps text,  -- JSON array of step strings
  timeline text,
  responsible text,
  impact text check (impact in ('alto', 'medio', 'bajo')),
  effort text check (effort in ('alto', 'medio', 'bajo')),
  urgency_level integer check (urgency_level in (1, 2, 3)),  -- 1=immediate, 2=optimize, 3=scale
  revenue_mxn integer default 0,
  priority_score numeric,
  is_highlighted boolean default false,
  generated_at timestamptz default now()
);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

alter table clinics enable row level security;
alter table users enable row level security;
alter table invitations enable row level security;
alter table questionnaire_responses enable row level security;
alter table insights enable row level security;

-- Helper: get current user's role
create or replace function get_my_role()
returns text
language sql
security definer
as $$
  select role from users where id = auth.uid()
$$;

-- Helper: get current user's clinic_id
create or replace function get_my_clinic_id()
returns uuid
language sql
security definer
as $$
  select clinic_id from users where id = auth.uid()
$$;

-- CLINICS policies
create policy "Users can view their own clinic"
  on clinics for select
  using (id = get_my_clinic_id() or get_my_role() = 'admin');

create policy "Users can update their own clinic"
  on clinics for update
  using (id = get_my_clinic_id());

create policy "Admins can insert clinics"
  on clinics for insert
  with check (get_my_role() = 'admin');

create policy "Service role can insert clinics"
  on clinics for insert
  with check (true);

-- USERS policies
create policy "Users can view their own record"
  on users for select
  using (id = auth.uid() or get_my_role() = 'admin');

create policy "Users can update their own record"
  on users for update
  using (id = auth.uid());

create policy "Users can insert their own record"
  on users for insert
  with check (id = auth.uid());

-- INVITATIONS policies
create policy "Admins can manage invitations"
  on invitations for all
  using (get_my_role() = 'admin');

create policy "Anyone can read invitation by token"
  on invitations for select
  using (true);

-- QUESTIONNAIRE_RESPONSES policies
create policy "Users can view their clinic's responses"
  on questionnaire_responses for select
  using (clinic_id = get_my_clinic_id() or get_my_role() = 'admin');

create policy "Users can upsert their clinic's responses"
  on questionnaire_responses for insert
  with check (clinic_id = get_my_clinic_id());

create policy "Users can update their clinic's responses"
  on questionnaire_responses for update
  using (clinic_id = get_my_clinic_id());

-- INSIGHTS policies
create policy "Users can view their clinic's insights"
  on insights for select
  using (clinic_id = get_my_clinic_id() or get_my_role() = 'admin');

create policy "Service role can manage insights"
  on insights for all
  using (true);

-- ============================================================
-- TRIGGER: auto-create user record on auth signup
-- ============================================================

create or replace function handle_new_user()
returns trigger
language plpgsql
security definer
as $$
begin
  insert into users (id, email, full_name, role)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    coalesce(new.raw_user_meta_data->>'role', 'doctor')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();
