import type { PlayerStats } from '../types';

const KEY = 'poker-3h-stats-v2';
const LEGACY_KEY = 'poker-3h-stats-v1';

export const initialStats: PlayerStats = {
  level: 1,
  exp: 0,
  handQuizCorrect: 0,
  handQuizTotal: 0,
  actionCorrect: 0,
  actionTotal: 0,
  strategyCorrect: 0,
  strategyTotal: 0,
  mannersCorrect: 0,
  mannersTotal: 0,
  mathCorrect: 0,
  mathTotal: 0,
  rangeCorrect: 0,
  rangeTotal: 0,
  boardCorrect: 0,
  boardTotal: 0,
  sizingCorrect: 0,
  sizingTotal: 0,
  bluffCorrect: 0,
  bluffTotal: 0,
  mentalCorrect: 0,
  mentalTotal: 0,
  bankrollUsed: false,
  simulationScore: 0,
  bossExamPassed: false,
  title: 'Poker Baby（トランプ未経験）',
  completedLessons: [],
  streakDays: 0,
  lastPlayDate: '',
  dailyMissions: {
    date: '',
    evDone: 0,
    potOddsDone: 0,
    preflopDone: 0,
    handDone: 0,
    mentalDone: 0,
  },
  mentalLog: [],
};

export function loadStats(): PlayerStats {
  try {
    const raw = localStorage.getItem(KEY) || localStorage.getItem(LEGACY_KEY);
    if (!raw) return { ...initialStats };
    const parsed = JSON.parse(raw);
    return {
      ...initialStats,
      ...parsed,
      dailyMissions: { ...initialStats.dailyMissions, ...(parsed.dailyMissions || {}) },
      mentalLog: parsed.mentalLog || [],
      completedLessons: parsed.completedLessons || [],
    };
  } catch {
    return { ...initialStats };
  }
}

export function saveStats(s: PlayerStats) {
  try {
    localStorage.setItem(KEY, JSON.stringify(s));
  } catch {
    /* ignore */
  }
}

export function resetStats() {
  try {
    localStorage.removeItem(KEY);
    localStorage.removeItem(LEGACY_KEY);
  } catch {
    /* ignore */
  }
}

export function todayKey(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

// 起動時に「今日のミッション」をリセット & ストリーク更新
export function tickDaily(s: PlayerStats): PlayerStats {
  const today = todayKey();
  if (s.dailyMissions.date === today) return s;
  const yesterday = (() => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  })();
  const streak = s.lastPlayDate === yesterday ? s.streakDays : (s.lastPlayDate === today ? s.streakDays : 0);
  return {
    ...s,
    dailyMissions: {
      date: today,
      evDone: 0,
      potOddsDone: 0,
      preflopDone: 0,
      handDone: 0,
      mentalDone: 0,
    },
    streakDays: streak,
  };
}

// プレイ時に呼ぶ：今日まだなら streak +1
export function markPlayed(s: PlayerStats): PlayerStats {
  const today = todayKey();
  if (s.lastPlayDate === today) return s;
  return { ...s, lastPlayDate: today, streakDays: s.streakDays + 1 };
}

// ---------- スキルスコア（0-100）----------
export interface SkillScore {
  key: string;
  label: string;
  level: number;       // 0-10
  pct: number;         // 0-100
  done: number;
  total: number;
}

const acc01 = (n: number, t: number) => (t === 0 ? 0 : n / t);

function score(correct: number, total: number, minSamples = 5): number {
  if (total < minSamples) return Math.round(acc01(correct, total) * 60); // 試行少なければ最大60
  const r = acc01(correct, total);
  return Math.round(Math.min(100, r * 100));
}

export function skillScores(s: PlayerStats): SkillScore[] {
  const handQ = s.handQuizCorrect;
  const handT = s.handQuizTotal;
  return [
    { key: 'rule', label: 'ルール理解', level: levelOf(s.actionCorrect, s.actionTotal), pct: score(s.actionCorrect, s.actionTotal), done: s.actionCorrect, total: s.actionTotal },
    { key: 'hand', label: '役判定', level: levelOf(handQ, handT), pct: score(handQ, handT), done: handQ, total: handT },
    { key: 'preflop', label: 'プリフロップ判断', level: levelOf(s.strategyCorrect, s.strategyTotal), pct: score(s.strategyCorrect, s.strategyTotal), done: s.strategyCorrect, total: s.strategyTotal },
    { key: 'ev', label: 'EV計算', level: levelOf(s.mathCorrect, s.mathTotal), pct: score(s.mathCorrect, s.mathTotal), done: s.mathCorrect, total: s.mathTotal },
    { key: 'range', label: 'レンジ思考', level: levelOf(s.rangeCorrect, s.rangeTotal), pct: score(s.rangeCorrect, s.rangeTotal), done: s.rangeCorrect, total: s.rangeTotal },
    { key: 'board', label: 'ボード読み', level: levelOf(s.boardCorrect, s.boardTotal), pct: score(s.boardCorrect, s.boardTotal), done: s.boardCorrect, total: s.boardTotal },
    { key: 'sizing', label: 'ベットサイズ', level: levelOf(s.sizingCorrect, s.sizingTotal), pct: score(s.sizingCorrect, s.sizingTotal), done: s.sizingCorrect, total: s.sizingTotal },
    { key: 'bluff', label: 'ブラフ／バリュー', level: levelOf(s.bluffCorrect, s.bluffTotal), pct: score(s.bluffCorrect, s.bluffTotal), done: s.bluffCorrect, total: s.bluffTotal },
    { key: 'manners', label: 'マナー', level: levelOf(s.mannersCorrect, s.mannersTotal), pct: score(s.mannersCorrect, s.mannersTotal), done: s.mannersCorrect, total: s.mannersTotal },
    { key: 'mental', label: 'ティルト耐性', level: levelOf(s.mentalCorrect, s.mentalTotal), pct: score(s.mentalCorrect, s.mentalTotal), done: s.mentalCorrect, total: s.mentalTotal },
    { key: 'bankroll', label: 'バンクロール管理', level: s.bankrollUsed ? 3 : 0, pct: s.bankrollUsed ? 50 : 0, done: s.bankrollUsed ? 1 : 0, total: 1 },
  ];
}

