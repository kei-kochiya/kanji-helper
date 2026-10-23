import React, { useRef, useState, useEffect } from 'react';
import { Eraser, Volume2, Bookmark, BookmarkCheck, CheckCircle2, ChevronLeft, ChevronRight, Eye, EyeOff } from 'lucide-react';
import type { KanjiItem } from '../types/kanji';
import { StrokePlayer } from './StrokePlayer';
import { speakJapanese } from '../utils/speech';

interface StrokeOrderPadProps {
  kanjiList: KanjiItem[];
  currentIndex: number;
  onNavigate: (index: number) => void;
  isStarred: boolean;
  isMastered: boolean;
  onToggleStar: (id: string) => void;
  onToggleMaster: (id: string) => void;
}

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
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [showGuide, setShowGuide] = useState(true);

  // Clear canvas when kanji changes
  useEffect(() => {
    clearCanvas();
  }, [currentIndex]);

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    draw(e);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (ctx) ctx.beginPath();
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing && e.type !== 'mousedown' && e.type !== 'touchstart') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;

    const x = (clientX - rect.left) * (canvas.width / rect.width);
    const y = (clientY - rect.top) * (canvas.height / rect.height);

    ctx.lineWidth = 14;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#60a5fa'; // Refined sky blue ink

    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  if (!currentKanji) {
    return (
      <div className="text-center py-24 text-zinc-500 font-mono">
        Không có chữ Kanji nào trong bộ lọc hiện tại.
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      {/* Top Bar with Navigation */}
      <div className="flex items-center justify-between bg-[#10131d]/90 p-3 rounded-2xl border border-white/[0.08] mb-6 shadow-sm">
        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigate(Math.max(0, currentIndex - 1))}
            disabled={currentIndex === 0}
            aria-label="Chữ trước"
            className="p-2 bg-zinc-800/80 hover:bg-zinc-700/80 disabled:opacity-30 rounded-xl text-zinc-300 transition cursor-pointer active:scale-[0.96] border border-white/[0.06]"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="text-xs font-mono text-zinc-300 font-medium select-none">
            {currentIndex + 1} / {kanjiList.length}
          </span>
          <button
            onClick={() => onNavigate(Math.min(kanjiList.length - 1, currentIndex + 1))}
            disabled={currentIndex === kanjiList.length - 1}
            aria-label="Chữ tiếp theo"
            className="p-2 bg-zinc-800/80 hover:bg-zinc-700/80 disabled:opacity-30 rounded-xl text-zinc-300 transition cursor-pointer active:scale-[0.96] border border-white/[0.06]"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onToggleStar(currentKanji.id)}
            aria-label={isStarred ? 'Bỏ lưu' : 'Lưu chữ Kanji này'}
            className={`p-2 rounded-xl border transition cursor-pointer active:scale-[0.96] ${
              isStarred
                ? 'bg-amber-500/15 border-amber-500/30 text-amber-400'
                : 'bg-zinc-800/80 border-white/[0.08] text-zinc-400 hover:text-white'
            }`}
            title="Đánh dấu đã lưu"
          >
            {isStarred ? (
              <BookmarkCheck className="w-4 h-4 fill-amber-400/20" />
            ) : (
              <Bookmark className="w-4 h-4" />
            )}
          </button>

          <button
            onClick={() => onToggleMaster(currentKanji.id)}
            className={`px-3 py-1.5 text-xs font-medium rounded-xl border flex items-center gap-1.5 transition cursor-pointer active:scale-[0.96] ${
              isMastered
                ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                : 'bg-zinc-800/80 border-white/[0.08] text-zinc-400 hover:text-white'
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{isMastered ? 'Đã thuộc' : 'Đánh dấu đã thuộc'}</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
        {/* Left column: Official Stroke Order Animation & Metadata */}
        <div className="space-y-4">
          <div className="bg-[#10131d]/90 p-5 rounded-2xl border border-white/[0.08] shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300 border border-white/[0.08]">
                  {currentKanji.lvl}
                </span>
                <span className="text-xs text-zinc-400 ml-2 font-mono">
                  {currentKanji.st} nét • Bộ {currentKanji.rad_vi || currentKanji.rad}
                </span>
              </div>
              <button
                onClick={() => speakJapanese(currentKanji.c)}
                aria-label={`Phát âm chữ ${currentKanji.c}`}
                className="p-1.5 text-zinc-400 hover:text-blue-400 bg-zinc-800/80 hover:bg-zinc-700 rounded-lg border border-white/[0.06] transition cursor-pointer"
                title="Nghe phát âm"
              >
                <Volume2 className="w-4 h-4" />
              </button>
            </div>

            {/* KanjiVG Stroke Player */}
            <StrokePlayer
              code={currentKanji.code}
              character={currentKanji.c}
              totalStrokes={currentKanji.st}
            />

            {/* Info details */}
            <div className="mt-4 pt-4 border-t border-white/[0.08] space-y-2.5">
              <div className="flex items-baseline gap-2">
                <span className="text-xs text-zinc-400 uppercase tracking-wider font-mono">Hán Việt:</span>
                <span className="text-lg font-bold text-amber-400 tracking-wide">
                  {currentKanji.hv.join(' • ')}
                </span>
              </div>

              <div>
                <span className="text-xs text-zinc-400 uppercase tracking-wider font-mono block mb-1">Nghĩa:</span>
                <p className="text-sm text-zinc-200">
                  {currentKanji.m_vi.join(', ')}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs pt-2">
                <div className="bg-[#0a0c12]/80 p-2.5 rounded-xl border border-white/[0.08]">
                  <span className="text-zinc-400 font-mono block mb-1">Âm On:</span>
                  <span className="text-zinc-200 font-kanji font-medium">
                    {currentKanji.on.join('、') || '—'}
                  </span>
                </div>
                <div className="bg-[#0a0c12]/80 p-2.5 rounded-xl border border-white/[0.08]">
                  <span className="text-zinc-400 font-mono block mb-1">Âm Kun:</span>
                  <span className="text-zinc-200 font-kanji font-medium">
                    {currentKanji.kun.join('、') || '—'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right column: Interactive Practice Writing Canvas */}
        <div className="bg-[#10131d]/90 p-5 rounded-2xl border border-white/[0.08] shadow-sm flex flex-col items-center">
          <div className="w-full flex items-center justify-between mb-3.5">
            <span className="text-xs font-medium text-zinc-200">Tập viết theo nét (Canvas)</span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowGuide(!showGuide)}
                className={`text-xs px-2.5 py-1 rounded-lg border transition cursor-pointer flex items-center gap-1 active:scale-[0.97] ${
                  showGuide
                    ? 'bg-zinc-800 border-white/[0.12] text-zinc-200'
                    : 'bg-zinc-900 border-white/[0.06] text-zinc-400'
                }`}
              >
                {showGuide ? <Eye className="w-3.5 h-3.5 text-zinc-300" /> : <EyeOff className="w-3.5 h-3.5 text-zinc-400" />}
                <span>{showGuide ? 'Ẩn chữ mẫu' : 'Hiện chữ mẫu'}</span>
              </button>
              <button
                onClick={clearCanvas}
                className="text-xs px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-white/[0.08] flex items-center gap-1 transition cursor-pointer active:scale-[0.97]"
                title="Xóa bảng vẽ"
              >
                <Eraser className="w-3.5 h-3.5" />
                <span>Xóa nét</span>
              </button>
            </div>
          </div>

          {/* Interactive Pad */}
          <div className="relative w-72 h-72 sm:w-80 sm:h-80 bg-[#06080c] rounded-2xl border border-white/[0.1] shadow-2xl flex items-center justify-center overflow-hidden touch-none select-none">
            {/* Guide Grid Lines */}
            <div className="absolute inset-0 pointer-events-none">
              <div className="w-full h-full border border-dashed border-white/[0.05] grid grid-cols-2 grid-rows-2">
                <div className="border-r border-b border-dashed border-white/[0.05]"></div>
                <div className="border-b border-dashed border-white/[0.05]"></div>
                <div className="border-r border-dashed border-white/[0.05]"></div>
                <div></div>
              </div>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-full h-[1px] bg-white/[0.03]"></div>
              </div>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="h-full w-[1px] bg-white/[0.03]"></div>
              </div>
            </div>

            {/* Faint Underlay Character Guide */}
            {showGuide && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none">
                <span className="text-[170px] sm:text-[190px] font-kanji text-zinc-800/40 leading-none">
                  {currentKanji.c}
                </span>
              </div>
            )}

            {/* Drawing Canvas */}
            <canvas
              ref={canvasRef}
              width={320}
              height={320}
              onMouseDown={startDrawing}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              onMouseMove={draw}
              onTouchStart={startDrawing}
              onTouchEnd={stopDrawing}
              onTouchMove={draw}
              className="absolute inset-0 w-full h-full cursor-crosshair z-20"
            />
          </div>

          <p className="text-[11px] text-zinc-400 mt-3 text-center">
            Dùng chuột hoặc ngón tay để vẽ các nét Kanji theo đúng thứ tự trên bảng.
          </p>
        </div>
      </div>
    </div>
  );
};
