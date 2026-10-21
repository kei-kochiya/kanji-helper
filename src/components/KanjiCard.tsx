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

const LEVEL_COLORS: Record<JLPTLevel, { badge: string; border: string }> = {
  N5: { badge: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30', border: 'hover:border-emerald-500/40' },
  N4: { badge: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30', border: 'hover:border-cyan-500/40' },
  N3: { badge: 'bg-blue-500/15 text-blue-400 border-blue-500/30', border: 'hover:border-blue-500/40' },
  N2: { badge: 'bg-purple-500/15 text-purple-400 border-purple-500/30', border: 'hover:border-purple-500/40' },
  N1: { badge: 'bg-rose-500/15 text-rose-400 border-rose-500/30', border: 'hover:border-rose-500/40' },
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
      className={`group relative bg-zinc-900/60 hover:bg-zinc-850/80 rounded-xl p-3.5 border border-zinc-800/90 ${levelStyle.border} transition-all duration-150 cursor-pointer flex flex-col justify-between hover:shadow-lg hover:shadow-black/40`}
    >
      {/* Top row: Level Badge & Quick Actions */}
      <div className="flex items-center justify-between mb-2">
        <span
          className={`text-[11px] font-mono font-semibold px-2 py-0.5 rounded-full border ${levelStyle.badge}`}
        >
          {kanji.lvl}
        </span>

        <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition">
          {isMastered && (
            <span className="p-1 text-emerald-400 bg-emerald-500/10 rounded-md" title="Đã thuộc">
              <Check className="w-3.5 h-3.5" />
            </span>
          )}

          <button
            onClick={(e) => {
              e.stopPropagation();
              speakJapanese(kanji.c);
            }}
            className="p-1 text-zinc-500 hover:text-blue-400 hover:bg-zinc-800 rounded-md transition"
            title="Nghe phát âm"
          >
            <Volume2 className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={(e) => onToggleStar(kanji.id, e)}
            className={`p-1 rounded-md transition ${
              isStarred
                ? 'text-amber-400 bg-amber-500/10'
                : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800'
            }`}
            title={isStarred ? 'Bỏ lưu' : 'Lưu Kanji này'}
          >
            {isStarred ? <BookmarkCheck className="w-3.5 h-3.5" /> : <Bookmark className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Main Content: Large Kanji & Sino-Vietnamese reading */}
      <div className="flex items-center gap-3 my-1">
        <div className="w-14 h-14 bg-zinc-950/80 rounded-xl border border-zinc-800/80 flex items-center justify-center shrink-0 group-hover:scale-105 group-hover:border-zinc-700 transition">
          <span className="text-3xl font-kanji text-zinc-100 leading-none select-none">
            {kanji.c}
          </span>
        </div>

        <div className="min-w-0 flex-1">
          <div className="text-sm font-bold text-amber-400 uppercase tracking-wide truncate">
            {kanji.hv.join(' • ') || '—'}
          </div>
          <div className="text-xs text-zinc-300 line-clamp-1 mt-0.5">
            {kanji.m_vi.join(', ') || kanji.m_en.join(', ')}
          </div>
          <div className="text-[10px] text-zinc-500 mt-0.5">
            {kanji.st} nét • Bộ {kanji.rad}
          </div>
        </div>
      </div>

      {/* Bottom row: Onyomi / Kunyomi preview */}
      <div className="mt-2.5 pt-2 border-t border-zinc-800/60 grid grid-cols-2 gap-1 text-[11px] text-zinc-400 font-kanji">
        <div className="truncate" title={`On: ${kanji.on.join('、')}`}>
          <span className="text-[10px] text-zinc-500 font-mono mr-1">On</span>
          <span className="text-zinc-300">{kanji.on[0] || '—'}</span>
        </div>
        <div className="truncate text-right" title={`Kun: ${kanji.kun.join('、')}`}>
          <span className="text-[10px] text-zinc-500 font-mono mr-1">Kun</span>
          <span className="text-zinc-300">{kanji.kun[0] || '—'}</span>
        </div>
      </div>
    </div>
  );
};
