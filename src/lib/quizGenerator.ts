import type { Card, Quiz, Rank, Suit } from '../types';
import { fullDeck, makeCard, rankToDisplay, shuffle, SUIT_JA } from './deck';
import { compareResults, evaluateBest } from './handEvaluator';

let qid = 0;
const nextId = () => `q-${++qid}-${Math.random().toString(36).slice(2, 7)}`;

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

// ------------- カード名クイズ -------------
export function makeCardNameQuiz(): Quiz {
  const deck = fullDeck();
  const c = pick(deck);
  const correct = `${rankToReadJa(c.rank)}の${SUIT_JA[c.suit]}`;
  const wrongs: string[] = [];
  while (wrongs.length < 3) {
    const w = pick(deck);
    if (w.rank === c.rank && w.suit === c.suit) continue;
    const txt = `${rankToReadJa(w.rank)}の${SUIT_JA[w.suit]}`;
    if (txt === correct || wrongs.includes(txt)) continue;
    wrongs.push(txt);
  }
  const options = shuffle([correct, ...wrongs]);
  return {
    id: nextId(),
    type: 'card-name',
    question: 'このカードの読み方は？',
    cards: [c],
    options,
    correctAnswers: [options.indexOf(correct)],
    explanation: {
      conclusion: `「${correct}」が正解です。`,
      reason: `「${rankToDisplay(c.rank)}」は${rankToReadJa(c.rank)}と読みます。マーク「${suitMark(c.suit)}」は${SUIT_JA[c.suit]}です。`,
      analogy: 'カードはまず数字（または絵札）とマーク（4種類）の組み合わせで読みます。',
      realTable: '実卓では声に出さなくてOK。読めれば十分です。',
      nextPoint: 'A=エース、K=キング、Q=クイーン、J=ジャックの4つの絵札を覚えましょう。',
    },
    difficulty: 1,
  };
}

function rankToReadJa(r: Rank): string {
  if (r === 14) return 'エース';
  if (r === 13) return 'キング';
  if (r === 12) return 'クイーン';
  if (r === 11) return 'ジャック';
  if (r === 10) return '10';
  return String(r);
}
function suitMark(s: Suit): string {
  return { spades: '♠', hearts: '♥', diamonds: '♦', clubs: '♣' }[s];
}

// ------------- どっちが強いカード? -------------
export function makeCardStrengthQuiz(): Quiz {
  const deck = fullDeck();
  const a = pick(deck);
  let b = pick(deck);
  while (b.rank === a.rank) b = pick(deck);
  const stronger = a.rank > b.rank ? a : b;
  const options = ['左のカード', '右のカード'];
  const correct = stronger === a ? 0 : 1;
  return {
    id: nextId(),
    type: 'card-strength',
    question: 'どちらのカードが強いですか？',
    cards: [a],
    cards2: [b],
    options,
    correctAnswers: [correct],
    explanation: {
      conclusion: `${stronger.display}（${rankToReadJa(stronger.rank)}）の方が強いです。`,
      reason:
        'ポーカーでは数字が大きいほど強いカードです。絵札はJ→Q→K→Aの順で強くなり、Aが一番強いです（ストレートでは1としても使えます）。',
      analogy: 'ジャンケンと違い、ポーカーは「数字が大きい方が強い」が基本です。',
      realTable: '実卓ではマークの強弱はありません。数字だけで勝負します。',
      nextPoint: 'AはK,Q,Jより強いことを覚えましょう。',
    },
    difficulty: 1,
  };
}

// ------------- 役判定クイズ (5枚) -------------
export function makeHandJudgeQuiz(): Quiz {
  // 役を確実に作るため、シナリオから生成する
  const scenario = pick([
    'pair', 'two-pair', 'trips', 'straight', 'flush',
    'full-house', 'high-card', 'pair', 'two-pair', 'high-card',
  ]);
  const cards = generateScenario(scenario);
  const result = evaluateBest(cards);
  const all = [
    'ハイカード', 'ワンペア', 'ツーペア', 'スリーカード',
    'ストレート', 'フラッシュ', 'フルハウス', 'フォーカード',
    'ストレートフラッシュ',
  ];
  const wrongs = shuffle(all.filter(n => n !== result.jaName)).slice(0, 3);
  const options = shuffle([result.jaName, ...wrongs]);
  return {
    id: nextId(),
    type: 'hand-judge',
    question: 'この5枚の役は何ですか？',
    cards,
    options,
    correctAnswers: [options.indexOf(result.jaName)],
    explanation: {
      conclusion: `この役は「${result.jaName}」です。`,
      reason: result.beginnerExplanation,
      analogy: '同じ数字が並ぶか、マークがそろうか、数字が連続するか、を順番にチェックしましょう。',
      realTable: '実卓では役の強さは「ハイカード→ワンペア→ツーペア→…→ロイヤル」と一直線です。',
      nextPoint: '次は2つの役を比べて、どちらが強いか考えましょう。',
    },
    difficulty: 2,
  };
}

