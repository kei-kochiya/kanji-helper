import React, { useState, useMemo, useEffect, useRef, useDeferredValue, useCallback } from 'react';
import { Search, X, Bookmark, CheckCircle2, SearchX, Shuffle } from 'lucide-react';
import kanjiRawData from './data/kanji_data.json';
import type { KanjiItem, JLPTLevel, ViewMode, UserProgress } from './types/kanji';
import { Header } from './components/Header';
import { LevelFilter } from './components/LevelFilter';
import { KanjiCard } from './components/KanjiCard';
import { KanjiDetailModal } from './components/KanjiDetailModal';
import { FlashcardMode } from './components/FlashcardMode';
import { QuizMode } from './components/QuizMode';
import { StrokeOrderPad } from './components/StrokeOrderPad';
import { loadUserProgress, saveUserProgress, exportProgressJSON, importProgressJSON } from './utils/storage';
import { ALL_LEVELS } from './utils/levels';
import { buildSearchIndex, foldText } from './utils/search';
import { shuffled } from './utils/random';

const KANJI_DATA: KanjiItem[] = kanjiRawData as KanjiItem[];
const SEARCH_INDEX = buildSearchIndex(KANJI_DATA);
const ITEMS_PER_PAGE = 96;

type SortOption = 'default' | 'strokes_asc' | 'strokes_desc' | 'random';
type StatusFilter = 'all' | 'starred' | 'unmastered' | 'mastered';
type Toast = { id: number; message: string; tone: 'ok' | 'bad' };

const makeRandomRank = () => new Map(shuffled(KANJI_DATA.map((k) => k.id)).map((id, i) => [id, i]));

const isTypingTarget = (el: EventTarget | null) =>
  el instanceof HTMLElement && (el.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName));

