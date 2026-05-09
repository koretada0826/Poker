import type { ActionType, Card, Phase, SimulationState } from '../types';
import { fullDeck, shuffle } from './deck';
import { compareResults, evaluateBest } from './handEvaluator';
import { equityVsRandom } from './equity';
import { requiredEquity, evCall } from './pokerMath';

export const STARTING_CHIPS = 2000;
const SB = 10;
const BB = 20;

export function newSimulation(carry?: { playerChips?: number; cpuChips?: number; button?: 'you' | 'cpu' }): SimulationState {
  const deck = shuffle(fullDeck());
  const playerHand = [deck.pop()!, deck.pop()!];
  const cpuHand = [deck.pop()!, deck.pop()!];
  const pot = SB + BB;
  const button: 'you' | 'cpu' = carry?.button === 'you' ? 'cpu' : 'you'; // 交代
  // ヘッズアップではボタン=SB
  const playerIsBtn = button === 'you';
  const playerPaid = playerIsBtn ? SB : BB;
  const cpuPaid = playerIsBtn ? BB : SB;
  const baseP = carry?.playerChips ?? STARTING_CHIPS;
  const baseC = carry?.cpuChips ?? STARTING_CHIPS;
  return {
    deck,
    playerHand,
    cpuHand,
    community: [],
    pot,
    playerChips: baseP - playerPaid,
    cpuChips: baseC - cpuPaid,
    toCall: playerIsBtn ? BB - SB : 0, // BTNはSBを払い済み、BBにコール必要
    phase: 'preflop',
    button,
    log: [
      { who: 'system', msg: `新しいハンド開始（ボタン: ${playerIsBtn ? 'あなた' : 'CPU'}）。SB+BB=30 がポットに。` },
      { who: 'system', msg: 'プリフロップ：自分の手札2枚を見て判断しましょう。' },
    ],
    finished: false,
  };
}

// プリフロップでのCPUアクション(SBから先に動く)
function cpuPreflopAction(state: SimulationState): ActionType {
  const [a, b] = state.cpuHand;
  const high = Math.max(a.rank, b.rank);
  const low = Math.min(a.rank, b.rank);
  const pair = a.rank === b.rank;
  const suited = a.suit === b.suit;

  // 強い手: AA-77, AK, AQ, KQ
  if (pair && high >= 7) return Math.random() < 0.7 ? 'raise' : 'call';
  if (high === 14 && low >= 12) return Math.random() < 0.6 ? 'raise' : 'call';
  if (high === 14 && low >= 10 && suited) return 'call';
  if (high >= 12 && low >= 11) return 'call';
  if (high - low <= 2 && suited && low >= 8) return 'call';
  if (high === 14 && low >= 8) return 'call';
  // それ以外は半分くらい降りる
  return Math.random() < 0.55 ? 'fold' : 'call';
}

function cpuPostflopAction(state: SimulationState): ActionType {
  // CPUの最強役
  const cpuBest = evaluateBest([...state.cpuHand, ...state.community]);
  // 場に対するCPUの強さ
  const r = cpuBest.rank;

  // 既にプレイヤーがベットしている場合
  if (state.toCall > 0) {
    if (r >= 4) return Math.random() < 0.5 ? 'raise' : 'call';
    if (r >= 2) return Math.random() < 0.6 ? 'call' : 'fold';
    // ハイカードでも稀にコール
    return Math.random() < 0.2 ? 'call' : 'fold';
  }
  // チェック許可状況
  if (r >= 4) return 'bet';
  if (r >= 2) return Math.random() < 0.4 ? 'bet' : 'check';
  // たまにブラフ
  return Math.random() < 0.15 ? 'bet' : 'check';
}

const NEXT_PHASE: Record<Phase, Phase> = {
  preflop: 'flop',
  flop: 'turn',
  turn: 'river',
  river: 'showdown',
  showdown: 'showdown',
};

