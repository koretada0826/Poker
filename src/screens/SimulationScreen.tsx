import { useEffect, useMemo, useState } from 'react';
import CardRow from '../components/CardRow';
import {
  actionJa,
  applyPlayerAction,
  availableActions,
  newSimulation,
} from '../lib/simulation';
import { evaluateBest } from '../lib/handEvaluator';
import type { ActionType, Mode, PlayerStats, SimulationState } from '../types';

interface Props {
  stats: PlayerStats;
  setStats: (s: PlayerStats) => void;
  go: (m: Mode) => void;
  hands?: number;
}

export default function SimulationScreen({ stats, setStats, go, hands = 5 }: Props) {
  const [state, setState] = useState<SimulationState>(() => newSimulation());
  const [feedback, setFeedback] = useState<SimulationState['feedback']>(undefined);
  const [handCount, setHandCount] = useState(1);
  const [judgeScore, setJudgeScore] = useState(0); // 良い判断の回数
  const [judgeTotal, setJudgeTotal] = useState(0);
  const [doneAll, setDoneAll] = useState(false);
  const [guide, setGuide] = useState<boolean>(handCount === 1);

  const playerBest = useMemo(() => {
    if (state.community.length < 3) return null;
    return evaluateBest([...state.playerHand, ...state.community]);
  }, [state]);

  const phaseJa: Record<typeof state.phase, string> = {
    preflop: 'プリフロップ',
    flop: 'フロップ',
    turn: 'ターン',
    river: 'リバー',
    showdown: 'ショーダウン',
  };

  const onAction = (act: ActionType) => {
    const r = applyPlayerAction(state, act);
    setState(r.state);
    setFeedback(r.feedback);
    if (r.feedback) {
      setJudgeTotal(t => t + 1);
      if (r.feedback.yourAction === r.feedback.suggested) setJudgeScore(s => s + 1);
    }
  };

  const nextHand = () => {
    if (handCount >= hands) {
      setDoneAll(true);
      const score = judgeTotal === 0 ? 0 : Math.round((judgeScore / judgeTotal) * 100);
      setStats({ ...stats, simulationScore: Math.max(stats.simulationScore, score), exp: stats.exp + score });
      return;
    }
    setHandCount(c => c + 1);
    setState(newSimulation());
    setFeedback(undefined);
  };

  useEffect(() => {
    // ハンド終了時の自動進行ボタン表示は手動でいく
  }, [state.finished]);

  if (doneAll) {
    const score = judgeTotal === 0 ? 0 : Math.round((judgeScore / judgeTotal) * 100);
    return (
      <div className="max-w-3xl mx-auto px-4 py-6">
        <div className="panel text-center">
          <h2 className="text-2xl font-bold mb-2">実戦シミュレーション完了！</h2>
          <div className="text-5xl font-black text-chipGold my-4">{score}</div>
          <p className="text-sm text-white/80">判断スコア（推奨と一致した割合）</p>
          <p className="text-xs text-white/60 mt-3">
            ポーカーは「結果」より「判断」を評価するゲーム。
            短期的に負けても、良い判断を続ければ長期的には強くなれます。
          </p>
          <button className="btn-primary mt-6" onClick={() => go('home')}>
            ホームへ
          </button>
        </div>
      </div>
    );
  }

  const acts = availableActions(state);

  return (
    <div className="max-w-3xl mx-auto px-4 py-4">
      {guide && handCount === 1 && (
        <div className="panel mb-3 border-2 border-chipGold/50 bg-chipGold/10">
          <div className="flex items-start gap-2">
            <span className="text-2xl">👋</span>
            <div className="text-sm space-y-1">
              <div className="font-bold text-chipGold">はじめての実戦ガイド</div>
              <p>① 上=CPU(裏向き) / 中=場のカード / 下=あなたの手札</p>
              <p>② 「ポット」は集まったチップ。勝った人がもらえる賞金。</p>
              <p>③ 自分の番でアクションボタンを押す。<br />灰色のボタンは今は選べないアクション。</p>
              <p>④ 迷ったらフォールド（降りる）でOK。</p>
              <p className="text-white/70">フィードバックが出たら次のハンドへ進みます。</p>
            </div>
          </div>
          <button
            className="btn-primary mt-2 w-full"
            onClick={() => setGuide(false)}
          >
            ガイドを閉じてプレイ開始
          </button>
        </div>
      )}

      <div className="flex items-center justify-between mb-3 text-xs">
        <span className="badge bg-white/10">ハンド {handCount} / {hands}</span>
        <span className="badge bg-white/10">{phaseJa[state.phase]}</span>
        <span className="badge bg-chipGold text-feltDark">ポット: {state.pot}</span>
      </div>

      {/* CPU */}
      <div className="panel mb-3">
        <div className="text-xs text-white/60 mb-1">CPU（チップ: {state.cpuChips}）</div>
        <CardRow
          cards={state.cpuHand}
          size="lg"
          hidden={state.finished ? [false, false] : [true, true]}
        />
      </div>

      {/* コミュニティ */}
      <div className="panel mb-3">
        <div className="text-xs text-white/60 mb-2 text-center">場のカード</div>
        {state.community.length === 0 ? (
          <div className="text-center text-white/50 text-sm py-4">
            まだ場のカードは出ていません（プリフロップ）
          </div>
        ) : (
          <CardRow cards={state.community} size="lg" />
        )}
      </div>

      {/* 自分 */}
      <div className="panel mb-3">
        <div className="text-xs text-white/60 mb-1">あなた（チップ: {state.playerChips}）</div>
        <CardRow cards={state.playerHand} size="xl" />
        {playerBest && (
          <div className="mt-2 text-center text-sm">
            現在の役：<span className="text-chipGold font-bold">{playerBest.jaName}</span>
          </div>
        )}
        {state.toCall > 0 && (
          <div className="text-center text-xs text-yellow-300 mt-1">
            コールに必要: {state.toCall}
          </div>
        )}
      </div>

      {/* 5秒チェック */}
      {!state.finished && (
        <div className="panel mb-3 text-xs leading-relaxed">
          <div className="font-bold text-chipGold mb-1">⏱ 5秒チェック</div>
          ①自分の手は強い？ ②場の危険は？ ③相手は強そう？ ④払う価値は？ ⑤迷ったら降りる。
        </div>
      )}

      {/* アクション */}
      {!state.finished ? (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mb-3">
          {(['check', 'bet', 'call', 'raise', 'fold'] as ActionType[]).map(a => {
            const enabled = acts.includes(a);
            return (
              <button
                key={a}
                disabled={!enabled}
                className={`${enabled ? 'btn-primary' : 'btn-secondary opacity-40'} !text-sm whitespace-nowrap`}
                onClick={() => onAction(a)}
                title={!enabled ? '今は選べないアクション' : undefined}
              >
                {actionJa(a)}
              </button>
            );
          })}
        </div>
      ) : (
        <button className="btn-success w-full mb-3" onClick={nextHand}>
          {handCount >= hands ? '結果を見る' : '次のハンドへ →'}
        </button>
      )}

      {/* フィードバック */}
      {feedback && (
        <div className="panel mb-3 border-2 border-chipGold/40">
          <div className="text-xs text-white/60 mb-1">あなたの判断への評価</div>
          <div className="text-sm space-y-1">
            <div>あなた：<b>{actionJa(feedback.yourAction)}</b> / おすすめ：<b className="text-chipGold">{actionJa(feedback.suggested)}</b></div>
            <div>{feedback.good}</div>
            <div className="text-yellow-200">{feedback.risk}</div>
            <div className="text-white/70">{feedback.next}</div>
          </div>
        </div>
      )}

      {/* ログ */}
      <div className="panel max-h-40 overflow-y-auto">
        <div className="text-xs text-white/60 mb-1">ログ</div>
        <div className="text-xs space-y-1">
          {state.log.map((l, i) => (
            <div
              key={i}
              className={
                l.who === 'system'
                  ? 'text-white/60'
                  : l.who === 'you'
                  ? 'text-emerald-300'
                  : 'text-red-300'
              }
            >
              {l.who === 'you' ? '🟢 あなた: ' : l.who === 'cpu' ? '🔴 CPU: ' : '🔵 '}
              {l.msg}
            </div>
          ))}
        </div>
      </div>

      <div className="mt-3 text-center">
        <button className="text-xs text-white/50 underline" onClick={() => go('home')}>
          中断してホームへ
        </button>
      </div>
    </div>
  );
}