export function App() {
  const [currentMode, setCurrentMode] = useState<ViewMode>('grid');

  // Filters
  const [selectedLevels, setSelectedLevels] = useState<Set<JLPTLevel>>(() => new Set(ALL_LEVELS));
  const [searchQuery, setSearchQuery] = useState('');
  const deferredQuery = useDeferredValue(searchQuery);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [sortBy, setSortBy] = useState<SortOption>('default');
  const [randomRank, setRandomRank] = useState<Map<string, number> | null>(null);
  const [displayLimit, setDisplayLimit] = useState(ITEMS_PER_PAGE);

  const [progress, setProgress] = useState<UserProgress>(() => loadUserProgress());
  const [activeKanji, setActiveKanji] = useState<KanjiItem | null>(null);
  const [padIndex, setPadIndex] = useState(0);
  const [toast, setToast] = useState<Toast | null>(null);

  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    saveUserProgress(progress);
  }, [progress]);

  useEffect(() => {
    if (!toast) return;
    const id = window.setTimeout(() => setToast(null), 3200);
    return () => window.clearTimeout(id);
  }, [toast]);

  const showToast = useCallback((message: string, tone: Toast['tone'] = 'ok') => {
    setToast({ id: Date.now(), message, tone });
  }, []);

  // "/" focuses search from anywhere except while typing or inside the dialog
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '/' && !isTypingTarget(e.target) && !activeKanji) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeKanji]);

  const levelCounts = useMemo(() => {
    const counts: Record<JLPTLevel, number> = { N5: 0, N4: 0, N3: 0, N2: 0, N1: 0 };
    for (const k of KANJI_DATA) {
      if (counts[k.lvl] !== undefined) counts[k.lvl]++;
    }
    return counts;
  }, []);

  const starredSet = useMemo(() => new Set(progress.starred), [progress.starred]);
  const masteredSet = useMemo(() => new Set(progress.mastered), [progress.mastered]);

  const handleToggleLevel = (lvl: JLPTLevel) => {
    setSelectedLevels((prev) => {
      const next = new Set(prev);
      if (next.has(lvl)) {
        if (next.size > 1) next.delete(lvl);
      } else {
        next.add(lvl);
      }
      return next;
    });
    setDisplayLimit(ITEMS_PER_PAGE);
  };

  const handleSelectAllLevels = () => {
    setSelectedLevels(new Set(ALL_LEVELS));
    setDisplayLimit(ITEMS_PER_PAGE);
  };

  const handleClearAllLevels = () => {
    setSelectedLevels(new Set<JLPTLevel>(['N5']));
    setDisplayLimit(ITEMS_PER_PAGE);
  };

  const handleSortChange = (value: SortOption) => {
    setSortBy(value);
    if (value === 'random') setRandomRank(makeRandomRank());
  };

  const handleToggleStar = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setProgress((prev) => ({
      ...prev,
      starred: prev.starred.includes(id) ? prev.starred.filter((k) => k !== id) : [...prev.starred, id],
    }));
  };

  const handleToggleMaster = (id: string) => {
    setProgress((prev) => ({
      ...prev,
      mastered: prev.mastered.includes(id) ? prev.mastered.filter((k) => k !== id) : [...prev.mastered, id],
    }));
  };

  // Progress only feeds the list when a status filter needs it, so marking a card
  // as mastered under "Tất cả" does not rebuild the list (and reset the flashcard deck)
  const statusIds =
    statusFilter === 'starred' ? progress.starred : statusFilter === 'all' ? null : progress.mastered;

  const filteredKanji = useMemo(() => {
    const query = foldText(deferredQuery.trim());
    const statusSet = statusIds ? new Set(statusIds) : null;

    const list = KANJI_DATA.filter((k) => {
      if (!selectedLevels.has(k.lvl)) return false;
      if (statusSet) {
        const inSet = statusSet.has(k.id);
        if (statusFilter === 'unmastered' ? inSet : !inSet) return false;
      }
      return !query || (SEARCH_INDEX.get(k.id) ?? '').includes(query);
    });

    if (sortBy === 'strokes_asc') list.sort((a, b) => a.st - b.st);
    else if (sortBy === 'strokes_desc') list.sort((a, b) => b.st - a.st);
    else if (sortBy === 'random' && randomRank) list.sort((a, b) => (randomRank.get(a.id) ?? 0) - (randomRank.get(b.id) ?? 0));
    return list;
  }, [selectedLevels, deferredQuery, statusFilter, statusIds, sortBy, randomRank]);

  const activeKanjiIndex = useMemo(
    () => (activeKanji ? filteredKanji.findIndex((k) => k.id === activeKanji.id) : -1),
    [activeKanji, filteredKanji]
  );

  const handleModalPrev = useCallback(() => {
    if (activeKanjiIndex > 0) setActiveKanji(filteredKanji[activeKanjiIndex - 1]);
  }, [activeKanjiIndex, filteredKanji]);

  const handleModalNext = useCallback(() => {
    if (activeKanjiIndex >= 0 && activeKanjiIndex < filteredKanji.length - 1) {
      setActiveKanji(filteredKanji[activeKanjiIndex + 1]);
    }
  }, [activeKanjiIndex, filteredKanji]);

  const handleCloseModal = useCallback(() => setActiveKanji(null), []);

  // The writing lab keeps its position when the list shrinks, but never points past the end
  const safePadIndex = Math.min(padIndex, Math.max(0, filteredKanji.length - 1));
  const padKanji = filteredKanji[safePadIndex];

  const handleExport = () => {
    exportProgressJSON(progress);
    showToast('Đã tải tệp sao lưu tiến độ.');
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const imported = await importProgressJSON(file);
      setProgress(imported);
      showToast(
        `Đã khôi phục: ${imported.mastered.length.toLocaleString('vi-VN')} chữ đã thuộc, ${imported.starred.length.toLocaleString('vi-VN')} chữ đã lưu.`
      );
    } catch {
      showToast('Tệp không hợp lệ. Hãy chọn tệp .json được xuất từ Kanji Helper.', 'bad');
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const resetFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    handleSelectAllLevels();
  };

  const statusButton = (value: StatusFilter, label: React.ReactNode, activeClass: string) => (
    <button
      type="button"
      onClick={() => {
        setStatusFilter(value);
        setDisplayLimit(ITEMS_PER_PAGE);
      }}
      aria-pressed={statusFilter === value}
      className={`inline-flex items-center justify-center gap-1.5 h-8 px-1.5 sm:px-3 rounded-md text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
        statusFilter === value ? activeClass : 'text-paper-2 hover:text-paper'
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="min-h-screen flex flex-col">
      <input ref={fileInputRef} type="file" accept=".json,application/json" onChange={handleFileChange} className="hidden" />

      <Header
        currentMode={currentMode}
        onSelectMode={(mode) => {
          setCurrentMode(mode);
          setPadIndex(0);
        }}
        masteredCount={progress.mastered.length}
        starredCount={progress.starred.length}
        totalKanji={KANJI_DATA.length}
        onExport={handleExport}
        onImport={() => fileInputRef.current?.click()}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-5 sm:py-6">
        {/* Filters apply to every mode */}
        <section aria-label="Bộ lọc" className="rounded-2xl bg-ink-900 border border-line p-3 sm:p-4 mb-6 flex flex-col gap-3">
          <div className="flex flex-col lg:flex-row gap-3 lg:items-center justify-between">
            <div className="relative flex-1 lg:max-w-xl">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-paper-3 pointer-events-none" aria-hidden="true" />
              <input
                ref={searchInputRef}
                type="text"
                inputMode="search"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setDisplayLimit(ITEMS_PER_PAGE);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Escape' && searchQuery) {
                    e.stopPropagation();
                    setSearchQuery('');
                  }
                }}
                aria-label="Tìm chữ Hán"
                placeholder="Tìm chữ, Hán Việt, nghĩa, On/Kun… (vd: nhat, học, よむ)"
                className="w-full h-10 bg-ink-950 text-sm text-paper placeholder:text-paper-3 pl-10 pr-10 rounded-xl border border-line focus:border-shu/60 focus:outline-none transition-colors"
              />
              {searchQuery ? (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
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

            <div className="grid grid-cols-4 sm:flex items-center gap-0.5 p-1 rounded-lg bg-ink-950 border border-line sm:self-start lg:self-auto">
              {statusButton('all', 'Tất cả', 'bg-ink-800 text-paper')}
              {statusButton(
                'starred',
                <>
                  <Bookmark className="w-3.5 h-3.5 hidden sm:block" aria-hidden="true" />
                  Đã lưu <span className="tabular-nums opacity-80">{progress.starred.length}</span>
                </>,
                'bg-kin/12 text-kin'
              )}
              {statusButton('unmastered', 'Chưa thuộc', 'bg-ink-800 text-paper')}
              {statusButton(
                'mastered',
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 hidden sm:block" aria-hidden="true" />
                  Đã thuộc <span className="tabular-nums opacity-80">{progress.mastered.length}</span>
                </>,
                'bg-ok/12 text-ok'
              )}
            </div>
          </div>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pt-3 border-t border-line">
            <LevelFilter
              selectedLevels={selectedLevels}
              onToggleLevel={handleToggleLevel}
              onSelectAll={handleSelectAllLevels}
              onClearAll={handleClearAllLevels}
              levelCounts={levelCounts}
            />

            <div className="flex items-center gap-2 self-start md:self-auto">
              <label htmlFor="sort-select" className="text-xs text-paper-3">
                Sắp xếp
              </label>
              <select
                id="sort-select"
                value={sortBy}
                onChange={(e) => handleSortChange(e.target.value as SortOption)}
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
                  onClick={() => setRandomRank(makeRandomRank())}
                  aria-label="Trộn lại thứ tự"
                  title="Trộn lại"
                  className="grid place-items-center w-8 h-8 rounded-lg text-paper-2 hover:text-paper hover:bg-ink-850 transition-colors cursor-pointer"
                >
                  <Shuffle className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </section>

        {currentMode === 'grid' && (
          <div>
            <div className="flex items-center justify-between mb-3 px-1 text-xs text-paper-3">
              <p className="tabular-nums">
                Hiển thị <span className="text-paper font-medium">{Math.min(filteredKanji.length, displayLimit).toLocaleString('vi-VN')}</span> /{' '}
                <span className="text-paper font-medium">{filteredKanji.length.toLocaleString('vi-VN')}</span> chữ
              </p>
              {searchQuery && (
                <button type="button" onClick={() => setSearchQuery('')} className="text-shu hover:underline underline-offset-2 cursor-pointer">
                  Xóa tìm kiếm
                </button>
              )}
            </div>

            {filteredKanji.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 px-6 text-center rounded-2xl border border-dashed border-line-strong">
                <SearchX className="w-8 h-8 text-paper-3 mb-3" aria-hidden="true" />
                <h2 className="text-base font-semibold text-paper">Không tìm thấy chữ nào</h2>
                <p className="text-sm text-paper-2 max-w-md mt-1.5">
                  {searchQuery
                    ? `Không có chữ nào khớp “${searchQuery}” trong các cấp độ và trạng thái đang chọn. Có thể gõ không dấu, ví dụ “hoc”.`
                    : 'Bộ lọc hiện tại không còn chữ nào. Hãy bật thêm cấp độ hoặc chọn trạng thái khác.'}
                </p>
                <button
                  type="button"
                  onClick={resetFilters}
                  className="mt-5 h-9 px-4 rounded-lg bg-ink-800 hover:bg-ink-700 text-sm font-medium text-paper transition-colors cursor-pointer"
                >
                  Bỏ toàn bộ bộ lọc
                </button>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2.5 sm:gap-3">
                  {filteredKanji.slice(0, displayLimit).map((kanji) => (
                    <KanjiCard
                      key={kanji.id}
                      kanji={kanji}
                      isStarred={starredSet.has(kanji.id)}
                      isMastered={masteredSet.has(kanji.id)}
                      onSelect={setActiveKanji}
                      onToggleStar={handleToggleStar}
                    />
                  ))}
                </div>

                {displayLimit < filteredKanji.length && (
                  <div className="flex justify-center mt-8">
                    <button
                      type="button"
                      onClick={() => setDisplayLimit((prev) => prev + ITEMS_PER_PAGE)}
                      className="h-10 px-5 rounded-xl bg-ink-850 hover:bg-ink-800 border border-line text-sm font-medium text-paper transition-colors cursor-pointer"
                    >
                      Tải thêm {Math.min(ITEMS_PER_PAGE, filteredKanji.length - displayLimit)} chữ
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {currentMode === 'flashcard' && (
          <FlashcardMode
            kanjiList={filteredKanji}
            isStarred={(id) => starredSet.has(id)}
            isMastered={(id) => masteredSet.has(id)}
            onToggleStar={handleToggleStar}
            onToggleMaster={handleToggleMaster}
          />
        )}

        {currentMode === 'quiz' && <QuizMode kanjiList={filteredKanji} />}

        {currentMode === 'strokes' && (
          <StrokeOrderPad
            kanjiList={filteredKanji}
            currentIndex={safePadIndex}
            onNavigate={setPadIndex}
            isStarred={padKanji ? starredSet.has(padKanji.id) : false}
            isMastered={padKanji ? masteredSet.has(padKanji.id) : false}
            onToggleStar={handleToggleStar}
            onToggleMaster={handleToggleMaster}
          />
        )}
      </main>

      {activeKanji && (
        <KanjiDetailModal
          kanji={activeKanji}
          onClose={handleCloseModal}
          onPrev={activeKanjiIndex > 0 ? handleModalPrev : undefined}
          onNext={activeKanjiIndex >= 0 && activeKanjiIndex < filteredKanji.length - 1 ? handleModalNext : undefined}
          isStarred={starredSet.has(activeKanji.id)}
          isMastered={masteredSet.has(activeKanji.id)}
          onToggleStar={handleToggleStar}
          onToggleMaster={handleToggleMaster}
        />
      )}

      <div className="fixed inset-x-0 bottom-4 z-[60] flex justify-center px-4 pointer-events-none" aria-live="polite">
        {toast && (
          <div
            key={toast.id}
            className={`animate-toast pointer-events-auto max-w-md rounded-xl border bg-ink-850 px-4 py-3 text-sm shadow-[0_12px_32px_-12px_rgb(0_0_0/0.8)] ${
              toast.tone === 'ok' ? 'border-ok/35 text-paper' : 'border-bad/40 text-paper'
            }`}
            role={toast.tone === 'bad' ? 'alert' : 'status'}
          >
            {toast.message}
          </div>
        )}
      </div>

      <footer className="mt-auto border-t border-line py-6 text-xs text-paper-3">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-center sm:text-left">
          <p>
            Kanji Helper · N5 → N1 · {KANJI_DATA.length.toLocaleString('vi-VN')} Hán tự
          </p>
          <p>
            Dữ liệu: OpenJLPT, KanjiDictVN, KanjiVG (CC BY-SA 3.0) ·{' '}
            <a
              href="https://github.com/kei-kochiya/kanji-helper"
              target="_blank"
              rel="noopener noreferrer"
              className="text-paper-2 hover:text-paper underline underline-offset-2"
            >
              GitHub
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;
