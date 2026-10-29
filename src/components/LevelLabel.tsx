import React from 'react';
import type { JLPTLevel } from '../types/kanji';
import { LEVEL_STYLES } from '../utils/levels';

/** Coloured dot + level name, e.g. "● N5". */
export const LevelLabel: React.FC<{ level: JLPTLevel }> = ({ level }) => (
  <span className={`inline-flex items-center gap-1.5 text-xs font-semibold tabular-nums ${LEVEL_STYLES[level].text}`}>
    <span className={`w-1.5 h-1.5 rounded-full ${LEVEL_STYLES[level].dot}`} aria-hidden="true" />
    {level}
  </span>
);
