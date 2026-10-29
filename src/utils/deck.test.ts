import { describe, expect, it } from 'vitest';
import { followDeck } from './deck';

const deck = (ids: string) => ids.split('').map((id) => ({ id }));

describe('followDeck', () => {
  it('stays on the current card when it is still in the list', () => {
    expect(followDeck(deck('abcde'), 2, deck('xcab'))).toEqual({ index: 1, keptCurrent: true });
  });

  it('lets the next card slide in when the current one was removed', () => {
    // Marking "c" as mastered under "Chưa thuộc" removes it; "d" takes its place
    expect(followDeck(deck('abcde'), 2, deck('abde'))).toEqual({ index: 2, keptCurrent: false });
  });

  it('clamps to the new last card when the removed card was last', () => {
    expect(followDeck(deck('abc'), 2, deck('ab'))).toEqual({ index: 1, keptCurrent: false });
  });

  it('starts over for a different list', () => {
    expect(followDeck(deck('abc'), 2, deck('xyz'))).toEqual({ index: 0, keptCurrent: false });
  });

  it('handles an empty new list', () => {
    expect(followDeck(deck('abc'), 1, [])).toEqual({ index: 0, keptCurrent: false });
  });
});
