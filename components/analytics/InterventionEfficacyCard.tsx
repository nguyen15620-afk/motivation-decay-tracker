'use client';

/**
 * Component: InterventionEfficacyCard.tsx
 * Description: Visualizes real-world behavioral recovery following an intervention.
 * Displays Recovery Delta (Δ = Slope_post - Slope_pre), effectiveness classification,
 * and escalation status when decay continues.
 */

import React from 'react';
import { TrendingUp, AlertTriangle, CheckCircle2, Clock, ShieldAlert, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { EfficacyEvaluation } from '../../lib/supabase/types';

interface InterventionEfficacyCardProps {
  evaluation: EfficacyEvaluation | null;
  interventionMessage?: string;
  suggestionType?: string;
}

export const InterventionEfficacyCard: React.FC<InterventionEfficacyCardProps> = ({
  evaluation,
  interventionMessage,
  suggestionType,
}) => {
  if (!evaluation) return null;

  const { status, recoveryDelta, preSlope, postSlope, isEffective, escalationRecommended, postCheckinCount } = evaluation;

  const getStatusBadge = () => {
    switch (status) {
      case 'effective':
        return {
          icon: <CheckCircle2 className="w-4 h-4 text-emerald-400" />,
          label: 'Phục hồi rõ rệt (Hiệu quả cao)',
          bg: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300',
        };
      case 'partial':
        return {
          icon: <TrendingUp className="w-4 h-4 text-amber-400" />,
          label: 'Chuyển biến bước đầu',
          bg: 'bg-amber-500/10 border-amber-500/30 text-amber-300',
        };
      case 'ineffective':
        return {
          icon: <AlertTriangle className="w-4 h-4 text-rose-400" />,
          label: 'Chưa phục hồi (Cần đổi chiến lược)',
          bg: 'bg-rose-500/10 border-rose-500/30 text-rose-300',
        };
      case 'insufficient_data':
      default:
        return {
          icon: <Clock className="w-4 h-4 text-slate-400" />,
          label: `Đang theo dõi (${postCheckinCount}/3 check-in sau can thiệp)`,
          bg: 'bg-slate-800 border-slate-700 text-slate-400',
        };
    }
  };

  const badge = getStatusBadge();

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg relative overflow-hidden">
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-indigo-400" />
          <h3 className="text-sm font-semibold text-slate-200">
            Hiệu Quả Can Thiệp Thực Tế (Efficacy Loop)
          </h3>
        </div>
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium border ${badge.bg}`}>
          {badge.icon}
          <span>{badge.label}</span>
        </span>
      </div>

      {status === 'insufficient_data' ? (
        <p className="text-xs text-slate-400 leading-relaxed">
          Hệ thống đang tích lũy dữ liệu sau can thiệp gần nhất. Hãy duy trì check-in ít nhất 3 lần để đo lường chính xác chỉ số hồi phục (Recovery Delta).
        </p>
      ) : (
        <div className="space-y-3">
          {/* Recovery Delta & Metric grid */}
          <div className="grid grid-cols-3 gap-2.5 pt-1">
            <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-3">
              <span className="text-[10px] text-slate-400 block mb-0.5">Độ dốc trước (Pre)</span>
              <div className="flex items-center gap-1 text-xs font-mono font-bold text-rose-400">
                <ArrowDownRight className="w-3.5 h-3.5" />
                <span>{preSlope > 0 ? `+${preSlope}` : preSlope}/ngày</span>
              </div>
            </div>

            <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-3">
              <span className="text-[10px] text-slate-400 block mb-0.5">Độ dốc sau (Post)</span>
              <div className={`flex items-center gap-1 text-xs font-mono font-bold ${
                postSlope >= 0 ? 'text-emerald-400' : 'text-rose-400'
              }`}>
                {postSlope >= 0 ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                <span>{postSlope > 0 ? `+${postSlope}` : postSlope}/ngày</span>
              </div>
            </div>

            <div className="bg-indigo-950/40 border border-indigo-500/30 rounded-xl p-3">
              <span className="text-[10px] text-indigo-300 block mb-0.5">Chỉ số hồi phục (Δ)</span>
              <div className={`text-xs font-mono font-bold ${
                recoveryDelta > 0 ? 'text-emerald-400' : 'text-rose-400'
              }`}>
                {recoveryDelta > 0 ? `+${recoveryDelta}` : recoveryDelta}
              </div>
            </div>
          </div>

          {/* Escalation Alert */}
          {escalationRecommended && (
            <div className="flex items-start gap-2.5 p-3 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-300 text-xs">
              <ShieldAlert className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold block mb-0.5">Kích hoạt Giao thức Nâng cấp (Escalation Protocol):</span>
                <span>
                  Các hành động vi mô trước đó chưa giúp dự án thoát khỏi suy giảm. Lần can thiệp kế tiếp sẽ chuyển hướng từ chia nhỏ task sang điều chỉnh khung giờ làm việc hoặc tìm kiếm sự hỗ trợ từ bên ngoài.
                </span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
