import type { ActionType, Card, Phase, SimulationState } from '../types';
import { fullDeck, shuffle } from './deck';
import { compareResults, evaluateBest } from './handEvaluator';

const STARTING_CHIPS = 2000;
const SB = 10;
const BB = 20;

export function newSimulation(): SimulationState {
  const deck = shuffle(fullDeck());
  const playerHand = [deck.pop()!, deck.pop()!];
  const cpuHand = [deck.pop()!, deck.pop()!];
  const pot = SB + BB;
  return {
    deck,
    playerHand,
    cpuHand,
    community: [],
    pot,
    playerChips: STARTING_CHIPS - BB,
    cpuChips: STARTING_CHIPS - BB,
    toCall: 0,
    phase: 'preflop',
    log: [
      { who: 'system', msg: '新しいハンドが始まりました。SB+BB=30 がポットに入っています。' },
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

const BET_SIZE = 60;

// プレイヤーのアクションを処理
export function applyPlayerAction(
  state: SimulationState,
  action: ActionType
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

  // 推奨アクションを計算
  const suggested = suggestAction(s);

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

    case 'bet':
      if (s.toCall > 0) {
        // ベットが既にあるならレイズ扱い
        return applyPlayerAction(s, 'raise');
      }
      s.playerChips -= BET_SIZE;
      s.pot += BET_SIZE;
      s.toCall = 0;
      s.log.push({ who: 'you', msg: `ベット（${BET_SIZE}）` });
      // CPUに渡す
      respondToPlayerBet(s, BET_SIZE);
      break;

    case 'raise': {
      const total = s.toCall + BET_SIZE; // コール分 + さらに上乗せ
      s.playerChips -= total;
      s.pot += total;
      s.log.push({ who: 'you', msg: `レイズ（さらに${BET_SIZE}）` });
      s.toCall = 0;
      respondToPlayerBet(s, BET_SIZE);
      break;
    }
  }

  // フィードバック作成（プレイヤーの意思決定への評価）
  feedback = makeFeedback(s, action, suggested, playerBest);

  return { state: s, feedback };
}

function suggestAction(state: SimulationState): ActionType {
  if (state.phase === 'preflop') {
    const [a, b] = state.playerHand;
    const high = Math.max(a.rank, b.rank);
    const low = Math.min(a.rank, b.rank);
    const pair = a.rank === b.rank;
    const suited = a.suit === b.suit;
    const strong = (pair && high >= 9) || (high === 14 && low >= 12) || (high >= 13 && low >= 12);
    const ok = (pair && high >= 7) || (high === 14 && low >= 10) || (high >= 12 && low >= 11) || (suited && high - low <= 2 && low >= 8);
    if (state.toCall > 0) {
      if (strong) return 'raise';
      if (ok) return 'call';
      return 'fold';
    }
    return strong ? 'bet' : 'check';
  }
  // ポストフロップ
  const best = evaluateBest([...state.playerHand, ...state.community]);
  const dangerous = boardDanger(state.community);
  if (state.toCall > 0) {
    if (best.rank >= 5) return 'raise';
    if (best.rank >= 3 && !dangerous) return 'call';
    if (best.rank >= 2 && !dangerous) return 'call';
    return 'fold';
  }
  if (best.rank >= 4) return 'bet';
  if (best.rank >= 2 && !dangerous) return 'bet';
  return 'check';
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

function respondToPlayerBet(s: SimulationState, betAmt: number) {
  // CPUの応答
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
    s.cpuChips -= s.toCall;
    s.pot += s.toCall;
    s.log.push({ who: 'cpu', msg: `CPUはコール（${s.toCall}）` });
    s.toCall = 0;
    advanceStreet(s);
    return;
  }
  if (cpuAct === 'raise') {
    const total = s.toCall + BET_SIZE;
    s.cpuChips -= total;
    s.pot += total;
    s.log.push({ who: 'cpu', msg: `CPUはレイズ（さらに${BET_SIZE}）` });
    s.toCall = BET_SIZE; // プレイヤーがコール/フォールド/再レイズ
    return;
  }
}

function cpuActAndAdvance(s: SimulationState) {
  // プレイヤーがチェック→CPUの番
  const act = cpuPostflopAction({ ...s, toCall: 0 });
  if (act === 'check' || s.phase === 'preflop') {
    s.log.push({ who: 'cpu', msg: 'CPUはチェック' });
    advanceStreet(s);
    return;
  }
  if (act === 'bet') {
    s.cpuChips -= BET_SIZE;
    s.pot += BET_SIZE;
    s.toCall = BET_SIZE;
    s.log.push({ who: 'cpu', msg: `CPUはベット（${BET_SIZE}）` });
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
  playerBest: ReturnType<typeof evaluateBest> | null
): SimulationState['feedback'] {
  const dangerous = s.community.length >= 3 && boardDanger(s.community);
  const matched = yourAction === suggested;
  const good = matched
    ? '判断OK。状況に合った行動です。'
    : `推奨は「${actionJa(suggested)}」でした。`;
  let risk = '';
  if (yourAction === 'fold' && (suggested === 'bet' || suggested === 'raise')) {
    risk = '強い手で降りるとチップを増やすチャンスを逃します。次は強気で行ってOK。';
  } else if ((yourAction === 'call' || yourAction === 'raise') && suggested === 'fold') {
    risk = '弱い手や危険な場で参加するとチップを失いがち。「迷ったら降りる」を思い出して。';
  } else if (yourAction === 'check' && suggested === 'bet') {
    risk = '強い手はベットして相手から払ってもらう方が得です。';
  } else {
    risk = '大きな問題はなし。';
  }
  let next = '次の場面では「①自分の役 ②場の危険 ③相手の動き」の3点を見ましょう。';
  if (dangerous) next = '場に同マーク3枚や連続数字があるときは特に慎重に。';
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
