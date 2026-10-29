import type { JLPTLevel } from '../types/kanji';

export const ALL_LEVELS: JLPTLevel[] = ['N5', 'N4', 'N3', 'N2', 'N1'];

/** Class names per JLPT level, written out in full so Tailwind can see them. */
export const LEVEL_STYLES: Record<JLPTLevel, { text: string; dot: string; chip: string }> = {
  N5: { text: 'text-n5', dot: 'bg-n5', chip: 'bg-n5/12 text-n5 border-n5/40' },
  N4: { text: 'text-n4', dot: 'bg-n4', chip: 'bg-n4/12 text-n4 border-n4/40' },
  N3: { text: 'text-n3', dot: 'bg-n3', chip: 'bg-n3/12 text-n3 border-n3/40' },
  N2: { text: 'text-n2', dot: 'bg-n2', chip: 'bg-n2/12 text-n2 border-n2/40' },
  N1: { text: 'text-n1', dot: 'bg-n1', chip: 'bg-n1/12 text-n1 border-n1/40' },
};

/** "N5–N1", "N5–N3", "N5, N3" */
export function summarizeLevels(selected: Set<JLPTLevel>): string {
  const picked = ALL_LEVELS.filter((l) => selected.has(l));
  const first = ALL_LEVELS.indexOf(picked[0]);
  const contiguous = picked.every((l, i) => ALL_LEVELS.indexOf(l) === first + i);
  return contiguous && picked.length > 2 ? `${picked[0]}–${picked[picked.length - 1]}` : picked.join(', ');
}
