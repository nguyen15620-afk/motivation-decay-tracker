-- ============================================================================
-- Motivation Decay Tracker: Database Schema Migration
-- Migration: 001_init_schema.sql
-- Description: Core tables for projects, checkins, trend analysis flags, and interventions.
-- ============================================================================

-- Enable pgcrypto for UUID generation if not already enabled
create extension if not exists "pgcrypto";

-- ----------------------------------------------------------------------------
-- 1. Table: projects
-- Represents user projects / goals being monitored for motivation decay.
-- ----------------------------------------------------------------------------
create table if not exists public.projects (
    id uuid primary key default gen_random_uuid(),
    user_id uuid, -- links to auth.users if Supabase Auth is active
    name text not null,
    description text,
    status text not null default 'active' check (status in ('active', 'paused', 'archived')),
    created_at timestamptz not null default timezone('utc'::text, now()),
    archived_at timestamptz
);

-- Index on user and status for fast dashboard filtering
create index if not exists idx_projects_user_status on public.projects (user_id, status);

-- ----------------------------------------------------------------------------
-- 2. Table: checkins
-- Records daily/periodic motivation and energy score along with context notes.
-- ----------------------------------------------------------------------------
create table if not exists public.checkins (
    id uuid primary key default gen_random_uuid(),
    project_id uuid not null references public.projects(id) on delete cascade,
    user_id uuid,
    score int not null check (score >= 1 and score <= 10),
    energy int check (energy is null or (energy >= 1 and energy <= 10)),
    context_note text,
    created_at timestamptz not null default timezone('utc'::text, now())
);

-- Index to optimize time-series queries for regression calculation
create index if not exists idx_checkins_project_created on public.checkins (project_id, created_at desc);

-- ----------------------------------------------------------------------------
-- 3. Table: trend_flags
-- Caches results of sliding window linear regression and volatility detection.
-- ----------------------------------------------------------------------------
create table if not exists public.trend_flags (
    id uuid primary key default gen_random_uuid(),
    project_id uuid not null references public.projects(id) on delete cascade,
    window_start date not null,
    window_end date not null,
    slope double precision not null,
    flag_type text not null check (flag_type in ('declining', 'stable', 'improving', 'volatile')),
    confidence double precision not null default 0.0, -- R² score or data point weighting
    created_at timestamptz not null default timezone('utc'::text, now()),
    acknowledged_at timestamptz
);

create index if not exists idx_trend_flags_project_created on public.trend_flags (project_id, created_at desc);

-- ----------------------------------------------------------------------------
-- 4. Table: interventions
-- Logs proactive smart coaching suggestions triggered by declining/volatile trends.
-- ----------------------------------------------------------------------------
create table if not exists public.interventions (
    id uuid primary key default gen_random_uuid(),
    project_id uuid not null references public.projects(id) on delete cascade,
    trend_flag_id uuid references public.trend_flags(id) on delete set null,
    suggestion_type text not null check (suggestion_type in ('break_task', 'take_break', 'change_approach', 'celebrate_progress')),
    message text not null,
    user_response text check (user_response is null or user_response in ('helpful', 'not_helpful', 'dismissed')),
    created_at timestamptz not null default timezone('utc'::text, now())
);

create index if not exists idx_interventions_project_created on public.interventions (project_id, created_at desc);

-- ----------------------------------------------------------------------------
-- Row Level Security (RLS) policies - Safe defaults for authenticated/anon users
-- ----------------------------------------------------------------------------
alter table public.projects enable row level security;
alter table public.checkins enable row level security;
alter table public.trend_flags enable row level security;
alter table public.interventions enable row level security;

-- Permissive policy for single-user/development mode: allows operations if user_id matches or for anon dev
create policy "Allow access to projects" on public.projects
    for all using (true) with check (true);

create policy "Allow access to checkins" on public.checkins
    for all using (true) with check (true);

create policy "Allow access to trend_flags" on public.trend_flags
    for all using (true) with check (true);

create policy "Allow access to interventions" on public.interventions
    for all using (true) with check (true);
