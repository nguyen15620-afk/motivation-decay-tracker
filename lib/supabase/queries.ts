/**
 * Motivation Decay Tracker - Query Helpers & Data Layer
 * 
 * Provides unified data access for Projects, Check-ins, Trend Flags, and Interventions.
 * Includes automatic seamless fallback to persistent demo state when Supabase credentials
 * are not yet supplied in the environment.
 */

import { supabase, isSupabaseConfigured } from './client';
import {
  Checkin,
  Intervention,
  Project,
  TrendFlag,
  UserResponse,
} from './types';

// ============================================================================
// In-Memory / Local Seed Data Store (Zero-friction local dev fallback)
// ============================================================================

const initialProjects: Project[] = [
  {
    id: 'proj-pyrevit-001',
    name: 'pyRevit MEP Tools',
    description: 'Bộ công cụ tự động hóa mô hình hóa MEP trong Revit và trích xuất dữ liệu khối lượng.',
    status: 'active',
    created_at: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'proj-motocare-002',
    name: 'MotoCare Application',
    description: 'Hệ thống quản lý chu kỳ bảo dưỡng, thay nhớt và lịch trình phụ tùng xe máy.',
    status: 'active',
    created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'proj-ai-mep-003',
    name: 'AI MEP Integration',
    description: 'Nghiên cứu áp dụng LLM & Vision để tự động nhận diện routing đường ống HVAC & PCCC.',
    status: 'active',
    created_at: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'proj-smoke-004',
    name: 'Smoke Control Simulation',
    description: 'Tính toán thông gió hút khói hành lang và tăng áp cầu thang theo QCVN 06.',
    status: 'active',
    created_at: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

// Generate realistic time-series checkins
function generateSeedCheckins(): Checkin[] {
  const checkins: Checkin[] = [];
  const now = Date.now();
  const dayMs = 24 * 60 * 60 * 1000;

  // 1. pyRevit: Gradual Decay (8 down to 4 over 18 days) -> Trạng thái 'declining'
  const pyRevitScores = [8, 8, 7, 8, 7, 6, 7, 6, 5, 6, 5, 4, 5, 4, 4];
  const pyRevitNotes = [
    'Khởi động tính năng gán thông số tự động',
    'Cần giải quyết bug thư viện revit API',
    'Chạy test ổn định',
    'Bắt đầu thấy nhiều edge case phức tạp',
    'Hơi nản vì debug Revit crash',
    'Rất nhiều việc chưa hoàn thành',
    'Tiến độ chậm hơn dự kiến',
  ];
  pyRevitScores.forEach((score, idx) => {
    const daysAgo = (pyRevitScores.length - idx) * 1.2;
    checkins.push({
      id: `checkin-pyrevit-${idx}`,
      project_id: 'proj-pyrevit-001',
      score,
      energy: Math.max(1, score - 1),
      context_note: pyRevitNotes[idx % pyRevitNotes.length],
      created_at: new Date(now - daysAgo * dayMs).toISOString(),
    });
  });

  // 2. MotoCare: Upward Growth (4 up to 9) -> Trạng thái 'improving'
  const motoScores = [4, 5, 5, 6, 6, 7, 7, 8, 8, 9, 9];
  motoScores.forEach((score, idx) => {
    const daysAgo = (motoScores.length - idx) * 1.5;
    checkins.push({
      id: `checkin-moto-${idx}`,
      project_id: 'proj-motocare-002',
      score,
      energy: score,
      context_note: score >= 8 ? 'Tính năng nhắc nhở chạy rất mượt' : 'Đang tinh chỉnh giao diện',
      created_at: new Date(now - daysAgo * dayMs).toISOString(),
    });
  });

  // 3. AI MEP: Volatile (dao động mạnh 9 -> 3 -> 8 -> 4 -> 8) -> Trạng thái 'volatile'
  const aiScores = [8, 3, 9, 4, 8, 3, 9, 4, 8, 5];
  aiScores.forEach((score, idx) => {
    const daysAgo = (aiScores.length - idx) * 1.4;
    checkins.push({
      id: `checkin-ai-${idx}`,
      project_id: 'proj-ai-mep-003',
      score,
      energy: 6,
      context_note: score < 5 ? 'Prompt không ổn định' : 'Mô hình vision nhận diện chính xác',
      created_at: new Date(now - daysAgo * dayMs).toISOString(),
    });
  });

  // 4. Smoke Control: Sudden Drop (8, 8, 8, 8, 8 -> 3 hôm qua) -> Trạng thái 'sudden_drop'
  const smokeScores = [8, 8, 8, 8, 8, 8, 3];
  smokeScores.forEach((score, idx) => {
    const daysAgo = (smokeScores.length - idx) * 1.5;
    checkins.push({
      id: `checkin-smoke-${idx}`,
      project_id: 'proj-smoke-004',
      score,
      energy: score === 3 ? 2 : 8,
      context_note: score === 3 ? 'Bị nghẽn tiêu chuẩn và kiệt sức' : 'Mô phỏng FDS đang chạy',
      created_at: new Date(now - daysAgo * dayMs).toISOString(),
    });
  });

  return checkins;
}

let mockProjects: Project[] = [...initialProjects];
let mockCheckins: Checkin[] = generateSeedCheckins();
let mockTrendFlags: TrendFlag[] = [];
let mockInterventions: Intervention[] = [
  {
    id: 'mock-int-001',
    project_id: 'proj-pyrevit-001',
    suggestion_type: 'break_task',
    message: 'Động lực cho "pyRevit MEP Tools" đang giảm đều đặn theo thời gian. Hãy thử chia nhỏ bước tiếp theo thành một hành động siêu nhỏ chỉ mất 15 phút để lấy lại cảm giác tiến bộ.',
    user_response: null,
    created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'mock-int-002',
    project_id: 'proj-smoke-004',
    suggestion_type: 'take_break',
    message: 'Điểm động lực dự án "Smoke Control Simulation" vừa sụt giảm đột ngột từ 8 xuống 3. Đừng vội thúc ép bản thân — hãy dành 24h nghỉ ngơi hoàn toàn trước khi tiếp tục.',
    user_response: 'helpful',
    created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

// ============================================================================
// Data Layer Functions
// ============================================================================

export async function getProjects(): Promise<Project[]> {
  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[Supabase] Error fetching projects:', error);
      return mockProjects;
    }
    return data && data.length > 0 ? data : mockProjects;
  }
  return mockProjects;
}

export async function getProjectById(id: string): Promise<Project | null> {
  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('id', id)
      .single();

    if (!error && data) return data;
  }
  return mockProjects.find((p) => p.id === id) || null;
}

export async function createProject(project: Omit<Project, 'id' | 'created_at'>): Promise<Project> {
  const newProject: Project = {
    ...project,
    id: `proj-${Date.now()}`,
    created_at: new Date().toISOString(),
  };

  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase
      .from('projects')
      .insert(project)
      .select()
      .single();

    if (!error && data) return data;
  }

  mockProjects.unshift(newProject);
  return newProject;
}

