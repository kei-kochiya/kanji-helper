import React, { useState, useEffect, useMemo } from 'react';
import confetti from 'canvas-confetti';
import {
  Volume2,
  Trophy,
  Flame,
  CheckCircle,
  XCircle,
  Settings2,
  LogOut,
  Play,
  RotateCcw,
  ArrowRight,
  Sliders,
  Check,
} from 'lucide-react';
import type { KanjiItem } from '../types/kanji';
import { speakJapanese } from '../utils/speech';

export type QuizQuestionType =
  | 'kanji-to-meaning'
  | 'hanviet-to-kanji'
  | 'kunyomi-to-kanji'
  | 'onyomi-to-kanji'
  | 'kanji-to-kunyomi'
  | 'kanji-to-onyomi';

interface QuizTypeConfig {
  id: QuizQuestionType;
  title: string;
  badge: string;
  description: string;
  example: string;
}

const ALL_QUIZ_TYPES: QuizTypeConfig[] = [
  {
    id: 'kanji-to-meaning',
    title: 'Kanji → Hán Việt & Nghĩa',
    badge: 'Hán Việt',
    description: 'Nhìn chữ Hán, đoán âm Hán Việt và nghĩa tiếng Việt',
    example: '日 → NHẬT (Mặt trời, ngày)',
  },
  {
    id: 'hanviet-to-kanji',
    title: 'Hán Việt → Kanji',
    badge: 'Chữ Hán',
    description: 'Cho âm Hán Việt, chọn chữ Hán duy nhất có âm này',
    example: 'HỌC → 学',
  },
  {
    id: 'kunyomi-to-kanji',
    title: 'Kunyomi → Kanji',
    badge: 'Kun → Kanji',
    description: 'Cho âm Kunyomi tiếng Nhật, chọn chữ Hán duy nhất phù hợp',
    example: 'よ.む → 読',
  },
  {
    id: 'onyomi-to-kanji',
    title: 'Onyomi → Kanji',
    badge: 'On → Kanji',
    description: 'Cho âm Onyomi Katakana, chọn chữ Hán duy nhất phù hợp',
    example: 'ガク → 学',
  },
  {
    id: 'kanji-to-kunyomi',
    title: 'Kanji → Kunyomi',
    badge: 'Kanji → Kun',
    description: 'Nhìn chữ Hán, chọn âm đọc thuần Nhật Kunyomi chuẩn',
    example: '読 → よ.む',
  },
  {
    id: 'kanji-to-onyomi',
    title: 'Kanji → Onyomi',
    badge: 'Kanji → On',
    description: 'Nhìn chữ Hán, chọn âm Hán Nhật Onyomi Katakana chuẩn',
    example: '学 → ガク',
  },
];

interface QuizOption {
  id: string;
  primaryText: string;
  secondaryText?: string;
  isKanji: boolean;
  isCorrect: boolean;
  audioText?: string;
}

interface Question {
  id: string;
  type: QuizQuestionType;
  promptCategory: string;
  promptQuestion: string;
  promptMain: string;
  promptSub?: string;
  promptAudio?: string;
  targetKanji: KanjiItem;
  options: QuizOption[];
}

interface AnswerHistory {
  question: Question;
  selectedOption: QuizOption;
  isCorrect: boolean;
}

interface QuizModeProps {
  kanjiList: KanjiItem[];
}

/**
 * Helper to build an entire Quiz Deck without duplicate target Kanji
 */
