import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import { Volume2, Trophy, Flame, CheckCircle2, XCircle, Settings2, LogOut, Play, RotateCcw, ArrowRight, Check } from 'lucide-react';
import type { KanjiItem } from '../types/kanji';
import { speakJapanese } from '../utils/speech';
import { prefersReducedMotion } from '../utils/motion';
import { ALL_QUIZ_TYPES, buildQuizDeck, optionKind, promptKind } from '../utils/quiz';
import type { Question, QuizOption, QuizQuestionType } from '../utils/quiz';

interface AnswerHistory {
  question: Question;
  selectedOption: QuizOption;
  isCorrect: boolean;
}

interface QuizModeProps {
  kanjiList: KanjiItem[];
  isMastered?: (id: string) => boolean;
  onToggleMaster?: (id: string) => void;
}

const CONFETTI_COLORS = ['#ef6b4c', '#e3b155', '#ede7dd', '#86c99a'];

function celebrate(particleCount: number) {
  if (prefersReducedMotion()) return;
  confetti({ particleCount, spread: 64, origin: { y: 0.65 }, colors: CONFETTI_COLORS, disableForReducedMotion: true });
}

const LIMIT_PRESETS = [5, 10, 15, 20, 30, 50];

const primaryButton =
  'inline-flex items-center justify-center gap-2 rounded-xl bg-shu-600 hover:bg-shu-700 text-white font-medium transition-colors cursor-pointer';
const secondaryButton =
  'inline-flex items-center justify-center gap-2 rounded-xl bg-ink-850 hover:bg-ink-800 border border-line text-paper font-medium transition-colors cursor-pointer';