function generateScenario(s: string): Card[] {
  const deck = shuffle(fullDeck());
  const used = new Set<string>();
  const take = (filter?: (c: Card) => boolean): Card => {
    for (const c of deck) {
      const key = `${c.rank}-${c.suit}`;
      if (used.has(key)) continue;
      if (filter && !filter(c)) continue;
      used.add(key);
      return c;
    }
    throw new Error('no card');
  };

  const out: Card[] = [];
  switch (s) {
    case 'pair': {
      const r = (Math.floor(Math.random() * 13) + 2) as Rank;
      out.push(take(c => c.rank === r));
      out.push(take(c => c.rank === r));
      const r2s = new Set<Rank>();
      while (out.length < 5) {
        const c = take(c => c.rank !== r && !r2s.has(c.rank));
        r2s.add(c.rank);
        out.push(c);
      }
      break;
    }
    case 'two-pair': {
      const r1 = (Math.floor(Math.random() * 13) + 2) as Rank;
      let r2 = (Math.floor(Math.random() * 13) + 2) as Rank;
      while (r2 === r1) r2 = (Math.floor(Math.random() * 13) + 2) as Rank;
      out.push(take(c => c.rank === r1));
      out.push(take(c => c.rank === r1));
      out.push(take(c => c.rank === r2));
      out.push(take(c => c.rank === r2));
      out.push(take(c => c.rank !== r1 && c.rank !== r2));
      break;
    }
    case 'trips': {
      const r = (Math.floor(Math.random() * 13) + 2) as Rank;
      out.push(take(c => c.rank === r));
      out.push(take(c => c.rank === r));
      out.push(take(c => c.rank === r));
      const seen = new Set<Rank>([r]);
      while (out.length < 5) {
        const c = take(c => !seen.has(c.rank));
        seen.add(c.rank);
        out.push(c);
      }
      break;
    }
    case 'straight': {
      const start = Math.floor(Math.random() * 9) + 2; // 2..10
      for (let i = 0; i < 5; i++) {
        const r = (start + i) as Rank;
        out.push(take(c => c.rank === r));
      }
      // 同じスート5枚にならないよう調整
      if (out.every(c => c.suit === out[0].suit)) {
        out[0] = makeCard(out[0].rank, out[0].suit === 'spades' ? 'hearts' : 'spades');
      }
      break;
    }
    case 'flush': {
      const suits: Suit[] = ['spades', 'hearts', 'diamonds', 'clubs'];
      const suit = pick(suits);
      const ranks = shuffle([2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14] as Rank[]);
      // 連続にならないよう取得
      const chosen: Rank[] = [];
      for (const r of ranks) {
        if (chosen.length === 5) break;
        chosen.push(r);
      }
      // 連続を避けるためソートして連続なら入れ替え
      chosen.sort((a, b) => a - b);
      const isStraight = chosen.every((v, i) => i === 0 || v === chosen[i - 1] + 1);
      if (isStraight) chosen[4] = (chosen[4] === 14 ? 2 : ((chosen[4] + 2) as Rank)) as Rank;
      for (const r of chosen) out.push(take(c => c.rank === r && c.suit === suit));
      break;
    }
    case 'full-house': {
      const r1 = (Math.floor(Math.random() * 13) + 2) as Rank;
      let r2 = (Math.floor(Math.random() * 13) + 2) as Rank;
      while (r2 === r1) r2 = (Math.floor(Math.random() * 13) + 2) as Rank;
      out.push(take(c => c.rank === r1));
      out.push(take(c => c.rank === r1));
      out.push(take(c => c.rank === r1));
      out.push(take(c => c.rank === r2));
      out.push(take(c => c.rank === r2));
      break;
    }
    default: {
      // high card: 5 different ranks, not flush, not straight
      const seen = new Set<Rank>();
      while (out.length < 5) {
        const c = take(x => !seen.has(x.rank));
        seen.add(c.rank);
        out.push(c);
      }
      const ranks = out.map(c => c.rank).sort((a, b) => a - b);
      const isStraight = ranks.every((v, i) => i === 0 || v === ranks[i - 1] + 1);
      const isFlush = out.every(c => c.suit === out[0].suit);
      if (isStraight || isFlush) return generateScenario('high-card');
      break;
    }
  }
  return out;
}

