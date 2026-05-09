// 4人卓 (4-max) のヘッズアップではないシミュレーション
// 簡略化:
//  - 席は固定 4人 (you=0, cpu1=1, cpu2=2, cpu3=3)
//  - ボタンが毎ハンド時計回りに回る
//  - SB = button+1, BB = button+2 (mod 4)
//  - プリフロップ：UTG = button+3 から開始 (=BB+1)
//  - ポストフロップ：SB から開始（フォールド済みなら次の生存者）
//  - サイドポット計算は省略（オールイン時は単一ポットで処理＝公平性は実戦より粗い）

import type { ActionType, Card, Phase } from '../types';
import { fullDeck, shuffle } from './deck';
import { compareResults, evaluateBest } from './handEvaluator';
import { equityVsRandom } from './equity';

export const STARTING_CHIPS_MULTI = 2000;
const SB = 10;
const BB = 20;
export const SEAT_NAMES = ['あなた', 'CPU-A', 'CPU-B', 'CPU-C'];

export interface MultiPlayer {
  id: number;            // 0..3
  name: string;
  hand: Card[];
  chips: number;
  streetBet: number;     // この街でのベット累計
  totalCommitted: number; // このハンドでのコミット合計（参考）
  folded: boolean;
  allIn: boolean;
  hasActed: boolean;     // この街で1回以上アクションしたか
  isHuman: boolean;
}

export interface MultiSimState {
  deck: Card[];
  community: Card[];
  pot: number;
  players: MultiPlayer[];
  buttonIdx: number;
  toAct: number;         // 次に行動する席 idx
  toCall: number;        // 街レベルの最大ベット
  minRaise: number;      // 最小レイズ増分
  phase: Phase;
  log: { who: string; msg: string }[];
  finished: boolean;
  winners?: number[];
  showdownReveal?: { idx: number; jaName: string }[];
  feedback?: {
    yourAction: ActionType;
    suggested: ActionType;
    good: string;
    risk: string;
    next: string;
  };
}

// ---------- ハンド開始 ----------
export function newMultiSim(carry?: { chips?: number[]; lastButton?: number }): MultiSimState {
  const deck = shuffle(fullDeck());
  const buttonIdx = ((carry?.lastButton ?? 3) + 1) % 4;

  const baseChips: number[] = carry?.chips ?? [STARTING_CHIPS_MULTI, STARTING_CHIPS_MULTI, STARTING_CHIPS_MULTI, STARTING_CHIPS_MULTI];
  const players: MultiPlayer[] = Array.from({ length: 4 }, (_, i) => ({
    id: i,
    name: SEAT_NAMES[i],
    hand: [deck.pop()!, deck.pop()!],
    chips: baseChips[i],
    streetBet: 0,
    totalCommitted: 0,
    folded: false,
    allIn: false,
    hasActed: false,
    isHuman: i === 0,
  }));

  // ブラインド徴収
  const sbIdx = (buttonIdx + 1) % 4;
  const bbIdx = (buttonIdx + 2) % 4;
  postBlind(players[sbIdx], SB);
  postBlind(players[bbIdx], BB);

  const state: MultiSimState = {
    deck,
    community: [],
    pot: SB + BB,
    players,
    buttonIdx,
    toAct: (buttonIdx + 3) % 4, // UTG = BB+1
    toCall: BB,
    minRaise: BB,
    phase: 'preflop',
    log: [
      { who: 'system', msg: `新しいハンド開始（ボタン: ${SEAT_NAMES[buttonIdx]}）。SB+BB=${SB + BB} がポット` },
      { who: 'system', msg: `${SEAT_NAMES[(buttonIdx + 3) % 4]} の番（UTG）` },
    ],
    finished: false,
  };

  // 4人卓ではUTGからスタート。プレイヤー以外は自動進行（プレイヤーの番まで）
  return advanceCpuActions(state);
}

function postBlind(p: MultiPlayer, amt: number) {
  const pay = Math.min(p.chips, amt);
  p.chips -= pay;
  p.streetBet += pay;
  p.totalCommitted += pay;
  if (p.chips === 0) p.allIn = true;
}

