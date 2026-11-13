import { describe, expect, it } from 'vitest';
import kanjiData from '../data/kanji_data.json';
import type { RawKanjiItem } from '../types/kanji';
import { hydrateKanjiData } from './dataset';
import { buildSearchIndex, foldText } from './search';

const data = hydrateKanjiData(kanjiData as RawKanjiItem[]);
const index = buildSearchIndex(data);
const search = (q: string) => data.filter((k) => index.get(k.id)!.includes(foldText(q))).map((k) => k.c);

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

describe('search index', () => {
  it('finds Hán Việt typed without diacritics', () => {
    expect(search('nhat')).toContain('日');
    expect(search('hoc')).toContain('学');
  });

  it('finds On readings typed in hiragana or katakana', () => {
    expect(search('がく')).toContain('学');
    expect(search('ガク')).toContain('学');
  });

  it('finds Kun readings with or without the okurigana dot', () => {
    expect(search('よむ')).toContain('読');
    expect(search('よ.む')).toContain('読');
  });

  it('finds English and Vietnamese meanings', () => {
    expect(search('study')).toContain('学');
    expect(search('mat troi')).toContain('日');
  });

  it('finds kanji via Jukugo compound readings and Vietnamese meanings', () => {
    expect(search('あした')).toContain('日');
    expect(search('ngay mai')).toContain('日');
  });
});