// ------------- 役比較クイズ -------------
export function makeHandCompareQuiz(): Quiz {
  let a = generateScenario(pick(['pair', 'two-pair', 'trips', 'high-card']));
  let b = generateScenario(pick(['pair', 'two-pair', 'trips', 'high-card']));
  // 引き分け（同役・同キッカー）を避ける
  let safety = 0;
  while (compareResults(evaluateBest(a), evaluateBest(b)) === 0 && safety++ < 20) {
    b = generateScenario(pick(['pair', 'two-pair', 'trips', 'high-card', 'straight']));
  }
  const ra = evaluateBest(a);
  const rb = evaluateBest(b);
  // 同役の場合もキッカーまで含めて比較（compareResults は tiebreak も比較）
  const cmp = compareResults(ra, rb);
  const winner = cmp >= 0 ? 'A' : 'B';
  const options = ['プレイヤーAの勝ち', 'プレイヤーBの勝ち'];
  return {
    id: nextId(),
    type: 'hand-compare',
    question: 'どちらが勝ちですか？',
    cards: a,
    cards2: b,
    options,
    correctAnswers: [winner === 'A' ? 0 : 1],
    explanation: {
      conclusion: `プレイヤー${winner}の勝ちです。`,
      reason: `Aは${ra.jaName}、Bは${rb.jaName}。役の強さで上回った方が勝ちです。`,
      analogy: 'まず役の名前を見比べる。同じ役なら数字の大きい方が勝ち。',
      realTable: '実卓ではディーラーが勝敗を判定してくれます。',
      nextPoint: '役の強さの順番を覚えましょう。',
    },
    difficulty: 2,
  };
}

// ------------- アクション判断クイズ -------------
type ActionScenario = 'no-bet' | 'has-bet' | 'fold-good' | 'value-bet';
const ACTION_SCENARIOS: ActionScenario[] = ['no-bet', 'has-bet', 'fold-good', 'value-bet'];

export function makeActionQuiz(scenarioOverride?: ActionScenario): Quiz {
  const scenario: ActionScenario = scenarioOverride ?? pick(ACTION_SCENARIOS);
  switch (scenario) {
    case 'no-bet': {
      const options = ['チェック', 'ベット', 'コール', 'フォールド'];
      return {
        id: nextId(),
        type: 'action',
        question:
          '【状況】まだ誰もチップを出していません。あなたの番です。\n選べる行動はどれですか？（複数選択）',
        options,
        correctAnswers: [0, 1, 3],
        explanation: {
          conclusion: 'チェック・ベット・フォールドが選べます。',
          reason:
            '誰もベットしていないので、無料でパスする「チェック」と、自分から払う「ベット」が可能です。フォールドはいつでもできます。コールは「誰かのベットに合わせる」行動なので、ベットが無いと選べません。',
          analogy: 'チェック=パス、ベット=自分から賭ける、コール=相手と同額払う。',
          realTable: '実卓では「チェック」と言うか、テーブルを2回コツコツ叩いてもOK。',
          nextPoint: '前の人がベットしているかどうかで選択肢が変わります。',
        },
        difficulty: 2,
      };
    }
    case 'has-bet': {
      const options = ['チェック', 'コール', 'レイズ', 'フォールド'];
      return {
        id: nextId(),
        type: 'action',
        question:
          '【状況】前の人が500点ベットしました。あなたの番です。\n選べる行動はどれですか？（複数選択）',
        options,
        correctAnswers: [1, 2, 3],
        explanation: {
          conclusion: 'コール・レイズ・フォールドが選べます。',
          reason:
            '誰かがベットしているので「チェック（無料パス）」はできません。同額払って続ける「コール」、金額を上げる「レイズ」、降りる「フォールド」のどれかです。',
          analogy: 'ベットを見たら「払う or 上げる or 降りる」の3択。',
          realTable: '実卓では「コール」「レイズ◯◯」「フォールド」と声に出すと安全です。',
          nextPoint: '相手のベット額が大きい時ほど、慎重にコール判断をしましょう。',
        },
        difficulty: 2,
      };
    }
    case 'fold-good': {
      const options = ['コール', 'レイズ', 'フォールド', 'オールイン'];
      return {
        id: nextId(),
        type: 'action',
        question:
          '【状況】手札は7♣ 2♦。前の人が大きくレイズ。場のカードはまだ出ていません。\n初心者にとって最も安全な選択は？',
        options,
        correctAnswers: [2],
        explanation: {
          conclusion: 'フォールドが安全です。',
          reason:
            '7♣ 2♦はテキサスホールデムで最弱クラスの手。マークも違い、数字も離れています。大きなレイズに付き合うとチップが減りやすいです。',
          analogy: '弱い装備でボスに挑むのは無謀。降りてチップを守りましょう。',
          realTable: '実卓では「迷ったら降りる」も大事な技術です。',
          nextPoint: '最初の2枚（ハンド）が弱い時は、無理に参加しない。',
        },
        difficulty: 3,
      };
    }
    case 'value-bet':
    default: {
      const options = ['チェック', 'ベット', 'コール', 'フォールド'];
      return {
        id: nextId(),
        type: 'action',
        question:
          '【状況】場にはまだ何も賭けられていません。あなたは強い手です。\n勝てる時にチップを増やす行動は？',
        options,
        correctAnswers: [1],
        explanation: {
          conclusion: 'ベットがおすすめです。',
          reason: '強い手で何もしないと、勝った時に増えるチップが少なくなります。自分からベットして相手にコールしてもらうと、ポットが大きくなります。',
          analogy: '強い武器を持っているなら、しっかり振る。',
          realTable: '強い時に「黙ってチェック」だと損。',
          nextPoint: '強い時はベット、弱い時は降りる。これが基本です。',
        },
        difficulty: 2,
      };
    }
  }
}

