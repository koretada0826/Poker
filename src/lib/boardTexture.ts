// フロップ（3枚）のテクスチャ分類
// dry: 役・ドローが少ない（例: K72r）
// wet: ストレート・フラッシュドローが多い（例: 9♠8♠7♥）
// monotone: 3枚とも同マーク
// rainbow: 3マーク全部違う
// paired: 同じ数字が2枚

import type { Card } from '../types';

export interface BoardTexture {
  monotone: boolean;
  twoTone: boolean;       // 2枚同マーク
  rainbow: boolean;
  paired: boolean;
  trips: boolean;         // 3枚同数字
  connected: 'high' | 'mid' | 'low' | 'none'; // 連続度
  highCard: number;       // 一番高いカードのrank
  category: 'dry' | 'semiwet' | 'wet' | 'verywet';
  draws: string[];        // 想定されるドロー
  comment: string;
}

export function classifyFlop(flop: Card[]): BoardTexture {
  if (flop.length !== 3) throw new Error('flop must be 3 cards');
  const ranks = flop.map(c => c.rank).sort((a, b) => b - a);
  const suits = flop.map(c => c.suit);
  const suitCounts = new Map<string, number>();
  for (const s of suits) suitCounts.set(s, (suitCounts.get(s) || 0) + 1);
  const maxSuit = Math.max(...suitCounts.values());
  const monotone = maxSuit === 3;
  const twoTone = maxSuit === 2;
  const rainbow = maxSuit === 1;

  const rankCounts = new Map<number, number>();
  for (const r of ranks) rankCounts.set(r, (rankCounts.get(r) || 0) + 1);
  const maxRank = Math.max(...rankCounts.values());
  const paired = maxRank === 2;
  const trips = maxRank === 3;

  // 連続度
  let connected: BoardTexture['connected'] = 'none';
  const span = ranks[0] - ranks[2];
  if (span <= 4) {
    if (span <= 2) connected = 'high';
    else connected = 'mid';
    if (ranks[0] <= 8) connected = 'low';
  }

  const draws: string[] = [];
  if (monotone) draws.push('既にフラッシュ完成の可能性 / 1枚で更にフラッシュ');
  else if (twoTone) draws.push('フラッシュドロー（2枚同マークから1枚で完成）');
  if (connected !== 'none') draws.push('ストレートドロー多数（連続気味）');
  if (paired) draws.push('スリーカード/フルハウスの可能性');

  // 総合
  let wetnessScore = 0;
  if (monotone) wetnessScore += 4;
  else if (twoTone) wetnessScore += 2;
  if (connected === 'high') wetnessScore += 2;
  else if (connected === 'mid' || connected === 'low') wetnessScore += 1;
  if (paired) wetnessScore += 1;

  let category: BoardTexture['category'];
  if (wetnessScore <= 0) category = 'dry';
  else if (wetnessScore <= 2) category = 'semiwet';
  else if (wetnessScore <= 4) category = 'wet';
  else category = 'verywet';

  const comment = buildComment(category, monotone, twoTone, paired, connected, ranks[0]);

  return {
    monotone, twoTone, rainbow, paired, trips,
    connected, highCard: ranks[0], category, draws, comment,
  };
}

function buildComment(
  cat: BoardTexture['category'],
  mono: boolean,
  two: boolean,
  paired: boolean,
  conn: BoardTexture['connected'],
  high: number
): string {
  const parts: string[] = [];
  if (cat === 'dry') {
    parts.push('ドライボード：レンジで打ちやすい（小さいCベットOK）。');
  } else if (cat === 'semiwet') {
    parts.push('セミウェット：標準サイズのCベットが基本。');
  } else if (cat === 'wet') {
    parts.push('ウェット：保護のため大きめのベット推奨。');
  } else {
    parts.push('非常にウェット：強いハンドはオーバーベットで保護も検討。');
  }
  if (mono) parts.push('モノトーン（同マーク3枚）→ 既にフラッシュ警戒。チェック多め推奨。');
  if (two) parts.push('ツートーン（2枚同マーク）→ フラッシュドロー存在。');
  if (paired) parts.push('ペアボード→ ブラフ通りやすいが、相手にトリップス警戒。');
  if (conn === 'high') parts.push('ハイコネクト→ 強いストレートドロー多数。');
  if (high >= 13) parts.push('ハイカード上位→ プリレイザー優位。');
  if (high <= 8) parts.push('ローカードのみ→ プリコール側のヒット率も高い。');
  return parts.join(' ');
}