// ---------- ストリート進行管理 ----------
function nonFolded(state: MultiSimState): MultiPlayer[] {
  return state.players.filter(p => !p.folded);
}
function nonFoldedNotAllIn(state: MultiSimState): MultiPlayer[] {
  return state.players.filter(p => !p.folded && !p.allIn);
}

function isStreetClosed(state: MultiSimState): boolean {
  const live = nonFoldedNotAllIn(state);
  if (live.length === 0) return true;
  // 全員 acted＆全員のbetがtoCallと同じ（または allIn）
  for (const p of live) {
    if (!p.hasActed) return false;
    if (p.streetBet !== state.toCall) return false;
  }
  return true;
}

function nextLiveAfter(state: MultiSimState, idx: number): number {
  for (let i = 1; i <= 4; i++) {
    const j = (idx + i) % 4;
    const p = state.players[j];
    if (!p.folded && !p.allIn) return j;
  }
  return idx;
}

function postflopFirstActor(state: MultiSimState): number {
  // SB から、フォールド/オールインを飛ばして最初の生存者
  const sb = (state.buttonIdx + 1) % 4;
  if (!state.players[sb].folded && !state.players[sb].allIn) return sb;
  return nextLiveAfter(state, sb);
}

function dealCommunityForNextStreet(state: MultiSimState) {
  if (state.phase === 'preflop') {
    state.community.push(state.deck.pop()!, state.deck.pop()!, state.deck.pop()!);
    state.phase = 'flop';
    state.log.push({ who: 'system', msg: `フロップ: ${state.community.slice(-3).map(c => c.display).join(' ')}` });
  } else if (state.phase === 'flop') {
    state.community.push(state.deck.pop()!);
    state.phase = 'turn';
    state.log.push({ who: 'system', msg: `ターン: ${state.community.slice(-1)[0].display}` });
  } else if (state.phase === 'turn') {
    state.community.push(state.deck.pop()!);
    state.phase = 'river';
    state.log.push({ who: 'system', msg: `リバー: ${state.community.slice(-1)[0].display}` });
  } else if (state.phase === 'river') {
    state.phase = 'showdown';
  }
  // ストリート初期化
  for (const p of state.players) {
    p.streetBet = 0;
    p.hasActed = false;
  }
  state.toCall = 0;
  state.minRaise = BB;
  if (state.phase !== 'showdown') {
    state.toAct = postflopFirstActor(state);
  }
}

// ---------- アクション ----------
export function availableMultiActions(state: MultiSimState): ActionType[] {
  if (state.finished) return [];
  if (state.toAct !== 0) return [];
  const me = state.players[0];
  if (me.folded || me.allIn) return [];
  const owe = state.toCall - me.streetBet;
  if (owe > 0) {
    if (me.chips <= owe) return ['fold', 'call']; // call はオールインコール
    return ['fold', 'call', 'raise'];
  }
  return ['check', 'bet', 'fold'];
}

export function defaultMultiBet(state: MultiSimState): number {
  return Math.max(BB, Math.floor(state.pot / 2));
}

export function clampMultiBet(state: MultiSimState, amt: number): number {
  const me = state.players[0];
  return Math.max(BB, Math.min(me.chips, Math.floor(amt)));
}

interface ApplyResult {
  state: MultiSimState;
  feedback: MultiSimState['feedback'];
}

