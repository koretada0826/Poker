import { useState } from 'react';
import { WINNING_TIPS } from '../data/winningTips';

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function CheatSheet({ open, onClose }: Props) {
  const [active, setActive] = useState(0);
  if (!open) return null;
  const tip = WINNING_TIPS[active];

  return (
    <div
      className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[60] flex items-center justify-center p-3"
      onClick={onClose}
    >
      <div
        className="bg-feltDark border-2 border-chipGold/50 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-black">
            🎓 勝つためのコツ <span className="text-xs text-white/50">7ヶ条</span>
          </h2>
          <button
            className="text-white/60 hover:text-white text-2xl leading-none"
            onClick={onClose}
            aria-label="閉じる"
          >
            ×
          </button>
        </div>

        {/* タブ */}
        <div className="flex flex-wrap gap-1 mb-3">
          {WINNING_TIPS.map((t, i) => (
            <button
              key={i}
              onClick={() => setActive(i)}
              className={`px-2 py-1 rounded-lg text-xs font-bold transition ${
                i === active
                  ? 'bg-chipGold text-feltDark'
                  : 'bg-white/10 text-white/70 hover:bg-white/20'
              }`}
            >
              {t.emoji} {i + 1}
            </button>
          ))}
        </div>

        {/* 中身 */}
        <div className="panel">
          <div className="text-3xl mb-1">{tip.emoji}</div>
          <h3 className="text-xl font-black mb-1">{tip.title}</h3>
          <p className="text-base text-chipGold mb-3 leading-relaxed">
            👉 {tip.kidWords}
          </p>
          <p className="text-sm text-white/85 mb-3 whitespace-pre-line leading-relaxed">
            {tip.detail}
          </p>
          {tip.formula && (
            <div className="panel bg-emerald-500/10 border border-emerald-400/30 mb-3">
              <div className="text-xs text-emerald-200 mb-1">📐 計算式</div>
              <div className="text-sm font-mono">{tip.formula}</div>
            </div>
          )}
          <div className="panel bg-yellow-500/10 border border-yellow-400/30">
            <div className="text-xs text-yellow-200 mb-1">💡 例</div>
            <div className="text-sm whitespace-pre-line">{tip.example}</div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 mt-3">
          <button
            className="btn-secondary !py-2 text-sm"
            onClick={() => setActive(a => Math.max(0, a - 1))}
            disabled={active === 0}
          >
            ← 前
          </button>
          <button className="btn-secondary !py-2 text-sm" onClick={onClose}>
            閉じる
          </button>
          <button
            className="btn-primary !py-2 text-sm"
            onClick={() => setActive(a => Math.min(WINNING_TIPS.length - 1, a + 1))}
            disabled={active === WINNING_TIPS.length - 1}
          >
            次 →
          </button>
        </div>
      </div>
    </div>
  );
}
