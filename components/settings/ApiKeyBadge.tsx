'use client';

/**
 * Component: ApiKeyBadge.tsx
 * Description: Header button displaying current AI API Key status and opening
 * the ApiKeySettingsModal on click.
 */

import React, { useState } from 'react';
import { KeyRound, Sparkles } from 'lucide-react';
import { useUserApiKey } from '../../hooks/useUserApiKey';
import { ApiKeySettingsModal } from './ApiKeySettingsModal';

export const ApiKeyBadge: React.FC = () => {
  const { hasCustomKey, isLoaded } = useUserApiKey();
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  if (!isLoaded) {
    return null;
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setIsModalOpen(true)}
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all duration-200 shadow-sm ${
          hasCustomKey
            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/20'
            : 'bg-indigo-950/40 border-indigo-800/50 text-indigo-300 hover:bg-indigo-900/50 hover:border-indigo-700'
        }`}
        title="Quản lý Google Gemini API Key cá nhân"
      >
        {hasCustomKey ? (
          <>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <KeyRound className="w-3.5 h-3.5 text-emerald-400" />
            <span>AI: Key riêng</span>
          </>
        ) : (
          <>
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span>AI Empathy</span>
          </>
        )}
      </button>

      <ApiKeySettingsModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
};
