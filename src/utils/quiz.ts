import type { KanjiItem } from '../types/kanji';
import { shuffled } from './random';

export type QuizQuestionType =
  | 'kanji-to-meaning'
  | 'hanviet-to-kanji'
  | 'kunyomi-to-kanji'
  | 'onyomi-to-kanji'
  | 'kanji-to-kunyomi'
  | 'kanji-to-onyomi';

export interface QuizTypeConfig {
  id: QuizQuestionType;
  title: string;
  description: string;
  example: string;
}

export const ALL_QUIZ_TYPES: QuizTypeConfig[] = [
  {
    id: 'kanji-to-meaning',
    title: 'Kanji → Hán Việt & Nghĩa',
    description: 'Nhìn chữ Hán, đoán âm Hán Việt và nghĩa tiếng Việt',
    example: '日 → NHẬT (Mặt trời, ngày)',
  },
  {
    id: 'hanviet-to-kanji',
    title: 'Hán Việt → Kanji',
    description: 'Cho âm Hán Việt, chọn chữ Hán duy nhất có âm này',
    example: 'HỌC → 学',
  },
  {
    id: 'kunyomi-to-kanji',
    title: 'Kunyomi → Kanji',
    description: 'Cho âm Kunyomi tiếng Nhật, chọn chữ Hán duy nhất phù hợp',
    example: 'よ.む → 読',
  },
  {
    id: 'onyomi-to-kanji',
    title: 'Onyomi → Kanji',
    description: 'Cho âm Onyomi Katakana, chọn chữ Hán duy nhất phù hợp',
    example: 'ガク → 学',
  },
  {
    id: 'kanji-to-kunyomi',
    title: 'Kanji → Kunyomi',
    description: 'Nhìn chữ Hán, chọn âm đọc thuần Nhật Kunyomi chuẩn',
    example: '読 → よ.む',
  },
  {
    id: 'kanji-to-onyomi',
    title: 'Kanji → Onyomi',
    description: 'Nhìn chữ Hán, chọn âm Hán Nhật Onyomi Katakana chuẩn',
    example: '学 → ガク',
  },
];

export interface QuizOption {
  id: string;
  primaryText: string;
  secondaryText?: string;
  isCorrect: boolean;
}

export interface Question {
  id: string;
  type: QuizQuestionType;
  promptCategory: string;
  promptQuestion: string;
  promptMain: string;
  promptSub?: string;
  promptAudio?: string;
  targetKanji: KanjiItem;
  options: QuizOption[];
}

/** Which script a text is written in, so it gets the right face and `lang`. */
export type TextKind = 'kanji' | 'kana' | 'vi';

export function promptKind(type: QuizQuestionType): TextKind {
  if (type === 'hanviet-to-kanji') return 'vi';
  if (type === 'kunyomi-to-kanji' || type === 'onyomi-to-kanji') return 'kana';
  return 'kanji';
}

export function optionKind(type: QuizQuestionType): TextKind {
  if (type === 'kanji-to-meaning') return 'vi';
  if (type === 'kanji-to-kunyomi' || type === 'kanji-to-onyomi') return 'kana';
  return 'kanji';
}

/** Reading without okurigana dots and affix dashes: "よ.む" → "よむ", "-び" → "び". */
export function bareReading(reading: string): string {
  return reading.replace(/[.\-–]/g, '');
}

/** Okurigana and affix marks visibly shape a reading; distractors should share them so they don't give the answer away. */
function readingShape(reading: string): string {
  return `${reading.includes('.') ? 'o' : ''}${reading.startsWith('-') ? 'p' : ''}${reading.endsWith('-') ? 's' : ''}`;
}

const pick = <T>(items: readonly T[]): T => items[Math.floor(Math.random() * items.length)];

type ReadingField = 'kun' | 'on' | 'hv';

const READING_PROMPTS: Record<'kunyomi-to-kanji' | 'onyomi-to-kanji' | 'hanviet-to-kanji', { field: ReadingField; category: string; question: string }> = {
  'kunyomi-to-kanji': { field: 'kun', category: 'Kunyomi → Kanji', question: 'Chọn chữ Kanji duy nhất có âm đọc Kunyomi:' },
  'onyomi-to-kanji': { field: 'on', category: 'Onyomi → Kanji', question: 'Chọn chữ Kanji duy nhất có âm đọc Onyomi:' },
  'hanviet-to-kanji': { field: 'hv', category: 'Hán Việt → Kanji', question: 'Chọn chữ Kanji tương ứng với âm Hán Việt:' },
};

const KANJI_PROMPTS: Record<'kanji-to-kunyomi' | 'kanji-to-onyomi', { field: 'kun' | 'on'; category: string; question: string }> = {
  'kanji-to-kunyomi': { field: 'kun', category: 'Kanji → Kunyomi', question: 'Chọn âm đọc Kunyomi tiếng Nhật cho chữ Hán:' },
  'kanji-to-onyomi': { field: 'on', category: 'Kanji → Onyomi', question: 'Chọn âm đọc Onyomi Katakana cho chữ Hán:' },
};

export function supportsType(target: KanjiItem, type: QuizQuestionType): boolean {
  if (type === 'kunyomi-to-kanji' || type === 'kanji-to-kunyomi') return target.kun.length > 0;
  if (type === 'onyomi-to-kanji' || type === 'kanji-to-onyomi') return target.on.length > 0;
  if (type === 'hanviet-to-kanji') return target.hv.length > 0;
  return true;
}

