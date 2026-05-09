// ヘッズアップ用 Monte Carlo エクイティ計算
// 自分の hole + 既知の community に対して、
// ランダムな相手の hole とランダムなボード補完で何%勝つかを見積もる。

import type { Card, Suit } from '../types';
import { evaluateBest, compareResults } from './handEvaluator';
import { makeCard } from './deck';

export interface EquityResult {
  win: number;   // 0-100
  tie: number;   // 0-100
  lose: number;  // 0-100
  equity: number; // win + tie/2 (一般的なエクイティ定義)
}

const SUITS: Suit[] = ['spades', 'hearts', 'diamonds', 'clubs'];

function buildAllCards(): Card[] {
  const out: Card[] = [];
  for (let r = 2; r <= 14; r++) {
    for (const s of SUITS) {
      out.push(makeCard(r as any, s));
    }
  }
  return out;
}

const ALL_CARDS = buildAllCards();

function key(c: Card): string {
  return `${c.rank}-${c.suit}`;
}

function shuffleInPlace<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function equityVsRandom(
  hole: Card[],
  board: Card[],
  sims: number = 300
): EquityResult {
  const used = new Set<string>([...hole, ...board].map(key));
  const remaining: Card[] = ALL_CARDS.filter(c => !used.has(key(c)));

  let win = 0, tie = 0, lose = 0;

  // 必要なボード補完枚数
  const needBoard = 5 - board.length;

  for (let i = 0; i < sims; i++) {
    // 必要枚数を取り出すために毎回シャッフル（簡易・十分）
    shuffleInPlace(remaining);
    let idx = 0;
    const oppHole: Card[] = [remaining[idx++], remaining[idx++]];
    const fillBoard: Card[] = [];
    for (let k = 0; k < needBoard; k++) fillBoard.push(remaining[idx++]);
    const fullBoard = [...board, ...fillBoard];

    const my = evaluateBest([...hole, ...fullBoard]);
    const opp = evaluateBest([...oppHole, ...fullBoard]);
    const cmp = compareResults(my, opp);
    if (cmp > 0) win++;
    else if (cmp < 0) lose++;
    else tie++;
  }
  const total = win + tie + lose;
  return {
    win: (win / total) * 100,
    tie: (tie / total) * 100,
    lose: (lose / total) * 100,
    equity: ((win + tie / 2) / total) * 100,
  };
}

// 子供向けに「10回中何回くらい勝てる？」表現
export function equityKidWords(equity: number): string {
  const n = Math.round(equity / 10);
  if (equity >= 80) return `10回中およそ${n}回勝てる強さ。かなり有利！`;
  if (equity >= 60) return `10回中およそ${n}回勝てる。有利な手。`;
  if (equity >= 45) return `10回中およそ${n}回勝てる。五分五分。`;
  if (equity >= 30) return `10回中およそ${n}回しか勝てない。やや不利。`;
  return `10回中およそ${n}回しか勝てない。かなり不利、降りる方がチップが残る。`;
}