function dealCommunity(state: SimulationState): SimulationState {
  const next: Card[] = [...state.community];
  if (state.phase === 'preflop') {
    next.push(state.deck.pop()!, state.deck.pop()!, state.deck.pop()!);
    state.log.push({ who: 'system', msg: `フロップ：${next.slice(-3).map(c => c.display).join(' ')}` });
  } else if (state.phase === 'flop') {
    next.push(state.deck.pop()!);
    state.log.push({ who: 'system', msg: `ターン：${next[3].display}` });
  } else if (state.phase === 'turn') {
    next.push(state.deck.pop()!);
    state.log.push({ who: 'system', msg: `リバー：${next[4].display}` });
  }
  return { ...state, community: next, phase: NEXT_PHASE[state.phase], toCall: 0 };
}

interface ActionResult {
  state: SimulationState;
  feedback: SimulationState['feedback'];
}

// プリセットのベットサイズ（pot比）
export const BET_SIZE_OPTIONS: { key: string; label: string; potRatio: number }[] = [
  { key: 'third', label: '1/3 pot', potRatio: 1 / 3 },
  { key: 'half',  label: '1/2 pot', potRatio: 1 / 2 },
  { key: 'pot',   label: 'pot',     potRatio: 1 },
  { key: 'over',  label: '2x pot',  potRatio: 2 },
];

export function defaultBetSize(state: SimulationState): number {
  return Math.max(20, Math.floor(state.pot / 2));
}

export function clampBet(state: SimulationState, amt: number): number {
  return Math.max(20, Math.min(state.playerChips, Math.floor(amt)));
}

// プレイヤーのアクションを処理
export function applyPlayerAction(
  state: SimulationState,
  action: ActionType,
  betAmount?: number
): ActionResult {
  if (state.finished) return { state, feedback: undefined };
  const s: SimulationState = {
    ...state,
    log: [...state.log],
    deck: state.deck.slice(),
    community: state.community.slice(),
  };
  const playerBest =
    s.community.length >= 3 ? evaluateBest([...s.playerHand, ...s.community]) : null;

  // 推奨アクションを計算（数式ベース）
  const suggestedRes = suggestActionMath(s);
  const suggested = suggestedRes.action;

  let feedback: SimulationState['feedback'] = undefined;

  switch (action) {
    case 'fold':
      s.log.push({ who: 'you', msg: 'フォールド（降りました）' });
      s.cpuChips += s.pot;
      s.finished = true;
      s.winner = 'cpu';
      s.log.push({ who: 'system', msg: 'CPUがポットを獲得しました。' });
      break;

    case 'check':
      if (s.toCall > 0) {
        s.log.push({ who: 'you', msg: 'チェックは選べません（前にベットがあります）。コール扱いにします。' });
        return applyPlayerAction(s, 'call');
      }
      s.log.push({ who: 'you', msg: 'チェック' });
      // CPUの番
      cpuActAndAdvance(s);
      break;

    case 'call':
      if (s.toCall === 0) {
        s.log.push({ who: 'you', msg: 'コールは選べません（前にベットがありません）。チェックにします。' });
        return applyPlayerAction(s, 'check');
      }
      s.playerChips -= s.toCall;
      s.pot += s.toCall;
      s.log.push({ who: 'you', msg: `コール（${s.toCall}）` });
      s.toCall = 0;
      // ラウンド終了
      advanceStreet(s);
      break;

    case 'bet': {
      if (s.toCall > 0) {
        return applyPlayerAction(s, 'raise', betAmount);
      }
      const amt = clampBet(s, betAmount ?? defaultBetSize(s));
      s.playerChips -= amt;
      s.pot += amt;
      s.toCall = 0;
      s.log.push({ who: 'you', msg: `ベット（${amt}）` });
      respondToPlayerBet(s, amt);
      break;
    }

    case 'raise': {
      const raiseTo = clampBet(s, betAmount ?? defaultBetSize(s));
      const total = s.toCall + raiseTo;
      const pay = Math.min(s.playerChips, total);
      s.playerChips -= pay;
      s.pot += pay;
      s.log.push({ who: 'you', msg: `レイズ（さらに${raiseTo}）` });
      s.toCall = 0;
      respondToPlayerBet(s, raiseTo);
      break;
    }
  }

  // フィードバック作成（プレイヤーの意思決定への評価）
  feedback = makeFeedback(s, action, suggested, playerBest, suggestedRes);

  return { state: s, feedback };
}

interface SuggestResult {
  action: ActionType;
  equity: number;       // %
  required: number;     // %
  ev: number;           // chips
}

