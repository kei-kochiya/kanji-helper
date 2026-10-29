export type JLPTLevel = 'N5' | 'N4' | 'N3' | 'N2' | 'N1';

export interface KanjiItem {
  id: string;          // Kanji character (e.g. "日")
  c: string;           // Character
  lvl: JLPTLevel;      // JLPT Level
  hv: string[];        // Sino-Vietnamese (Hán Việt), e.g. ["NHẬT", "NHỰT"]
  m_vi: string[];      // Vietnamese meanings, e.g. ["Mặt trời", "ngày"]
  m_en: string[];      // English meanings, e.g. ["day", "sun", "Japan"]
  on: string[];        // Onyomi, e.g. ["ニチ", "ジツ"]
  kun: string[];       // Kunyomi, e.g. ["ひ", "-び", "-か"]
  st: number;          // Stroke count
  rad: string;         // Radical character
  rad_vi?: string;     // Radical name in Vietnamese
  words: string[];     // Example words (Jukugo)
  code: string;        // 5-digit hex unicode for KanjiVG SVG
}

export type ViewMode = 'grid' | 'flashcard' | 'quiz' | 'strokes';

export interface UserProgress {
  starred: string[];       // Kanji IDs that are bookmarked
  mastered: string[];      // Kanji IDs marked as mastered
}

export type SortOption = 'default' | 'strokes_asc' | 'strokes_desc' | 'random';
export type StatusFilter = 'all' | 'starred' | 'unmastered' | 'mastered';

/** Filter choices remembered between visits (the search box is not). */
export interface FilterPrefs {
  levels: JLPTLevel[];
  status: StatusFilter;
  sort: SortOption;
}
