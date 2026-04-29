import { useMemo, useState } from 'react';
import { MENTAL_SCENARIOS } from '../data/mentalScenarios';
import { todayKey } from '../lib/storage';
import type { Mode, PlayerStats } from '../types';

interface Props {
  stats: PlayerStats;
  setStats: (s: PlayerStats) => void;
  go: (m: Mode) => void;
}

function shuffle<T>(arr: T[]): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function MentalScreen({ stats, setStats, go }: Props) {
  const [scenarios] = useState(() => shuffle(MENTAL_SCENARIOS).slice(0, 5));
  const [idx, setIdx] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [done, setDone] = useState(false);

  const cur = scenarios[idx];
  const correctIdx = useMemo(() => cur?.options.findIndex(o => o.correct) ?? -1, [cur]);

  const onPick = (i: number) => {
    if (picked !== null) return;
    setPicked(i);
    const isCorrect = cur.options[i].correct;
    if (isCorrect) setCorrectCount(c => c + 1);
    const newLog = [
      ...stats.mentalLog,
      { date: todayKey(), scenarioId: cur.id, chosenIndex: i, correct: isCorrect },
    ].slice(-100);
    setStats({
      ...stats,
      mentalCorrect: stats.mentalCorrect + (isCorrect ? 1 : 0),
      mentalTotal: stats.mentalTotal + 1,
      exp: stats.exp + (isCorrect ? 8 : 2),
      mentalLog: newLog,
      dailyMissions: {
        ...stats.dailyMissions,
        date: todayKey(),
        mentalDone: stats.dailyMissions.mentalDone + 1,
      },
    });
  };

  const onNext = () => {
    setPicked(null);
    if (idx + 1 >= scenarios.length) setDone(true);
    else setIdx(idx + 1);
  };

  if (done) {
    const acc = Math.round((correctCount / scenarios.length) * 100);
    return (
      <div className="max-w-3xl mx-auto px-4 py-6">
        <div className="panel text-center">
          <h2 className="text-2xl font-bold mb-2">🧘 ティルト管理トレーニング完了</h2>
          <div className="text-5xl font-black text-chipGold my-4">{acc}%</div>
          <p className="text-sm">{correctCount} / {scenarios.length} 問正解</p>
          <p className="text-xs text-white/70 mt-3 leading-relaxed">
            {acc >= 80
              ? '✨ 感情と判断を分離できる素質あり。実戦でも継続しよう。'
              : acc >= 50
              ? '✅ 良い兆し。ただし実戦では感情がもっと揺れる。繰り返し訓練を。'
              : '🔁 まだ感情に振り回されがち。「結果」と「判断の質」を分けて考える癖をつけよう。'}
          </p>
          <p className="text-[11px] text-white/50 mt-4">
            ポーカーは短期では運、長期では意思決定のゲーム。<br />
            勝ったか負けたかではなく、正しい判断をしたかを評価しよう。
          </p>
          <div className="grid grid-cols-2 gap-3 mt-6">
            <button className="btn-secondary" onClick={() => go('home')}>ホーム</button>
            <button className="btn-primary" onClick={() => location.reload()}>もう1セット</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <div className="text-xs text-white/60 mb-2">
        🧘 ティルト管理トレ ({idx + 1} / {scenarios.length})
      </div>
      <div className="panel">
        <div className="text-xs text-chipGold mb-2">状況</div>
        <p className="text-sm leading-relaxed">{cur.situation}</p>
        <div className="mt-4 text-xs text-chipGold">問題</div>
        <p className="text-base font-bold mt-1">{cur.question}</p>

        <div className="mt-4 space-y-2">
          {cur.options.map((opt, i) => {
            let cls = 'opt-btn';
            if (picked !== null) {
              if (i === correctIdx) cls += ' correct';
              else if (i === picked && i !== correctIdx) cls += ' wrong';
            } else if (picked === i) {
              cls += ' selected';
            }
            return (
              <button key={i} className={cls} onClick={() => onPick(i)}>
                <div className="text-sm">{opt.text}</div>
                {picked !== null && (
                  <div className="text-[11px] text-white/70 mt-1">→ {opt.reason}</div>
                )}
              </button>
            );
          })}
        </div>

        {picked !== null && (
          <div className="mt-4 panel bg-black/40">
            <div className="text-xs text-chipGold">解説</div>
            <p className="text-sm mt-1 leading-relaxed">{cur.explanation}</p>
            <button className="btn-primary mt-3 w-full" onClick={onNext}>
              {idx + 1 >= scenarios.length ? '結果を見る' : '次へ →'}
            </button>
          </div>
        )}
      </div>

      <div className="mt-3 text-center">
        <button className="text-xs text-white/50 underline" onClick={() => go('home')}>
          中断してホームへ
        </button>
      </div>
    </div>
  );
}
