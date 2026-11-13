import { lazy } from 'react';
import type { RawKanjiItem } from './types/kanji';
import { hydrateKanjiData } from './utils/dataset';

/**
 * Start fetching both the app code and dataset immediately when this module loads
 * (instead of waiting for React.lazy mount) so there is no waterfall.
 */
const appPromise = Promise.all([import('./App'), import('./data/kanji_data.json')]);

export const LazyApp = lazy(async () => {
  const [{ App }, data] = await appPromise;
  const kanjiData = hydrateKanjiData(data.default as RawKanjiItem[]);
  function LoadedApp() {
    return <App kanjiData={kanjiData} />;
  }
  return { default: LoadedApp };
});
