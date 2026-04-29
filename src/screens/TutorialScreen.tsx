import { useState } from 'react';
import Card from '../components/Card';
import CardRow from '../components/CardRow';
import { makeCard } from '../lib/deck';
import type { Mode, PlayerStats, Rank } from '../types';

interface Props {
  stats: PlayerStats;
  setStats: (s: PlayerStats) => void;
  go: (m: Mode) => void;
}

interface Step {
  title: string;
  body: string;
  visual: 'four-suits' | 'rank-line' | 'face-cards' | 'one-card-sample' | 'red-black' | 'hole-board' | 'flow' | 'final';
  tip?: string;
}

const STEPS: Step[] = [
  {
    title: '👋 ようこそ！',
    body: 'ポーカーは「カード」と「行動」で勝負するゲームです。難しそうに見えますが、たった2つの仕組みを覚えるだけ。まずは1分でトランプを見てみましょう。',
    visual: 'one-card-sample',
  },
  {
    title: 'マークは4種類だけ',
    body: 'トランプには4つのマークがあります。順番に見てみましょう。色や形が違うだけで、ポーカーでは「強さの上下」はありません。',
    visual: 'four-suits',
    tip: '全部で4種類。それだけです。',
  },
  {
    title: '色は2種類',
    body: '♥ハートと♦ダイヤは赤色。♠スペードと♣クラブは黒色。それだけです。',
    visual: 'red-black',
  },
  {
    title: '数字は1〜13まで',
    body: '1マークの中に13枚あります。2〜10は数字そのまま。残り3枚はアルファベットで書いてあって…',
    visual: 'rank-line',
    tip: '4マーク × 13枚 = 52枚。',
  },
  {
    title: '絵札の読み方',
    body: 'J=ジャック、Q=クイーン、K=キング、A=エース。強さは J → Q → K → A の順。Aが一番強いです。',
    visual: 'face-cards',
    tip: 'A・K・Q・J の4つの読み方だけ覚えればOK。',
  },
  {
    title: 'これが「自分のカード」と「場のカード」',
    body: 'ポーカーでは自分だけが見られる2枚（手札）と、全員が共通で見られる5枚（場のカード）を組み合わせて、一番強い「役」を作ります。',
    visual: 'hole-board',
    tip: '7枚の中から「一番強い5枚」を作ればOK。',
  },
  {
    title: 'ゲームは4回に分けて進む',
    body: 'カードは一気に出ません。①手札2枚→②場に3枚→③場に4枚目→④場に5枚目。各段階で「降りる/続ける」を選びます。',
    visual: 'flow',
    tip: 'プリフロップ → フロップ → ターン → リバー、と呼びます。',
  },
  {
    title: '準備OK！',
    body: 'これだけ知っていればもう大丈夫。次は役（強い手の組み合わせ10種類）を覚えていきましょう。間違えても大丈夫、何度でも挑戦できます。',
    visual: 'final',
  },
];

