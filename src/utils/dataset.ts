import type { KanjiItem, RawKanjiItem } from '../types/kanji';

/** Hydrates derived `id` and 5-digit hex `code` omitted from kanji_data.json to keep the payload lean. */
export function hydrateKanjiData(raw: RawKanjiItem[]): KanjiItem[] {
  return raw.map((k) => ({
    ...k,
    id: k.id ?? k.c,
    code: k.code ?? k.c.codePointAt(0)!.toString(16).padStart(5, '0'),
  }));
}
