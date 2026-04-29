export interface GlossaryEntry {
  term: string;
  category: 'カード' | '役' | '進行' | '行動' | 'チップ' | 'マナー' | '戦略';
  short: string;     // 一行で
  detail: string;    // 補足
  analogy?: string;  // 例え
}

export const GLOSSARY: GlossaryEntry[] = [
  { term: 'スート（マーク）', category: 'カード', short: 'トランプの4種類のマークのこと（♠♥♦♣）。', detail: 'ポーカーではマークの強弱はありません。同じマークがそろうと「フラッシュ」になります。' },
  { term: 'ランク（数字）', category: 'カード', short: '2〜10、J、Q、K、Aの13段階の強さ。', detail: 'Aが一番強い。ストレートのときだけAは1としても使えます。' },
  { term: 'A（エース）', category: 'カード', short: '一番強いカード。1としても使える。', detail: 'A-K-Q-J-10は最強ストレート、A-2-3-4-5は最弱ストレート（ホイール）。' },
  { term: 'K / Q / J（絵札）', category: 'カード', short: 'キング/クイーン/ジャック。', detail: '強さは J → Q → K → A の順。' },
  { term: 'ハンド（手札）', category: 'カード', short: '自分にだけ配られる2枚のカード。', detail: '相手には見せません。最後のショーダウンまで秘密。' },
  { term: 'コミュニティカード（場札）', category: 'カード', short: '全員が共通で使える、場の中央に開かれるカード。', detail: 'フロップ3枚→ターン1枚→リバー1枚で最大5枚。' },

  { term: 'ハイカード', category: '役', short: '役なし。一番強いカード1枚で勝負。', detail: '一番弱い役。' },
  { term: 'ワンペア', category: '役', short: '同じ数字が2枚そろっている。', detail: '一番よく出る役。' },
  { term: 'ツーペア', category: '役', short: 'ペアが2組。', detail: '例: A-A-7-7-2。' },
  { term: 'スリーカード', category: '役', short: '同じ数字が3枚。', detail: '別名「セット」「トリップス」。' },
  { term: 'ストレート', category: '役', short: '5枚の数字が連続。', detail: 'マークはバラバラでOK。' },
  { term: 'フラッシュ', category: '役', short: '5枚すべて同じマーク。', detail: '数字は連続していなくてもOK。' },
  { term: 'フルハウス', category: '役', short: 'スリーカード+ワンペア。', detail: '例: K-K-K-2-2。' },
  { term: 'フォーカード', category: '役', short: '同じ数字が4枚。', detail: 'とても強い。' },
  { term: 'ストレートフラッシュ', category: '役', short: '同じマークで連続5枚。', detail: '激レア。' },
  { term: 'ロイヤルフラッシュ', category: '役', short: '同じマークでA-K-Q-J-10。', detail: 'ポーカー最強の役。' },

  { term: 'プリフロップ', category: '進行', short: '最初の2枚を見て判断する場面。', detail: 'まだ場のカードは出ていない状態。' },
  { term: 'フロップ', category: '進行', short: '場に3枚いっぺんに開かれる瞬間。', detail: '初心者の判断で一番難しい場面でもある。' },
  { term: 'ターン', category: '進行', short: 'フロップの後、4枚目が開かれる。', detail: '残りはリバー1枚のみ。' },
  { term: 'リバー', category: '進行', short: '5枚目（最後）の場札。', detail: 'これで全カードが出そろう。' },
  { term: 'ショーダウン', category: '進行', short: '残った人がカードを見せて勝負を決定。', detail: '一番強い役の人がポットを獲得。' },
  { term: 'ハンド', category: '進行', short: '1回の勝負（配られてから決着まで）。', detail: 'カードの2枚と意味が同じことも。文脈で判断。' },

  { term: 'チェック', category: '行動', short: '誰もベットしてない時に「無料パス」する行動。', detail: '前に賭けがある時は選べません。', analogy: 'タダで次へ進むパスポート。' },
  { term: 'ベット', category: '行動', short: '自分から最初にチップを賭ける。', detail: '誰もまだ賭けていない時の行動。' },
  { term: 'コール', category: '行動', short: '相手のベットと「同額」払って続ける。', detail: '前に賭けがある時の最低限の行動。' },
  { term: 'レイズ', category: '行動', short: '相手のベットを「上回る額」にして勝負。', detail: '攻めの行動。' },
  { term: 'フォールド', category: '行動', short: '今回の勝負を降りる（カードを伏せて返す）。', detail: '弱い手や危険な場面で使う防御の技術。' },
  { term: 'オールイン', category: '行動', short: '持っているチップを全部賭ける。', detail: '初心者は基本使わない。' },

  { term: 'ポット', category: 'チップ', short: 'そのハンドで集まった全員のチップの山。', detail: '勝った人がもらえる賞金。' },
  { term: 'SB（スモールブラインド）', category: 'チップ', short: 'プリフロップ前に強制的に払う少額のチップ。', detail: '通常BBの半分。' },
  { term: 'BB（ビッグブラインド）', category: 'チップ', short: 'SBより多い、強制的に払うチップ。', detail: '基準額として使われる。' },
  { term: 'チップ', category: 'チップ', short: 'お金の代わりに使うコイン状の点数。', detail: 'アミューズメントでは現金化されません。' },

  { term: 'ポジション', category: '戦略', short: '自分が何番目に行動するかの位置。', detail: '後ろの順番ほど有利。', analogy: 'じゃんけんで相手の手を見てから出せるようなもの。' },
  { term: 'キッカー', category: '戦略', short: '役に絡まない「サブの数字」。同役対決の決め手。', detail: '例: AAペア同士なら次に大きい数字（キッカー）で勝負。' },
  { term: 'ブラフ', category: '戦略', short: '弱い手で強いふりをするはったり。', detail: '初心者のうちは多用しない。' },
  { term: 'ドロー', category: '戦略', short: 'あと1枚で完成しそうな未完成の手。', detail: 'フラッシュドロー、ストレートドローなど。' },
  { term: 'オーバーペア', category: '戦略', short: '場のどのカードよりも大きい自分のペア。', detail: '基本的に強い手。' },

  { term: 'スプラッシュ・ポット', category: 'マナー', short: 'チップを投げ込むことの俗称。', detail: '禁止。チップは丁寧に置く。' },
  { term: 'マック', category: 'マナー', short: 'カードを伏せて返すこと=フォールド。', detail: '見せない・覗かないが基本。' },
  { term: 'チョップ', category: '進行', short: '引き分けでポットを分けること。', detail: 'まったく同じ役・同じ強さなら発生。' },
];
