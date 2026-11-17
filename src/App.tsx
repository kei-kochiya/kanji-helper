import React, { Suspense, lazy, useState, useMemo, useEffect, useRef, useDeferredValue, useCallback } from 'react';
import { SearchX, X } from 'lucide-react';
import type { KanjiItem, JLPTLevel, ViewMode, UserProgress, SortOption, StatusFilter } from './types/kanji';
import { Header } from './components/Header';
import { FilterPanel } from './components/FilterPanel';
import { KanjiCard } from './components/KanjiCard';
import { KanjiDetailModal } from './components/KanjiDetailModal';
import {
  loadUserProgress,
  saveUserProgress,
  exportProgressJSON,
  importProgressJSON,
  loadFilterPrefs,
  saveFilterPrefs,
} from './utils/storage';
import { ALL_LEVELS } from './utils/levels';
import { buildSearchIndex, parseSearchQuery, scoreSearchMatch } from './utils/search';
import type { SearchEntry } from './utils/search';
import { shuffled } from './utils/random';
import { isTypingTarget } from './utils/dom';
import { DIALOG_STATE, pushLocation, readLocation, replaceLocation } from './utils/url';
import { SPEECH_UNAVAILABLE_EVENT } from './utils/speech';
import type { SpeechUnavailableReason } from './utils/speech';

const FlashcardMode = lazy(() => import('./components/FlashcardMode').then((m) => ({ default: m.FlashcardMode })));
const QuizMode = lazy(() => import('./components/QuizMode').then((m) => ({ default: m.QuizMode })));
const StrokeOrderPad = lazy(() => import('./components/StrokeOrderPad').then((m) => ({ default: m.StrokeOrderPad })));

const ITEMS_PER_PAGE = 96;
const BASE_TITLE = document.title;
const MODE_TITLES: Record<ViewMode, string> = {
  grid: BASE_TITLE,
  flashcard: 'Thẻ nhớ · Kanji Helper',
  quiz: 'Trắc nghiệm · Kanji Helper',
  strokes: 'Luyện viết · Kanji Helper',
};
const SPEECH_MESSAGES: Record<SpeechUnavailableReason, string> = {
  unsupported: 'Trình duyệt này không hỗ trợ đọc thành tiếng. Hãy thử Chrome, Edge hoặc Safari.',
  'no-voice': 'Máy chưa có giọng đọc tiếng Nhật. Hãy cài giọng Nhật trong phần ngôn ngữ của hệ điều hành, hoặc mở trang bằng Chrome/Edge.',
};

type Toast = { id: number; message: string; tone: 'ok' | 'bad' };

const makeRandomRank = (list: KanjiItem[]) => new Map(shuffled(list.map((k) => k.id)).map((id, i) => [id, i]));

function computeFilteredKanji(
  kanjiData: KanjiItem[],
  searchIndex: Map<string, SearchEntry>,
  selectedLevels: Set<JLPTLevel>,
  queryText: string,
  statusFilter: StatusFilter,
  statusIds: string[] | null,
  radicalFilter: string | null,
  sortBy: SortOption,
  randomRank: Map<string, number> | null
): KanjiItem[] {
  const parsedQuery = parseSearchQuery(queryText);
  const statusSet = statusIds ? new Set(statusIds) : null;
  const scores = parsedQuery ? new Map<string, number>() : null;

  const list = kanjiData.filter((k) => {
    if (!selectedLevels.has(k.lvl)) return false;
    if (radicalFilter && k.rad !== radicalFilter) return false;
    if (statusSet) {
      const inSet = statusSet.has(k.id);
      if (statusFilter === 'unmastered' ? inSet : !inSet) return false;
    }
    if (!parsedQuery) return true;
    const entry = searchIndex.get(k.id);
    if (!entry) return false;
    const score = scoreSearchMatch(entry, parsedQuery);
    if (score === 0) return false;
    scores!.set(k.id, score);
    return true;
  });

  if (sortBy === 'strokes_asc') list.sort((a, b) => a.st - b.st);
  else if (sortBy === 'strokes_desc') list.sort((a, b) => b.st - a.st);
  else if (sortBy === 'random' && randomRank) list.sort((a, b) => (randomRank.get(a.id) ?? 0) - (randomRank.get(b.id) ?? 0));
  else if (scores) list.sort((a, b) => (scores.get(b.id) ?? 0) - (scores.get(a.id) ?? 0));
  return list;
}

