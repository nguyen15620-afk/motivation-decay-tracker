import type { Metadata } from 'next';
import './globals.css';
import Link from 'next/link';
import { Flame, LayoutDashboard, FolderKanban, Activity, RefreshCw } from 'lucide-react';
import { ApiKeyBadge } from '@/components/settings/ApiKeyBadge';


export const metadata: Metadata = {
  title: 'Motivation Decay Tracker - Phát Hiện Sớm Suy Giảm Động Lực',
  description:
    'Hệ thống theo dõi xu hướng động lực theo thời gian, phát hiện sự xói mòn tiệm tiến và can thiệp kịp thời trước khi bỏ cuộc.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi" className="dark">
      <body className="bg-slate-950 text-slate-100 antialiased min-h-screen flex flex-col selection:bg-indigo-500/30 selection:text-indigo-300">
        {/* Global Navigation Header */}
        <header className="sticky top-0 z-50 border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            {/* Brand Logo */}
            <Link href="/dashboard" className="flex items-center gap-3 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center shadow-md shadow-indigo-500/20 group-hover:scale-105 transition-transform">
                <Flame className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-base tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
                    Motivation Decay
                  </span>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                    Tracker
                  </span>
                </div>
                <div className="text-[11px] text-slate-400 font-normal">
                  Chủ động phát hiện & can thiệp sớm
                </div>
              </div>
            </Link>

            {/* Nav links */}
            <nav className="flex items-center gap-1 sm:gap-2">
              <Link
                href="/dashboard"
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg text-slate-300 hover:text-white hover:bg-slate-800/80 transition-colors"
              >
                <LayoutDashboard className="w-4 h-4 text-indigo-400" />
                <span className="hidden sm:inline">Tổng Quan</span>
              </Link>

              <Link
                href="/dashboard#projects-section"
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg text-slate-300 hover:text-white hover:bg-slate-800/80 transition-colors"
              >
                <FolderKanban className="w-4 h-4 text-cyan-400" />
                <span className="hidden sm:inline">Dự Án</span>
              </Link>

              {/* BYOK Gemini API Key Manager */}
              <ApiKeyBadge />

              {/* Cron Run Trigger (convenient for testing) */}
              <Link
                href="/api/cron/analyze-trends"
                target="_blank"
                title="Kích hoạt thủ công Cron quét trend"
                className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg border border-slate-800 bg-slate-900/60 text-slate-400 hover:text-indigo-300 hover:border-indigo-500/40 transition-all"
              >
                <Activity className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                <span className="hidden md:inline">Test Cron Scanner</span>
              </Link>
            </nav>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </main>

        {/* Footer */}
        <footer className="border-t border-slate-900 bg-slate-950/60 py-6 text-center text-xs text-slate-500">
          <div className="max-w-7xl mx-auto px-4">
            Motivation Decay Tracker &bull; Đồng bộ công nghệ Next.js + Supabase Postgres &bull; Phân tích Hồi quy Tuyến tính & Can thiệp Thông minh
          </div>
        </footer>
      </body>
    </html>
  );
}
