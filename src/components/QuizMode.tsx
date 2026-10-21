import React, { useState, useEffect, useCallback } from 'react';
import confetti from 'canvas-confetti';
import { Volume2, RotateCcw, Trophy, Flame, CheckCircle, XCircle } from 'lucide-react';
import type { KanjiItem } from '../types/kanji';
import { speakJapanese } from '../utils/speech';

interface QuizModeProps {
  kanjiList: KanjiItem[];
}

interface Question {
  target: KanjiItem;
  options: KanjiItem[];
  type: 'kanji-to-meaning' | 'meaning-to-kanji';
}

export const QuizMode: React.FC<QuizModeProps> = ({ kanjiList }) => {
  const [question, setQuestion] = useState<Question | null>(null);
  const [selectedOption, setSelectedOption] = useState<KanjiItem | null>(null);
  const [isAnswered, setIsAnswered] = useState<boolean>(false);
  const [score, setScore] = useState<number>(0);
  const [totalAttempts, setTotalAttempts] = useState<number>(0);
  const [streak, setStreak] = useState<number>(0);
  const [bestStreak, setBestStreak] = useState<number>(0);

  const generateQuestion = useCallback(() => {
    if (kanjiList.length < 4) return;

    // Pick 1 target
    const targetIdx = Math.floor(Math.random() * kanjiList.length);
    const target = kanjiList[targetIdx];

    // Pick 3 distractors
    const distractors: KanjiItem[] = [];
    const used = new Set<number>([targetIdx]);
    while (distractors.length < 3) {
      const idx = Math.floor(Math.random() * kanjiList.length);
      if (!used.has(idx)) {
        used.add(idx);
        distractors.push(kanjiList[idx]);
      }
    }

    // Shuffle options
    const options = [target, ...distractors].sort(() => Math.random() - 0.5);
    const type: 'kanji-to-meaning' | 'meaning-to-kanji' = Math.random() > 0.5 ? 'kanji-to-meaning' : 'meaning-to-kanji';

    setQuestion({ target, options, type });
    setSelectedOption(null);
    setIsAnswered(false);
  }, [kanjiList]);

  useEffect(() => {
    generateQuestion();
    setScore(0);
    setTotalAttempts(0);
    setStreak(0);
  }, [generateQuestion]);

  const handleSelectOption = (opt: KanjiItem) => {
    if (isAnswered || !question) return;

    setSelectedOption(opt);
    setIsAnswered(true);
    setTotalAttempts((prev) => prev + 1);

    const isCorrect = opt.id === question.target.id;
    if (isCorrect) {
      const newStreak = streak + 1;
      setScore((prev) => prev + 1);
      setStreak(newStreak);
      if (newStreak > bestStreak) setBestStreak(newStreak);

      if (newStreak % 5 === 0) {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.6 },
        });
      }
    } else {
      setStreak(0);
    }
  };

  // Keyboard support: 1, 2, 3, 4 for options, Space/Enter for next
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!question) return;

      if (['Digit1', 'Digit2', 'Digit3', 'Digit4'].includes(e.code)) {
        const index = parseInt(e.code.replace('Digit', '')) - 1;
        if (question.options[index] && !isAnswered) {
          handleSelectOption(question.options[index]);
        }
      } else if ((e.code === 'Space' || e.code === 'Enter') && isAnswered) {
        e.preventDefault();
        generateQuestion();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [question, isAnswered, generateQuestion]);

  if (kanjiList.length < 4 || !question) {
    return (
      <div className="text-center py-24 text-zinc-500">
        Cần tối thiểu 4 chữ Kanji trong bộ lọc hiện tại để bắt đầu trắc nghiệm.
      </div>
    );
  }

  const { target, options, type } = question;

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      {/* Top Stats Banner */}
      <div className="flex items-center justify-between bg-zinc-900/60 px-5 py-3 rounded-2xl border border-zinc-800 mb-6">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 text-amber-400 font-mono text-sm">
            <Trophy className="w-4 h-4" />
            <span>Điểm: {score}/{totalAttempts}</span>
          </div>

          <div className="flex items-center gap-1.5 text-orange-400 font-mono text-sm">
            <Flame className="w-4 h-4" />
            <span>Chuỗi: {streak}</span>
          </div>
        </div>

        <button
          onClick={() => {
            setScore(0);
            setTotalAttempts(0);
            setStreak(0);
            generateQuestion();
          }}
          className="text-xs text-zinc-400 hover:text-white flex items-center gap-1 bg-zinc-800/80 px-2.5 py-1 rounded-lg border border-zinc-700/60 transition"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Làm lại từ đầu</span>
        </button>
      </div>

      {/* Main Question Card */}
      <div className="bg-zinc-900/90 rounded-2xl border border-zinc-800 p-8 shadow-2xl text-center mb-6">
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs font-mono px-2.5 py-0.5 rounded-full bg-zinc-800 text-zinc-400 border border-zinc-700">
            {target.lvl} • {target.st} nét
          </span>

          <button
            onClick={() => speakJapanese(target.c)}
            className="p-1.5 text-zinc-400 hover:text-blue-400 bg-zinc-800 rounded-lg transition"
            title="Nghe phát âm"
          >
            <Volume2 className="w-4 h-4" />
          </button>
        </div>

        {type === 'kanji-to-meaning' ? (
          <div>
            <div className="text-xs text-zinc-400 mb-2 font-mono uppercase tracking-wider">
              Chọn âm Hán Việt & nghĩa đúng cho chữ Kanji:
            </div>
            <div className="text-8xl font-kanji text-zinc-100 my-4 select-none">
              {target.c}
            </div>
          </div>
        ) : (
          <div>
            <div className="text-xs text-zinc-400 mb-2 font-mono uppercase tracking-wider">
              Chọn chữ Kanji tương ứng với:
            </div>
            <div className="text-3xl font-bold text-amber-400 uppercase tracking-wide my-3">
              {target.hv.join(' • ')}
            </div>
            <div className="text-sm text-zinc-300 max-w-md mx-auto line-clamp-2">
              {target.m_vi.join(', ')}
            </div>
          </div>
        )}
      </div>

      {/* 4 Multiple Choice Options */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        {options.map((opt, idx) => {
          const isCorrect = opt.id === target.id;
          const isSelected = selectedOption?.id === opt.id;

          let btnStyle = 'bg-zinc-900/70 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-850 text-zinc-200';
          if (isAnswered) {
            if (isCorrect) {
              btnStyle = 'bg-emerald-950/40 border-emerald-500 text-emerald-300 shadow-md shadow-emerald-950/30';
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
                  {type === 'kanji-to-meaning' ? (
                    <div>
                      <div className="text-sm font-bold text-amber-400 uppercase tracking-wide truncate">
                        {opt.hv.join(' • ')}
                      </div>
                      <div className="text-xs text-zinc-300 truncate mt-0.5">
                        {opt.m_vi.join(', ')}
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className="text-3xl font-kanji text-zinc-100">{opt.c}</span>
                      <span className="text-xs text-zinc-400 font-mono">
                        ({opt.st} nét)
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {isAnswered && (
                <div className="shrink-0 ml-2">
                  {isCorrect && <CheckCircle className="w-5 h-5 text-emerald-400" />}
                  {isSelected && !isCorrect && <XCircle className="w-5 h-5 text-rose-400" />}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Next Question Button after answering */}
      {isAnswered && (
        <div className="mt-6 flex justify-center animate-in fade-in duration-200">
          <button
            onClick={generateQuestion}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-500 active:scale-95 text-white font-medium text-sm rounded-xl transition shadow-lg shadow-blue-900/40 flex items-center gap-2"
          >
            <span>Câu tiếp theo</span>
            <span className="text-xs font-mono opacity-80">[Enter]</span>
          </button>
        </div>
      )}

      <div className="text-[11px] text-zinc-500 mt-6 text-center font-mono">
        Phím tắt: bấm [1, 2, 3, 4] để chọn • [Enter] / [Space] để qua câu tiếp theo
      </div>
    </div>
  );
};