// プレイヤーのアクション
export function applyHumanAction(
  state: MultiSimState,
  action: ActionType,
  betAmount?: number
): ApplyResult {
  if (state.finished || state.toAct !== 0) return { state, feedback: undefined };
  // copy
  const s = cloneState(state);
  const me = s.players[0];
  const suggested = suggestForHuman(s);
  const owe = s.toCall - me.streetBet;

  switch (action) {
    case 'fold':
      me.folded = true;
      me.hasActed = true;
      s.log.push({ who: 'you', msg: 'フォールド' });
      break;

    case 'check':
      if (owe > 0) {
        // 自動的にcall扱い
        return applyHumanAction(s, 'call', betAmount);
      }
      me.hasActed = true;
      s.log.push({ who: 'you', msg: 'チェック' });
      break;

    case 'call': {
      if (owe <= 0) {
        return applyHumanAction(s, 'check', betAmount);
      }
      const pay = Math.min(me.chips, owe);
      me.chips -= pay;
      me.streetBet += pay;
      me.totalCommitted += pay;
      s.pot += pay;
      if (me.chips === 0) me.allIn = true;
      me.hasActed = true;
      s.log.push({ who: 'you', msg: `コール（${pay}）` });
      break;
    }

    case 'bet': {
      if (s.toCall > 0) return applyHumanAction(s, 'raise', betAmount);
      const amt = clampMultiBet(s, betAmount ?? defaultMultiBet(s));
      const pay = Math.min(me.chips, amt);
      me.chips -= pay;
      me.streetBet += pay;
      me.totalCommitted += pay;
      s.pot += pay;
      s.toCall = me.streetBet;
      s.minRaise = pay;
      if (me.chips === 0) me.allIn = true;
      me.hasActed = true;
      // 他プレイヤーは再アクション必要
      for (const other of s.players) {
        if (other.id !== me.id && !other.folded && !other.allIn) other.hasActed = false;
      }
      s.log.push({ who: 'you', msg: `ベット（${pay}）` });
      break;
    }

    case 'raise': {
      const raiseTo = clampMultiBet(s, betAmount ?? defaultMultiBet(s));
      const newTotal = s.toCall + raiseTo; // toCallを払って＋raiseTo分上乗せ
      const pay = Math.min(me.chips, newTotal - me.streetBet);
      me.chips -= pay;
      me.streetBet += pay;
      me.totalCommitted += pay;
      s.pot += pay;
      s.toCall = me.streetBet;
      s.minRaise = raiseTo;
      if (me.chips === 0) me.allIn = true;
      me.hasActed = true;
      for (const other of s.players) {
        if (other.id !== me.id && !other.folded && !other.allIn) other.hasActed = false;
      }
      s.log.push({ who: 'you', msg: `レイズ（さらに${raiseTo}）` });
      break;
    }
  }

  // 次のアクション者を進める
  s.toAct = nextLiveAfter(s, s.toAct);

  // 街がクローズ or 全員フォールドなら進行
  const advanced = advanceIfNeeded(s);
  // CPUを自動進行
  const finalState = advanceCpuActions(advanced);

  const feedback = makeFeedback(finalState, action, suggested.action, suggested);
  return { state: finalState, feedback };
}

function advanceIfNeeded(state: MultiSimState): MultiSimState {
  // 1人だけ生存→そのままポット獲得
  const live = nonFolded(state);
  if (live.length === 1) {
    const w = live[0];
    w.chips += state.pot;
    state.winners = [w.id];
    state.finished = true;
    state.log.push({ who: 'system', msg: `${w.name} がポット ${state.pot} を獲得（他は降りた）` });
    return state;
  }
  // 街がクローズ
  if (isStreetClosed(state)) {
    if (state.phase === 'river') {
      doShowdown(state);
      return state;
    }
    dealCommunityForNextStreet(state);
    return state;
  }
  return state;
}

function advanceCpuActions(state: MultiSimState): MultiSimState {
  // 上限ループ防止
  let safety = 0;
  while (!state.finished && state.toAct !== 0 && safety < 50) {
    safety++;
    const cur = state.players[state.toAct];
    if (cur.folded || cur.allIn) {
      state.toAct = nextLiveAfter(state, state.toAct);
      continue;
    }
    // CPUアクションを決定
    cpuTurn(state, cur);
    state.toAct = nextLiveAfter(state, state.toAct);
    state = advanceIfNeeded(state);
    if (state.finished) break;
    // プレイヤーがフォールド/オールインなら、残りCPUだけで終わるまで進める
    if (state.toAct === 0 && (state.players[0].folded || state.players[0].allIn)) {
      // プレイヤーは行動できないので CPU進行を続ける
      const live = nonFoldedNotAllIn(state);
      if (live.length === 0) {
        // 全員allin or fold → 残り生存者で showdown
        // 必要ならボードを補完
        while (state.community.length < 5 && !state.finished) {
          dealCommunityForNextStreet(state);
        }
        if (state.phase !== 'showdown') doShowdown(state);
        break;
      }
      // 次の生きてるCPUに進める
      state.toAct = nextLiveAfter(state, state.toAct);
    }
  }
  return state;
}

