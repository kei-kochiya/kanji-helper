import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { RotateCw, Volume2, Bookmark, Check, X, Shuffle, ArrowLeft, ArrowRight, CheckCircle2 } from 'lucide-react';
import type { KanjiItem } from '../types/kanji';
import { speakJapanese } from '../utils/speech';
import { LEVEL_STYLES, levelLabelClass } from '../utils/levels';
import { shuffled } from '../utils/random';

interface FlashcardModeProps {
  kanjiList: KanjiItem[];
  isStarred: (id: string) => boolean;
  isMastered: (id: string) => boolean;
  onToggleStar: (id: string) => void;
  onToggleMaster: (id: string) => void;
}

const isTypingTarget = (el: EventTarget | null) =>
  el instanceof HTMLElement && (el.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName));

const navButton =
  'grid place-items-center w-12 h-12 shrink-0 rounded-xl bg-ink-900 border border-line text-paper-2 hover:text-paper hover:border-line-strong transition-colors cursor-pointer';

export const FlashcardMode: React.FC<FlashcardModeProps> = ({
  kanjiList,
  isStarred,
  isMastered,
  onToggleStar,
  onToggleMaster,
}) => {
  const [deck, setDeck] = useState<KanjiItem[]>(kanjiList);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  // Follow the filtered list without losing your place: keep the current card if it is still
  // there, let the next card slide in when one was removed, and restart only for a new list.
  const listKey = useMemo(() => kanjiList.map((k) => k.id).join(','), [kanjiList]);
  const [syncedKey, setSyncedKey] = useState(listKey);
  if (syncedKey !== listKey) {
    setSyncedKey(listKey);
    const currentId = deck[currentIndex]?.id;
    const keptAt = currentId ? kanjiList.findIndex((k) => k.id === currentId) : -1;
    const oldIds = new Set(deck.map((k) => k.id));
    const isShrink = kanjiList.every((k) => oldIds.has(k.id));
    setDeck(kanjiList);
    setCurrentIndex(keptAt >= 0 ? keptAt : isShrink ? Math.min(currentIndex, Math.max(0, kanjiList.length - 1)) : 0);
    if (keptAt < 0) setIsFlipped(false);
  }

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
    setDeck(shuffled(deck));
    setCurrentIndex(0);
    setIsFlipped(false);
  };

  const handleMarkMastered = () => {
    if (!currentKanji) return;
    if (!isMastered(currentKanji.id)) onToggleMaster(currentKanji.id);
    handleNext();
  };

  const handleMarkNeedPractice = () => {
    if (currentKanji && isMastered(currentKanji.id)) onToggleMaster(currentKanji.id);
    handleNext();
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey || isTypingTarget(e.target)) return;
      // Space/Enter on a focused control already activates that control (the card flips itself)
      const onControl = e.target instanceof HTMLElement && e.target.closest('button, a, [role="button"]');

      if (e.code === 'Space' && !onControl) {
        e.preventDefault();
        setIsFlipped((prev) => !prev);
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        handleNext();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        handlePrev();
      } else if (e.key.toLowerCase() === 's' && currentKanji) {
        speakJapanese(currentKanji.c);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentKanji, handleNext, handlePrev]);

  if (deck.length === 0 || !currentKanji) {
    return (
      <div className="max-w-md mx-auto text-center py-20 px-6 rounded-2xl border border-dashed border-line-strong">
        <h2 className="text-base font-semibold text-paper">Chưa có thẻ để học</h2>
        <p className="text-sm text-paper-2 mt-1.5">Bộ lọc hiện tại không còn chữ nào. Hãy bật thêm cấp độ hoặc đổi trạng thái ở thanh lọc phía trên.</p>
      </div>
    );
  }

  const starred = isStarred(currentKanji.id);
  const mastered = isMastered(currentKanji.id);
  const level = (
    <span className={levelLabelClass(currentKanji.lvl)}>
      <span className={`w-1.5 h-1.5 rounded-full ${LEVEL_STYLES[currentKanji.lvl].dot}`} aria-hidden="true" />
      {currentKanji.lvl}
    </span>
  );

  return (
    <div className="max-w-xl mx-auto flex flex-col">
      {/* Deck controls */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-sm text-paper-2 tabular-nums">
            <span className="text-paper font-semibold">{(currentIndex + 1).toLocaleString('vi-VN')}</span> / {deck.length.toLocaleString('vi-VN')}
          </span>
          <button
            type="button"
            onClick={handleShuffle}
            className="inline-flex items-center gap-1.5 h-8 px-2.5 rounded-lg text-xs font-medium text-paper-2 hover:text-paper hover:bg-ink-850 transition-colors cursor-pointer"
          >
            <Shuffle className="w-3.5 h-3.5" aria-hidden="true" />
            Trộn thẻ
          </button>
        </div>

        <div className="flex items-center gap-0.5">
          <button
            type="button"
            onClick={() => speakJapanese(currentKanji.c)}
            aria-label={`Phát âm chữ ${currentKanji.c}`}
            title="Nghe phát âm (S)"
            className="grid place-items-center w-9 h-9 rounded-lg text-paper-2 hover:text-paper hover:bg-ink-850 transition-colors cursor-pointer"
          >
            <Volume2 className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => onToggleStar(currentKanji.id)}
            aria-pressed={starred}
            aria-label={starred ? 'Bỏ lưu chữ này' : 'Lưu chữ này'}
            title={starred ? 'Bỏ lưu' : 'Lưu chữ này'}
            className={`grid place-items-center w-9 h-9 rounded-lg transition-colors cursor-pointer hover:bg-ink-850 ${
              starred ? 'text-kin' : 'text-paper-2 hover:text-paper'
            }`}
          >
            <Bookmark className={`w-4 h-4 ${starred ? 'fill-current' : ''}`} />
          </button>
        </div>
      </div>

      <div
        className="w-full h-1 bg-ink-800 rounded-full mb-5 overflow-hidden"
        role="progressbar"
        aria-label="Tiến độ bộ thẻ"
        aria-valuemin={1}
        aria-valuemax={deck.length}
        aria-valuenow={currentIndex + 1}
      >
        <div
          className="h-full bg-shu rounded-full transition-[width] duration-300 ease-out"
          style={{ width: `${((currentIndex + 1) / deck.length) * 100}%` }}
        />
      </div>

      {/* Card */}
      <div
        className="w-full h-[26rem] perspective-1000 cursor-pointer select-none rounded-2xl"
        onClick={() => setIsFlipped((prev) => !prev)}
        role="button"
        tabIndex={0}
        aria-pressed={isFlipped}
        aria-label={isFlipped ? `Mặt sau thẻ ${currentKanji.c}. Bấm để lật lại.` : `Thẻ chữ ${currentKanji.c}. Bấm để xem nghĩa.`}
        onKeyDown={(e) => {
          if (e.key === ' ' || e.key === 'Enter') {
            e.preventDefault();
            setIsFlipped((prev) => !prev);
          }
        }}
      >
        <div
          className={`flip-card relative w-full h-full transform-style-preserve-3d transition-transform duration-500 ease-out-expo ${
            isFlipped ? 'rotate-y-180 is-flipped' : ''
          }`}
        >
          {/* Front */}
          <div
            className="flip-face absolute inset-0 backface-hidden bg-ink-900 border border-line rounded-2xl p-6 flex flex-col items-center"
            aria-hidden={isFlipped}
          >
            <div className="w-full flex items-center justify-between text-xs text-paper-3">
              {level}
              <span className="tabular-nums">
                {currentKanji.st} nét · Bộ {currentKanji.rad_vi || <span lang="ja">{currentKanji.rad}</span>}
              </span>
            </div>

            <div className="my-auto flex flex-col items-center">
              <span lang="ja" className="font-kanji text-[9rem] leading-none text-paper">
                {currentKanji.c}
              </span>
              {mastered && (
                <span className="mt-5 inline-flex items-center gap-1 text-xs font-medium text-ok">
                  <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" /> Đã thuộc
                </span>
              )}
            </div>

            <p className="flex items-center gap-2 text-xs text-paper-3">
              <RotateCw className="w-3.5 h-3.5" aria-hidden="true" />
              Chạm vào thẻ hoặc bấm <kbd>Space</kbd> để lật
            </p>
          </div>

          {/* Back */}
          <div
            className="flip-face absolute inset-0 backface-hidden rotate-y-180 bg-ink-900 border border-line-strong rounded-2xl p-6 flex flex-col overflow-y-auto"
            aria-hidden={!isFlipped}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="text-xs text-paper-3 mb-1">{level}</div>
                <h2 className="text-3xl font-bold text-kin tracking-wide">{currentKanji.hv.join(' · ')}</h2>
              </div>
              <span lang="ja" className="font-kanji text-4xl leading-none text-paper shrink-0">
                {currentKanji.c}
              </span>
            </div>

            <p className="mt-4 text-[15px] text-paper leading-relaxed">{currentKanji.m_vi.join(', ')}</p>

            <dl className="mt-5 pt-4 border-t border-line grid grid-cols-2 gap-4 text-sm">
              <div>
                <dt className="text-xs text-paper-3 mb-1">Âm On</dt>
                <dd lang="ja" className="font-jp text-paper">{currentKanji.on.join('、') || '—'}</dd>
              </div>
              <div>
                <dt className="text-xs text-paper-3 mb-1">Âm Kun</dt>
                <dd lang="ja" className="font-jp text-paper">{currentKanji.kun.join('、') || '—'}</dd>
              </div>
            </dl>

            {currentKanji.words.length > 0 && (
              <div className="mt-4 pt-4 border-t border-line">
                <p className="text-xs text-paper-3 mb-2">Từ vựng ví dụ</p>
                <div className="flex flex-wrap gap-1.5">
                  {currentKanji.words.slice(0, 6).map((w, idx) => (
                    <span key={idx} lang="ja" className="font-jp px-2 py-1 text-sm text-paper-2 rounded-md bg-ink-950 border border-line">
                      {w}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Grading */}
      <div className="flex items-center gap-2.5 mt-5">
        <button type="button" onClick={handlePrev} aria-label="Thẻ trước" title="Thẻ trước (←)" className={navButton}>
          <ArrowLeft className="w-5 h-5" />
        </button>

        <div className="flex-1 grid grid-cols-2 gap-2.5">
          <button
            type="button"
            onClick={handleMarkNeedPractice}
            className="h-12 rounded-xl bg-ink-900 border border-line hover:border-bad/50 text-bad text-sm font-medium inline-flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" aria-hidden="true" />
            Chưa thuộc
          </button>
          <button
            type="button"
            onClick={handleMarkMastered}
            className="h-12 rounded-xl bg-ok/14 border border-ok/35 hover:bg-ok/22 text-ok text-sm font-semibold inline-flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <Check className="w-4 h-4" aria-hidden="true" />
            Đã thuộc
          </button>
        </div>

        <button type="button" onClick={handleNext} aria-label="Thẻ tiếp theo" title="Thẻ tiếp theo (→)" className={navButton}>
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>

      <p className="mt-4 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs text-paper-3">
        <span><kbd>Space</kbd> lật thẻ</span>
        <span><kbd>←</kbd> <kbd>→</kbd> đổi thẻ</span>
        <span><kbd>S</kbd> phát âm</span>
      </p>
    </div>
  );
};
