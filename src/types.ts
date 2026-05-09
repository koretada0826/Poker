export type Suit = 'spades' | 'hearts' | 'diamonds' | 'clubs';
export type Rank =
  | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14;

export interface Card {
  rank: Rank;       // 2..14 (14 = Ace)
  suit: Suit;
  display: string;  // "A♠"
  color: 'red' | 'black';
}

export type HandName =
  | 'High Card'
  | 'One Pair'
  | 'Two Pair'
  | 'Three of a Kind'
  | 'Straight'
  | 'Flush'
  | 'Full House'
  | 'Four of a Kind'
  | 'Straight Flush'
  | 'Royal Flush';

export interface HandResult {
  name: HandName;
  jaName: string;
  rank: number;        // 1..10 (高いほど強い)
  cards: Card[];       // 役を構成する5枚
  tiebreak: number[];  // 同役比較用 (降順)
  description: string;
  beginnerExplanation: string;
}

export type QuizType =
  | 'card-name'
  | 'mark'
  | 'card-strength'
  | 'hand-judge'
  | 'hand-compare'
  | 'hand-draw'
  | 'best5'
  | 'holdem-flow'
  | 'action'
  | 'preflop'
  | 'flop-judge'
  | 'manners'
  | 'pot-odds'
  | 'outs'
  | 'ev'
  | 'equity'
  | 'range-position'
  | 'board-texture'
  | 'bet-sizing'
  | 'bluff-value'
  | 'spr-mdf';

export interface Quiz {
  id: string;
  type: QuizType;
  question: string;
  cards?: Card[];
  cards2?: Card[]; // 比較用
  options: string[];
  correctAnswers: number[]; // 複数正解対応 (index)
  explanation: {
    conclusion: string;
    reason: string;
    analogy?: string;
    realTable?: string;
    nextPoint?: string;
  };
  difficulty: 1 | 2 | 3 | 4 | 5;
}

export interface BankrollSettings {
  funds: number;          // 現在資金
  buyIn: number;          // 1バイイン
  winRatePct: number;     // 想定勝率(%)
  avgWin: number;         // 平均利益(per session)
  avgLoss: number;        // 平均損失(per session)
  losingStreak: number;   // 想定連敗数
  monthlyExpense: number; // 月の生活費
  separated: boolean;     // 生活費とポーカー資金を分けているか
}

export interface MentalLogEntry {
  date: string;          // ISO date
  scenarioId: string;
  chosenIndex: number;
  correct: boolean;
}

export interface DailyMissionState {
  date: string;          // YYYY-MM-DD で更新管理
  evDone: number;
  potOddsDone: number;
  preflopDone: number;
  handDone: number;
  mentalDone: number;
}

export interface PlayerStats {
  level: number;
  exp: number;
  handQuizCorrect: number;
  handQuizTotal: number;
  actionCorrect: number;
  actionTotal: number;
  strategyCorrect: number;
  strategyTotal: number;
  mannersCorrect: number;
  mannersTotal: number;
  // 上級
  mathCorrect: number;
  mathTotal: number;
  rangeCorrect: number;
  rangeTotal: number;
  boardCorrect: number;
  boardTotal: number;
  sizingCorrect: number;
  sizingTotal: number;
  bluffCorrect: number;
  bluffTotal: number;
  // プロ思考
  mentalCorrect: number;
  mentalTotal: number;
  bankrollUsed: boolean;       // バンクロールシムを少なくとも一度使った
  simulationScore: number;
  bossExamPassed: boolean;
  title: string;
  completedLessons: string[];
  // 継続/苦手
  streakDays: number;
  lastPlayDate: string;        // YYYY-MM-DD
  dailyMissions: DailyMissionState;
  bankrollSettings?: BankrollSettings;
  mentalLog: MentalLogEntry[];
}

export type Phase = 'preflop' | 'flop' | 'turn' | 'river' | 'showdown';
export type ActionType = 'check' | 'bet' | 'call' | 'raise' | 'fold';

export interface SimulationState {
  deck: Card[];
  playerHand: Card[];
  cpuHand: Card[];
  community: Card[];
  pot: number;
  playerChips: number;
  cpuChips: number;
  toCall: number;       // 現在コールに必要な額
  phase: Phase;
  button: 'you' | 'cpu'; // ヘッズアップではボタン=SB
  log: { who: 'you' | 'cpu' | 'system'; msg: string }[];
  feedback?: {
    yourAction: ActionType;
    suggested: ActionType;
    good: string;
    risk: string;
    next: string;
  };
  finished: boolean;
  winner?: 'you' | 'cpu' | 'tie';
}

export type Mode =
  | 'home'
  | 'tutorial'
  | 'hand-book'
  | 'lesson-cards'
  | 'lesson-hands'
  | 'lesson-flow'
  | 'lesson-action'
  | 'lesson-strategy'
  | 'lesson-manners'
  | 'practice-hand'
  | 'practice-action'
  | 'practice-preflop'
  | 'practice-flop'
  | 'practice-draw'
  | 'practice-best5'
  | 'simulation'
  | 'exam'
  | 'result'
  | 'review'
  // 上級ルート
  | 'mastery-path'
  | 'lesson-math'
  | 'math-lab'
  | 'practice-pot-odds'
  | 'practice-outs'
  | 'practice-ev'
  | 'practice-equity'
  | 'lesson-range'
  | 'range-trainer'
  | 'practice-range'
  | 'lesson-board'
  | 'practice-board'
  | 'lesson-sizing'
  | 'practice-sizing'
  | 'lesson-bluff'
  | 'practice-bluff'
  | 'lesson-gto'
  | 'practice-spr-mdf'
  | 'boss-exam'
  // プロ志望ルート
  | 'bankroll'
  | 'mental'
  | 'progress';
