'use client';

/**
 * Page: /projects/[id]
 * Description: Dedicated project deep-dive displaying the interactive Recharts regression
 * trendline, 15-second check-in module, smart coaching interventions, and granular check-in log.
 */

import React, { useEffect, useState, use } from 'react';
import Link from 'next/link';
import {
  Project,
  Checkin,
  Intervention,
  TrendAnalysisResult,
  UserResponse,
} from '@/lib/supabase/types';
import { getProjectById, getCheckins, getInterventions } from '@/lib/supabase/queries';
import { analyzeProjectTrend } from '@/lib/trend/regression';
import { TrendLine } from '@/components/charts/TrendLine';
import { CheckinForm } from '@/components/checkin/CheckinForm';
import { InterventionCard } from '@/components/interventions/InterventionCard';
import { InterventionEfficacyCard } from '@/components/analytics/InterventionEfficacyCard';
import { evaluateInterventionEfficacy } from '@/lib/interventions/analytics/efficacy';
import {

  ArrowLeft,
  Calendar,
  Sparkles,
  ClipboardList,
  CheckCircle2,
  TrendingDown,
  TrendingUp,
  Activity,
  Minus,
} from 'lucide-react';

export default function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const projectId = resolvedParams.id;

  const [project, setProject] = useState<Project | null>(null);
  const [checkins, setCheckins] = useState<Checkin[]>([]);
  const [interventions, setInterventions] = useState<Intervention[]>([]);
  const [trendAnalysis, setTrendAnalysis] = useState<TrendAnalysisResult | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchProjectData = async () => {
    setLoading(true);
    try {
      const [projData, checkinsData, interventionsData] = await Promise.all([
        getProjectById(projectId),
        getCheckins(projectId),
        getInterventions(projectId),
      ]);

      if (projData) {
        setProject(projData);
        setCheckins(checkinsData);
        setInterventions(interventionsData);
        const analysis = analyzeProjectTrend(projectId, checkinsData);
        setTrendAnalysis(analysis);
      }
    } catch (err) {
      console.error('Error fetching project data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjectData();
  }, [projectId]);

  // Handle seamless optimistic check-in update
  const handleCheckinSuccess = (
    newCheckin: Checkin,
    updatedTrend?: TrendAnalysisResult,
    newIntervention?: Intervention
  ) => {
    const updatedCheckins = [...checkins, newCheckin];
    setCheckins(updatedCheckins);

    if (updatedTrend) {
      setTrendAnalysis(updatedTrend);
    } else {
      setTrendAnalysis(analyzeProjectTrend(projectId, updatedCheckins));
    }

    if (newIntervention) {
      setInterventions((prev) => [newIntervention, ...prev]);
    }
  };

  const handleFeedbackUpdated = (id: string, response: UserResponse) => {
    setInterventions((prev) =>
      prev.map((item) => (item.id === id ? { ...item, user_response: response } : item))
    );
  };

  if (loading) {
    return (
      <div className="h-96 flex flex-col items-center justify-center text-slate-500">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-500 mb-4" />
        <p className="text-sm">Đang phân tích xu hướng hồi quy cho dự án...</p>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="text-center py-20 bg-slate-900 border border-slate-800 rounded-3xl p-8 max-w-lg mx-auto">
        <h2 className="text-xl font-bold text-white mb-2">Không Tìm Thấy Dự Án</h2>
        <p className="text-xs text-slate-400 mb-6">
          Dự án với ID "{projectId}" không tồn tại hoặc đã bị gỡ bỏ.
        </p>
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Quay lại Dashboard</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Top Breadcrumb & Project Header */}
      <div>
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors mb-4"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Quay lại Tổng quan Dashboard</span>
        </Link>

        <div className="flex flex-wrap items-start justify-between gap-4 bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                {project.name}
              </h1>
              <span className="text-xs px-3 py-1 rounded-full bg-slate-800 text-slate-300 border border-slate-700 font-mono">
                {project.status.toUpperCase()}
              </span>
            </div>

            <p className="text-slate-300 text-xs sm:text-sm mt-2 max-w-2xl leading-relaxed">
              {project.description || 'Chưa có mô tả mục tiêu chi tiết.'}
            </p>

            <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-slate-400">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-500" />
                Khởi tạo: {new Date(project.created_at).toLocaleDateString('vi-VN')}
              </span>
              <span>&bull;</span>
              <span>
                Tổng số lần check-in: <strong className="text-white font-mono">{checkins.length}</strong>
              </span>
            </div>
          </div>

          {/* Quick Status Pill */}
          {trendAnalysis && (
            <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-4 text-right">
              <div className="text-[11px] text-slate-400 uppercase tracking-wider">
                Đánh giá xu hướng hiện tại
              </div>
              <div className="text-base font-bold text-white mt-1 flex items-center justify-end gap-1.5">
                {trendAnalysis.flagType === 'declining' && (
                  <span className="text-rose-400 flex items-center gap-1">
                    <TrendingDown className="w-4 h-4" /> Đang suy giảm đều
                  </span>
                )}
                {trendAnalysis.flagType === 'improving' && (
                  <span className="text-emerald-400 flex items-center gap-1">
                    <TrendingUp className="w-4 h-4" /> Đang phát triển tốt
                  </span>
                )}
                {trendAnalysis.flagType === 'volatile' && (
                  <span className="text-amber-400 flex items-center gap-1">
                    <Activity className="w-4 h-4" /> Động lực dao động mạnh
                  </span>
                )}
                {trendAnalysis.flagType === 'stable' && (
                  <span className="text-indigo-400 flex items-center gap-1">
                    <Minus className="w-4 h-4" /> Giữ mức ổn định
                  </span>
                )}
              </div>
              <div className="text-[11px] text-slate-400 mt-1 font-mono">
                Slope: {trendAnalysis.slope}/ngày &bull; R²: {(trendAnalysis.rSquared * 100).toFixed(0)}%
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Grid: Chart + Quick Check-in Form */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Chart Column (2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          {trendAnalysis && (
            <TrendLine trendAnalysis={trendAnalysis} projectName={project.name} />
          )}

          {/* Interventions Stream for this project */}
          <div className="space-y-4">
            {/* Efficacy Recovery Loop */}
            {interventions.length > 0 && (
              <InterventionEfficacyCard
                evaluation={evaluateInterventionEfficacy({
                  intervention: interventions[0],
                  checkins,
                })}
              />
            )}

            <h3 className="text-base font-bold text-white flex items-center gap-2 pt-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              Lịch Sử Can Thiệp & Đề Xuất Cho Dự Án
            </h3>

            {interventions.length === 0 ? (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-center text-xs text-slate-400">
                <CheckCircle2 className="w-6 h-6 text-emerald-400 mx-auto mb-2 opacity-80" />
                Dự án chưa phát hiện dấu hiệu suy giảm đáng kể. Hệ thống sẽ tự động đưa ra can thiệp khi độ dốc hoặc biến động vượt ngưỡng cảnh báo.
              </div>
            ) : (
              <div className="space-y-3">
                {interventions.map((item) => (
                  <InterventionCard
                    key={item.id}
                    intervention={item}
                    projectName={project.name}
                    onFeedbackUpdated={handleFeedbackUpdated}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Check-in Column (1 col) */}
        <div className="space-y-6">
          <CheckinForm
            projectId={project.id}
            projectName={project.name}
            coverageCount={Math.min(30, checkins.length)}
            onCheckinSuccess={handleCheckinSuccess}
          />

          {/* Motivational Principle Card */}
          <div className="bg-indigo-950/20 border border-indigo-900/30 rounded-2xl p-4 text-xs text-slate-300 space-y-2">
            <div className="font-semibold text-indigo-300 flex items-center gap-1.5">
              <span>💡 Nguyên lý theo dõi không áp lực</span>
            </div>
            <p className="leading-relaxed text-[11px] text-slate-400">
              Hệ thống không phạt nếu bạn bỏ lỡ ngày. Mục tiêu duy nhất là phát hiện xu hướng suy giảm dần theo thời gian (Gradual Erosion) để gợi ý chia nhỏ công việc trước khi bạn bỏ cuộc hoàn toàn.
            </p>
          </div>
        </div>
      </div>

      {/* Historical Check-in Log Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <ClipboardList className="w-4 h-4 text-indigo-400" />
            Nhật Ký Check-in Lịch Sử
          </h3>
          <span className="text-xs text-slate-400">
            {checkins.length} bản ghi đã lưu
          </span>
        </div>

        {checkins.length === 0 ? (
          <div className="text-center py-8 text-xs text-slate-500">
            Chưa có lượt check-in nào cho dự án này.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-800/60 text-slate-400 uppercase font-semibold text-[10px] tracking-wider border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Thời Gian</th>
                  <th className="py-3 px-4 text-center">Điểm Động Lực</th>
                  <th className="py-3 px-4 text-center">Năng Lượng</th>
                  <th className="py-3 px-4">Ghi Chú Ngữ Cảnh</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {[...checkins]
                  .sort(
                    (a, b) =>
                      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
                  )
                  .map((checkin) => (
                    <tr key={checkin.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-3 px-4 text-slate-400 font-mono text-[11px]">
                        {new Date(checkin.created_at).toLocaleDateString('vi-VN', {
                          year: 'numeric',
                          month: '2-digit',
                          day: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`font-mono font-bold px-2 py-0.5 rounded-md ${
                            checkin.score >= 8
                              ? 'bg-emerald-500/10 text-emerald-400'
                              : checkin.score >= 5
                              ? 'bg-amber-500/10 text-amber-400'
                              : 'bg-rose-500/10 text-rose-400'
                          }`}
                        >
                          {checkin.score}/10
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center text-slate-400 font-mono">
                        {checkin.energy !== null && checkin.energy !== undefined ? (
                          <span className="text-cyan-400">{checkin.energy}/10</span>
                        ) : (
                          <span className="text-slate-600">—</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-slate-300">
                        {checkin.context_note ? (
                          <span>"{checkin.context_note}"</span>
                        ) : (
                          <span className="text-slate-600 italic">Không có ghi chú</span>
                        )}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