function buildQuizDeck(
  pool: KanjiItem[],
  types: QuizQuestionType[],
  limit: number
): Question[] {
  if (pool.length < 4 || types.length === 0) return [];

  // Determine actual question count (clamped to pool size to guarantee zero target repetition)
  const targetCount = Math.min(limit, pool.length);

  // Shuffle pool to pick `targetCount` distinct target Kanji
  const shuffledPool = [...pool].sort(() => Math.random() - 0.5);

  // Pre-collect unique readings across the pool for rich distractor selection
  const allUniqueOns = Array.from(new Set(pool.flatMap((k) => k.on)));
  const allUniqueKuns = Array.from(new Set(pool.flatMap((k) => k.kun)));

  const deck: Question[] = [];
  const usedTargetIds = new Set<string>();

  for (let i = 0; i < shuffledPool.length && deck.length < targetCount; i++) {
    const target = shuffledPool[i];
    if (usedTargetIds.has(target.id)) continue;

    // Filter question types this specific target can support
    const eligibleTypes = types.filter((t) => {
      if (t === 'kunyomi-to-kanji' || t === 'kanji-to-kunyomi') {
        return target.kun && target.kun.length > 0;
      }
      if (t === 'onyomi-to-kanji' || t === 'kanji-to-onyomi') {
        return target.on && target.on.length > 0;
      }
      if (t === 'hanviet-to-kanji') {
        return target.hv && target.hv.length > 0;
      }
      return true; // kanji-to-meaning is always eligible
    });

    if (eligibleTypes.length === 0) continue;

    // Rotate or pick a type from eligible types
    const chosenType = eligibleTypes[deck.length % eligibleTypes.length];
    const question = createSingleQuestion(target, chosenType, pool, allUniqueOns, allUniqueKuns);

    if (question) {
      deck.push(question);
      usedTargetIds.add(target.id);
    }
  }

  return deck;
}

