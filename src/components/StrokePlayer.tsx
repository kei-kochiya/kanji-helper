import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Play, Pause, RotateCcw, StepBack, StepForward, Hash, RefreshCw } from 'lucide-react';
import { useReducedMotion } from '../utils/motion';

interface StrokePlayerProps {
  code: string;
  character: string;
  totalStrokes: number;
  /** Frame size: `md` for the detail dialog, `lg` for the writing lab. */
  size?: 'md' | 'lg';
  /** Start drawing as soon as the strokes load (skipped under reduced motion). */
  autoPlay?: boolean;
}

interface StrokeGeometry {
  d: string;
  len: number;
  /** Points sampled along the path, flattened as [x0, y0, x1, y1, …]. */
  pts: number[];
}

interface StrokeData {
  strokes: StrokeGeometry[];
  numbers: ({ x: number; y: number } | undefined)[];
}

class StrokeLoadError extends Error {
  readonly missing: boolean;
  constructor(missing: boolean) {
    super(missing ? 'KanjiVG has no file for this character' : 'Failed to load KanjiVG');
    this.missing = missing;
  }
}

const SVG_NS = 'http://www.w3.org/2000/svg';
const SPEEDS = [0.5, 1, 2] as const;
/** Pause between two strokes, in ms at 1× speed. */
const GAP_MS = 170;
/** Time to draw one stroke: a short press plus travel proportional to its length (KanjiVG units, 109 box). */
const strokeMs = (len: number) => 200 + len * 8;
/** Brush pace: settle into the stroke, sweep, slow into the end. */
const easeBrush = (t: number) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2);
const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);

const cache = new Map<string, Promise<StrokeData>>();

function strokeIndex(el: Element): number {
  const m = (el.getAttribute('id') ?? '').match(/-s(\d+)$/);
  return m ? Number(m[1]) : Number.MAX_SAFE_INTEGER;
}

function parseKanjiVG(text: string): { paths: string[]; numbers: ({ x: number; y: number } | undefined)[] } {
  const doc = new DOMParser().parseFromString(text, 'image/svg+xml');
  const paths = Array.from(doc.querySelectorAll('path'))
    .map((p, order) => ({ d: p.getAttribute('d') ?? '', order, idx: strokeIndex(p) }))
    .filter((p) => p.d)
    .sort((a, b) => a.idx - b.idx || a.order - b.order)
    .map((p) => p.d);

  const numbers: ({ x: number; y: number } | undefined)[] = new Array(paths.length);
  Array.from(doc.querySelectorAll('text')).forEach((t, order) => {
    // KanjiVG writes `matrix(1 0 0 1 x y)` with spaces; accept commas as well
    const m = (t.getAttribute('transform') ?? '').match(/matrix\(([^)]+)\)/);
    const parts = m ? m[1].trim().split(/[\s,]+/).map(Number) : [];
    const pos =
      parts.length === 6
        ? { x: parts[4], y: parts[5] }
        : { x: Number(t.getAttribute('x') ?? 0), y: Number(t.getAttribute('y') ?? 0) };
    const n = Number(t.textContent);
    const slot = Number.isInteger(n) && n >= 1 ? n - 1 : order;
    if (slot < numbers.length) numbers[slot] = pos;
  });

  return { paths, numbers };
}

/** Measure each path once in a hidden SVG so drawing can follow the real stroke length. */
function measure(paths: string[]): StrokeGeometry[] {
  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('width', '0');
  svg.setAttribute('height', '0');
  svg.style.position = 'absolute';
  svg.style.visibility = 'hidden';
  document.body.appendChild(svg);
  try {
    return paths.map((d) => {
      const el = document.createElementNS(SVG_NS, 'path');
      el.setAttribute('d', d);
      svg.appendChild(el);
      const len = el.getTotalLength();
      const samples = Math.max(2, Math.ceil(len / 1.25) + 1);
      const pts: number[] = [];
      for (let i = 0; i < samples; i++) {
        const p = el.getPointAtLength((len * i) / (samples - 1));
        pts.push(p.x, p.y);
      }
      return { d, len, pts };
    });
  } finally {
    svg.remove();
  }
}

