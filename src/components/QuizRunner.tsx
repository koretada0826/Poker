import { useState } from 'react';
import type { Quiz } from '../types';
import CardRow from './CardRow';
import Feedback from './Feedback';

interface Props {
  quiz: Quiz;
  onAnswer: (correct: boolean) => void;
  onNext: () => void;
  index?: number;
  total?: number;
}

function arraysEqualSet(a: number[], b: number[]) {
  if (a.length !== b.length) return false;
  const A = [...a].sort();
  const B = [...b].sort();
  return A.every((v, i) => v === B[i]);
}

const HAND_THINK_GUIDE = [
  '①「同じ数字」を探す → ペア / ツーペア / スリーカード',
  '②「同じマーク」を5枚探す → フラッシュ',
  '③「数字が連続」5枚を探す → ストレート',
  '④3+2の形 → フルハウス、4枚同数字 → フォーカード',
  '⑤どれも当てはまらない → ハイカード（役なし）',
];

export default function QuizRunner({ quiz, onAnswer, onNext, index, total }: Props) {
  const [selected, setSelected] = useState<number[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const multi = quiz.correctAnswers.length > 1;

  const toggle = (i: number) => {
    if (submitted) return;
    if (multi) {
      setSelected(s => (s.includes(i) ? s.filter(x => x !== i) : [...s, i]));
    } else {
      setSelected([i]);
    }
  };

  const submit = () => {
    if (selected.length === 0 || submitted) return;
    const correct = arraysEqualSet(selected, quiz.correctAnswers);
    setSubmitted(true);
    onAnswer(correct);
  };

  const correct = submitted && arraysEqualSet(selected, quiz.correctAnswers);

  // ラベル決定
  const isCompare = quiz.type === 'hand-compare';
  const isBest5 = quiz.type === 'best5';
  const labelA = isCompare ? 'プレイヤーA' : isBest5 ? 'あなたの手札（2枚）' : '';
  const labelB = isCompare ? 'プレイヤーB' : isBest5 ? '場のカード（5枚）' : '';

  return (
    <div className="panel">
      {(index !== undefined && total !== undefined) && (
        <div className="text-xs text-white/60 mb-2">
          問題 {index + 1} / {total}
        </div>
      )}
      <div className="text-base whitespace-pre-line mb-4 leading-relaxed">
        {quiz.question}
      </div>

      {quiz.cards2 ? (
        isBest5 ? (
          <div className="space-y-3 mb-4">
            <div className="text-center">
              <div className="text-xs mb-1 text-white/60">{labelA}</div>
              <CardRow cards={quiz.cards!} size="lg" />
            </div>
            <div className="text-center">
              <div className="text-xs mb-1 text-white/60">{labelB}</div>
              <CardRow cards={quiz.cards2} size="sm" />
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="text-center">
              <div className="text-xs mb-1 text-white/60">{labelA}</div>
              <CardRow cards={quiz.cards!} size="sm" />
            </div>
            <div className="text-center">
              <div className="text-xs mb-1 text-white/60">{labelB}</div>
              <CardRow cards={quiz.cards2} size="sm" />
            </div>
          </div>
        )
      ) : quiz.cards && quiz.cards.length > 0 ? (
        <div className="mb-4">
          <CardRow cards={quiz.cards} size={quiz.cards.length <= 2 ? 'xl' : 'lg'} />
        </div>
      ) : null}

      <div className="space-y-2 mb-4">
        {quiz.options.map((opt, i) => {
          const isSelected = selected.includes(i);
          let cls = 'opt-btn';
          if (submitted) {
            if (quiz.correctAnswers.includes(i)) cls += ' correct';
            else if (isSelected) cls += ' wrong';
          } else if (isSelected) cls += ' selected';
          return (
            <button key={i} className={cls} onClick={() => toggle(i)}>
              <span className="font-bold mr-2">{i + 1}.</span>
              {opt}
            </button>
          );
        })}
      </div>

      {!submitted ? (
        <button
          className="btn-primary w-full"
          disabled={selected.length === 0}
          onClick={submit}
        >
          回答する{multi ? '（複数選択）' : ''}
        </button>
      ) : (
        <>
          <Feedback quiz={quiz} correct={correct} />
          {!correct && quiz.type === 'hand-judge' && (
            <div className="mt-3 p-3 rounded-xl bg-blue-500/15 border border-blue-400/40 text-xs">
              <div className="font-bold text-blue-200 mb-1">🧭 役を見抜く思考手順</div>
              <ul className="space-y-1">
                {HAND_THINK_GUIDE.map((g, i) => (
                  <li key={i}>{g}</li>
                ))}
              </ul>
            </div>
          )}
          <button className="btn-primary w-full mt-3" onClick={onNext}>
            次へ →
          </button>
        </>
      )}
    </div>
  );
}