export function App({ kanjiData }: { kanjiData: KanjiItem[] }) {
  const searchIndex = useMemo(() => buildSearchIndex(kanjiData), [kanjiData]);
  const byId = useMemo(() => new Map(kanjiData.map((k) => [k.id, k])), [kanjiData]);
  const validIds = useMemo(() => new Set(byId.keys()), [byId]);

  // Where we are comes from the address bar so reload and Back keep your place
  const [initialLocation] = useState(() => readLocation());
  const [initialPrefs] = useState(loadFilterPrefs);
  const [progress, setProgress] = useState<UserProgress>(() => loadUserProgress(validIds));

  const [currentMode, setCurrentMode] = useState<ViewMode>(initialLocation.mode);
  const [activeKanji, setActiveKanji] = useState<KanjiItem | null>(() =>
    initialLocation.mode === 'grid' && initialLocation.kanjiId ? byId.get(initialLocation.kanjiId) ?? null : null
  );
  const [flashStartId, setFlashStartId] = useState(() => (initialLocation.mode === 'flashcard' ? initialLocation.kanjiId : null));

  // Filters: levels, status and sort are remembered; the search box starts empty
  const [selectedLevels, setSelectedLevels] = useState<Set<JLPTLevel>>(() => new Set(initialPrefs.levels));
  const [statusFilter, setStatusFilter] = useState<StatusFilter>(initialPrefs.status);
  const [sortBy, setSortBy] = useState<SortOption>(initialPrefs.sort);
  const [randomRank, setRandomRank] = useState(() => (initialPrefs.sort === 'random' ? makeRandomRank(kanjiData) : null));
  const [searchQuery, setSearchQuery] = useState('');
  const [radicalFilter, setRadicalFilter] = useState<string | null>(null);
  const deferredQuery = useDeferredValue(searchQuery);
  const [displayLimit, setDisplayLimit] = useState(ITEMS_PER_PAGE);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const [padIndex, setPadIndex] = useState(() => {
    if (initialLocation.mode !== 'strokes' || !initialLocation.kanjiId) return 0;
    const initStatusIds =
      initialPrefs.status === 'starred' ? progress.starred : initialPrefs.status === 'all' ? null : progress.mastered;
    const initList = computeFilteredKanji(
      kanjiData,
      searchIndex,
      new Set(initialPrefs.levels),
      '',
      initialPrefs.status,
      initStatusIds,
      null,
      initialPrefs.sort,
      null
    );
    return Math.max(0, initList.findIndex((k) => k.id === initialLocation.kanjiId));
  });

  const [toast, setToast] = useState<Toast | null>(null);

  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    saveUserProgress(progress);
  }, [progress]);

  useEffect(() => {
    saveFilterPrefs({ levels: ALL_LEVELS.filter((l) => selectedLevels.has(l)), status: statusFilter, sort: sortBy });
  }, [selectedLevels, statusFilter, sortBy]);

  useEffect(() => {
    if (!toast) return;
    const id = window.setTimeout(() => setToast(null), 4200);
    return () => window.clearTimeout(id);
  }, [toast]);

  const showToast = useCallback((message: string, tone: Toast['tone'] = 'ok') => {
    setToast({ id: Date.now(), message, tone });
  }, []);

  useEffect(() => {
    const onUnavailable = (e: Event) => showToast(SPEECH_MESSAGES[(e as CustomEvent<SpeechUnavailableReason>).detail], 'bad');
    window.addEventListener(SPEECH_UNAVAILABLE_EVENT, onUnavailable);
    return () => window.removeEventListener(SPEECH_UNAVAILABLE_EVENT, onUnavailable);
  }, [showToast]);

  // Drop an unknown ?chu= from a shared or stale link
  useEffect(() => {
    if (initialLocation.kanjiId && !byId.has(initialLocation.kanjiId)) replaceLocation({ mode: initialLocation.mode, kanjiId: null });
  }, [initialLocation, byId]);

  useEffect(() => {
    document.title = activeKanji ? `${activeKanji.c} ${activeKanji.hv.join(' · ')} · Kanji Helper` : MODE_TITLES[currentMode];
  }, [activeKanji, currentMode]);

  const collapsible = currentMode !== 'grid';

  // "/" focuses search from anywhere except while typing or inside the dialog
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== '/' || isTypingTarget(e.target) || activeKanji) return;
      e.preventDefault();
      if (collapsible && !filtersOpen) {
        setFiltersOpen(true);
        requestAnimationFrame(() => searchInputRef.current?.focus());
      } else {
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeKanji, collapsible, filtersOpen]);

  const levelCounts = useMemo(() => {
    const counts: Record<JLPTLevel, number> = { N5: 0, N4: 0, N3: 0, N2: 0, N1: 0 };
    for (const k of kanjiData) {
      if (counts[k.lvl] !== undefined) counts[k.lvl]++;
    }
    return counts;
  }, [kanjiData]);

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

  const handleSortChange = (value: SortOption) => {
    setSortBy(value);
    if (value === 'random') setRandomRank(makeRandomRank(kanjiData));
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
  const statusIds = statusFilter === 'starred' ? progress.starred : statusFilter === 'all' ? null : progress.mastered;

  const filteredKanji = useMemo(
    () =>
      computeFilteredKanji(
        kanjiData,
        searchIndex,
        selectedLevels,
        deferredQuery,
        statusFilter,
        statusIds,
        radicalFilter,
        sortBy,
        randomRank
      ),
    [kanjiData, searchIndex, selectedLevels, deferredQuery, statusFilter, statusIds, radicalFilter, sortBy, randomRank]
  );

  // Browser Back/Forward: follow the address bar
  useEffect(() => {
    const onPop = () => {
      const loc = readLocation();
      setCurrentMode(loc.mode);
      setFiltersOpen(false);
      setActiveKanji(loc.mode === 'grid' && loc.kanjiId ? byId.get(loc.kanjiId) ?? null : null);
      if (loc.mode === 'flashcard') setFlashStartId(loc.kanjiId);
      if (loc.mode === 'strokes' && loc.kanjiId) {
        setPadIndex(Math.max(0, filteredKanji.findIndex((k) => k.id === loc.kanjiId)));
      }
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, [byId, filteredKanji]);

  const handleSelectMode = (mode: ViewMode) => {
    if (mode === currentMode && !activeKanji) return;
    setCurrentMode(mode);
    setActiveKanji(null);
    setPadIndex(0);
    setFlashStartId(null);
    setFiltersOpen(false);
    pushLocation({ mode, kanjiId: null });
  };

  const handleOpenKanji = useCallback((k: KanjiItem) => {
    setActiveKanji(k);
    pushLocation({ mode: 'grid', kanjiId: k.id }, DIALOG_STATE);
  }, []);

  const activeKanjiIndex = useMemo(
    () => (activeKanji ? filteredKanji.findIndex((k) => k.id === activeKanji.id) : -1),
    [activeKanji, filteredKanji]
  );

  const showInDialog = useCallback((k: KanjiItem) => {
    setActiveKanji(k);
    replaceLocation({ mode: 'grid', kanjiId: k.id });
  }, []);

  const handleModalPrev = useCallback(() => {
    if (activeKanjiIndex > 0) showInDialog(filteredKanji[activeKanjiIndex - 1]);
  }, [activeKanjiIndex, filteredKanji, showInDialog]);

  const handleModalNext = useCallback(() => {
    if (activeKanjiIndex >= 0 && activeKanjiIndex < filteredKanji.length - 1) showInDialog(filteredKanji[activeKanjiIndex + 1]);
  }, [activeKanjiIndex, filteredKanji, showInDialog]);

  // Closing goes Back when the dialog has its own history entry, so phone Back and the X agree
  const handleCloseModal = useCallback(() => {
    if (window.history.state === DIALOG_STATE) {
      window.history.back();
    } else {
      replaceLocation({ mode: 'grid', kanjiId: null });
      setActiveKanji(null);
    }
  }, []);

  const handleSelectRadical = useCallback(
    (rad: string) => {
      setRadicalFilter(rad);
      setDisplayLimit(ITEMS_PER_PAGE);
      handleCloseModal();
    },
    [handleCloseModal]
  );

  const handleFlashcardChange = useCallback((id: string) => {
    replaceLocation({ mode: 'flashcard', kanjiId: id });
  }, []);

  // The writing lab keeps its position when the list shrinks, but never points past the end
  const safePadIndex = Math.min(padIndex, Math.max(0, filteredKanji.length - 1));
  const padKanji = filteredKanji[safePadIndex];
  const padKanjiId = currentMode === 'strokes' ? padKanji?.id : undefined;

  useEffect(() => {
    if (padKanjiId) replaceLocation({ mode: 'strokes', kanjiId: padKanjiId });
  }, [padKanjiId]);

  const handleExport = () => {
    exportProgressJSON(progress);
    showToast('Đã tải tệp sao lưu tiến độ.');
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const { progress: imported, ignored } = await importProgressJSON(file, validIds);
      setProgress(imported);
      showToast(
        `Đã khôi phục: ${imported.mastered.length.toLocaleString('vi-VN')} chữ đã thuộc, ${imported.starred.length.toLocaleString('vi-VN')} chữ đã lưu.` +
          (ignored > 0 ? ` Bỏ qua ${ignored.toLocaleString('vi-VN')} mục không có trong dữ liệu.` : '')
      );
    } catch {
      showToast('Tệp không hợp lệ. Hãy chọn tệp .json được xuất từ Kanji Helper.', 'bad');
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const resetFilters = () => {
    setSearchQuery('');
    setRadicalFilter(null);
    setStatusFilter('all');
    handleSelectAllLevels();
  };

  return (
    <div className="min-h-screen flex flex-col">
      <input ref={fileInputRef} type="file" accept=".json,application/json" onChange={handleFileChange} className="hidden" />

      <Header
        currentMode={currentMode}
        onSelectMode={handleSelectMode}
        masteredCount={progress.mastered.length}
        starredCount={progress.starred.length}
        totalKanji={kanjiData.length}
        onExport={handleExport}
        onImport={() => fileInputRef.current?.click()}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-5 sm:py-6">
        <FilterPanel
          query={searchQuery}
          onQueryChange={(q) => {
            setSearchQuery(q);
            setDisplayLimit(ITEMS_PER_PAGE);
          }}
          status={statusFilter}
          onStatusChange={(s) => {
            setStatusFilter(s);
            setDisplayLimit(ITEMS_PER_PAGE);
          }}
          starredCount={progress.starred.length}
          masteredCount={progress.mastered.length}
          selectedLevels={selectedLevels}
          onToggleLevel={handleToggleLevel}
          onSelectAllLevels={handleSelectAllLevels}
          levelCounts={levelCounts}
          sortBy={sortBy}
          onSortChange={handleSortChange}
          onReshuffle={() => setRandomRank(makeRandomRank(kanjiData))}
          resultCount={filteredKanji.length}
          collapsible={collapsible}
          expanded={filtersOpen}
          onExpandedChange={setFiltersOpen}
          note={currentMode === 'quiz' ? 'áp dụng khi bắt đầu bài mới' : undefined}
          searchInputRef={searchInputRef}
        />

        {currentMode === 'grid' && (
          <div>
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3 px-1 text-xs text-paper-3">
              <div className="flex flex-wrap items-center gap-2">
                <p className="tabular-nums">
                  Hiển thị <span className="text-paper font-medium">{Math.min(filteredKanji.length, displayLimit).toLocaleString('vi-VN')}</span> /{' '}
                  <span className="text-paper font-medium">{filteredKanji.length.toLocaleString('vi-VN')}</span> chữ
                </p>
                {radicalFilter && (
                  <button
                    type="button"
                    onClick={() => setRadicalFilter(null)}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-ink-850 border border-line text-paper-2 hover:text-paper cursor-pointer transition-colors"
                  >
                    Bộ <span lang="ja" className="text-paper font-medium">{radicalFilter}</span>
                    <X className="w-3 h-3" aria-hidden="true" />
                  </button>
                )}
              </div>
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
                      onSelect={handleOpenKanji}
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

        <Suspense fallback={null}>
          {currentMode === 'flashcard' && (
            <FlashcardMode
              kanjiList={filteredKanji}
              isStarred={(id) => starredSet.has(id)}
              isMastered={(id) => masteredSet.has(id)}
              onToggleStar={handleToggleStar}
              onToggleMaster={handleToggleMaster}
              initialId={flashStartId}
              onCurrentChange={handleFlashcardChange}
            />
          )}

          {currentMode === 'quiz' && (
            <QuizMode
              kanjiList={filteredKanji}
              isMastered={(id) => masteredSet.has(id)}
              onToggleMaster={handleToggleMaster}
            />
          )}

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
        </Suspense>
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
          onSelectRadical={handleSelectRadical}
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
          <p>Kanji Helper · N5 → N1 · {kanjiData.length.toLocaleString('vi-VN')} Hán tự</p>
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
