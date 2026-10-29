import React from 'react';
import { Search, X, Bookmark, CheckCircle2, Shuffle, SlidersHorizontal, ChevronUp } from 'lucide-react';
import type { JLPTLevel, SortOption, StatusFilter } from '../types/kanji';
import { LevelFilter } from './LevelFilter';
import { summarizeLevels } from '../utils/levels';

interface FilterPanelProps {
  query: string;
  onQueryChange: (q: string) => void;
  status: StatusFilter;
  onStatusChange: (s: StatusFilter) => void;
  starredCount: number;
  masteredCount: number;
  selectedLevels: Set<JLPTLevel>;
  onToggleLevel: (lvl: JLPTLevel) => void;
  onSelectAllLevels: () => void;
  levelCounts: Record<JLPTLevel, number>;
  sortBy: SortOption;
  onSortChange: (s: SortOption) => void;
  onReshuffle: () => void;
  resultCount: number;
  /** Study modes show a one-line summary that expands into the full panel. */
  collapsible: boolean;
  expanded: boolean;
  onExpandedChange: (open: boolean) => void;
  /** Extra context for the summary line, e.g. when filters only apply to the next quiz. */
  note?: string;
  searchInputRef: React.RefObject<HTMLInputElement | null>;
}

const STATUS_LABELS: Record<StatusFilter, string> = {
  all: '',
  starred: 'Đã lưu',
  unmastered: 'Chưa thuộc',
  mastered: 'Đã thuộc',
};

const SORT_LABELS: Record<SortOption, string> = {
  default: '',
  strokes_asc: 'số nét tăng dần',
  strokes_desc: 'số nét giảm dần',
  random: 'ngẫu nhiên',
};

