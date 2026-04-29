import { useMemo, useState } from 'react';
import { LESSONS } from '../data/lessons';
import { ADVANCED_LESSONS } from '../data/advancedLessons';
import type { Mode, PlayerStats } from '../types';

type LessonId =
  | 'cards-basics' | 'hand-rankings' | 'holdem-flow' | 'actions' | 'strategy' | 'manners'
  | 'math-foundations' | 'range-thinking' | 'board-reading' | 'bet-sizing' | 'bluff-value' | 'gto-exploit';

interface Props {
  lessonId: LessonId;
  stats: PlayerStats;
  setStats: (s: PlayerStats) => void;
  go: (m: Mode) => void;
  modeId: Mode;
}

export default function LessonScreen({ lessonId, stats, setStats, go, modeId }: Props) {
  const lesson = useMemo(
    () => [...LESSONS, ...ADVANCED_LESSONS].find(l => l.id === lessonId)!,
    [lessonId]
  );
  const [step, setStep] = useState(0);
  const total = lesson.steps.length;
  const current = lesson.steps[step];

  const finish = () => {
    if (!stats.completedLessons.includes(modeId)) {
      setStats({
        ...stats,
        completedLessons: [...stats.completedLessons, modeId],
        exp: stats.exp + 30,
      });
    }
    go('home');
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <div className="panel">
        <div className="flex items-center justify-between mb-3">
          <div className="text-xs text-white/60">{lesson.chapter}</div>
          <div className="text-xs text-white/60">
            {step + 1} / {total}
          </div>
        </div>
        <div className="h-1 w-full bg-white/10 rounded-full overflow-hidden mb-4">
          <div
            className="h-full bg-chipGold transition-all"
            style={{ width: `${((step + 1) / total) * 100}%` }}
          />
        </div>

        <h2 className="text-2xl font-bold mb-3">{current.title}</h2>
        <div className="space-y-2 leading-relaxed text-sm">
          {current.body.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </div>

        {current.example && (
          <ul className="mt-4 space-y-1 text-sm">
            {current.example.map((e, i) => (
              <li key={i} className="flex gap-2">
                <span className="text-chipGold">●</span>
                <span>{e}</span>
              </li>
            ))}
          </ul>
        )}

        {current.tip && (
          <div className="mt-4 p-3 rounded-xl bg-chipGold/15 border border-chipGold/40 text-sm">
            <span className="font-bold text-chipGold">💡 ポイント：</span>
            {current.tip}
          </div>
        )}

        <div className="mt-6 flex gap-2">
          <button
            className="btn-secondary flex-1"
            onClick={() => (step > 0 ? setStep(step - 1) : go('home'))}
          >
            {step > 0 ? '← 前へ' : 'ホーム'}
          </button>
          {step < total - 1 ? (
            <button className="btn-primary flex-1" onClick={() => setStep(step + 1)}>
              次へ →
            </button>
          ) : (
            <button className="btn-success flex-1" onClick={finish}>
              レッスン完了 ✓
            </button>
          )}
        </div>
      </div>

      <div className="mt-3 text-center text-xs text-white/50">
        覚えたら、関連する練習モードでアウトプットしましょう。
      </div>
    </div>
  );
}
