import type { FilterPrefs, JLPTLevel, SortOption, StatusFilter, UserProgress } from '../types/kanji';

const STORAGE_KEY = 'kanji_master_progress_v1';

const EMPTY: UserProgress = { starred: [], mastered: [] };

/**
 * Keep only known kanji IDs, once each. Anything else in a saved or imported file
 * (older dataset entries, hand-edited junk) is dropped and counted.
 */
export function sanitizeProgress(raw: unknown, validIds: ReadonlySet<string>): { progress: UserProgress; ignored: number } | null {
  if (!raw || typeof raw !== 'object') return null;
  const { starred, mastered } = raw as Record<string, unknown>;
  if (!Array.isArray(starred) || !Array.isArray(mastered)) return null;

  let ignored = 0;
  const clean = (list: unknown[]) => {
    const out = new Set<string>();
    for (const id of list) {
      if (typeof id === 'string' && validIds.has(id)) out.add(id);
      else ignored++;
    }
    return [...out];
  };
  return { progress: { starred: clean(starred), mastered: clean(mastered) }, ignored };
}

export function loadUserProgress(validIds: ReadonlySet<string>): UserProgress {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return sanitizeProgress(JSON.parse(raw), validIds)?.progress ?? EMPTY;
  } catch (e) {
    console.error('Failed to parse user progress from localStorage', e);
  }
  return EMPTY;
}

export function saveUserProgress(progress: UserProgress): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  } catch (e) {
    console.error('Failed to save user progress', e);
  }
}

export function exportProgressJSON(progress: UserProgress): void {
  const blob = new Blob([JSON.stringify(progress, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `kanji_progress_${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

export async function importProgressJSON(file: File, validIds: ReadonlySet<string>): Promise<{ progress: UserProgress; ignored: number }> {
  const result = sanitizeProgress(JSON.parse(await file.text()), validIds);
  if (!result) throw new Error('Định dạng tệp không hợp lệ');
  return result;
}

const FILTERS_KEY = 'kh.filters';
const LEVELS: JLPTLevel[] = ['N5', 'N4', 'N3', 'N2', 'N1'];
const STATUSES: StatusFilter[] = ['all', 'starred', 'unmastered', 'mastered'];
const SORTS: SortOption[] = ['default', 'strokes_asc', 'strokes_desc', 'random'];

export function loadFilterPrefs(): FilterPrefs {
  const fallback: FilterPrefs = { levels: LEVELS, status: 'all', sort: 'default' };
  try {
    const raw = JSON.parse(localStorage.getItem(FILTERS_KEY) ?? 'null') as Partial<FilterPrefs> | null;
    if (!raw) return fallback;
    const levels = Array.isArray(raw.levels) ? LEVELS.filter((l) => raw.levels!.includes(l)) : [];
    return {
      levels: levels.length > 0 ? levels : LEVELS,
      status: STATUSES.includes(raw.status as StatusFilter) ? (raw.status as StatusFilter) : 'all',
      sort: SORTS.includes(raw.sort as SortOption) ? (raw.sort as SortOption) : 'default',
    };
  } catch {
    return fallback;
  }
}

export function saveFilterPrefs(prefs: FilterPrefs): void {
  try {
    localStorage.setItem(FILTERS_KEY, JSON.stringify(prefs));
  } catch {
    /* storage unavailable: filters simply reset next visit */
  }
}
