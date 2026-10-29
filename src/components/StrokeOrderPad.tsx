import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Eraser, Volume2, Bookmark, CheckCircle2, ChevronLeft, ChevronRight, Eye, EyeOff, Undo2 } from 'lucide-react';
import type { KanjiItem } from '../types/kanji';
import { StrokePlayer } from './StrokePlayer';
import { speakJapanese } from '../utils/speech';
import { hasModifier, isTypingTarget } from '../utils/dom';
import { LevelLabel } from './LevelLabel';
import { useStrokes } from '../utils/strokes';

interface StrokeOrderPadProps {
  kanjiList: KanjiItem[];
  currentIndex: number;
  onNavigate: (index: number) => void;
  isStarred: boolean;
  isMastered: boolean;
  onToggleStar: (id: string) => void;
  onToggleMaster: (id: string) => void;
}


const iconButton =
  'grid place-items-center w-9 h-9 rounded-lg text-paper-2 hover:text-paper hover:bg-ink-850 disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer';

export const StrokeOrderPad: React.FC<StrokeOrderPadProps> = ({
  kanjiList,
  currentIndex,
  onNavigate,
  isStarred,
  isMastered,
  onToggleStar,
  onToggleMaster,
}) => {
  const currentKanji = kanjiList[currentIndex];
  const canPrev = currentIndex > 0;
  const canNext = currentIndex < kanjiList.length - 1;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.defaultPrevented || hasModifier(e) || isTypingTarget(e.target)) return;
      if (e.key === 'ArrowLeft' && canPrev) onNavigate(currentIndex - 1);
      if (e.key === 'ArrowRight' && canNext) onNavigate(currentIndex + 1);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, canPrev, canNext, onNavigate]);

  if (!currentKanji) {
    return (
      <div className="max-w-md mx-auto text-center py-20 px-6 rounded-2xl border border-dashed border-line-strong">
        <h2 className="text-base font-semibold text-paper">Chưa có chữ để luyện viết</h2>
        <p className="text-sm text-paper-2 mt-1.5">Bộ lọc hiện tại không còn chữ nào. Hãy bật thêm cấp độ hoặc đổi trạng thái ở thanh lọc phía trên.</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto">
      {/* Navigation */}
      <div className="flex items-center justify-between gap-3 mb-5">
        <div className="flex items-center gap-1">
          <button type="button" onClick={() => onNavigate(currentIndex - 1)} disabled={!canPrev} aria-label="Chữ trước" title="Chữ trước (←)" className={iconButton}>
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="text-sm text-paper-2 tabular-nums min-w-[5.5rem] text-center select-none">
            <span className="text-paper font-semibold">{(currentIndex + 1).toLocaleString('vi-VN')}</span> / {kanjiList.length.toLocaleString('vi-VN')}
          </span>
          <button type="button" onClick={() => onNavigate(currentIndex + 1)} disabled={!canNext} aria-label="Chữ tiếp theo" title="Chữ tiếp theo (→)" className={iconButton}>
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onToggleStar(currentKanji.id)}
            aria-pressed={isStarred}
            aria-label={isStarred ? 'Bỏ lưu chữ này' : 'Lưu chữ này'}
            title={isStarred ? 'Bỏ lưu' : 'Lưu chữ này'}
            className={`${iconButton} ${isStarred ? 'text-kin hover:text-kin' : ''}`}
          >
            <Bookmark className={`w-4 h-4 ${isStarred ? 'fill-current' : ''}`} />
          </button>
          <button
            type="button"
            onClick={() => onToggleMaster(currentKanji.id)}
            aria-pressed={isMastered}
            className={`inline-flex items-center gap-1.5 h-9 px-3 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
              isMastered ? 'bg-ok/12 text-ok' : 'text-paper-2 hover:text-paper hover:bg-ink-850'
            }`}
          >
            <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
            {isMastered ? 'Đã thuộc' : 'Đánh dấu thuộc'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">
        {/* Reference: stroke order + readings */}
        <section className="rounded-2xl bg-ink-900 border border-line p-5" aria-label="Thứ tự nét chuẩn">
          <div className="flex items-start justify-between gap-3 mb-5">
            <div className="min-w-0">
              <div className="flex items-center gap-2 text-xs text-paper-3 mb-1.5">
                <LevelLabel level={currentKanji.lvl} />
                <span className="tabular-nums">
                  {currentKanji.st} nét · Bộ {currentKanji.rad_vi || <span lang="ja">{currentKanji.rad}</span>}
                </span>
              </div>
              <h2 className="text-2xl font-bold text-kin tracking-wide">{currentKanji.hv.join(' · ')}</h2>
              <p className="text-sm text-paper-2 mt-1">{currentKanji.m_vi.join(', ')}</p>
            </div>
            <button
              type="button"
              onClick={() => speakJapanese(currentKanji.c)}
              aria-label={`Phát âm chữ ${currentKanji.c}`}
              title="Nghe phát âm"
              className={`${iconButton} shrink-0`}
            >
              <Volume2 className="w-4 h-4" />
            </button>
          </div>

          <StrokePlayer code={currentKanji.code} character={currentKanji.c} totalStrokes={currentKanji.st} size="lg" />

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
        </section>

        {/* Practice */}
        <PracticePad key={currentKanji.id} kanji={currentKanji} />
      </div>
    </div>
  );
};

