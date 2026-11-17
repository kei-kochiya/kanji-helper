import type { KanjiItem } from '../types/kanji';

const COMBINING_MARKS_RE = /[\u0300-\u036f]/g;
const KATAKANA_RE = /[ァ-ヶ]/g;
const JP_CHAR_RE = /[\u3040-\u30ff\u3400-\u9faf\uf900-\ufaff々]/;
const NON_WORD_RE = /[^\p{L}\p{M}\p{N}]+/gu;
const CLAUSE_SPLIT_RE = /[,;/]+/;

/** Canonicalize Vietnamese tone mark placement on open oa/oe/uy syllables (e.g. hòa ↔ hoà, thủy ↔ thuỷ). */
function canonicalizeTonePlacement(nfcLower: string): string {
  return nfcLower
    .normalize('NFD')
    .replace(/([o])([\u0300\u0301\u0303\u0309\u0323])([ae])(?![\p{L}])/gu, '$1$3$2')
    .replace(/([u])([\u0300\u0301\u0303\u0309\u0323])(y)(?![\p{L}])/gu, '$1$3$2')
    .normalize('NFC');
}

/** Normalize case and fold katakana to hiragana while preserving Vietnamese diacritics. */
export function normalizeToned(text: string): string {
  return canonicalizeTonePlacement(
    text
      .toLowerCase()
      .replace(KATAKANA_RE, (ch) => String.fromCharCode(ch.charCodeAt(0) - 0x60))
      .normalize('NFC')
  );
}

/**
 * Lowercase and strip Vietnamese diacritics so "nhat", "Nhật" and "NHẬT" all match, and fold
 * katakana to hiragana so "がく" finds the On reading ガク. Kanji pass through unchanged.
 */
export function foldText(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(COMBINING_MARKS_RE, '')
    .replace(/đ/g, 'd')
    .replace(KATAKANA_RE, (ch) => String.fromCharCode(ch.charCodeAt(0) - 0x60))
    .normalize('NFC');
}

function cleanWords(text: string): string {
  return text.replace(NON_WORD_RE, ' ').trim();
}

function toWordBag(items: string[]): string {
  const joined = items.map(cleanWords).filter(Boolean).join(' \u0001 ');
  return joined ? ` ${joined} ` : '';
}

function extractClauses(items: string[]): Set<string> {
  const set = new Set<string>();
  for (const item of items) {
    const whole = cleanWords(item);
    if (whole) set.add(whole);
    for (const part of item.split(CLAUSE_SPLIT_RE)) {
      const cleaned = cleanWords(part);
      if (cleaned) set.add(cleaned);
    }
  }
  return set;
}

export interface SearchEntry {
  char: string;
  jpReadings: string[];
  wordJp: string[];

  hvFolded: string[];
  hvFoldedBag: string;
  mViFoldedPrimary: Set<string>;
  mViFoldedSecondary: Set<string>;
  mViFoldedPrimaryBag: string;
  mViFoldedSecondaryBag: string;
  mEnFoldedClauses: Set<string>;
  mEnFoldedBag: string;
  wordFoldedBag: string;

  hvToned: string[];
  hvTonedBag: string;
  mViTonedPrimary: Set<string>;
  mViTonedSecondary: Set<string>;
  mViTonedPrimaryBag: string;
  mViTonedSecondaryBag: string;
  wordTonedBag: string;
}

export interface ParsedQuery {
  folded: string;
  foldedWords: string;
  tonedWords: string;
  hasDiacritics: boolean;
  isJapanese: boolean;
}