function loadStrokes(code: string): Promise<StrokeData> {
  let pending = cache.get(code);
  if (!pending) {
    pending = fetch(`https://cdn.jsdelivr.net/gh/KanjiVG/kanjivg/kanji/${code}.svg`)
      .then((res) => {
        if (!res.ok) throw new StrokeLoadError(res.status === 404);
        return res.text();
      })
      .then((text) => {
        const { paths, numbers } = parseKanjiVG(text);
        if (paths.length === 0) throw new StrokeLoadError(true);
        return { strokes: measure(paths), numbers };
      });
    // Network failures may be transient: drop them so "Thử lại" refetches
    pending.catch((err) => {
      if (!(err instanceof StrokeLoadError && err.missing)) cache.delete(code);
    });
    cache.set(code, pending);
  }
  return pending;
}

function pointAt(pts: number[], t: number): [number, number] {
  const count = pts.length / 2;
  const pos = clamp01(t) * (count - 1);
  const i = Math.min(count - 2, Math.floor(pos));
  const f = pos - i;
  return [pts[i * 2] + (pts[i * 2 + 2] - pts[i * 2]) * f, pts[i * 2 + 1] + (pts[i * 2 + 3] - pts[i * 2 + 1]) * f];
}

function usePref<T>(key: string, fallback: T): [T, (v: T) => void] {
  const [value, setValue] = useState<T>(() => {
    try {
      const raw = localStorage.getItem(key);
      return raw === null ? fallback : (JSON.parse(raw) as T);
    } catch {
      return fallback;
    }
  });
  const update = useCallback(
    (v: T) => {
      setValue(v);
      try {
        localStorage.setItem(key, JSON.stringify(v));
      } catch {
        /* storage unavailable: keep the in-memory value */
      }
    },
    [key]
  );
  return [value, update];
}

export const StrokePlayer: React.FC<StrokePlayerProps> = (props) => {
  const [speed, setSpeed] = usePref<number>('kh.stroke.speed', 1);
  const [showNumbers, setShowNumbers] = usePref<boolean>('kh.stroke.numbers', true);

  // Keyed by code so playback state starts fresh for every character
  return (
    <StrokeStage
      key={props.code}
      {...props}
      speed={SPEEDS.includes(speed as (typeof SPEEDS)[number]) ? speed : 1}
      onSpeedChange={setSpeed}
      showNumbers={showNumbers}
      onShowNumbersChange={setShowNumbers}
    />
  );
};

interface StrokeStageProps extends StrokePlayerProps {
  speed: number;
  onSpeedChange: (v: number) => void;
  showNumbers: boolean;
  onShowNumbersChange: (v: boolean) => void;
}

type LoadResult = { data: StrokeData } | { error: StrokeLoadError | Error };

