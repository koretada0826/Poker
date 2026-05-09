// プロまでのロードマップの順序とヘルパー
// MasteryPathScreen の STAGES と必ず一致させる

import type { Mode, PlayerStats } from '../types';

export const ROADMAP_ORDER: Mode[] = [
  // Stage 1
  'tutorial', 'lesson-cards', 'hand-book', 'lesson-hands', 'practice-hand',
  'lesson-flow', 'lesson-action', 'practice-action',
  // Stage 2
  'lesson-strategy', 'practice-preflop',
  // Stage 3
  'practice-flop', 'practice-draw', 'practice-best5', 'simulation',
  // Stage 4
  'lesson-manners', 'exam',
  // Stage 5
  'lesson-math', 'practice-pot-odds', 'practice-outs', 'practice-ev', 'math-lab',
  // Stage 6
  'lesson-range', 'range-trainer', 'practice-range', 'practice-equity',
  // Stage 7
  'lesson-board', 'practice-board',
  // Stage 8
  'lesson-sizing', 'practice-sizing', 'lesson-bluff', 'practice-bluff',
  // Stage 9
  'lesson-gto', 'practice-spr-mdf', 'boss-exam',
  // Stage 10-12
  'mental', 'bankroll', 'progress',
];

const TITLE_OF: Record<string, string> = {
  tutorial: '入門ツアー',
  'lesson-cards': 'トランプ超基礎',
  'hand-book': '役図鑑',
  'lesson-hands': 'ポーカーの役',
  'practice-hand': '役判定トレ',
  'lesson-flow': 'ホールデムの流れ',
  'lesson-action': 'アクション',
  'practice-action': 'アクション練習',
  'lesson-strategy': '初心者戦略',
  'practice-preflop': 'プリフロップ練習',
  'practice-flop': 'フロップ後判断',
  'practice-draw': 'ドロー読み',
  'practice-best5': '最強5枚クイズ',
  simulation: '実戦シミュ',
  'lesson-manners': 'マナー',
  exam: '初心者卒業試験',
  'lesson-math': '数学基礎',
  'practice-pot-odds': 'ポットオッズ練習',
  'practice-outs': 'アウツ練習',
  'practice-ev': 'EV判断',
  'math-lab': '数学ラボ',
  'lesson-range': 'レンジ思考',
  'range-trainer': 'レンジトレーナー',
  'practice-range': 'ポジション別クイズ',
  'practice-equity': 'マッチアップ・エクイティ',
  'lesson-board': 'ボードリーディング',
  'practice-board': 'テクスチャ分類',
  'lesson-sizing': 'サイジング',
  'practice-sizing': 'サイジングクイズ',
  'lesson-bluff': 'ブラフ／バリュー',
  'practice-bluff': 'ブラフ／バリュークイズ',
  'lesson-gto': 'GTO入門',
  'practice-spr-mdf': 'SPR/MDFクイズ',
  'boss-exam': 'ボス試験',
  mental: 'ティルト管理',
  bankroll: 'バンクロール管理',
  progress: '進捗・スキルツリー',
};

export function nextInRoadmap(current: Mode): Mode | null {
  const i = ROADMAP_ORDER.indexOf(current);
  if (i < 0 || i >= ROADMAP_ORDER.length - 1) return null;
  return ROADMAP_ORDER[i + 1];
}

export function nextStepTitle(current: Mode): string | null {
  const next = nextInRoadmap(current);
  if (!next) return null;
  return TITLE_OF[next] ?? next;
}

// 「実施済み」フラグを立てる（重複しないようにマージ）
export function markCompleted(stats: PlayerStats, mode: Mode): PlayerStats {
  if (stats.completedLessons.includes(mode)) return stats;
  return { ...stats, completedLessons: [...stats.completedLessons, mode] };
}
