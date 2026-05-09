import type { Card, Quiz, Rank } from '../types';
import { fullDeck, makeCard, shuffle } from './deck';
import {
  betSizeMeaning,
  bluffSuccessThreshold,
  decideCall,
  exactHitProb,
  mdf,
  potOddsRatio,
  requiredEquity,
  ruleOf2,
  ruleOf4,
  spr,
} from './pokerMath';
import { isInOpen, OPEN_RANGES, POSITION_JA, type Position } from './ranges';
import { classifyFlop } from './boardTexture';
import { PREFLOP_MATCHUPS } from '../data/equityTable';

let qid = 0;
const nextId = () => `aq-${++qid}-${Math.random().toString(36).slice(2, 7)}`;
const pick = <T,>(a: T[]) => a[Math.floor(Math.random() * a.length)];

// ---------- ポットオッズ ----------
export function makePotOddsQuiz(): Quiz {
  const pot = pick([100, 150, 200, 300, 400]);
  const betPct = pick([33, 50, 66, 75, 100, 150]);
  const bet = Math.round((pot * betPct) / 100);
  const actualPot = pot + bet; // 相手ベット後のポット
  const required = requiredEquity(actualPot, bet); // call=bet
  const correct = `${required.toFixed(0)}%`;
  // 選択肢にエラーバンドのある近い値を混ぜる
  const wrongs = new Set<string>();
  while (wrongs.size < 3) {
    const w = required + (Math.random() < 0.5 ? -1 : 1) * pick([5, 8, 10, 12, 15]);
    if (w > 0 && w < 100 && Math.abs(w - required) > 2) {
      wrongs.add(`${Math.round(w)}%`);
    }
  }
  const options = shuffle([correct, ...Array.from(wrongs)]);
  return {
    id: nextId(),
    type: 'pot-odds',
    question:
      `【ポットオッズ】\nポット ${pot}、相手が ${bet} ベットしました（ポット比 ${betPct}%）。\n` +
      `あなたがコールするのに必要な最低勝率（ブレークイーブン）は？`,
    options,
    correctAnswers: [options.indexOf(correct)],
    explanation: {
      conclusion: `必要勝率は約 ${correct}。`,
      reason: `公式：必要勝率 = コール額 / (ポット + コール額) = ${bet} / (${actualPot} + ${bet}) = ${(bet / (actualPot + bet) * 100).toFixed(1)}%。\n` +
        `ポットオッズ ${potOddsRatio(actualPot, bet)}。`,
      analogy: 'ベットが大きいほど必要勝率も上がる。1/3ポット→25%、ポットサイズ→33%、オーバーベット2倍→40%。',
      realTable: 'この最低勝率を、自分のエクイティ（手の強さ）と比較してコール/フォールドを決める。',
      nextPoint: '次は「自分のエクイティ」を測る練習（アウツ・2/4ルール）。',
    },
    difficulty: 4,
  };
}

// ---------- アウツ ----------
export function makeOutsQuiz(): Quiz {
  const scenario = pick(['flush-draw', 'oesd', 'gutshot', 'combo', 'two-pair-to-fh'] as const);
  let outs = 0;
  let label = '';
  switch (scenario) {
    case 'flush-draw': outs = 9;  label = 'フラッシュドロー（同マーク4枚で1枚足りない）'; break;
    case 'oesd':       outs = 8;  label = 'OESD（4-5-6-7のような連続4枚で両端1枚ずつ）'; break;
    case 'gutshot':    outs = 4;  label = 'ガットショット（5-6-_-8-9のような中抜け）'; break;
    case 'combo':      outs = 15; label = 'フラッシュドロー＋OESDのコンボドロー'; break;
    case 'two-pair-to-fh': outs = 4; label = 'ツーペア→フルハウスを狙う'; break;
  }
  const pct = ruleOf4(outs);
  const correct = `${pct}%（${outs}アウツ）`;
  const wrongs = new Set<string>();
  while (wrongs.size < 3) {
    const altOuts = pick([4, 6, 8, 9, 12, 15, 21]);
    if (altOuts === outs) continue;
    wrongs.add(`${ruleOf4(altOuts)}%（${altOuts}アウツ）`);
  }
  const options = shuffle([correct, ...Array.from(wrongs)]);
  return {
    id: nextId(),
    type: 'outs',
    question: `【4ルール】フロップでアウツを数えよう。\n状況：${label}\nリバーまでに完成する確率は？（4ルール使用）`,
    options,
    correctAnswers: [options.indexOf(correct)],
    explanation: {
      conclusion: `${outs}アウツ × 4 = 約 ${pct}%。実際の正確値は ${exactHitProb(outs, 47, 2).toFixed(1)}%。`,
      reason:
        '4ルール：フロップ→リバー（あと2枚来る）の概算は アウツ×4。\n' +
        `${label}のアウツ数は${outs}枚。`,
      analogy: 'フラッシュドロー=9, OESD=8, ガット=4, 2ペア→FH=4。基本3パターンを暗記。',
      realTable: 'ターン以降は「2ルール」（×2）に切り替え。',
      nextPoint: 'ポットオッズと組み合わせて「コールしていいか」を判断する練習へ。',
    },
    difficulty: 4,
  };
}

