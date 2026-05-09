import { useMemo, useState } from 'react';
import QuizRunner from '../components/QuizRunner';
import { generateBatch } from '../lib/quizGenerator';
import { todayKey } from '../lib/storage';
import type { Mode, PlayerStats, Quiz } from '../types';

interface Props {
  kind:
    | { quizType: 'card-name' | 'card-strength' | 'hand-judge' | 'hand-compare' | 'hand-draw' | 'best5'; group: 'hand' }
    | { quizType: 'action'; group: 'action' }
    | { quizType: 'preflop' | 'flop-judge'; group: 'strategy' }
    | { quizType: 'manners'; group: 'manners' };
  count?: number;
  title: string;
  stats: PlayerStats;
  setStats: (s: PlayerStats) => void;
  go: (m: Mode) => void;
}

export default function PracticeScreen({ kind, count = 10, title, stats, setStats, go }: Props) {
  const initial = useMemo(() => generateBatch(kind.quizType, count), [kind.quizType, count]);
  const [quizzes, setQuizzes] = useState<Quiz[]>(initial);
  const [idx, setIdx] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [done, setDone] = useState(false);

  const onAnswer = (correct: boolean) => {
    setCorrectCount(c => c + (correct ? 1 : 0));
    const s = { ...stats };
    if (kind.group === 'hand') {
      s.handQuizTotal++;
      if (correct) s.handQuizCorrect++;
      s.dailyMissions = { ...s.dailyMissions, date: todayKey(), handDone: s.dailyMissions.handDone + 1 };
    } else if (kind.group === 'action') {
      s.actionTotal++;
      if (correct) s.actionCorrect++;
    } else if (kind.group === 'strategy') {
      s.strategyTotal++;
      if (correct) s.strategyCorrect++;
      if (kind.quizType === 'preflop') {
        s.dailyMissions = { ...s.dailyMissions, date: todayKey(), preflopDone: s.dailyMissions.preflopDone + 1 };
      }
    } else {
      s.mannersTotal++;
      if (correct) s.mannersCorrect++;
    }
    if (correct) s.exp += 5;
    setStats(s);
  };

  const onNext = () => {
    if (idx + 1 >= quizzes.length) {
      setDone(true);
    } else {
      setIdx(idx + 1);
    }
  };

  if (done) {
    const acc = Math.round((correctCount / quizzes.length) * 100);
    return (
      <div className="max-w-3xl mx-auto px-4 py-6">
        <div className="panel text-center">
          <h2 className="text-2xl font-bold mb-2">トレーニング完了！</h2>
          <div className="text-5xl font-black text-chipGold my-4">{acc}%</div>
          <p className="text-sm text-white/80">
            {correctCount} / {quizzes.length} 問正解
          </p>
          <p className="text-xs text-white/60 mt-3">
            {acc >= 80
              ? '素晴らしい！この分野は実卓レベルに近付いています。'
              : acc >= 60
              ? '良い感じ。間違えた問題の解説をもう一度見直しましょう。'
              : 'もう一度チャレンジ。間違いから学ぶのが上達への近道です。'}
          </p>
          <div className="grid grid-cols-2 gap-3 mt-6">
            <button
              className="btn-secondary"
              onClick={() => {
                const next = generateBatch(kind.quizType, count);
                setQuizzes(next);
                setIdx(0);
                setCorrectCount(0);
                setDone(false);
              }}
            >
              もう1セット
            </button>
            <button className="btn-primary" onClick={() => go('home')}>
              ホームへ
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
        key={idx}
        quiz={quizzes[idx]}
        onAnswer={onAnswer}
        onNext={onNext}
        index={idx}
        total={quizzes.length}
      />
      <div className="mt-3 text-center">
        <button className="text-xs text-white/50 underline" onClick={() => go('home')}>
          ホームに戻る
        </button>
      </div>
    </div>
  );
}
