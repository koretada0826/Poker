import { useState } from 'react';
import {
  decideCall,
  evCall,
  exactHitProb,
  mdf,
  potOddsRatio,
  requiredEquity,
  ruleOf2,
  ruleOf4,
  spr,
  sprComment,
} from '../lib/pokerMath';
import { EQUITY_HEURISTICS } from '../data/equityTable';
import type { Mode } from '../types';

interface Props {
  go: (m: Mode) => void;
}

export default function MathLabScreen({ go }: Props) {
  const [tab, setTab] = useState<'odds' | 'outs' | 'spr' | 'mdf' | 'heuristic'>('odds');

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <h2 className="text-2xl font-bold mb-3">🧮 数学ラボ</h2>
      <p className="text-xs text-white/60 mb-4">
        実際の数値を入れて、ポーカーの数学を「指で触って」覚えます。
      </p>

      <div className="flex gap-1 flex-wrap mb-4">
        {[
          ['odds', 'ポットオッズ'],
          ['outs', 'アウツ→%'],
          ['spr', 'SPR'],
          ['mdf', 'MDF'],
          ['heuristic', '暗記表'],
        ].map(([k, l]) => (
          <button
            key={k}
            className={`badge text-xs ${tab === k ? 'bg-chipGold text-feltDark' : 'bg-white/10'}`}
            onClick={() => setTab(k as any)}
          >
            {l}
          </button>
        ))}
      </div>

      <div className="panel">
        {tab === 'odds' && <PotOddsLab />}
        {tab === 'outs' && <OutsLab />}
        {tab === 'spr' && <SprLab />}
        {tab === 'mdf' && <MdfLab />}
        {tab === 'heuristic' && <HeuristicLab />}
      </div>

      <div className="mt-6 text-center">
        <button className="btn-secondary" onClick={() => go('home')}>
          ホームへ
        </button>
      </div>
    </div>
  );
}

function NumInput({
  label, value, set, min = 0, max = 5000,
}: { label: string; value: number; set: (v: number) => void; min?: number; max?: number }) {
  return (
    <label className="block text-xs">
      <span className="text-white/70">{label}</span>
      <input
        type="number"
        min={min}
        max={max}
        value={value}
        onChange={e => set(Math.max(min, Math.min(max, Number(e.target.value) || 0)))}
        className="mt-1 w-full p-2 rounded-lg bg-white/10 border border-white/20 text-sm font-mono"
      />
    </label>
  );
}

function PotOddsLab() {
  const [pot, setPot] = useState(100);
  const [bet, setBet] = useState(50);
  const [equity, setEquity] = useState(35);

  const actualPot = pot + bet;
  const required = requiredEquity(actualPot, bet);
  const ev = evCall(actualPot, bet, equity / 100);
  const decision = decideCall(actualPot, bet, equity);

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-2">
        <NumInput label="現在のポット" value={pot} set={setPot} />
        <NumInput label="相手のベット" value={bet} set={setBet} />
        <NumInput label="自分の勝率(%)" value={equity} set={setEquity} max={100} />
      </div>
      <div className="text-sm space-y-1 mt-2">
        <Row k="ポット（相手ベット込み）" v={`${actualPot}`} />
        <Row k="あなたのコール額" v={`${bet}`} />
        <Row k="ポットオッズ" v={potOddsRatio(actualPot, bet)} />
        <Row k="必要勝率（ブレイクイーブン）" v={`${required.toFixed(1)}%`} highlight />
        <Row k="EV(コール時)" v={`${ev >= 0 ? '+' : ''}${ev.toFixed(1)}`} highlight={ev >= 0 ? 'good' : 'bad'} />
        <Row k="判定" v={decision.shouldCall ? '✅ コール推奨（+EV）' : '⚠️ フォールド推奨（-EV）'} highlight={decision.shouldCall ? 'good' : 'bad'} />
      </div>
      <p className="text-xs text-white/60">
        💡 必要勝率 = コール額 ÷ (ポット + コール額)。<br />
        自分のエクイティがこれを上回れば長期で勝てる判断です。
      </p>
    </div>
  );
}