export const FilterPanel: React.FC<FilterPanelProps> = (props) => {
  const {
    query,
    onQueryChange,
    status,
    onStatusChange,
    starredCount,
    masteredCount,
    selectedLevels,
    onToggleLevel,
    onSelectAllLevels,
    levelCounts,
    sortBy,
    onSortChange,
    onReshuffle,
    resultCount,
    collapsible,
    expanded,
    onExpandedChange,
    note,
    searchInputRef,
  } = props;

  if (collapsible && !expanded) {
    const parts = [
      summarizeLevels(selectedLevels),
      STATUS_LABELS[status],
      query.trim() ? `“${query.trim()}”` : '',
      SORT_LABELS[sortBy] ? `xếp ${SORT_LABELS[sortBy]}` : '',
    ].filter(Boolean);
    return (
      <section aria-label="Bộ lọc" className="flex items-center justify-between gap-3 rounded-xl bg-ink-900 border border-line pl-4 pr-1.5 py-1.5 mb-5">
        <p className="min-w-0 text-sm text-paper-2 truncate">
          <span className="text-paper font-medium">{parts.join(' · ')}</span>
          <span className="tabular-nums"> · {resultCount.toLocaleString('vi-VN')} chữ</span>
          {note && <span className="text-paper-3 hidden sm:inline"> · {note}</span>}
        </p>
        <button
          type="button"
          onClick={() => onExpandedChange(true)}
          aria-expanded={false}
          className="shrink-0 inline-flex items-center gap-1.5 h-9 px-3 rounded-lg text-sm font-medium text-paper-2 hover:text-paper hover:bg-ink-850 transition-colors cursor-pointer"
        >
          <SlidersHorizontal className="w-4 h-4" aria-hidden="true" />
          Sửa bộ lọc
        </button>
      </section>
    );
  }

  const statusButton = (value: StatusFilter, label: React.ReactNode, activeClass: string) => (
    <button
      type="button"
      onClick={() => onStatusChange(value)}
      aria-pressed={status === value}
      className={`inline-flex items-center justify-center gap-1.5 h-8 px-1.5 sm:px-3 rounded-md text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
        status === value ? activeClass : 'text-paper-2 hover:text-paper'
      }`}
    >
      {label}
    </button>
  );

  return (
    <section aria-label="Bộ lọc" className="rounded-2xl bg-ink-900 border border-line p-3 sm:p-4 mb-6 flex flex-col gap-3">
      <div className="flex flex-col lg:flex-row gap-3 lg:items-center justify-between">
        <div className="relative flex-1 lg:max-w-xl">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-paper-3 pointer-events-none" aria-hidden="true" />
          <input
            ref={searchInputRef}
            type="text"
            inputMode="search"
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Escape' && query) {
                e.stopPropagation();
                onQueryChange('');
              }
            }}
            aria-label="Tìm chữ Hán"
            placeholder="Tìm chữ, Hán Việt, nghĩa, On/Kun… (vd: nhat, học, よむ)"
            className="w-full h-10 bg-ink-950 text-sm text-paper placeholder:text-paper-3 pl-10 pr-10 rounded-xl border border-line focus:border-shu/60 focus:outline-none transition-colors"
          />
          {query ? (
            <button
              type="button"
              onClick={() => {
                onQueryChange('');
                searchInputRef.current?.focus();
              }}
              aria-label="Xóa từ khóa"
              className="absolute right-1.5 top-1/2 -translate-y-1/2 grid place-items-center w-7 h-7 rounded-md text-paper-3 hover:text-paper cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          ) : (
            <kbd className="hidden sm:block absolute right-3 top-1/2 -translate-y-1/2 select-none" aria-hidden="true">
              /
            </kbd>
          )}
        </div>

        <div className="flex items-center gap-2">
          <div className="flex-1 grid grid-cols-4 sm:flex items-center gap-0.5 p-1 rounded-lg bg-ink-950 border border-line">
            {statusButton('all', 'Tất cả', 'bg-ink-800 text-paper')}
            {statusButton(
              'starred',
              <>
                <Bookmark className="w-3.5 h-3.5 hidden sm:block" aria-hidden="true" />
                Đã lưu <span className="tabular-nums opacity-80">{starredCount}</span>
              </>,
              'bg-kin/12 text-kin'
            )}
            {statusButton('unmastered', 'Chưa thuộc', 'bg-ink-800 text-paper')}
            {statusButton(
              'mastered',
              <>
                <CheckCircle2 className="w-3.5 h-3.5 hidden sm:block" aria-hidden="true" />
                Đã thuộc <span className="tabular-nums opacity-80">{masteredCount}</span>
              </>,
              'bg-ok/12 text-ok'
            )}
          </div>
          {collapsible && (
            <button
              type="button"
              onClick={() => onExpandedChange(false)}
              aria-expanded={true}
              aria-label="Thu gọn bộ lọc"
              title="Thu gọn bộ lọc"
              className="shrink-0 grid place-items-center w-9 h-9 rounded-lg text-paper-2 hover:text-paper hover:bg-ink-850 transition-colors cursor-pointer"
            >
              <ChevronUp className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pt-3 border-t border-line">
        <LevelFilter selectedLevels={selectedLevels} onToggleLevel={onToggleLevel} onSelectAll={onSelectAllLevels} levelCounts={levelCounts} />

        <div className="flex items-center gap-2 self-start md:self-auto">
          <label htmlFor="sort-select" className="text-xs text-paper-3">
            Sắp xếp
          </label>
          <select
            id="sort-select"
            value={sortBy}
            onChange={(e) => onSortChange(e.target.value as SortOption)}
            className="h-8 bg-ink-950 text-xs text-paper pl-2.5 pr-7 rounded-lg border border-line focus:border-shu/60 focus:outline-none cursor-pointer"
          >
            <option value="default">Mặc định (N5 → N1)</option>
            <option value="strokes_asc">Số nét tăng dần</option>
            <option value="strokes_desc">Số nét giảm dần</option>
            <option value="random">Ngẫu nhiên</option>
          </select>
          {sortBy === 'random' && (
            <button
              type="button"
              onClick={onReshuffle}
              aria-label="Trộn lại thứ tự"
              title="Trộn lại"
              className="grid place-items-center w-8 h-8 rounded-lg text-paper-2 hover:text-paper hover:bg-ink-850 transition-colors cursor-pointer"
            >
              <Shuffle className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {collapsible && note && <p className="text-xs text-paper-3 -mt-1">{note}</p>}
    </section>
  );
};
