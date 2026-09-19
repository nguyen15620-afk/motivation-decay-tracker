-- ============================================================================
-- Motivation Decay Tracker: Complete Schema & Initial Seed Data
-- Database: PostgreSQL (Supabase)
-- Instruction: Run this script directly in Supabase SQL Editor (https://supabase.com/dashboard/project/_/sql)
-- ============================================================================

-- Enable pgcrypto for UUID generation if needed
create extension if not exists "pgcrypto";

-- ----------------------------------------------------------------------------
-- 1. Table: projects
-- ----------------------------------------------------------------------------
create table if not exists public.projects (
    id text primary key default gen_random_uuid()::text,
    user_id text,
    name text not null,
    description text,
    status text not null default 'active' check (status in ('active', 'paused', 'archived')),
    created_at timestamptz not null default timezone('utc'::text, now()),
    archived_at timestamptz
);

create index if not exists idx_projects_status on public.projects (status);

-- ----------------------------------------------------------------------------
-- 2. Table: checkins
-- ----------------------------------------------------------------------------
create table if not exists public.checkins (
    id text primary key default gen_random_uuid()::text,
    project_id text not null references public.projects(id) on delete cascade,
    user_id text,
    score int not null check (score >= 1 and score <= 10),
    energy int check (energy is null or (energy >= 1 and energy <= 10)),
    context_note text,
    created_at timestamptz not null default timezone('utc'::text, now())
);

create index if not exists idx_checkins_project_created on public.checkins (project_id, created_at desc);

-- ----------------------------------------------------------------------------
-- 3. Table: trend_flags
-- ----------------------------------------------------------------------------
create table if not exists public.trend_flags (
    id text primary key default gen_random_uuid()::text,
    project_id text not null references public.projects(id) on delete cascade,
    window_start date not null,
    window_end date not null,
    slope double precision not null,
    flag_type text not null check (flag_type in ('declining', 'stable', 'improving', 'volatile')),
    confidence double precision not null default 0.0,
    created_at timestamptz not null default timezone('utc'::text, now()),
    acknowledged_at timestamptz
);

create index if not exists idx_trend_flags_project_created on public.trend_flags (project_id, created_at desc);

-- ----------------------------------------------------------------------------
-- 4. Table: interventions
-- ----------------------------------------------------------------------------
create table if not exists public.interventions (
    id text primary key default gen_random_uuid()::text,
    project_id text not null references public.projects(id) on delete cascade,
    trend_flag_id text references public.trend_flags(id) on delete set null,
    suggestion_type text not null check (suggestion_type in ('break_task', 'take_break', 'change_approach', 'celebrate_progress')),
    message text not null,
    user_response text check (user_response is null or user_response in ('helpful', 'not_helpful', 'dismissed')),
    template_id text,
    tone text check (tone is null or tone in ('compassionate', 'action_oriented', 'scientific')),
    escalation_level int default 0,
    efficacy_delta double precision,
    created_at timestamptz not null default timezone('utc'::text, now())
);

create index if not exists idx_interventions_project_created on public.interventions (project_id, created_at desc);

-- ----------------------------------------------------------------------------
-- 5. Row Level Security (RLS) - Permissive for Shared / Friend Demo Mode
-- ----------------------------------------------------------------------------
alter table public.projects enable row level security;
alter table public.checkins enable row level security;
alter table public.trend_flags enable row level security;
alter table public.interventions enable row level security;

drop policy if exists "Allow all on projects" on public.projects;
create policy "Allow all on projects" on public.projects for all using (true) with check (true);

drop policy if exists "Allow all on checkins" on public.checkins;
create policy "Allow all on checkins" on public.checkins for all using (true) with check (true);

drop policy if exists "Allow all on trend_flags" on public.trend_flags;
create policy "Allow all on trend_flags" on public.trend_flags for all using (true) with check (true);

drop policy if exists "Allow all on interventions" on public.interventions;
create policy "Allow all on interventions" on public.interventions for all using (true) with check (true);

-- ----------------------------------------------------------------------------
-- 6. Initial Seed Data: 4 Demo Projects with Varied Motivation Patterns
-- ----------------------------------------------------------------------------
insert into public.projects (id, name, description, status, created_at)
values
  ('proj-pyrevit-001', 'pyRevit MEP Tools', 'Bộ công cụ tự động hóa mô hình hóa MEP trong Revit và trích xuất dữ liệu khối lượng.', 'active', now() - interval '25 days'),
  ('proj-motocare-002', 'MotoCare Application', 'Hệ thống quản lý chu kỳ bảo dưỡng, thay nhớt và lịch trình phụ tùng xe máy.', 'active', now() - interval '30 days'),
  ('proj-ai-mep-003', 'AI MEP Integration', 'Nghiên cứu áp dụng LLM & Vision để tự động nhận diện routing đường ống HVAC & PCCC.', 'active', now() - interval '20 days'),
  ('proj-smoke-004', 'Smoke Control Simulation', 'Tính toán thông gió hút khói hành lang và tăng áp cầu thang theo QCVN 06.', 'active', now() - interval '15 days')
on conflict (id) do nothing;

-- Checkins for pyRevit MEP Tools (Gradual Decay: 8 down to 4)
insert into public.checkins (project_id, score, energy, context_note, created_at)
values
  ('proj-pyrevit-001', 8, 7, 'Khởi động tính năng gán thông số tự động', now() - interval '18 days'),
  ('proj-pyrevit-001', 8, 7, 'Cần giải quyết bug thư viện revit API', now() - interval '16 days'),
  ('proj-pyrevit-001', 7, 6, 'Chạy test ổn định', now() - interval '14 days'),
  ('proj-pyrevit-001', 8, 7, 'Bắt đầu thấy nhiều edge case phức tạp', now() - interval '12 days'),
  ('proj-pyrevit-001', 7, 6, 'Hơi nản vì debug Revit crash', now() - interval '10 days'),
  ('proj-pyrevit-001', 6, 5, 'Rất nhiều việc chưa hoàn thành', now() - interval '8 days'),
  ('proj-pyrevit-001', 5, 4, 'Tiến độ chậm hơn dự kiến', now() - interval '6 days'),
  ('proj-pyrevit-001', 4, 3, 'Khá bế tắc với API Revit 2026', now() - interval '3 days'),
  ('proj-pyrevit-001', 4, 3, 'Cần nghỉ ngơi hoặc thu hẹp scope', now() - interval '1 day');

-- Checkins for MotoCare Application (Steady Growth: 4 up to 9)
insert into public.checkins (project_id, score, energy, context_note, created_at)
values
  ('proj-motocare-002', 4, 4, 'Bắt đầu dự án quản lý bảo dưỡng xe', now() - interval '16 days'),
  ('proj-motocare-002', 5, 5, 'Dựng xong khung Supabase', now() - interval '14 days'),
  ('proj-motocare-002', 6, 6, 'Tích hợp tính năng nhắc nhở', now() - interval '11 days'),
  ('proj-motocare-002', 7, 7, 'Thêm tính năng ghi log thay nhớt', now() - interval '8 days'),
  ('proj-motocare-002', 8, 8, 'Giao diện mượt mà, người dùng test khen', now() - interval '5 days'),
  ('proj-motocare-002', 9, 9, 'Sắp ra mắt bản beta đầu tiên', now() - interval '1 day');

-- Checkins for Smoke Control Simulation (Acute Sudden Drop: 8 -> 3)
insert into public.checkins (project_id, score, energy, context_note, created_at)
values
  ('proj-smoke-004', 8, 8, 'Dựng mô hình thông gió hành lang FDS', now() - interval '12 days'),
  ('proj-smoke-004', 8, 8, 'Chạy lưới phân tích 0.1m', now() - interval '9 days'),
  ('proj-smoke-004', 8, 8, 'Số liệu đối chiếu QCVN 06 phù hợp', now() - interval '6 days'),
  ('proj-smoke-004', 8, 8, 'Chuẩn bị xuất báo cáo thuyết minh', now() - interval '3 days'),
  ('proj-smoke-004', 3, 2, 'Bị nghẽn tiêu chuẩn thẩm duyệt PCCC và kiệt sức', now() - interval '12 hours');

-- Sample Interventions
insert into public.interventions (id, project_id, suggestion_type, message, template_id, tone, user_response, created_at)
values
  ('mock-int-001', 'proj-pyrevit-001', 'break_task', 'Động lực cho "pyRevit MEP Tools" đang giảm đều đặn theo thời gian. Hãy thử chia nhỏ bước tiếp theo thành một hành động siêu nhỏ chỉ mất 15 phút để lấy lại cảm giác tiến bộ.', 'BT-01', 'action_oriented', null, now() - interval '2 days'),
  ('mock-int-002', 'proj-smoke-004', 'take_break', 'Điểm động lực dự án "Smoke Control Simulation" vừa sụt giảm đột ngột từ 8 xuống 3. Đừng vội thúc ép bản thân — hãy dành 24h nghỉ ngơi hoàn toàn trước khi tiếp tục.', 'TB-01', 'compassionate', null, now() - interval '1 day')
on conflict (id) do nothing;
