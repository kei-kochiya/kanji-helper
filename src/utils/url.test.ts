import { describe, expect, it } from 'vitest';
import type { AppLocation } from './url';
import { locationToUrl, readLocation } from './url';

const roundTrip = (loc: AppLocation) => {
  const url = new URL(locationToUrl(loc), 'https://example.test');
  return readLocation({ pathname: url.pathname, search: url.search });
};

describe('URL state', () => {
  it('round-trips every mode and kanji', () => {
    const cases: AppLocation[] = [
      { mode: 'grid', kanjiId: null },
      { mode: 'grid', kanjiId: '学' },
      { mode: 'flashcard', kanjiId: '日' },
      { mode: 'strokes', kanjiId: '鬱' },
      { mode: 'quiz', kanjiId: null },
    ];
    for (const loc of cases) expect(roundTrip(loc)).toEqual(loc);
  });

  it('uses readable Vietnamese paths', () => {
    expect(locationToUrl({ mode: 'flashcard', kanjiId: null })).toBe('/the-nho');
    expect(locationToUrl({ mode: 'strokes', kanjiId: null })).toBe('/luyen-viet');
    expect(locationToUrl({ mode: 'grid', kanjiId: null })).toBe('/');
  });

  it('never puts a kanji on the quiz URL', () => {
    expect(locationToUrl({ mode: 'quiz', kanjiId: '学' })).toBe('/trac-nghiem');
    expect(readLocation({ pathname: '/trac-nghiem', search: '?chu=学' })).toEqual({ mode: 'quiz', kanjiId: null });
  });

  it('falls back to the library for unknown paths and tolerates a trailing slash', () => {
    expect(readLocation({ pathname: '/khong-ton-tai', search: '' }).mode).toBe('grid');
    expect(readLocation({ pathname: '/the-nho/', search: '' }).mode).toBe('flashcard');
  });
});