function createSingleQuestion(
  target: KanjiItem,
  type: QuizQuestionType,
  pool: KanjiItem[],
  allUniqueOns: string[],
  allUniqueKuns: string[]
): Question | null {
  switch (type) {
    case 'kunyomi-to-kanji': {
      if (!target.kun || target.kun.length === 0) return null;
      const chosenReading = target.kun[Math.floor(Math.random() * target.kun.length)];

      // 3 Distractors: MUST NOT have chosenReading in their kunyomi list!
      const validDistractors = pool.filter(
        (k) => k.id !== target.id && !k.kun.includes(chosenReading)
      );
      if (validDistractors.length < 3) return null;
      const shuffledDistractors = [...validDistractors].sort(() => Math.random() - 0.5).slice(0, 3);

      const rawOptions: QuizOption[] = [
        {
          id: target.id,
          primaryText: target.c,
          secondaryText: target.hv.slice(0, 2).join(' • '),
          isKanji: true,
          isCorrect: true,
          audioText: target.c,
        },
        ...shuffledDistractors.map((d) => ({
          id: d.id,
          primaryText: d.c,
          secondaryText: d.hv.slice(0, 2).join(' • '),
          isKanji: true,
          isCorrect: false,
          audioText: d.c,
        })),
      ].sort(() => Math.random() - 0.5);

      return {
        id: `${target.id}-kun-to-kanji-${Math.random()}`,
        type,
        promptCategory: 'Kunyomi → Kanji',
        promptQuestion: 'Chọn chữ Kanji duy nhất có âm đọc Kunyomi:',
        promptMain: chosenReading,
        promptSub: `Cấp độ ${target.lvl} • Hán Việt: ${target.hv[0] || ''}`,
        promptAudio: chosenReading,
        targetKanji: target,
        options: rawOptions,
      };
    }

    case 'onyomi-to-kanji': {
      if (!target.on || target.on.length === 0) return null;
      const chosenReading = target.on[Math.floor(Math.random() * target.on.length)];

      // 3 Distractors: MUST NOT have chosenReading in their onyomi list!
      const validDistractors = pool.filter(
        (k) => k.id !== target.id && !k.on.includes(chosenReading)
      );
      if (validDistractors.length < 3) return null;
      const shuffledDistractors = [...validDistractors].sort(() => Math.random() - 0.5).slice(0, 3);

      const rawOptions: QuizOption[] = [
        {
          id: target.id,
          primaryText: target.c,
          secondaryText: target.hv.slice(0, 2).join(' • '),
          isKanji: true,
          isCorrect: true,
          audioText: target.c,
        },
        ...shuffledDistractors.map((d) => ({
          id: d.id,
          primaryText: d.c,
          secondaryText: d.hv.slice(0, 2).join(' • '),
          isKanji: true,
          isCorrect: false,
          audioText: d.c,
        })),
      ].sort(() => Math.random() - 0.5);

      return {
        id: `${target.id}-on-to-kanji-${Math.random()}`,
        type,
        promptCategory: 'Onyomi → Kanji',
        promptQuestion: 'Chọn chữ Kanji duy nhất có âm đọc Onyomi:',
        promptMain: chosenReading,
        promptSub: `Cấp độ ${target.lvl} • Hán Việt: ${target.hv[0] || ''}`,
        promptAudio: chosenReading,
        targetKanji: target,
        options: rawOptions,
      };
    }

    case 'hanviet-to-kanji': {
      if (!target.hv || target.hv.length === 0) return null;
      const chosenHv = target.hv[Math.floor(Math.random() * target.hv.length)];

      // 3 Distractors: MUST NOT have chosenHv in their hv list!
      const validDistractors = pool.filter(
        (k) => k.id !== target.id && !k.hv.includes(chosenHv)
      );
      if (validDistractors.length < 3) return null;
      const shuffledDistractors = [...validDistractors].sort(() => Math.random() - 0.5).slice(0, 3);

      const rawOptions: QuizOption[] = [
        {
          id: target.id,
          primaryText: target.c,
          secondaryText: `${target.st} nét • Bộ ${target.rad}`,
          isKanji: true,
          isCorrect: true,
          audioText: target.c,
        },
        ...shuffledDistractors.map((d) => ({
          id: d.id,
          primaryText: d.c,
          secondaryText: `${d.st} nét • Bộ ${d.rad}`,
          isKanji: true,
          isCorrect: false,
          audioText: d.c,
        })),
      ].sort(() => Math.random() - 0.5);

      return {
        id: `${target.id}-hv-to-kanji-${Math.random()}`,
        type,
        promptCategory: 'Hán Việt → Kanji',
        promptQuestion: 'Chọn chữ Kanji tương ứng với âm Hán Việt:',
        promptMain: chosenHv,
        promptSub: `Nghĩa: ${target.m_vi.slice(0, 2).join(', ')}`,
        promptAudio: target.c,
        targetKanji: target,
        options: rawOptions,
      };
    }

    case 'kanji-to-kunyomi': {
      if (!target.kun || target.kun.length === 0) return null;
      const correctReading = target.kun[Math.floor(Math.random() * target.kun.length)];

      // Pick 3 distractor Kunyomi from the entire pool that DO NOT belong to target
      const validDistractorKuns = allUniqueKuns.filter((r) => !target.kun.includes(r));
      if (validDistractorKuns.length < 3) return null;
      const shuffledKuns = [...validDistractorKuns].sort(() => Math.random() - 0.5).slice(0, 3);

      const rawOptions: QuizOption[] = [
        {
          id: `kun-correct-${correctReading}`,
          primaryText: correctReading,
          isKanji: false,
          isCorrect: true,
          audioText: correctReading,
        },
        ...shuffledKuns.map((r, i) => ({
          id: `kun-distractor-${i}-${r}`,
          primaryText: r,
          isKanji: false,
          isCorrect: false,
          audioText: r,
        })),
      ].sort(() => Math.random() - 0.5);

      return {
        id: `${target.id}-kanji-to-kun-${Math.random()}`,
        type,
        promptCategory: 'Kanji → Kunyomi',
        promptQuestion: 'Chọn âm đọc Kunyomi tiếng Nhật cho chữ Hán:',
        promptMain: target.c,
        promptSub: `Hán Việt: ${target.hv.join(' • ')} (${target.m_vi.slice(0, 2).join(', ')})`,
        promptAudio: target.c,
        targetKanji: target,
        options: rawOptions,
      };
    }

    case 'kanji-to-onyomi': {
      if (!target.on || target.on.length === 0) return null;
      const correctReading = target.on[Math.floor(Math.random() * target.on.length)];

      // Pick 3 distractor Onyomi from the entire pool that DO NOT belong to target
      const validDistractorOns = allUniqueOns.filter((r) => !target.on.includes(r));
      if (validDistractorOns.length < 3) return null;
      const shuffledOns = [...validDistractorOns].sort(() => Math.random() - 0.5).slice(0, 3);

      const rawOptions: QuizOption[] = [
        {
          id: `on-correct-${correctReading}`,
          primaryText: correctReading,
          isKanji: false,
          isCorrect: true,
          audioText: correctReading,
        },
        ...shuffledOns.map((r, i) => ({
          id: `on-distractor-${i}-${r}`,
          primaryText: r,
          isKanji: false,
          isCorrect: false,
          audioText: r,
        })),
      ].sort(() => Math.random() - 0.5);

      return {
        id: `${target.id}-kanji-to-on-${Math.random()}`,
        type,
        promptCategory: 'Kanji → Onyomi',
        promptQuestion: 'Chọn âm đọc Onyomi Katakana cho chữ Hán:',
        promptMain: target.c,
        promptSub: `Hán Việt: ${target.hv.join(' • ')} (${target.m_vi.slice(0, 2).join(', ')})`,
        promptAudio: target.c,
        targetKanji: target,
        options: rawOptions,
      };
    }

    case 'kanji-to-meaning':
    default: {
      const validDistractors = pool.filter(
        (k) => k.id !== target.id && k.hv.join('') !== target.hv.join('')
      );
      if (validDistractors.length < 3) return null;
      const shuffledDistractors = [...validDistractors].sort(() => Math.random() - 0.5).slice(0, 3);

      const rawOptions: QuizOption[] = [
        {
          id: target.id,
          primaryText: target.hv.join(' • '),
          secondaryText: target.m_vi.join(', '),
          isKanji: false,
          isCorrect: true,
          audioText: target.c,
        },
        ...shuffledDistractors.map((d) => ({
          id: d.id,
          primaryText: d.hv.join(' • '),
          secondaryText: d.m_vi.join(', '),
          isKanji: false,
          isCorrect: false,
          audioText: d.c,
        })),
      ].sort(() => Math.random() - 0.5);

      return {
        id: `${target.id}-kanji-to-meaning-${Math.random()}`,
        type,
        promptCategory: 'Kanji → Hán Việt & Nghĩa',
        promptQuestion: 'Chọn âm Hán Việt & nghĩa đúng cho chữ Kanji:',
        promptMain: target.c,
        promptSub: `${target.lvl} • ${target.st} nét • Bộ ${target.rad}`,
        promptAudio: target.c,
        targetKanji: target,
        options: rawOptions,
      };
    }
  }
}

