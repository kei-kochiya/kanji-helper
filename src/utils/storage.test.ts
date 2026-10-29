import { describe, expect, it } from 'vitest';
import { sanitizeProgress } from './storage';

const valid = new Set(['日', '学', '人']);

describe('sanitizeProgress', () => {
  it('keeps known IDs once each and counts entries that are not in the dataset', () => {
    const result = sanitizeProgress({ starred: ['日', '日', '貓', 42], mastered: ['学', null, '人'] }, valid);
    // Duplicates are merged silently; '貓', 42 and null are reported as skipped
    expect(result).toEqual({ progress: { starred: ['日'], mastered: ['学', '人'] }, ignored: 3 });
  });

  it('ignores extra fields from older exports', () => {
    expect(sanitizeProgress({ starred: [], mastered: ['日'], quizHighScore: 9 }, valid)?.progress).toEqual({ starred: [], mastered: ['日'] });
  });

  it('rejects files that are not progress exports', () => {
    expect(sanitizeProgress(null, valid)).toBeNull();
    expect(sanitizeProgress('hello', valid)).toBeNull();
    expect(sanitizeProgress({ starred: '日' , mastered: [] }, valid)).toBeNull();
    expect(sanitizeProgress({ starred: [] }, valid)).toBeNull();
  });
});