export async function getCheckins(projectId?: string): Promise<Checkin[]> {
  if (isSupabaseConfigured && supabase) {
    let query = supabase.from('checkins').select('*').order('created_at', { ascending: true });
    if (projectId) {
      query = query.eq('project_id', projectId);
    }
    const { data, error } = await query;
    if (!error && data && data.length > 0) return data;
  }

  if (projectId) {
    return mockCheckins.filter((c) => c.project_id === projectId);
  }
  return mockCheckins;
}

export async function createCheckin(
  checkin: Omit<Checkin, 'id' | 'created_at'>
): Promise<Checkin> {
  const newCheckin: Checkin = {
    ...checkin,
    id: `checkin-${Date.now()}`,
    created_at: new Date().toISOString(),
  };

  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase
      .from('checkins')
      .insert(checkin)
      .select()
      .single();

    if (!error && data) return data;
  }

  mockCheckins.push(newCheckin);
  return newCheckin;
}

export async function getTrendFlags(projectId?: string): Promise<TrendFlag[]> {
  if (isSupabaseConfigured && supabase) {
    let query = supabase.from('trend_flags').select('*').order('created_at', { ascending: false });
    if (projectId) {
      query = query.eq('project_id', projectId);
    }
    const { data, error } = await query;
    if (!error && data) return data;
  }

  if (projectId) {
    return mockTrendFlags.filter((f) => f.project_id === projectId);
  }
  return mockTrendFlags;
}

export async function createTrendFlag(
  flag: Omit<TrendFlag, 'id' | 'created_at'>
): Promise<TrendFlag> {
  const newFlag: TrendFlag = {
    ...flag,
    id: `flag-${Date.now()}`,
    created_at: new Date().toISOString(),
  };

  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase
      .from('trend_flags')
      .insert(flag)
      .select()
      .single();

    if (!error && data) return data;
  }

  mockTrendFlags.unshift(newFlag);
  return newFlag;
}

export async function getInterventions(projectId?: string): Promise<Intervention[]> {
  if (isSupabaseConfigured && supabase) {
    let query = supabase.from('interventions').select('*').order('created_at', { ascending: false });
    if (projectId) {
      query = query.eq('project_id', projectId);
    }
    const { data, error } = await query;
    if (!error && data) return data;
  }

  if (projectId) {
    return mockInterventions.filter((i) => i.project_id === projectId);
  }
  return mockInterventions;
}

export async function createIntervention(
  intervention: Omit<Intervention, 'id' | 'created_at'>
): Promise<Intervention> {
  const newIntervention: Intervention = {
    ...intervention,
    id: `int-${Date.now()}`,
    created_at: new Date().toISOString(),
  };

  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase
      .from('interventions')
      .insert(intervention)
      .select()
      .single();

    if (!error && data) return data;
  }

  mockInterventions.unshift(newIntervention);
  return newIntervention;
}

export async function updateInterventionResponse(
  interventionId: string,
  userResponse: UserResponse
): Promise<boolean> {
  if (isSupabaseConfigured && supabase) {
    const { error } = await supabase
      .from('interventions')
      .update({ user_response: userResponse })
      .eq('id', interventionId);

    if (!error) return true;
  }

  const target = mockInterventions.find((i) => i.id === interventionId);
  if (target) {
    target.user_response = userResponse;
    return true;
  }
  return false;
}

/**
 * Retrieves the most recent interventions for a project that have user_response feedback recorded.
 */
export async function getRecentInterventionsWithFeedback(
  projectId: string,
  limit = 5
): Promise<Intervention[]> {
  const all = await getInterventions(projectId);
  return all
    .filter((i) => i.user_response !== null && i.user_response !== undefined)
    .slice(0, limit);
}