// ------------- プリフロップ判断クイズ -------------
const STRONG_HANDS = ['AA','KK','QQ','JJ','TT','99','AK','AQ','KQ'];
const MARGINAL = ['AJ','AT','KJ','QJ','88','77','JT'];
const WEAK = ['72','83','94','T2','J3','Q4','K5','62','73','84'];

export function makePreflopQuiz(): Quiz {
  const set = pick([0, 0, 1, 2, 2]); // 弱いを多めに
  let label: string, expect: 'play' | 'maybe' | 'fold';
  if (set === 0) { label = pick(STRONG_HANDS); expect = 'play'; }
  else if (set === 1) { label = pick(MARGINAL); expect = 'maybe'; }
  else { label = pick(WEAK); expect = 'fold'; }
  const cards = handLabelToCards(label);
  const options = ['積極的に参加（レイズ/コール）', '状況次第', 'フォールド（降りる）'];
  const correctIdx = expect === 'play' ? 0 : expect === 'maybe' ? 1 : 2;
  return {
    id: nextId(),
    type: 'preflop',
    question: `あなたの手札は ${cards[0].display} ${cards[1].display}。プリフロップでどうしますか？`,
    cards,
    options,
    correctAnswers: [correctIdx],
    explanation: {
      conclusion:
        expect === 'play'
          ? '積極的に参加してOK。'
          : expect === 'maybe'
          ? '状況次第。ポジションが後ろなら参加、前ならフォールド寄り。'
          : 'フォールドが基本。',
      reason:
        expect === 'play'
          ? '高いペアやAK/AQ/KQは強い手。プリフロップで積極的に参加しても勝率が高めです。'
          : expect === 'maybe'
          ? '中くらいの強さ。早い順番（前のポジション）だと後ろに強い手が残っているかもしれず危険。後ろの順番なら参加OK。'
          : 'マークも違う、数字も離れた弱い手。参加するとチップを失いやすいです。',
      analogy: '最初の2枚は「武器選び」。弱い武器でボス戦に行ってはいけません。',
      realTable: '初心者は「強い手だけ参加」だけでも勝率が大きく上がります。',
      nextPoint: 'AA/KK/QQ/JJ/AKは覚えるべき強い手。72/83などは即降りでOK。',
    },
    difficulty: 3,
  };
}

function handLabelToCards(label: string): Card[] {
  const map: Record<string, Rank> = {
    A: 14, K: 13, Q: 12, J: 11, T: 10,
    '9': 9, '8': 8, '7': 7, '6': 6, '5': 5, '4': 4, '3': 3, '2': 2,
  };
  const r1 = map[label[0]];
  const r2 = map[label[1]];
  if (r1 === r2) {
    return [makeCard(r1, 'spades'), makeCard(r2, 'hearts')];
  }
  return [makeCard(r1, 'spades'), makeCard(r2, 'diamonds')];
}

// ------------- フロップ後判断クイズ -------------
type FlopScenario = 'mono-board' | 'connected' | 'top-pair' | 'overpair';
const FLOP_SCENARIOS: FlopScenario[] = ['mono-board', 'connected', 'top-pair', 'overpair'];

