'use client';

/**
 * Component: CheckinForm.tsx
 * Description: Quick 10-15 second check-in interface. Features motivation score slider (1-10),
 * optional physical energy rating (1-10), and context notes.
 * UX Principle: Shows coverage count (X/Y days in last 30 days) instead of all-or-nothing streaks.
 */

import React, { useState } from 'react';
import { Flame, BatteryCharging, Send, CheckCircle2, AlertCircle } from 'lucide-react';
import { ContextTagSelector, PRESET_CONTEXT_TAGS } from './ContextTagSelector';
import { ContextTag } from '../../lib/supabase/types';
import { useUserApiKey } from '../../hooks/useUserApiKey';

interface CheckinFormProps {
  projectId: string;
  projectName?: string;
  coverageCount?: number; // e.g. 14 checkins in last 30 days
  onCheckinSuccess?: (newCheckin: any, trendAnalysis?: any, intervention?: any) => void;
}

export const CheckinForm: React.FC<CheckinFormProps> = ({
  projectId,
  projectName,
  coverageCount = 12,
  onCheckinSuccess,
}) => {
  const { apiKey: customApiKey } = useUserApiKey();
  const [score, setScore] = useState<number>(7);
  const [energy, setEnergy] = useState<number>(7);
  const [includeEnergy, setIncludeEnergy] = useState<boolean>(false);

  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [contextNote, setContextNote] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);


  // Score feeling labels
  const getScoreDescription = (val: number) => {
    if (val <= 2) return 'Kiệt quệ / Muốn bỏ cuộc hoàn toàn';
    if (val <= 4) return 'Nản lòng / Rất khó bắt đầu làm việc';
    if (val <= 6) return 'Bình thường / Duy trì ở mức trung bình';
    if (val <= 8) return 'Hào hứng / Có tiến triển rõ ràng';
    return 'Hừng hực khí thế / Đỉnh cao năng suất';
  };

  const getScoreColor = (val: number) => {
    if (val <= 3) return 'text-rose-400';
    if (val <= 6) return 'text-amber-400';
    if (val <= 8) return 'text-cyan-400';
    return 'text-emerald-400';
  };

  const handleToggleTag = (tag: ContextTag) => {
    setSelectedTagIds((prev) => {
      const exists = prev.includes(tag.id);
      const updated = exists ? prev.filter((id) => id !== tag.id) : [...prev, tag.id];

      // Auto-assist energy slider if biological state is chosen
      if (!exists && tag.id === 'fatigue') {
        setIncludeEnergy(true);
        setEnergy(3);
      } else if (!exists && tag.id === 'high_energy') {
        setIncludeEnergy(true);
        setEnergy(8);
      }
      return updated;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    // Compose formatted note with 1-tap tag tokens
    const tagPrefix = selectedTagIds
      .map((id) => PRESET_CONTEXT_TAGS.find((t) => t.id === id)?.label)
      .filter(Boolean)
      .map((label) => `[${label}]`)
      .join(' ');

    const fullContextNote = [tagPrefix, contextNote.trim()].filter(Boolean).join(' ');

    try {
      const requestHeaders: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (customApiKey) {
        requestHeaders['x-gemini-api-key'] = customApiKey;
      }

      const res = await fetch('/api/checkins', {
        method: 'POST',
        headers: requestHeaders,
        body: JSON.stringify({
          project_id: projectId,
          score,
          energy: includeEnergy ? energy : null,
          context_note: fullContextNote || null,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Không thể lưu check-in');
      }

      setSuccessMessage('Đã ghi nhận check-in thành công!');
      setContextNote('');
      setSelectedTagIds([]);

      if (onCheckinSuccess) {
        onCheckinSuccess(data.checkin, data.trendAnalysis, data.intervention);
      }

      setTimeout(() => {
        setSuccessMessage(null);
      }, 4000);
    } catch (err: any) {
      setErrorMessage(err.message || 'Lỗi khi gửi dữ liệu');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
      {/* Background soft glow */}
      <div className="absolute -top-16 -right-16 w-36 h-36 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <span className="text-xs font-semibold text-indigo-400 uppercase tracking-wider">
            Check-in Nhanh (15 giây)
          </span>
          <h4 className="text-base font-bold text-white mt-0.5">
            {projectName ? `Động lực cho: ${projectName}` : 'Ghi nhận mức độ gắn kết'}
          </h4>
        </div>

        {/* Positive non-punitive UX tracker */}
        <div className="text-right">
          <div className="text-xs text-slate-400">Độ che phủ 30 ngày</div>
          <div className="text-xs font-semibold text-emerald-400 font-mono">
            {coverageCount}/30 ngày đã ghi
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* 1. Motivation Score Slider */}
        <div>
          <div className="flex justify-between items-center mb-1.5">
            <label className="text-sm font-medium text-slate-200 flex items-center gap-1.5">
              <Flame className="w-4 h-4 text-amber-400" />
              Điểm động lực tinh thần:
            </label>
            <span className={`font-mono text-xl font-black ${getScoreColor(score)}`}>
              {score}<span className="text-xs text-slate-500 font-normal">/10</span>
            </span>
          </div>

          <input
            type="range"
            min="1"
            max="10"
            step="1"
            value={score}
            onChange={(e) => setScore(Number(e.target.value))}
            className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
          />

          <div className="flex justify-between text-[11px] text-slate-500 mt-1 font-mono">
            <span>1 (Bỏ cuộc)</span>
            <span className={`italic font-sans ${getScoreColor(score)}`}>
              {getScoreDescription(score)}
            </span>
            <span>10 (Đỉnh cao)</span>
          </div>
        </div>

        {/* 2. Optional Physical Energy Slider */}
        <div className="pt-2 border-t border-slate-800/80">
          <div className="flex items-center justify-between mb-1">
            <button
              type="button"
              onClick={() => setIncludeEnergy(!includeEnergy)}
              className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1.5 transition-colors"
            >
              <BatteryCharging className="w-3.5 h-3.5 text-cyan-400" />
              <span>{includeEnergy ? 'Ẩn mức năng lượng thể chất' : '+ Tách biệt mức năng lượng thể chất (Tùy chọn)'}</span>
            </button>
            {includeEnergy && (
              <span className="font-mono text-sm font-bold text-cyan-400">{energy}/10</span>
            )}
          </div>

          {includeEnergy && (
            <div className="mt-2 pl-2 border-l-2 border-slate-800">
              <input
                type="range"
                min="1"
                max="10"
                step="1"
                value={energy}
                onChange={(e) => setEnergy(Number(e.target.value))}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
              />
              <div className="flex justify-between text-[10px] text-slate-500 mt-0.5 font-mono">
                <span>1 (Cạn kiệt sức)</span>
                <span>10 (Tràn đầy sinh lực)</span>
              </div>
            </div>
          )}
        </div>

        {/* 3. Quick 1-Tap Context Tags */}
        <ContextTagSelector
          selectedTagIds={selectedTagIds}
          onToggleTag={handleToggleTag}
          disabled={isSubmitting}
        />

        {/* 4. Optional Context Note */}
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1.5">
            Ghi chú ngữ cảnh bổ sung (Tùy chọn):
          </label>
          <input
            type="text"
            placeholder="Vd: Vừa xong milestone / Gặp bug khó / Bị phân tâm việc khác..."
            value={contextNote}
            onChange={(e) => setContextNote(e.target.value)}
            maxLength={150}
            className="w-full bg-slate-800/70 border border-slate-700/80 rounded-xl px-3.5 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
          />
        </div>

        {/* Status Alerts */}
        {successMessage && (
          <div className="flex items-center gap-2 p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {errorMessage && (
          <div className="flex items-center gap-2 p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs animate-in fade-in">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-medium py-2.5 px-4 rounded-xl text-xs transition-all shadow-md hover:shadow-indigo-500/25 active:scale-[0.99] disabled:opacity-50"
        >
          {isSubmitting ? (
            <span>Đang ghi nhận...</span>
          ) : (
            <>
              <Send className="w-3.5 h-3.5" />
              <span>Ghi Nhận Check-in</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
};