function OutsLab() {
  const [outs, setOuts] = useState(9);
  const [streets, setStreets] = useState<1 | 2>(2);
  const remaining = 47;
  const exact = exactHitProb(outs, remaining, streets);
  const rough = streets === 1 ? ruleOf2(outs) : ruleOf4(outs);

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        <NumInput label="アウツ数" value={outs} set={setOuts} max={25} />
        <label className="block text-xs">
          <span className="text-white/70">残りのストリート</span>
          <select
            className="mt-1 w-full p-2 rounded-lg bg-white/10 border border-white/20 text-sm"
            value={streets}
            onChange={e => setStreets(Number(e.target.value) as 1 | 2)}
          >
            <option value={1}>1枚来る（ターン or リバー）</option>
            <option value={2}>2枚来る（フロップ→リバー）</option>
          </select>
        </label>
      </div>
      <div className="text-sm space-y-1">
        <Row k={streets === 1 ? '2ルール (×2)' : '4ルール (×4)'} v={`約 ${rough}%`} />
        <Row k="厳密値" v={`${exact.toFixed(1)}%`} highlight />
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
        {[
          ['フラッシュドロー', 9],
          ['OESD', 8],
          ['ガットショット', 4],
          ['コンボドロー', 15],
          ['ペア→トリップス', 2],
          ['2ペア→FH', 4],
          ['ペア→2ペア', 5],
          ['ハイカードのみ', 6],
        ].map(([n, o]) => (
          <button
            key={String(n)}
            className="opt-btn !p-2 !min-h-0 text-xs text-center"
            onClick={() => setOuts(o as number)}
          >
            {n} ({o})
          </button>
        ))}
      </div>
      <p className="text-xs text-white/60">
        💡 4ルールは「フロップから一度もベットせずリバーまで見る」ことが前提。実戦では相手が打ってくるので、2ルール（次1枚分）で考えるのがより安全。
      </p>
    </div>
  );
}

function SprLab() {
  const [stack, setStack] = useState(500);
  const [pot, setPot] = useState(100);
  const s = spr(stack, pot);

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        <NumInput label="残スタック" value={stack} set={setStack} max={10000} />
        <NumInput label="現在のポット" value={pot} set={setPot} max={5000} />
      </div>
      <div className="text-sm space-y-1">
        <Row k="SPR" v={s === Infinity ? '∞' : s.toFixed(2)} highlight />
        <Row k="コミット度" v={sprComment(s)} />
      </div>
      <p className="text-xs text-white/60">
        💡 SPRが分かると「どの強さの役までスタックを賭けられるか」が見える。<br />
        SPR &lt; 1: トップペアでコミット可。SPR &gt; 13: ナッツ寄りでないと深く戦わない。
      </p>
    </div>
  );
}

function MdfLab() {
  const [pot, setPot] = useState(100);
  const [bet, setBet] = useState(75);
  const m = mdf(pot, bet);
  const alpha = (bet / (pot + bet)) * 100;

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        <NumInput label="ポット" value={pot} set={setPot} />
        <NumInput label="相手ベット" value={bet} set={setBet} />
      </div>
      <div className="text-sm space-y-1">
        <Row k="MDF（最低防御頻度）" v={`${m.toFixed(1)}%`} highlight />
        <Row k="α（ブラフ即時利益閾値）" v={`${alpha.toFixed(1)}%`} highlight />
      </div>
      <p className="text-xs text-white/60">
        💡 MDFはディフェンス側、αはオフェンス側の数学。<br />
        ポットサイズベットなら MDF=50%、α=50%。<br />
        相手のフォールド率がα以上なら、純ブラフでも利益が出ます。
      </p>
    </div>
  );
}

function HeuristicLab() {
  return (
    <div className="space-y-2 text-sm">
      <h3 className="font-bold mb-2">📚 暗記しておくべき数値</h3>
      {EQUITY_HEURISTICS.map((h, i) => (
        <div key={i} className="p-3 rounded-xl border border-white/10 bg-white/5">
          <div className="font-bold text-chipGold">{h.rule}</div>
          <div className="text-base">{h.value}</div>
          <div className="text-xs text-white/70 mt-1">{h.tip}</div>
        </div>
      ))}
    </div>
  );
}

function Row({ k, v, highlight }: { k: string; v: string; highlight?: boolean | 'good' | 'bad' }) {
  const cls =
    highlight === 'good'
      ? 'text-emerald-300 font-bold'
      : highlight === 'bad'
      ? 'text-red-300 font-bold'
      : highlight
      ? 'text-chipGold font-bold'
      : '';
  return (
    <div className="flex justify-between gap-2">
      <span className="text-white/70">{k}</span>
      <span className={cls}>{v}</span>
    </div>
  );
}
