import React, { useEffect } from 'react';
import { X, Volume2, Bookmark, BookmarkCheck, CheckCircle2, Copy, Check, ChevronLeft, ChevronRight } from 'lucide-react';
import type { KanjiItem, JLPTLevel } from '../types/kanji';
import { StrokePlayer } from './StrokePlayer';
import { speakJapanese } from '../utils/speech';

interface KanjiDetailModalProps {
  kanji: KanjiItem | null;
  onClose: () => void;
  onPrev?: () => void;
  onNext?: () => void;
  isStarred: boolean;
  isMastered: boolean;
  onToggleStar: (id: string) => void;
  onToggleMaster: (id: string) => void;
}

const LEVEL_COLORS: Record<JLPTLevel, { badge: string }> = {
  N5: { badge: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' },
  N4: { badge: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30' },
  N3: { badge: 'bg-blue-500/15 text-blue-400 border-blue-500/30' },
  N2: { badge: 'bg-purple-500/15 text-purple-400 border-purple-500/30' },
  N1: { badge: 'bg-rose-500/15 text-rose-400 border-rose-500/30' },
};

export const KanjiDetailModal: React.FC<KanjiDetailModalProps> = ({
  kanji,
  onClose,
  onPrev,
  onNext,
  isStarred,
  isMastered,
  onToggleStar,
  onToggleMaster,
}) => {
  const [copied, setCopied] = React.useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft' && onPrev) onPrev();
      if (e.key === 'ArrowRight' && onNext) onNext();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, onPrev, onNext]);

  if (!kanji) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(kanji.c);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const levelStyle = LEVEL_COLORS[kanji.lvl] || LEVEL_COLORS.N5;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="kanji-detail-title"
    >
      <div
        className="relative w-full max-w-2xl bg-[#0f121b] border border-white/[0.1] rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/[0.08] bg-[#0c0e16]/90">
          <div className="flex items-center gap-3">
            <span
              className={`text-xs font-mono font-semibold px-2.5 py-0.5 rounded-full border ${levelStyle.badge} select-none`}
            >
              {kanji.lvl}
            </span>
            <span className="text-xs text-zinc-400 font-mono">
              Unicode: U+{kanji.code.toUpperCase()}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {onPrev && (
              <button
                onClick={onPrev}
                aria-label="Chữ Hán trước"
                title="Chữ trước (Phím mũi tên Trái)"
                className="p-1.5 text-zinc-400 hover:text-white bg-zinc-800/80 hover:bg-zinc-700/80 rounded-lg border border-white/[0.08] transition cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            )}
            {onNext && (
              <button
                onClick={onNext}
                aria-label="Chữ Hán tiếp theo"
                title="Chữ tiếp theo (Phím mũi tên Phải)"
                className="p-1.5 text-zinc-400 hover:text-white bg-zinc-800/80 hover:bg-zinc-700/80 rounded-lg border border-white/[0.08] transition cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            )}

            <button
              onClick={() => onToggleStar(kanji.id)}
              aria-label={isStarred ? 'Bỏ lưu' : 'Lưu chữ Kanji này'}
              className={`p-1.5 rounded-lg border transition cursor-pointer ${
                isStarred
                  ? 'bg-amber-500/15 border-amber-500/30 text-amber-400'
                  : 'bg-zinc-800/80 border-white/[0.08] text-zinc-400 hover:text-white'
              }`}
              title={isStarred ? 'Bỏ lưu' : 'Lưu Kanji này'}
            >
              {isStarred ? (
                <BookmarkCheck className="w-4 h-4 fill-amber-400/20" />
              ) : (
                <Bookmark className="w-4 h-4" />
              )}
            </button>

            <button
              onClick={() => onToggleMaster(kanji.id)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg border flex items-center gap-1.5 transition cursor-pointer ${
                isMastered
                  ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                  : 'bg-zinc-800/80 border-white/[0.08] text-zinc-400 hover:text-white'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{isMastered ? 'Đã thuộc' : 'Thuộc'}</span>
            </button>

            <button
              onClick={onClose}
              aria-label="Đóng cửa sổ chi tiết (Esc)"
              className="p-1.5 text-zinc-400 hover:text-white bg-zinc-800/80 hover:bg-zinc-700/80 rounded-lg border border-white/[0.08] transition ml-1 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5">
          {/* Main Hero: Character & Stroke Animation */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-center bg-[#0a0c12]/80 p-5 rounded-2xl border border-white/[0.08]">
            {/* Left: Big Kanji & Pronunciation */}
            <div className="flex flex-col items-center justify-center text-center">
              <div className="relative group">
                <span
                  id="kanji-detail-title"
                  className="text-8xl font-kanji text-zinc-100 select-none block leading-tight drop-shadow-sm"
                >
                  {kanji.c}
                </span>
                <button
                  onClick={handleCopy}
                  aria-label="Sao chép chữ Hán vào bộ nhớ tạm"
                  title="Sao chép chữ Hán"
                  className="absolute -top-1 -right-4 p-1.5 bg-zinc-800/90 hover:bg-zinc-700 rounded-lg text-zinc-400 hover:text-white transition cursor-pointer border border-white/[0.08]"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>

              <div className="mt-3 flex items-center gap-2">
                <span className="text-2xl font-bold text-amber-400 tracking-wider">
                  {kanji.hv.join(' • ')}
                </span>
                <button
                  onClick={() => speakJapanese(kanji.c)}
                  aria-label={`Phát âm chữ ${kanji.c}`}
                  className="p-1.5 text-zinc-400 hover:text-blue-400 bg-zinc-800/80 hover:bg-zinc-700 rounded-lg transition cursor-pointer border border-white/[0.06]"
                  title="Nghe phát âm"
                >
                  <Volume2 className="w-4 h-4" />
                </button>
              </div>

              <div className="text-xs text-zinc-400 mt-1 font-mono">
                {kanji.st} nét • Bộ {kanji.rad_vi || kanji.rad}
              </div>
            </div>

            {/* Right: Official Stroke Order Animation (KanjiVG) */}
            <div>
              <StrokePlayer code={kanji.code} character={kanji.c} totalStrokes={kanji.st} />
            </div>
          </div>

          {/* Section: Meaning in Vietnamese & English */}
          <div className="space-y-2">
            <h3 className="text-xs font-mono uppercase tracking-wider text-zinc-400">
              Ý nghĩa tiếng Việt
            </h3>
            <div className="bg-[#0a0c12]/60 p-4 rounded-xl border border-white/[0.08]">
              <ul className="space-y-1.5">
                {kanji.m_vi.map((m, idx) => (
                  <li key={idx} className="text-sm text-zinc-200 flex items-start gap-2">
                    <span className="text-emerald-400 font-bold">•</span>
                    <span>{m}</span>
                  </li>
                ))}
              </ul>
              {kanji.m_en && kanji.m_en.length > 0 && (
                <div className="mt-3 pt-3 border-t border-white/[0.06] text-xs text-zinc-400">
                  <span className="font-mono text-zinc-500 mr-2">English:</span>
                  {kanji.m_en.join(', ')}
                </div>
              )}
            </div>
          </div>

          {/* Section: Readings (On / Kun) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-[#0a0c12]/60 p-4 rounded-xl border border-white/[0.08]">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-mono uppercase tracking-wider text-zinc-400">
                  Âm On (Onyomi - Katakana)
                </span>
                {kanji.on.length > 0 && (
                  <button
                    onClick={() => speakJapanese(kanji.on[0])}
                    aria-label={`Nghe âm On ${kanji.on[0]}`}
                    className="text-zinc-400 hover:text-blue-400 transition cursor-pointer"
                    title="Nghe âm On"
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {kanji.on.length > 0 ? (
                  kanji.on.map((reading, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => speakJapanese(reading)}
                      className="px-2.5 py-1 text-sm font-kanji bg-zinc-900/90 border border-white/[0.08] text-zinc-200 rounded-lg cursor-pointer hover:border-blue-500/50 hover:text-blue-300 transition"
                      title="Nhấn để nghe"
                    >
                      {reading}
                    </button>
                  ))
                ) : (
                  <span className="text-xs text-zinc-500 italic">Không có âm On thông dụng</span>
                )}
              </div>
            </div>

            <div className="bg-[#0a0c12]/60 p-4 rounded-xl border border-white/[0.08]">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-mono uppercase tracking-wider text-zinc-400">
                  Âm Kun (Kunyomi - Hiragana)
                </span>
                {kanji.kun.length > 0 && (
                  <button
                    onClick={() => speakJapanese(kanji.kun[0])}
                    aria-label={`Nghe âm Kun ${kanji.kun[0]}`}
                    className="text-zinc-400 hover:text-blue-400 transition cursor-pointer"
                    title="Nghe âm Kun"
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {kanji.kun.length > 0 ? (
                  kanji.kun.map((reading, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => speakJapanese(reading)}
                      className="px-2.5 py-1 text-sm font-kanji bg-zinc-900/90 border border-white/[0.08] text-zinc-200 rounded-lg cursor-pointer hover:border-blue-500/50 hover:text-blue-300 transition"
                      title="Nhấn để nghe"
                    >
                      {reading}
                    </button>
                  ))
                ) : (
                  <span className="text-xs text-zinc-500 italic">Không có âm Kun thông dụng</span>
                )}
              </div>
            </div>
          </div>

          {/* Section: Example Words (Jukugo) */}
          {kanji.words && kanji.words.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-xs font-mono uppercase tracking-wider text-zinc-400">
                Từ ghép ví dụ (Jukugo)
              </h3>
              <div className="flex flex-wrap gap-2">
                {kanji.words.map((word, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => speakJapanese(word)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-[#0a0c12]/80 hover:bg-zinc-800 border border-white/[0.08] hover:border-white/[0.18] rounded-lg text-xs font-kanji text-zinc-300 transition cursor-pointer active:scale-[0.98]"
                    title="Nhấn để phát âm từ ghép"
                  >
                    <span>{word}</span>
                    <Volume2 className="w-3 h-3 text-zinc-500" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