export default function TutorialScreen({ stats, setStats, go }: Props) {
  const [step, setStep] = useState(0);
  const total = STEPS.length;
  const cur = STEPS[step];

  const finish = () => {
    if (!stats.completedLessons.includes('tutorial')) {
      setStats({
        ...stats,
        completedLessons: [...stats.completedLessons, 'tutorial'],
        exp: stats.exp + 20,
      });
    }
    go('lesson-cards');
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <div className="panel">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs text-white/60">入門チュートリアル</span>
          <span className="text-xs text-white/60">{step + 1} / {total}</span>
        </div>
        <div className="h-1 w-full bg-white/10 rounded-full overflow-hidden mb-5">
          <div
            className="h-full bg-chipGold transition-all"
            style={{ width: `${((step + 1) / total) * 100}%` }}
          />
        </div>

        <h2 className="text-2xl font-bold mb-3">{cur.title}</h2>

        <div className="my-5">
          <Visual kind={cur.visual} />
        </div>

        <p className="text-sm leading-relaxed">{cur.body}</p>

        {cur.tip && (
          <div className="mt-4 p-3 rounded-xl bg-chipGold/15 border border-chipGold/40 text-sm">
            <span className="font-bold text-chipGold">💡 ポイント：</span>
            {cur.tip}
          </div>
        )}

        <div className="mt-6 flex gap-2">
          <button
            className="btn-secondary flex-1"
            onClick={() => (step > 0 ? setStep(step - 1) : go('home'))}
          >
            {step > 0 ? '← 前へ' : 'ホーム'}
          </button>
          {step < total - 1 ? (
            <button className="btn-primary flex-1" onClick={() => setStep(step + 1)}>
              次へ →
            </button>
          ) : (
            <button className="btn-success flex-1" onClick={finish}>
              役を覚える →
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function Visual({ kind }: { kind: Step['visual'] }) {
  switch (kind) {
    case 'one-card-sample': {
      const c = makeCard(14 as Rank, 'spades');
      return (
        <div className="flex justify-center">
          <Card card={c} size="xl" />
        </div>
      );
    }
    case 'four-suits': {
      const cs = [
        makeCard(14 as Rank, 'spades'),
        makeCard(14 as Rank, 'hearts'),
        makeCard(14 as Rank, 'diamonds'),
        makeCard(14 as Rank, 'clubs'),
      ];
      return (
        <div>
          <CardRow cards={cs} size="lg" />
          <div className="grid grid-cols-4 gap-2 text-center text-xs mt-2">
            <div>♠<br/>スペード</div>
            <div className="text-red-300">♥<br/>ハート</div>
            <div className="text-red-300">♦<br/>ダイヤ</div>
            <div>♣<br/>クラブ</div>
          </div>
        </div>
      );
    }
    case 'red-black': {
      return (
        <div className="grid grid-cols-2 gap-3">
          <div className="text-center">
            <div className="text-xs text-red-300 mb-1">赤いマーク</div>
            <CardRow cards={[makeCard(7 as Rank, 'hearts'), makeCard(10 as Rank, 'diamonds')]} size="lg" />
          </div>
          <div className="text-center">
            <div className="text-xs mb-1">黒いマーク</div>
            <CardRow cards={[makeCard(7 as Rank, 'spades'), makeCard(10 as Rank, 'clubs')]} size="lg" />
          </div>
        </div>
      );
    }
    case 'rank-line': {
      const cs: Rank[] = [2, 5, 9, 10, 11, 12, 13, 14];
      return (
        <CardRow
          cards={cs.map(r => makeCard(r, 'spades'))}
          size="sm"
        />
      );
    }
    case 'face-cards': {
      return (
        <div>
          <CardRow
            cards={[
              makeCard(11 as Rank, 'spades'),
              makeCard(12 as Rank, 'spades'),
              makeCard(13 as Rank, 'spades'),
              makeCard(14 as Rank, 'spades'),
            ]}
            size="lg"
          />
          <div className="grid grid-cols-4 gap-2 text-center text-xs mt-2">
            <div>J<br/>ジャック</div>
            <div>Q<br/>クイーン</div>
            <div>K<br/>キング</div>
            <div className="text-chipGold font-bold">A<br/>エース</div>
          </div>
        </div>
      );
    }
    case 'hole-board': {
      return (
        <div className="space-y-3">
          <div>
            <div className="text-xs text-white/60 text-center mb-1">あなたの手札（自分だけ見える）</div>
            <CardRow cards={[makeCard(14 as Rank, 'spades'), makeCard(13 as Rank, 'spades')]} size="lg" />
          </div>
          <div>
            <div className="text-xs text-white/60 text-center mb-1">場のカード（全員で共通）</div>
            <CardRow
              cards={[
                makeCard(14 as Rank, 'hearts'),
                makeCard(7 as Rank, 'clubs'),
                makeCard(2 as Rank, 'diamonds'),
                makeCard(11 as Rank, 'spades'),
                makeCard(5 as Rank, 'hearts'),
              ]}
              size="sm"
            />
          </div>
          <div className="text-center text-xs text-chipGold">
            この7枚から一番強い5枚を作る！
          </div>
        </div>
      );
    }
    case 'flow': {
      return (
        <div className="text-xs space-y-2">
          {[
            ['プリフロップ', '手札の2枚を見て判断'],
            ['フロップ', '場に3枚いっぺんに開く'],
            ['ターン', '場に4枚目が開く'],
            ['リバー', '場に5枚目（最後）が開く'],
            ['ショーダウン', '残った人で勝負'],
          ].map(([n, d], i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="badge bg-chipGold text-feltDark w-32 justify-center">{n}</span>
              <span>{d}</span>
            </div>
          ))}
        </div>
      );
    }
    case 'final': {
      return (
        <div className="text-center">
          <div className="text-6xl">🎉</div>
        </div>
      );
    }
  }
}
