import { useMemo, useState } from 'react';
import {
  gridToHand,
  OPEN_RANGES,
  POSITION_DESC,
  POSITION_JA,
  POSITIONS,
  RANGE_TIPS,
  RANK_ORDER,
  rangeSize,
  type Position,
} from '../lib/ranges';
import type { Mode } from '../types';

interface Props {
  go: (m: Mode) => void;
}

type Mode2 = 'view' | 'quiz';

export default function RangeTrainerScreen({ go }: Props) {
  const [position, setPosition] = useState<Position>('UTG');
  const [mode, setMode] = useState<Mode2>('view');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [submitted, setSubmitted] = useState(false);

  const correctSet = OPEN_RANGES[position];
  const allHandsList = useMemo(() => {
    const out: string[] = [];
    for (let r = 0; r < 13; r++) {
      for (let c = 0; c < 13; c++) out.push(gridToHand(r, c));
    }
    return out;
  }, []);

  const switchPos = (p: Position) => {
    setPosition(p);
    setSelected(new Set());
    setSubmitted(false);
  };

  const toggle = (h: string) => {
    if (mode !== 'quiz' || submitted) return;
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(h)) next.delete(h); else next.add(h);
      return next;
    });
  };

  const submit = () => setSubmitted(true);

  // 採点
  const tp = Array.from(selected).filter(h => correctSet.has(h)).length;
  const fp = Array.from(selected).filter(h => !correctSet.has(h)).length;
  const fn = Array.from(correctSet).filter(h => !selected.has(h)).length;
  const total = correctSet.size;
  const precision = selected.size === 0 ? 0 : tp / selected.size;
  const recall = total === 0 ? 0 : tp / total;
  const f1 = precision + recall === 0 ? 0 : (2 * precision * recall) / (precision + recall);

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <h2 className="text-xl font-bold">🎯 レンジトレーナー</h2>
        <div className="flex gap-1">
          <button
            className={`badge text-xs ${mode === 'view' ? 'bg-chipGold text-feltDark' : 'bg-white/10'}`}
            onClick={() => { setMode('view'); setSubmitted(false); }}
          >
            見る
          </button>
          <button
            className={`badge text-xs ${mode === 'quiz' ? 'bg-chipGold text-feltDark' : 'bg-white/10'}`}
            onClick={() => { setMode('quiz'); setSelected(new Set()); setSubmitted(false); }}
          >
            クイズ
          </button>
        </div>
      </div>

      <div className="flex gap-1 flex-wrap mb-3">
        {POSITIONS.map(p => (
          <button
            key={p}
            className={`badge text-xs ${position === p ? 'bg-chipGold text-feltDark' : 'bg-white/10'}`}
            onClick={() => switchPos(p)}
          >
            {p}
          </button>
        ))}
      </div>

      <div className="panel mb-3">
        <div className="text-sm font-bold">{POSITION_JA[position]}</div>
        <div className="text-xs text-white/70 mt-1">{POSITION_DESC[position]}</div>
        <div className="text-xs text-chipGold mt-1">
          標準オープンレンジ: {rangeSize(position)} ハンド
          ({((rangeSize(position) / 169) * 100).toFixed(0)}%)
        </div>
      </div>

      {mode === 'quiz' && (
        <div className="panel mb-3 border border-chipGold/40 text-sm">
          <div className="font-bold text-chipGold mb-1">クイズ：</div>
          <p>
            {position} で OPEN（最初にレイズ）すべきハンドを<b>すべて</b>選んでください。<br />
            終わったら「採点」ボタンを押すと、正解と比較できます。
          </p>
        </div>
      )}

      <Grid
        position={position}
        selected={selected}
        submitted={submitted}
        mode={mode}
        onToggle={toggle}
      />

      <div className="mt-3 text-[11px] text-white/60 flex items-center gap-3 flex-wrap">
        <span><span className="inline-block w-3 h-3 bg-chipGold mr-1 rounded-sm" />{mode === 'quiz' && submitted ? '正解（あなたも選択）' : 'OPENレンジ'}</span>
        {mode === 'quiz' && submitted && (
          <>
            <span><span className="inline-block w-3 h-3 bg-emerald-400/40 mr-1 rounded-sm" />あなたが選んで合っていた</span>
            <span><span className="inline-block w-3 h-3 bg-red-400/40 mr-1 rounded-sm" />選んだが不正解</span>
            <span><span className="inline-block w-3 h-3 bg-yellow-300/30 mr-1 rounded-sm" />選び忘れ</span>
          </>
        )}
      </div>

      {mode === 'quiz' && (
        <div className="mt-4">
          {!submitted ? (
            <button
              className="btn-primary w-full"
              disabled={selected.size === 0}
              onClick={submit}
            >
              採点する（{selected.size}ハンド選択中）
            </button>
          ) : (
            <div className="panel">
              <div className="text-sm font-bold mb-2">採点結果</div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>正解した（選んで OK）: <b className="text-emerald-300">{tp}</b></div>
                <div>余計に選んだ: <b className="text-red-300">{fp}</b></div>
                <div>選び忘れ: <b className="text-yellow-300">{fn}</b></div>
                <div>F1スコア: <b className="text-chipGold">{(f1 * 100).toFixed(0)}%</b></div>
              </div>
              <div className="mt-3 text-xs text-white/70 space-y-1">
                <div className="font-bold text-chipGold">📌 このポジションのコツ</div>
                {RANGE_TIPS[position].map((t, i) => (
                  <div key={i}>● {t}</div>
                ))}
              </div>
              <button
                className="btn-secondary w-full mt-3"
                onClick={() => { setSelected(new Set()); setSubmitted(false); }}
              >
                もう一度
              </button>
            </div>
          )}
        </div>
      )}

      <div className="mt-6 text-center">
        <button className="btn-secondary" onClick={() => go('home')}>
          ホームへ
        </button>
      </div>

      <div className="hidden">{allHandsList.length}</div>
    </div>
  );
}

