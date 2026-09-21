'use client';

/**
 * Page: /dashboard
 * Description: Main dashboard displaying motivation decay alerts, project overview cards,
 * proactive interventions feed, and fast navigation to individual project deep-dives.
 */

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Project,
  Checkin,
  Intervention,
  TrendAnalysisResult,
  UserResponse,
} from '@/lib/supabase/types';
import { getProjects, getCheckins, getInterventions } from '@/lib/supabase/queries';
import { analyzeProjectTrend } from '@/lib/trend/regression';
import { InterventionCard } from '@/components/interventions/InterventionCard';
import {
  Flame,
  AlertTriangle,
  TrendingDown,
  TrendingUp,
  Activity,
  Minus,
  Plus,
  ArrowRight,
  ShieldAlert,
  Sparkles,
  CheckCircle2,
  Clock,
  Trash2,
} from 'lucide-react';
import { DeleteProjectModal } from '@/components/projects/DeleteProjectModal';

interface ProjectCardData {
  project: Project;
  trend: TrendAnalysisResult;
  lastCheckin?: Checkin;
  checkinsCount: number;
}

export default function DashboardPage() {
  const [projectCards, setProjectCards] = useState<ProjectCardData[]>([]);
  const [interventions, setInterventions] = useState<Intervention[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // New Project modal state
  const [showNewProjectModal, setShowNewProjectModal] = useState<boolean>(false);
  const [newProjectName, setNewProjectName] = useState<string>('');
  const [newProjectDesc, setNewProjectDesc] = useState<string>('');
  const [isCreatingProject, setIsCreatingProject] = useState<boolean>(false);

  // Delete Project modal state
  const [projectToDelete, setProjectToDelete] = useState<{
    project: Project;
    checkinsCount: number;
  } | null>(null);

  const handleDeleteProject = async (id: string) => {
    try {
      const { deleteProject } = await import('@/lib/supabase/queries');
      const success = await deleteProject(id);
      if (success) {
        setProjectToDelete(null);
        await loadDashboardData();
      }
    } catch (err) {
      console.error('Error deleting project:', err);
    }
  };

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [projectsList, allCheckins, interventionsList] = await Promise.all([
        getProjects(),
        getCheckins(),
        getInterventions(),
      ]);

      const cards: ProjectCardData[] = projectsList.map((project) => {
        const projectCheckins = allCheckins.filter((c) => c.project_id === project.id);
        const trend = analyzeProjectTrend(project.id, projectCheckins);

        const sorted = [...projectCheckins].sort(
          (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        const lastCheckin = sorted[0];

        return {
          project,
          trend,
          lastCheckin,
          checkinsCount: projectCheckins.length,
        };
      });

      setProjectCards(cards);
      setInterventions(interventionsList);
    } catch (err) {
      console.error('Error loading dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectName.trim()) return;

    setIsCreatingProject(true);
    try {
      const { createProject } = await import('@/lib/supabase/queries');
      await createProject({
        name: newProjectName.trim(),
        description: newProjectDesc.trim() || null,
        status: 'active',
      });

      setShowNewProjectModal(false);
      setNewProjectName('');
      setNewProjectDesc('');
      await loadDashboardData();
    } catch (err) {
      console.error('Error creating project:', err);
    } finally {
      setIsCreatingProject(false);
    }
  };

  const handleFeedbackUpdated = (id: string, response: UserResponse) => {
    setInterventions((prev) =>
      prev.map((item) => (item.id === id ? { ...item, user_response: response } : item))
    );
  };

  // Filter projects needing attention (declining or sudden drop)
  const atRiskProjects = projectCards.filter(
    (c) => c.trend.flagType === 'declining' || c.trend.isSuddenDrop
  );

  const improvingCount = projectCards.filter((c) => c.trend.flagType === 'improving').length;
  const stableCount = projectCards.filter((c) => c.trend.flagType === 'stable').length;

  return (
    <div className="space-y-8">
      {/* Hero Welcome Banner */}
      <div className="relative bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 overflow-hidden shadow-2xl">
        <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            Hệ thống phát hiện xói mòn động lực thông minh
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight leading-tight">
            Theo dõi & Nhận diện Sớm Xu Hướng Suy Giảm
          </h1>
          <p className="text-slate-300 text-xs sm:text-sm mt-2 leading-relaxed">
            Khác với habit tracker thông thường chỉ đếm streak, hệ thống sử dụng thuật toán hồi quy tuyến tính (OLS)
            trên cửa sổ trượt 21 ngày để phát hiện sự suy giảm tiệm tiến và phân biệt với kiệt sức cấp tính,
            giúp bạn can thiệp kịp thời trước khi từ bỏ mục tiêu.
          </p>

          <div className="mt-5 flex flex-wrap gap-3">
            <button
              onClick={() => setShowNewProjectModal(true)}
              className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-lg shadow-indigo-600/20 transition-all active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Thêm Dự Án Mới</span>
            </button>
            <a
              href="#projects-section"
              className="inline-flex items-center gap-2 bg-slate-800/80 hover:bg-slate-700/80 text-slate-200 text-xs font-semibold px-4 py-2.5 rounded-xl border border-slate-700 transition-all"
            >
              <span>Xem Danh Sách ({projectCards.length})</span>
            </a>
          </div>
        </div>
      </div>

      {/* KPI Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Total Active */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-sm">
          <div className="text-slate-400 text-xs font-medium">Dự án Đang Theo Dõi</div>
          <div className="text-2xl font-black text-white font-mono mt-1">
            {loading ? '...' : projectCards.length}
          </div>
          <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
            <Clock className="w-3 h-3 text-slate-400" />
            <span>Đang hoạt động</span>
          </div>
        </div>

        {/* At Risk (Declining / Sudden Drop) */}
        <div className="bg-slate-900/90 border border-rose-950/60 rounded-2xl p-4 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-16 h-16 bg-rose-500/5 rounded-bl-full pointer-events-none" />
          <div className="text-rose-400 text-xs font-medium flex items-center gap-1">
            <AlertTriangle className="w-3.5 h-3.5" />
            Cần Can Thiệp Sớm
          </div>
          <div className="text-2xl font-black text-rose-400 font-mono mt-1">
            {loading ? '...' : atRiskProjects.length}
          </div>
          <div className="text-[11px] text-rose-300/80 mt-1">
            {atRiskProjects.length > 0 ? 'Phát hiện xu hướng giảm' : 'Tất cả đều ổn định'}
          </div>
        </div>

        {/* Improving */}
        <div className="bg-slate-900/90 border border-emerald-950/60 rounded-2xl p-4 shadow-sm">
          <div className="text-emerald-400 text-xs font-medium flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5" />
            Đang Tăng Tiến
          </div>
          <div className="text-2xl font-black text-emerald-400 font-mono mt-1">
            {loading ? '...' : improvingCount}
          </div>
          <div className="text-[11px] text-emerald-300/80 mt-1">
            Động lực duy trì đi lên
          </div>
        </div>

        {/* Stable */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-sm">
          <div className="text-indigo-400 text-xs font-medium flex items-center gap-1">
            <Minus className="w-3.5 h-3.5" />
            Ổn Định
          </div>
          <div className="text-2xl font-black text-slate-200 font-mono mt-1">
            {loading ? '...' : stableCount}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Biến thiên trong ngưỡng an toàn
          </div>
        </div>
      </div>

      {/* Critical Early Warning Section (If at-risk projects exist) */}
      {atRiskProjects.length > 0 && (
        <div className="bg-rose-950/20 border border-rose-800/40 rounded-3xl p-6 shadow-xl relative overflow-hidden">
          <div className="flex items-center gap-2 text-rose-400 font-bold text-sm mb-3">
            <ShieldAlert className="w-5 h-5 text-rose-400 animate-pulse" />
            <span>CẢNH BÁO XU HƯỚNG SUY GIẢM ĐỘNG LỰC (ACTION REQUIRED)</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {atRiskProjects.map(({ project, trend, lastCheckin }) => (
              <div
                key={project.id}
                className="bg-slate-900/90 border border-rose-900/40 rounded-2xl p-4 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-white text-sm">{project.name}</h4>
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20 font-medium">
                      {trend.isSuddenDrop ? 'Tụt điểm cấp tính' : 'Đang suy giảm đều'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                    {project.description}
                  </p>

                  <div className="mt-3 flex items-center gap-3 text-xs text-slate-300">
                    <div className="bg-slate-800/80 px-2.5 py-1 rounded-lg">
                      <span className="text-slate-400">Độ dốc: </span>
                      <strong className="text-rose-400 font-mono">{trend.slope}/ngày</strong>
                    </div>
                    <div className="bg-slate-800/80 px-2.5 py-1 rounded-lg">
                      <span className="text-slate-400">Điểm gần nhất: </span>
                      <strong className="text-white font-mono">
                        {lastCheckin?.score !== undefined ? `${lastCheckin.score}/10` : 'N/A'}
                      </strong>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between">
                  <span className="text-[11px] text-slate-500">
                    Ghi nhận {trend.dataPointCount} lần trong 21 ngày
                  </span>
                  <Link
                    href={`/projects/${project.id}`}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-rose-400 hover:text-rose-300 transition-colors"
                  >
                    <span>Xem Phân Tích & Can Thiệp</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Active Interventions Stream */}
      {interventions.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              Gợi Ý Can Thiệp Chủ Động Gần Đây
            </h3>
            <span className="text-xs text-slate-400">
              Dựa trên phân tích hồi quy & ngữ cảnh công việc
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {interventions.slice(0, 4).map((item) => {
              const proj = projectCards.find((c) => c.project.id === item.project_id)?.project;
              return (
                <InterventionCard
                  key={item.id}
                  intervention={item}
                  projectName={proj?.name}
                  onFeedbackUpdated={handleFeedbackUpdated}
                />
              );
            })}
          </div>
        </div>
      )}

      {/* All Projects Grid */}
      <div id="projects-section" className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-white">Tất Cả Dự Án / Mục Tiêu</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Được đồng bộ với dữ liệu mẫu MEP & cá nhân (pyRevit tools, MotoCare, AI MEP integration)
            </p>
          </div>

          <button
            onClick={() => setShowNewProjectModal(true)}
            className="inline-flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold px-3 py-1.5 rounded-xl border border-slate-700 transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Thêm Mới</span>
          </button>
        </div>

        {loading ? (
          <div className="h-48 flex items-center justify-center text-slate-500">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-5">
            {projectCards.map(({ project, trend, lastCheckin }) => (
              <div
                key={project.id}
                className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 shadow-lg flex flex-col justify-between transition-all group"
              >
                <div>
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="font-bold text-white text-base group-hover:text-indigo-300 transition-colors">
                      {project.name}
                    </h3>

                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      {/* Status Badge */}
                      {trend.isSuddenDrop ? (
                        <span className="inline-flex items-center gap-1 text-[11px] px-2.5 py-0.5 rounded-full bg-red-600/20 text-red-300 border border-red-500/30 font-medium">
                          <AlertTriangle className="w-3 h-3" /> Tụt điểm cấp tính
                        </span>
                      ) : trend.flagType === 'declining' ? (
                        <span className="inline-flex items-center gap-1 text-[11px] px-2.5 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20 font-medium">
                          <TrendingDown className="w-3 h-3" /> Đang suy giảm
                        </span>
                      ) : trend.flagType === 'improving' ? (
                        <span className="inline-flex items-center gap-1 text-[11px] px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
                          <TrendingUp className="w-3 h-3" /> Đang tiến bộ
                        </span>
                      ) : trend.flagType === 'volatile' ? (
                        <span className="inline-flex items-center gap-1 text-[11px] px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 font-medium">
                          <Activity className="w-3 h-3" /> Biến động mạnh
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-medium">
                          <Minus className="w-3 h-3" /> Ổn định
                        </span>
                      )}

                      {/* Delete Project Quick Action */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setProjectToDelete({ project, checkinsCount: projectCards.find((c) => c.project.id === project.id)?.checkinsCount || 0 });
                        }}
                        title={`Xóa dự án "${project.name}"`}
                        className="p-1 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors opacity-80 hover:opacity-100"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <p className="text-xs text-slate-400 mt-2 line-clamp-2">
                    {project.description || 'Không có mô tả chi tiết'}
                  </p>

                  {/* Trendline Metrics Mini */}
                  <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs">
                    <div className="bg-slate-800/60 p-2 rounded-xl border border-slate-800">
                      <div className="text-[10px] text-slate-500">Độ dốc (Slope)</div>
                      <div
                        className={`font-mono font-bold mt-0.5 ${
                          trend.slope < 0
                            ? 'text-rose-400'
                            : trend.slope > 0
                            ? 'text-emerald-400'
                            : 'text-slate-300'
                        }`}
                      >
                        {trend.slope > 0 ? `+${trend.slope}` : trend.slope}
                      </div>
                    </div>

                    <div className="bg-slate-800/60 p-2 rounded-xl border border-slate-800">
                      <div className="text-[10px] text-slate-500">Điểm Gần Nhất</div>
                      <div className="font-mono font-bold text-white mt-0.5">
                        {lastCheckin?.score !== undefined ? `${lastCheckin.score}/10` : 'N/A'}
                      </div>
                    </div>

                    <div className="bg-slate-800/60 p-2 rounded-xl border border-slate-800">
                      <div className="text-[10px] text-slate-500">Độ Tin Cậy R²</div>
                      <div className="font-mono font-bold text-cyan-300 mt-0.5">
                        {(trend.rSquared * 100).toFixed(0)}%
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer action buttons */}
                <div className="mt-5 pt-3 border-t border-slate-800 flex items-center justify-between gap-2">
                  <Link
                    href={`/projects/${project.id}/checkin`}
                    className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition-colors"
                  >
                    + Check-in Nhanh
                  </Link>

                  <Link
                    href={`/projects/${project.id}`}
                    className="inline-flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700/80 text-white text-xs font-semibold px-3 py-1.5 rounded-xl transition-all"
                  >
                    <span>Xem Chi Tiết & Biểu Đồ</span>
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create New Project Modal */}
      {showNewProjectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-white">Tạo Dự Án / Mục Tiêu Mới</h3>
            <p className="text-xs text-slate-400">
              Nhập tên và mục tiêu của dự án để bắt đầu theo dõi đường cong động lực.
            </p>

            <form onSubmit={handleCreateProject} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Tên dự án *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Vd: Auto-Slicer CAD plugin, Học Rust..."
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Mô tả mục tiêu
                </label>
                <textarea
                  placeholder="Mô tả phạm vi hoặc kỳ vọng hoàn thành..."
                  rows={3}
                  value={newProjectDesc}
                  onChange={(e) => setNewProjectDesc(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewProjectModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isCreatingProject}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md disabled:opacity-50"
                >
                  {isCreatingProject ? 'Đang tạo...' : 'Tạo Dự Án'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <DeleteProjectModal
        isOpen={Boolean(projectToDelete)}
        projectId={projectToDelete?.project.id || ''}
        projectName={projectToDelete?.project.name || ''}
        checkinsCount={projectToDelete?.checkinsCount}
        onClose={() => setProjectToDelete(null)}
        onConfirmDelete={handleDeleteProject}
      />
    </div>
  );
}
