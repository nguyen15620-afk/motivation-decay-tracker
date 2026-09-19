'use client';

/**
 * Component: TrendLine.tsx
 * Description: Recharts visualization for motivation time-series, linear regression
 * best-fit trendline, physical energy correlation, and contextual tooltip annotations.
 */

import React from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  ReferenceLine,
} from 'recharts';
import { TrendAnalysisResult } from '@/lib/supabase/types';
import { TrendingDown, TrendingUp, Minus, Activity, AlertTriangle } from 'lucide-react';

interface TrendLineProps {
  trendAnalysis: TrendAnalysisResult;
  projectName?: string;
}

export const TrendLine: React.FC<TrendLineProps> = ({ trendAnalysis, projectName }) => {
  const {
    slope,
    rSquared,
    flagType,
    isSuddenDrop,
    historicalTrendLine,
    averageScore,
    dataPointCount,
  } = trendAnalysis;

  // Choose trendline color based on classification
  const getTrendlineColor = () => {
    if (isSuddenDrop || flagType === 'declining') return '#EF4444'; // Red/Rose
    if (flagType === 'improving') return '#10B981'; // Green
    if (flagType === 'volatile') return '#F59E0B'; // Amber
    return '#6366F1'; // Indigo for stable
  };

  const trendColor = getTrendlineColor();

  // Custom formatted tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-slate-900/95 text-slate-100 border border-slate-700 p-3 rounded-xl shadow-xl text-xs max-w-xs backdrop-blur-md">
          <div className="font-semibold text-slate-300 mb-1 border-b border-slate-800 pb-1 flex justify-between">
            <span>Ngày: {label}</span>
            <span className="text-indigo-400 font-mono">
              Điểm: {data.actualScore !== undefined ? `${data.actualScore}/10` : 'N/A'}
            </span>
          </div>

          <div className="space-y-1 my-1.5">
            {data.predictedScore !== undefined && (
              <div className="flex justify-between text-slate-400">
                <span>Đường xu hướng:</span>
                <span className="font-mono text-amber-400">{data.predictedScore}</span>
              </div>
            )}
            {data.energy !== null && data.energy !== undefined && (
              <div className="flex justify-between text-slate-400">
                <span>Mức năng lượng:</span>
                <span className="font-mono text-cyan-400">{data.energy}/10</span>
              </div>
            )}
          </div>

          {data.note && (
            <div className="mt-2 pt-2 border-t border-slate-800 text-slate-300 italic bg-slate-800/50 p-1.5 rounded">
              "{data.note}"
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
      {/* Header & Metrics */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-5">
        <div>
          <div className="text-xs font-medium text-slate-400 uppercase tracking-wider">
            Biểu Đồ Xu Hướng Động Lực
          </div>
          <h3 className="text-lg font-bold text-white flex items-center gap-2 mt-0.5">
            {projectName || 'Dự án'}
            {flagType === 'declining' && (
              <span className="inline-flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20 font-medium">
                <TrendingDown className="w-3 h-3" /> Đang suy giảm
              </span>
            )}
            {flagType === 'improving' && (
              <span className="inline-flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
                <TrendingUp className="w-3 h-3" /> Đang tiến bộ
              </span>
            )}
            {flagType === 'volatile' && (
              <span className="inline-flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 font-medium">
                <Activity className="w-3 h-3" /> Biến động mạnh
              </span>
            )}
            {flagType === 'stable' && (
              <span className="inline-flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-medium">
                <Minus className="w-3 h-3" /> Ổn định
              </span>
            )}
            {isSuddenDrop && (
              <span className="inline-flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full bg-red-600/20 text-red-300 border border-red-500/30 font-medium animate-pulse">
                <AlertTriangle className="w-3 h-3" /> Tụt điểm cấp tính
              </span>
            )}
          </h3>
        </div>

        {/* Statistical Badges */}
        <div className="flex items-center gap-3 text-xs">
          <div className="bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-700/60">
            <span className="text-slate-400">Độ dốc (Slope): </span>
            <span className={`font-mono font-bold ${slope < 0 ? 'text-rose-400' : slope > 0 ? 'text-emerald-400' : 'text-slate-200'}`}>
              {slope > 0 ? `+${slope}` : slope}/ngày
            </span>
          </div>
          <div className="bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-700/60">
            <span className="text-slate-400">Độ tin cậy R²: </span>
            <span className="font-mono font-bold text-cyan-300">{(rSquared * 100).toFixed(0)}%</span>
          </div>
          <div className="bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-700/60">
            <span className="text-slate-400">Điểm TB: </span>
            <span className="font-mono font-bold text-white">{averageScore}/10</span>
          </div>
        </div>
      </div>

      {/* Chart Canvas */}
      {historicalTrendLine.length === 0 ? (
        <div className="h-64 flex flex-col items-center justify-center text-slate-500 border border-dashed border-slate-800 rounded-xl">
          <Activity className="w-8 h-8 mb-2 opacity-50 text-slate-400" />
          <p className="text-sm">Chưa có đủ dữ liệu check-in trong 21 ngày gần đây</p>
          <p className="text-xs text-slate-600 mt-1">Hãy thực hiện check-in đầu tiên để bắt đầu vẽ đường xu hướng</p>
        </div>
      ) : (
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={historicalTrendLine} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
              <XAxis
                dataKey="date"
                stroke="#64748B"
                fontSize={11}
                tickFormatter={(val) => {
                  const parts = val.split('-');
                  return parts.length === 3 ? `${parts[2]}/${parts[1]}` : val;
                }}
              />
              <YAxis
                domain={[1, 10]}
                ticks={[2, 4, 6, 8, 10]}
                stroke="#64748B"
                fontSize={11}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                verticalAlign="top"
                align="right"
                wrapperStyle={{ paddingBottom: '10px', fontSize: '11px' }}
              />
              <ReferenceLine y={5} stroke="#475569" strokeDasharray="4 4" label={{ value: 'Mốc 5 (Trung bình)', fill: '#64748b', fontSize: 10 }} />

              {/* Actual Score (Line with dots) */}
              <Line
                type="monotone"
                dataKey="actualScore"
                name="Điểm thực tế"
                stroke="#38BDF8"
                strokeWidth={2.5}
                dot={{ r: 4, fill: '#38BDF8', strokeWidth: 1, stroke: '#0F172A' }}
                activeDot={{ r: 6, fill: '#0EA5E9' }}
              />

              {/* Regression Trend Line */}
              <Line
                type="linear"
                dataKey="predictedScore"
                name="Đường hồi quy (Trendline)"
                stroke={trendColor}
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={false}
              />

              {/* Physical Energy Line */}
              <Line
                type="monotone"
                dataKey="energy"
                name="Năng lượng thể chất"
                stroke="#A78BFA"
                strokeWidth={1.5}
                strokeDasharray="2 2"
                dot={{ r: 3, fill: '#A78BFA' }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Chart Footer Note */}
      <div className="mt-4 pt-3 border-t border-slate-800 text-xs text-slate-400 flex flex-wrap items-center justify-between gap-2">
        <span>
          Cửa sổ phân tích: <strong className="text-slate-300">{dataPointCount} lần ghi nhận</strong> trong 21 ngày
        </span>
        <span className="text-slate-500">
          *Đường đứt nét màu thể hiện xu hướng hồi quy tuyến tính (Linear Regression)
        </span>
      </div>
    </div>
  );
};
