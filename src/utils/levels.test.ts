import { describe, expect, it } from 'vitest';
import type { JLPTLevel } from '../types/kanji';
import { summarizeLevels } from './levels';

const s = (...levels: JLPTLevel[]) => summarizeLevels(new Set(levels));

describe('summarizeLevels', () => {
  it('collapses three or more neighbouring levels into a range', () => {
    expect(s('N5', 'N4', 'N3', 'N2', 'N1')).toBe('N5–N1');
    expect(s('N3', 'N4', 'N5')).toBe('N5–N3');
  });

  it('lists short or broken selections', () => {
    expect(s('N5')).toBe('N5');
    expect(s('N5', 'N4')).toBe('N5, N4');
    expect(s('N5', 'N3', 'N1')).toBe('N5, N3, N1');
  });
});
