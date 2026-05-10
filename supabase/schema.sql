create extension if not exists "pgcrypto";

create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  role text not null check (role in ('student', 'teacher', 'admin')),
  created_at timestamptz not null default now()
);

create table if not exists public.students (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.users(id) on delete cascade,
  name text not null,
  kana text,
  grade text,
  campus text,
  teacher_name text,
  bunri_status text default '未定',
  career_memo text,
  concern_memo text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.diagnosis_answers (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  answers_json jsonb not null,
  created_at timestamptz not null default now()
);

create table if not exists public.diagnosis_results (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  result_json jsonb not null,
  top_departments_json jsonb not null,
  created_at timestamptz not null default now()
);

create table if not exists public.interest_surveys (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  answers_json jsonb not null,
  created_at timestamptz not null default now()
);

create table if not exists public.saved_departments (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  department_id text not null,
  created_at timestamptz not null default now(),
  unique (student_id, department_id)
);

create table if not exists public.interview_surveys (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  answers_json jsonb not null,
  created_at timestamptz not null default now()
);

create table if not exists public.teacher_notes (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  teacher_id uuid references public.users(id) on delete set null,
  note text not null,
  next_action text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.departments (
  id text primary key,
  name text not null,
  category text,
  bunri_type text,
  tags_json jsonb default '[]'::jsonb,
  related_subjects_json jsonb default '[]'::jsonb,
  personality_fit_json jsonb default '[]'::jsonb,
  description text,
  learning_content text,
  future_careers_json jsonb default '[]'::jsonb,
  related_qualifications_json jsonb default '[]'::jsonb,
  recommended_for jsonb default '[]'::jsonb,
  not_recommended_for jsonb default '[]'::jsonb,
  high_school_preparation jsonb default '[]'::jsonb,
  similar_departments_json jsonb default '[]'::jsonb,
  interview_questions_json jsonb default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.users enable row level security;
alter table public.students enable row level security;
alter table public.diagnosis_answers enable row level security;
alter table public.diagnosis_results enable row level security;
alter table public.interest_surveys enable row level security;
alter table public.saved_departments enable row level security;
alter table public.interview_surveys enable row level security;
alter table public.teacher_notes enable row level security;
alter table public.departments enable row level security;

create or replace function public.is_staff()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.users
    where id = auth.uid()
    and role in ('teacher', 'admin')
  );
$$;

create policy "users can read self or staff can read all"
on public.users for select
using (id = auth.uid() or public.is_staff());

create policy "students read self or staff"
on public.students for select
using (user_id = auth.uid() or public.is_staff());

create policy "students write self profile"
on public.students for insert
with check (user_id = auth.uid());

create policy "students update self profile"
on public.students for update
using (user_id = auth.uid())
with check (user_id = auth.uid());

create policy "diagnosis answers read self or staff"
on public.diagnosis_answers for select
using (
  exists (select 1 from public.students s where s.id = student_id and s.user_id = auth.uid())
  or public.is_staff()
);

create policy "diagnosis answers insert self"
on public.diagnosis_answers for insert
with check (exists (select 1 from public.students s where s.id = student_id and s.user_id = auth.uid()));

create policy "diagnosis results read self or staff"
on public.diagnosis_results for select
using (
  exists (select 1 from public.students s where s.id = student_id and s.user_id = auth.uid())
  or public.is_staff()
);

create policy "diagnosis results insert self"
on public.diagnosis_results for insert
with check (exists (select 1 from public.students s where s.id = student_id and s.user_id = auth.uid()));

create policy "departments readable by authenticated users"
on public.departments for select
using (auth.role() = 'authenticated');

create policy "departments editable by admins"
on public.departments for all
using (exists (select 1 from public.users where id = auth.uid() and role = 'admin'))
with check (exists (select 1 from public.users where id = auth.uid() and role = 'admin'));
