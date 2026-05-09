import { useEffect } from 'react';
import CardRow from '../components/CardRow';
import { makeCard } from '../lib/deck';
import { markCompleted, nextInRoadmap, nextStepTitle } from '../lib/roadmap';
import type { Card, Mode, PlayerStats, Rank } from '../types';

interface Props {
  go: (m: Mode) => void;
  stats?: PlayerStats;
  setStats?: (s: PlayerStats) => void;
}

interface Entry {
  rank: number;
  ja: string;
  en: string;
  cards: Card[];
  short: string;
  detail: string;
  example?: string;
  rarity: string;
}

const c = (r: number, s: 'spades'|'hearts'|'diamonds'|'clubs') => makeCard(r as Rank, s);

const ENTRIES: Entry[] = [
  {
    rank: 1, ja: 'ロイヤルフラッシュ', en: 'Royal Flush',
    cards: [c(14,'diamonds'), c(13,'diamonds'), c(12,'diamonds'), c(11,'diamonds'), c(10,'diamonds')],
    short: '同じマークでA-K-Q-J-10。',
    detail: 'ポーカー最強の役。一生に何度出るか。',
    example: '10-J-Q-K-A 同マーク。',
    rarity: '伝説級',
  },
  {
    rank: 2, ja: 'ストレートフラッシュ', en: 'Straight Flush',
    cards: [c(9,'clubs'), c(8,'clubs'), c(7,'clubs'), c(6,'clubs'), c(5,'clubs')],
    short: '同じマークで連続5枚。',
    detail: 'ストレートとフラッシュの合わせ技。激レア。',
    example: '5-6-7-8-9すべて♣。',
    rarity: '激レア',
  },
  {
    rank: 3, ja: 'フォーカード', en: 'Four of a Kind',
    cards: [c(8,'spades'), c(8,'hearts'), c(8,'diamonds'), c(8,'clubs'), c(13,'spades')],
    short: '同じ数字が4枚。',
    detail: 'ものすごく強い。出たらほぼ勝てる。',
    example: '8-8-8-8 + K → 8のフォーカード。',
    rarity: '稀',
  },
  {
    rank: 4, ja: 'フルハウス', en: 'Full House',
    cards: [c(12,'spades'), c(12,'hearts'), c(12,'diamonds'), c(7,'clubs'), c(7,'spades')],
    short: 'スリーカード+ワンペア。',
    detail: 'とても強い。フラッシュにも勝てる。',
    example: 'QQQ + 77 → Q-7のフルハウス。',
    rarity: 'たまに',
  },
  {
    rank: 5, ja: 'フラッシュ', en: 'Flush',
    cards: [c(14,'hearts'), c(11,'hearts'), c(8,'hearts'), c(5,'hearts'), c(2,'hearts')],
    short: '5枚すべて同じマーク。',
    detail: '数字は連続していなくてOK。ストレートより強い。',
    example: '♥が5枚そろう。',
    rarity: '時々出る',
  },
  {
    rank: 6, ja: 'ストレート', en: 'Straight',
    cards: [c(8,'spades'), c(7,'hearts'), c(6,'diamonds'), c(5,'clubs'), c(4,'spades')],
    short: '5枚の数字が連続。',
    detail: 'マークはバラバラでOK。Aは1としても使える（A-2-3-4-5）。',
    example: '4-5-6-7-8。最強は10-J-Q-K-A。',
    rarity: '時々出る',
  },
  {
    rank: 7, ja: 'スリーカード', en: 'Three of a Kind',
    cards: [c(9,'spades'), c(9,'hearts'), c(9,'diamonds'), c(13,'clubs'), c(4,'spades')],
    short: '同じ数字が3枚。',
    detail: '別名「セット」「トリップス」。けっこう強い役。',
    example: '9-9-9 + K + 4 → 9のスリーカード。',
    rarity: 'たまに出る',
  },
  {
    rank: 8, ja: 'ツーペア', en: 'Two Pair',
    cards: [c(13,'spades'), c(13,'diamonds'), c(7,'hearts'), c(7,'clubs'), c(2,'spades')],
    short: 'ペアが2組。',
    detail: 'ワンペアより一段強い。同じツーペア同士なら大きい方のペアが勝ち。',
    example: 'KK + 77 + 2 → Kとセブンのツーペア。',
    rarity: 'たまに出る',
  },
  {
    rank: 9, ja: 'ワンペア', en: 'One Pair',
    cards: [c(11,'spades'), c(11,'hearts'), c(9,'diamonds'), c(5,'clubs'), c(2,'spades')],
    short: '同じ数字が2枚そろう。',
    detail: 'ポーカーで一番よく出る役。これで「強い手」と思って突っ込むと危険なことも。',
    example: 'JJ + 9 5 2 → Jのワンペア。',
    rarity: 'よく出る',
  },
  {
    rank: 10, ja: 'ハイカード', en: 'High Card',
    cards: [c(14,'spades'), c(11,'hearts'), c(7,'diamonds'), c(4,'clubs'), c(2,'hearts')],
    short: '役なし。一番大きい1枚で勝負。',
    detail: 'ペアもストレートも何も無い状態。最弱です。',
    example: '上の例ならAが一番強い。「Aハイ」と呼ぶこともあります。',
    rarity: 'よく出る',
  },
];

export default function HandBookScreen({ go, stats, setStats }: Props) {
  // 開いた時点で「実施済み」マーク（10種類すべて見せている前提）
  useEffect(() => {
    if (stats && setStats && !stats.completedLessons.includes('hand-book')) {
      setStats(markCompleted(stats, 'hand-book'));
    }
  }, [stats, setStats]);

  const next = nextInRoadmap('hand-book');
  const nextTitle = nextStepTitle('hand-book');

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <div className="text-center mb-4">
        <h2 className="text-2xl font-bold">📖 役図鑑</h2>
        <p className="text-xs text-white/60 mt-1">
          上が最強・下が最弱。例の5枚と一緒に覚えましょう。
        </p>
      </div>

      <div className="space-y-3">
        {ENTRIES.map(e => (
          <div key={e.rank} className="panel">
            <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <span className="badge bg-chipGold text-feltDark">第{e.rank}位</span>
                <span className="font-bold text-lg">{e.ja}</span>
                <span className="text-xs text-white/50">{e.en}</span>
              </div>
              <span className="badge bg-white/10 text-[10px]">{e.rarity}</span>
            </div>
            <CardRow cards={e.cards} size="sm" />
            <div className="mt-3 text-sm space-y-1">
              <p>{e.short}</p>
              <p className="text-white/70">{e.detail}</p>
              {e.example && <p className="text-xs text-chipGold">例: {e.example}</p>}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 text-center text-xs text-white/60 leading-relaxed">
        役は「上から順番に」覚えるのがコツ（強い順）。<br />
        初心者がよく出会うのは下のハイカード/ワンペア/ツーペアが中心です。
      </div>

      <div className="grid grid-cols-2 gap-3 mt-6">
        <button className="btn-secondary" onClick={() => go('home')}>
          ホームへ
        </button>
        {next ? (
          <button className="btn-primary" onClick={() => go(next)}>
            次のステップ → <span className="text-[10px] opacity-80 ml-1">{nextTitle}</span>
          </button>
        ) : (
          <button className="btn-primary" onClick={() => go('practice-hand')}>
            役判定で練習する →
          </button>
        )}
      </div>
    </div>
  );
}