const StrokeStage: React.FC<StrokeStageProps> = ({
  code,
  character,
  totalStrokes,
  size = 'md',
  autoPlay = true,
  speed,
  onSpeedChange,
  showNumbers,
  onShowNumbersChange,
}) => {
  const reduceMotion = useReducedMotion();
  const [result, setResult] = useState<LoadResult | null>(null);
  const [attempt, setAttempt] = useState(0);
  // Infinity = whole character shown; the timeline clamps it
  const [elapsed, setElapsed] = useState(() => (autoPlay && !reduceMotion ? 0 : Infinity));
  const [playing, setPlaying] = useState(false);
  const elapsedRef = useRef(elapsed);
  const stopAtRef = useRef<number | null>(null);
  const scrubbingRef = useRef(false);

  useEffect(() => {
    let alive = true;
    loadStrokes(code).then(
      (data) => alive && setResult({ data }),
      (error: Error) => alive && setResult({ error })
    );
    return () => {
      alive = false;
    };
  }, [code, attempt]);

  const data = result && 'data' in result ? result.data : null;
  const error = result && 'error' in result ? result.error : null;
  const missing = error instanceof StrokeLoadError && error.missing;

  const timeline = useMemo(() => {
    if (!data) return null;
    const durs = data.strokes.map((s) => strokeMs(s.len));
    const starts: number[] = [];
    let t = 0;
    durs.forEach((dur, i) => {
      starts.push(t);
      t += dur + (i < durs.length - 1 ? GAP_MS : 0);
    });
    return { durs, starts, total: t };
  }, [data]);

  const seek = useCallback((value: number) => {
    elapsedRef.current = value;
    setElapsed(value);
  }, []);

  // Autoplay once the strokes are ready: a short beat on the empty grid, then the brush starts.
  // The elapsed === 0 guard keeps it to the first load of this character.
  useEffect(() => {
    if (!timeline || !autoPlay || reduceMotion || elapsedRef.current !== 0) return;
    const id = window.setTimeout(() => setPlaying(true), 380);
    return () => window.clearTimeout(id);
  }, [timeline, autoPlay, reduceMotion]);

  // Drawing loop
  useEffect(() => {
    if (!playing || !timeline) return;
    let raf = 0;
    let last = performance.now();
    let e = Math.min(elapsedRef.current, timeline.total);
    const tick = (now: number) => {
      // Cap the frame delta so a backgrounded tab resumes where it paused
      e += Math.min(now - last, 64) * speed;
      last = now;
      const stopAt = stopAtRef.current ?? timeline.total;
      if (e >= stopAt) {
        seek(stopAt);
        stopAtRef.current = null;
        setPlaying(false);
        return;
      }
      seek(e);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [playing, timeline, speed, seek]);

  const n = data?.strokes.length ?? 0;
  const total = timeline?.total ?? 0;
  const e = Math.min(elapsed, total);
  const raw = timeline ? timeline.starts.map((s, i) => clamp01((e - s) / timeline.durs[i])) : [];
  const completed = raw.filter((r) => r >= 1).length;
  const activeIndex = raw.findIndex((r) => r > 0 && r < 1);
  const isDone = n > 0 && completed === n;

  const endOf = (i: number) => (timeline ? timeline.starts[i] + timeline.durs[i] : 0);

  const handleTogglePlay = () => {
    if (!timeline) return;
    if (playing) {
      setPlaying(false);
      return;
    }
    stopAtRef.current = null;
    if (e >= total) seek(0);
    setPlaying(true);
  };

  const handleReplay = () => {
    if (!timeline) return;
    stopAtRef.current = null;
    seek(0);
    setPlaying(true);
  };

  const stepForward = (animate: boolean) => {
    if (!timeline) return;
    const next = raw.findIndex((r) => r < 1);
    if (next < 0) return;
    const target = endOf(next);
    if (!animate || reduceMotion) {
      setPlaying(false);
      seek(target);
      return;
    }
    if (e < timeline.starts[next]) seek(timeline.starts[next]);
    stopAtRef.current = target;
    setPlaying(true);
  };

  const stepBack = () => {
    if (!timeline) return;
    setPlaying(false);
    stopAtRef.current = null;
    const keep = activeIndex >= 0 ? completed : Math.max(0, completed - 1);
    seek(keep === 0 ? 0 : endOf(keep - 1));
  };

  const scrubTo = (clientX: number, rect: DOMRect) => {
    if (!timeline || n === 0) return;
    const pos = clamp01((clientX - rect.left) / rect.width) * n;
    const i = Math.min(n - 1, Math.floor(pos));
    seek(pos >= n ? total : timeline.starts[i] + (pos - i) * timeline.durs[i]);
  };

  const handleScrubKey = (ev: React.KeyboardEvent) => {
    if (ev.key === 'ArrowRight' || ev.key === 'ArrowUp') stepForward(false);
    else if (ev.key === 'ArrowLeft' || ev.key === 'ArrowDown') stepBack();
    else if (ev.key === 'Home') {
      setPlaying(false);
      seek(0);
    } else if (ev.key === 'End') {
      setPlaying(false);
      seek(total);
    } else return;
    ev.preventDefault();
  };

  const cycleSpeed = () => {
    const idx = SPEEDS.indexOf(speed as (typeof SPEEDS)[number]);
    onSpeedChange(SPEEDS[(idx + 1) % SPEEDS.length]);
  };

  const frameSize = size === 'lg' ? 'max-w-[21rem]' : 'max-w-[16.5rem]';
  const tip = activeIndex >= 0 && data ? pointAt(data.strokes[activeIndex].pts, easeBrush(raw[activeIndex])) : null;
  const ctrl =
    'grid place-items-center shrink-0 w-8 h-8 rounded-lg text-paper-2 hover:text-paper hover:bg-ink-800 disabled:opacity-35 disabled:pointer-events-none transition-colors cursor-pointer';

  return (
    <div className={`w-full ${frameSize} mx-auto flex flex-col gap-3`}>
      {/* Writing frame */}
      <div className="relative w-full aspect-square rounded-xl bg-ink-950 border border-line overflow-hidden">
        <svg
          viewBox="0 0 109 109"
          className="absolute inset-0 w-full h-full"
          role="img"
          aria-label={`Thứ tự nét viết chữ ${character}, ${n || totalStrokes} nét`}
        >
          {/* 米 guide grid */}
          <g className="stroke-ink-700" strokeWidth="0.4" fill="none">
            <line x1="54.5" y1="0" x2="54.5" y2="109" strokeDasharray="1.6 1.6" />
            <line x1="0" y1="54.5" x2="109" y2="54.5" strokeDasharray="1.6 1.6" />
            <line x1="0" y1="0" x2="109" y2="109" strokeDasharray="0.8 2.4" opacity="0.6" />
            <line x1="109" y1="0" x2="0" y2="109" strokeDasharray="0.8 2.4" opacity="0.6" />
          </g>

          {data ? (
            <g fill="none" strokeLinecap="round" strokeLinejoin="round">
              {/* Every stroke, faint, so the target shape is always visible */}
              {data.strokes.map((s, i) => (
                <path key={`g${i}`} d={s.d} className="stroke-ink-700" strokeWidth="3.2" />
              ))}

              {/* Drawn strokes; the active one is in vermilion and settles to ink when lifted */}
              {data.strokes.map((s, i) => {
                const r = raw[i];
                if (r <= 0) return null;
                const p = r >= 1 ? 1 : easeBrush(r);
                return (
                  <path
                    key={`s${i}`}
                    d={s.d}
                    strokeWidth="3.4"
                    strokeDasharray={`${s.len} ${s.len}`}
                    strokeDashoffset={s.len * (1 - p)}
                    className={`transition-[stroke] duration-700 ease-out ${r < 1 ? 'stroke-shu' : 'stroke-paper'}`}
                  />
                );
              })}

              {tip && <circle cx={tip[0]} cy={tip[1]} r="1.15" className="fill-paper" />}

              {showNumbers &&
                data.numbers.map((pos, i) =>
                  pos && raw[i] > 0 ? (
                    <text
                      key={`n${i}`}
                      x={pos.x}
                      y={pos.y}
                      fontSize="7.5"
                      fontWeight="600"
                      strokeWidth="2.4"
                      paintOrder="stroke"
                      strokeLinejoin="round"
                      className={`font-sans stroke-ink-950 select-none transition-[fill] duration-500 ${
                        i === activeIndex ? 'fill-shu' : 'fill-paper-3'
                      }`}
                    >
                      {i + 1}
                    </text>
                  ) : null
                )}
            </g>
          ) : (
            <text
              x="54.5"
              y="56"
              textAnchor="middle"
              dominantBaseline="central"
              fontSize="78"
              lang="ja"
              className={`font-kanji select-none ${error ? 'fill-paper-2' : 'fill-ink-800'}`}
            >
              {character}
            </text>
          )}
        </svg>

        {!data && (
          <div className="absolute inset-x-0 bottom-0 p-3 text-center text-xs text-paper-2" aria-live="polite">
            {error ? (
              missing ? (
                <span>KanjiVG chưa có nét viết cho chữ này · {totalStrokes} nét</span>
              ) : (
                <span className="inline-flex items-center gap-2">
                  Không tải được nét viết.
                  <button
                    type="button"
                    onClick={() => {
                      setResult(null);
                      setAttempt((a) => a + 1);
                    }}
                    className="inline-flex items-center gap-1 font-medium text-shu hover:underline underline-offset-2 cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5" aria-hidden="true" />
                    Thử lại
                  </button>
                </span>
              )
            ) : (
              <span>Đang tải nét viết…</span>
            )}
          </div>
        )}
      </div>

      {/* Stroke timeline: one segment per stroke, drag or use arrow keys to scrub */}
      <div
        role="slider"
        tabIndex={data ? 0 : -1}
        aria-label="Tiến trình nét viết"
        aria-valuemin={0}
        aria-valuemax={n}
        aria-valuenow={completed}
        aria-valuetext={`Nét ${completed} trên ${n}`}
        aria-disabled={!data}
        onKeyDown={handleScrubKey}
        onPointerDown={(ev) => {
          if (!data) return;
          ev.currentTarget.setPointerCapture(ev.pointerId);
          scrubbingRef.current = true;
          setPlaying(false);
          stopAtRef.current = null;
          scrubTo(ev.clientX, ev.currentTarget.getBoundingClientRect());
        }}
        onPointerMove={(ev) => {
          if (scrubbingRef.current) scrubTo(ev.clientX, ev.currentTarget.getBoundingClientRect());
        }}
        onPointerUp={() => {
          scrubbingRef.current = false;
        }}
        onPointerCancel={() => {
          scrubbingRef.current = false;
        }}
        className="group relative h-5 flex items-center gap-[3px] cursor-pointer touch-none rounded-sm focus-visible:outline-offset-4"
      >
        {(data ? data.strokes : Array.from({ length: Math.max(1, totalStrokes) })).map((_, i) => (
          <span key={i} className="relative flex-1 h-1 rounded-full bg-ink-800 overflow-hidden group-hover:h-1.5 transition-[height] duration-150">
            <span
              className={`absolute inset-y-0 left-0 rounded-full ${i === activeIndex ? 'bg-shu' : 'bg-paper-3'}`}
              style={{ width: `${(raw[i] ?? 0) * 100}%` }}
            />
          </span>
        ))}
      </div>

      {/* Transport */}
      <div className="flex items-center justify-between gap-2" role="toolbar" aria-label="Điều khiển nét viết">
        <div className="flex items-center gap-0.5">
          <button type="button" onClick={handleReplay} disabled={!data} aria-label="Viết lại từ nét đầu" title="Viết lại từ đầu" className={ctrl}>
            <RotateCcw className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={stepBack}
            disabled={!data || e <= 0}
            aria-label="Lùi một nét"
            title="Lùi một nét"
            className={ctrl}
          >
            <StepBack className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleTogglePlay}
            disabled={!data}
            aria-label={playing ? 'Tạm dừng' : isDone ? 'Xem lại nét viết' : 'Chạy nét viết'}
            title={playing ? 'Tạm dừng' : isDone ? 'Xem lại' : 'Chạy nét'}
            className="mx-1 shrink-0 grid place-items-center w-10 h-10 rounded-full bg-shu-600 hover:bg-shu-700 text-white disabled:opacity-40 disabled:pointer-events-none transition-colors cursor-pointer"
          >
            {playing ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current translate-x-px" />}
          </button>
          <button
            type="button"
            onClick={() => stepForward(true)}
            disabled={!data || isDone}
            aria-label="Viết nét tiếp theo"
            title="Viết nét tiếp theo"
            className={ctrl}
          >
            <StepForward className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center gap-0.5">
          <span className="text-xs text-paper-3 tabular-nums mr-1 whitespace-nowrap select-none" aria-hidden="true">
            {completed}/{n || totalStrokes} nét
          </span>
          <button
            type="button"
            onClick={cycleSpeed}
            aria-label={`Tốc độ ${speed}×, bấm để đổi`}
            title="Đổi tốc độ"
            className={`${ctrl} w-auto px-2 text-xs font-semibold tabular-nums`}
          >
            {speed}×
          </button>
          <button
            type="button"
            onClick={() => onShowNumbersChange(!showNumbers)}
            aria-pressed={showNumbers}
            aria-label="Hiện số thứ tự nét"
            title={showNumbers ? 'Ẩn số thứ tự nét' : 'Hiện số thứ tự nét'}
            className={`${ctrl} ${showNumbers ? 'text-shu hover:text-shu' : ''}`}
          >
            <Hash className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
