import { useEffect, useMemo, useRef, useState } from 'react';
import CardRow from '../components/CardRow';
import LiveOddsPanel from '../components/LiveOddsPanel';
import CheatSheet from '../components/CheatSheet';
import {
  actionJa4,
  applyHumanAction,
  availableMultiActions,
  clampMultiBet,
  defaultMultiBet,
  newMultiSim,
  STARTING_CHIPS_MULTI,
  type MultiSimState,
} from '../lib/multiSim';
import { BET_SIZE_OPTIONS } from '../lib/simulation';
import { evaluateBest } from '../lib/handEvaluator';
import type { ActionType, Mode, PlayerStats } from '../types';

interface Props {
  stats: PlayerStats;
  setStats: (s: PlayerStats) => void;
  go: (m: Mode) => void;
  hands?: number;
}

export default function MultiSimScreen({ stats, setStats, go, hands = 8 }: Props) {
  const [state, setState] = useState<MultiSimState>(() => newMultiSim());
  const [feedback, setFeedback] = useState<MultiSimState['feedback']>(undefined);
  const [handCount, setHandCount] = useState(1);
  const [judgeScore, setJudgeScore] = useState(0);
  const [judgeTotal, setJudgeTotal] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [doneAll, setDoneAll] = useState(false);
  const [guide, setGuide] = useState(true);
  const [betSize, setBetSize] = useState<number>(40);
  const [cheatOpen, setCheatOpen] = useState(false);
  const [showOdds, setShowOdds] = useState(true);
  const [pulseChip, setPulseChip] = useState<'win' | 'lose' | null>(null);
  const [expGain, setExpGain] = useState<number | null>(null);
  const expTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const me = state.players[0];
  const phaseJa: Record<typeof state.phase, string> = {
    preflop: 'プリフロップ', flop: 'フロップ', turn: 'ターン', river: 'リバー', showdown: 'ショーダウン',
  };

  const playerBest = useMemo(() => {
    if (state.community.length < 3) return null;
    return evaluateBest([...me.hand, ...state.community]);
  }, [state, me.hand]);

  useEffect(() => {
    if (!state.finished) setBetSize(defaultMultiBet(state));
  }, [state.pot, state.finished]);

  const onAction = (act: ActionType) => {
    const r = applyHumanAction(state, act, act === 'bet' || act === 'raise' ? betSize : undefined);
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
      const won = r.state.winners?.includes(0);
      if (won) setPulseChip('win'); else setPulseChip('lose');
      setTimeout(() => setPulseChip(null), 1500);
    }
  };

  const nextHand = () => {
    if (handCount >= hands) {
      const score = judgeTotal === 0 ? 0 : Math.round((judgeScore / judgeTotal) * 100);
      setStats({
        ...stats,
        simulationScore: Math.max(stats.simulationScore, score),
        exp: stats.exp + score + bestStreak * 5,
      });
      setDoneAll(true);
      return;
    }
    const handExp = (state.winners?.includes(0) ? 12 : 3) + streak * 2;
    setExpGain(handExp);
    if (expTimer.current) clearTimeout(expTimer.current);
    expTimer.current = setTimeout(() => setExpGain(null), 1500);

    setHandCount(c => c + 1);
    setState(s => newMultiSim({
      chips: s.players.map(p => p.chips),
      lastButton: s.buttonIdx,
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
          <h2 className="text-2xl font-bold mb-2">4人卓セッション終了！</h2>
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
              <div className="text-2xl font-bold">{me.chips}</div>
              <div className="text-[10px] text-white/50">開始 {STARTING_CHIPS_MULTI}</div>
            </div>
            <div className="panel">
              <div className="text-xs text-white/60">獲得EXP</div>
              <div className="text-2xl font-bold text-yellow-300">+{totalExp}</div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 mt-6">
            <button className="btn-secondary" onClick={() => go('home')}>ホームへ</button>
            <button className="btn-primary" onClick={() => {
              setHandCount(1); setJudgeScore(0); setJudgeTotal(0);
              setStreak(0); setBestStreak(0); setDoneAll(false);
              setState(newMultiSim());
            }}>もう一度プレイ</button>
          </div>
        </div>
      </div>
    );
  }

  const acts = availableMultiActions(state);

  return (
    <div className="max-w-3xl mx-auto px-4 py-4">
      {guide && handCount === 1 && (
        <div className="panel mb-3 border-2 border-chipGold/50 bg-chipGold/10">
          <div className="flex items-start gap-2">
            <span className="text-2xl">🎲</span>
            <div className="text-sm space-y-1">
              <div className="font-bold text-chipGold">4人卓のあそびかた</div>
              <p>① あなた + CPU 3人の本格テーブル！</p>
              <p>② 順番にアクションするので、CPU が動いている間は待つ</p>
              <p>③ あなたの番が来たら下のボタンで操作</p>
              <p>④ 4人いるので、誰か1人くらい強い手を持ってる可能性に注意</p>
              <p>⑤ {hands}ハンドで終了。ヘッズアップより駆け引きが深い！</p>
            </div>
          </div>
          <button className="btn-primary mt-2 w-full" onClick={() => setGuide(false)}>
            ガイドを閉じてプレイ開始
          </button>
        </div>
      )}

      {/* HUD */}
      <div className="flex items-center justify-between mb-3 text-xs gap-1 flex-wrap">
        <span className="badge bg-white/10">ハンド {handCount}/{hands}</span>
        <span className="badge bg-white/10">{phaseJa[state.phase]}</span>
        <span className="badge bg-white/10">BTN: {state.players[state.buttonIdx].name}</span>
        <span className={`badge ${streak >= 2 ? 'bg-emerald-500 text-white anim-pulse' : 'bg-white/10'}`}>
          {streak >= 2 ? `🔥 ${streak} 連続good` : `判断 ${judgeScore}/${judgeTotal}`}
        </span>
        <span className="badge bg-chipGold text-feltDark font-black">POT: {state.pot}</span>
        <button onClick={() => setCheatOpen(true)} className="badge bg-purple-500/30 hover:bg-purple-500/50">📘 勝つコツ</button>
        <button onClick={() => setShowOdds(v => !v)} className={`badge ${showOdds ? 'bg-emerald-500/30' : 'bg-white/10'}`}>
          📊 {showOdds ? 'ON' : 'OFF'}
        </button>
      </div>

      {/* CPU 3人 (横並び) */}
      <div className="grid grid-cols-3 gap-2 mb-3">
        {[1, 2, 3].map(i => {
          const p = state.players[i];
          const isTurn = state.toAct === i && !state.finished;
          const showCards = state.finished && !p.folded;
          return (
            <div
              key={i}
              className={`panel !p-2 transition ${
                p.folded ? 'opacity-40' :
                isTurn ? 'border-yellow-300 border-2 bg-yellow-500/10 anim-pulse' :
                state.winners?.includes(i) ? 'border-red-400 border-2 bg-red-500/10' :
                ''
              }`}
            >
              <div className="text-[11px] flex items-center justify-between">
                <span>{p.name}{i === state.buttonIdx && ' 🎯'}</span>
                <span className="text-white/60">{p.chips}</span>
              </div>
              <div className="flex justify-center my-1">
                <CardRow
                  cards={p.hand}
                  size="sm"
                  hidden={showCards ? [false, false] : [true, true]}
                />
              </div>
              <div className="text-center text-[10px]">
                {p.folded ? <span className="text-red-300">DOWN</span>
                  : p.allIn ? <span className="text-yellow-200">ALL-IN</span>
                  : p.streetBet > 0 ? <span className="text-chipGold">bet {p.streetBet}</span>
                  : <span className="text-white/40">—</span>}
              </div>
            </div>
          );
        })}
      </div>

      {/* コミュニティ */}
      <div className="panel mb-3 bg-emerald-900/30">
        <div className="text-xs text-white/60 mb-2 text-center">場のカード</div>
        {state.community.length === 0 ? (
          <div className="text-center text-white/50 text-sm py-4">プリフロップ（場のカードはまだ）</div>
        ) : (
          <CardRow cards={state.community} size="lg" />
        )}
      </div>

      {/* 自分 */}
      <div className={`panel mb-3 transition ${
        pulseChip === 'win' ? 'border-chipGold/80 bg-chipGold/10 anim-pulse' :
        state.toAct === 0 && !state.finished ? 'border-emerald-400 border-2' : ''
      }`}>
        <div className="flex items-center justify-between text-xs text-white/60 mb-1">
          <span>🎮 あなた{0 === state.buttonIdx && ' 🎯'}{me.folded && '（DOWN）'}{me.allIn && '（ALL-IN）'}</span>
          <span className="font-mono">💰 {me.chips}</span>
        </div>
        <CardRow cards={me.hand} size="xl" />
        {playerBest && (
          <div className="mt-2 text-center text-sm">
            現在の役: <span className="text-chipGold font-bold">{playerBest.jaName}</span>
          </div>
        )}
        {state.toCall - me.streetBet > 0 && !state.finished && state.toAct === 0 && (
          <div className="text-center text-xs text-yellow-300 mt-1">
            コールに必要: {state.toCall - me.streetBet}
          </div>
        )}
      </div>

      {/* 勝敗バナー */}
      {state.finished && state.winners && (
        <div className={`panel mb-3 text-center anim-pop ${
          state.winners.includes(0) ? 'border-chipGold border-2 bg-chipGold/15'
          : 'border-red-400 border-2 bg-red-500/15'
        }`}>
          <div className="text-3xl font-black mb-1">
            {state.winners.includes(0) ? '🎉 WIN!' : '💀 LOSE'}
          </div>
          <div className="text-sm">
            勝者: {state.winners.map(i => state.players[i].name).join(', ')}
          </div>
          {state.showdownReveal && state.showdownReveal.length > 0 && (
            <div className="text-xs mt-2 text-white/80">
              {state.showdownReveal.map(s => `${state.players[s.idx].name}=${s.jaName}`).join(' / ')}
            </div>
          )}
        </div>
      )}

      {/* ライブ勝率パネル */}
      {!state.finished && state.toAct === 0 && showOdds && !me.folded && (
        <LiveOddsPanel
          hole={me.hand}
          community={state.community}
          pot={state.pot}
          toCall={Math.max(0, state.toCall - me.streetBet)}
          phase={state.phase}
        />
      )}

      {/* ベットサイズ */}
      {!state.finished && state.toAct === 0 && (acts.includes('bet') || acts.includes('raise')) && (
        <div className="panel mb-3">
          <div className="flex items-center justify-between mb-2">
            <div className="text-xs text-white/60">💵 ベットサイズ</div>
            <div className="text-sm font-mono font-bold text-chipGold">{betSize}</div>
          </div>
          <div className="grid grid-cols-4 gap-1.5 mb-2">
            {BET_SIZE_OPTIONS.map(opt => {
              const amt = clampMultiBet(state, Math.floor(state.pot * opt.potRatio));
              const active = betSize === amt;
              return (
                <button key={opt.key} onClick={() => setBetSize(amt)}
                  className={`text-xs px-1 py-1.5 rounded-lg border transition ${
                    active ? 'border-chipGold bg-chipGold/20 text-chipGold' : 'border-white/15 hover:bg-white/10'
                  }`}>
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
              max={me.chips}
              step={10}
              value={betSize}
              onChange={(e) => setBetSize(Number(e.target.value))}
              className="flex-1 accent-chipGold"
            />
            <button onClick={() => setBetSize(me.chips)}
              className="text-[10px] px-2 py-1 rounded border border-red-400/40 text-red-200 hover:bg-red-500/10">
              ALL-IN
            </button>
          </div>
        </div>
      )}

      {/* アクション */}
      {!state.finished ? (
        state.toAct === 0 && !me.folded && !me.allIn ? (
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mb-3">
            {(['check', 'bet', 'call', 'raise', 'fold'] as ActionType[]).map(a => {
              const enabled = acts.includes(a);
              const aggressive = a === 'bet' || a === 'raise';
              return (
                <button key={a}
                  disabled={!enabled}
                  onClick={() => onAction(a)}
                  className={`${enabled
                    ? a === 'fold' ? 'btn-danger'
                    : aggressive ? 'btn-primary'
                    : 'btn-success'
                    : 'btn-secondary opacity-40'} !text-sm whitespace-nowrap`}
                >
                  {actionJa4(a)}
                  {aggressive && enabled && <span className="ml-1 text-[10px] opacity-70">{betSize}</span>}
                </button>
              );
            })}
          </div>
        ) : (
          <div className="panel mb-3 text-center text-sm text-white/70">
            {me.folded ? 'あなたは降りています。CPUが進行中…' : 'CPU が思考中…'}
          </div>
        )
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
              あなた: <b>{actionJa4(feedback.yourAction)}</b> /
              おすすめ: <b className="text-chipGold">{actionJa4(feedback.suggested)}</b>
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
          {state.log.slice(-15).map((l, i) => (
            <div key={i} className={
              l.who === 'system' ? 'text-white/60'
              : l.who === 'you' ? 'text-emerald-300'
              : 'text-red-300'
            }>
              {l.who === 'you' ? '🟢 あなた: ' : l.who === 'cpu' ? '🤖 ' : '🔵 '}
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
