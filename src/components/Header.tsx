import type { PlayerStats } from '../types';

interface Props {
  stats: PlayerStats;
  onHome?: () => void;
  onOpenGlossary: () => void;
  title?: string;
  timerText?: string;
}

function pct(n: number, t: number) {
  if (t === 0) return '—';
  return Math.round((n / t) * 100) + '%';
}

export default function Header({ stats, onHome, onOpenGlossary, title, timerText }: Props) {
  return (
    <div className="sticky top-0 z-10 bg-feltDark/90 backdrop-blur border-b border-white/10">
      <div className="max-w-3xl mx-auto px-3 py-2 flex items-center gap-2">
        {onHome && (
          <button
            className="btn-secondary !px-3 !py-2 !min-h-0 text-sm"
            onClick={onHome}
            aria-label="ホームへ"
          >
            🏠
          </button>
        )}
        <div className="flex-1 min-w-0">
          <div className="font-bold text-sm truncate">{title || '3時間でポーカー実卓デビュー'}</div>
          <div className="text-[11px] text-white/60 truncate">
            {stats.title} ／ EXP {stats.exp}{timerText ? ` ／ ⏱ ${timerText}` : ''}
          </div>
        </div>
        <div className="hidden md:flex gap-1 text-[10px]">
          <span className="badge bg-white/10">役 {pct(stats.handQuizCorrect, stats.handQuizTotal)}</span>
          <span className="badge bg-white/10">行動 {pct(stats.actionCorrect, stats.actionTotal)}</span>
          <span className="badge bg-white/10">戦略 {pct(stats.strategyCorrect, stats.strategyTotal)}</span>
          <span className="badge bg-white/10">マナー {pct(stats.mannersCorrect, stats.mannersTotal)}</span>
        </div>
        <button
          className="btn-secondary !px-3 !py-2 !min-h-0 text-sm"
          onClick={onOpenGlossary}
          aria-label="用語辞書を開く"
          title="用語辞書"
        >
          📖
        </button>
      </div>
    </div>
  );
}
