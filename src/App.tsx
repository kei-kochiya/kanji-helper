import React, { useState, useMemo, useEffect, useRef, useTransition } from 'react';
import { Search, X, ArrowUpDown, Bookmark, CheckCircle2, RefreshCw, AlertCircle } from 'lucide-react';
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

const KANJI_DATA: KanjiItem[] = kanjiRawData as KanjiItem[];
const ITEMS_PER_PAGE = 96;

type SortOption = 'default' | 'strokes_asc' | 'strokes_desc' | 'random';
type StatusFilter = 'all' | 'starred' | 'unmastered' | 'mastered';

export function App() {
  // Mode State
  const [currentMode, setCurrentMode] = useState<ViewMode>('grid');

  // Filter & Search State
  const [selectedLevels, setSelectedLevels] = useState<Set<JLPTLevel>>(
    () => new Set<JLPTLevel>(['N5', 'N4', 'N3', 'N2', 'N1'])
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [sortBy, setSortBy] = useState<SortOption>('default');
  const [displayLimit, setDisplayLimit] = useState(ITEMS_PER_PAGE);

  // User Progress (LocalStorage)
  const [progress, setProgress] = useState<UserProgress>(() => loadUserProgress());

  // Modal State
  const [activeKanji, setActiveKanji] = useState<KanjiItem | null>(null);
  const [padIndex, setPadIndex] = useState(0);

  // References
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [, startTransition] = useTransition();

  // Save progress on changes
  useEffect(() => {
    saveUserProgress(progress);
  }, [progress]);

  // Keyboard shortcut '/' to search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '/' && (e.target as HTMLElement).tagName !== 'INPUT') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Level counts for badges
  const levelCounts = useMemo(() => {
    const counts: Record<JLPTLevel, number> = { N5: 0, N4: 0, N3: 0, N2: 0, N1: 0 };
    for (const k of KANJI_DATA) {
      if (counts[k.lvl] !== undefined) {
        counts[k.lvl]++;
      }
    }
    return counts;
  }, []);

  // Level toggles
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
    setSelectedLevels(new Set<JLPTLevel>(['N5', 'N4', 'N3', 'N2', 'N1']));
    setDisplayLimit(ITEMS_PER_PAGE);
  };

  const handleClearAllLevels = () => {
    setSelectedLevels(new Set<JLPTLevel>(['N5']));
    setDisplayLimit(ITEMS_PER_PAGE);
  };

  // Star / Master toggles
  const handleToggleStar = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setProgress((prev) => {
      const isStarred = prev.starred.includes(id);
      return {
        ...prev,
        starred: isStarred ? prev.starred.filter((k) => k !== id) : [...prev.starred, id],
      };
    });
  };

  const handleToggleMaster = (id: string) => {
    setProgress((prev) => {
      const isMastered = prev.mastered.includes(id);
      return {
        ...prev,
        mastered: isMastered ? prev.mastered.filter((k) => k !== id) : [...prev.mastered, id],
      };
    });
  };

  // Filtered & Sorted Kanji List
  const filteredKanji = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return KANJI_DATA.filter((k) => {
      // 1. Level Filter
      if (!selectedLevels.has(k.lvl)) return false;

      // 2. Status Filter
      if (statusFilter === 'starred' && !progress.starred.includes(k.id)) return false;
      if (statusFilter === 'mastered' && !progress.mastered.includes(k.id)) return false;
      if (statusFilter === 'unmastered' && progress.mastered.includes(k.id)) return false;

      // 3. Search Query
      if (query) {
        const matchChar = k.c.toLowerCase().includes(query);
        const matchHV = k.hv.some((hv) => hv.toLowerCase().includes(query));
        const matchVi = k.m_vi.some((m) => m.toLowerCase().includes(query));
        const matchEn = k.m_en.some((m) => m.toLowerCase().includes(query));
        const matchOn = k.on.some((r) => r.toLowerCase().includes(query));
        const matchKun = k.kun.some((r) => r.toLowerCase().includes(query));
        if (!matchChar && !matchHV && !matchVi && !matchEn && !matchOn && !matchKun) {
          return false;
        }
      }

      return true;
    }).sort((a, b) => {
      if (sortBy === 'strokes_asc') return a.st - b.st;
      if (sortBy === 'strokes_desc') return b.st - a.st;
      if (sortBy === 'random') return 0.5 - Math.random();
      return 0; // Default order
    });
  }, [selectedLevels, searchQuery, statusFilter, sortBy, progress.starred, progress.mastered]);

  // Modal Next/Prev navigation within filtered list
  const activeKanjiIndex = useMemo(() => {
    if (!activeKanji) return -1;
    return filteredKanji.findIndex((k) => k.id === activeKanji.id);
  }, [activeKanji, filteredKanji]);

  const handleModalPrev = () => {
    if (activeKanjiIndex > 0) {
      setActiveKanji(filteredKanji[activeKanjiIndex - 1]);
    }
  };

  const handleModalNext = () => {
    if (activeKanjiIndex < filteredKanji.length - 1) {
      setActiveKanji(filteredKanji[activeKanjiIndex + 1]);
    }
  };

  // Import / Export
  const handleExport = () => {
    exportProgressJSON(progress);
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const imported = await importProgressJSON(file);
      setProgress(imported);
      alert('Đã khôi phục dữ liệu tiến độ học thành công!');
    } catch {
      alert('Tệp khôi phục không hợp lệ!');
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="min-h-screen bg-[#090a0f] text-slate-100 flex flex-col font-sans selection:bg-blue-500/30 selection:text-white">
      {/* Hidden File Input for Import */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Global Header */}
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
        onImport={handleImportClick}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6">
        {/* Controls Section (Always visible across all modes for filtering) */}
        <div className="bg-zinc-950/70 p-4 sm:p-5 rounded-2xl border border-zinc-800/80 mb-6 space-y-4">
          {/* Top Row: Search input & Status Filter pills */}
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
            {/* Search Input */}
            <div className="relative flex-1 max-w-lg">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  startTransition(() => setSearchQuery(e.target.value));
                  setDisplayLimit(ITEMS_PER_PAGE);
                }}
                placeholder="Tìm chữ Kanji, âm Hán Việt (vd: NHẬT, HỌC), nghĩa, On/Kun..."
                className="w-full bg-zinc-900/90 text-sm text-zinc-100 placeholder:text-zinc-500 pl-10 pr-10 py-2.5 rounded-xl border border-zinc-800 focus:border-zinc-600 focus:outline-none transition shadow-inner"
              />
              {searchQuery ? (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
                >
                  <X className="w-4 h-4" />
                </button>
              ) : (
                <span className="hidden sm:inline-block absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-mono text-zinc-500 bg-zinc-800 px-1.5 py-0.5 rounded border border-zinc-700">
                  /
                </span>
              )}
            </div>

            {/* Quick Status Filters */}
            <div className="flex items-center gap-1.5 bg-zinc-900/80 p-1 rounded-xl border border-zinc-800 shrink-0">
              <button
                onClick={() => setStatusFilter('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                  statusFilter === 'all'
                    ? 'bg-zinc-800 text-white shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                Tất cả
              </button>

              <button
                onClick={() => setStatusFilter('starred')}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                  statusFilter === 'starred'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Bookmark className="w-3.5 h-3.5 text-amber-400" />
                <span>Đã lưu ({progress.starred.length})</span>
              </button>

              <button
                onClick={() => setStatusFilter('unmastered')}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                  statusFilter === 'unmastered'
                    ? 'bg-zinc-800 text-zinc-200'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <span>Chưa thuộc</span>
              </button>

              <button
                onClick={() => setStatusFilter('mastered')}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                  statusFilter === 'mastered'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Đã thuộc</span>
              </button>
            </div>
          </div>

          {/* Bottom Row: Multi-Level Filters & Sorting */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pt-3 border-t border-zinc-850">
            {/* Multi-Level Selector */}
            <LevelFilter
              selectedLevels={selectedLevels}
              onToggleLevel={handleToggleLevel}
              onSelectAll={handleSelectAllLevels}
              onClearAll={handleClearAllLevels}
              levelCounts={levelCounts}
            />

            {/* Sort Dropdown */}
            <div className="flex items-center gap-2 self-end md:self-auto">
              <span className="text-xs font-mono text-zinc-500 flex items-center gap-1">
                <ArrowUpDown className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Sắp xếp:</span>
              </span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="bg-zinc-900 text-xs text-zinc-300 py-1.5 px-2.5 rounded-lg border border-zinc-800 focus:outline-none focus:border-zinc-700 font-medium"
              >
                <option value="default">Mặc định (N5 → N1)</option>
                <option value="strokes_asc">Số nét (Tăng dần)</option>
                <option value="strokes_desc">Số nét (Giảm dần)</option>
                <option value="random">Ngẫu nhiên (Trộn)</option>
              </select>
            </div>
          </div>
        </div>

        {/* View Mode Switching */}
        {currentMode === 'grid' && (
          <div>
            {/* Result Header Count */}
            <div className="flex items-center justify-between mb-4 px-1 text-xs text-zinc-400">
              <span className="font-mono">
                Hiển thị <strong className="text-zinc-200">{Math.min(filteredKanji.length, displayLimit)}</strong> /{' '}
                <strong className="text-zinc-200">{filteredKanji.length}</strong> chữ Hán
              </span>

              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="text-blue-400 hover:underline flex items-center gap-1"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Xóa tìm kiếm</span>
                </button>
              )}
            </div>

            {/* Empty State */}
            {filteredKanji.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 text-center bg-zinc-950/40 rounded-2xl border border-zinc-850">
                <AlertCircle className="w-10 h-10 text-zinc-600 mb-3" />
                <h3 className="text-base font-semibold text-zinc-300">Không tìm thấy chữ Kanji nào</h3>
                <p className="text-xs text-zinc-500 max-w-md mt-1">
                  Vui lòng thử từ khóa khác hoặc bật thêm cấp độ N5–N1 trong thanh bộ lọc bên trên.
                </p>
              </div>
            ) : (
              <>
                {/* Kanji Grid Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                  {filteredKanji.slice(0, displayLimit).map((kanji) => (
                    <KanjiCard
                      key={kanji.id}
                      kanji={kanji}
                      isStarred={progress.starred.includes(kanji.id)}
                      isMastered={progress.mastered.includes(kanji.id)}
                      onSelect={(k) => setActiveKanji(k)}
                      onToggleStar={handleToggleStar}
                    />
                  ))}
                </div>

                {/* Load More Button */}
                {displayLimit < filteredKanji.length && (
                  <div className="flex justify-center mt-8">
                    <button
                      onClick={() => setDisplayLimit((prev) => prev + ITEMS_PER_PAGE)}
                      className="px-6 py-2.5 bg-zinc-900 hover:bg-zinc-850 text-xs font-mono text-zinc-300 hover:text-white rounded-xl border border-zinc-800 hover:border-zinc-700 transition shadow-sm"
                    >
                      Tải thêm {Math.min(ITEMS_PER_PAGE, filteredKanji.length - displayLimit)} chữ tiếp theo
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
            isStarred={(id) => progress.starred.includes(id)}
            isMastered={(id) => progress.mastered.includes(id)}
            onToggleStar={handleToggleStar}
            onToggleMaster={handleToggleMaster}
          />
        )}

        {currentMode === 'quiz' && <QuizMode kanjiList={filteredKanji} />}

        {currentMode === 'strokes' && (
          <StrokeOrderPad
            kanjiList={filteredKanji}
            currentIndex={padIndex}
            onNavigate={(newIdx) => setPadIndex(newIdx)}
            isStarred={filteredKanji[padIndex] ? progress.starred.includes(filteredKanji[padIndex].id) : false}
            isMastered={filteredKanji[padIndex] ? progress.mastered.includes(filteredKanji[padIndex].id) : false}
            onToggleStar={handleToggleStar}
            onToggleMaster={handleToggleMaster}
          />
        )}
      </main>

      {/* Kanji Detail Modal */}
      {activeKanji && (
        <KanjiDetailModal
          kanji={activeKanji}
          onClose={() => setActiveKanji(null)}
          onPrev={activeKanjiIndex > 0 ? handleModalPrev : undefined}
          onNext={activeKanjiIndex < filteredKanji.length - 1 ? handleModalNext : undefined}
          isStarred={progress.starred.includes(activeKanji.id)}
          isMastered={progress.mastered.includes(activeKanji.id)}
          onToggleStar={handleToggleStar}
          onToggleMaster={handleToggleMaster}
        />
      )}

      {/* Footer */}
      <footer className="mt-auto border-t border-zinc-800/80 bg-zinc-950/60 py-6 text-center text-xs text-zinc-500 font-mono">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div>
            Kanji Helper • N5 → N1 ({KANJI_DATA.length.toLocaleString()} Hán tự chuẩn)
          </div>
          <div className="flex items-center gap-4 text-zinc-400">
            <span>Dữ liệu: OpenJLPT + KanjiDictVN + KanjiVG</span>
            <span>•</span>
            <a
              href="https://github.com/kei-kochiya/kanji-helper"
              target="_blank"
              rel="noopener noreferrer"
              className="text-zinc-300 hover:text-white underline transition"
            >
              GitHub
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