export const QuizMode: React.FC<QuizModeProps> = ({ kanjiList, isMastered, onToggleMaster }) => {
  const [gameState, setGameState] = useState<'setup' | 'playing' | 'summary'>('setup');

  const [selectedTypes, setSelectedTypes] = useState<Set<QuizQuestionType>>(
    () => new Set<QuizQuestionType>(['kanji-to-meaning', 'hanviet-to-kanji', 'kunyomi-to-kanji', 'onyomi-to-kanji'])
  );
  const [questionLimit, setQuestionLimit] = useState<number>(10);
  const [limitDraft, setLimitDraft] = useState<string | null>(null);
  const [setupError, setSetupError] = useState<string | null>(null);

  // Pre-generated deck: no target kanji repeats within a session
  const [quizDeck, setQuizDeck] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [selectedOption, setSelectedOption] = useState<QuizOption | null>(null);
  const [isAnswered, setIsAnswered] = useState<boolean>(false);
  const [score, setScore] = useState<number>(0);
  const [streak, setStreak] = useState<number>(0);
  const [maxStreak, setMaxStreak] = useState<number>(0);
  const [history, setHistory] = useState<AnswerHistory[]>([]);
  const nextButtonRef = useRef<HTMLButtonElement | null>(null);

  const maxAvailable = kanjiList.length;
  const effectiveLimit = Math.max(1, Math.min(questionLimit, maxAvailable));

  const handleToggleType = (typeId: QuizQuestionType) => {
    setSetupError(null);
    setSelectedTypes((prev) => {
      const next = new Set(prev);
      if (next.has(typeId)) {
        if (next.size > 1) next.delete(typeId);
      } else {
        next.add(typeId);
      }
      return next;
    });
  };

  const commitLimitDraft = () => {
    if (limitDraft === null) return;
    const parsed = parseInt(limitDraft, 10);
    if (Number.isFinite(parsed)) setQuestionLimit(Math.max(3, Math.min(maxAvailable, parsed)));
    setLimitDraft(null);
  };

  const beginDeck = (deck: Question[]) => {
    if (deck.length === 0) {
      setGameState('setup');
      setSetupError('Bộ lọc hiện tại không đủ chữ phù hợp với các dạng câu hỏi đã chọn. Hãy bật thêm cấp độ hoặc chọn thêm dạng câu hỏi.');
      return;
    }
    setSetupError(null);
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

  const startQuiz = () => {
    beginDeck(buildQuizDeck(kanjiList, Array.from(selectedTypes), effectiveLimit));
  };

  const startRetryMissed = (missed: KanjiItem[]) => {
    if (missed.length === 0) return;
    beginDeck(buildQuizDeck(kanjiList, Array.from(selectedTypes), missed.length, missed));
  };

  const handleAdvance = () => {
    const nextIndex = currentQuestionIndex + 1;
    if (nextIndex >= quizDeck.length) {
      setGameState('summary');
      if (score / quizDeck.length >= 0.7) celebrate(90);
    } else {
      setCurrentQuestionIndex(nextIndex);
      setSelectedOption(null);
      setIsAnswered(false);
    }
  };

  const handleQuitEarly = () => {
    setGameState(history.length > 0 ? 'summary' : 'setup');
  };

  const handleSelectOption = (opt: QuizOption) => {
    const currentQ = quizDeck[currentQuestionIndex];
    if (isAnswered || !currentQ) return;

    setSelectedOption(opt);
    setIsAnswered(true);

    if (opt.isCorrect) {
      const newStreak = streak + 1;
      setScore((prev) => prev + 1);
      setStreak(newStreak);
      if (newStreak > maxStreak) setMaxStreak(newStreak);
      if (newStreak % 5 === 0) celebrate(40);
    } else {
      setStreak(0);
    }

    setHistory((prev) => [...prev, { question: currentQ, selectedOption: opt, isCorrect: opt.isCorrect }]);
  };

  const currentQuestion = quizDeck[currentQuestionIndex];

  // Move focus to "Câu tiếp theo" once answered so Enter/Space continue naturally
  useEffect(() => {
    if (isAnswered) nextButtonRef.current?.focus();
  }, [isAnswered]);

  // Keyboard: 1–4 (row or numpad) answer, Enter/Space continue
  const keyHandlerRef = useRef<(e: KeyboardEvent) => void>(() => {});
  useEffect(() => {
    keyHandlerRef.current = (e: KeyboardEvent) => {
      if (gameState !== 'playing' || !currentQuestion || e.altKey || e.ctrlKey || e.metaKey) return;
      const digit = /^(Digit|Numpad)([1-4])$/.exec(e.code);
      if (digit && !isAnswered) {
        const opt = currentQuestion.options[Number(digit[2]) - 1];
        if (opt) handleSelectOption(opt);
        return;
      }
      const onControl = e.target instanceof HTMLElement && e.target.closest('button, a, input, select');
      if ((e.code === 'Space' || e.key === 'Enter') && isAnswered && !onControl) {
        e.preventDefault();
        handleAdvance();
      }
    };
  });
  useEffect(() => {
    const listener = (e: KeyboardEvent) => keyHandlerRef.current(e);
    window.addEventListener('keydown', listener);
    return () => window.removeEventListener('keydown', listener);
  }, []);

  if (kanjiList.length < 4) {
    return (
      <div className="max-w-md mx-auto text-center py-20 px-6 rounded-2xl border border-dashed border-line-strong">
        <h2 className="text-base font-semibold text-paper">Chưa đủ chữ để làm trắc nghiệm</h2>
        <p className="text-sm text-paper-2 mt-1.5">
          Cần ít nhất 4 chữ trong bộ lọc hiện tại (đang có {kanjiList.length}). Hãy bật thêm cấp độ hoặc bỏ bớt điều kiện lọc.
        </p>
      </div>
    );
  }

  // 1. Setup
  if (gameState === 'setup') {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="rounded-2xl bg-ink-900 border border-line p-5 sm:p-7">
          <div className="flex flex-wrap items-start justify-between gap-3 mb-6">
            <div>
              <h2 className="text-xl font-semibold text-paper">Cấu hình bài trắc nghiệm</h2>
              <p className="text-sm text-paper-2 mt-1">Mỗi câu hỏi dùng một chữ Hán khác nhau, không lặp lại.</p>
            </div>
            <span className="text-xs text-paper-3 tabular-nums pt-1.5">
              {maxAvailable.toLocaleString('vi-VN')} chữ trong bộ lọc
            </span>
          </div>

          <fieldset className="mb-7">
            <div className="flex items-center justify-between mb-3">
              <legend className="text-sm font-semibold text-paper-2">Dạng câu hỏi</legend>
              <button
                type="button"
                onClick={() => setSelectedTypes(new Set<QuizQuestionType>(ALL_QUIZ_TYPES.map((t) => t.id)))}
                className="text-xs font-medium text-shu hover:underline underline-offset-2 cursor-pointer"
              >
                Chọn tất cả
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {ALL_QUIZ_TYPES.map((type) => {
                const isSelected = selectedTypes.has(type.id);
                return (
                  <button
                    key={type.id}
                    type="button"
                    onClick={() => handleToggleType(type.id)}
                    aria-pressed={isSelected}
                    className={`p-3 rounded-xl border text-left flex items-start gap-3 transition-colors cursor-pointer ${
                      isSelected ? 'bg-shu/8 border-shu/45' : 'bg-ink-950/50 border-line hover:border-line-strong'
                    }`}
                  >
                    <span
                      className={`w-4 h-4 mt-0.5 rounded grid place-items-center shrink-0 border transition-colors ${
                        isSelected ? 'bg-shu-600 border-shu-600 text-white' : 'border-ink-700 bg-ink-900'
                      }`}
                      aria-hidden="true"
                    >
                      {isSelected && <Check className="w-3 h-3" strokeWidth={3} />}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className={`block text-sm font-semibold ${isSelected ? 'text-paper' : 'text-paper-2'}`}>{type.title}</span>
                      <span className="block text-xs text-paper-3 mt-0.5">{type.description}</span>
                      <span className="block text-xs text-paper-3 mt-1.5">Ví dụ: {type.example}</span>
                    </span>
                  </button>
                );
              })}
            </div>
          </fieldset>

          <fieldset className="mb-7">
            <legend className="text-sm font-semibold text-paper-2 mb-3">Số câu hỏi</legend>
            <div className="flex flex-wrap items-center gap-2">
              {LIMIT_PRESETS.map((num) => {
                const isPossible = num <= maxAvailable;
                const isActive = questionLimit === num;
                return (
                  <button
                    key={num}
                    type="button"
                    onClick={() => {
                      setQuestionLimit(num);
                      setLimitDraft(null);
                    }}
                    disabled={!isPossible}
                    aria-pressed={isActive}
                    className={`h-9 px-3.5 rounded-lg text-sm font-medium border tabular-nums transition-colors cursor-pointer disabled:opacity-35 disabled:cursor-not-allowed ${
                      isActive ? 'bg-paper text-ink-950 border-paper' : 'border-line text-paper-2 hover:border-line-strong hover:text-paper'
                    }`}
                  >
                    {num}
                  </button>
                );
              })}

              <label className="flex items-center gap-2 ml-auto text-xs text-paper-3">
                Tùy chọn
                <input
                  type="number"
                  inputMode="numeric"
                  min={3}
                  max={maxAvailable}
                  value={limitDraft ?? String(effectiveLimit)}
                  onChange={(e) => setLimitDraft(e.target.value)}
                  onBlur={commitLimitDraft}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') commitLimitDraft();
                  }}
                  className="w-20 h-9 bg-ink-950 border border-line rounded-lg px-2 text-sm text-center tabular-nums text-paper focus:outline-none focus:border-shu/60"
                />
              </label>
            </div>
          </fieldset>

          {setupError && (
            <p role="alert" className="mb-4 rounded-xl border border-bad/40 bg-bad/8 px-4 py-3 text-sm text-paper">
              {setupError}
            </p>
          )}

          <button type="button" onClick={startQuiz} className={`${primaryButton} w-full h-12 text-sm`}>
            <Play className="w-4 h-4 fill-current" aria-hidden="true" />
            Bắt đầu · {effectiveLimit} câu
          </button>
        </div>
      </div>
    );
  }

  // 2. Summary
  if (gameState === 'summary') {
    const totalQuestions = history.length;
    const correctCount = history.filter((h) => h.isCorrect).length;
    const percentage = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;
    const verdict = percentage >= 80 ? 'Xuất sắc!' : percentage >= 50 ? 'Làm tốt lắm!' : 'Cần ôn thêm một chút';
    const missedKanji = Array.from(
      new Map(history.filter((h) => !h.isCorrect).map((h) => [h.question.targetKanji.id, h.question.targetKanji])).values()
    );

    return (
      <div className="max-w-2xl mx-auto">
        <div className="rounded-2xl bg-ink-900 border border-line p-5 sm:p-7">
          <h2 className="text-2xl font-bold text-paper">{verdict}</h2>
          <p className="text-sm text-paper-2 mt-1">
            Bạn đã làm {totalQuestions} câu{totalQuestions < quizDeck.length ? ` trên ${quizDeck.length}` : ''}.
          </p>

          <dl className="grid grid-cols-3 mt-6 mb-7 divide-x divide-line border-y border-line">
            <div className="py-4 pr-4">
              <dt className="text-xs text-paper-3">Số câu đúng</dt>
              <dd className="text-2xl font-bold text-paper tabular-nums mt-1">
                {correctCount}
                <span className="text-paper-3 font-medium text-lg">/{totalQuestions}</span>
              </dd>
            </div>
            <div className="py-4 px-4">
              <dt className="text-xs text-paper-3">Tỷ lệ đúng</dt>
              <dd className={`text-2xl font-bold tabular-nums mt-1 ${percentage >= 70 ? 'text-ok' : 'text-kin'}`}>{percentage}%</dd>
            </div>
            <div className="py-4 pl-4">
              <dt className="text-xs text-paper-3">Chuỗi đúng dài nhất</dt>
              <dd className="text-2xl font-bold text-paper tabular-nums mt-1 inline-flex items-center gap-1.5">
                <Flame className="w-5 h-5 text-shu" aria-hidden="true" />
                {maxStreak}
              </dd>
            </div>
          </dl>

          <h3 className="text-sm font-semibold text-paper-2 mb-2">Xem lại bài làm</h3>
          <ol className="max-h-72 overflow-y-auto -mx-2 mb-7">
            {history.map((h, idx) => {
              const correct = h.question.options.find((o) => o.isCorrect);
              const pKind = promptKind(h.question.type);
              const oKind = optionKind(h.question.type);
              const target = h.question.targetKanji;
              const mastered = isMastered?.(target.id) ?? false;
              return (
                <li key={idx} className="flex items-center gap-3 px-2 py-2.5 border-b border-line last:border-b-0 text-sm">
                  {h.isCorrect ? (
                    <CheckCircle2 className="w-4 h-4 text-ok shrink-0" aria-label="Đúng" role="img" />
                  ) : (
                    <XCircle className="w-4 h-4 text-bad shrink-0" aria-label="Sai" role="img" />
                  )}
                  <span
                    lang={pKind === 'vi' ? undefined : 'ja'}
                    className={`shrink-0 ${pKind === 'kanji' ? 'font-kanji text-xl' : pKind === 'kana' ? 'font-jp' : 'font-semibold text-kin'}`}
                  >
                    {h.question.promptMain}
                  </span>
                  <span className="text-xs text-paper-3 truncate hidden sm:inline">{h.question.promptCategory}</span>
                  <span className="ml-auto text-right min-w-0 truncate">
                    <span
                      lang={oKind === 'vi' ? undefined : 'ja'}
                      className={`${h.isCorrect ? 'text-ok' : 'text-bad line-through decoration-bad/60'} ${oKind === 'kanji' ? 'font-kanji' : oKind === 'kana' ? 'font-jp' : ''}`}
                    >
                      {h.selectedOption.primaryText}
                    </span>
                    {!h.isCorrect && correct && (
                      <span lang={oKind === 'vi' ? undefined : 'ja'} className={`ml-2 text-paper ${oKind === 'kanji' ? 'font-kanji' : oKind === 'kana' ? 'font-jp' : ''}`}>
                        {correct.primaryText}
                      </span>
                    )}
                  </span>
                  {onToggleMaster && (
                    <button
                      type="button"
                      onClick={() => onToggleMaster(target.id)}
                      aria-pressed={mastered}
                      aria-label={mastered ? `Bỏ đánh dấu thuộc chữ ${target.c}` : `Đánh dấu thuộc chữ ${target.c}`}
                      title={mastered ? 'Đã thuộc' : 'Đánh dấu thuộc'}
                      className={`shrink-0 grid place-items-center w-8 h-8 rounded-lg transition-colors cursor-pointer ${
                        mastered ? 'bg-ok/12 text-ok' : 'text-paper-3 hover:text-paper hover:bg-ink-850'
                      }`}
                    >
                      <Check className="w-3.5 h-3.5" aria-hidden="true" />
                    </button>
                  )}
                </li>
              );
            })}
          </ol>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {missedKanji.length > 0 ? (
              <button type="button" onClick={() => startRetryMissed(missedKanji)} className={`${primaryButton} h-11 text-sm sm:col-span-2`}>
                <RotateCcw className="w-4 h-4" aria-hidden="true" />
                Làm lại {missedKanji.length} chữ sai
              </button>
            ) : null}
            <button type="button" onClick={() => setGameState('setup')} className={`${secondaryButton} h-11 text-sm`}>
              <Settings2 className="w-4 h-4" aria-hidden="true" />
              Đổi cấu hình
            </button>
            <button
              type="button"
              onClick={startQuiz}
              className={`${missedKanji.length > 0 ? secondaryButton : primaryButton} h-11 text-sm`}
            >
              <RotateCcw className="w-4 h-4" aria-hidden="true" />
              Làm bài mới với chữ khác
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 3. Playing
  if (!currentQuestion) return null;
  const pKind = promptKind(currentQuestion.type);
  const oKind = optionKind(currentQuestion.type);
  const target = currentQuestion.targetKanji;
  const lastAnswer = isAnswered ? history[history.length - 1] : null;

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-3 min-w-0">
          <span className="text-sm text-paper-2 tabular-nums whitespace-nowrap">
            Câu <span className="text-paper font-semibold">{currentQuestionIndex + 1}</span>/{quizDeck.length}
          </span>
          <div
            className="w-20 sm:w-32 h-1 bg-ink-800 rounded-full overflow-hidden"
            role="progressbar"
            aria-label="Tiến độ bài làm"
            aria-valuemin={0}
            aria-valuemax={quizDeck.length}
            aria-valuenow={currentQuestionIndex + (isAnswered ? 1 : 0)}
          >
            <div
              className="h-full bg-shu rounded-full transition-[width] duration-300 ease-out"
              style={{ width: `${((currentQuestionIndex + (isAnswered ? 1 : 0)) / quizDeck.length) * 100}%` }}
            />
          </div>
        </div>

        <div className="flex items-center gap-4 text-sm tabular-nums">
          <span className="inline-flex items-center gap-1.5 text-paper-2" title="Số câu đúng">
            <Trophy className="w-4 h-4 text-kin" aria-hidden="true" />
            {score}
            <span className="sr-only">câu đúng</span>
          </span>
          <span className="inline-flex items-center gap-1.5 text-paper-2" title="Chuỗi đúng liên tiếp">
            <Flame className={`w-4 h-4 ${streak > 0 ? 'text-shu' : 'text-paper-3'}`} aria-hidden="true" />
            {streak}
            <span className="sr-only">câu đúng liên tiếp</span>
          </span>
          <button
            type="button"
            onClick={handleQuitEarly}
            className="inline-flex items-center gap-1.5 h-8 px-2.5 rounded-lg text-xs font-medium text-paper-2 hover:text-paper hover:bg-ink-850 transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" aria-hidden="true" />
            <span className="hidden sm:inline">Kết thúc</span>
          </button>
        </div>
      </div>

      {/* Prompt */}
      <div className="rounded-2xl bg-ink-900 border border-line px-6 pt-5 pb-8 text-center mb-4">
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs text-paper-3">{currentQuestion.promptCategory}</span>
          {currentQuestion.promptAudio && (
            <button
              type="button"
              onClick={() => speakJapanese(currentQuestion.promptAudio || '')}
              aria-label="Nghe phát âm"
              title="Nghe phát âm"
              className="grid place-items-center w-9 h-9 rounded-lg text-paper-2 hover:text-paper hover:bg-ink-800 transition-colors cursor-pointer"
            >
              <Volume2 className="w-4 h-4" />
            </button>
          )}
        </div>

        <p className="text-sm text-paper-2">{currentQuestion.promptQuestion}</p>

        <div
          lang={pKind === 'vi' ? undefined : 'ja'}
          className={`mt-4 text-paper select-none ${
            pKind === 'kanji'
              ? 'font-kanji text-[6.5rem] leading-none'
              : pKind === 'kana'
                ? 'font-jp text-5xl'
                : 'text-5xl font-bold text-kin tracking-wide'
          }`}
        >
          {currentQuestion.promptMain}
        </div>
        {currentQuestion.promptSub && <p className="text-sm text-paper-3 mt-4">{currentQuestion.promptSub}</p>}
      </div>

      {/* Options */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {currentQuestion.options.map((opt, idx) => {
          const isSelected = selectedOption?.id === opt.id;
          let state = 'bg-ink-900 border-line hover:border-line-strong hover:bg-ink-850 text-paper cursor-pointer';
          if (isAnswered) {
            if (opt.isCorrect) state = 'bg-ok/10 border-ok/70 text-paper';
            else if (isSelected) state = 'bg-bad/10 border-bad/70 text-paper';
            else state = 'bg-ink-900 border-line text-paper-3 opacity-55';
          }

          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => handleSelectOption(opt)}
              disabled={isAnswered}
              className={`min-h-[4.5rem] p-3.5 rounded-xl border text-left flex items-center gap-3 transition-colors ${state}`}
            >
              <kbd className="shrink-0">{idx + 1}</kbd>
              <span className="min-w-0 flex-1">
                <span
                  lang={oKind === 'vi' ? undefined : 'ja'}
                  className={`block ${
                    oKind === 'kanji'
                      ? 'font-kanji text-4xl leading-none'
                      : oKind === 'kana'
                        ? 'font-jp text-lg'
                        : 'text-base font-semibold text-kin tracking-wide truncate'
                  }`}
                >
                  {opt.primaryText}
                </span>
                {opt.secondaryText && <span className="block text-xs text-paper-3 truncate mt-1">{opt.secondaryText}</span>}
              </span>
              {isAnswered && opt.isCorrect && <CheckCircle2 className="w-5 h-5 text-ok shrink-0" aria-label="Đáp án đúng" role="img" />}
              {isAnswered && isSelected && !opt.isCorrect && <XCircle className="w-5 h-5 text-bad shrink-0" aria-label="Bạn chọn sai" role="img" />}
            </button>
          );
        })}
      </div>

      {lastAnswer && (
        <div className="mt-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-toast">
          <p className="text-sm text-paper-2" role="status">
            <span className={`font-semibold ${lastAnswer.isCorrect ? 'text-ok' : 'text-bad'}`}>
              {lastAnswer.isCorrect ? 'Chính xác.' : 'Chưa đúng.'}
            </span>{' '}
            <span lang="ja" className="font-kanji text-paper text-base">{target.c}</span>{' '}
            <span className="font-semibold text-kin">{target.hv.join(' · ')}</span> — {target.m_vi.slice(0, 2).join(', ')}
            {target.on.length > 0 && (
              <>
                {' '}· On <span lang="ja" className="font-jp text-paper">{target.on.slice(0, 2).join('、')}</span>
              </>
            )}
            {target.kun.length > 0 && (
              <>
                {' '}· Kun <span lang="ja" className="font-jp text-paper">{target.kun.slice(0, 2).join('、')}</span>
              </>
            )}
          </p>
          <button ref={nextButtonRef} type="button" onClick={handleAdvance} className={`${primaryButton} h-11 px-5 text-sm shrink-0`}>
            {currentQuestionIndex + 1 >= quizDeck.length ? 'Xem kết quả' : 'Câu tiếp theo'}
            <ArrowRight className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>
      )}

      <p className="mt-6 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs text-paper-3">
        <span>
          <kbd>1</kbd>–<kbd>4</kbd> chọn đáp án
        </span>
        <span>
          <kbd>Enter</kbd> câu tiếp theo
        </span>
      </p>
    </div>
  );
};
