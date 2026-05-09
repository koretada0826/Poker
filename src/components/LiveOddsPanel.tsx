import { useEffect, useMemo, useState } from 'react';
import type { Card } from '../types';
import { equityVsRandom, equityKidWords } from '../lib/equity';
import { countOuts, requiredEquity, evCall, ruleOf4, ruleOf2 } from '../lib/pokerMath';

interface Props {
  hole: Card[];
  community: Card[];
  pot: number;
  toCall: number;
  phase: 'preflop' | 'flop' | 'turn' | 'river' | 'showdown';
}

export default function LiveOddsPanel({ hole, community, pot, toCall, phase }: Props) {
  const [equity, setEquity] = useState<number | null>(null);
  const [calculating, setCalculating] = useState(false);

  // 高負荷なので非同期＆キャッシュキー
  const cacheKey = useMemo(
    () => `${hole.map(c => c.display).join('')}|${community.map(c => c.display).join('')}`,
    [hole, community]
  );

  useEffect(() => {
    if (phase === 'showdown') return;
    setCalculating(true);
    const sims = phase === 'preflop' ? 200 : 350;
    // 次フレームで計算（UIブロックを軽減）
    const id = setTimeout(() => {
      const r = equityVsRandom(hole, community, sims);
      setEquity(r.equity);
      setCalculating(false);
    }, 0);
    return () => clearTimeout(id);
  }, [cacheKey, phase]);

  const required = toCall > 0 ? requiredEquity(pot, toCall) : 0;
  const ev = equity !== null && toCall > 0 ? evCall(pot, toCall, equity / 100) : 0;
  const outs = useMemo(() => {
    if (community.length < 3 || community.length > 4) return null;
    return countOuts(hole, community);
  }, [hole, community]);

  const rec = recommend(equity, required, toCall);

  return (
    <div className="panel mb-3 border border-chipGold/30 bg-emerald-900/20">
      <div className="flex items-center justify-between mb-2">
        <div className="text-xs text-chipGold font-bold">📊 勝つための数学（リアルタイム）</div>
        {calculating && <div className="text-[10px] text-white/40">計算中…</div>}
      </div>

      {/* 自分の勝率 */}
      <div className="mb-2">
        <div className="flex items-center justify-between text-xs mb-1">
          <span>① あなたの勝率（10回中何回勝てる？）</span>
          <span className="font-mono font-bold text-base">
            {equity === null ? '…' : `${equity.toFixed(0)}%`}
          </span>
        </div>
        <div className="h-2 bg-white/10 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all ${
              equity === null ? 'bg-white/20' :
              equity >= 60 ? 'bg-emerald-400' :
              equity >= 45 ? 'bg-chipGold' :
              equity >= 30 ? 'bg-orange-400' :
              'bg-red-400'
            }`}
            style={{ width: `${equity ?? 0}%` }}
          />
        </div>
        {equity !== null && (
          <div className="text-[11px] text-white/70 mt-1">
            {equityKidWords(equity)}
          </div>
        )}
      </div>

      {/* ポットオッズ（コール必要時） */}
      {toCall > 0 && (
        <div className="mb-2 panel bg-black/30 border-white/10 !p-2">
          <div className="flex items-center justify-between text-xs mb-1">
            <span>② コールに必要な勝率（払う ÷ もらえる）</span>
            <span className="font-mono font-bold text-base">{required.toFixed(0)}%</span>
          </div>
          <div className="text-[11px] text-white/70">
            ポット {pot} に {toCall} 払う → 必要な勝率は{required.toFixed(0)}%。
            <br />
            {equity !== null && (
              equity >= required
                ? <span className="text-emerald-300">あなたの勝率 {equity.toFixed(0)}% ≧ 必要 {required.toFixed(0)}% → コールが得！(+EV)</span>
                : <span className="text-red-300">あなたの勝率 {equity.toFixed(0)}% &lt; 必要 {required.toFixed(0)}% → コールは損(−EV)、降りる方がチップが残る。</span>
            )}
          </div>
        </div>
      )}

      {/* EV */}
      {toCall > 0 && equity !== null && (
        <div className="mb-2 text-xs">
          <span className="text-white/60">③ EV(コール時の期待値): </span>
          <span className={`font-mono font-bold ${ev >= 0 ? 'text-emerald-300' : 'text-red-300'}`}>
            {ev >= 0 ? '+' : ''}{ev.toFixed(0)} チップ
          </span>
          <span className="text-[11px] text-white/50 ml-1">
            （何度もこの場面が来たら平均で {ev >= 0 ? '増える' : '減る'}）
          </span>
        </div>
      )}

      {/* アウツ */}
      {outs && outs.total > 0 && (
        <div className="mb-2 panel bg-yellow-500/10 border-yellow-400/30 !p-2">
          <div className="text-xs mb-1">
            ④ アウツ：<b className="text-yellow-200">{outs.total}枚</b>
            {community.length === 3 && (
              <> → リバーまで完成率 ≒ <b>{ruleOf4(outs.total)}%</b>（4倍ルール）</>
            )}
            {community.length === 4 && (
              <> → リバーで完成率 ≒ <b>{ruleOf2(outs.total)}%</b>（2倍ルール）</>
            )}
          </div>
          <div className="text-[10px] text-white/60">
            {outs.details.map((d, i) => (
              <span key={i} className="mr-2">{d.kind}×{d.count}</span>
            ))}
          </div>
        </div>
      )}

      {/* 推奨 */}
      {rec && (
        <div className={`panel !p-2 border ${rec.color}`}>
          <div className="text-xs">
            👉 数学が示す答え：<b className="text-base">{rec.label}</b>
          </div>
          <div className="text-[11px] text-white/80 mt-0.5">{rec.reason}</div>
        </div>
      )}
    </div>
  );
}

function recommend(equity: number | null, required: number, toCall: number) {
  if (equity === null) return null;
  if (toCall > 0) {
    const margin = equity - required;
    if (margin >= 15) {
      return {
        label: 'コール or レイズ',
        reason: `勝率${equity.toFixed(0)}%は必要${required.toFixed(0)}%を大幅に上回る。攻めて良い場面。`,
        color: 'border-emerald-400/40 bg-emerald-500/10',
      };
    }
    if (margin >= 0) {
      return {
        label: 'コール',
        reason: `勝率${equity.toFixed(0)}% ≥ 必要${required.toFixed(0)}%。長期で見ればプラス。`,
        color: 'border-chipGold/40 bg-chipGold/10',
      };
    }
    return {
      label: 'フォールド',
      reason: `勝率${equity.toFixed(0)}% < 必要${required.toFixed(0)}%。ここは降りるとチップが残る。`,
      color: 'border-red-400/40 bg-red-500/10',
    };
  }
  // チェック / ベット判断
  if (equity >= 65) {
    return {
      label: 'ベット（バリュー）',
      reason: `勝率${equity.toFixed(0)}%と高い。ベットして相手から払ってもらう。`,
      color: 'border-emerald-400/40 bg-emerald-500/10',
    };
  }
  if (equity >= 50) {
    return {
      label: '小さくベット or チェック',
      reason: `勝率${equity.toFixed(0)}%と五分以上。ポットコントロールしながら。`,
      color: 'border-chipGold/40 bg-chipGold/10',
    };
  }
  return {
    label: 'チェック',
    reason: `勝率${equity.toFixed(0)}%は低い。ここは無料で進む（チェック）が安全。`,
    color: 'border-white/20 bg-white/5',
  };
}
