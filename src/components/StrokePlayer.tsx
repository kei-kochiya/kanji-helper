import React, { useEffect, useState, useRef } from 'react';
import { Play, Pause, RotateCcw, ChevronLeft, ChevronRight, Eye, EyeOff, Loader2 } from 'lucide-react';

interface StrokePlayerProps {
  code: string;
  character: string;
  totalStrokes: number;
}

export const StrokePlayer: React.FC<StrokePlayerProps> = ({ code, character, totalStrokes }) => {
  const [svgContent, setSvgContent] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [showNumbers, setShowNumbers] = useState<boolean>(true);
  const [strokePaths, setStrokePaths] = useState<string[]>([]);
  const [strokeNumbers, setStrokeNumbers] = useState<{ text: string; x: string; y: string }[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setSvgContent(null);
    setCurrentStep(0);
    setIsPlaying(false);

    const url = `https://cdn.jsdelivr.net/gh/KanjiVG/kanjivg/kanji/${code}.svg`;
    fetch(url)
      .then(res => {
        if (!res.ok) throw new Error('KanjiVG not found');
        return res.text();
      })
      .then(text => {
        if (!isMounted) return;
        setSvgContent(text);

        // Parse paths and numbers
        const parser = new DOMParser();
        const doc = parser.parseFromString(text, 'image/svg+xml');
        const paths = Array.from(doc.querySelectorAll('path')).map(p => p.getAttribute('d') || '');
        const texts = Array.from(doc.querySelectorAll('text')).map(t => {
          const transform = t.getAttribute('transform') || '';
          const match = transform.match(/matrix\([^,]+,[^,]+,[^,]+,[^,]+,([^,]+),([^)]+)\)/);
          return {
            text: t.textContent || '',
            x: match ? match[1].trim() : (t.getAttribute('x') || '0'),
            y: match ? match[2].trim() : (t.getAttribute('y') || '0'),
          };
        });

        setStrokePaths(paths);
        setStrokeNumbers(texts);
        setCurrentStep(paths.length); // Show full kanji initially
        setLoading(false);
      })
      .catch(() => {
        if (!isMounted) return;
        setLoading(false);
      });

    return () => {
      isMounted = false;
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [code]);

  useEffect(() => {
    if (isPlaying) {
      timerRef.current = setInterval(() => {
        setCurrentStep(prev => {
          if (prev >= strokePaths.length) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, 550);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, strokePaths.length]);

  const handleRestart = () => {
    setCurrentStep(0);
    setIsPlaying(true);
  };

  const handleTogglePlay = () => {
    if (currentStep >= strokePaths.length) {
      setCurrentStep(0);
      setIsPlaying(true);
    } else {
      setIsPlaying(!isPlaying);
    }
  };

  const handleStepForward = () => {
    setIsPlaying(false);
    setCurrentStep(prev => Math.min(prev + 1, strokePaths.length));
  };

  const handleStepBack = () => {
    setIsPlaying(false);
    setCurrentStep(prev => Math.max(prev - 1, 0));
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-[#0a0c12]/60 rounded-xl border border-white/[0.08] h-64">
        <Loader2 className="w-7 h-7 text-blue-500 animate-spin mb-3" />
        <span className="text-xs text-zinc-400 font-mono">Đang tải nét viết KanjiVG...</span>
      </div>
    );
  }

  if (!svgContent || strokePaths.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-[#0a0c12]/60 rounded-xl border border-white/[0.08] h-64 text-center">
        <span className="text-6xl font-kanji text-zinc-300 mb-2 select-none">{character}</span>
        <span className="text-xs text-zinc-400 font-mono">Chữ Hán chuẩn: {totalStrokes} nét</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center bg-[#0a0c12]/70 p-4 rounded-xl border border-white/[0.08]">
      {/* SVG Canvas with Grid Guidelines */}
      <div className="relative w-48 h-48 bg-[#06080c] rounded-xl border border-white/[0.08] shadow-inner flex items-center justify-center overflow-hidden">
        {/* Grid lines (Mizukiri guide) */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="w-full h-full border-dashed border-white/[0.04] grid grid-cols-2 grid-rows-2">
            <div className="border-r border-b border-white/[0.05]"></div>
            <div className="border-b border-white/[0.05]"></div>
            <div className="border-r border-white/[0.05]"></div>
            <div></div>
          </div>
        </div>

        {/* Dynamic Stroke SVG */}
        <svg viewBox="0 0 109 109" className="w-44 h-44 z-10" aria-label={`Nét viết chữ ${character}`}>
          {/* Background all strokes in faint ghost gray */}
          {strokePaths.map((d, i) => (
            <path
              key={`ghost-${i}`}
              d={d}
              fill="none"
              stroke="#222634"
              strokeWidth="3.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          ))}

          {/* Render active strokes up to currentStep */}
          {strokePaths.slice(0, currentStep).map((d, i) => {
            const isLast = i === currentStep - 1;
            return (
              <path
                key={`active-${i}`}
                d={d}
                fill="none"
                stroke={isLast && isPlaying ? '#38bdf8' : '#f8fafc'}
                strokeWidth="3.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="transition-colors duration-200"
              />
            );
          })}

          {/* Stroke Numbers */}
          {showNumbers && strokeNumbers.slice(0, currentStep).map((num, i) => (
            <text
              key={`num-${i}`}
              x={num.x}
              y={num.y}
              fontSize="8"
              fill="#f43f5e"
              fontWeight="bold"
              className="select-none"
            >
              {num.text || (i + 1)}
            </text>
          ))}
        </svg>

        {/* Step Badge */}
        <div className="absolute bottom-1.5 right-2 text-[10px] font-mono text-zinc-300 bg-[#0c0e14]/90 px-1.5 py-0.5 rounded border border-white/[0.08] select-none">
          {currentStep}/{strokePaths.length} nét
        </div>
      </div>

      {/* Controls Bar */}
      <div className="flex items-center gap-1.5 mt-3.5" role="toolbar" aria-label="Điều khiển nét vẽ">
        <button
          onClick={handleRestart}
          aria-label="Xem lại từ nét đầu"
          title="Xem lại từ nét đầu"
          className="p-1.5 text-zinc-400 hover:text-white bg-zinc-800/60 hover:bg-zinc-800 rounded-lg border border-white/[0.08] cursor-pointer transition active:scale-[0.96]"
        >
          <RotateCcw className="w-4 h-4" />
        </button>

        <button
          onClick={handleStepBack}
          disabled={currentStep <= 0}
          aria-label="Nét trước"
          title="Nét trước"
          className="p-1.5 text-zinc-400 hover:text-white bg-zinc-800/60 hover:bg-zinc-800 disabled:opacity-30 disabled:hover:bg-zinc-800/60 rounded-lg border border-white/[0.08] cursor-pointer transition active:scale-[0.96]"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        <button
          onClick={handleTogglePlay}
          aria-label={isPlaying ? 'Tạm dừng chạy nét' : 'Tự động chạy nét'}
          title={isPlaying ? 'Tạm dừng' : 'Tự động chạy nét'}
          className="px-3 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-500 active:scale-[0.96] rounded-lg flex items-center gap-1.5 transition cursor-pointer shadow-sm"
        >
          {isPlaying ? (
            <>
              <Pause className="w-3.5 h-3.5 fill-current" />
              <span>Dừng</span>
            </>
          ) : (
            <>
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Chạy nét</span>
            </>
          )}
        </button>

        <button
          onClick={handleStepForward}
          disabled={currentStep >= strokePaths.length}
          aria-label="Nét tiếp theo"
          title="Nét tiếp theo"
          className="p-1.5 text-zinc-400 hover:text-white bg-zinc-800/60 hover:bg-zinc-800 disabled:opacity-30 disabled:hover:bg-zinc-800/60 rounded-lg border border-white/[0.08] cursor-pointer transition active:scale-[0.96]"
        >
          <ChevronRight className="w-4 h-4" />
        </button>

        <button
          onClick={() => setShowNumbers(!showNumbers)}
          aria-label={showNumbers ? 'Ẩn số thứ tự nét' : 'Hiện số thứ tự nét'}
          title={showNumbers ? 'Ẩn số thứ tự nét' : 'Hiện số thứ tự nét'}
          className={`p-1.5 rounded-lg border cursor-pointer transition active:scale-[0.96] ${
            showNumbers
              ? 'text-rose-400 bg-rose-500/10 border-rose-500/30'
              : 'text-zinc-500 bg-zinc-800/60 border-white/[0.08]'
          }`}
        >
          {showNumbers ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
};
