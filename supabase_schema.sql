-- Fitin Connection workout log schema
-- Session 4 deliverable
--
-- Important production note:
-- Do not expose admin-wide SELECT/export permissions directly through a public anon key.
-- Use Supabase Auth + Row Level Security, or protected Edge Functions/backend routes.

create extension if not exists "pgcrypto";

create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  student_id_or_phone_last4 text not null,
  birth_year text not null,
  gender text not null,
  school text,
  created_at timestamptz not null default now(),
  constraint users_identity_unique unique (name, student_id_or_phone_last4, birth_year)
);

create table if not exists public.workout_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  workout_date date not null,
  workout_type text not null,
  workout_frequency_per_week text not null,
  workout_duration_minutes integer not null check (workout_duration_minutes >= 0),
  completed_workout_days integer check (completed_workout_days is null or completed_workout_days >= 0),
  total_volume_kg numeric(12, 2) not null check (total_volume_kg >= 0),
  total_calories integer not null check (total_calories >= 0),
  workout_goal text,
  condition_score integer not null check (condition_score between 1 and 5),
  memo text,
  created_at timestamptz not null default now()
);

create table if not exists public.workout_muscle_groups (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.workout_sessions(id) on delete cascade,
  muscle_group text not null,
  muscle_group_volume_kg numeric(12, 2) check (muscle_group_volume_kg is null or muscle_group_volume_kg >= 0),
  muscle_group_note text
);

create table if not exists public.workout_exercises (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.workout_sessions(id) on delete cascade,
  muscle_group text,
  exercise_name text,
  set_count integer check (set_count is null or set_count >= 0),
  best_weight_kg numeric(10, 2) check (best_weight_kg is null or best_weight_kg >= 0),
  best_reps integer check (best_reps is null or best_reps >= 0),
  estimated_1rm_kg numeric(10, 2) check (estimated_1rm_kg is null or estimated_1rm_kg >= 0),
  total_exercise_volume_kg numeric(12, 2) check (total_exercise_volume_kg is null or total_exercise_volume_kg >= 0),
  exercise_note text
);

create table if not exists public.workout_screenshots (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.workout_sessions(id) on delete cascade,
  screenshot_url text not null,
  uploaded_at timestamptz not null default now()
);

create index if not exists idx_workout_sessions_user_id on public.workout_sessions(user_id);
create index if not exists idx_workout_sessions_workout_date on public.workout_sessions(workout_date);
create index if not exists idx_workout_muscle_groups_session_id on public.workout_muscle_groups(session_id);
create index if not exists idx_workout_muscle_groups_muscle_group on public.workout_muscle_groups(muscle_group);
create index if not exists idx_workout_exercises_session_id on public.workout_exercises(session_id);
create index if not exists idx_workout_screenshots_session_id on public.workout_screenshots(session_id);

alter table public.users enable row level security;
alter table public.workout_sessions enable row level security;
alter table public.workout_muscle_groups enable row level security;
alter table public.workout_exercises enable row level security;
alter table public.workout_screenshots enable row level security;

-- MVP policy option for public student submissions:
-- Keep SELECT protected. Allow INSERT only if you are comfortable accepting public form entries.
-- For stronger protection, remove these policies and submit through an Edge Function.
drop policy if exists "Allow public user inserts" on public.users;
create policy "Allow public user inserts"
on public.users for insert
to anon
with check (true);

drop policy if exists "Allow public workout session inserts" on public.workout_sessions;
create policy "Allow public workout session inserts"
on public.workout_sessions for insert
to anon
with check (true);

drop policy if exists "Allow public muscle group inserts" on public.workout_muscle_groups;
create policy "Allow public muscle group inserts"
on public.workout_muscle_groups for insert
to anon
with check (true);

drop policy if exists "Allow public exercise inserts" on public.workout_exercises;
create policy "Allow public exercise inserts"
on public.workout_exercises for insert
to anon
with check (true);

drop policy if exists "Allow public screenshot inserts" on public.workout_screenshots;
create policy "Allow public screenshot inserts"
on public.workout_screenshots for insert
to anon
with check (true);

-- Sample dummy data based on uploaded workout screenshots.
with sample_user as (
  insert into public.users (
    name,
    student_id_or_phone_last4,
    birth_year,
    gender,
    school,
    created_at
  )
  values (
    '황제웅',
    '2026',
    '2004',
    '남성 (Male)',
    'Fitin Connection',
    '2026-04-13T09:00:00Z'
  )
  on conflict (name, student_id_or_phone_last4, birth_year)
  do update set school = excluded.school
  returning id
),
sample_session as (
  insert into public.workout_sessions (
    user_id,
    workout_date,
    workout_type,
    workout_frequency_per_week,
    workout_duration_minutes,
    completed_workout_days,
    total_volume_kg,
    total_calories,
    workout_goal,
    condition_score,
    memo,
    created_at
  )
  select
    id,
    '2026-04-13',
    '헬스 / 웨이트 트레이닝 (Gym / Weight Training)',
    '주 4-5회 (4-5 times a week)',
    76,
    22,
    14838,
    369,
    '근성장 (Muscle Gain)',
    4,
    '등 운동 위주. 풀업, 케이블 암 풀다운, 바벨 로우 기록 포함.',
    '2026-04-13T09:00:00Z'
  from sample_user
  returning id
)
insert into public.workout_muscle_groups (
  session_id,
  muscle_group,
  muscle_group_volume_kg,
  muscle_group_note
)
select id, '등 (Back)', 9000, 'Pull-up, Cable Arm Pulldown, Barbell Row, Lat Pulldown'
from sample_session
union all
select id, '이두 (Biceps)', 2500, 'Barbell Curl, Cable Hammer Curl, Incline Dumbbell Curl'
from sample_session;

-- Optional storage bucket for uploaded screenshots:
-- insert into storage.buckets (id, name, public)
-- values ('workout-screenshots', 'workout-screenshots', false)
-- on conflict (id) do nothing;