export function makeFlopJudgeQuiz(scenarioOverride?: FlopScenario): Quiz {
  const scenario: FlopScenario = scenarioOverride ?? pick(FLOP_SCENARIOS);
  switch (scenario) {
    case 'mono-board': {
      const cards = [makeCard(8 as Rank, 'spades'), makeCard(2 as Rank, 'hearts')];
      const board = [
        makeCard(11 as Rank, 'diamonds'),
        makeCard(7 as Rank, 'diamonds'),
        makeCard(3 as Rank, 'diamonds'),
      ];
      return {
        id: nextId(),
        type: 'flop-judge',
        question:
          'あなたの手札: 8♠ 2♥。フロップ: J♦ 7♦ 3♦。相手が大きくベット。どうする？',
        cards: [...cards, ...board],
        options: ['コール', 'レイズ', 'フォールド'],
        correctAnswers: [2],
        explanation: {
          conclusion: 'フォールドが安全です。',
          reason:
            '場に同じマーク（♦）が3枚あります。相手はすでにフラッシュかもしれません。あなたは何の役もできていないので、無理に追わずに降りるのが安全。',
          analogy: '危険信号が出ているので、見送る勇気が大切。',
          realTable: '同じマークが3枚並んだら「フラッシュ警戒」と覚えましょう。',
          nextPoint: '場のカードの危険サイン（同マーク3枚、連続数字）を見る習慣を。',
        },
        difficulty: 4,
      };
    }
    case 'connected': {
      return {
        id: nextId(),
        type: 'flop-judge',
        question:
          'あなたの手札: K♠ K♥（KKのワンペア）。フロップ: 9♣ 8♦ 7♥。相手がベット。どうする？',
        cards: [
          makeCard(13 as Rank, 'spades'), makeCard(13 as Rank, 'hearts'),
          makeCard(9 as Rank, 'clubs'), makeCard(8 as Rank, 'diamonds'), makeCard(7 as Rank, 'hearts'),
        ],
        options: ['強気にレイズ', '慎重にコール', 'フォールド'],
        correctAnswers: [1],
        explanation: {
          conclusion: '慎重にコールが基本。',
          reason:
            'KKは強いですが、フロップに7-8-9と連続した数字が並んでいます。相手がストレート（10-Jや6-10）の可能性があります。強引にレイズして大きなポットにすると危険。',
          analogy: 'KKは強いが、場の形によっては「強そうに見えて負けてる」状況もある。',
          realTable: '連続した数字3枚（コネクテッドボード）はストレート警戒。',
          nextPoint: 'ワンペア・オーバーペアでも場の危険度で判断を変える。',
        },
        difficulty: 4,
      };
    }
    case 'top-pair': {
      return {
        id: nextId(),
        type: 'flop-judge',
        question:
          'あなたの手札: A♠ K♣。フロップ: A♦ 7♠ 2♥。相手は控えめにベット。どうする？',
        cards: [
          makeCard(14 as Rank, 'spades'), makeCard(13 as Rank, 'clubs'),
          makeCard(14 as Rank, 'diamonds'), makeCard(7 as Rank, 'spades'), makeCard(2 as Rank, 'hearts'),
        ],
        options: ['コールまたはレイズ', 'フォールド', 'チェック（できないけど書く）'],
        correctAnswers: [0],
        explanation: {
          conclusion: 'コールまたはレイズで強気にいける場面。',
          reason:
            'AKでフロップにAが落ちて、トップペア（一番強いペア）+Kキッカーは強い。場にも危険なつながりやマークそろいがないので、積極的にプレイOK。',
          analogy: '強いペア+強いキッカーは初心者でも自信を持てる場面。',
          realTable: '「Aがあってもキッカーが弱いと危ない」が「Kキッカー」なら安心度UP。',
          nextPoint: 'トップペア+強いキッカー=自信ある手として覚える。',
        },
        difficulty: 3,
      };
    }
    case 'overpair':
    default: {
      return {
        id: nextId(),
        type: 'flop-judge',
        question:
          'あなたの手札: Q♠ Q♥（QQ）。フロップ: 5♣ 4♦ 2♠。相手がチェック。どうする？',
        cards: [
          makeCard(12 as Rank, 'spades'), makeCard(12 as Rank, 'hearts'),
          makeCard(5 as Rank, 'clubs'), makeCard(4 as Rank, 'diamonds'), makeCard(2 as Rank, 'spades'),
        ],
        options: ['ベット', 'チェック', 'フォールド'],
        correctAnswers: [0],
        explanation: {
          conclusion: 'ベットがおすすめ。',
          reason:
            'QQで場が低い数字。あなたの方が強い可能性が高い。チェックすると相手にタダでカードを見せてしまうので、ベットして主導権を取りましょう。',
          analogy: '強い手はちゃんと振る。チップを増やすチャンスを逃さない。',
          realTable: 'オーバーペア（場のどのカードより強いペア）は積極的にベット。',
          nextPoint: '強い時はベット。弱い時は降りる。シンプルに。',
        },
        difficulty: 3,
      };
    }
  }
}