// 数学（エクイティ＋ポットオッズ＋EV）に基づく推奨。
// MC=200シムなので軽量、決定の根拠を返す。
export function suggestActionMath(state: SimulationState): SuggestResult {
  const sims = state.phase === 'preflop' ? 200 : 250;
  const eq = equityVsRandom(state.playerHand, state.community, sims).equity;
  const req = state.toCall > 0 ? requiredEquity(state.pot, state.toCall) : 0;
  const ev = state.toCall > 0 ? evCall(state.pot, state.toCall, eq / 100) : 0;

  if (state.toCall > 0) {
    const margin = eq - req;
    if (margin >= 18) return { action: 'raise', equity: eq, required: req, ev };
    if (margin >= 0)  return { action: 'call',  equity: eq, required: req, ev };
    return { action: 'fold', equity: eq, required: req, ev };
  }
  // チェックできる場面
  if (eq >= 65) return { action: 'bet',   equity: eq, required: req, ev };
  if (eq >= 48) return { action: 'check', equity: eq, required: req, ev }; // 中堅は受けで
  return { action: 'check', equity: eq, required: req, ev };
}

// 後方互換用
function suggestAction(state: SimulationState): ActionType {
  return suggestActionMath(state).action;
}

function boardDanger(community: Card[]): boolean {
  if (community.length < 3) return false;
  // 同マーク3枚
  const counts = new Map<string, number>();
  for (const c of community) counts.set(c.suit, (counts.get(c.suit) || 0) + 1);
  if (Array.from(counts.values()).some(v => v >= 3)) return true;
  // 連続数字3枚
  const ranks = community.map(c => c.rank).sort((a, b) => a - b);
  for (let i = 0; i + 2 < ranks.length; i++) {
    if (ranks[i + 2] - ranks[i] <= 4 && new Set(ranks.slice(i, i + 3)).size === 3) return true;
  }
  return false;
}

function cpuBetSize(s: SimulationState): number {
  // pot比率でランダムに選ぶ（1/2〜1pot を中心）
  const ratios = [0.5, 0.66, 0.75, 1.0];
  const r = ratios[Math.floor(Math.random() * ratios.length)];
  return Math.max(20, Math.min(s.cpuChips, Math.floor(s.pot * r)));
}

function respondToPlayerBet(s: SimulationState, betAmt: number) {
  s.toCall = betAmt;
  const cpuAct = cpuPostflopAction(s);
  if (cpuAct === 'fold') {
    s.log.push({ who: 'cpu', msg: 'CPUはフォールド' });
    s.playerChips += s.pot;
    s.finished = true;
    s.winner = 'you';
    s.log.push({ who: 'system', msg: 'あなたがポットを獲得しました！' });
    return;
  }
  if (cpuAct === 'call') {
    const pay = Math.min(s.cpuChips, s.toCall);
    s.cpuChips -= pay;
    s.pot += pay;
    s.log.push({ who: 'cpu', msg: `CPUはコール（${pay}）` });
    s.toCall = 0;
    advanceStreet(s);
    return;
  }
  if (cpuAct === 'raise') {
    const raise = cpuBetSize(s);
    const total = s.toCall + raise;
    const pay = Math.min(s.cpuChips, total);
    s.cpuChips -= pay;
    s.pot += pay;
    s.log.push({ who: 'cpu', msg: `CPUはレイズ（さらに${raise}）` });
    s.toCall = raise;
    return;
  }
}

function cpuActAndAdvance(s: SimulationState) {
  const act = cpuPostflopAction({ ...s, toCall: 0 });
  if (act === 'check' || s.phase === 'preflop') {
    s.log.push({ who: 'cpu', msg: 'CPUはチェック' });
    advanceStreet(s);
    return;
  }
  if (act === 'bet') {
    const amt = cpuBetSize(s);
    s.cpuChips -= amt;
    s.pot += amt;
    s.toCall = amt;
    s.log.push({ who: 'cpu', msg: `CPUはベット（${amt}）` });
    return;
  }
}

function advanceStreet(s: SimulationState) {
  if (s.finished) return;
  if (s.phase === 'river') {
    showdown(s);
    return;
  }
  // CPUがプリフロップで先に動いていない場合の処理は省略
  const dealt = dealCommunity(s);
  Object.assign(s, dealt);
  // フロップ以降はプレイヤーから先
}

