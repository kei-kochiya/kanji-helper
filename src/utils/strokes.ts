import { useEffect, useState } from 'react';

/** One stroke from KanjiVG, measured so the brush can travel its real length. */
export interface StrokeGeometry {
  d: string;
  len: number;
  /** Points sampled along the path, flattened as [x0, y0, x1, y1, …]. */
  pts: number[];
}

export interface StrokeData {
  strokes: StrokeGeometry[];
  /** Stroke-number label positions (KanjiVG units, 109 box). */
  numbers: ({ x: number; y: number } | undefined)[];
}

/** Shape of public/strokes/<code>.json, written by build_strokes.py. */
export interface StrokeFile {
  s: string[];
  n: ([number, number] | null)[];
}

export class StrokeLoadError extends Error {
  readonly missing: boolean;
  constructor(missing: boolean) {
    super(missing ? 'No stroke data for this character' : 'Failed to load stroke data');
    this.missing = missing;
  }
}

const SVG_NS = 'http://www.w3.org/2000/svg';
const cache = new Map<string, Promise<StrokeData>>();

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

/** Stroke data ships with the site (public/strokes), so it works without a CDN. */
export function loadStrokes(code: string): Promise<StrokeData> {
  let pending = cache.get(code);
  if (!pending) {
    pending = fetch(`${import.meta.env.BASE_URL}strokes/${code}.json`)
      .then(async (res) => {
        if (!res.ok) throw new StrokeLoadError(res.status === 404);
        let file: StrokeFile;
        try {
          file = (await res.json()) as StrokeFile;
        } catch {
          // A host-level SPA fallback answers unknown paths with index.html
          throw new StrokeLoadError(true);
        }
        if (!Array.isArray(file.s) || file.s.length === 0) throw new StrokeLoadError(true);
        return {
          strokes: measure(file.s),
          numbers: file.s.map((_, i) => (file.n?.[i] ? { x: file.n[i]![0], y: file.n[i]![1] } : undefined)),
        };
      });
    // Network failures may be transient: drop them so "Thử lại" refetches
    pending.catch((err) => {
      if (!(err instanceof StrokeLoadError && err.missing)) cache.delete(code);
    });
    cache.set(code, pending);
  }
  return pending;
}

export function pointAt(pts: number[], t: number): [number, number] {
  const count = pts.length / 2;
  const pos = Math.min(1, Math.max(0, t)) * (count - 1);
  const i = Math.min(count - 2, Math.floor(pos));
  const f = pos - i;
  return [pts[i * 2] + (pts[i * 2 + 2] - pts[i * 2]) * f, pts[i * 2 + 1] + (pts[i * 2 + 3] - pts[i * 2 + 1]) * f];
}

export type StrokeFeedback =
  | { ok: true }
  | { ok: false; reason: 'too-short' | 'reversed' | 'wrong-position' };

/**
 * Compares a user-drawn stroke (normalized 0–1 coordinates) against the expected KanjiVG
 * stroke's sampled points (0–109 coordinate space).
 */
export function evaluateStroke(
  userPts: readonly { x: number; y: number }[],
  targetPts: readonly number[],
  boxSize: number = 109
): StrokeFeedback {
  if (userPts.length < 2 || targetPts.length < 4) return { ok: false, reason: 'too-short' };

  const scaled = userPts.map((p) => ({ x: p.x * boxSize, y: p.y * boxSize }));
  let userLen = 0;
  for (let i = 1; i < scaled.length; i++) {
    userLen += Math.hypot(scaled[i].x - scaled[i - 1].x, scaled[i].y - scaled[i - 1].y);
  }

  let targetLen = 0;
  for (let i = 2; i < targetPts.length; i += 2) {
    targetLen += Math.hypot(targetPts[i] - targetPts[i - 2], targetPts[i + 1] - targetPts[i - 1]);
  }

  if (userLen < Math.min(5.5, targetLen * 0.25)) return { ok: false, reason: 'too-short' };

  const uStart = scaled[0];
  const uEnd = scaled[scaled.length - 1];
  const tStart = { x: targetPts[0], y: targetPts[1] };
  const tEnd = { x: targetPts[targetPts.length - 2], y: targetPts[targetPts.length - 1] };

  const startDist = Math.hypot(uStart.x - tStart.x, uStart.y - tStart.y);
  const endDist = Math.hypot(uEnd.x - tEnd.x, uEnd.y - tEnd.y);
  const revStartDist = Math.hypot(uStart.x - tEnd.x, uStart.y - tEnd.y);
  const revEndDist = Math.hypot(uEnd.x - tStart.x, uEnd.y - tStart.y);

  // Detect reversed stroke direction
  if (revStartDist + revEndDist + 8 < startDist + endDist && revStartDist < 26 && revEndDist < 26) {
    return { ok: false, reason: 'reversed' };
  }

  if (startDist > 28 || endDist > 30) {
    return { ok: false, reason: 'wrong-position' };
  }

  // Sample 9 points along both paths to verify overall trajectory
  const samples = 9;
  let totalDev = 0;
  for (let s = 0; s < samples; s++) {
    const t = s / (samples - 1);
    const idx = Math.min(scaled.length - 1, Math.floor(t * (scaled.length - 1)));
    const up = scaled[idx];
    const [tx, ty] = pointAt(targetPts as number[], t);
    totalDev += Math.hypot(up.x - tx, up.y - ty);
  }
  const meanDev = totalDev / samples;
  if (meanDev > 24 || userLen < targetLen * 0.32 || userLen > targetLen * 2.6) {
    return { ok: false, reason: 'wrong-position' };
  }

  return { ok: true };
}

type LoadResult = { code: string; data: StrokeData } | { code: string; error: Error };

/** Load stroke data for a character; `retry` refetches after a network failure. */
export function useStrokes(code: string) {
  const [result, setResult] = useState<LoadResult | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let alive = true;
    loadStrokes(code).then(
      (data) => alive && setResult({ code, data }),
      (error: Error) => alive && setResult({ code, error })
    );
    return () => {
      alive = false;
    };
  }, [code, attempt]);

  // Ignore a result that belongs to the previous character
  const current = result?.code === code ? result : null;
  const error = current && 'error' in current ? current.error : null;
  return {
    data: current && 'data' in current ? current.data : null,
    error,
    missing: error instanceof StrokeLoadError && error.missing,
    retry: () => {
      setResult(null);
      setAttempt((a) => a + 1);
    },
  };
}
