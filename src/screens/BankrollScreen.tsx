import { useState, useMemo } from 'react';
import type { Mode, PlayerStats, BankrollSettings } from '../types';

interface Props {
  stats: PlayerStats;
  setStats: (s: PlayerStats) => void;
  go: (m: Mode) => void;
}

const DEFAULTS: BankrollSettings = {
  funds: 100000,
  buyIn: 5000,
  winRatePct: 55,
  avgWin: 4000,
  avgLoss: 3500,
  losingStreak: 8,
  monthlyExpense: 150000,
  separated: true,
};

// 破産確率（簡易・教育用近似）
// 単純なランダムウォーク2分岐モデル: p=勝率, q=1-p, 1勝で+1単位, 1敗で-1単位
// バンクロール = 保有バイイン数 N のとき、破産確率 ≈ (q/p)^N (p>q の時)
// 教育目的の近似であり、実プレイの保証ではない。
function ruinProb(N: number, p: number): number {
  if (p <= 0.5) return 1; // 期待値ゼロ以下なら長期で破産
  const ratio = (1 - p) / p;
  return Math.pow(ratio, N);
}

function evaluate(b: BankrollSettings) {
  const buyIns = b.buyIn > 0 ? Math.floor(b.funds / b.buyIn) : 0;
  const evPerSession = (b.winRatePct / 100) * b.avgWin - (1 - b.winRatePct / 100) * b.avgLoss;
  const ruin = ruinProb(buyIns, b.winRatePct / 100);
  const survivesStreak = buyIns >= b.losingStreak * 1.5;

  let danger: 'safe' | 'caution' | 'danger' = 'safe';
  if (buyIns < 10 || ruin > 0.2) danger = 'danger';
  else if (buyIns < 20 || ruin > 0.05) danger = 'caution';

  let recommendedStake: 'down' | 'stay' | 'up' = 'stay';
  if (buyIns < 15) recommendedStake = 'down';
  else if (buyIns >= 40 && evPerSession > 0) recommendedStake = 'up';

  let proCheck = 'まだ判断できない（試行を増やす）';
  if (b.winRatePct >= 55 && buyIns >= 50 && b.separated && evPerSession > 0) {
    proCheck = '✅ 専業の入口は見える数字。ただし最低6ヶ月の継続データが必要。';
  } else if (b.winRatePct >= 55 && buyIns >= 30) {
    proCheck = '⚠️ ほぼ良いが、生活費を分離していない／資金が30バイイン未満は危険。';
  } else if (b.winRatePct < 52) {
    proCheck = '❌ 勝率が損益分岐に近すぎる。専業化はまだ無理。';
  } else {
    proCheck = '⚠️ 数字が足りない。レートを下げて試行を積もう。';
  }

  return {
    buyIns,
    evPerSession,
    ruinPct: Math.min(100, ruin * 100),
    survivesStreak,
    danger,
    recommendedStake,
    proCheck,
  };
}