// ---------- EV ----------
export function makeEVQuiz(): Quiz {
  const pot = pick([100, 150, 200, 300]);
  const call = pick([50, 75, 100, 150]);
  const eq = pick([15, 20, 25, 30, 35, 40, 50]);
  const d = decideCall(pot, call, eq);
  const correctChoice = d.shouldCall ? 'コール' : 'フォールド';
  const options = ['コール', 'フォールド'];
  return {
    id: nextId(),
    type: 'ev',
    question:
      `【EV判断】\n現在ポット ${pot}、コール額 ${call}。\n自分のエクイティ（勝率）${eq}%。\n` +
      `理論的に正しいのは？`,
    options,
    correctAnswers: [options.indexOf(correctChoice)],
    explanation: {
      conclusion: `正解：${correctChoice}（EV ≈ ${d.ev >= 0 ? '+' : ''}${d.ev.toFixed(1)}）`,
      reason:
        `必要勝率 = ${call}/(${pot}+${call}) = ${d.required.toFixed(1)}%。\n` +
        `自分の勝率 ${eq}% ${eq >= d.required ? '≥' : '<'} 必要 ${d.required.toFixed(1)}% → ${correctChoice}。\n` +
        `EV = ${eq/100} × ${pot+call} − ${(1-eq/100).toFixed(2)} × ${call} = ${d.ev.toFixed(2)}`,
      analogy: 'ポットオッズ（必要勝率）と自分のエクイティを比べるだけ。',
      realTable: '実卓では「ポットの何倍ベットされたか」と「自分のドロー数」を即座に概算する。',
      nextPoint: 'EV正でも結果負けることはある。長期で +EV を積み重ねる。',
    },
    difficulty: 4,
  };
}

// ---------- エクイティ（マッチアップ） ----------
export function makeEquityQuiz(): Quiz {
  const m = pick(PREFLOP_MATCHUPS);
  const close = m.aWin + (Math.random() < 0.5 ? -1 : 1) * 3;
  const wrong1 = clamp(m.aWin + 15, 1, 99);
  const wrong2 = clamp(m.aWin - 15, 1, 99);
  const opts = shuffle([
    `${m.aWin}%`,
    `${Math.round(close)}%`,
    `${wrong1}%`,
    `${wrong2}%`,
  ]);
  // 重複ある場合は調整
  const uniq = Array.from(new Set(opts));
  while (uniq.length < 4) uniq.push(`${Math.round(Math.random() * 80 + 10)}%`);
  return {
    id: nextId(),
    type: 'equity',
    question: `【エクイティ感覚】プリフロップで ${m.a} vs ${m.b}、${m.a} の勝率はおおよそ？`,
    options: uniq,
    correctAnswers: [uniq.indexOf(`${m.aWin}%`)],
    explanation: {
      conclusion: `${m.a} は ${m.aWin}%、${m.b} は ${100 - m.aWin}%。`,
      reason: m.note ?? '頻出マッチアップ。',
      analogy: 'ペア vs アンダーペア=80:20、ペア vs オーバーカード2枚=55:45、AK vs AQ=70:30。',
      realTable: 'ヒーローコールやオールイン場面で正確なエクイティ感覚が結果を分ける。',
      nextPoint: '主要マッチアップを「だいたい何%か」言えるように。',
    },
    difficulty: 4,
  };
}

