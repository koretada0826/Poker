// テキサスホールデムの数学ロジックを集約

import type { Card } from '../types';

// ---------- 1. ポットオッズ ----------
// コールに必要なエクイティ(%) = call / (pot + call)
// pot は「相手のベットを含んだ」現在のポット額
export function requiredEquity(pot: number, call: number): number {
  if (pot + call <= 0) return 0;
  return (call / (pot + call)) * 100;
}

// ポットオッズの「比」表記（例: 3:1）
export function potOddsRatio(pot: number, call: number): string {
  if (call <= 0) return '∞';
  const r = pot / call;
  return `${r.toFixed(1)} : 1`;
}

// ---------- 2. アウツカウント / 2-4ルール ----------
// outs = まだ生きていてヒットすれば自分の役を完成させるカード枚数
// 2/4 ルール: 残り1枚なら outs×2、残り2枚（フロップでリバーまで）なら outs×4 が概算%
export function ruleOf2(outs: number): number {
  return outs * 2;
}
export function ruleOf4(outs: number): number {
  return outs * 4;
}

// 残デッキを除外したアウツの厳密確率
// remainingCards = 残りデッキ枚数 (フロップ後47, ターン後46)
// streets = 1 (ターンまで) or 2 (リバーまで)
export function exactHitProb(outs: number, remaining: number, streets: 1 | 2): number {
  // 1 - 連続でアウツを引かない確率
  const miss1 = (remaining - outs) / remaining;
  if (streets === 1) return (1 - miss1) * 100;
  const miss2 = (remaining - 1 - outs) / (remaining - 1);
  return (1 - miss1 * miss2) * 100;
}

// ---------- 3. EV (期待値) ----------
// 単純2分岐 EV: P(win)*winAmount - P(lose)*loseAmount
export function ev2(pWin: number, winAmt: number, loseAmt: number): number {
  const pw = clamp01(pWin);
  return pw * winAmt - (1 - pw) * loseAmt;
}

// コール判定: コールしてP%で勝てる時のEV
// ポット P, コール額 C, 勝率 W (0-1)
// EV(call) = W * (P + C) - (1 - W) * C  ※ 自分の出した C を取り戻して P を獲得
export function evCall(pot: number, call: number, winRate: number): number {
  const w = clamp01(winRate);
  return w * (pot + call) - (1 - w) * call;
}

// 損益分岐勝率（ブレークイーブン）= ポットオッズ
export function breakEvenRate(pot: number, call: number): number {
  return call / (pot + call);
}

// ---------- 4. SPR (Stack-to-Pot Ratio) ----------
// SPR = 残スタック / ポット。低SPR=コミット、高SPR=慎重
export function spr(effectiveStack: number, pot: number): number {
  if (pot <= 0) return Infinity;
  return effectiveStack / pot;
}
export function sprComment(s: number): string {
  if (s < 1) return 'SPR<1: 実質オールイン圏。役できたらコミット。';
  if (s < 4) return 'SPR 1-3: コミット寄り。トップペア+でAll-inまで覚悟。';
  if (s < 8) return 'SPR 4-7: 標準。ツーペア以上でスタック争いになりやすい。';
  if (s < 13) return 'SPR 8-12: やや深い。慎重にバリューサイジング。';
  return 'SPR 13+: 深い。強い役以外でスタックを賭けない。';
}

// ---------- 5. MDF (Minimum Defense Frequency) ----------
// 相手のベットに対し、降りすぎないために必要な最低防御頻度
// MDF = pot / (pot + bet)
// 例: ポットサイズベットなら MDF = 1/2 = 50% は降りずに守る必要
export function mdf(pot: number, bet: number): number {
  if (pot + bet <= 0) return 0;
  return (pot / (pot + bet)) * 100;
}

// 相手がブラフで利益を出せる頻度（α）= bet / (pot + bet)
// "ブラフが成功して利益を出すために必要なフォールド率"
export function bluffSuccessThreshold(pot: number, bet: number): number {
  if (pot + bet <= 0) return 0;
  return (bet / (pot + bet)) * 100;
}

// ---------- 6. ベットサイズの意味 ----------
export function betSizeMeaning(betPct: number): {
  label: string;
  meaning: string;
  required: number; // 受け手が必要なエクイティ
} {
  // betPct = (bet / pot) * 100
  const required = (betPct / (100 + betPct)) * 100;
  if (betPct <= 30) return { label: '小さい (≤30%)', meaning: 'レンジベット/ブロックベット。広いハンドでチープにポットコントロール。', required };
  if (betPct <= 60) return { label: '中 (33-60%)', meaning: '標準的Cベット。ドライボードや軽いバリューに使いやすい。', required };
  if (betPct <= 90) return { label: '大 (66-100%)', meaning: 'バリュー or 強いブラフ。ウェットボードで広いレンジを潰したい時。', required };
  return { label: 'オーバーベット (>100%)', meaning: '極端な2極化。最強域 or 純ブラフ。中間域は基本オーバーベットしない。', required };
}

// ---------- 7. アウト自動カウント（簡易） ----------
// 自分の手札+ボードから「役完成までのアウト数」を概算
// 対応: フラッシュドロー、ストレートドロー（OESD/Gutshot）、ペア→トリップス、ペア→ツーペア概算
export interface OutsBreakdown {
  total: number;
  details: { kind: string; count: number }[];
}

