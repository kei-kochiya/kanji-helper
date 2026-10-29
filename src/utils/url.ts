import type { ViewMode } from '../types/kanji';

/**
 * Where the visitor is, kept in the address bar so Back and reload behave:
 *   /              Thư viện      (?chu=学 → that kanji's dialog is open)
 *   /the-nho       Thẻ nhớ       (?chu=学 → current card)
 *   /trac-nghiem   Trắc nghiệm
 *   /luyen-viet    Luyện viết    (?chu=学 → current kanji)
 */
export interface AppLocation {
  mode: ViewMode;
  kanjiId: string | null;
}

const SLUGS: Record<ViewMode, string> = { grid: '', flashcard: 'the-nho', quiz: 'trac-nghiem', strokes: 'luyen-viet' };
const BASE = import.meta.env.BASE_URL;

/** history.state marker for an entry pushed by opening the detail dialog. */
export const DIALOG_STATE = 'kh-dialog';

export function locationToUrl({ mode, kanjiId }: AppLocation): string {
  const query = kanjiId && mode !== 'quiz' ? `?${new URLSearchParams({ chu: kanjiId })}` : '';
  return `${BASE}${SLUGS[mode]}${query}`;
}

export function readLocation(loc: Pick<Location, 'pathname' | 'search'> = window.location): AppLocation {
  const slug = loc.pathname.startsWith(BASE) ? loc.pathname.slice(BASE.length).replace(/\/+$/, '') : '';
  const mode = (Object.keys(SLUGS) as ViewMode[]).find((m) => SLUGS[m] === decodeURIComponent(slug)) ?? 'grid';
  const kanjiId = new URLSearchParams(loc.search).get('chu');
  return { mode, kanjiId: kanjiId && mode !== 'quiz' ? kanjiId : null };
}

export function pushLocation(next: AppLocation, state: string | null = null): void {
  window.history.pushState(state, '', locationToUrl(next));
}

export function replaceLocation(next: AppLocation): void {
  // Keep the entry's own marker (e.g. the dialog entry) when only the kanji changes
  window.history.replaceState(window.history.state, '', locationToUrl(next));
}
