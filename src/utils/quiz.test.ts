import { describe, expect, it } from 'vitest';
import kanjiData from '../data/kanji_data.json';
import type { KanjiItem } from '../types/kanji';
import { ALL_QUIZ_TYPES, bareReading, buildQuizDeck, supportsType } from './quiz';
import type { Question } from './quiz';

const data = kanjiData as KanjiItem[];
const byChar = new Map(data.map((k) => [k.c, k]));
const ALL_TYPES = ALL_QUIZ_TYPES.map((t) => t.id);
const N5 = data.filter((k) => k.lvl === 'N5');

// Questions are random, so check many decks across the dataset
const decks: Question[][] = Array.from({ length: 40 }, (_, i) => buildQuizDeck(i % 2 ? N5 : data, ALL_TYPES, 50));
const questions = decks.flat();

describe('buildQuizDeck', () => {
  it('returns the requested number of questions, capped by the pool', () => {
    expect(buildQuizDeck(N5, ALL_TYPES, 10)).toHaveLength(10);
    expect(buildQuizDeck(N5.slice(0, 6), ALL_TYPES, 50)).toHaveLength(6);
  });

  it('needs at least four kanji and one question type', () => {
    expect(buildQuizDeck(N5.slice(0, 3), ALL_TYPES, 10)).toEqual([]);
    expect(buildQuizDeck(N5, [], 10)).toEqual([]);
  });

  it('never repeats a target kanji within a session', () => {
    for (const deck of decks) {
      const targets = deck.map((q) => q.targetKanji.id);
      expect(new Set(targets).size).toBe(targets.length);
    }
  });

  it('only uses question types the target supports', () => {
    for (const q of questions) expect(supportsType(q.targetKanji, q.type)).toBe(true);
  });

  it('gives four distinct options with exactly one correct answer', () => {
    for (const q of questions) {
      expect(q.options).toHaveLength(4);
      expect(q.options.filter((o) => o.isCorrect)).toHaveLength(1);
      expect(new Set(q.options.map((o) => o.primaryText)).size).toBe(4);
    }
  });
});

describe('reading → kanji questions', () => {
  const field = { 'kunyomi-to-kanji': 'kun', 'onyomi-to-kanji': 'on', 'hanviet-to-kanji': 'hv' } as const;

  it('never offers a distractor kanji that also has the prompted reading', () => {
    const relevant = questions.filter((q) => q.type in field);
    expect(relevant.length).toBeGreaterThan(50);
    for (const q of relevant) {
      const f = field[q.type as keyof typeof field];
      for (const o of q.options.filter((opt) => !opt.isCorrect)) {
        const k = byChar.get(o.primaryText)!;
        expect(k[f].map(bareReading)).not.toContain(bareReading(q.promptMain));
      }
    }
  });
});

describe('kanji → reading questions', () => {
  const relevant = questions.filter((q) => q.type === 'kanji-to-kunyomi' || q.type === 'kanji-to-onyomi');

  it('never offers another spelling of one of the target’s own readings', () => {
    expect(relevant.length).toBeGreaterThan(50);
    for (const q of relevant) {
      const own = (q.type === 'kanji-to-kunyomi' ? q.targetKanji.kun : q.targetKanji.on).map(bareReading);
      for (const o of q.options.filter((opt) => !opt.isCorrect)) expect(own).not.toContain(bareReading(o.primaryText));
    }
  });

  it('keeps distractors distinct once okurigana marks are removed', () => {
    for (const q of relevant) expect(new Set(q.options.map((o) => bareReading(o.primaryText))).size).toBe(4);
  });

  it('matches the okurigana shape of the correct answer so the dot gives nothing away', () => {
    const shape = (r: string) => `${r.includes('.')}${r.startsWith('-')}${r.endsWith('-')}`;
    const kun = relevant.filter((q) => q.type === 'kanji-to-kunyomi');
    const matching = kun.filter((q) => {
      const correct = q.options.find((o) => o.isCorrect)!.primaryText;
      return q.options.every((o) => shape(o.primaryText) === shape(correct));
    });
    // The full pool always has enough readings of every common shape
    expect(matching.length / kun.length).toBeGreaterThan(0.95);
  });
});

describe('bareReading', () => {
  it('drops okurigana dots and affix dashes', () => {
    expect(bareReading('よ.む')).toBe('よむ');
    expect(bareReading('-び')).toBe('び');
    expect(bareReading('お-')).toBe('お');
  });
});