/** Reading → kanji: three distractor kanji that do not share the prompted reading (compared without marks). */
function readingToKanji(target: KanjiItem, type: keyof typeof READING_PROMPTS, pool: KanjiItem[]): Question | null {
  const { field, category, question } = READING_PROMPTS[type];
  const reading = pick(target[field]);
  const bare = bareReading(reading);
  const distractors = shuffled(pool.filter((k) => k.id !== target.id && !k[field].some((r) => bareReading(r) === bare))).slice(0, 3);
  if (distractors.length < 3) return null;

  const secondary = (k: KanjiItem) => (field === 'hv' ? `${k.st} nét · Bộ ${k.rad}` : k.hv.slice(0, 2).join(' · '));
  return {
    id: `${target.id}-${type}`,
    type,
    promptCategory: category,
    promptQuestion: question,
    promptMain: reading,
    promptSub: field === 'hv' ? `Nghĩa: ${target.m_vi.slice(0, 2).join(', ')}` : `Cấp độ ${target.lvl} · Hán Việt: ${target.hv[0] ?? ''}`,
    promptAudio: field === 'hv' ? target.c : reading,
    targetKanji: target,
    options: shuffled([target, ...distractors].map((k) => ({ id: k.id, primaryText: k.c, secondaryText: secondary(k), isCorrect: k.id === target.id }))),
  };
}

/** Kanji → reading: three readings from the pool that are not the target's under any spelling, matching its okurigana shape when possible. */
function kanjiToReading(target: KanjiItem, type: keyof typeof KANJI_PROMPTS, poolReadings: string[]): Question | null {
  const { field, category, question } = KANJI_PROMPTS[type];
  const correct = pick(target[field]);
  const ownBare = new Set(target[field].map(bareReading));
  const seen = new Set<string>();
  const candidates = shuffled(poolReadings).filter((r) => {
    const bare = bareReading(r);
    if (ownBare.has(bare) || seen.has(bare)) return false;
    seen.add(bare);
    return true;
  });
  const shape = readingShape(correct);
  const sameShape = candidates.filter((r) => readingShape(r) === shape);
  const distractors = [...sameShape, ...candidates.filter((r) => readingShape(r) !== shape)].slice(0, 3);
  if (distractors.length < 3) return null;

  return {
    id: `${target.id}-${type}`,
    type,
    promptCategory: category,
    promptQuestion: question,
    promptMain: target.c,
    promptSub: `Hán Việt: ${target.hv.join(' · ')} (${target.m_vi.slice(0, 2).join(', ')})`,
    promptAudio: target.c,
    targetKanji: target,
    options: shuffled([
      { id: `correct-${correct}`, primaryText: correct, isCorrect: true },
      ...distractors.map((r) => ({ id: `distractor-${r}`, primaryText: r, isCorrect: false })),
    ]),
  };
}

function kanjiToMeaning(target: KanjiItem, pool: KanjiItem[]): Question | null {
  // Several kanji share a Hán Việt reading; each option's reading must appear only once
  const seen = new Set([target.hv.join(' · ')]);
  const distractors: KanjiItem[] = [];
  for (const k of shuffled(pool)) {
    if (distractors.length === 3) break;
    const hv = k.hv.join(' · ');
    if (k.id === target.id || seen.has(hv)) continue;
    seen.add(hv);
    distractors.push(k);
  }
  if (distractors.length < 3) return null;
  return {
    id: `${target.id}-kanji-to-meaning`,
    type: 'kanji-to-meaning',
    promptCategory: 'Kanji → Hán Việt & Nghĩa',
    promptQuestion: 'Chọn âm Hán Việt & nghĩa đúng cho chữ Kanji:',
    promptMain: target.c,
    promptSub: `${target.lvl} · ${target.st} nét · Bộ ${target.rad}`,
    promptAudio: target.c,
    targetKanji: target,
    options: shuffled(
      [target, ...distractors].map((k) => ({
        id: k.id,
        primaryText: k.hv.join(' · '),
        secondaryText: k.m_vi.join(', '),
        isCorrect: k.id === target.id,
      }))
    ),
  };
}

export function createQuestion(target: KanjiItem, type: QuizQuestionType, pool: KanjiItem[], poolReadings: { on: string[]; kun: string[] }): Question | null {
  if (!supportsType(target, type)) return null;
  switch (type) {
    case 'kunyomi-to-kanji':
    case 'onyomi-to-kanji':
    case 'hanviet-to-kanji':
      return readingToKanji(target, type, pool);
    case 'kanji-to-kunyomi':
      return kanjiToReading(target, type, poolReadings.kun);
    case 'kanji-to-onyomi':
      return kanjiToReading(target, type, poolReadings.on);
    default:
      return kanjiToMeaning(target, pool);
  }
}

/** A whole session up front: distinct target kanji, question types rotated across the deck. */
export function buildQuizDeck(pool: KanjiItem[], types: QuizQuestionType[], limit: number): Question[] {
  if (pool.length < 4 || types.length === 0) return [];
  const targetCount = Math.min(limit, pool.length);
  const poolReadings = {
    on: Array.from(new Set(pool.flatMap((k) => k.on))),
    kun: Array.from(new Set(pool.flatMap((k) => k.kun))),
  };

  const deck: Question[] = [];
  for (const target of shuffled(pool)) {
    if (deck.length >= targetCount) break;
    const eligible = types.filter((t) => supportsType(target, t));
    if (eligible.length === 0) continue;
    const question = createQuestion(target, eligible[deck.length % eligible.length], pool, poolReadings);
    if (question) deck.push(question);
  }
  return deck;
}