// ---------- ポジションレンジ ----------
export function makeRangePositionQuiz(): Quiz {
  const pos: Position = pick(['UTG', 'MP', 'CO', 'BTN'] as Position[]);
  const correctSet = OPEN_RANGES[pos];
  const inRange = pick(Array.from(correctSet));
  // outOfRange 候補（このレンジに無いもののみ）
  const outsideCandidates = ['72o', '83o', '94o', 'T2o', 'J3o', 'Q4o', '63s', '52o', '85o', '94s']
    .filter(h => !correctSet.has(h) && h !== inRange);

  // 重複なくダミーを3つ選ぶ
  const seen = new Set<string>([inRange]);
  const distractors: string[] = [];
  for (const h of shuffle(outsideCandidates)) {
    if (seen.has(h)) continue;
    distractors.push(h);
    seen.add(h);
    if (distractors.length === 3) break;
  }
  const options = shuffle([inRange, ...distractors]);
  return {
    id: nextId(),
    type: 'range-position',
    question:
      `【ポジション別レンジ】${POSITION_JA[pos]}\n以下のうち、${pos} で OPEN（最初にレイズ）すべきハンドは？`,
    options: options.slice(0, 4),
    correctAnswers: [options.indexOf(inRange)],
    explanation: {
      conclusion: `${inRange} は ${pos} のレンジ内。`,
      reason:
        `${pos} のレンジは ${pos === 'UTG' ? 'タイト（約12%）' : pos === 'BTN' ? '広い（約35-50%）' : '中程度'}。\n` +
        `${inRange} は ${pos === 'UTG' ? '上位ハンドのみ' : pos === 'BTN' ? 'BTNではほぼ全てが入る' : '段階的に拡張'}。`,
      analogy: 'ポジションが後ろほど広く、前ほど厳しく。',
      realTable: '実卓ではポジションを意識してハンド選択するだけで負けにくくなる。',
      nextPoint: 'レンジトレーナーで13×13グリッドを実際に塗ってみよう。',
    },
    difficulty: 4,
  };
}

// ---------- ボードテクスチャ ----------
export function makeBoardTextureQuiz(): Quiz {
  const scenarios = [
    { flop: [c(13,'spades'), c(7,'clubs'), c(2,'diamonds')], cat: 'dry' as const },
    { flop: [c(10,'spades'), c(6,'spades'), c(2,'diamonds')], cat: 'semiwet' as const },
    { flop: [c(9,'spades'), c(8,'spades'), c(7,'hearts')], cat: 'wet' as const },
    { flop: [c(11,'hearts'), c(10,'hearts'), c(9,'hearts')], cat: 'verywet' as const },
    { flop: [c(13,'diamonds'), c(13,'spades'), c(4,'clubs')], cat: 'dry' as const },
    { flop: [c(8,'diamonds'), c(7,'diamonds'), c(6,'spades')], cat: 'wet' as const },
  ];
  const sc = pick(scenarios);
  const t = classifyFlop(sc.flop);
  const correct = catLabel(t.category);
  const options = shuffle(['ドライ', 'セミウェット', 'ウェット', '非常にウェット']);
  return {
    id: nextId(),
    type: 'board-texture',
    question: `【ボード分類】このフロップのテクスチャは？`,
    cards: sc.flop,
    options,
    correctAnswers: [options.indexOf(correct)],
    explanation: {
      conclusion: `${correct}。${t.comment}`,
      reason: t.draws.length ? `想定ドロー：${t.draws.join(' / ')}` : '大きなドローは少ない。',
      analogy: 'ドライ→小さく打つ、ウェット→大きく打つ・もしくはチェック。',
      realTable: 'ベットサイズはボードに合わせる。一律サイズはダメ。',
      nextPoint: 'ベットサイズ意味のクイズへ。',
    },
    difficulty: 4,
  };
}

function catLabel(c: ReturnType<typeof classifyFlop>['category']): string {
  return { dry: 'ドライ', semiwet: 'セミウェット', wet: 'ウェット', verywet: '非常にウェット' }[c];
}

// ---------- ベットサイジング ----------
export function makeBetSizingQuiz(): Quiz {
  const scenarios = [
    {
      desc: 'ドライボード（K72r）でレイザーが最初に打つ', size: 33,
      meaning: 'レンジベット。広いレンジから降ろすため小さく。',
      best: '25-33%（小さく）',
    },
    {
      desc: 'ウェットボード（987 ツートーン）で強いトップペア',  size: 75,
      meaning: '保護。ドローからの安いコールを許さない大きめサイズ。',
      best: '66-100%（大きめ）',
    },
    {
      desc: 'モノトーンで自分はナッツフラッシュではない', size: 25,
      meaning: '相手がフラッシュなら諦め、ペア相手から軽く取る or チェック。',
      best: '0-33%（小さく or チェック）',
    },
    {
      desc: 'リバーで純最強・相手は中位レンジ', size: 150,
      meaning: 'オーバーベットでバリュー最大化。',
      best: '100%超（オーバーベット）',
    },
  ];
  const sc = pick(scenarios);
  const options = shuffle([sc.best, '25-33%（小さく）', '66-100%（大きめ）', '100%超（オーバーベット）']);
  const uniq = Array.from(new Set(options)).slice(0, 4);
  while (uniq.length < 4) uniq.push('50%（標準）');
  const m = betSizeMeaning(sc.size);
  return {
    id: nextId(),
    type: 'bet-sizing',
    question: `【ベットサイズ判断】${sc.desc}。最適サイズは？`,
    options: uniq,
    correctAnswers: [uniq.indexOf(sc.best)],
    explanation: {
      conclusion: `推奨：${sc.best}。`,
      reason: `${sc.meaning}\nサイズ${sc.size}%なら相手の必要エクイティは ${m.required.toFixed(1)}%。`,
      analogy: '小=広く軽く / 中=標準 / 大=保護orバリュー / 超大=2極化。',
      realTable: 'サイズで自分の手の強さを「メッセージング」する。',
      nextPoint: 'ブラフとバリューの比率を学ぼう。',
    },
    difficulty: 5,
  };
}

