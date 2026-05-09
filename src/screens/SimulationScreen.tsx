import { useEffect, useMemo, useRef, useState } from 'react';
import CardRow from '../components/CardRow';
import LiveOddsPanel from '../components/LiveOddsPanel';
import CheatSheet from '../components/CheatSheet';
import {
  actionJa,
  applyPlayerAction,
  availableActions,
  BET_SIZE_OPTIONS,
  defaultBetSize,
  newSimulation,
  STARTING_CHIPS,
} from '../lib/simulation';
import { evaluateBest } from '../lib/handEvaluator';
import type { ActionType, Mode, PlayerStats, SimulationState } from '../types';

interface Props {
  stats: PlayerStats;
  setStats: (s: PlayerStats) => void;
  go: (m: Mode) => void;
  hands?: number;
}

export default function SimulationScreen({ stats, setStats, go, hands = 10 }: Props) {
  const [state, setState] = useState<SimulationState>(() => newSimulation());
  const [feedback, setFeedback] = useState<SimulationState['feedback']>(undefined);
  const [handCount, setHandCount] = useState(1);
  const [judgeScore, setJudgeScore] = useState(0);
  const [judgeTotal, setJudgeTotal] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [doneAll, setDoneAll] = useState(false);
  const [guide, setGuide] = useState<boolean>(handCount === 1);
  const [betSize, setBetSize] = useState<number>(60);
  const [expGain, setExpGain] = useState<number | null>(null);
  const [stackBefore, setStackBefore] = useState<number>(STARTING_CHIPS);
  const [pulseChip, setPulseChip] = useState<'win' | 'lose' | null>(null);
  const [cheatOpen, setCheatOpen] = useState(false);
  const [showOdds, setShowOdds] = useState(true);
  const expTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const playerBest = useMemo(() => {
    if (state.community.length < 3) return null;
    return evaluateBest([...state.playerHand, ...state.community]);
  }, [state]);

  const cpuBest = useMemo(() => {
    if (!state.finished || state.community.length < 3) return null;
    return evaluateBest([...state.cpuHand, ...state.community]);
  }, [state.finished, state.cpuHand, state.community]);

  const phaseJa: Record<typeof state.phase, string> = {
    preflop: 'プリフロップ',
    flop: 'フロップ',
    turn: 'ターン',
    river: 'リバー',
    showdown: 'ショーダウン',
  };

  // ベットサイズの初期値をpotに合わせて更新
  useEffect(() => {
    if (!state.finished) setBetSize(defaultBetSize(state));
  }, [state.pot, state.finished]);

  const onAction = (act: ActionType) => {
    if (act === 'bet' || act === 'raise') setStackBefore(state.playerChips);
    const r = applyPlayerAction(state, act, act === 'bet' || act === 'raise' ? betSize : undefined);
    setState(r.state);
    setFeedback(r.feedback);
    if (r.feedback) {
      setJudgeTotal(t => t + 1);
      const good = r.feedback.yourAction === r.feedback.suggested;
      if (good) {
        setJudgeScore(s => s + 1);
        setStreak(s => {
          const n = s + 1;
          setBestStreak(b => Math.max(b, n));
          return n;
        });
      } else {
        setStreak(0);
      }
    }
    if (r.state.finished) {
      if (r.state.winner === 'you') setPulseChip('win');
      else if (r.state.winner === 'cpu') setPulseChip('lose');
      setTimeout(() => setPulseChip(null), 1500);
    }
  };

  const nextHand = () => {
    if (handCount >= hands) {
      setDoneAll(true);
      const score = judgeTotal === 0 ? 0 : Math.round((judgeScore / judgeTotal) * 100);
      const exp = score + bestStreak * 5;
      setStats({
        ...stats,
        simulationScore: Math.max(stats.simulationScore, score),
        exp: stats.exp + exp,
      });
      return;
    }
    // EXP popup（1ハンドあたり）
    const handExp = (state.winner === 'you' ? 10 : state.winner === 'tie' ? 5 : 2) + (streak * 2);
    setExpGain(handExp);
    if (expTimer.current) clearTimeout(expTimer.current);
    expTimer.current = setTimeout(() => setExpGain(null), 1500);

    setHandCount(c => c + 1);
    setState(s => newSimulation({
      playerChips: s.playerChips,
      cpuChips: s.cpuChips,
      button: s.button,
    }));
    setFeedback(undefined);
  };

  if (doneAll) {
    const score = judgeTotal === 0 ? 0 : Math.round((judgeScore / judgeTotal) * 100);
    const totalExp = score + bestStreak * 5;
    return (
      <div className="max-w-3xl mx-auto px-4 py-6">
        <div className="panel text-center anim-pop">
          <div className="text-5xl mb-2">🏆</div>
          <h2 className="text-2xl font-bold mb-2">セッション終了！</h2>
          <div className="grid grid-cols-2 gap-3 my-4">
            <div className="panel bg-chipGold/10 border-chipGold/30">
              <div className="text-xs text-white/60">判断スコア</div>
              <div className="text-3xl font-black text-chipGold">{score}</div>
            </div>
            <div className="panel bg-emerald-500/10 border-emerald-400/30">
              <div className="text-xs text-white/60">最大コンボ</div>
              <div className="text-3xl font-black text-emerald-300">{bestStreak}🔥</div>
            </div>
            <div className="panel">
              <div className="text-xs text-white/60">最終チップ</div>
              <div className="text-2xl font-bold">{state.playerChips}</div>
            </div>
            <div className="panel">
              <div className="text-xs text-white/60">獲得EXP</div>
              <div className="text-2xl font-bold text-yellow-300">+{totalExp}</div>
            </div>
          </div>
          <p className="text-xs text-white/60 mt-3">
            ポーカーは「結果」より「判断」を評価するゲーム。
            短期的に負けても、良い判断を続ければ長期的には強くなれます。
          </p>
          <div className="grid grid-cols-2 gap-2 mt-6">
            <button className="btn-secondary" onClick={() => go('home')}>ホームへ</button>
            <button className="btn-primary" onClick={() => {
              setHandCount(1); setJudgeScore(0); setJudgeTotal(0);
              setStreak(0); setBestStreak(0); setDoneAll(false);
              setState(newSimulation());
            }}>もう一度プレイ</button>
          </div>
        </div>
      </div>
    );
  }

  const acts = availableActions(state);
  const playerBust = state.playerChips <= 0 && state.finished;
  const cpuBust = state.cpuChips <= 0 && state.finished;

  return (
    <div className="max-w-3xl mx-auto px-4 py-4">
      {guide && handCount === 1 && (
        <div className="panel mb-3 border-2 border-chipGold/50 bg-chipGold/10">
          <div className="flex items-start gap-2">
            <span className="text-2xl">👋</span>
            <div className="text-sm space-y-1">
              <div className="font-bold text-chipGold">はじめての実戦ガイド</div>
              <p>① 上=CPU(裏向き) / 中=場のカード / 下=あなたの手札</p>
              <p>② ベット/レイズ時は <b>サイズボタン</b> で金額を選んでから押す</p>
              <p>③ ハンド終了で CPU の手札も公開されます</p>
              <p>④ 判断が推奨と一致するとコンボ🔥</p>
              <p>⑤ {hands}ハンドで終了。チップを増やして判断スコア100%を目指せ！</p>
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

      {/* HUD */}
      <div className="flex items-center justify-between mb-3 text-xs gap-1 flex-wrap">
        <span className="badge bg-white/10">ハンド {handCount} / {hands}</span>
        <span className="badge bg-white/10">{phaseJa[state.phase]}</span>
        <span className="badge bg-white/10">BTN: {state.button === 'you' ? 'あなた' : 'CPU'}</span>
        <span className={`badge ${streak >= 2 ? 'bg-emerald-500 text-white anim-pulse' : 'bg-white/10'}`}>
          {streak >= 2 ? `🔥 ${streak} 連続good` : `判断 ${judgeScore}/${judgeTotal}`}
        </span>
        <span className="badge bg-chipGold text-feltDark font-black">POT: {state.pot}</span>
        <button
          onClick={() => setCheatOpen(true)}
          className="badge bg-purple-500/30 border border-purple-300/50 hover:bg-purple-500/50"
        >
          📘 勝つコツ
        </button>
        <button
          onClick={() => setShowOdds(v => !v)}
          className={`badge border border-white/20 ${showOdds ? 'bg-emerald-500/30' : 'bg-white/10'}`}
          title="勝率パネル表示切替"
        >
          📊 {showOdds ? 'ON' : 'OFF'}
        </button>
      </div>

      {/* CPU */}
      <div className={`panel mb-3 transition ${pulseChip === 'lose' ? 'border-red-400/60 bg-red-500/10' : ''}`}>
        <div className="flex items-center justify-between text-xs text-white/60 mb-1">
          <span>🤖 CPU{cpuBust && '（バスト）'}</span>
          <span className="font-mono">💰 {state.cpuChips}</span>
        </div>
        <CardRow
          cards={state.cpuHand}
          size="lg"
          hidden={state.finished ? [false, false] : [true, true]}
        />
        {cpuBest && state.finished && (
          <div className="mt-2 text-center text-sm">
            CPU の役: <span className="text-red-300 font-bold">{cpuBest.jaName}</span>
          </div>
        )}
      </div>

      {/* コミュニティ */}
      <div className="panel mb-3 bg-emerald-900/30">
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
      <div className={`panel mb-3 transition ${pulseChip === 'win' ? 'border-chipGold/80 bg-chipGold/10 anim-pulse' : ''}`}>
        <div className="flex items-center justify-between text-xs text-white/60 mb-1">
          <span>🎮 あなた{playerBust && '（バスト）'}</span>
          <span className="font-mono">💰 {state.playerChips}</span>
        </div>
        <CardRow cards={state.playerHand} size="xl" />
        {playerBest && (
          <div className="mt-2 text-center text-sm">
            現在の役：<span className="text-chipGold font-bold">{playerBest.jaName}</span>
          </div>
        )}
        {state.toCall > 0 && !state.finished && (
          <div className="text-center text-xs text-yellow-300 mt-1">
            コールに必要: {state.toCall}
          </div>
        )}
      </div>

      {/* 勝敗バナー */}
      {state.finished && state.winner && (
        <div className={`panel mb-3 text-center anim-pop ${
          state.winner === 'you' ? 'border-chipGold border-2 bg-chipGold/15'
          : state.winner === 'cpu' ? 'border-red-400 border-2 bg-red-500/15'
          : 'border-white/30 border-2'
        }`}>
          <div className="text-3xl font-black mb-1">
            {state.winner === 'you' ? '🎉 WIN!' : state.winner === 'cpu' ? '💀 LOSE' : '🤝 CHOP'}
          </div>
          <div className="text-sm">
            {state.winner === 'you' && `+${state.pot} チップ獲得`}
            {state.winner === 'cpu' && `-${state.pot} チップ失った`}
            {state.winner === 'tie' && `ポット折半（${state.pot}）`}
          </div>
        </div>
      )}

      {/* 5秒チェック */}
      {!state.finished && (
        <div className="panel mb-3 text-xs leading-relaxed">
          <div className="font-bold text-chipGold mb-1">⏱ 5秒チェック</div>
          ①自分の手は強い？ ②場の危険は？ ③相手は強そう？ ④払う価値は？ ⑤迷ったら降りる。
        </div>
      )}

      {/* ライブ勝率パネル */}
      {!state.finished && showOdds && (
        <LiveOddsPanel
          hole={state.playerHand}
          community={state.community}
          pot={state.pot}
          toCall={state.toCall}
          phase={state.phase}
        />
      )}

      {/* ベットサイズ選択 */}
      {!state.finished && (acts.includes('bet') || acts.includes('raise')) && (
        <div className="panel mb-3">
          <div className="flex items-center justify-between mb-2">
            <div className="text-xs text-white/60">💵 ベットサイズ</div>
            <div className="text-sm font-mono font-bold text-chipGold">{betSize}</div>
          </div>
          <div className="grid grid-cols-4 gap-1.5 mb-2">
            {BET_SIZE_OPTIONS.map(opt => {
              const amt = Math.max(20, Math.min(state.playerChips, Math.floor(state.pot * opt.potRatio)));
              const active = betSize === amt;
              return (
                <button
                  key={opt.key}
                  onClick={() => setBetSize(amt)}
                  className={`text-xs px-1 py-1.5 rounded-lg border transition ${
                    active ? 'border-chipGold bg-chipGold/20 text-chipGold' : 'border-white/15 hover:bg-white/10'
                  }`}
                >
                  <div>{opt.label}</div>
                  <div className="text-[10px] opacity-70">{amt}</div>
                </button>
              );
            })}
          </div>
          <div className="flex items-center gap-2">
            <input
              type="range"
              min={20}
              max={state.playerChips}
              step={10}
              value={betSize}
              onChange={(e) => setBetSize(Number(e.target.value))}
              className="flex-1 accent-chipGold"
            />
            <button
              onClick={() => setBetSize(state.playerChips)}
              className="text-[10px] px-2 py-1 rounded border border-red-400/40 text-red-200 hover:bg-red-500/10"
            >
              ALL-IN
            </button>
          </div>
        </div>
      )}

      {/* アクション */}
      {!state.finished ? (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mb-3">
          {(['check', 'bet', 'call', 'raise', 'fold'] as ActionType[]).map(a => {
            const enabled = acts.includes(a);
            const isAggressive = a === 'bet' || a === 'raise';
            return (
              <button
                key={a}
                disabled={!enabled}
                className={`${enabled ? (a === 'fold' ? 'btn-danger' : isAggressive ? 'btn-primary' : 'btn-success') : 'btn-secondary opacity-40'} !text-sm whitespace-nowrap`}
                onClick={() => onAction(a)}
                title={!enabled ? '今は選べないアクション' : undefined}
              >
                {actionJa(a)}
                {isAggressive && enabled && (
                  <span className="ml-1 text-[10px] opacity-70">{betSize}</span>
                )}
              </button>
            );
          })}
        </div>
      ) : (
        <button className="btn-success w-full mb-3 text-lg" onClick={nextHand}>
          {handCount >= hands ? '🏁 結果を見る' : '次のハンドへ →'}
        </button>
      )}

      {/* EXPポップアップ */}
      {expGain !== null && (
        <div className="fixed top-20 right-4 panel anim-pop bg-yellow-500/20 border-yellow-300/50 z-50">
          <div className="text-xs text-yellow-200">EXP獲得</div>
          <div className="text-2xl font-black text-yellow-300">+{expGain}</div>
        </div>
      )}

      {/* フィードバック */}
      {feedback && (
        <div className="panel mb-3 border-2 border-chipGold/40 anim-slide-in">
          <div className="text-xs text-white/60 mb-1">あなたの判断への評価</div>
          <div className="text-sm space-y-1">
            <div>
              あなた：<b>{actionJa(feedback.yourAction)}</b> /
              おすすめ：<b className="text-chipGold">{actionJa(feedback.suggested)}</b>
              {feedback.yourAction === feedback.suggested && (
                <span className="ml-2 badge bg-emerald-500 text-white text-[10px]">GOOD!</span>
              )}
            </div>
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

      <CheatSheet open={cheatOpen} onClose={() => setCheatOpen(false)} />
    </div>
  );
}
