import { useMemo, useState } from 'react';
import QuizRunner from '../components/QuizRunner';
import { generateAdvancedBatch } from '../lib/advancedQuizGenerator';
import type { Mode, PlayerStats, Quiz } from '../types';

interface Props {
  stats: PlayerStats;
  setStats: (s: PlayerStats) => void;
  go: (m: Mode) => void;
}

interface Section {
  title: string;
  group: 'math' | 'range' | 'board' | 'sizing' | 'bluff';
  required: number; // %
  quizzes: Quiz[];
}

export default function BossExamScreen({ stats, setStats, go }: Props) {
  const sections = useMemo<Section[]>(() => [
    { title: '🧮 ポットオッズ&EV(8)', group: 'math',   required: 80, quizzes: [
      ...generateAdvancedBatch('pot-odds', 4),
      ...generateAdvancedBatch('ev', 4),
    ]},
    { title: '🎯 アウツ&エクイティ(6)', group: 'math', required: 75, quizzes: [
      ...generateAdvancedBatch('outs', 3),
      ...generateAdvancedBatch('equity', 3),
    ]},
    { title: '🧠 レンジ(6)',             group: 'range', required: 75, quizzes: generateAdvancedBatch('range-position', 6) },
    { title: '🃏 ボードテクスチャ(5)',   group: 'board', required: 70, quizzes: generateAdvancedBatch('board-texture', 5) },
    { title: '⚖️ ベットサイジング(5)',  group: 'sizing', required: 70, quizzes: generateAdvancedBatch('bet-sizing', 5) },
    { title: '🎭 ブラフ／バリュー(5)',  group: 'bluff', required: 70, quizzes: generateAdvancedBatch('bluff-value', 5) },
    { title: '👑 GTO(MDF/SPR/α)(5)',     group: 'math', required: 70, quizzes: generateAdvancedBatch('spr-mdf', 5) },
  ], []);

  const [secIdx, setSecIdx] = useState(0);
  const [qIdx, setQIdx] = useState(0);
  const [scores, setScores] = useState<number[]>(sections.map(() => 0));
  const [done, setDone] = useState(false);

  const sec = sections[secIdx];
  const quiz = sec?.quizzes[qIdx];

  const onAnswer = (correct: boolean) => {
    if (correct) {
      const next = scores.slice();
      next[secIdx]++;
      setScores(next);
    }
    const s = { ...stats };
    if (sec.group === 'math') {
      s.mathTotal++; if (correct) s.mathCorrect++;
    } else if (sec.group === 'range') {
      s.rangeTotal++; if (correct) s.rangeCorrect++;
    } else if (sec.group === 'board') {
      s.boardTotal++; if (correct) s.boardCorrect++;
    } else if (sec.group === 'sizing') {
      s.sizingTotal++; if (correct) s.sizingCorrect++;
    } else {
      s.bluffTotal++; if (correct) s.bluffCorrect++;
    }
    if (correct) s.exp += 12;
    setStats(s);
  };

  const onNext = () => {
    if (qIdx + 1 < sec.quizzes.length) {
      setQIdx(qIdx + 1);
    } else if (secIdx + 1 < sections.length) {
      setSecIdx(secIdx + 1);
      setQIdx(0);
    } else {
      const passList = sections.map((s, i) => {
        const a = (scores[i] / s.quizzes.length) * 100;
        return { title: s.title, acc: a, req: s.required, pass: a >= s.required };
      });
      const allPass = passList.every(p => p.pass);
      const total = sections.reduce((sum, s) => sum + s.quizzes.length, 0);
      const correctTotal = scores.reduce((s, n) => s + n, 0);
      const overall = (correctTotal / total) * 100;
      const passedBoss = allPass && overall >= 80;
      setStats({
        ...stats,
        bossExamPassed: stats.bossExamPassed || passedBoss,
        title: passedBoss ? '👑 ホールデムマスター' : stats.title,
        exp: stats.exp + (passedBoss ? 300 : 100),
      });
      setDone(true);
    }
  };

  if (done) {
    const passList = sections.map((s, i) => {
      const a = Math.round((scores[i] / s.quizzes.length) * 100);
      return { title: s.title, acc: a, req: s.required, pass: a >= s.required };
    });
    const total = sections.reduce((sum, s) => sum + s.quizzes.length, 0);
    const correctTotal = scores.reduce((s, n) => s + n, 0);
    const overall = Math.round((correctTotal / total) * 100);
    const allPass = passList.every(p => p.pass);
    const masterPass = allPass && overall >= 80;
    const weak = passList.filter(p => !p.pass).map(p => p.title);

    return (
      <div className="max-w-3xl mx-auto px-4 py-6">
        <div className="panel text-center">
          <div className={`text-5xl my-4 ${masterPass ? '' : 'opacity-60'}`}>
            {masterPass ? '👑' : '🥈'}
          </div>
          <h2 className="text-2xl font-bold mb-2">
            {masterPass ? 'ホールデムマスター 認定！' : 'もう一歩…'}
          </h2>
          <div className={`text-4xl font-black my-2 ${masterPass ? 'text-chipGold' : 'text-yellow-300'}`}>
            総合 {overall}%
          </div>
          <p className="text-xs text-white/70">
            {correctTotal} / {total} 問正解 ／ 全分野通過: {allPass ? '✓' : '✗'}
          </p>
        </div>

        <div className="panel mt-4">
          <div className="font-bold mb-2 text-sm">分野別スコア</div>
          <div className="space-y-2 text-sm">
            {passList.map((p, i) => (
              <div key={i} className="flex justify-between gap-2">
                <span className="flex-1">{p.title}</span>
                <span className={p.pass ? 'text-emerald-300' : 'text-yellow-300'}>
                  {p.acc}% / 必要 {p.req}% {p.pass ? '✓' : '✗'}
                </span>
              </div>
            ))}
          </div>
        </div>

        {masterPass ? (
          <div className="panel mt-4 border-2 border-chipGold">
            <div className="text-lg font-bold text-chipGold mb-2">🏅 認定称号</div>
            <ul className="text-sm space-y-1">
              <li>● 👑 ホールデムマスター</li>
              <li>● 数学・レンジ・ボード・サイジング・GTO 全分野80%超</li>
              <li>● +EV判断を継続的にできるレベル</li>
            </ul>
            <p className="text-xs text-white/70 mt-3 leading-relaxed">
              ここまで到達したあなたは、論理的に「+EVな選択を継続できる」プレイヤーです。<br />
              ポーカーは長期ゲーム。短期の結果に惑わされず、思考プロセスの精度を磨き続けてください。
            </p>
          </div>
        ) : (
          <div className="panel mt-4 border border-yellow-300/40">
            <div className="font-bold text-yellow-200 mb-1">🔁 復習ガイド</div>
            <p className="text-xs">弱点：{weak.length === 0 ? 'なし（あと総合80%）' : weak.join('、')}</p>
            <p className="text-xs text-white/70 mt-2">対応するレッスン/練習で再挑戦してください。</p>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3 mt-6">
          <button className="btn-secondary" onClick={() => go('mastery-path')}>
            最強ルートへ
          </button>
          <button className="btn-primary" onClick={() => go('boss-exam')}>
            もう一度受ける
          </button>
        </div>
      </div>
    );
  }

  if (!quiz) return null;
  const totalQuestions = sections.reduce((s, x) => s + x.quizzes.length, 0);
  const doneQuestions =
    sections.slice(0, secIdx).reduce((s, x) => s + x.quizzes.length, 0) + qIdx;

  return (
    <div className="max-w-3xl mx-auto px-4 py-4">
      <div className="flex items-center justify-between text-xs mb-3 flex-wrap gap-1">
        <span className="badge bg-chipGold text-feltDark">🔥 ボス試験</span>
        <span className="badge bg-white/10">{sec.title}</span>
        <span className="badge bg-white/10">全体 {doneQuestions + 1} / {totalQuestions}</span>
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
        <button className="text-xs text-white/50 underline" onClick={() => go('mastery-path')}>
          中断
        </button>
      </div>
    </div>
  );
}
