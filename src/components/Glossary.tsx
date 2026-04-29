import { useMemo, useState } from 'react';
import { GLOSSARY, type GlossaryEntry } from '../data/glossary';

interface Props {
  open: boolean;
  onClose: () => void;
}

const CATEGORIES: GlossaryEntry['category'][] = [
  'カード', '役', '進行', '行動', 'チップ', '戦略', 'マナー',
];

export default function Glossary({ open, onClose }: Props) {
  const [q, setQ] = useState('');
  const [cat, setCat] = useState<GlossaryEntry['category'] | 'all'>('all');

  const filtered = useMemo(() => {
    return GLOSSARY.filter(e => {
      if (cat !== 'all' && e.category !== cat) return false;
      if (!q) return true;
      const t = q.toLowerCase();
      return (
        e.term.toLowerCase().includes(t) ||
        e.short.toLowerCase().includes(t) ||
        e.detail.toLowerCase().includes(t)
      );
    });
  }, [q, cat]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="absolute inset-0 sm:inset-auto sm:top-10 sm:bottom-10 sm:left-1/2 sm:-translate-x-1/2 sm:w-[640px] sm:max-w-[95vw] bg-feltDark sm:rounded-2xl border border-white/10 flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center gap-2 p-3 border-b border-white/10">
          <span className="text-xl">📖</span>
          <div className="font-bold flex-1">用語辞書</div>
          <button
            className="btn-secondary !px-3 !py-2 !min-h-0 text-sm"
            onClick={onClose}
            aria-label="閉じる"
          >
            ✕
          </button>
        </div>

        <div className="p-3 space-y-2 border-b border-white/10">
          <input
            value={q}
            onChange={e => setQ(e.target.value)}
            placeholder="用語を検索（例：コール）"
            className="w-full p-2 rounded-lg bg-white/10 border border-white/20 text-sm placeholder-white/40"
          />
          <div className="flex gap-1 flex-wrap">
            <button
              className={`badge text-[11px] ${cat === 'all' ? 'bg-chipGold text-feltDark' : 'bg-white/10'}`}
              onClick={() => setCat('all')}
            >
              すべて
            </button>
            {CATEGORIES.map(c => (
              <button
                key={c}
                className={`badge text-[11px] ${cat === c ? 'bg-chipGold text-feltDark' : 'bg-white/10'}`}
                onClick={() => setCat(c)}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {filtered.length === 0 ? (
            <div className="text-center text-white/50 text-sm py-8">
              該当する用語が見つかりません
            </div>
          ) : (
            filtered.map((e, i) => (
              <div key={i} className="panel !p-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold">{e.term}</span>
                  <span className="badge bg-white/10 text-[10px]">{e.category}</span>
                </div>
                <p className="text-sm mt-1">{e.short}</p>
                <p className="text-xs text-white/60 mt-1">{e.detail}</p>
                {e.analogy && (
                  <p className="text-xs text-chipGold mt-1">例え: {e.analogy}</p>
                )}
              </div>
            ))
          )}
        </div>

        <div className="p-3 text-center text-[11px] text-white/40 border-t border-white/10">
          わからない言葉が出てきたら、いつでもこの📖を開いてOK
        </div>
      </div>
    </div>
  );
}
