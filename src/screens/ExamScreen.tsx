import { useMemo, useState } from 'react';
import QuizRunner from '../components/QuizRunner';
import { generateBatch } from '../lib/quizGenerator';
import type { Mode, PlayerStats, Quiz } from '../types';

interface Props {
  stats: PlayerStats;
  setStats: (s: PlayerStats) => void;
  go: (m: Mode) => void;
}

interface Section {
  title: string;
  group: 'hand' | 'action' | 'strategy' | 'manners';
  required: number; // 合格基準 %
  quizzes: Quiz[];
}

export default function ExamScreen({ stats, setStats, go }: Props) {
  const sections = useMemo<Section[]>(
    () => [
      { title: '役判定（10問）',         group: 'hand',     required: 80, quizzes: generateBatch('hand-judge', 10) },
      { title: 'アクション判断（10問）', group: 'action',   required: 80, quizzes: generateBatch('action', 10) },
      { title: 'プリフロップ（10問）',   group: 'strategy', required: 70, quizzes: generateBatch('preflop', 10) },
      { title: '実戦判断（5問）',        group: 'strategy', required: 70, quizzes: generateBatch('flop-judge', 5) },
      { title: 'マナー（5問）',          group: 'manners',  required: 80, quizzes: generateBatch('manners', 5) },
    ],
    []
  );

  const [secIdx, setSecIdx] = useState(0);
  const [qIdx, setQIdx] = useState(0);
  const [scores, setScores] = useState<number[]>(sections.map(() => 0));
  const [done, setDone] = useState(false);

  const sec = sections[secIdx];
  const quiz = sec?.quizzes[qIdx];

  const onAnswer = (correct: boolean) => {
    if (correct) {
      const next = scores.slice();
      next[secIdx] += 1;
      setScores(next);
    }
    const s = { ...stats };
    if (sec.group === 'hand') {
      s.handQuizTotal++; if (correct) s.handQuizCorrect++;
    } else if (sec.group === 'action') {
      s.actionTotal++; if (correct) s.actionCorrect++;
    } else if (sec.group === 'strategy') {
      s.strategyTotal++; if (correct) s.strategyCorrect++;
    } else {
      s.mannersTotal++; if (correct) s.mannersCorrect++;
    }
    if (correct) s.exp += 8;
    setStats(s);
  };

  const onNext = () => {
    if (qIdx + 1 < sec.quizzes.length) {
      setQIdx(qIdx + 1);
    } else if (secIdx + 1 < sections.length) {
      setSecIdx(secIdx + 1);
      setQIdx(0);
    } else {
      // 完了
      const total = sections.reduce((sum, s) => sum + s.quizzes.length, 0);
      const correctTotal = scores.reduce((s, n) => s + n, 0);
      const allPass = sections.every((s, i) => {
        const acc = (scores[i] / s.quizzes.length) * 100;
        return acc >= s.required;
      });
      const newTitle = allPass ? '初心者卒業 / 実卓デビューOK' : stats.title;
      const completed = stats.completedLessons.includes('exam')
        ? stats.completedLessons
        : [...stats.completedLessons, 'exam'];
      setStats({
        ...stats,
        exp: stats.exp + 100,
        title: allPass ? newTitle : stats.title,
        completedLessons: completed,
      });
      setDone(true);
      void total; void correctTotal;
    }
  };

  if (done) {
    const totalQ = sections.reduce((sum, s) => sum + s.quizzes.length, 0);
    const totalC = scores.reduce((s, n) => s + n, 0);
    const overall = Math.round((totalC / totalQ) * 100);
    const passList = sections.map((s, i) => {
      const acc = Math.round((scores[i] / s.quizzes.length) * 100);
      return { title: s.title, acc, req: s.required, pass: acc >= s.required };
    });
    const allPass = passList.every(p => p.pass);
    const weakness = passList.filter(p => !p.pass).map(p => p.title);

    return (
      <div className="max-w-3xl mx-auto px-4 py-6">
        <div className="panel text-center">
          <h2 className="text-2xl font-bold mb-2">卒業試験 結果</h2>
          <div className={`text-5xl font-black my-3 ${allPass ? 'text-emerald-400' : 'text-yellow-300'}`}>
            {allPass ? '🎓 合格！' : 'もう少し！'}
          </div>
          <div className="text-sm">総合：{overall}%（{totalC} / {totalQ}）</div>
        </div>

        <div className="panel mt-4">
          <div className="text-sm font-bold mb-2">分野別スコア</div>
          <div className="space-y-2">
            {passList.map((p, i) => (
              <div key={i} className="flex items-center justify-between text-sm">
                <span>{p.title}</span>
                <span className={p.pass ? 'text-emerald-400' : 'text-yellow-300'}>
                  {p.acc}% （合格基準 {p.req}%）{p.pass ? ' ✓' : ' ✗'}
                </span>
              </div>
            ))}
          </div>
        </div>

        {allPass ? (
          <div className="panel mt-4 border-2 border-emerald-400/50">
            <div className="text-lg font-bold text-emerald-300 mb-2">🏅 称号獲得</div>
            <ul className="text-sm space-y-1">
              <li>● 初心者実卓デビューOK</li>
              <li>● ルール理解済み</li>
              <li>● 初心者戦略理解済み</li>
              <li>● アミューズメントポーカー参加可能</li>
            </ul>
            <p className="text-xs text-white/70 mt-3 leading-relaxed">
              実卓では「初心者です」と最初に伝えればOK。<br />
              迷ったら降りる、強い時はベット、5秒チェックを忘れずに。<br />
              ポーカーは「結果」ではなく「良い判断の積み重ね」のゲームです。
            </p>
          </div>
        ) : (
          <div className="panel mt-4 border-2 border-yellow-300/40">
            <div className="text-lg font-bold text-yellow-200 mb-2">🔁 復習推奨</div>
            <div className="text-sm">
              苦手分野：{weakness.length === 0 ? 'なし' : weakness.join('、')}
            </div>
            <p className="text-xs text-white/70 mt-2">
              関連する練習モードでもう一度トレーニングすると、すぐ合格できます。
            </p>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3 mt-6">
          <button className="btn-secondary" onClick={() => go('exam')}>
            もう一度受ける
          </button>
          <button className="btn-primary" onClick={() => go(allPass ? 'lesson-math' : 'home')}>
            {allPass ? '次のステップ → 数学基礎' : 'ホームへ'}
          </button>
        </div>
      </div>
    );
  }

  if (!quiz) return null;
  const totalQuestions = sections.reduce((s, x) => s + x.quizzes.length, 0);
  const doneQuestions = sections.slice(0, secIdx).reduce((s, x) => s + x.quizzes.length, 0) + qIdx;

  return (
    <div className="max-w-3xl mx-auto px-4 py-4">
      <div className="flex items-center justify-between text-xs mb-3">
        <span className="badge bg-chipGold text-feltDark">{sec.title}</span>
        <span>全体 {doneQuestions + 1} / {totalQuestions}</span>
      </div>
      <QuizRunner
        key={`${secIdx}-${qIdx}`}
        quiz={quiz}
        onAnswer={onAnswer}
        onNext={onNext}
        index={qIdx}
        total={sec.quizzes.length}
      />
      <div className="mt-3 text-center">
        <button className="text-xs text-white/50 underline" onClick={() => go('home')}>
          試験を中断
        </button>
      </div>
    </div>
  );
}