function levelOf(correct: number, total: number): number {
  const pct = score(correct, total);
  return Math.min(10, Math.floor(pct / 10));
}

export function weakCategories(s: PlayerStats): SkillScore[] {
  return skillScores(s)
    .filter(x => x.total >= 5)
    .filter(x => x.pct < 60)
    .sort((a, b) => a.pct - b.pct)
    .slice(0, 3);
}

// ---------- 称号（ランク） ----------
const RANKS = [
  'Poker Baby（トランプ未経験）',
  'Rule Learner（ルール見習い）',
  'Hand Reader（役を覚えた人）',
  'Action Trainee（アクション練習生）',
  'Preflop Apprentice（プリフロップ修行者）',
  'EV Beginner（期待値初心者）',
  'Odds Student（オッズ見習い）',
  'Range Trainee（レンジ思考入門者）',
  'EV Hunter（期待値ハンター）',
  'Solid Grinder（堅実プレイヤー）',
  'Semi-Pro Mind（セミプロ思考）',
  'Pro Candidate（プロ予備軍）',
  '👑 Pro Mindset（専業思考プレイヤー）',
];

export function computeTitle(s: PlayerStats): string {
  const acc = (n: number, t: number) => (t === 0 ? 0 : n / t);
  const hand = acc(s.handQuizCorrect, s.handQuizTotal);
  const action = acc(s.actionCorrect, s.actionTotal);
  const strat = acc(s.strategyCorrect, s.strategyTotal);
  const manner = acc(s.mannersCorrect, s.mannersTotal);
  const math = acc(s.mathCorrect, s.mathTotal);
  const range = acc(s.rangeCorrect, s.rangeTotal);
  const board = acc(s.boardCorrect, s.boardTotal);
  const sizing = acc(s.sizingCorrect, s.sizingTotal);
  const bluff = acc(s.bluffCorrect, s.bluffTotal);
  const mental = acc(s.mentalCorrect, s.mentalTotal);

  // 最終称号：ボス試験合格 + メンタル耐性 + バンクロール理解
  if (s.bossExamPassed && mental >= 0.8 && s.mentalTotal >= 5 && s.bankrollUsed) {
    return RANKS[12];
  }
  if (s.bossExamPassed) return RANKS[11];
  if (
    math >= 0.8 && range >= 0.75 && board >= 0.7 &&
    sizing >= 0.7 && bluff >= 0.7 && s.mathTotal >= 30
  ) return RANKS[10];
  if (math >= 0.7 && range >= 0.7 && s.mathTotal >= 20) return RANKS[9];
  if (math >= 0.6 && range >= 0.6 && s.rangeTotal >= 10) return RANKS[8];
  if (math >= 0.6 && s.mathTotal >= 15) return RANKS[7];
  if (math >= 0.5 && s.mathTotal >= 10) return RANKS[6];
  if (math >= 0.5 && s.mathTotal >= 5) return RANKS[5];
  if (strat >= 0.6 && s.strategyTotal >= 5) return RANKS[4];
  if (action >= 0.6 && manner >= 0.5) return RANKS[3];
  if (hand >= 0.6 && s.handQuizTotal >= 5) return RANKS[2];
  if (s.actionTotal + s.handQuizTotal + s.strategyTotal >= 5) return RANKS[1];
  return RANKS[0];
}

// 苦手カテゴリのワード化（ホーム画面用）
export function weakAdvice(s: PlayerStats): string {
  const w = weakCategories(s);
  if (w.length === 0) {
    if (s.handQuizTotal + s.mathTotal < 5) {
      return 'まずは「役判定」と「EV計算」を5問ずつやってみよう。';
    }
    return '今のところ大きな弱点はなし。新しい分野に挑戦しよう。';
  }
  return `あなたの今の弱点は「${w.map(x => x.label).join('・')}」。優先して克服しよう。`;
}
