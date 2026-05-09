import { nextInRoadmap, nextStepTitle } from '../lib/roadmap';
import type { Mode } from '../types';

interface Props {
  current: Mode;
  go: (m: Mode) => void;
  // 「もう一度」を押した時の動作。指定がなければ非表示
  retry?: () => void;
  retryLabel?: string;
  // 戻り先（デフォルトは home）
  homeMode?: Mode;
}

export default function NextStepButtons({
  current, go, retry, retryLabel = 'もう一度', homeMode = 'home',
}: Props) {
  const next = nextInRoadmap(current);
  const nextTitle = nextStepTitle(current);

  return (
    <div className="grid grid-cols-2 gap-2">
      {retry && (
        <button className="btn-secondary" onClick={retry}>
          {retryLabel}
        </button>
      )}
      {!retry && (
        <button className="btn-secondary" onClick={() => go(homeMode)}>
          ホームへ
        </button>
      )}
      {next ? (
        <button className="btn-primary" onClick={() => go(next)}>
          次のステップ → {nextTitle && <span className="text-[10px] opacity-80 ml-1">{nextTitle}</span>}
        </button>
      ) : (
        <button className="btn-primary" onClick={() => go(homeMode)}>
          🎉 全ステージ完了！ホームへ
        </button>
      )}
    </div>
  );
}
