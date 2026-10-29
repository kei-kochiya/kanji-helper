import React from 'react';
import { Bookmark, CheckCircle2, Volume2 } from 'lucide-react';
import type { KanjiItem } from '../types/kanji';
import { speakJapanese } from '../utils/speech';
import { LevelLabel } from './LevelLabel';

interface KanjiCardProps {
  kanji: KanjiItem;
  isStarred: boolean;
  isMastered: boolean;
  onSelect: (kanji: KanjiItem) => void;
  onToggleStar: (id: string, e: React.MouseEvent) => void;
}

const iconButton =
  'grid place-items-center w-7 h-7 rounded-md transition-colors cursor-pointer hover:bg-ink-800';

export const KanjiCard: React.FC<KanjiCardProps> = ({ kanji, isStarred, isMastered, onSelect, onToggleStar }) => {
  const hv = kanji.hv.join(' · ') || '—';

  return (
    <div className="group relative rounded-xl bg-ink-900 border border-line hover:border-line-strong hover:bg-ink-850 transition-colors">
      {/* The whole card opens the detail view; quick actions sit above it as siblings */}
      <button
        type="button"
        onClick={() => onSelect(kanji)}
        aria-label={`Xem chi tiết chữ ${kanji.c}, ${hv}`}
        className="w-full h-full text-left p-3.5 rounded-xl cursor-pointer flex flex-col gap-3"
      >
        <span className="flex items-center gap-1.5 h-7 pr-16">
          <LevelLabel level={kanji.lvl} />
          {isMastered && (
            <CheckCircle2 className="w-3.5 h-3.5 text-ok" aria-label="Đã thuộc" role="img" />
          )}
        </span>

        <span className="flex items-center gap-3 min-w-0">
          <span lang="ja" className="font-kanji text-[2.75rem] leading-none text-paper select-none shrink-0 w-12 text-center">
            {kanji.c}
          </span>
          <span className="min-w-0 flex-1 flex flex-col gap-0.5">
            <span className="text-sm font-semibold text-kin tracking-wide truncate">{hv}</span>
            <span className="text-xs text-paper-2 truncate">{kanji.m_vi.join(', ') || kanji.m_en.join(', ')}</span>
            <span className="text-[11px] text-paper-3 tabular-nums">
              {kanji.st} nét · Bộ <span lang="ja">{kanji.rad}</span>
            </span>
          </span>
        </span>

        <span className="grid grid-cols-2 gap-2 pt-2.5 border-t border-line text-xs">
          <span className="truncate" title={`On: ${kanji.on.join('、')}`}>
            <span className="text-[11px] text-paper-3 mr-1.5">On</span>
            <span lang="ja" className="font-jp text-paper-2">{kanji.on[0] || '—'}</span>
          </span>
          <span className="truncate text-right" title={`Kun: ${kanji.kun.join('、')}`}>
            <span className="text-[11px] text-paper-3 mr-1.5">Kun</span>
            <span lang="ja" className="font-jp text-paper-2">{kanji.kun[0] || '—'}</span>
          </span>
        </span>
      </button>

      <div className="absolute top-3 right-3 flex items-center gap-0.5">
        <button
          type="button"
          onClick={() => speakJapanese(kanji.c)}
          aria-label={`Phát âm chữ ${kanji.c}`}
          title="Nghe phát âm"
          className={`${iconButton} text-paper-3 hover:text-paper`}
        >
          <Volume2 className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={(e) => onToggleStar(kanji.id, e)}
          aria-pressed={isStarred}
          aria-label={isStarred ? `Bỏ lưu chữ ${kanji.c}` : `Lưu chữ ${kanji.c}`}
          title={isStarred ? 'Bỏ lưu' : 'Lưu chữ này'}
          className={`${iconButton} ${isStarred ? 'text-kin' : 'text-paper-3 hover:text-paper'}`}
        >
          <Bookmark className={`w-3.5 h-3.5 ${isStarred ? 'fill-current' : ''}`} />
        </button>
      </div>
    </div>
  );
};
