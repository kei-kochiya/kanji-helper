import { lazy } from 'react';
import type { KanjiItem } from './types/kanji';

/**
 * App code and the kanji dataset are separate chunks: the shell paints at once, both load in
 * parallel, and a data update does not invalidate the cached app code (or the other way round).
 */
export const LazyApp = lazy(async () => {
  const [{ App }, data] = await Promise.all([import('./App'), import('./data/kanji_data.json')]);
  const kanjiData = data.default as KanjiItem[];
  return { default: () => <App kanjiData={kanjiData} /> };
});