/** Precomputed structured search fields per kanji for word-boundary matching and relevance ranking. */
export function buildSearchIndex(list: KanjiItem[]): Map<string, SearchEntry> {
  const index = new Map<string, SearchEntry>();
  for (const k of list) {
    const kunPlain = k.kun.map((r) => r.replace(/[.-]/g, ''));
    const jpReadings = [...k.on, ...k.kun, ...kunPlain].map(foldText);
    const wordJp = k.words.flatMap((w) => [w.w, w.r]).map(foldText);

    const hvFolded = k.hv.map((h) => cleanWords(foldText(h)));
    const mViFolded = k.m_vi.map(foldText);
    const mEnFolded = k.m_en.map(foldText);
    const wordFolded = k.words.flatMap((w) => [w.hv, w.m]).map(foldText);

    const hvToned = k.hv.map((h) => cleanWords(normalizeToned(h)));
    const mViToned = k.m_vi.map(normalizeToned);
    const wordToned = k.words.flatMap((w) => [w.hv, w.m]).map(normalizeToned);

    const mViFoldedFirst = mViFolded.slice(0, 1);
    const mViFoldedRest = mViFolded.slice(1);
    const mViTonedFirst = mViToned.slice(0, 1);
    const mViTonedRest = mViToned.slice(1);

    index.set(k.id, {
      char: k.c,
      jpReadings,
      wordJp,

      hvFolded,
      hvFoldedBag: toWordBag(hvFolded),
      mViFoldedPrimary: extractClauses(mViFoldedFirst),
      mViFoldedSecondary: extractClauses(mViFoldedRest),
      mViFoldedPrimaryBag: toWordBag(mViFoldedFirst),
      mViFoldedSecondaryBag: toWordBag(mViFoldedRest),
      mEnFoldedClauses: extractClauses(mEnFolded),
      mEnFoldedBag: toWordBag(mEnFolded),
      wordFoldedBag: toWordBag(wordFolded),

      hvToned,
      hvTonedBag: toWordBag(hvToned),
      mViTonedPrimary: extractClauses(mViTonedFirst),
      mViTonedSecondary: extractClauses(mViTonedRest),
      mViTonedPrimaryBag: toWordBag(mViTonedFirst),
      mViTonedSecondaryBag: toWordBag(mViTonedRest),
      wordTonedBag: toWordBag(wordToned),
    });
  }
  return index;
}

/** Parse a search input once before scoring against all kanji entries. Returns null when empty. */
export function parseSearchQuery(rawQuery: string): ParsedQuery | null {
  const trimmed = rawQuery.trim();
  if (!trimmed) return null;
  const toned = normalizeToned(trimmed);
  const folded = foldText(trimmed);
  return {
    folded,
    foldedWords: cleanWords(folded),
    tonedWords: cleanWords(toned),
    hasDiacritics: toned !== folded,
    isJapanese: JP_CHAR_RE.test(trimmed),
  };
}

function scoreJapanese(entry: SearchEntry, q: string): number {
  if (entry.char === q) return 2000;

  let best = 0;
  for (const r of entry.jpReadings) {
    if (r === q) best = Math.max(best, 1500);
    else if (r.startsWith(q)) best = Math.max(best, 1000);
    else if (r.includes(q)) best = Math.max(best, 700);
  }
  for (const w of entry.wordJp) {
    if (w === q) best = Math.max(best, 500);
    else if (w.startsWith(q)) best = Math.max(best, 350);
    else if (w.includes(q)) best = Math.max(best, 250);
  }
  return best;
}

/**
 * Score how well a kanji entry matches the parsed query.
 * Returns 0 when it does not match; higher scores indicate stronger, more direct matches.
 */
export function scoreSearchMatch(entry: SearchEntry, query: ParsedQuery): number {
  if (query.isJapanese) return scoreJapanese(entry, query.folded);

  const useToned = query.hasDiacritics;
  const qWords = useToned ? query.tonedWords : query.foldedWords;
  if (!qWords) return 0;

  const exactWord = ` ${qWords} `;
  const prefixWord = ` ${qWords}`;

  const hv = useToned ? entry.hvToned : entry.hvFolded;
  const hvBag = useToned ? entry.hvTonedBag : entry.hvFoldedBag;
  const mViPrimary = useToned ? entry.mViTonedPrimary : entry.mViFoldedPrimary;
  const mViSecondary = useToned ? entry.mViTonedSecondary : entry.mViFoldedSecondary;
  const mViPrimaryBag = useToned ? entry.mViTonedPrimaryBag : entry.mViFoldedPrimaryBag;
  const mViSecondaryBag = useToned ? entry.mViTonedSecondaryBag : entry.mViFoldedSecondaryBag;
  const wordBag = useToned ? entry.wordTonedBag : entry.wordFoldedBag;

  let score = 0;
  if (hv[0] === qWords) score = 2000;
  else if (hv.includes(qWords)) score = 1700;
  else if (mViPrimary.has(qWords)) score = 1400;
  else if (mViSecondary.has(qWords)) score = 1200;
  else if (!useToned && entry.mEnFoldedClauses.has(qWords)) score = 1100;
  else if (mViPrimaryBag.includes(exactWord)) score = 950;
  else if (mViSecondaryBag.includes(exactWord)) score = 900;
  else if (!useToned && entry.mEnFoldedBag.includes(exactWord)) score = 800;
  else if (wordBag.includes(exactWord)) score = 400;
  else if (hvBag.includes(prefixWord)) score = 200;
  else if (
    mViPrimaryBag.includes(prefixWord) ||
    mViSecondaryBag.includes(prefixWord) ||
    (!useToned && entry.mEnFoldedBag.includes(prefixWord))
  ) {
    score = 100;
  }

  return score;
}
