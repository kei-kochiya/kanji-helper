import { describe, expect, it } from 'vitest';
import kanjiData from '../data/kanji_data.json';
import type { RawKanjiItem } from '../types/kanji';
import { hydrateKanjiData } from './dataset';
import { buildSearchIndex, foldText, parseSearchQuery, scoreSearchMatch } from './search';

const data = hydrateKanjiData(kanjiData as RawKanjiItem[]);
const index = buildSearchIndex(data);
const search = (q: string) => {
  const parsed = parseSearchQuery(q);
  if (!parsed) return data.map((k) => k.c);
  return data
    .map((k) => ({ c: k.c, score: scoreSearchMatch(index.get(k.id)!, parsed) }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((item) => item.c);
};

describe('foldText', () => {
  it('strips Vietnamese diacritics and case', () => {
    expect(foldText('NHẬT')).toBe('nhat');
    expect(foldText('Học')).toBe('hoc');
    expect(foldText('ĐẠI')).toBe('dai');
    expect(foldText('đường')).toBe('duong');
  });

  it('folds katakana to hiragana and keeps voicing marks', () => {
    expect(foldText('ガク')).toBe('がく');
    expect(foldText('ジツ')).toBe('じつ');
    expect(foldText('パン')).toBe('ぱん');
  });

  it('leaves kanji untouched', () => {
    expect(foldText('学校')).toBe('学校');
  });
});

describe('search index & ranking', () => {
  it('ranks exact Hán Việt first and avoids mid-word false positives like thành matching hành', () => {
    const hanhToned = search('Hành');
    expect(hanhToned[0]).toBe('行');
    expect(hanhToned.slice(0, 4)).toEqual(['行', '桁', '衡', '茎']);
    expect(hanhToned).not.toContain('長');
    expect(hanhToned).not.toContain('幸');

    const hanhPlain = search('hanh');
    expect(hanhPlain[0]).toBe('行');
    expect(hanhPlain).toContain('幸');
    expect(hanhPlain).not.toContain('長');
  });

  it('respects word boundaries and prioritizes direct Hán Việt for short words like An and đường', () => {
    const an = search('An');
    expect(an[0]).toBe('安');
    expect(an).not.toContain('日');

    const duong = search('đường');
    expect(duong[0]).toBe('糖');
    expect(duong.slice(0, 3)).toEqual(['糖', '唐', '堂']);
    expect(duong).not.toContain('洋');
  });

  it('normalizes old and new Vietnamese tone placement on oa/oe/uy', () => {
    expect(search('hòa').slice(0, 5)).toEqual(search('hoà').slice(0, 5));
    expect(search('hòa')).toContain('和');
    expect(search('thủy')).toContain('水');
    expect(search('thuỷ')).toContain('水');
  });

  it('finds Hán Việt typed without diacritics and ranks exact match first', () => {
    const nhat = search('nhat');
    expect(nhat.slice(0, 3)).toEqual(['日', '一', '壱']);
    const nhatToned = search('Nhật');
    expect(nhatToned[0]).toBe('日');
    expect(nhatToned).not.toContain('壱');
    expect(nhatToned.indexOf('一')).toBeGreaterThan(5);
    expect(search('hoc')[0]).toBe('学');
  });

  it('finds On readings typed in hiragana or katakana and prioritizes exact kanji match', () => {
    expect(search('がく')).toContain('学');
    expect(search('ガク')).toContain('学');
    expect(search('校')[0]).toBe('校');
  });

  it('finds Kun readings with or without the okurigana dot', () => {
    expect(search('よむ')).toContain('読');
    expect(search('よ.む')).toContain('読');
  });

  it('supports progressive prefix typeahead on Hán Việt and meanings', () => {
    expect(search('trườ').slice(0, 3)).toContain('長');
    expect(search('stud')).toContain('学');
  });

  it('finds English and Vietnamese meanings and Jukugo compounds', () => {
    expect(search('study')[0]).toBe('学');
    expect(search('mat troi')[0]).toBe('日');
    expect(search('あした')).toContain('日');
    expect(search('ngay mai')).toContain('日');
  });

  it('returns no matches for punctuation-only queries', () => {
    expect(search('---')).toEqual([]);
  });
});
