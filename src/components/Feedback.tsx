import type { Quiz } from '../types';

interface Props {
  quiz: Quiz;
  correct: boolean;
}

export default function Feedback({ quiz, correct }: Props) {
  const e = quiz.explanation;
  return (
    <div
      className={`mt-4 p-4 rounded-2xl border-2 ${
        correct
          ? 'border-emerald-400 bg-emerald-500/10'
          : 'border-red-400 bg-red-500/10'
      }`}
    >
      <div className="text-2xl font-bold mb-2">
        {correct ? '⭕ 正解！' : '❌ 不正解'}
      </div>
      <div className="space-y-2 text-sm leading-relaxed">
        <p>
          <span className="font-bold text-chipGold">結論：</span>
          {e.conclusion}
        </p>
        <p>
          <span className="font-bold text-chipGold">理由：</span>
          {e.reason}
        </p>
        {e.analogy && (
          <p>
            <span className="font-bold text-chipGold">例え：</span>
            {e.analogy}
          </p>
        )}
        {e.realTable && (
          <p>
            <span className="font-bold text-chipGold">実卓では：</span>
            {e.realTable}
          </p>
        )}
        {e.nextPoint && (
          <p>
            <span className="font-bold text-chipGold">次に見るポイント：</span>
            {e.nextPoint}
          </p>
        )}
      </div>
    </div>
  );
}