export function countOuts(hole: Card[], board: Card[]): OutsBreakdown {
  if (board.length < 3) return { total: 0, details: [] };
  const known = [...hole, ...board];
  const knownKey = new Set(known.map(c => `${c.rank}-${c.suit}`));

  // 全47/46/45枚を仮想列挙してアウツになるカードを判定する
  // 役の rank を上げる、または現役と同じrankでも tiebreak が大きくなる場合をアウツとみなす
  // 簡略化のため、役が「上の役階梯にジャンプする」場合のみアウツと数える
  const all: { rank: number; suit: 'spades' | 'hearts' | 'diamonds' | 'clubs' }[] = [];
  const suits = ['spades', 'hearts', 'diamonds', 'clubs'] as const;
  for (let r = 2; r <= 14; r++) {
    for (const s of suits) {
      if (!knownKey.has(`${r}-${s}`)) all.push({ rank: r, suit: s });
    }
  }

  const currentRank = handRankFromCards(known);

  let outs = 0;
  const breakdown = new Map<string, number>();
  for (const c of all) {
    const newBoard = [...board, { ...c, display: '', color: 'red' as const }];
    const newRank = handRankFromCards([...hole, ...newBoard]);
    if (newRank > currentRank) {
      outs++;
      const tag =
        newRank === 6 ? 'フラッシュ完成'
        : newRank === 5 ? 'ストレート完成'
        : newRank === 4 ? 'スリーカード完成'
        : newRank === 3 ? 'ツーペア完成'
        : newRank === 2 ? 'ペア完成'
        : newRank === 7 ? 'フルハウス'
        : newRank === 8 ? 'フォーカード'
        : newRank === 9 ? 'ストレートフラッシュ'
        : '役UP';
      breakdown.set(tag, (breakdown.get(tag) || 0) + 1);
    }
  }
  return {
    total: outs,
    details: Array.from(breakdown.entries()).map(([kind, count]) => ({ kind, count })),
  };
}

// 役rankだけ返す軽量版
function handRankFromCards(cards: { rank: number; suit: string }[]): number {
  // インライン評価（5+枚から最強5枚のrank）
  if (cards.length < 5) return 1;
  const combos = combinations(cards, 5);
  let best = 1;
  for (const combo of combos) {
    const r = quickRank5(combo);
    if (r > best) best = r;
  }
  return best;
}

function combinations<T>(arr: T[], k: number): T[][] {
  const result: T[][] = [];
  const n = arr.length;
  if (k > n) return result;
  const idx = Array.from({ length: k }, (_, i) => i);
  while (true) {
    result.push(idx.map(i => arr[i]));
    let i = k - 1;
    while (i >= 0 && idx[i] === i + n - k) i--;
    if (i < 0) break;
    idx[i]++;
    for (let j = i + 1; j < k; j++) idx[j] = idx[j - 1] + 1;
  }
  return result;
}

function quickRank5(cards: { rank: number; suit: string }[]): number {
  const sorted = cards.slice().sort((a, b) => b.rank - a.rank);
  const counts = new Map<number, number>();
  for (const c of sorted) counts.set(c.rank, (counts.get(c.rank) || 0) + 1);
  const groups = Array.from(counts.values()).sort((a, b) => b - a);
  const isFlush = sorted.every(c => c.suit === sorted[0].suit);
  const ranks = sorted.map(c => c.rank);
  const uniq = Array.from(new Set(ranks));
  let isStraight = false;
  if (uniq.length === 5) {
    if (uniq[0] - uniq[4] === 4) isStraight = true;
    else if (uniq.join(',') === '14,5,4,3,2') isStraight = true;
  }
  if (isStraight && isFlush) return uniq[0] === 14 && uniq[1] === 13 ? 10 : 9;
  if (groups[0] === 4) return 8;
  if (groups[0] === 3 && groups[1] === 2) return 7;
  if (isFlush) return 6;
  if (isStraight) return 5;
  if (groups[0] === 3) return 4;
  if (groups[0] === 2 && groups[1] === 2) return 3;
  if (groups[0] === 2) return 2;
  return 1;
}

function clamp01(x: number) {
  return Math.max(0, Math.min(1, x));
}

// ---------- 8. 期待値ベースの推奨アクション ----------
export interface CallDecision {
  required: number;       // %
  yourEquity: number;     // %
  shouldCall: boolean;
  ev: number;
  reasoning: string;
}

export function decideCall(pot: number, call: number, equityPct: number): CallDecision {
  const required = requiredEquity(pot, call);
  const yourEquity = equityPct;
  const ev = evCall(pot, call, equityPct / 100);
  const shouldCall = yourEquity >= required;
  const margin = (yourEquity - required).toFixed(1);
  return {
    required,
    yourEquity,
    shouldCall,
    ev,
    reasoning: shouldCall
      ? `必要勝率${required.toFixed(1)}% < 自分の勝率${yourEquity.toFixed(1)}%（差${margin}%）→ コール+EV。`
      : `必要勝率${required.toFixed(1)}% > 自分の勝率${yourEquity.toFixed(1)}%（差${margin}%）→ コールは-EV、フォールド推奨。`,
  };
}
