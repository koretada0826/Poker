import type { Card, Rank, Suit } from '../types';

const SUITS: Suit[] = ['spades', 'hearts', 'diamonds', 'clubs'];
const SUIT_SYMBOL: Record<Suit, string> = {
  spades: '♠',
  hearts: '♥',
  diamonds: '♦',
  clubs: '♣',
};

export const SUIT_JA: Record<Suit, string> = {
  spades: 'スペード',
  hearts: 'ハート',
  diamonds: 'ダイヤ',
  clubs: 'クラブ',
};

export function rankToDisplay(r: Rank): string {
  if (r === 14) return 'A';
  if (r === 13) return 'K';
  if (r === 12) return 'Q';
  if (r === 11) return 'J';
  if (r === 10) return '10';
  return String(r);
}

export function rankToJaName(r: Rank): string {
  if (r === 14) return 'エース';
  if (r === 13) return 'キング';
  if (r === 12) return 'クイーン';
  if (r === 11) return 'ジャック';
  return `${r}`;
}

export function makeCard(rank: Rank, suit: Suit): Card {
  return {
    rank,
    suit,
    display: `${rankToDisplay(rank)}${SUIT_SYMBOL[suit]}`,
    color: suit === 'hearts' || suit === 'diamonds' ? 'red' : 'black',
  };
}

export function fullDeck(): Card[] {
  const cards: Card[] = [];
  for (const s of SUITS) {
    for (let r = 2; r <= 14; r++) {
      cards.push(makeCard(r as Rank, s));
    }
  }
  return cards;
}

export function shuffle<T>(arr: T[], rng: () => number = Math.random): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function suitSymbol(s: Suit): string {
  return SUIT_SYMBOL[s];
}
