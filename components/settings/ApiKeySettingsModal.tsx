'use client';

/**
 * Component: ApiKeySettingsModal.tsx
 * Description: Modal dialog for managing personal Google Gemini API Key (Bring Your Own Key - BYOK).
 * Features:
 * - 4 escape routes: Escape key, backdrop click, X button, and footer "Đóng" button.
 * - Viewport safe containment: max-h-[85vh] overflow-y-auto.
 * - Live connection test against the Gemini Model Cascade chain.
 * - Zero Server Persistence: Keys are saved exclusively in client localStorage.
 */

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  KeyRound,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Trash2,
  ExternalLink,
  ShieldCheck,
  Sparkles,
  Cpu,
} from 'lucide-react';
import { useUserApiKey } from '../../hooks/useUserApiKey';

interface ApiKeySettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ApiKeySettingsModal: React.FC<ApiKeySettingsModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [mounted, setMounted] = useState<boolean>(false);
  const { apiKey, hasCustomKey, maskedKey, saveApiKey, clearApiKey } = useUserApiKey();
  const [inputKey, setInputKey] = useState<string>('');
  const [showKey, setShowKey] = useState<boolean>(false);
  const [isTesting, setIsTesting] = useState<boolean>(false);
  const [testResult, setTestResult] = useState<{
    success?: boolean;
    message?: string;
    model?: string;
  } | null>(null);

  // Ensure portal only mounts on client
  useEffect(() => {
    setMounted(true);
  }, []);


  // Close on Escape key press
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleTestConnection = async () => {
    const keyToTest = inputKey.trim() || apiKey || '';
    if (!keyToTest) {
      setTestResult({ success: false, message: 'Vui lòng nhập API Key để kiểm tra.' });
      return;
    }

    setIsTesting(true);
    setTestResult(null);

    try {
      const res = await fetch('/api/ai/test-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey: keyToTest }),
      });

      const data = await res.json();
      if (res.ok && data.valid) {
        setTestResult({
          success: true,
          model: data.model,
          message: data.message || `Kết nối Google Gemini thành công! Đang sử dụng model ${data.model || 'Flash'}.`,
        });
      } else {
        setTestResult({
          success: false,
          message: data.error || 'Key không hợp lệ hoặc không có quyền truy cập.',
        });
      }
    } catch {
      setTestResult({ success: false, message: 'Lỗi kết nối kiểm tra. Vui lòng thử lại.' });
    } finally {
      setIsTesting(false);
    }
  };

  const handleSave = () => {
    if (!inputKey.trim()) {
      setTestResult({ success: false, message: 'Vui lòng nhập API Key trước khi lưu.' });
      return;
    }

    saveApiKey(inputKey.trim());
    setInputKey('');
    setTestResult({ success: true, message: 'Đã lưu API Key vào trình duyệt thành công!' });
    setTimeout(() => {
      onClose();
    }, 1200);
  };

  const handleClear = () => {
    clearApiKey();
    setInputKey('');
    setTestResult({ success: true, message: 'Đã xóa API Key cá nhân. Hệ thống sẽ dùng Server Key hoặc Template offline.' });
  };

  const modalContent = (
    <div
      onClick={onClose}
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl relative overflow-hidden text-slate-100 max-h-[85vh] overflow-y-auto my-auto"
      >
        {/* Subtle background glow */}
        <div className="absolute -top-16 -right-16 w-36 h-36 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />

        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-1.5">
                <span>Cài Đặt Gemini API Key</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-950 text-indigo-300 border border-indigo-500/30">
                  BYOK
                </span>
              </h3>
              <p className="text-xs text-slate-400">Tùy chọn tự dùng Google Gemini Key của riêng bạn</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            title="Đóng (phím Esc)"
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="py-4 space-y-4">
          {/* Current Status */}
          <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-3.5 flex items-center justify-between text-xs">
            <div>
              <span className="text-slate-400 block text-[11px] mb-0.5">Trạng thái hiện tại:</span>
              {hasCustomKey ? (
                <div className="flex items-center gap-1.5 text-emerald-400 font-medium">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Đang dùng Key cá nhân: <span className="font-mono text-[11px]">{maskedKey}</span></span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 text-indigo-300">
                  <Sparkles className="w-4 h-4 text-indigo-400" />
                  <span>Đang dùng Server Managed Key (hoặc 32 Template CBT Offline)</span>
                </div>
              )}
            </div>
            {hasCustomKey && (
              <button
                type="button"
                onClick={handleClear}
                className="text-rose-400 hover:text-rose-300 flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-lg hover:bg-rose-500/10 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Xóa</span>
              </button>
            )}
          </div>

          {/* Key Input */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-300 flex items-center justify-between">
              <span>Nhập Google Gemini API Key mới:</span>
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noopener noreferrer"
                className="text-indigo-400 hover:text-indigo-300 inline-flex items-center gap-1 text-[11px]"
              >
                <span>Lấy key miễn phí (AI Studio)</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </label>
            <div className="relative">
              <input
                type={showKey ? 'text' : 'password'}
                placeholder={hasCustomKey ? 'Dán key mới để thay thế...' : 'AIzaSy...'}
                value={inputKey}
                onChange={(e) => setInputKey(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 pr-10 font-mono"
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-200"
              >
                {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Test Status Alert */}
          {testResult && (
            <div
              className={`flex items-start gap-2.5 p-3 rounded-xl text-xs ${
                testResult.success
                  ? 'bg-emerald-500/10 border border-emerald-500/25 text-emerald-300'
                  : 'bg-rose-500/10 border border-rose-500/25 text-rose-300'
              }`}
            >
              {testResult.success ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
              )}
              <div className="space-y-1">
                <span>{testResult.message}</span>
                {testResult.model && (
                  <div className="flex items-center gap-1 text-[11px] text-emerald-400/90 font-mono">
                    <Cpu className="w-3 h-3" />
                    <span>Active Model: {testResult.model}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Model Cascade Guarantee Info */}
          <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-700/40 text-[11px] text-slate-400 space-y-1">
            <span className="font-semibold text-slate-300 block">Cơ chế Quota Fallback Tự Động:</span>
            <p className="leading-relaxed">
              Hệ thống tự động xoay vòng ưu tiên: <strong className="text-indigo-300">Gemini 3.8/3.7 Flash</strong> &rarr; <strong className="text-cyan-300">3.5 Flash Lite (500 RPD)</strong> &rarr; <strong className="text-slate-300">2.5 Flash</strong>. Nếu hết quota (429) hoặc model không hỗ trợ (404), hệ thống tự nhảy sang model tiếp theo mà không báo lỗi.
            </p>
          </div>

          {/* Actions: Close, Test & Save */}
          <div className="flex flex-wrap gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="py-2.5 px-4 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-medium border border-slate-700/80 transition-colors"
            >
              Đóng
            </button>

            <button
              type="button"
              disabled={isTesting || (!inputKey && !apiKey)}
              onClick={handleTestConnection}
              className="flex-1 min-w-[130px] flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 disabled:opacity-40 transition-colors"
            >
              {isTesting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Đang kiểm tra...</span>
                </>
              ) : (
                <span>Kiểm Tra Kết Nối</span>
              )}
            </button>

            <button
              type="button"
              disabled={!inputKey.trim()}
              onClick={handleSave}
              className="flex-1 min-w-[140px] flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium shadow-md shadow-indigo-600/20 disabled:opacity-40 transition-all"
            >
              <span>Lưu Vào Trình Duyệt</span>
            </button>
          </div>

          {/* Privacy Guarantee Note */}
          <div className="pt-2 border-t border-slate-800/80 flex items-start gap-2 text-[11px] text-slate-400">
            <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
            <span>
              <strong className="text-slate-300">Bảo mật Zero Server Storage:</strong> Key chỉ được lưu trữ cục bộ trong trình duyệt của bạn (Local Storage). Khi gửi check-in, key chỉ truyền qua HTTPS Header tạm thời và không bao giờ lưu vào Database.
            </span>
          </div>
        </div>
      </div>
    </div>
  );

  if (typeof document !== 'undefined') {
    if (!mounted) return null;
    return createPortal(modalContent, document.body);
  }

  return modalContent;
};
