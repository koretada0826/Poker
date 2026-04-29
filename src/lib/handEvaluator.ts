import type { Card, HandResult, Rank } from '../types';

// 5枚の組み合わせを列挙
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

interface Eval5 {
  rank: number; // 1..10
  tiebreak: number[];
  handCards: Card[];
}

// 5枚評価
function evaluate5(cards: Card[]): Eval5 {
  if (cards.length !== 5) throw new Error('5 cards required');
  const sorted = cards.slice().sort((a, b) => b.rank - a.rank);

  const counts = new Map<number, number>();
  for (const c of sorted) counts.set(c.rank, (counts.get(c.rank) || 0) + 1);

  const groups = Array.from(counts.entries()).sort((a, b) =>
    b[1] - a[1] !== 0 ? b[1] - a[1] : b[0] - a[0]
  );

  const isFlush = sorted.every(c => c.suit === sorted[0].suit);

  // ストレート判定 (Aは1としても扱える: A-2-3-4-5)
  const ranks = sorted.map(c => c.rank);
  const uniq = Array.from(new Set(ranks));
  let isStraight = false;
  let straightHigh = 0;
  if (uniq.length === 5) {
    if (uniq[0] - uniq[4] === 4) {
      isStraight = true;
      straightHigh = uniq[0];
    } else if (uniq.join(',') === '14,5,4,3,2') {
      isStraight = true;
      straightHigh = 5; // ホイール
    }
  }

  if (isStraight && isFlush) {
    if (straightHigh === 14) {
      return { rank: 10, tiebreak: [14], handCards: sorted };
    }
    return { rank: 9, tiebreak: [straightHigh], handCards: sorted };
  }
  if (groups[0][1] === 4) {
    return {
      rank: 8,
      tiebreak: [groups[0][0], groups[1][0]],
      handCards: sorted,
    };
  }
  if (groups[0][1] === 3 && groups[1][1] === 2) {
    return {
      rank: 7,
      tiebreak: [groups[0][0], groups[1][0]],
      handCards: sorted,
    };
  }
  if (isFlush) {
    return { rank: 6, tiebreak: ranks, handCards: sorted };
  }
  if (isStraight) {
    return { rank: 5, tiebreak: [straightHigh], handCards: sorted };
  }
  if (groups[0][1] === 3) {
    const kickers = groups.slice(1).map(g => g[0]);
    return { rank: 4, tiebreak: [groups[0][0], ...kickers], handCards: sorted };
  }
  if (groups[0][1] === 2 && groups[1][1] === 2) {
    const pairs = [groups[0][0], groups[1][0]].sort((a, b) => b - a);
    const kicker = groups[2][0];
    return { rank: 3, tiebreak: [...pairs, kicker], handCards: sorted };
  }
  if (groups[0][1] === 2) {
    const kickers = groups.slice(1).map(g => g[0]);
    return { rank: 2, tiebreak: [groups[0][0], ...kickers], handCards: sorted };
  }
  return { rank: 1, tiebreak: ranks, handCards: sorted };
}

const HAND_NAMES: { en: HandResult['name']; ja: string }[] = [
  { en: 'High Card', ja: 'ハイカード' },
  { en: 'One Pair', ja: 'ワンペア' },
  { en: 'Two Pair', ja: 'ツーペア' },
  { en: 'Three of a Kind', ja: 'スリーカード' },
  { en: 'Straight', ja: 'ストレート' },
  { en: 'Flush', ja: 'フラッシュ' },
  { en: 'Full House', ja: 'フルハウス' },
  { en: 'Four of a Kind', ja: 'フォーカード' },
  { en: 'Straight Flush', ja: 'ストレートフラッシュ' },
  { en: 'Royal Flush', ja: 'ロイヤルフラッシュ' },
];

const BEGINNER_EXPL: Record<HandResult['name'], string> = {
  'High Card':
    '役なし。一番強いカード1枚で勝負します。とても弱い手なので無理しないようにしましょう。',
  'One Pair': '同じ数字が2枚そろっています。ポーカーで一番よく出る役です。',
  'Two Pair':
    '同じ数字のペアが2組あります。ワンペアより強いですが、過信は禁物です。',
  'Three of a Kind':
    '同じ数字が3枚そろっています。けっこう強い役です。',
  Straight:
    '5枚の数字が連続しています。例: 5-6-7-8-9。マークはバラバラでもOK。',
  Flush:
    '5枚すべてマークが同じ。数字は連続していなくてOK。',
  'Full House':
    'スリーカードとワンペアの組み合わせ。例: 7-7-7-K-K。',
  'Four of a Kind':
    '同じ数字が4枚。とても強い役。出たらほぼ勝てます。',
  'Straight Flush':
    'ストレート+フラッシュ。同じマークで5枚連続。激レア。',
  'Royal Flush':
    '同じマークでA-K-Q-J-10。ポーカー最強の役。一生に何度出るか。',
};

export function evaluateBest(cards: Card[]): HandResult {
  if (cards.length < 5) throw new Error('5+ cards required');
  let best: Eval5 | null = null;
  for (const combo of combinations(cards, 5)) {
    const ev = evaluate5(combo);
    if (
      !best ||
      ev.rank > best.rank ||
      (ev.rank === best.rank && compareTie(ev.tiebreak, best.tiebreak) > 0)
    ) {
      best = ev;
    }
  }
  const b = best!;
  const meta = HAND_NAMES[b.rank - 1];
  return {
    name: meta.en,
    jaName: meta.ja,
    rank: b.rank,
    cards: b.handCards,
    tiebreak: b.tiebreak,
    description: meta.ja,
    beginnerExplanation: BEGINNER_EXPL[meta.en],
  };
}

export function compareTie(a: number[], b: number[]): number {
  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    const av = a[i] ?? 0;
    const bv = b[i] ?? 0;
    if (av !== bv) return av - bv;
  }
  return 0;
}

export function compareResults(a: HandResult, b: HandResult): number {
  if (a.rank !== b.rank) return a.rank - b.rank;
  return compareTie(a.tiebreak, b.tiebreak);
}

export function rankJa(r: Rank): string {
  if (r === 14) return 'A';
  if (r === 13) return 'K';
  if (r === 12) return 'Q';
  if (r === 11) return 'J';
  return String(r);
}