function showdown(s: SimulationState) {
  const you = evaluateBest([...s.playerHand, ...s.community]);
  const cpu = evaluateBest([...s.cpuHand, ...s.community]);
  s.log.push({ who: 'system', msg: `ショーダウン：あなた=${you.jaName} / CPU=${cpu.jaName}` });
  const cmp = compareResults(you, cpu);
  if (cmp > 0) {
    s.playerChips += s.pot;
    s.winner = 'you';
    s.log.push({ who: 'system', msg: 'あなたの勝ち！ポット獲得。' });
  } else if (cmp < 0) {
    s.cpuChips += s.pot;
    s.winner = 'cpu';
    s.log.push({ who: 'system', msg: 'CPUの勝ち。' });
  } else {
    s.playerChips += Math.floor(s.pot / 2);
    s.cpuChips += Math.ceil(s.pot / 2);
    s.winner = 'tie';
    s.log.push({ who: 'system', msg: '引き分け（チョップ）。ポットは分配。' });
  }
  s.phase = 'showdown';
  s.finished = true;
}

function makeFeedback(
  s: SimulationState,
  yourAction: ActionType,
  suggested: ActionType,
  playerBest: ReturnType<typeof evaluateBest> | null,
  res?: SuggestResult
): SimulationState['feedback'] {
  const dangerous = s.community.length >= 3 && boardDanger(s.community);
  const matched = yourAction === suggested;
  const eq = res ? res.equity.toFixed(0) : '?';
  const req = res ? res.required.toFixed(0) : '?';
  const ev = res ? res.ev : 0;

  // 数字を含む解説（小学生にも分かるよう「10回中何回勝てるか」も併記）
  const eqWords = res ? `（10回中およそ${Math.round(res.equity / 10)}回勝てる強さ）` : '';
  const good = matched
    ? `判断OK。あなたの勝率は${eq}%${eqWords}、推奨と一致した良い選択です。`
    : `推奨は「${actionJa(suggested)}」でした。あなたの勝率は${eq}%${eqWords}。`;

  let risk = '';
  if (res && res.required > 0) {
    if (yourAction === 'fold' && (suggested === 'bet' || suggested === 'raise' || suggested === 'call')) {
      risk = `必要勝率${req}% < あなたの勝率${eq}% → コールしても長期で得（+EV ${ev.toFixed(0)}チップ）。降りるとチャンスを逃します。`;
    } else if ((yourAction === 'call' || yourAction === 'raise') && suggested === 'fold') {
      risk = `必要勝率${req}% > あなたの勝率${eq}% → 払うほどの勝ち目がない（−EV ${ev.toFixed(0)}チップ）。「迷ったら降りる」が正解。`;
    } else {
      risk = `必要勝率${req}% / あなたの勝率${eq}% → ${ev >= 0 ? '+' : ''}${ev.toFixed(0)}チップの期待値。`;
    }
  } else {
    if (yourAction === 'check' && suggested === 'bet') {
      risk = `あなたの勝率${eq}%は十分高い。ベットして相手から払ってもらう方が得です。`;
    } else if (yourAction === 'bet' && suggested === 'check') {
      risk = `あなたの勝率${eq}%だと攻めるほど強くない。チェックして無料で次のカードを見るのが安全。`;
    } else {
      risk = matched ? '良い判断。' : `あなたの勝率${eq}%。状況をもう一度見直してみよう。`;
    }
  }

  let next = '次は「①勝率 ②必要勝率 ③EV」の3点を必ずチェック。';
  if (dangerous) next = '場に同マーク3枚や連続数字。誰かが強い役の可能性。慎重に。';
  if (playerBest) next = `${next} 現在の役: ${playerBest.jaName}`;
  return { yourAction, suggested, good, risk, next };
}

export function actionJa(a: ActionType): string {
  return {
    check: 'チェック',
    bet: 'ベット',
    call: 'コール',
    raise: 'レイズ',
    fold: 'フォールド',
  }[a];
}

export function availableActions(s: SimulationState): ActionType[] {
  if (s.finished) return [];
  if (s.toCall > 0) return ['fold', 'call', 'raise'];
  return ['check', 'bet', 'fold'];
}
