import React from 'react';
import { LayoutGrid, Layers, HelpCircle, PenTool, Bookmark, CheckCircle2, Download, Upload } from 'lucide-react';
import type { ViewMode } from '../types/kanji';

interface HeaderProps {
  currentMode: ViewMode;
  onSelectMode: (mode: ViewMode) => void;
  masteredCount: number;
  starredCount: number;
  totalKanji: number;
  onExport: () => void;
  onImport: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentMode,
  onSelectMode,
  masteredCount,
  starredCount,
  totalKanji,
  onExport,
  onImport,
}) => {
  const modes: { id: ViewMode; label: string; icon: React.ReactNode }[] = [
    { id: 'grid', label: 'Thư viện', icon: <LayoutGrid className="w-4 h-4" /> },
    { id: 'flashcard', label: 'Thẻ nhớ (SRS)', icon: <Layers className="w-4 h-4" /> },
    { id: 'quiz', label: 'Trắc nghiệm', icon: <HelpCircle className="w-4 h-4" /> },
    { id: 'strokes', label: 'Luyện viết nét', icon: <PenTool className="w-4 h-4" /> },
  ];

  return (
    <header className="sticky top-0 z-40 bg-[#090a0f]/90 backdrop-blur-md border-b border-white/[0.08] transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Brand / Logo */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-b from-zinc-800 to-zinc-900 border border-white/10 flex items-center justify-center font-kanji font-bold text-lg text-white shadow-inner select-none">
            漢
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold tracking-tight text-white text-base">Kanji Helper</span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-800/90 text-zinc-300 border border-white/[0.08]">
                N5→N1
              </span>
            </div>
            <span className="text-[11px] text-zinc-400 hidden sm:block">
              {totalKanji.toLocaleString()} Hán tự • Hán Việt • On/Kun • KanjiVG
            </span>
          </div>
        </div>

        {/* View Mode Navigation Tabs */}
        <nav className="flex items-center p-1 bg-zinc-900/80 rounded-xl border border-white/[0.08]" aria-label="Chế độ học">
          {modes.map((m) => {
            const isActive = currentMode === m.id;
            return (
              <button
                key={m.id}
                onClick={() => onSelectMode(m.id)}
                aria-pressed={isActive}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-all duration-150 ${
                  isActive
                    ? 'bg-zinc-800 text-white shadow-sm border border-white/10'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
                }`}
              >
                {m.icon}
                <span className="hidden md:inline">{m.label}</span>
              </button>
            );
          })}
        </nav>

        {/* User Progress Badges & Tools */}
        <div className="flex items-center gap-2">
          {/* Mastered & Starred Pills */}
          <div className="hidden lg:flex items-center gap-2 text-xs font-mono">
            <span
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 select-none"
              title="Số chữ đã thuộc"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{masteredCount}</span>
            </span>

            <span
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 select-none"
              title="Số chữ đã lưu"
            >
              <Bookmark className="w-3.5 h-3.5" />
              <span>{starredCount}</span>
            </span>
          </div>

          {/* Backup / Export Tools with clear aria-labels */}
          <button
            onClick={onExport}
            aria-label="Sao lưu tiến độ học tập (Export JSON)"
            className="p-2 text-zinc-400 hover:text-white bg-zinc-900/80 hover:bg-zinc-800 rounded-lg border border-white/[0.08] hover:border-white/[0.16] cursor-pointer transition"
            title="Sao lưu tiến độ (Export JSON)"
          >
            <Download className="w-4 h-4" />
          </button>

          <button
            onClick={onImport}
            aria-label="Khôi phục tiến độ học tập (Import JSON)"
            className="p-2 text-zinc-400 hover:text-white bg-zinc-900/80 hover:bg-zinc-800 rounded-lg border border-white/[0.08] hover:border-white/[0.16] cursor-pointer transition"
            title="Khôi phục tiến độ (Import JSON)"
          >
            <Upload className="w-4 h-4" />
          </button>

          <a
            href="https://github.com/kei-kochiya/kanji-helper"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Mở kho lưu trữ mã nguồn trên GitHub"
            className="p-2 text-zinc-400 hover:text-white bg-zinc-900/80 hover:bg-zinc-800 rounded-lg border border-white/[0.08] hover:border-white/[0.16] cursor-pointer transition"
            title="Mở repository trên GitHub"
          >
            <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
            </svg>
          </a>
        </div>
      </div>
    </header>
  );
};
