import React from 'react';
import { LayoutGrid, Layers, HelpCircle, PenLine, Bookmark, CheckCircle2, Download, Upload } from 'lucide-react';
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

const MODES: { id: ViewMode; label: string; Icon: typeof LayoutGrid }[] = [
  { id: 'grid', label: 'Thư viện', Icon: LayoutGrid },
  { id: 'flashcard', label: 'Thẻ nhớ', Icon: Layers },
  { id: 'quiz', label: 'Trắc nghiệm', Icon: HelpCircle },
  { id: 'strokes', label: 'Luyện viết', Icon: PenLine },
];

const toolButton =
  'grid place-items-center w-9 h-9 rounded-lg text-paper-2 hover:text-paper hover:bg-ink-850 transition-colors cursor-pointer';

export const Header: React.FC<HeaderProps> = ({
  currentMode,
  onSelectMode,
  masteredCount,
  starredCount,
  totalKanji,
  onExport,
  onImport,
}) => {
  const nav = (className: string) => (
    <nav className={className} aria-label="Chế độ học">
      {MODES.map(({ id, label, Icon }) => {
        const isActive = currentMode === id;
        return (
          <button
            key={id}
            type="button"
            onClick={() => onSelectMode(id)}
            aria-current={isActive ? 'page' : undefined}
            className={`flex-1 md:flex-none min-w-0 inline-flex items-center justify-center gap-1.5 h-9 px-1.5 sm:px-3 rounded-lg text-[13px] sm:text-sm font-medium whitespace-nowrap transition-colors cursor-pointer ${
              isActive ? 'bg-ink-800 text-paper' : 'text-paper-2 hover:text-paper hover:bg-ink-850'
            }`}
          >
            <Icon className={`w-4 h-4 hidden sm:block ${isActive ? 'text-shu' : ''}`} aria-hidden="true" />
            <span>{label}</span>
          </button>
        );
      })}
    </nav>
  );

  return (
    <header className="sticky top-0 z-40 bg-ink-950 border-b border-line">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="h-14 flex items-center justify-between gap-4">
          {/* Brand: a vermilion seal */}
          <div className="flex items-center gap-2.5 min-w-0">
            <span
              lang="ja"
              aria-hidden="true"
              className="grid place-items-center w-8 h-8 rounded-md bg-shu-600 text-white font-kanji text-lg leading-none select-none shrink-0"
            >
              漢
            </span>
            <div className="min-w-0">
              <div className="font-semibold text-paper leading-tight">Kanji Helper</div>
              <div className="text-xs text-paper-3 leading-tight hidden sm:block truncate">
                {totalKanji.toLocaleString('vi-VN')} Hán tự · N5 → N1
              </div>
            </div>
          </div>

          {nav('hidden md:flex items-center gap-0.5')}

          <div className="flex items-center gap-1 shrink-0">
            <div className="hidden lg:flex items-center gap-3 mr-2 text-xs text-paper-2 tabular-nums">
              <span className="inline-flex items-center gap-1" title="Số chữ đã thuộc">
                <CheckCircle2 className="w-3.5 h-3.5 text-ok" aria-hidden="true" />
                <span className="sr-only">Đã thuộc:</span>
                {masteredCount.toLocaleString('vi-VN')}
              </span>
              <span className="inline-flex items-center gap-1" title="Số chữ đã lưu">
                <Bookmark className="w-3.5 h-3.5 text-kin" aria-hidden="true" />
                <span className="sr-only">Đã lưu:</span>
                {starredCount.toLocaleString('vi-VN')}
              </span>
            </div>

            <button type="button" onClick={onExport} aria-label="Sao lưu tiến độ (tải tệp JSON)" title="Sao lưu tiến độ" className={toolButton}>
              <Download className="w-4 h-4" />
            </button>
            <button type="button" onClick={onImport} aria-label="Khôi phục tiến độ từ tệp JSON" title="Khôi phục tiến độ" className={toolButton}>
              <Upload className="w-4 h-4" />
            </button>
            <a
              href="https://github.com/kei-kochiya/kanji-helper"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Mã nguồn trên GitHub"
              title="Mã nguồn trên GitHub"
              className={toolButton}
            >
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
              </svg>
            </a>
          </div>
        </div>

        {/* Mobile: modes get their own row with full labels */}
        {nav('md:hidden flex items-center gap-1 pb-2')}
      </div>
    </header>
  );
};
