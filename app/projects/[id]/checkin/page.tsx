import React from 'react';
import Link from 'next/link';
import { getProjectById } from '@/lib/supabase/queries';
import { ArrowLeft, Sparkles } from 'lucide-react';
import { StandaloneCheckinClient } from './StandaloneCheckinClient';

export default async function StandaloneCheckinPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const project = await getProjectById(id);

  if (!project) {
    return (
      <div className="max-w-md mx-auto py-16 text-center">
        <p className="text-sm text-slate-400 mb-4">Không tìm thấy dự án.</p>
        <Link
          href="/dashboard"
          className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold"
        >
          Quay lại Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto py-6 space-y-6">
      <Link
        href={`/projects/${project.id}`}
        className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Quay lại trang chi tiết: {project.name}</span>
      </Link>

      <div className="bg-slate-900/50 border border-slate-800/80 rounded-2xl p-4 text-xs text-slate-400 flex items-center gap-2">
        <Sparkles className="w-4 h-4 text-indigo-400 flex-shrink-0" />
        <span>
          Ghi nhận trung thực cảm xúc hiện tại. Dữ liệu này giúp hệ thống bảo vệ bạn khỏi kiệt sức và xói mòn mục tiêu.
        </span>
      </div>

      <StandaloneCheckinClient projectId={project.id} projectName={project.name} />
    </div>
  );
}