export default function BankrollScreen({ stats, setStats, go }: Props) {
  const [b, setB] = useState<BankrollSettings>(stats.bankrollSettings ?? DEFAULTS);
  const r = useMemo(() => evaluate(b), [b]);

  const update = <K extends keyof BankrollSettings>(k: K, v: BankrollSettings[K]) => {
    setB({ ...b, [k]: v });
  };

  const save = () => {
    setStats({
      ...stats,
      bankrollSettings: b,
      bankrollUsed: true,
      exp: stats.exp + 5,
    });
  };

  const NumberInput = ({ k, label, step = 1000 }: { k: keyof BankrollSettings; label: string; step?: number }) => (
    <label className="block">
      <span className="text-xs text-white/70">{label}</span>
      <input
        type="number"
        step={step}
        value={b[k] as number}
        onChange={e => update(k, Number(e.target.value) as never)}
        className="w-full mt-1 px-3 py-2 rounded-lg bg-white/5 border border-white/20 text-white"
      />
    </label>
  );

  const dangerColor = r.danger === 'safe' ? 'text-emerald-300' : r.danger === 'caution' ? 'text-yellow-300' : 'text-red-300';
  const dangerBg = r.danger === 'safe' ? 'bg-emerald-500/10 border-emerald-400/40' : r.danger === 'caution' ? 'bg-yellow-500/10 border-yellow-400/40' : 'bg-red-500/10 border-red-400/40';

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <div className="text-center mb-6">
        <h1 className="text-2xl font-black">💰 バンクロール管理シミュレーター</h1>
        <p className="text-xs text-white/60 mt-2">
          上手くても資金管理が下手なら破産する。<br />
          数字でリスクを見えるようにしよう。
        </p>
      </div>

      <div className="panel mb-4">
        <div className="text-sm font-bold mb-3">入力</div>
        <div className="grid sm:grid-cols-2 gap-3">
          <NumberInput k="funds" label="現在のポーカー資金 (円)" step={10000} />
          <NumberInput k="buyIn" label="目標レートの1バイイン額 (円)" step={500} />
          <NumberInput k="winRatePct" label="想定勝率（%）" step={1} />
          <NumberInput k="avgWin" label="勝ちセッションの平均利益 (円)" step={500} />
          <NumberInput k="avgLoss" label="負けセッションの平均損失 (円)" step={500} />
          <NumberInput k="losingStreak" label="想定する連敗回数" step={1} />
          <NumberInput k="monthlyExpense" label="月の生活費 (円)" step={10000} />
          <label className="flex items-center gap-2 mt-2">
            <input
              type="checkbox"
              checked={b.separated}
              onChange={e => update('separated', e.target.checked)}
              className="w-5 h-5"
            />
            <span className="text-xs">生活費とポーカー資金を分けている</span>
          </label>
        </div>
      </div>

      <div className={`panel border-2 mb-4 ${dangerBg}`}>
        <div className="text-sm text-white/70">診断結果</div>
        <div className="grid sm:grid-cols-3 gap-3 mt-2">
          <div>
            <div className="text-xs text-white/60">保有バイイン数</div>
            <div className="text-2xl font-black">{r.buyIns} BI</div>
            <div className="text-[11px] text-white/60">推奨：30 BI以上、専業は50 BI+</div>
          </div>
          <div>
            <div className="text-xs text-white/60">1セッション期待値</div>
            <div className={`text-2xl font-black ${r.evPerSession >= 0 ? 'text-emerald-300' : 'text-red-300'}`}>
              {r.evPerSession >= 0 ? '+' : ''}{Math.round(r.evPerSession).toLocaleString()} 円
            </div>
          </div>
          <div>
            <div className="text-xs text-white/60">推定破産率（教育用近似）</div>
            <div className={`text-2xl font-black ${dangerColor}`}>
              {r.ruinPct.toFixed(1)}%
            </div>
          </div>
        </div>

        <div className="mt-3 text-sm">
          <div className={`font-bold ${dangerColor}`}>
            危険度：{r.danger === 'safe' ? '✅ 安全' : r.danger === 'caution' ? '⚠️ 注意' : '🚨 危険'}
          </div>
          <div className="mt-1">
            想定連敗（{b.losingStreak}回）に対し、{r.survivesStreak ? '✅ 耐えられる' : '❌ 耐えられない可能性あり'}（連敗の1.5倍以上のバイインが目安）
          </div>
          <div className="mt-1">
            レート判断：
            {r.recommendedStake === 'up' && <span className="text-emerald-300"> ⬆ レートアップ検討可（ただし試行データ十分か再確認）</span>}
            {r.recommendedStake === 'stay' && <span className="text-white/80"> → 現レート維持</span>}
            {r.recommendedStake === 'down' && <span className="text-red-300"> ⬇ レートダウン推奨（資金不足）</span>}
          </div>
          <div className="mt-1">専業可否チェック：{r.proCheck}</div>
        </div>
      </div>

      <div className="panel mb-4 text-xs leading-relaxed text-white/80">
        <div className="font-bold text-chipGold mb-2">💡 なぜ資金管理が大事か</div>
        <p>
          「上手いプレイヤーが破産する一番の理由は、技術ではなく資金管理」と言われます。
          短期では運の振れ幅で必ずダウンスイングが来ます。
          連敗10回が普通に起きる前提で、「破産しない最低バイイン数」を確保するのが資金管理の本質です。
        </p>
        <p className="mt-2">
          一般的な目安：キャッシュゲームなら30〜50BI、トーナメントなら100BI+。<br />
          専業を目指すなら、生活費6ヶ月分は<strong className="text-chipGold">ポーカー資金とは別口座</strong>で確保しておくのが安全。
        </p>
      </div>

      <div className="flex gap-3">
        <button className="btn-primary flex-1" onClick={save}>
          設定を保存（+5 EXP）
        </button>
        <button className="btn-secondary" onClick={() => go('home')}>ホーム</button>
      </div>

      <div className="mt-6 text-[11px] text-white/40 text-center">
        ⚠️ このシミュレーターは学習目的です。利益を保証するものではありません。<br />
        破産率は単純化された近似モデルです。実プレイの結果を保証しません。
      </div>
    </div>
  );
}