// ---------- ブラフ vs バリュー ----------
export function makeBluffValueQuiz(): Quiz {
  const scenarios = [
    {
      situation: 'リバー、自分はナッツフラッシュ。相手は中位レンジでチェック。',
      best: 'バリューベット（中〜大）',
      detail: '相手のレンジに弱いペア〜トップペアが多い。最大限のバリューを取る。',
    },
    {
      situation: 'リバー、自分はAハイ（役なし）。相手は弱気にチェック。場に4ストレートあり。',
      best: 'ブラフベット（大きめ）',
      detail: '4ストレートで相手のコールレンジは限定的。ブロッカーがあるなら積極的にブラフ。',
    },
    {
      situation: 'リバー、自分はツーペア。相手は3回連続チェック。',
      best: '中サイズのバリュー',
      detail: '相手レンジは弱い。痛くない範囲で取り切る。',
    },
    {
      situation: 'ターン、自分はフラッシュドロー＋ガットショット。相手がベット。',
      best: 'セミブラフレイズ',
      detail: '降ろせる + 当たれば最強寄り。最強のセミブラフ候補。',
    },
    {
      situation: 'リバー、自分は弱いペア。相手が大きくベット。',
      best: 'フォールド（ブラフキャッチしない）',
      detail: '弱いペアは相手の強いバリューに負ける。MDFを満たす別のキャッチハンドを使う。',
    },
  ];
  const sc = pick(scenarios);
  const options = shuffle([
    sc.best,
    'バリューベット（中〜大）',
    'ブラフベット（大きめ）',
    'フォールド（ブラフキャッチしない）',
    'チェック',
  ]);
  const uniq = Array.from(new Set(options)).slice(0, 4);
  if (!uniq.includes(sc.best)) uniq[0] = sc.best;
  return {
    id: nextId(),
    type: 'bluff-value',
    question: `【ブラフ/バリュー判断】\n${sc.situation}\n最も良い行動は？`,
    options: uniq,
    correctAnswers: [uniq.indexOf(sc.best)],
    explanation: {
      conclusion: `推奨：${sc.best}`,
      reason: sc.detail,
      analogy: 'バリュー=「相手より強い時」、ブラフ=「相手のレンジを降ろせる時」。',
      realTable: 'ブラフはまずセミブラフから入るのが安全。',
      nextPoint: 'リバーは未来カードがないので、純レンジ判断になる。',
    },
    difficulty: 5,
  };
}