// ------------- マナークイズ -------------
const MANNERS_QUIZ: Omit<Quiz, 'id'>[] = [
  {
    type: 'manners',
    question: 'あなたはフォールドしました。まだ他の人は勝負中。自分のカードを隣の人に見せてもOK？',
    options: ['OK', 'ダメ'],
    correctAnswers: [1],
    explanation: {
      conclusion: 'ダメです。',
      reason: 'まだ勝負中の人がいるので、見せると情報が漏れてゲームに影響します。',
      analogy: '降りた人のカードは「無いもの」扱い。見せない・覗かないが基本。',
      realTable: 'フォールドしたカードは伏せたままディーラーに返しましょう。',
      nextPoint: 'ハンドが続いている間は自分のカードを見せない。',
    },
    difficulty: 2,
  },
  {
    type: 'manners',
    question: 'チップを賭ける時、テーブルに投げる「スプラッシュ・ポット」は？',
    options: ['カッコいいのでOK', '禁止', '少額ならOK'],
    correctAnswers: [1],
    explanation: {
      conclusion: '禁止です。',
      reason: 'チップを散らかすと枚数の確認ができなくなり、ディーラーが困ります。',
      analogy: 'お金は丁寧に置く。投げない。',
      realTable: 'チップは自分の前にきれいに積んで置きましょう。',
      nextPoint: 'チップは投げず、ベット額を口頭で言うとなお親切。',
    },
    difficulty: 1,
  },
  {
    type: 'manners',
    question: '自分の番ではない時に「俺ならコールする」と他人にアドバイスするのは？',
    options: ['親切でOK', 'マナー違反'],
    correctAnswers: [1],
    explanation: {
      conclusion: 'マナー違反です。',
      reason: '進行中のハンドへ口出しは公平性を壊します。',
      analogy: '将棋を指している人に横から口出ししないのと同じ。',
      realTable: '黙って見守る。話したくなったらハンドが終わるまで待つ。',
      nextPoint: '進行中のハンドには口を出さない。',
    },
    difficulty: 1,
  },
  {
    type: 'manners',
    question: '初めてのアミューズメントポーカー。ルールが分からない時は？',
    options: ['黙って雰囲気で乗る', 'ディーラーに聞いてOK', '隣の常連にこっそり聞く'],
    correctAnswers: [1],
    explanation: {
      conclusion: 'ディーラーに聞いてOK。',
      reason: 'ディーラーは進行役。初心者は遠慮せず質問してOKです。',
      analogy: '分からないことを聞くのは恥ではなく、トラブル回避の第一歩。',
      realTable: '「初めてです、今何ができますか？」で十分通じます。',
      nextPoint: '初心者であることを伝えるとお店も配慮してくれます。',
    },
    difficulty: 1,
  },
  {
    type: 'manners',
    question: '負けた時に強くテーブルを叩くのは？',
    options: ['気持ちは分かるのでセーフ', 'マナー違反'],
    correctAnswers: [1],
    explanation: {
      conclusion: 'マナー違反です。',
      reason: '他のプレイヤーやディーラーが不快になります。場の雰囲気も悪くなります。',
      analogy: 'スポーツマンシップと同じ。',
      realTable: 'ポーカーは長期戦。1ハンドの勝ち負けで熱くならない。',
      nextPoint: '負けた時こそ姿勢が試されます。',
    },
    difficulty: 1,
  },
  {
    type: 'manners',
    question: 'ベット額を伝える時、最も親切な方法は？',
    options: ['チップだけ出す', '口頭で「500」と言ってからチップを出す', '無言で投げる'],
    correctAnswers: [1],
    explanation: {
      conclusion: '口頭で伝えてからチップを出すのが親切。',
      reason: '金額の誤解を防ぎ、ディーラーや相手も確認しやすい。',
      analogy: '「コールです」「レイズ1000」など声に出すと進行がスムーズ。',
      realTable: '声に出してからチップを出す → 最も誤解が少ない。',
      nextPoint: 'ベット時は声→チップの順が安全。',
    },
    difficulty: 2,
  },
  {
    type: 'manners',
    question: '自分の番が回ってきました。スマホで動画を見ていて気付いていません。どうすべき？',
    options: ['動画優先', '手札を見て、できれば集中する', '他の人が代わりに決めてくれる'],
    correctAnswers: [1],
    explanation: {
      conclusion: 'なるべく集中する。',
      reason: '自分の番に気付かないと進行が止まり、他のプレイヤーに迷惑。',
      analogy: 'みんなで遊ぶゲームなので、最低限の集中は必要。',
      realTable: 'スマホは長時間見ない。手元の確認はOK。',
      nextPoint: '自分の番では迅速に行動。',
    },
    difficulty: 2,
  },
];

export function makeMannersQuiz(): Quiz {
  const q = pick(MANNERS_QUIZ);
  return { ...q, id: nextId() };
}

