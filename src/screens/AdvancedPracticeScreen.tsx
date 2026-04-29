import { useMemo, useState } from 'react';
import QuizRunner from '../components/QuizRunner';
import { generateAdvancedBatch } from '../lib/advancedQuizGenerator';
import { todayKey } from '../lib/storage';
import type { Mode, PlayerStats, Quiz, QuizType } from '../types';

interface Props {
  quizType: Extract<QuizType,
    | 'pot-odds' | 'outs' | 'ev' | 'equity'
    | 'range-position' | 'board-texture'
    | 'bet-sizing' | 'bluff-value' | 'spr-mdf'>;
  group: 'math' | 'range' | 'board' | 'sizing' | 'bluff';
  count?: number;
  title: string;
  stats: PlayerStats;
  setStats: (s: PlayerStats) => void;
  go: (m: Mode) => void;
}

export default function AdvancedPracticeScreen({
  quizType, group, count = 8, title, stats, setStats, go,
}: Props) {
  const initial = useMemo(() => generateAdvancedBatch(quizType, count), [quizType, count]);
  const [quizzes, setQuizzes] = useState<Quiz[]>(initial);
  const [idx, setIdx] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [done, setDone] = useState(false);

  const onAnswer = (correct: boolean) => {
    if (correct) setCorrectCount(c => c + 1);
    const s = { ...stats };
    if (group === 'math') {
      s.mathTotal++; if (correct) s.mathCorrect++;
      if (quizType === 'ev') {
        s.dailyMissions = { ...s.dailyMissions, date: todayKey(), evDone: s.dailyMissions.evDone + 1 };
      } else if (quizType === 'pot-odds') {
        s.dailyMissions = { ...s.dailyMissions, date: todayKey(), potOddsDone: s.dailyMissions.potOddsDone + 1 };
      }
    } else if (group === 'range') {
      s.rangeTotal++; if (correct) s.rangeCorrect++;
    } else if (group === 'board') {
      s.boardTotal++; if (correct) s.boardCorrect++;
    } else if (group === 'sizing') {
      s.sizingTotal++; if (correct) s.sizingCorrect++;
    } else {
      s.bluffTotal++; if (correct) s.bluffCorrect++;
    }
    if (correct) s.exp += 8;
    setStats(s);
  };

  const onNext = () => {
    if (idx + 1 >= quizzes.length) setDone(true);
    else setIdx(idx + 1);
  };

  if (done) {
    const acc = Math.round((correctCount / quizzes.length) * 100);
    return (
      <div className="max-w-3xl mx-auto px-4 py-6">
        <div className="panel text-center">
          <h2 className="text-2xl font-bold mb-2">トレーニング完了！</h2>
          <div className="text-5xl font-black text-chipGold my-4">{acc}%</div>
          <p className="text-sm">{correctCount} / {quizzes.length} 問正解</p>
          <p className="text-xs text-white/60 mt-3">
            {acc >= 80 ? '✨ 上級レベルの理解。次のステージを開放できます。'
              : acc >= 60 ? '✅ 合格圏。理論を実戦で使えるよう繰り返しを。'
              : '🔁 まだ穴あり。レッスンを再読してから再挑戦推奨。'}
          </p>
          <div className="grid grid-cols-2 gap-3 mt-6">
            <button
              className="btn-secondary"
              onClick={() => {
                setQuizzes(generateAdvancedBatch(quizType, count));
                setIdx(0); setCorrectCount(0); setDone(false);
              }}
            >
              もう1セット
            </button>
            <button className="btn-primary" onClick={() => go('mastery-path')}>
              最強ルートへ
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <div className="mb-3 text-xs text-white/60">{title}</div>
      <QuizRunner
        quiz={quizzes[idx]}
        onAnswer={onAnswer}
        onNext={onNext}
        index={idx}
        total={quizzes.length}
      />
      <div className="mt-3 text-center">
        <button className="text-xs text-white/50 underline" onClick={() => go('mastery-path')}>
          最強ルートに戻る
        </button>
      </div>
    </div>
  );
}
