import React from 'react';
import type { JLPTLevel } from '../types/kanji';
import { ALL_LEVELS, LEVEL_STYLES } from '../utils/levels';

interface LevelFilterProps {
  selectedLevels: Set<JLPTLevel>;
  onToggleLevel: (level: JLPTLevel) => void;
  onSelectAll: () => void;
  onClearAll: () => void;
  levelCounts: Record<JLPTLevel, number>;
}

const chipBase =
  'inline-flex items-center gap-1.5 h-8 px-2.5 rounded-lg text-xs font-medium border tabular-nums cursor-pointer transition-colors';
const chipIdle = 'border-line text-paper-2 hover:border-line-strong hover:text-paper';

export const LevelFilter: React.FC<LevelFilterProps> = ({
  selectedLevels,
  onToggleLevel,
  onSelectAll,
  onClearAll,
  levelCounts,
}) => {
  const isAllSelected = selectedLevels.size === ALL_LEVELS.length;
  const totalCount = Object.values(levelCounts).reduce((a, b) => a + b, 0);

  return (
    <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="Lọc theo cấp độ JLPT">
      <span className="text-xs text-paper-3 mr-1 select-none">Cấp độ</span>

      <button
        type="button"
        onClick={isAllSelected ? onClearAll : onSelectAll}
        aria-pressed={isAllSelected}
        title={isAllSelected ? 'Chỉ giữ N5' : 'Chọn tất cả cấp độ'}
        className={`${chipBase} ${isAllSelected ? 'bg-paper text-ink-950 border-paper font-semibold' : chipIdle}`}
      >
        Tất cả
        <span className="opacity-70">{totalCount.toLocaleString('vi-VN')}</span>
      </button>

      {ALL_LEVELS.map((lvl) => {
        const isSelected = selectedLevels.has(lvl);
        const style = LEVEL_STYLES[lvl];
        return (
          <button
            key={lvl}
            type="button"
            onClick={() => onToggleLevel(lvl)}
            aria-pressed={isSelected}
            title={`Bật/tắt cấp độ ${lvl}`}
            className={`${chipBase} ${isSelected ? style.chip : chipIdle}`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} aria-hidden="true" />
            <span className="font-semibold">{lvl}</span>
            <span className="opacity-70">{(levelCounts[lvl] || 0).toLocaleString('vi-VN')}</span>
          </button>
        );
      })}
    </div>
  );
};
