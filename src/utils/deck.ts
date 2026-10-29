interface HasId {
  id: string;
}

/**
 * Where to stand after the study list changes underneath you:
 * - the current card is still there → stay on it;
 * - cards were only removed (e.g. one was marked "Đã thuộc" under "Chưa thuộc") → keep the
 *   position so the next card slides in;
 * - it is a different list (new filters) → start from the top.
 */
export function followDeck(oldDeck: readonly HasId[], oldIndex: number, newDeck: readonly HasId[]): { index: number; keptCurrent: boolean } {
  const currentId = oldDeck[oldIndex]?.id;
  const keptAt = currentId ? newDeck.findIndex((k) => k.id === currentId) : -1;
  if (keptAt >= 0) return { index: keptAt, keptCurrent: true };

  const oldIds = new Set(oldDeck.map((k) => k.id));
  const isShrink = newDeck.every((k) => oldIds.has(k.id));
  return { index: isShrink ? Math.min(oldIndex, Math.max(0, newDeck.length - 1)) : 0, keptCurrent: false };
}