function Grid({
  position, selected, submitted, mode, onToggle,
}: {
  position: Position;
  selected: Set<string>;
  submitted: boolean;
  mode: Mode2;
  onToggle: (h: string) => void;
}) {
  const correctSet = OPEN_RANGES[position];
  return (
    <div className="grid grid-cols-13 gap-[2px] text-[10px] sm:text-xs"
      style={{ gridTemplateColumns: 'repeat(13, minmax(0, 1fr))' }}
    >
      {Array.from({ length: 13 }).flatMap((_, r) =>
        Array.from({ length: 13 }).map((_, c) => {
          const h = gridToHand(r, c);
          const inRange = correctSet.has(h);
          const isSelected = selected.has(h);

          let bg = 'bg-white/5 border-white/10';
          let fg = 'text-white/70';

          if (mode === 'view') {
            if (inRange) {
              bg = 'bg-chipGold/80 border-chipGold';
              fg = 'text-feltDark font-bold';
            }
          } else {
            // quiz
            if (submitted) {
              if (inRange && isSelected) { bg = 'bg-emerald-400/50 border-emerald-300'; fg = 'text-white font-bold'; }
              else if (!inRange && isSelected) { bg = 'bg-red-400/50 border-red-300'; fg = 'text-white font-bold'; }
              else if (inRange && !isSelected) { bg = 'bg-yellow-300/30 border-yellow-200'; fg = 'text-yellow-50'; }
            } else if (isSelected) {
              bg = 'bg-chipGold/70 border-chipGold';
              fg = 'text-feltDark font-bold';
            }
          }

          // 対角=ペア、上三角=suited（s）、下三角=offsuit（o）
          const isPair = r === c;
          const ring = isPair ? 'ring-1 ring-white/20' : '';

          return (
            <button
              key={`${r}-${c}`}
              className={`aspect-square ${bg} ${fg} ${ring} border rounded-sm flex items-center justify-center
                          ${mode === 'quiz' && !submitted ? 'cursor-pointer hover:brightness-110' : 'cursor-default'}`}
              onClick={() => onToggle(h)}
              title={h}
              disabled={mode === 'view' || submitted}
            >
              {h}
            </button>
          );
        })
      )}
    </div>
  );
}
