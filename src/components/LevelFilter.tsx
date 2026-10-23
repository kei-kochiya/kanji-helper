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
    active: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/50 shadow-sm shadow-emerald-950/40',
    idle: 'bg-zinc-900/60 text-zinc-400 border-white/[0.08] hover:border-white/[0.16] hover:text-zinc-200',
  },
  N4: {
    active: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/50 shadow-sm shadow-cyan-950/40',
    idle: 'bg-zinc-900/60 text-zinc-400 border-white/[0.08] hover:border-white/[0.16] hover:text-zinc-200',
  },
  N3: {
    active: 'bg-blue-500/15 text-blue-300 border-blue-500/50 shadow-sm shadow-blue-950/40',
    idle: 'bg-zinc-900/60 text-zinc-400 border-white/[0.08] hover:border-white/[0.16] hover:text-zinc-200',
  },
  N2: {
    active: 'bg-purple-500/15 text-purple-300 border-purple-500/50 shadow-sm shadow-purple-950/40',
    idle: 'bg-zinc-900/60 text-zinc-400 border-white/[0.08] hover:border-white/[0.16] hover:text-zinc-200',
  },
  N1: {
    active: 'bg-rose-500/15 text-rose-300 border-rose-500/50 shadow-sm shadow-rose-950/40',
    idle: 'bg-zinc-900/60 text-zinc-400 border-white/[0.08] hover:border-white/[0.16] hover:text-zinc-200',
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
  const totalCount = Object.values(levelCounts).reduce((a, b) => a + b, 0);

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-xs font-mono uppercase tracking-wider text-zinc-400 mr-1 select-none">
        Cấp độ:
      </span>

      {/* Select All pill */}
      <button
        onClick={isAllSelected ? onClearAll : onSelectAll}
        aria-pressed={isAllSelected}
        className={`px-3 py-1.5 rounded-lg text-xs font-medium border cursor-pointer active:scale-[0.97] transition-all duration-150 ${
          isAllSelected
            ? 'bg-zinc-100 text-zinc-900 border-white font-semibold shadow-sm'
            : 'bg-zinc-900/80 text-zinc-400 border-white/[0.08] hover:border-white/[0.16] hover:text-zinc-200'
        }`}
      >
        Tất cả ({totalCount})
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
            aria-pressed={isSelected}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium border flex items-center gap-1.5 cursor-pointer active:scale-[0.97] transition-all duration-150 ${
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