// ---------- CPU ロジック ----------
function cpuTurn(state: MultiSimState, p: MultiPlayer) {
  const owe = state.toCall - p.streetBet;
  // 簡易AI: equity ベース（軽量に）
  let eq = 0.5;
  try {
    const sims = state.phase === 'preflop' ? 100 : 150;
    eq = equityVsRandom(p.hand, state.community, sims).equity / 100;
  } catch {
    eq = 0.5;
  }
  // 個性: 席ごとに少しランダム
  const noise = (p.id * 0.07) - 0.1; // -0.1 〜 +0.11
  eq = Math.max(0, Math.min(1, eq + noise * 0.05));

  if (owe > 0) {
    // コール／レイズ／フォールドの判断
    const required = owe / (state.pot + owe);
    if (eq >= required + 0.18 && p.chips > owe + state.minRaise) {
      // レイズ
      const raiseAmt = Math.min(p.chips - owe, Math.max(state.minRaise, Math.floor(state.pot * 0.6)));
      const pay = Math.min(p.chips, owe + raiseAmt);
      p.chips -= pay;
      p.streetBet += pay;
      p.totalCommitted += pay;
      state.pot += pay;
      state.toCall = p.streetBet;
      state.minRaise = raiseAmt;
      if (p.chips === 0) p.allIn = true;
      p.hasActed = true;
      for (const other of state.players) {
        if (other.id !== p.id && !other.folded && !other.allIn) other.hasActed = false;
      }
      state.log.push({ who: 'cpu', msg: `${p.name} はレイズ（さらに${raiseAmt}）` });
      return;
    }
    if (eq >= required - 0.05) {
      const pay = Math.min(p.chips, owe);
      p.chips -= pay;
      p.streetBet += pay;
      p.totalCommitted += pay;
      state.pot += pay;
      if (p.chips === 0) p.allIn = true;
      p.hasActed = true;
      state.log.push({ who: 'cpu', msg: `${p.name} はコール（${pay}）` });
      return;
    }
    p.folded = true;
    p.hasActed = true;
    state.log.push({ who: 'cpu', msg: `${p.name} はフォールド` });
    return;
  }
  // チェックできる場面
  if (eq >= 0.65) {
    const amt = Math.min(p.chips, Math.max(state.minRaise, Math.floor(state.pot * 0.6)));
    p.chips -= amt;
    p.streetBet += amt;
    p.totalCommitted += amt;
    state.pot += amt;
    state.toCall = p.streetBet;
    state.minRaise = amt;
    if (p.chips === 0) p.allIn = true;
    p.hasActed = true;
    for (const other of state.players) {
      if (other.id !== p.id && !other.folded && !other.allIn) other.hasActed = false;
    }
    state.log.push({ who: 'cpu', msg: `${p.name} はベット（${amt}）` });
    return;
  }
  // 弱めならチェック
  p.hasActed = true;
  state.log.push({ who: 'cpu', msg: `${p.name} はチェック` });
}

// ---------- ショーダウン ----------
function doShowdown(state: MultiSimState) {
  const live = nonFolded(state);
  // 必要ならボードを5枚まで補完
  while (state.community.length < 5) {
    state.community.push(state.deck.pop()!);
  }
  const evals = live.map(p => ({
    idx: p.id,
    res: evaluateBest([...p.hand, ...state.community]),
  }));
  // 勝者を決める
  let best = evals[0].res;
  for (let i = 1; i < evals.length; i++) {
    if (compareResults(evals[i].res, best) > 0) best = evals[i].res;
  }
  const winnerIds = evals.filter(e => compareResults(e.res, best) === 0).map(e => e.idx);
  const share = Math.floor(state.pot / winnerIds.length);
  for (const id of winnerIds) state.players[id].chips += share;

  state.winners = winnerIds;
  state.finished = true;
  state.phase = 'showdown';
  state.showdownReveal = evals.map(e => ({ idx: e.idx, jaName: e.res.jaName }));
  state.log.push({
    who: 'system',
    msg: `ショーダウン: ${evals.map(e => `${state.players[e.idx].name}=${e.res.jaName}`).join(' / ')}`,
  });
  state.log.push({
    who: 'system',
    msg: `勝者: ${winnerIds.map(i => state.players[i].name).join(', ')}（${share}ずつ獲得）`,
  });
}

