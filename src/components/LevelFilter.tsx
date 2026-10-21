import React from 'react';
import type { JLPTLevel } from '../types/kanji';

interface LevelFilterProps {
  selectedLevels: Set<JLPTLevel>;
  onToggleLevel: (level: JLPTLevel) => void;
  onSelectAll: () => void;
  onClearAll: () => void;
  levelCounts: Record<JLPTLevel, number>;
}

const ALL_LEVELS: JLPTLevel[] = ['N5', 'N4', 'N3', 'N2', 'N1'];

const LEVEL_THEMES: Record<JLPTLevel, { active: string; idle: string }> = {
  N5: {
    active: 'bg-emerald-500/20 text-emerald-300 border-emerald-500 shadow-sm shadow-emerald-950',
    idle: 'bg-zinc-900/80 text-zinc-400 border-zinc-800 hover:border-zinc-700 hover:text-zinc-200',
  },
  N4: {
    active: 'bg-cyan-500/20 text-cyan-300 border-cyan-500 shadow-sm shadow-cyan-950',
    idle: 'bg-zinc-900/80 text-zinc-400 border-zinc-800 hover:border-zinc-700 hover:text-zinc-200',
  },
  N3: {
    active: 'bg-blue-500/20 text-blue-300 border-blue-500 shadow-sm shadow-blue-950',
    idle: 'bg-zinc-900/80 text-zinc-400 border-zinc-800 hover:border-zinc-700 hover:text-zinc-200',
  },
  N2: {
    active: 'bg-purple-500/20 text-purple-300 border-purple-500 shadow-sm shadow-purple-950',
    idle: 'bg-zinc-900/80 text-zinc-400 border-zinc-800 hover:border-zinc-700 hover:text-zinc-200',
  },
  N1: {
    active: 'bg-rose-500/20 text-rose-300 border-rose-500 shadow-sm shadow-rose-950',
    idle: 'bg-zinc-900/80 text-zinc-400 border-zinc-800 hover:border-zinc-700 hover:text-zinc-200',
  },
};

export const LevelFilter: React.FC<LevelFilterProps> = ({
  selectedLevels,
  onToggleLevel,
  onSelectAll,
  onClearAll,
  levelCounts,
}) => {
  const isAllSelected = selectedLevels.size === ALL_LEVELS.length;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-xs font-mono uppercase tracking-wider text-zinc-500 mr-1 select-none">
        Cấp độ:
      </span>

      {/* Select All pill */}
      <button
        onClick={isAllSelected ? onClearAll : onSelectAll}
        className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all duration-150 ${
          isAllSelected
            ? 'bg-zinc-200 text-zinc-900 border-white font-semibold'
            : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:border-zinc-700 hover:text-zinc-200'
        }`}
      >
        Tất cả ({Object.values(levelCounts).reduce((a, b) => a + b, 0)})
      </button>

      {/* N5 to N1 Chips (Multi-selectable) */}
      {ALL_LEVELS.map((lvl) => {
        const isSelected = selectedLevels.has(lvl);
        const theme = LEVEL_THEMES[lvl];
        const count = levelCounts[lvl] || 0;

        return (
          <button
            key={lvl}
            onClick={() => onToggleLevel(lvl)}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium border flex items-center gap-1.5 transition-all duration-150 ${
              isSelected ? theme.active : theme.idle
            }`}
            title={`Bật/tắt cấp độ ${lvl}`}
          >
            <span className="font-bold">{lvl}</span>
            <span className="text-[10px] opacity-75 font-sans">({count})</span>
          </button>
        );
      })}
    </div>
  );
};
