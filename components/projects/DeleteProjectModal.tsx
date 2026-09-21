'use client';

/**
 * Component: DeleteProjectModal.tsx
 * Description: High-assurance destructive confirmation modal for deleting a project.
 * Features:
 * - Clear warning explaining cascade deletion (checkins, regression flags, interventions).
 * - React Portal mounting to document.body avoiding CSS transform/blur containing block traps.
 * - Escape key & backdrop click support.
 * - Loading indicator during deletion.
 */

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle, Trash2, X, Loader2 } from 'lucide-react';

interface DeleteProjectModalProps {
  isOpen: boolean;
  projectName: string;
  projectId: string;
  checkinsCount?: number;
  onClose: () => void;
  onConfirmDelete: (projectId: string) => Promise<void> | void;
}

export const DeleteProjectModal: React.FC<DeleteProjectModalProps> = ({
  isOpen,
  projectName,
  projectId,
  checkinsCount,
  onClose,
  onConfirmDelete,
}) => {
  const [mounted, setMounted] = useState<boolean>(false);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Keyboard Escape listener
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isDeleting) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isDeleting, onClose]);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    setIsDeleting(true);
    try {
      await onConfirmDelete(projectId);
    } finally {
      setIsDeleting(false);
    }
  };

  const modalContent = (
    <div
      onClick={isDeleting ? undefined : onClose}
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl relative overflow-hidden text-slate-100 my-auto animate-in zoom-in-95 duration-150"
      >
        {/* Ambient warning glow */}
        <div className="absolute -top-12 -right-12 w-32 h-32 bg-rose-500/10 rounded-full blur-2xl pointer-events-none" />

        {/* Header */}
        <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Xác Nhận Xóa Dự Án</h3>
              <p className="text-xs text-slate-400">Hành động này không thể hoàn tác</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            title="Đóng (Esc)"
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors disabled:opacity-50"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="py-4 space-y-3">
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            Bạn có chắc chắn muốn xóa dự án{' '}
            <strong className="text-white font-semibold underline decoration-rose-500/50 underline-offset-2">
              &quot;{projectName}&quot;
            </strong>{' '}
            không?
          </p>

          <div className="bg-slate-950/60 border border-rose-500/20 rounded-2xl p-3.5 space-y-1.5 text-xs text-rose-300/90">
            <div className="font-semibold text-rose-400 flex items-center gap-1.5">
              <Trash2 className="w-3.5 h-3.5" />
              <span>Dữ liệu sẽ bị xóa hoàn toàn:</span>
            </div>
            <ul className="list-disc list-inside space-y-1 pl-1 text-[11px] text-slate-400">
              {checkinsCount !== undefined && (
                <li>
                  Toàn bộ <strong className="text-slate-200">{checkinsCount}</strong> lần ghi nhận check-in
                </li>
              )}
              <li>Tất cả biểu đồ đường cong suy giảm & phân tích hồi quy</li>
              <li>Lịch sử gợi ý can thiệp và phản hồi của dự án này</li>
            </ul>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-800">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors disabled:opacity-50"
          >
            Hủy bỏ
          </button>

          <button
            type="button"
            onClick={handleConfirm}
            disabled={isDeleting}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-rose-600 hover:bg-rose-500 active:scale-95 text-white shadow-lg shadow-rose-600/20 transition-all disabled:opacity-50"
          >
            {isDeleting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Đang xóa...</span>
              </>
            ) : (
              <>
                <Trash2 className="w-3.5 h-3.5" />
                <span>Xác Nhận Xóa</span>
              </>
            )}
          </button>
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