// ---------- 推奨アクション（フィードバック用） ----------
interface SuggestRes {
  action: ActionType;
  equity: number;
  required: number;
}

function suggestForHuman(state: MultiSimState): SuggestRes {
  const me = state.players[0];
  const sims = state.phase === 'preflop' ? 200 : 250;
  const eq = equityVsRandom(me.hand, state.community, sims).equity;
  const owe = state.toCall - me.streetBet;
  if (owe > 0) {
    const req = (owe / (state.pot + owe)) * 100;
    const margin = eq - req;
    if (margin >= 18 && me.chips > owe + state.minRaise) return { action: 'raise', equity: eq, required: req };
    if (margin >= 0) return { action: 'call', equity: eq, required: req };
    return { action: 'fold', equity: eq, required: req };
  }
  if (eq >= 65) return { action: 'bet', equity: eq, required: 0 };
  return { action: 'check', equity: eq, required: 0 };
}

function makeFeedback(
  _state: MultiSimState,
  yourAction: ActionType,
  suggested: ActionType,
  res: SuggestRes,
): MultiSimState['feedback'] {
  const eq = res.equity.toFixed(0);
  const req = res.required.toFixed(0);
  const matched = yourAction === suggested;
  const eqWords = `（10回中およそ${Math.round(res.equity / 10)}回勝てる強さ）`;
  const good = matched
    ? `判断OK。あなたの勝率は${eq}%${eqWords}。`
    : `推奨は「${actLabel(suggested)}」。あなたの勝率は${eq}%${eqWords}。`;
  let risk = '';
  if (res.required > 0) {
    if (yourAction === 'fold' && (suggested === 'call' || suggested === 'raise')) {
      risk = `必要勝率${req}% < あなたの勝率${eq}% → コールが長期で得。降りるとチャンスを逃す。`;
    } else if ((yourAction === 'call' || yourAction === 'raise') && suggested === 'fold') {
      risk = `必要勝率${req}% > あなたの勝率${eq}% → 払うほどの勝ち目がない。降りる方がチップが残る。`;
    } else {
      risk = `必要勝率${req}% / あなたの勝率${eq}%。`;
    }
  } else {
    if (yourAction === 'check' && suggested === 'bet') {
      risk = `あなたの勝率${eq}%は十分高い。ベットして相手から払ってもらう方が得。`;
    } else if (yourAction === 'bet' && suggested === 'check') {
      risk = `あなたの勝率${eq}%だと攻めるほど強くない。チェックで様子を見るのが安全。`;
    } else {
      risk = matched ? '良い判断。' : `あなたの勝率${eq}%。状況をもう一度見直そう。`;
    }
  }
  return {
    yourAction, suggested, good, risk,
    next: '4人卓では「他にも誰か強い手を持ってる可能性」を頭に入れよう。',
  };
}

function actLabel(a: ActionType): string {
  return { check: 'チェック', bet: 'ベット', call: 'コール', raise: 'レイズ', fold: 'フォールド' }[a];
}

// ---------- ユーティリティ ----------
function cloneState(s: MultiSimState): MultiSimState {
  return {
    ...s,
    deck: s.deck.slice(),
    community: s.community.slice(),
    log: s.log.slice(),
    players: s.players.map(p => ({ ...p, hand: p.hand.slice() })),
    showdownReveal: s.showdownReveal ? s.showdownReveal.slice() : undefined,
    winners: s.winners ? s.winners.slice() : undefined,
  };
}

export function actionJa4(a: ActionType): string {
  return actLabel(a);
}