// ------------- ドロークイズ（あと1枚で何の役？） -------------
export function makeDrawQuiz(): Quiz {
  // シナリオ:
  //  - flush draw: 同マーク4枚 + 違うマーク1枚 → あと1枚同マークでフラッシュ
  //  - straight draw: 連続4枚 + 1枚 → あと1枚で連続→ストレート
  //  - pair-to-trips: ペア + 別3枚 → あと1枚同数字でスリーカード
  const kind = pick(['flush', 'straight', 'trips'] as const);
  const cards: Card[] = [];
  let answer: 'フラッシュ' | 'ストレート' | 'スリーカード';
  const used = new Set<string>();
  const take = (rank: Rank, suit: Suit): Card => {
    const k = `${rank}-${suit}`;
    if (used.has(k)) throw new Error('dup');
    used.add(k);
    return makeCard(rank, suit);
  };

  if (kind === 'flush') {
    answer = 'フラッシュ';
    const suit: Suit = pick(['spades', 'hearts', 'diamonds', 'clubs']);
    const ranks = shuffle([14, 11, 9, 6, 3, 13, 8, 5] as Rank[]).slice(0, 4);
    for (const r of ranks) cards.push(take(r, suit));
    // 5枚目: 違うマーク
    const otherSuit: Suit = suit === 'spades' ? 'hearts' : 'spades';
    const r5 = (Math.floor(Math.random() * 13) + 2) as Rank;
    if (!used.has(`${r5}-${otherSuit}`)) cards.push(take(r5, otherSuit));
    else cards.push(take((((r5 % 13) + 2) as Rank), otherSuit));
  } else if (kind === 'straight') {
    answer = 'ストレート';
    const start = Math.floor(Math.random() * 9) + 2; // 2..10
    // 4枚連続 + 1枚はずれ
    const seq = [start, start + 1, start + 2, start + 3] as Rank[];
    const suits: Suit[] = ['spades', 'hearts', 'diamonds', 'clubs'];
    seq.forEach((r, i) => cards.push(take(r, suits[i % 4])));
    // ばらけた数字を1枚追加（連続ではないもの）
    let off = (start + 6) as Rank;
    if (off > 14) off = 2 as Rank;
    cards.push(take(off, suits[0] === 'spades' ? 'hearts' : 'spades'));
    // フラッシュにならないよう、4色混在させた前提
  } else {
    answer = 'スリーカード';
    const r = (Math.floor(Math.random() * 13) + 2) as Rank;
    cards.push(take(r, 'spades'));
    cards.push(take(r, 'hearts'));
    const seen = new Set<Rank>([r]);
    while (cards.length < 5) {
      const r2 = (Math.floor(Math.random() * 13) + 2) as Rank;
      if (seen.has(r2)) continue;
      seen.add(r2);
      const sx: Suit = pick(['diamonds', 'clubs', 'spades']);
      const k = `${r2}-${sx}`;
      if (used.has(k)) continue;
      cards.push(take(r2, sx));
    }
  }

  const options = ['フラッシュ', 'ストレート', 'スリーカード', 'フルハウス'];
  return {
    id: nextId(),
    type: 'hand-draw',
    question: '【ドロー読み】あと1枚そろえば、何の役が完成しますか？',
    cards,
    options,
    correctAnswers: [options.indexOf(answer)],
    explanation: {
      conclusion: `あと1枚で「${answer}」が完成する形です。`,
      reason:
        answer === 'フラッシュ'
          ? '同じマークが4枚あります。あと1枚同じマークが場に来ればフラッシュ完成。これを「フラッシュドロー」と呼びます。'
          : answer === 'ストレート'
          ? '数字が4枚連続しています。あと1枚で連続が5枚になればストレート完成。これを「ストレートドロー」と呼びます。'
          : '同じ数字が2枚（ペア）あります。あと1枚同じ数字が来ればスリーカード。',
      analogy: 'ドローは「未完成の手」。完成すれば強いが、外れたら何も無い。',
      realTable: '実卓ではドローを追うべきか降りるべきかの判断が大事。確率を意識しましょう。',
      nextPoint: '同マーク4枚=フラッシュドロー、連続4枚=ストレートドロー。',
    },
    difficulty: 3,
  };
}