// ---------- SPR/MDF ----------
export function makeSprMdfQuiz(): Quiz {
  const variant = pick(['mdf', 'spr', 'bluff-rate'] as const);
  if (variant === 'mdf') {
    const pot = pick([100, 150, 200]);
    const betPct = pick([50, 75, 100, 150]);
    const bet = (pot * betPct) / 100;
    const m = mdf(pot, bet);
    const correct = `${m.toFixed(0)}%`;
    const wrongs = new Set<string>();
    while (wrongs.size < 3) {
      const w = m + (Math.random() < 0.5 ? -1 : 1) * pick([10, 15, 20, 25]);
      if (w > 0 && w < 100 && Math.abs(w - m) > 3) wrongs.add(`${Math.round(w)}%`);
    }
    const options = shuffle([correct, ...Array.from(wrongs)]);
    return {
      id: nextId(),
      type: 'spr-mdf',
      question:
        `【MDF（最小防御頻度）】\nポット ${pot}、相手ベット ${bet}（${betPct}%）。\n` +
        `理論上、降りすぎないために守るべき最低頻度は？`,
      options,
      correctAnswers: [options.indexOf(correct)],
      explanation: {
        conclusion: `MDF ≈ ${correct}。`,
        reason: `MDF = ポット / (ポット + ベット) = ${pot}/(${pot}+${bet}) = ${(pot/(pot+bet)*100).toFixed(1)}%`,
        analogy: 'ポットサイズ→50%、ハーフ→67%、3/4→57%。',
        realTable: '一律フォールドすると、相手はブラフし放題になる。',
        nextPoint: '自分の防御レンジが薄い時は、ブラフキャッチを増やす。',
      },
      difficulty: 5,
    };
  } else if (variant === 'spr') {
    const stack = pick([200, 500, 1000, 1500]);
    const pot = pick([50, 100, 150, 300]);
    const s = spr(stack, pot);
    const opts = ['1未満', '1〜3', '4〜7', '8〜12', '13以上'];
    let correct = '13以上';
    if (s < 1) correct = '1未満';
    else if (s < 4) correct = '1〜3';
    else if (s < 8) correct = '4〜7';
    else if (s < 13) correct = '8〜12';
    return {
      id: nextId(),
      type: 'spr-mdf',
      question: `【SPR】残スタック ${stack}、ポット ${pot}。SPR は？`,
      options: opts,
      correctAnswers: [opts.indexOf(correct)],
      explanation: {
        conclusion: `SPR = ${stack}/${pot} = ${s.toFixed(2)} → ${correct}`,
        reason: 'SPRが低い=コミット圏。高い=ナッツ寄りでないと深く戦わない。',
        analogy: 'SPR<1: 実質オールイン覚悟。SPR>13: 中役で大ポットを作らない。',
        realTable: 'プリフロップでスタック / ポット = SPR を意識し、フロップで戦略を決める。',
        nextPoint: 'SPRに合わせたコミット判断。',
      },
      difficulty: 5,
    };
  } else {
    const pot = pick([100, 150]);
    const betPct = pick([50, 75, 100, 150]);
    const bet = (pot * betPct) / 100;
    const t = bluffSuccessThreshold(pot, bet);
    const correct = `${t.toFixed(0)}%`;
    const wrongs = new Set<string>();
    while (wrongs.size < 3) {
      const w = t + (Math.random() < 0.5 ? -1 : 1) * pick([10, 15, 20]);
      if (w > 0 && w < 100 && Math.abs(w - t) > 3) wrongs.add(`${Math.round(w)}%`);
    }
    const options = shuffle([correct, ...Array.from(wrongs)]);
    return {
      id: nextId(),
      type: 'spr-mdf',
      question:
        `【ブラフ成功閾値（α）】\nポット ${pot}、ブラフ ${bet}（${betPct}%）。\n` +
        `相手が何%降りればブラフは即時利益？`,
      options,
      correctAnswers: [options.indexOf(correct)],
      explanation: {
        conclusion: `α = ${correct}。これより相手のフォールド率が高ければ利益。`,
        reason: `α = ベット / (ポット + ベット) = ${bet}/(${pot}+${bet}) = ${(bet/(pot+bet)*100).toFixed(1)}%。MDFと表裏。`,
        analogy: 'ベットを大きくすると必要なフォールド率が上がる→ブラフ成功条件が厳しくなる。',
        realTable: '相手がフィットオアフォールド型なら大きいブラフが効く。',
        nextPoint: 'ブラフ頻度はベットサイズに連動させる。',
      },
      difficulty: 5,
    };
  }
}

// ヘルパー
function clamp(x: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, x));
}
function c(r: number, s: 'spades'|'hearts'|'diamonds'|'clubs'): Card { return makeCard(r as Rank, s); }

// ---------- バッチ生成 ----------
// question テキストで重複を排除して n 個取り出す
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

export function generateAdvancedBatch(type: Quiz['type'], n: number): Quiz[] {
  const make = (): Quiz => {
    switch (type) {
      case 'pot-odds': return makePotOddsQuiz();
      case 'outs': return makeOutsQuiz();
      case 'ev': return makeEVQuiz();
      case 'equity': return makeEquityQuiz();
      case 'range-position': return makeRangePositionQuiz();
      case 'board-texture': return makeBoardTextureQuiz();
      case 'bet-sizing': return makeBetSizingQuiz();
      case 'bluff-value': return makeBluffValueQuiz();
      case 'spr-mdf': return makeSprMdfQuiz();
      default: return makePotOddsQuiz();
    }
  };
  return uniqueByQuestion(make, n);
}

// 互換チェック（未使用警告対策）
void isInOpen;
void fullDeck;
