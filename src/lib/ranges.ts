// ポジション別オープンレンジ（標準的な6max準拠の簡易版）
// hand label: "AA" (pair) / "AKs" (suited) / "AKo" (offsuit)

export type Position = 'UTG' | 'MP' | 'CO' | 'BTN' | 'SB' | 'BB';

export const POSITIONS: Position[] = ['UTG', 'MP', 'CO', 'BTN', 'SB', 'BB'];

export const POSITION_JA: Record<Position, string> = {
  UTG: 'UTG（一番前）',
  MP:  'MP（中盤）',
  CO:  'CO（後ろから2番目）',
  BTN: 'BTN（最後・最強）',
  SB:  'SB（スモールブラインド）',
  BB:  'BB（ビッグブラインド）',
};

export const POSITION_DESC: Record<Position, string> = {
  UTG: '最も前の席。後ろに5人いるので、強いハンドだけで参加する。',
  MP:  '中盤。UTGより少し広げてOK。',
  CO:  'BTNの直前。BTNが降りてくれれば実質ボタンに近い。',
  BTN: '最後に行動できる最強ポジション。広く参加して構わない。',
  SB:  'プリフロップは最後だが、ポストフロップは最初に行動する不利ポジション。',
  BB:  '既にチップを払っているので、レイズに対してディフェンドする。',
};

// 169 hand grid を使う - 13×13
// 上三角 (suited): "AKs" など col>row
// 対角 (pair):    "AA" など col==row
// 下三角 (offsuit):"AKo" など col<row  (rowの方が大きい)
export const RANK_ORDER = ['A', 'K', 'Q', 'J', 'T', '9', '8', '7', '6', '5', '4', '3', '2'] as const;
export type RankChar = typeof RANK_ORDER[number];

// グリッド上の (row, col) を hand label に変換
// row, col は 0..12（0=A, 12=2）
export function gridToHand(row: number, col: number): string {
  if (row === col) return RANK_ORDER[row] + RANK_ORDER[col]; // pair
  const high = Math.min(row, col); // 大きい数字（=index 小）
  const low = Math.max(row, col);
  if (col > row) return RANK_ORDER[high] + RANK_ORDER[low] + 's';
  return RANK_ORDER[high] + RANK_ORDER[low] + 'o';
}

// 6max RFI（Raise First In）標準的レンジ（簡易・初心者向けタイト寄り）
const UTG = new Set([
  'AA','KK','QQ','JJ','TT','99','88','77',
  'AKs','AQs','AJs','ATs','KQs','KJs','QJs','JTs','T9s','98s','87s','76s',
  'AKo','AQo',
]);
const MP = new Set([
  ...UTG,
  '66','55',
  'A9s','KTs','QTs','J9s','T8s','97s','86s','75s','65s','54s',
  'AJo','KQo',
]);
const CO = new Set([
  ...MP,
  '44','33','22',
  'A8s','A7s','A6s','A5s','A4s','A3s','A2s',
  'K9s','Q9s','J8s','T7s','96s','85s','74s','64s','53s',
  'ATo','KJo','QJo','JTo',
]);
const BTN = new Set([
  ...CO,
  'K8s','K7s','K6s','K5s','K4s','K3s','K2s',
  'Q8s','Q7s','Q6s','Q5s','Q4s','Q3s','Q2s',
  'J7s','J6s','J5s','J4s',
  'T6s','T5s',
  '95s','84s','63s','52s','43s','32s',
  'A9o','A8o','A7o','A6o','A5o','A4o','A3o','A2o',
  'K9o','K8o','K7o',
  'Q9o','Q8o',
  'J9o','J8o',
  'T9o','T8o','98o','87o','76o','65o',
]);
const SB = new Set([
  ...CO,
  'K8s','K7s','K6s','K5s','K4s','K3s','K2s',
  'Q8s','Q7s','Q6s','Q5s',
  'J7s','J6s',
  'T6s',
  '95s','84s',
  'A9o','A8o','A7o','A6o','A5o','A4o','A3o','A2o',
  'K9o','K8o',
  'Q9o',
  'J9o','T9o','98o','87o','76o',
]);
const BB = new Set<string>();

export const OPEN_RANGES: Record<Position, Set<string>> = {
  UTG, MP, CO, BTN, SB, BB,
};

// 「Open % 」を概算するためのカテゴリ評価
export function isInOpen(position: Position, hand: string): boolean {
  return OPEN_RANGES[position].has(hand);
}

// レンジ全体での hand 数（情報用）
export function rangeSize(position: Position): number {
  return OPEN_RANGES[position].size;
}

// 全 169 hand のリスト
export function allHands(): string[] {
  const result: string[] = [];
  for (let r = 0; r < 13; r++) {
    for (let c = 0; c < 13; c++) {
      result.push(gridToHand(r, c));
    }
  }
  return result;
}

// 説明用の判断基準
export const RANGE_TIPS: Record<Position, string[]> = {
  UTG: [
    'UTGで参加する=「テーブル全員に勝てる手」だけ。',
    'まず JJ+ AKs AKo クラスは絶対に。',
    '弱いスーテッドコネクター(54s等)は基本捨てる。',
  ],
  MP: [
    'UTGよりは広げるが、まだ後ろに3人いるので慎重に。',
    '中ペア(66-99)、Aスーテッド(A9s+)程度を追加。',
  ],
  CO: [
    'BTNが降りれば実質ボタン。広めにOPEN。',
    'スーテッドコネクター(54s+)、低ペア、A2s+も入る。',
  ],
  BTN: [
    'ポストフロップで毎回最後に行動できる最強ポジション。',
    '相当広くOPENして良い（25-35%目安）。',
    'KxsやQxs、SC(76s等)も大体OK。',
  ],
  SB: [
    '全員フォールドしてきた場合のみOPEN。',
    'BBに対して位置不利なので、BTNより少しタイトに。',
  ],
  BB: [
    'BBはOPENせず、相手のレイズに対してディフェンド/3betする側。',
    'ポットオッズで広めに守る。',
  ],
};
