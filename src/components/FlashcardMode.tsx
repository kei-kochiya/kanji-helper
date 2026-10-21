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
      // Don't trigger if user is in an input
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
      <div className="w-full flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-zinc-400 bg-zinc-900 px-3 py-1.5 rounded-lg border border-zinc-800">
            {currentIndex + 1} / {deck.length}
          </span>
          <button
            onClick={handleShuffle}
            className="p-1.5 text-zinc-400 hover:text-white bg-zinc-900 hover:bg-zinc-800 rounded-lg border border-zinc-800 transition flex items-center gap-1 text-xs"
            title="Trộn ngẫu nhiên thẻ"
          >
            <Shuffle className="w-3.5 h-3.5" />
            <span>Trộn thẻ</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onToggleStar(currentKanji.id)}
            className={`p-2 rounded-lg border transition ${
              starred
                ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'
            }`}
            title={starred ? 'Bỏ lưu' : 'Lưu Kanji này'}
          >
            {starred ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full h-1 bg-zinc-800 rounded-full mb-6 overflow-hidden">
        <div
          className="h-full bg-blue-500 transition-all duration-300"
          style={{ width: `${((currentIndex + 1) / deck.length) * 100}%` }}
        />
      </div>

      {/* Flashcard with 3D Flip */}
      <div
        className="w-full h-[420px] perspective-1000 cursor-pointer select-none"
        onClick={() => setIsFlipped(!isFlipped)}
      >
        <div
          className={`relative w-full h-full duration-500 transform-style-preserve-3d transition-transform ${
            isFlipped ? 'rotate-y-180' : ''
          }`}
        >
          {/* FRONT OF CARD */}
          <div className="absolute inset-0 backface-hidden bg-zinc-900/90 border border-zinc-800 rounded-2xl p-8 flex flex-col justify-between items-center shadow-2xl hover:border-zinc-700/80 transition">
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

            <div className="text-center">
              <span className="text-9xl font-kanji text-zinc-100 block drop-shadow-md">
                {currentKanji.c}
              </span>
              {mastered && (
                <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded-full mt-3">
                  <Check className="w-3 h-3" /> Đã thuộc
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 text-xs text-zinc-500 font-mono">
              <RotateCw className="w-3.5 h-3.5" />
              <span>Chạm hoặc bấm [Phím Cách] để lật</span>
            </div>
          </div>

          {/* BACK OF CARD */}
          <div className="absolute inset-0 backface-hidden rotate-y-180 bg-zinc-900/95 border border-zinc-750 rounded-2xl p-6 flex flex-col justify-between shadow-2xl overflow-y-auto">
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
                    className="p-1.5 text-zinc-400 hover:text-blue-400 bg-zinc-800/80 rounded-lg transition"
                    title="Nghe phát âm"
                  >
                    <Volume2 className="w-4 h-4" />
                  </button>
                  <span className="text-3xl font-kanji text-zinc-200">{currentKanji.c}</span>
                </div>
              </div>

              {/* Sino-Vietnamese reading */}
              <div className="mb-3">
                <span className="text-[11px] text-zinc-500 font-mono uppercase tracking-wider block">
                  Âm Hán Việt
                </span>
                <span className="text-2xl font-bold text-amber-400 tracking-wide">
                  {currentKanji.hv.join(' • ')}
                </span>
              </div>

              {/* Vietnamese Meaning */}
              <div className="mb-4">
                <span className="text-[11px] text-zinc-500 font-mono uppercase tracking-wider block mb-1">
                  Ý nghĩa
                </span>
                <p className="text-sm font-medium text-zinc-200">
                  {currentKanji.m_vi.join(', ')}
                </p>
              </div>

              {/* On / Kun readings */}
              <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                <div className="bg-zinc-950/70 p-2 rounded-lg border border-zinc-800">
                  <span className="text-[10px] text-zinc-500 font-mono block mb-0.5">Âm On:</span>
                  <span className="text-zinc-300 font-kanji">
                    {currentKanji.on.join('、') || '—'}
                  </span>
                </div>
                <div className="bg-zinc-950/70 p-2 rounded-lg border border-zinc-800">
                  <span className="text-[10px] text-zinc-500 font-mono block mb-0.5">Âm Kun:</span>
                  <span className="text-zinc-300 font-kanji">
                    {currentKanji.kun.join('、') || '—'}
                  </span>
                </div>
              </div>

              {/* Compound Words */}
              {currentKanji.words && currentKanji.words.length > 0 && (
                <div className="pt-2 border-t border-zinc-800">
                  <span className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider block mb-1.5">
                    Từ vựng ví dụ:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {currentKanji.words.slice(0, 5).map((w, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 text-xs font-kanji bg-zinc-950 text-zinc-300 rounded border border-zinc-800"
                      >
                        {w}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="text-center text-[10px] text-zinc-500 font-mono pt-2">
              Bấm [Phím Cách] để lật lại
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="w-full flex items-center justify-between gap-3 mt-6">
        <button
          onClick={handlePrev}
          className="p-3 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-xl border border-zinc-800 transition"
          title="Thẻ trước [Phím ←]"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        <div className="flex-1 grid grid-cols-2 gap-3">
          <button
            onClick={handleMarkNeedPractice}
            className="py-3 px-4 bg-zinc-900 hover:bg-rose-950/40 text-rose-400 border border-zinc-800 hover:border-rose-500/30 rounded-xl font-medium text-sm flex items-center justify-center gap-2 transition active:scale-98 shadow-sm"
          >
            <X className="w-4 h-4" />
            <span>Chưa thuộc</span>
          </button>

          <button
            onClick={handleMarkMastered}
            className="py-3 px-4 bg-emerald-600/90 hover:bg-emerald-500 text-white border border-emerald-500/40 rounded-xl font-medium text-sm flex items-center justify-center gap-2 transition active:scale-98 shadow-md shadow-emerald-950/50"
          >
            <Check className="w-4 h-4" />
            <span>Đã thuộc</span>
          </button>
        </div>

        <button
          onClick={handleNext}
          className="p-3 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-xl border border-zinc-800 transition"
          title="Thẻ tiếp [Phím →]"
        >
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>

      <div className="text-[11px] text-zinc-500 mt-4 flex items-center gap-4">
        <span>Phím tắt:</span>
        <span className="font-mono bg-zinc-900 px-1.5 py-0.5 rounded border border-zinc-800">Space: Lật</span>
        <span className="font-mono bg-zinc-900 px-1.5 py-0.5 rounded border border-zinc-800">← / →: Chuyển thẻ</span>
        <span className="font-mono bg-zinc-900 px-1.5 py-0.5 rounded border border-zinc-800">S: Đọc phát âm</span>
      </div>
    </div>
  );
};
