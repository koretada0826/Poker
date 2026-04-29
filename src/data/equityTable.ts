// 頻出のヘッズアップマッチアップ（プリフロップ → リバーまで）の概算エクイティ
// 標準的な数値（よく書籍やソルバーで参照される値）
// ※ 学習用の概数。実際のソルバー値とは小数点以下で多少差があります。

export interface MatchupRow {
  a: string;       // 例: "AA"
  b: string;       // 例: "KK"
  aWin: number;    // %
  note?: string;
}

export const PREFLOP_MATCHUPS: MatchupRow[] = [
  { a: 'AA', b: 'KK',  aWin: 81, note: 'ペア対ペアは上のペアが約80%' },
  { a: 'AA', b: 'AKs', aWin: 88, note: 'ドミネートされたAK(s)は約12%' },
  { a: 'AA', b: 'AKo', aWin: 92 },
  { a: 'AA', b: '22',  aWin: 81, note: 'AAは下ペアにも約80%' },
  { a: 'KK', b: 'AKs', aWin: 66 },
  { a: 'KK', b: 'AKo', aWin: 70 },
  { a: 'KK', b: 'QQ',  aWin: 81 },
  { a: 'AKs', b: 'QQ', aWin: 46, note: 'AKsはペアにわずかに不利' },
  { a: 'AKo', b: 'QQ', aWin: 43 },
  { a: 'AKs', b: 'AQs', aWin: 70, note: 'ドミネート関係（同じA）' },
  { a: 'AKo', b: 'AQo', aWin: 73 },
  { a: 'AKs', b: '22', aWin: 50, note: '小ペア vs ハイカード=コインフリップ' },
  { a: 'AKo', b: '22', aWin: 47 },
  { a: 'JJ', b: 'AKo', aWin: 57 },
  { a: 'TT', b: 'AKs', aWin: 53 },
  { a: 'AKs', b: 'KQs', aWin: 73 },
  { a: 'AA',  b: 'JTs', aWin: 78 },
  { a: 'AA',  b: '76s', aWin: 78 },
  { a: 'KK',  b: 'AA',  aWin: 19 },
  { a: '22',  b: '33',  aWin: 18 },
  { a: 'A5s', b: 'KQs', aWin: 56, note: 'スーテッドAxは見た目より強い' },
];

// 簡易判定：与えられた2手のうち a の勝率 (%) を返す。テーブルになければ undefined
export function lookupEquity(a: string, b: string): number | undefined {
  for (const row of PREFLOP_MATCHUPS) {
    if (row.a === a && row.b === b) return row.aWin;
    if (row.a === b && row.b === a) return 100 - row.aWin;
  }
  return undefined;
}

// 暗記すべき「経験則」
export const EQUITY_HEURISTICS: { rule: string; value: string; tip: string }[] = [
  {
    rule: 'ペア vs アンダーペア',
    value: '約 80% : 20%',
    tip: '上のペアが約4倍の勝率。AA vs KK で約81:19。',
  },
  {
    rule: 'ペア vs オーバーカード2枚',
    value: '約 55% : 45%（コインフリップ）',
    tip: '22 vs AKo で約53:47。「ペア有利だがほぼ五分」。',
  },
  {
    rule: 'ペア vs 自分より低い1枚を共有しないハイカード',
    value: '約 70% : 30%',
    tip: 'JJ vs AT で約70:30。',
  },
  {
    rule: 'ドミネートされたハイカード（AK vs AQ等）',
    value: '約 70% : 30%',
    tip: '同じAでキッカー差。AK vs AQ で約70:30。',
  },
  {
    rule: 'スーテッド vs オフスーツ（同じハイ-ロー）',
    value: '約 +3-4%',
    tip: 'AKs と AKo はAKsの方が3-4%強い。「スーテッドは安く参加できる」。',
  },
  {
    rule: 'フラッシュドロー（フロップ）→ リバーまで',
    value: '約 35%',
    tip: '9アウツ × 4ルール = 36%。実際34.97%。',
  },
  {
    rule: 'OESD（フロップ）→ リバーまで',
    value: '約 32%',
    tip: '8アウツ × 4 = 32%。実際31.45%。',
  },
  {
    rule: 'ガットショット → リバーまで',
    value: '約 16%',
    tip: '4アウツ × 4 = 16%。実際16.47%。',
  },
  {
    rule: 'フラッシュドロー＋OESD（コンボドロー）',
    value: '約 54%',
    tip: '15アウツ × 4 = 60%（少し高め評価。実55%前後）。実質オーバーペアと互角。',
  },
];