export const QuizMode: React.FC<QuizModeProps> = ({ kanjiList }) => {
  // Session State
  const [gameState, setGameState] = useState<'setup' | 'playing' | 'summary'>('setup');

  // Setup Options
  const [selectedTypes, setSelectedTypes] = useState<Set<QuizQuestionType>>(
    () =>
      new Set<QuizQuestionType>([
        'kanji-to-meaning',
        'hanviet-to-kanji',
        'kunyomi-to-kanji',
        'onyomi-to-kanji',
      ])
  );
  const [questionLimit, setQuestionLimit] = useState<number>(10);

  // Pre-generated Deck State (Guarantees zero duplicate targets across the session!)
  const [quizDeck, setQuizDeck] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [selectedOption, setSelectedOption] = useState<QuizOption | null>(null);
  const [isAnswered, setIsAnswered] = useState<boolean>(false);
  const [score, setScore] = useState<number>(0);
  const [streak, setStreak] = useState<number>(0);
  const [maxStreak, setMaxStreak] = useState<number>(0);
  const [history, setHistory] = useState<AnswerHistory[]>([]);

  // Max selectable questions based on current filtered pool
  const maxAvailable = useMemo(() => kanjiList.length, [kanjiList.length]);

  // Toggle Type Selection (Enforce at least 1 selected)
  const handleToggleType = (typeId: QuizQuestionType) => {
    setSelectedTypes((prev) => {
      const next = new Set(prev);
      if (next.has(typeId)) {
        if (next.size > 1) {
          next.delete(typeId);
        }
      } else {
        next.add(typeId);
      }
      return next;
    });
  };

  const handleSelectAllTypes = () => {
    setSelectedTypes(new Set<QuizQuestionType>(ALL_QUIZ_TYPES.map((t) => t.id)));
  };

  // Start a new Quiz session
  const startQuiz = () => {
    const deck = buildQuizDeck(kanjiList, Array.from(selectedTypes), questionLimit);
    if (deck.length === 0) {
      alert('Không đủ dữ liệu Kanji phù hợp với các dạng câu hỏi đã chọn trong bộ lọc hiện tại.');
      return;
    }

    setQuizDeck(deck);
    setCurrentQuestionIndex(0);
    setScore(0);
    setStreak(0);
    setMaxStreak(0);
    setHistory([]);
    setSelectedOption(null);
    setIsAnswered(false);
    setGameState('playing');
  };

  // Advance to next question or show summary
  const handleAdvance = () => {
    const nextIndex = currentQuestionIndex + 1;
    if (nextIndex >= quizDeck.length) {
      setGameState('summary');
      if (score / quizDeck.length >= 0.7) {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });
      }
    } else {
      setCurrentQuestionIndex(nextIndex);
      setSelectedOption(null);
      setIsAnswered(false);
    }
  };

  // Quit early
  const handleQuitEarly = () => {
    if (history.length > 0) {
      setGameState('summary');
    } else {
      setGameState('setup');
    }
  };

  // Handle Option Click
  const handleSelectOption = (opt: QuizOption) => {
    const currentQ = quizDeck[currentQuestionIndex];
    if (isAnswered || !currentQ) return;

    setSelectedOption(opt);
    setIsAnswered(true);

    const isCorrect = opt.isCorrect;
    if (isCorrect) {
      const newStreak = streak + 1;
      setScore((prev) => prev + 1);
      setStreak(newStreak);
      if (newStreak > maxStreak) setMaxStreak(newStreak);

      if (newStreak % 5 === 0) {
        confetti({
          particleCount: 40,
          spread: 50,
          origin: { y: 0.6 },
        });
      }
    } else {
      setStreak(0);
    }

    setHistory((prev) => [
      ...prev,
      {
        question: currentQ,
        selectedOption: opt,
        isCorrect,
      },
    ]);
  };

  const currentQuestion = quizDeck[currentQuestionIndex];

  // Keyboard Navigation: 1, 2, 3, 4, Enter/Space
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameState !== 'playing' || !currentQuestion) return;

      if (['Digit1', 'Digit2', 'Digit3', 'Digit4'].includes(e.code)) {
        const index = parseInt(e.code.replace('Digit', '')) - 1;
        if (currentQuestion.options[index] && !isAnswered) {
          handleSelectOption(currentQuestion.options[index]);
        }
      } else if ((e.code === 'Space' || e.code === 'Enter') && isAnswered) {
        e.preventDefault();
        handleAdvance();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState, currentQuestion, isAnswered]);

  if (kanjiList.length < 4) {
    return (
      <div className="text-center py-24 text-zinc-500">
        Cần tối thiểu 4 chữ Kanji trong bộ lọc hiện tại để bắt đầu trắc nghiệm.
      </div>
    );
  }

  // 1. SETUP SCREEN
  if (gameState === 'setup') {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="bg-zinc-900/90 rounded-2xl border border-zinc-800 p-6 sm:p-8 shadow-2xl">
          {/* Header */}
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-zinc-800">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center">
                <Sliders className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-zinc-100">Cấu hình bài trắc nghiệm</h2>
                <p className="text-xs text-zinc-400">
                  Tùy chỉnh dạng câu hỏi và giới hạn số câu (đảm bảo không lặp lại chữ Hán)
                </p>
              </div>
            </div>

            <span className="text-xs font-mono text-zinc-400 bg-zinc-800 px-2.5 py-1 rounded-lg border border-zinc-700">
              {maxAvailable} chữ trong bộ lọc
            </span>
          </div>

          {/* 1. Question Type Selection */}
          <div className="space-y-3 mb-6">
            <div className="flex items-center justify-between">
              <label className="text-xs font-mono uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                <span>Dạng câu hỏi (Chọn ít nhất 1 loại):</span>
              </label>

              <button
                type="button"
                onClick={handleSelectAllTypes}
                className="text-xs text-blue-400 hover:text-blue-300 transition"
              >
                Chọn tất cả
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {ALL_QUIZ_TYPES.map((type) => {
                const isSelected = selectedTypes.has(type.id);
                return (
                  <button
                    key={type.id}
                    type="button"
                    onClick={() => handleToggleType(type.id)}
                    className={`p-3 rounded-xl border text-left transition-all flex items-start gap-3 select-none ${
                      isSelected
                        ? 'bg-zinc-800/90 border-blue-500/60 shadow-sm shadow-blue-950/20'
                        : 'bg-zinc-950/50 border-zinc-850 hover:border-zinc-750 text-zinc-400'
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded mt-0.5 flex items-center justify-center shrink-0 border transition ${
                        isSelected
                          ? 'bg-blue-600 border-blue-500 text-white'
                          : 'border-zinc-700 bg-zinc-900'
                      }`}
                    >
                      {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1">
                        <span className={`text-xs font-bold ${isSelected ? 'text-zinc-100' : 'text-zinc-400'}`}>
                          {type.title}
                        </span>
                      </div>
                      <p className="text-[11px] text-zinc-400 mt-0.5 line-clamp-1">
                        {type.description}
                      </p>
                      <span className="text-[10px] font-mono text-zinc-500 mt-1 block">
                        Ví dụ: {type.example}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Question Limit Selection */}
          <div className="space-y-3 mb-8">
            <div className="flex items-center justify-between">
              <label className="text-xs font-mono uppercase tracking-wider text-zinc-400 block">
                Giới hạn số câu hỏi:
              </label>
              <span className="text-[11px] text-zinc-500 font-mono">
                Mỗi câu hỏi 1 chữ Hán riêng biệt
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {[5, 10, 15, 20, 30, 50].map((num) => {
                const isPossible = num <= maxAvailable;
                return (
                  <button
                    key={num}
                    type="button"
                    onClick={() => isPossible && setQuestionLimit(num)}
                    disabled={!isPossible}
                    className={`px-3.5 py-2 rounded-xl text-xs font-mono font-medium border transition ${
                      questionLimit === num
                        ? 'bg-blue-600 text-white border-blue-500 font-bold shadow-md shadow-blue-950/40'
                        : isPossible
                        ? 'bg-zinc-950/60 text-zinc-400 border-zinc-800 hover:border-zinc-700 hover:text-zinc-200'
                        : 'bg-zinc-950/30 text-zinc-600 border-zinc-900 opacity-40 cursor-not-allowed'
                    }`}
                  >
                    {num} câu
                  </button>
                );
              })}

              <div className="flex items-center gap-1.5 ml-auto">
                <span className="text-xs text-zinc-400">Tùy chọn:</span>
                <input
                  type="number"
                  min="3"
                  max={maxAvailable}
                  value={Math.min(questionLimit, maxAvailable)}
                  onChange={(e) =>
                    setQuestionLimit(
                      Math.max(3, Math.min(maxAvailable, parseInt(e.target.value) || 10))
                    )
                  }
                  className="w-16 bg-zinc-950 border border-zinc-800 rounded-lg px-2 py-1 text-xs text-center font-mono text-zinc-200 focus:outline-none focus:border-zinc-600"
                />
              </div>
            </div>
          </div>

          {/* Start Quiz Action */}
          <button
            type="button"
            onClick={startQuiz}
            className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 active:scale-98 text-white font-medium text-sm rounded-xl transition shadow-lg shadow-blue-900/30 flex items-center justify-center gap-2"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>
              Bắt đầu bài trắc nghiệm ({Math.min(questionLimit, maxAvailable)} câu duy nhất)
            </span>
          </button>
        </div>
      </div>
    );
  }

  // 2. SUMMARY / RESULT SCREEN
  if (gameState === 'summary') {
    const totalQuestions = history.length;
    const correctCount = history.filter((h) => h.isCorrect).length;
    const percentage = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;

    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="bg-zinc-900/90 rounded-2xl border border-zinc-800 p-6 sm:p-8 shadow-2xl text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-zinc-950 border border-zinc-800 flex items-center justify-center text-3xl shadow-inner">
            {percentage >= 80 ? '🎉' : percentage >= 50 ? '👏' : '💪'}
          </div>

          <h2 className="text-2xl font-bold text-zinc-100 mb-1">
            {percentage >= 80 ? 'Xuất sắc!' : percentage >= 50 ? 'Làm tốt lắm!' : 'Cần cố gắng thêm!'}
          </h2>
          <p className="text-xs text-zinc-400 mb-6">
            Đã hoàn thành {totalQuestions} câu hỏi trắc nghiệm không lặp lại
          </p>

          {/* Stats Bar */}
          <div className="grid grid-cols-3 gap-3 bg-zinc-950/70 p-4 rounded-xl border border-zinc-800/80 mb-6">
            <div>
              <span className="text-[10px] text-zinc-500 font-mono uppercase block">Điểm số</span>
              <span className="text-xl font-bold text-zinc-100 font-mono">
                {correctCount} / {totalQuestions}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-zinc-500 font-mono uppercase block">Tỷ lệ đúng</span>
              <span
                className={`text-xl font-bold font-mono ${
                  percentage >= 70 ? 'text-emerald-400' : 'text-amber-400'
                }`}
              >
                {percentage}%
              </span>
            </div>
            <div>
              <span className="text-[10px] text-zinc-500 font-mono uppercase block">Chuỗi cao nhất</span>
              <span className="text-xl font-bold text-orange-400 font-mono flex items-center justify-center gap-1">
                <Flame className="w-4 h-4" />
                <span>{maxStreak}</span>
              </span>
            </div>
          </div>

          {/* Answer History Review List */}
          <div className="text-left mb-6">
            <h3 className="text-xs font-mono uppercase tracking-wider text-zinc-400 mb-2">
              Xem lại các câu hỏi vừa làm ({history.length}):
            </h3>
            <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
              {history.map((h, idx) => (
                <div
                  key={idx}
                  className={`p-2.5 rounded-lg border text-xs flex items-center justify-between ${
                    h.isCorrect
                      ? 'bg-emerald-950/20 border-emerald-500/30 text-zinc-200'
                      : 'bg-rose-950/20 border-rose-500/30 text-zinc-200'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-zinc-500">#{idx + 1}</span>
                    <span className="text-base font-kanji font-bold text-white">
                      {h.question.promptMain}
                    </span>
                    <span className="text-zinc-400 text-[11px]">
                      ({h.question.promptCategory})
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className={h.isCorrect ? 'text-emerald-400' : 'text-rose-400'}>
                      {h.selectedOption.primaryText}
                    </span>
                    {h.isCorrect ? (
                      <CheckCircle className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <XCircle className="w-4 h-4 text-rose-400" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setGameState('setup')}
              className="py-3 px-4 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-medium text-xs rounded-xl border border-zinc-700 transition flex items-center justify-center gap-1.5"
            >
              <Settings2 className="w-4 h-4" />
              <span>Cấu hình bài mới</span>
            </button>

            <button
              onClick={startQuiz}
              className="py-3 px-4 bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs rounded-xl transition flex items-center justify-center gap-1.5 shadow-md shadow-blue-900/40"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Làm bài thi mới (Bộ chữ khác)</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 3. IN-PLAY SCREEN
  if (!currentQuestion) return null;

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      {/* Top Session Bar with Quit Option */}
      <div className="flex items-center justify-between bg-zinc-900/60 px-4 py-3 rounded-2xl border border-zinc-800 mb-4">
        {/* Left: Progress count */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono font-bold text-zinc-200 bg-zinc-800 px-2.5 py-1 rounded-lg border border-zinc-700">
            Câu {currentQuestionIndex + 1} / {quizDeck.length}
          </span>
          <div className="w-24 sm:w-32 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 transition-all duration-200"
              style={{ width: `${((currentQuestionIndex + 1) / quizDeck.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Center: Score & Streak */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 text-amber-400 font-mono text-xs">
            <Trophy className="w-3.5 h-3.5" />
            <span>{score} đúng</span>
          </div>

          <div className="flex items-center gap-1 text-orange-400 font-mono text-xs">
            <Flame className="w-3.5 h-3.5" />
            <span>{streak} chuỗi</span>
          </div>
        </div>

        {/* Right: Quit Early Button */}
        <button
          onClick={handleQuitEarly}
          className="text-xs text-zinc-400 hover:text-rose-400 flex items-center gap-1 bg-zinc-800/80 hover:bg-rose-950/30 px-2.5 py-1 rounded-lg border border-zinc-700/60 transition"
          title="Thoát trắc nghiệm trước khi hết câu"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Thoát sớm</span>
        </button>
      </div>

      {/* Main Question Card */}
      <div className="bg-zinc-900/90 rounded-2xl border border-zinc-800 p-8 shadow-2xl text-center mb-6">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-mono px-2.5 py-0.5 rounded-full bg-zinc-800 text-zinc-400 border border-zinc-700">
            {currentQuestion.promptCategory}
          </span>

          {currentQuestion.promptAudio && (
            <button
              onClick={() => speakJapanese(currentQuestion.promptAudio || '')}
              className="p-1.5 text-zinc-400 hover:text-blue-400 bg-zinc-800 rounded-lg transition"
              title="Nghe phát âm tiếng Nhật"
            >
              <Volume2 className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="text-xs text-zinc-400 mb-2 font-mono uppercase tracking-wider">
          {currentQuestion.promptQuestion}
        </div>

        {/* Big Prompt Display */}
        <div className="my-4">
          <div
            className={`font-kanji text-zinc-100 select-none ${
              currentQuestion.promptMain.length <= 2 ? 'text-8xl' : 'text-4xl font-bold tracking-wide'
            }`}
          >
            {currentQuestion.promptMain}
          </div>

          {currentQuestion.promptSub && (
            <div className="text-sm text-zinc-400 mt-2 font-medium">
              {currentQuestion.promptSub}
            </div>
          )}
        </div>
      </div>

      {/* 4 Multiple Choice Options */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        {currentQuestion.options.map((opt, idx) => {
          const isSelected = selectedOption?.id === opt.id;

          let btnStyle =
            'bg-zinc-900/70 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-850 text-zinc-200';
          if (isAnswered) {
            if (opt.isCorrect) {
              btnStyle =
                'bg-emerald-950/40 border-emerald-500 text-emerald-300 shadow-md shadow-emerald-950/30';
            } else if (isSelected) {
              btnStyle = 'bg-rose-950/40 border-rose-500 text-rose-300';
            } else {
              btnStyle = 'bg-zinc-900/30 border-zinc-800/40 text-zinc-600 opacity-60';
            }
          }

          return (
            <button
              key={opt.id}
              onClick={() => handleSelectOption(opt)}
              disabled={isAnswered}
              className={`p-4 rounded-xl border text-left transition-all duration-150 flex items-center justify-between group ${btnStyle}`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className="w-6 h-6 rounded-md bg-zinc-800/80 border border-zinc-700/60 text-xs font-mono text-zinc-400 flex items-center justify-center shrink-0">
                  {idx + 1}
                </span>

                <div className="min-w-0">
                  <div
                    className={`font-bold ${
                      opt.isKanji
                        ? 'text-3xl font-kanji text-zinc-100'
                        : 'text-base font-kanji text-zinc-200 truncate'
                    }`}
                  >
                    {opt.primaryText}
                  </div>

                  {opt.secondaryText && (
                    <div className="text-xs text-zinc-400 truncate mt-0.5">
                      {opt.secondaryText}
                    </div>
                  )}
                </div>
              </div>

              {isAnswered && (
                <div className="shrink-0 ml-2">
                  {opt.isCorrect && <CheckCircle className="w-5 h-5 text-emerald-400" />}
                  {isSelected && !opt.isCorrect && <XCircle className="w-5 h-5 text-rose-400" />}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Next Question / Finish Button */}
      {isAnswered && (
        <div className="mt-6 flex justify-center animate-in fade-in duration-200">
          <button
            onClick={handleAdvance}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-500 active:scale-95 text-white font-medium text-sm rounded-xl transition shadow-lg shadow-blue-900/40 flex items-center gap-2"
          >
            <span>
              {currentQuestionIndex + 1 >= quizDeck.length
                ? 'Xem kết quả tổng kết'
                : 'Câu tiếp theo'}
            </span>
            <span className="text-xs font-mono opacity-80">[Enter]</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="text-[11px] text-zinc-500 mt-6 text-center font-mono">
        Bấm phím [1, 2, 3, 4] để chọn đáp án • [Enter] hoặc [Phím Cách] để tiếp tục
      </div>
    </div>
  );
};
