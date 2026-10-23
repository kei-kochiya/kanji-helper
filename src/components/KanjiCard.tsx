import React from 'react';
import { Bookmark, BookmarkCheck, Check, Volume2 } from 'lucide-react';
import type { KanjiItem, JLPTLevel } from '../types/kanji';
import { speakJapanese } from '../utils/speech';

interface KanjiCardProps {
  kanji: KanjiItem;
  isStarred: boolean;
  isMastered: boolean;
  onSelect: (kanji: KanjiItem) => void;
  onToggleStar: (id: string, e: React.MouseEvent) => void;
}

const LEVEL_COLORS: Record<JLPTLevel, { badge: string; hoverBorder: string }> = {
  N5: { badge: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30', hoverBorder: 'hover:border-emerald-500/40' },
  N4: { badge: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30', hoverBorder: 'hover:border-cyan-500/40' },
  N3: { badge: 'bg-blue-500/15 text-blue-400 border-blue-500/30', hoverBorder: 'hover:border-blue-500/40' },
  N2: { badge: 'bg-purple-500/15 text-purple-400 border-purple-500/30', hoverBorder: 'hover:border-purple-500/40' },
  N1: { badge: 'bg-rose-500/15 text-rose-400 border-rose-500/30', hoverBorder: 'hover:border-rose-500/40' },
};

export const KanjiCard: React.FC<KanjiCardProps> = ({
  kanji,
  isStarred,
  isMastered,
  onSelect,
  onToggleStar,
}) => {
  const levelStyle = LEVEL_COLORS[kanji.lvl] || LEVEL_COLORS.N5;

  return (
    <div
      onClick={() => onSelect(kanji)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect(kanji);
        }
      }}
      className={`group relative bg-[#12151f] hover:bg-[#181c28] rounded-xl p-3.5 border border-white/[0.08] ${levelStyle.hoverBorder} transition-all duration-150 cursor-pointer flex flex-col justify-between hover:shadow-lg hover:shadow-black/40 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50`}
    >
      {/* Top row: Level Badge & Quick Actions */}
      <div className="flex items-center justify-between mb-2">
        <span
          className={`text-[11px] font-mono font-semibold px-2 py-0.5 rounded-full border ${levelStyle.badge} select-none`}
        >
          {kanji.lvl}
        </span>

        <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition">
          {isMastered && (
            <span
              className="p-1 text-emerald-400 bg-emerald-500/10 rounded-md select-none"
              title="Đã thuộc"
              aria-label="Đã thuộc"
            >
              <Check className="w-3.5 h-3.5 stroke-[2.5]" />
            </span>
          )}

          <button
            onClick={(e) => {
              e.stopPropagation();
              speakJapanese(kanji.c);
            }}
            aria-label={`Phát âm chữ ${kanji.c}`}
            className="p-1 text-zinc-400 hover:text-blue-400 hover:bg-white/[0.06] rounded-md transition cursor-pointer"
            title="Nghe phát âm"
          >
            <Volume2 className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={(e) => onToggleStar(kanji.id, e)}
            aria-label={isStarred ? `Bỏ lưu chữ ${kanji.c}` : `Lưu chữ ${kanji.c}`}
            className={`p-1 rounded-md transition cursor-pointer ${
              isStarred
                ? 'text-amber-400 bg-amber-500/10 hover:bg-amber-500/20'
                : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.06]'
            }`}
            title={isStarred ? 'Bỏ lưu' : 'Lưu Kanji này'}
          >
            {isStarred ? (
              <BookmarkCheck className="w-3.5 h-3.5 fill-amber-400/20" />
            ) : (
              <Bookmark className="w-3.5 h-3.5" />
            )}
          </button>
        </div>
      </div>

      {/* Main Content: Large Kanji & Sino-Vietnamese reading */}
      <div className="flex items-center gap-3 my-1.5">
        <div className="w-14 h-14 bg-[#0a0c12] rounded-xl border border-white/[0.08] flex items-center justify-center shrink-0 group-hover:scale-105 group-hover:border-white/[0.18] transition shadow-inner">
          <span className="text-3xl font-kanji text-zinc-100 leading-none select-none">
            {kanji.c}
          </span>
        </div>

        <div className="min-w-0 flex-1">
          <div className="text-sm font-bold text-amber-400 uppercase tracking-wide truncate">
            {kanji.hv.join(' • ') || '—'}
          </div>
          <div className="text-xs text-zinc-300 line-clamp-1 mt-0.5 font-normal">
            {kanji.m_vi.join(', ') || kanji.m_en.join(', ')}
          </div>
          <div className="text-[11px] font-mono text-zinc-400 mt-0.5">
            {kanji.st} nét • Bộ {kanji.rad}
          </div>
        </div>
      </div>

      {/* Bottom row: Onyomi / Kunyomi preview */}
      <div className="mt-2.5 pt-2 border-t border-white/[0.06] grid grid-cols-2 gap-1 text-[11px] text-zinc-400 font-kanji">
        <div className="truncate" title={`On: ${kanji.on.join('、')}`}>
          <span className="text-[10px] text-zinc-400 font-mono mr-1">On</span>
          <span className="text-zinc-300 font-medium">{kanji.on[0] || '—'}</span>
        </div>
        <div className="truncate text-right" title={`Kun: ${kanji.kun.join('、')}`}>
          <span className="text-[10px] text-zinc-400 font-mono mr-1">Kun</span>
          <span className="text-zinc-300 font-medium">{kanji.kun[0] || '—'}</span>
        </div>
      </div>
    </div>
  );
};
