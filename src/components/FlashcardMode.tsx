import React, { useState, useEffect, useCallback } from 'react';
import { RotateCw, Volume2, Bookmark, BookmarkCheck, Check, X, Shuffle, ArrowLeft, ArrowRight } from 'lucide-react';
import type { KanjiItem, JLPTLevel } from '../types/kanji';
import { speakJapanese } from '../utils/speech';

interface FlashcardModeProps {
  kanjiList: KanjiItem[];
  isStarred: (id: string) => boolean;
  isMastered: (id: string) => boolean;
  onToggleStar: (id: string) => void;
  onToggleMaster: (id: string) => void;
}

const LEVEL_COLORS: Record<JLPTLevel, { badge: string; border: string }> = {
  N5: { badge: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30', border: 'border-emerald-500/30' },
  N4: { badge: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30', border: 'border-cyan-500/30' },
  N3: { badge: 'bg-blue-500/15 text-blue-400 border-blue-500/30', border: 'border-blue-500/30' },
  N2: { badge: 'bg-purple-500/15 text-purple-400 border-purple-500/30', border: 'border-purple-500/30' },
  N1: { badge: 'bg-rose-500/15 text-rose-400 border-rose-500/30', border: 'border-rose-500/30' },
};

export const FlashcardMode: React.FC<FlashcardModeProps> = ({
  kanjiList,
  isStarred,
  isMastered,
  onToggleStar,
  onToggleMaster,
}) => {
  const [deck, setDeck] = useState<KanjiItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  useEffect(() => {
    setDeck(kanjiList);
    setCurrentIndex(0);
    setIsFlipped(false);
  }, [kanjiList]);

  const currentKanji = deck[currentIndex];

  const handleNext = useCallback(() => {
    setIsFlipped(false);
    setCurrentIndex((prev) => (prev < deck.length - 1 ? prev + 1 : 0));
  }, [deck.length]);

  const handlePrev = useCallback(() => {
    setIsFlipped(false);
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : deck.length - 1));
  }, [deck.length]);

  const handleShuffle = () => {
    const shuffled = [...deck].sort(() => Math.random() - 0.5);
    setDeck(shuffled);
    setCurrentIndex(0);
    setIsFlipped(false);
  };

  const handleMarkMastered = () => {
    if (currentKanji) {
      if (!isMastered(currentKanji.id)) {
        onToggleMaster(currentKanji.id);
      }
      handleNext();
    }
  };

  const handleMarkNeedPractice = () => {
    if (currentKanji && isMastered(currentKanji.id)) {
      onToggleMaster(currentKanji.id);
    }
    handleNext();
  };

  // Keyboard Navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).tagName === 'INPUT') return;

      if (e.code === 'Space') {
        e.preventDefault();
        setIsFlipped((prev) => !prev);
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        handleNext();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        handlePrev();
      } else if (e.key === 'KeyS' && currentKanji) {
        speakJapanese(currentKanji.c);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentKanji, handleNext, handlePrev]);

  if (deck.length === 0 || !currentKanji) {
    return (
      <div className="text-center py-24 text-zinc-500">
        Không có Kanji nào trong bộ lọc hiện tại để học thẻ.
      </div>
    );
  }

  const levelStyle = LEVEL_COLORS[currentKanji.lvl] || LEVEL_COLORS.N5;
  const starred = isStarred(currentKanji.id);
  const mastered = isMastered(currentKanji.id);

  return (
    <div className="max-w-xl mx-auto px-4 py-8 flex flex-col items-center">
      {/* Top Controls & Progress */}
      <div className="w-full flex items-center justify-between mb-3.5">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-zinc-300 bg-zinc-900/90 px-3 py-1.5 rounded-lg border border-white/[0.08] shadow-inner">
            {currentIndex + 1} / {deck.length}
          </span>
          <button
            onClick={handleShuffle}
            aria-label="Xáo trộn ngẫu nhiên danh sách thẻ"
            className="p-1.5 text-zinc-400 hover:text-white bg-zinc-900/90 hover:bg-zinc-800 rounded-lg border border-white/[0.08] hover:border-white/[0.16] cursor-pointer transition flex items-center gap-1.5 text-xs"
            title="Trộn ngẫu nhiên thẻ"
          >
            <Shuffle className="w-3.5 h-3.5" />
            <span>Trộn thẻ</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onToggleStar(currentKanji.id)}
            aria-label={starred ? 'Bỏ lưu' : 'Lưu chữ Kanji này'}
            className={`p-2 rounded-lg border cursor-pointer transition ${
              starred
                ? 'bg-amber-500/15 border-amber-500/30 text-amber-400'
                : 'bg-zinc-900/90 border-white/[0.08] text-zinc-400 hover:text-white hover:border-white/[0.16]'
            }`}
            title={starred ? 'Bỏ lưu' : 'Lưu Kanji này'}
          >
            {starred ? (
              <BookmarkCheck className="w-4 h-4 fill-amber-400/20" />
            ) : (
              <Bookmark className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full h-1 bg-zinc-850 rounded-full mb-6 overflow-hidden">
        <div
          className="h-full bg-blue-500 transition-all duration-300 ease-out"
          style={{ width: `${((currentIndex + 1) / deck.length) * 100}%` }}
        />
      </div>

      {/* Flashcard with 3D Flip */}
      <div
        className="w-full h-[420px] perspective-1000 cursor-pointer select-none"
        onClick={() => setIsFlipped(!isFlipped)}
        role="button"
        tabIndex={0}
        aria-label={`Thẻ học chữ ${currentKanji.c}. Bấm phím cách để lật.`}
        onKeyDown={(e) => {
          if (e.key === ' ' || e.key === 'Enter') {
            e.preventDefault();
            setIsFlipped(!isFlipped);
          }
        }}
      >
        <div
          className={`relative w-full h-full duration-500 transform-style-preserve-3d transition-transform ${
            isFlipped ? 'rotate-y-180' : ''
          }`}
        >
          {/* FRONT OF CARD */}
          <div className="absolute inset-0 backface-hidden bg-[#121520] border border-white/[0.09] hover:border-white/[0.18] rounded-2xl p-7 flex flex-col justify-between items-center shadow-2xl transition">
            <div className="w-full flex items-center justify-between">
              <span
                className={`text-xs font-mono font-semibold px-2.5 py-0.5 rounded-full border ${levelStyle.badge}`}
              >
                {currentKanji.lvl}
              </span>
              <span className="text-xs text-zinc-400 font-mono">
                {currentKanji.st} nét • Bộ {currentKanji.rad_vi || currentKanji.rad}
              </span>
            </div>

            <div className="text-center my-auto">
              <span className="text-9xl font-kanji text-zinc-100 block drop-shadow-md select-none leading-none">
                {currentKanji.c}
              </span>
              {mastered && (
                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-0.5 rounded-full mt-4 select-none">
                  <Check className="w-3 h-3 stroke-[2.5]" /> Đã thuộc
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 text-xs text-zinc-400 font-mono">
              <RotateCw className="w-3.5 h-3.5" />
              <span>Chạm hoặc bấm [Phím Cách] để lật</span>
            </div>
          </div>

          {/* BACK OF CARD */}
          <div className="absolute inset-0 backface-hidden rotate-y-180 bg-[#121520] border border-white/[0.12] rounded-2xl p-6 flex flex-col justify-between shadow-2xl overflow-y-auto">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span
                  className={`text-xs font-mono font-semibold px-2.5 py-0.5 rounded-full border ${levelStyle.badge}`}
                >
                  {currentKanji.lvl}
                </span>

                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      speakJapanese(currentKanji.c);
                    }}
                    aria-label={`Phát âm chữ ${currentKanji.c}`}
                    className="p-1.5 text-zinc-400 hover:text-blue-400 bg-zinc-800/80 hover:bg-zinc-700/80 rounded-lg border border-white/[0.08] transition cursor-pointer"
                    title="Nghe phát âm"
                  >
                    <Volume2 className="w-4 h-4" />
                  </button>
                  <span className="text-3xl font-kanji text-zinc-100 select-none">{currentKanji.c}</span>
                </div>
              </div>

              {/* Sino-Vietnamese reading */}
              <div className="mb-3">
                <span className="text-[11px] text-zinc-400 font-mono uppercase tracking-wider block">
                  Âm Hán Việt
                </span>
                <span className="text-2xl font-bold text-amber-400 tracking-wide">
                  {currentKanji.hv.join(' • ')}
                </span>
              </div>

              {/* Vietnamese Meaning */}
              <div className="mb-4">
                <span className="text-[11px] text-zinc-400 font-mono uppercase tracking-wider block mb-1">
                  Ý nghĩa
                </span>
                <p className="text-sm font-medium text-zinc-200">
                  {currentKanji.m_vi.join(', ')}
                </p>
              </div>

              {/* On / Kun readings */}
              <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                <div className="bg-[#0a0c12]/80 p-2.5 rounded-xl border border-white/[0.08]">
                  <span className="text-[10px] text-zinc-400 font-mono block mb-0.5">Âm On:</span>
                  <span className="text-zinc-200 font-kanji font-medium">
                    {currentKanji.on.join('、') || '—'}
                  </span>
                </div>
                <div className="bg-[#0a0c12]/80 p-2.5 rounded-xl border border-white/[0.08]">
                  <span className="text-[10px] text-zinc-400 font-mono block mb-0.5">Âm Kun:</span>
                  <span className="text-zinc-200 font-kanji font-medium">
                    {currentKanji.kun.join('、') || '—'}
                  </span>
                </div>
              </div>

              {/* Compound Words */}
              {currentKanji.words && currentKanji.words.length > 0 && (
                <div className="pt-2 border-t border-white/[0.06]">
                  <span className="text-[10px] text-zinc-400 font-mono uppercase tracking-wider block mb-1.5">
                    Từ vựng ví dụ:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {currentKanji.words.slice(0, 5).map((w, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 text-xs font-kanji bg-[#0a0c12] text-zinc-300 rounded-md border border-white/[0.08]"
                      >
                        {w}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="text-center text-[10px] text-zinc-400 font-mono pt-2">
              Bấm [Phím Cách] để lật lại
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="w-full flex items-center justify-between gap-3 mt-6">
        <button
          onClick={handlePrev}
          aria-label="Thẻ trước"
          className="p-3 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-xl border border-white/[0.08] hover:border-white/[0.16] cursor-pointer transition active:scale-[0.96]"
          title="Thẻ trước [Phím ←]"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        <div className="flex-1 grid grid-cols-2 gap-3">
          <button
            onClick={handleMarkNeedPractice}
            className="py-3 px-4 bg-zinc-900/90 hover:bg-rose-950/30 text-rose-400 border border-white/[0.08] hover:border-rose-500/40 rounded-xl font-medium text-sm flex items-center justify-center gap-2 cursor-pointer transition active:scale-[0.98] shadow-sm"
          >
            <X className="w-4 h-4" />
            <span>Chưa thuộc</span>
          </button>

          <button
            onClick={handleMarkMastered}
            className="py-3 px-4 bg-emerald-600/90 hover:bg-emerald-500 text-white border border-emerald-500/40 rounded-xl font-medium text-sm flex items-center justify-center gap-2 cursor-pointer transition active:scale-[0.98] shadow-md shadow-emerald-950/50"
          >
            <Check className="w-4 h-4 stroke-[2.5]" />
            <span>Đã thuộc</span>
          </button>
        </div>

        <button
          onClick={handleNext}
          aria-label="Thẻ tiếp theo"
          className="p-3 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-xl border border-white/[0.08] hover:border-white/[0.16] cursor-pointer transition active:scale-[0.96]"
          title="Thẻ tiếp [Phím →]"
        >
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>

      <div className="text-[11px] text-zinc-400 mt-4 flex items-center gap-4">
        <span>Phím tắt:</span>
        <kbd className="font-mono bg-zinc-900/90 px-1.5 py-0.5 rounded border border-white/[0.08]">Space: Lật</kbd>
        <kbd className="font-mono bg-zinc-900/90 px-1.5 py-0.5 rounded border border-white/[0.08]">← / →: Đổi thẻ</kbd>
        <kbd className="font-mono bg-zinc-900/90 px-1.5 py-0.5 rounded border border-white/[0.08]">S: Phát âm</kbd>
      </div>
    </div>
  );
};
