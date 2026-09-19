'use client';

/**
 * Component: ContextTagSelector.tsx
 * Description: 1-Tap Quick Context Chips for low-friction check-ins.
 * Allows users to select their physical state, cognitive blockers, or milestone events
 * with a single tap, removing the friction of typing long text when tired or overwhelmed.
 */

import React from 'react';
import { Sparkles } from 'lucide-react';
import { ContextTag } from '../../lib/supabase/types';

export const PRESET_CONTEXT_TAGS: ContextTag[] = [
  // Biological
  { id: 'fatigue', label: 'Thiếu ngủ / Mệt mỏi', category: 'biological', emoji: '😴' },
  { id: 'high_energy', label: 'Thể lực sung mãn', category: 'biological', emoji: '⚡' },
  
  // Cognitive / Blockers
  { id: 'ambiguous_task', label: 'Task mơ hồ / Chưa rõ cách làm', category: 'cognitive', emoji: '🌫️' },
  { id: 'overwhelmed', label: 'Ngợp vì quá nhiều việc', category: 'cognitive', emoji: '🌊' },
  { id: 'distracted', label: 'Bị phân tâm / Họp nhiều', category: 'cognitive', emoji: '🔀' },
  
  // Milestone
  { id: 'milestone_done', label: 'Vừa hoàn thành mốc quan trọng', category: 'milestone', emoji: '🎉' },
];

interface ContextTagSelectorProps {
  selectedTagIds: string[];
  onToggleTag: (tag: ContextTag) => void;
  disabled?: boolean;
}

export const ContextTagSelector: React.FC<ContextTagSelectorProps> = ({
  selectedTagIds,
  onToggleTag,
  disabled = false,
}) => {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
          <span>Thẻ ngữ cảnh 1 chạm (Chọn nhanh không cần gõ chữ)</span>
        </label>
        <span className="text-[11px] text-slate-500">
          {selectedTagIds.length > 0 ? `Đã chọn ${selectedTagIds.length}` : 'Tùy chọn'}
        </span>
      </div>

      <div className="flex flex-wrap gap-2">
        {PRESET_CONTEXT_TAGS.map((tag) => {
          const isSelected = selectedTagIds.includes(tag.id);

          return (
            <button
              key={tag.id}
              type="button"
              disabled={disabled}
              onClick={() => onToggleTag(tag)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 border ${
                isSelected
                  ? 'bg-indigo-600/30 border-indigo-400 text-indigo-200 shadow-sm shadow-indigo-500/20 scale-[1.02]'
                  : 'bg-slate-800/80 border-slate-700/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800 hover:border-slate-600'
              } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer active:scale-95'}`}
            >
              <span>{tag.emoji}</span>
              <span>{tag.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
