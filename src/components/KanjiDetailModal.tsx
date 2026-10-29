import React, { useEffect, useRef, useState } from 'react';
import { X, Volume2, Bookmark, CheckCircle2, Copy, Check, ChevronLeft, ChevronRight } from 'lucide-react';
import type { KanjiItem } from '../types/kanji';
import { StrokePlayer } from './StrokePlayer';
import { speakJapanese } from '../utils/speech';
import { LEVEL_STYLES, levelLabelClass } from '../utils/levels';

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

const headerButton =
  'grid place-items-center w-9 h-9 rounded-lg text-paper-2 hover:text-paper hover:bg-ink-800 transition-colors cursor-pointer';
const readingChip =
  'inline-flex items-center gap-1.5 h-8 px-2.5 rounded-lg border border-line bg-ink-950 text-sm text-paper hover:border-line-strong transition-colors cursor-pointer';

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
  const [copied, setCopied] = useState(false);
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const closeRef = useRef<HTMLButtonElement | null>(null);

  // Focus into the dialog, lock page scroll, and hand focus back on close
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const { overflow } = document.body.style;
    document.body.style.overflow = 'hidden';
    closeRef.current?.focus();
    return () => {
      document.body.style.overflow = overflow;
      previous?.focus?.();
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }
      // The stroke timeline uses the arrow keys itself
      if (e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey) return;
      if (e.key === 'ArrowLeft' && onPrev) onPrev();
      if (e.key === 'ArrowRight' && onNext) onNext();
      if (e.key === 'Tab' && dialogRef.current) {
        const focusables = dialogRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])'
        );
        if (focusables.length === 0) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, onPrev, onNext]);

  if (!kanji) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(kanji.c);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      /* Clipboard blocked (insecure context or denied): the glyph stays selectable */
    }
  };

  const hv = kanji.hv.join(' · ');

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center p-3 sm:p-6 bg-black/75 animate-overlay"
      onClick={onClose}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={`Chi tiết chữ ${kanji.c}, ${hv}`}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-3xl max-h-[92vh] flex flex-col bg-ink-900 border border-line rounded-2xl shadow-[0_24px_64px_-20px_rgb(0_0_0/0.8)] overflow-hidden animate-dialog"
      >
        {/* Toolbar */}
        <div className="flex items-center justify-between gap-3 pl-5 pr-3 h-14 border-b border-line shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <span className={levelLabelClass(kanji.lvl)}>
              <span className={`w-1.5 h-1.5 rounded-full ${LEVEL_STYLES[kanji.lvl].dot}`} aria-hidden="true" />
              {kanji.lvl}
            </span>
            <span className="font-mono text-[11px] text-paper-3 hidden sm:inline">U+{kanji.code.toUpperCase()}</span>
          </div>

          <div className="flex items-center gap-0.5">
            <button
              type="button"
              onClick={onPrev}
              disabled={!onPrev}
              aria-label="Chữ trước"
              title="Chữ trước (←)"
              className={`${headerButton} disabled:opacity-30 disabled:pointer-events-none`}
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={onNext}
              disabled={!onNext}
              aria-label="Chữ tiếp theo"
              title="Chữ tiếp theo (→)"
              className={`${headerButton} disabled:opacity-30 disabled:pointer-events-none`}
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            <span className="w-px h-5 bg-line mx-1.5" aria-hidden="true" />

            <button
              type="button"
              onClick={() => onToggleStar(kanji.id)}
              aria-pressed={isStarred}
              aria-label={isStarred ? 'Bỏ lưu chữ này' : 'Lưu chữ này'}
              title={isStarred ? 'Bỏ lưu' : 'Lưu chữ này'}
              className={`${headerButton} ${isStarred ? 'text-kin hover:text-kin' : ''}`}
            >
              <Bookmark className={`w-4 h-4 ${isStarred ? 'fill-current' : ''}`} />
            </button>
            <button
              type="button"
              onClick={() => onToggleMaster(kanji.id)}
              aria-pressed={isMastered}
              aria-label={isMastered ? 'Đã thuộc' : 'Đánh dấu đã thuộc'}
              title={isMastered ? 'Bỏ đánh dấu đã thuộc' : 'Đánh dấu đã thuộc'}
              className={`inline-flex items-center gap-1.5 h-9 px-2.5 sm:px-3 rounded-lg text-sm font-medium whitespace-nowrap transition-colors cursor-pointer ${
                isMastered ? 'bg-ok/12 text-ok' : 'text-paper-2 hover:text-paper hover:bg-ink-800'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              <span className="hidden sm:inline">{isMastered ? 'Đã thuộc' : 'Đánh dấu thuộc'}</span>
            </button>

            <button ref={closeRef} type="button" onClick={onClose} aria-label="Đóng (Esc)" title="Đóng (Esc)" className={`${headerButton} ml-1`}>
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="overflow-y-auto overscroll-contain">
          {/* Identity + stroke order */}
          <section className="grid md:grid-cols-[minmax(0,1fr)_auto] gap-x-8 gap-y-6 p-5 sm:p-6">
            <div className="min-w-0 flex flex-col">
              <div className="flex items-end gap-4">
                <span lang="ja" className="font-kanji text-[7.5rem] leading-[0.95] text-paper select-all">
                  {kanji.c}
                </span>
                <div className="flex flex-col gap-1 pb-2">
                  <button
                    type="button"
                    onClick={() => speakJapanese(kanji.c)}
                    aria-label={`Phát âm chữ ${kanji.c}`}
                    title="Nghe phát âm"
                    className={headerButton}
                  >
                    <Volume2 className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={handleCopy}
                    aria-label={copied ? 'Đã sao chép' : 'Sao chép chữ Hán'}
                    title={copied ? 'Đã sao chép' : 'Sao chép chữ Hán'}
                    className={headerButton}
                  >
                    {copied ? <Check className="w-4 h-4 text-ok" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <h2 className="mt-4 text-3xl font-bold text-kin tracking-wide">{hv}</h2>
              <p className="mt-1 text-sm text-paper-3">
                {kanji.st} nét · Bộ {kanji.rad_vi || <span lang="ja">{kanji.rad}</span>}
              </p>

              <ul className="mt-5 flex flex-col gap-1.5 text-[15px] text-paper list-disc pl-5 marker:text-shu">
                {kanji.m_vi.map((m, idx) => (
                  <li key={idx}>{m}</li>
                ))}
              </ul>
              {kanji.m_en.length > 0 && (
                <p className="mt-3 text-sm text-paper-3">
                  <span lang="en">{kanji.m_en.join(', ')}</span>
                </p>
              )}
            </div>

            <div className="md:w-[16.5rem]">
              <StrokePlayer code={kanji.code} character={kanji.c} totalStrokes={kanji.st} />
            </div>
          </section>

          {/* Readings */}
          <section className="grid sm:grid-cols-2 gap-6 px-5 sm:px-6 py-5 border-t border-line">
            <ReadingGroup title="Âm On" hint="Katakana" readings={kanji.on} emptyText="Không có âm On thông dụng" />
            <ReadingGroup title="Âm Kun" hint="Hiragana" readings={kanji.kun} emptyText="Không có âm Kun thông dụng" />
          </section>

          {kanji.words.length > 0 && (
            <section className="px-5 sm:px-6 py-5 border-t border-line">
              <h3 className="text-sm font-semibold text-paper-2 mb-2.5">Từ ghép ví dụ</h3>
              <div className="flex flex-wrap gap-2">
                {kanji.words.map((word, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => speakJapanese(word)}
                    title="Nghe phát âm"
                    className={readingChip}
                  >
                    <span lang="ja" className="font-jp">{word}</span>
                    <Volume2 className="w-3.5 h-3.5 text-paper-3" aria-hidden="true" />
                  </button>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
};

const ReadingGroup: React.FC<{ title: string; hint: string; readings: string[]; emptyText: string }> = ({
  title,
  hint,
  readings,
  emptyText,
}) => (
  <div>
    <h3 className="text-sm font-semibold text-paper-2 mb-2.5">
      {title} <span className="font-normal text-paper-3">· {hint}</span>
    </h3>
    {readings.length > 0 ? (
      <div className="flex flex-wrap gap-2">
        {readings.map((reading, i) => (
          <button
            key={i}
            type="button"
            onClick={() => speakJapanese(reading)}
            aria-label={`Nghe ${reading}`}
            title="Nghe phát âm"
            className={readingChip}
          >
            <span lang="ja" className="font-jp">{reading}</span>
            <Volume2 className="w-3.5 h-3.5 text-paper-3" aria-hidden="true" />
          </button>
        ))}
      </div>
    ) : (
      <p className="text-sm text-paper-3">{emptyText}</p>
    )}
  </div>
);