// ------------- 7枚から最強5枚クイズ -------------
export function makeBest5Quiz(): Quiz {
  // 「自分の2枚を必ず両方使うわけではない」ことを体感させる
  // シナリオ：ボードに役が完成しているケース／自分の1枚だけ使う方が強いケース
  const variant = pick(['board-flush', 'one-card-pair', 'kicker'] as const);
  let hole: Card[] = [];
  let board: Card[] = [];
  let questionCorrect: string;
  let wrongs: string[];
  let explReason = '';

  if (variant === 'board-flush') {
    // 場に♥が4枚、自分も♥1枚
    hole = [makeCard(14 as Rank, 'hearts'), makeCard(2 as Rank, 'spades')];
    board = [
      makeCard(11 as Rank, 'hearts'),
      makeCard(8 as Rank, 'hearts'),
      makeCard(5 as Rank, 'hearts'),
      makeCard(3 as Rank, 'hearts'),
      makeCard(7 as Rank, 'clubs'),
    ];
    questionCorrect = 'Aハイのフラッシュ';
    wrongs = ['Aのワンペア', 'ハイカード（A）', '何もできていない'];
    explReason =
      '場に♥が4枚あり、あなたの♥A（自分の1枚だけ）を使うと、♥が5枚そろってフラッシュ。自分の2♠は使いません。「自分の2枚を必ず両方使う必要はない」というルールです。';
  } else if (variant === 'one-card-pair') {
    // 場にKがあり、自分はK + 弱い1枚 → 自分のKだけ使ってKペア
    hole = [makeCard(13 as Rank, 'spades'), makeCard(2 as Rank, 'diamonds')];
    board = [
      makeCard(13 as Rank, 'hearts'),
      makeCard(9 as Rank, 'clubs'),
      makeCard(7 as Rank, 'spades'),
      makeCard(4 as Rank, 'hearts'),
      makeCard(11 as Rank, 'diamonds'),
    ];
    questionCorrect = 'Kのワンペア';
    wrongs = ['Kのスリーカード', 'ツーペア', 'ハイカード'];
    explReason =
      'あなたのK♠と場のK♥でKペア。残り3枚は場の中でキッカーになる。自分の2♦は使わない方が強い5枚を作れます。';
  } else {
    // 場が3枚しかない時、両方使う方が強い（普通のケース）
    hole = [makeCard(14 as Rank, 'spades'), makeCard(13 as Rank, 'spades')];
    board = [
      makeCard(14 as Rank, 'hearts'),
      makeCard(13 as Rank, 'diamonds'),
      makeCard(7 as Rank, 'clubs'),
      makeCard(2 as Rank, 'hearts'),
      makeCard(5 as Rank, 'diamonds'),
    ];
    questionCorrect = 'AとKのツーペア';
    wrongs = ['Aのワンペア', 'Kのワンペア', 'スリーカード'];
    explReason =
      'あなたのA♠と場のA♥でAペア、あなたのK♠と場のK♦でKペア。両方使ってツーペアが最強です。';
  }

  const options = shuffle([questionCorrect, ...wrongs]);
  return {
    id: nextId(),
    type: 'best5',
    question:
      '【7枚から最強5枚を選ぶ】自分の手札2枚と場の5枚。最も強い役は？\n（自分の2枚は片方だけ使ってもOK・両方使わなくてもOK）',
    cards: hole,
    cards2: board,
    options,
    correctAnswers: [options.indexOf(questionCorrect)],
    explanation: {
      conclusion: `正解は「${questionCorrect}」です。`,
      reason: explReason,
      analogy: '自分の2枚は「使うかどうか自由」。7枚の中から一番強い5枚を選ぶ。',
      realTable: 'ディーラーが自動で最強の5枚を判定してくれます。覚えておくと自分でも判定可。',
      nextPoint: '「両方使う必要はない」「場のカードだけで役ができることもある」。',
    },
    difficulty: 4,
  };
}

// ------------- 初心者ハンドクイズ生成 -------------
// シナリオ集合を一巡ずつシャッフルしてからnまで取り出す（連続重複を最小化）
function cycleByScenarios<T>(
  scenarios: T[],
  make: (s: T) => Quiz,
  n: number
): Quiz[] {
  const out: Quiz[] = [];
  while (out.length < n) {
    const order = shuffle(scenarios.slice());
    for (const s of order) {
      if (out.length >= n) break;
      out.push(make(s));
    }
  }
  return out;
}

// question テキストでなるべく重複しないように生成（足りない時は重複OKで埋める）
function uniqueByQuestion(make: () => Quiz, n: number): Quiz[] {
  const out: Quiz[] = [];
  const seen = new Set<string>();
  for (let attempt = 0; attempt < n * 12 && out.length < n; attempt++) {
    const q = make();
    if (seen.has(q.question)) continue;
    seen.add(q.question);
    out.push(q);
  }
  while (out.length < n) out.push(make());
  return out;
}

// MANNERS_QUIZ をシャッフルしてからn個取り出す
function cycleManners(n: number): Quiz[] {
  const out: Quiz[] = [];
  while (out.length < n) {
    const order = shuffle(MANNERS_QUIZ.slice());
    for (const m of order) {
      if (out.length >= n) break;
      out.push({ ...m, id: nextId() });
    }
  }
  return out;
}

export function generateBatch(type: Quiz['type'], n: number): Quiz[] {
  switch (type) {
    case 'card-name':     return uniqueByQuestion(makeCardNameQuiz, n);
    case 'card-strength': return uniqueByQuestion(makeCardStrengthQuiz, n);
    case 'hand-judge':    return uniqueByQuestion(makeHandJudgeQuiz, n);
    case 'hand-compare':  return uniqueByQuestion(makeHandCompareQuiz, n);
    case 'preflop':       return uniqueByQuestion(makePreflopQuiz, n);
    case 'hand-draw':     return uniqueByQuestion(makeDrawQuiz, n);
    case 'best5':         return uniqueByQuestion(makeBest5Quiz, n);
    case 'action':        return cycleByScenarios(ACTION_SCENARIOS, makeActionQuiz, n);
    case 'flop-judge':    return cycleByScenarios(FLOP_SCENARIOS, makeFlopJudgeQuiz, n);
    case 'manners':       return cycleManners(n);
    default:              return uniqueByQuestion(makeHandJudgeQuiz, n);
  }
}