type Point = { x: number; y: number; w: number };

/** Free-hand practice canvas. Strokes are stored in 0–1 coordinates so they survive resizes. */
const PracticePad: React.FC<{ kanji: KanjiItem }> = ({ kanji }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const strokesRef = useRef<Point[][]>([]);
  const activeRef = useRef<Point[] | null>(null);
  const frameRef = useRef(0);
  const [strokeCount, setStrokeCount] = useState(0);
  const [showGuide, setShowGuide] = useState(true);
  // Trace the same KanjiVG strokes the player draws; the font glyph is only a fallback
  const { data: guide } = useStrokes(kanji.code);
  const target = guide ? guide.strokes.length : kanji.st;

  const redraw = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    const size = canvas.width;
    ctx.clearRect(0, 0, size, size);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#ede7dd';
    const all = activeRef.current ? [...strokesRef.current, activeRef.current] : strokesRef.current;
    const base = size * 0.034;
    for (const pts of all) {
      if (pts.length === 1) {
        ctx.fillStyle = '#ede7dd';
        ctx.beginPath();
        ctx.arc(pts[0].x * size, pts[0].y * size, (base * pts[0].w) / 2, 0, Math.PI * 2);
        ctx.fill();
        continue;
      }
      // Quadratic segments through midpoints give a smooth line; width follows pen pressure
      for (let i = 1; i < pts.length; i++) {
        const p0 = pts[i - 1];
        const p1 = pts[i];
        const prevMid = i === 1 ? p0 : { x: (pts[i - 2].x + p0.x) / 2, y: (pts[i - 2].y + p0.y) / 2 };
        const mid = i === pts.length - 1 ? p1 : { x: (p0.x + p1.x) / 2, y: (p0.y + p1.y) / 2 };
        ctx.lineWidth = base * ((p0.w + p1.w) / 2);
        ctx.beginPath();
        ctx.moveTo(prevMid.x * size, prevMid.y * size);
        ctx.quadraticCurveTo(p0.x * size, p0.y * size, mid.x * size, mid.y * size);
        ctx.stroke();
      }
    }
  }, []);

  const scheduleRedraw = useCallback(() => {
    if (frameRef.current) return;
    frameRef.current = requestAnimationFrame(() => {
      frameRef.current = 0;
      redraw();
    });
  }, [redraw]);

  // Match the backing store to the displayed size and pixel ratio so ink stays crisp
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const resize = () => {
      const px = Math.round(canvas.getBoundingClientRect().width * (window.devicePixelRatio || 1));
      if (px > 0 && canvas.width !== px) {
        canvas.width = px;
        canvas.height = px;
        redraw();
      }
    };
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frameRef.current);
    };
  }, [redraw]);

  const toPoint = (e: React.PointerEvent<HTMLCanvasElement>): Point => {
    const rect = e.currentTarget.getBoundingClientRect();
    const pressure = e.pointerType === 'pen' ? 0.45 + e.pressure * 0.9 : 1;
    return { x: (e.clientX - rect.left) / rect.width, y: (e.clientY - rect.top) / rect.height, w: pressure };
  };

  const finishStroke = () => {
    if (!activeRef.current) return;
    strokesRef.current = [...strokesRef.current, activeRef.current];
    activeRef.current = null;
    setStrokeCount(strokesRef.current.length);
    scheduleRedraw();
  };

  const handleUndo = () => {
    strokesRef.current = strokesRef.current.slice(0, -1);
    setStrokeCount(strokesRef.current.length);
    redraw();
  };

  const handleClear = () => {
    strokesRef.current = [];
    activeRef.current = null;
    setStrokeCount(0);
    redraw();
  };

  const countTone = strokeCount === 0 ? 'text-paper-3' : strokeCount === target ? 'text-ok' : strokeCount > target ? 'text-bad' : 'text-paper-2';

  return (
    <section className="rounded-2xl bg-ink-900 border border-line p-5 flex flex-col" aria-label="Bảng luyện viết">
      <div className="flex items-center justify-between gap-3 mb-4">
        <div>
          <h2 className="text-sm font-semibold text-paper">Tự viết theo mẫu</h2>
          <p className={`text-xs tabular-nums mt-0.5 ${countTone}`} aria-live="polite">
            Đã viết {strokeCount}/{target} nét
            {strokeCount > target ? ' · nhiều hơn số nét mẫu' : strokeCount === target ? ' · đủ số nét' : ''}
          </p>
        </div>
        <div className="flex items-center gap-0.5">
          <button
            type="button"
            onClick={() => setShowGuide((v) => !v)}
            aria-pressed={showGuide}
            aria-label={showGuide ? 'Ẩn chữ mẫu' : 'Hiện chữ mẫu'}
            title={showGuide ? 'Ẩn chữ mẫu' : 'Hiện chữ mẫu'}
            className={iconButton}
          >
            {showGuide ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
          </button>
          <button type="button" onClick={handleUndo} disabled={strokeCount === 0} aria-label="Hoàn tác nét vừa viết" title="Hoàn tác" className={iconButton}>
            <Undo2 className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleClear}
            disabled={strokeCount === 0}
            className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg text-sm font-medium text-paper-2 hover:text-paper hover:bg-ink-850 disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
          >
            <Eraser className="w-4 h-4" aria-hidden="true" />
            Xóa
          </button>
        </div>
      </div>

      <div className="relative w-full max-w-[26rem] mx-auto aspect-square rounded-xl bg-ink-950 border border-line overflow-hidden select-none">
        <svg viewBox="0 0 109 109" className="absolute inset-0 w-full h-full pointer-events-none" aria-hidden="true">
          <g className="stroke-ink-700" strokeWidth="0.4" fill="none">
            <line x1="54.5" y1="0" x2="54.5" y2="109" strokeDasharray="1.6 1.6" />
            <line x1="0" y1="54.5" x2="109" y2="54.5" strokeDasharray="1.6 1.6" />
            <line x1="0" y1="0" x2="109" y2="109" strokeDasharray="0.8 2.4" opacity="0.6" />
            <line x1="109" y1="0" x2="0" y2="109" strokeDasharray="0.8 2.4" opacity="0.6" />
          </g>
          {showGuide &&
            (guide ? (
              <g className="stroke-ink-800" strokeWidth="3.6" fill="none" strokeLinecap="round" strokeLinejoin="round">
                {guide.strokes.map((st, i) => (
                  <path key={i} d={st.d} />
                ))}
              </g>
            ) : (
              <text x="54.5" y="57" textAnchor="middle" dominantBaseline="central" fontSize="88" lang="ja" className="font-kanji fill-ink-800">
                {kanji.c}
              </text>
            ))}
        </svg>

        <canvas
          ref={canvasRef}
          onPointerDown={(e) => {
            if (e.button !== 0) return;
            e.currentTarget.setPointerCapture(e.pointerId);
            activeRef.current = [toPoint(e)];
            scheduleRedraw();
          }}
          onPointerMove={(e) => {
            if (!activeRef.current) return;
            activeRef.current.push(toPoint(e));
            scheduleRedraw();
          }}
          onPointerUp={finishStroke}
          onPointerCancel={finishStroke}
          className="absolute inset-0 w-full h-full cursor-crosshair touch-none"
          aria-label={`Bảng tập viết chữ ${kanji.c}`}
        />
      </div>

      <p className="text-xs text-paper-3 mt-3 text-center">Viết bằng chuột, ngón tay hoặc bút cảm ứng, theo đúng thứ tự nét của khung mẫu.</p>
    </section>
  );
};
