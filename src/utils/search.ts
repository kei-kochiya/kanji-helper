import type { KanjiItem } from '../types/kanji';

/**
 * Lowercase and strip Vietnamese diacritics so "nhat", "Nhật" and "NHẬT" all match, and fold
 * katakana to hiragana so "がく" finds the On reading ガク. Kanji pass through unchanged.
 */
export function foldText(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[ァ-ヶ]/g, (ch) => String.fromCharCode(ch.charCodeAt(0) - 0x60))
    .normalize('NFC');
}

/** One folded string per kanji covering every searchable field. */
export function buildSearchIndex(list: KanjiItem[]): Map<string, string> {
  const index = new Map<string, string>();
  for (const k of list) {
    // Kun readings are indexed both as written ("よ.む") and without okurigana marks ("よむ")
    const kunPlain = k.kun.map((r) => r.replace(/[.-]/g, ''));
    const blob = [k.c, ...k.hv, ...k.m_vi, ...k.m_en, ...k.on, ...k.kun, ...kunPlain].join('\u0001');
    index.set(k.id, foldText(blob));
  }
  return index;
}
