import type { Mode, PlayerStats } from '../types';

interface Props {
  stats: PlayerStats;
  go: (m: Mode) => void;
}

interface Stage {
  level: number;
  emoji: string;
  title: string;
  desc: string;
  prereq: (s: PlayerStats) => boolean;
  steps: { mode: Mode; title: string }[];
  unlockNote?: string;
}

const acc = (n: number, t: number) => (t === 0 ? 0 : n / t);

const STAGES: Stage[] = [
  {
    level: 1, emoji: '🎴', title: 'Stage 1：ルール基礎', desc: 'カード・役・流れ・アクションを完全習得（実卓で困らない最低ライン）。',
    prereq: () => true,
    steps: [
      { mode: 'tutorial', title: '入門ツアー' },
      { mode: 'lesson-cards', title: 'トランプ超基礎' },
      { mode: 'hand-book', title: '役図鑑' },
      { mode: 'lesson-hands', title: 'ポーカーの役' },
      { mode: 'practice-hand', title: '役判定トレ' },
      { mode: 'lesson-flow', title: 'ホールデムの流れ' },
      { mode: 'lesson-action', title: 'アクション' },
      { mode: 'practice-action', title: 'アクション練習' },
    ],
  },
  {
    level: 2, emoji: '🪙', title: 'Stage 2：プリフロップ簡易判断', desc: '初手ハンド選択。最初の8割。',
    prereq: () => true,
    steps: [
      { mode: 'lesson-strategy', title: '初心者戦略' },
      { mode: 'practice-preflop', title: 'プリフロップ練習' },
    ],
  },
  {
    level: 3, emoji: '🧩', title: 'Stage 3：フロップ判断＆実戦', desc: '危険な場/有利な場を見抜き、CPUと打つ。',
    prereq: () => true,
    steps: [
      { mode: 'practice-flop', title: 'フロップ後判断' },
      { mode: 'practice-draw', title: 'ドロー読み' },
      { mode: 'practice-best5', title: '最強5枚クイズ' },
      { mode: 'simulation', title: '実戦シミュ' },
    ],
  },
  {
    level: 4, emoji: '🙇', title: 'Stage 4：マナー＆初心者卒業試験', desc: 'ここまで合格すれば「アミューズメントデビューOK」。',
    prereq: () => true,
    steps: [
      { mode: 'lesson-manners', title: 'マナー' },
      { mode: 'exam', title: '初心者卒業試験' },
    ],
  },

  // 上級ルート
  {
    level: 5, emoji: '📐', title: 'Stage 5：ポーカー数学', desc: 'ポットオッズ・アウツ・EV。「コール vs フォールド」の理論武装。',
    prereq: s => s.handQuizTotal >= 5,
    unlockNote: '基礎クイズを5問以上解くと開放。',
    steps: [
      { mode: 'lesson-math', title: '数学基礎レッスン' },
      { mode: 'practice-pot-odds', title: 'ポットオッズ練習' },
      { mode: 'practice-outs', title: 'アウツ練習' },
      { mode: 'practice-ev', title: 'EV判断練習' },
      { mode: 'math-lab', title: '数学ラボ（電卓）' },
    ],
  },
  {
    level: 6, emoji: '🧠', title: 'Stage 6：レンジ思考', desc: '「ハンド」ではなく「ポジション×レンジ」で考える。',
    prereq: s => acc(s.mathCorrect, s.mathTotal) >= 0.6 && s.mathTotal >= 10,
    unlockNote: '数学を60%以上正答（10問以上）で開放。',
    steps: [
      { mode: 'lesson-range', title: 'レンジ思考レッスン' },
      { mode: 'range-trainer', title: 'レンジトレーナー（13×13）' },
      { mode: 'practice-range', title: 'ポジション別クイズ' },
      { mode: 'practice-equity', title: 'マッチアップ・エクイティ' },
    ],
  },
  {
    level: 7, emoji: '🃏', title: 'Stage 7：ボードリーディング', desc: 'フロップのテクスチャから両者のレンジ優位を読む。',
    prereq: s => acc(s.rangeCorrect, s.rangeTotal) >= 0.6 && s.rangeTotal >= 10,
    unlockNote: 'レンジを60%以上正答（10問以上）で開放。',
    steps: [
      { mode: 'lesson-board', title: 'ボードリーディング' },
      { mode: 'practice-board', title: 'テクスチャ分類クイズ' },
    ],
  },
  {
    level: 8, emoji: '⚖️', title: 'Stage 8：ベットサイジング＆ブラフ／バリュー', desc: 'サイズの意味と、攻守の比率設計。',
    prereq: s => acc(s.boardCorrect, s.boardTotal) >= 0.6 && s.boardTotal >= 8,
    unlockNote: 'ボードを60%以上正答（8問以上）で開放。',
    steps: [
      { mode: 'lesson-sizing', title: 'サイジングレッスン' },
      { mode: 'practice-sizing', title: 'サイジングクイズ' },
      { mode: 'lesson-bluff', title: 'ブラフ／バリューレッスン' },
      { mode: 'practice-bluff', title: 'ブラフ／バリュークイズ' },
    ],
  },
  {
    level: 9, emoji: '👑', title: 'Stage 9：GTO入門＆最強ボス試験', desc: 'MDF、SPR、エクスプロイト。最後にボス試験で総合判定。',
    prereq: s =>
      acc(s.sizingCorrect, s.sizingTotal) >= 0.6 &&
      acc(s.bluffCorrect, s.bluffTotal) >= 0.6 &&
      s.sizingTotal >= 5 && s.bluffTotal >= 5,
    unlockNote: 'サイジング＆ブラフ各60%以上で開放。',
    steps: [
      { mode: 'lesson-gto', title: 'GTO入門レッスン' },
      { mode: 'practice-spr-mdf', title: 'SPR/MDFクイズ' },
      { mode: 'boss-exam', title: '🔥 ボス試験' },
    ],
  },
  {
    level: 10, emoji: '🧘', title: 'Stage 10：ティルト管理（メンタル）', desc: '判断と感情を切り離す訓練。専業の最重要スキル。',
    prereq: s => s.bossExamPassed || acc(s.bluffCorrect, s.bluffTotal) >= 0.6,
    unlockNote: 'ボス試験突破 or ブラフ60%以上で開放。',
    steps: [
      { mode: 'mental', title: '🧘 ティルト管理トレーニング' },
    ],
  },
  {
    level: 11, emoji: '💰', title: 'Stage 11：バンクロール管理', desc: '上手くても資金管理が下手なら破産する。数字でリスクを見える化。',
    prereq: s => s.mentalTotal >= 3 || s.bossExamPassed,
    unlockNote: 'メンタル3問以上 or ボス試験突破で開放。',
    steps: [
      { mode: 'bankroll', title: '💰 バンクロールシミュレーター' },
    ],
  },
  {
    level: 12, emoji: '🏆', title: 'Stage 12：プロ思考の完成', desc: '進捗を見て、自分の弱点を自分で克服できる状態に。',
    prereq: s => s.bankrollUsed && s.mentalTotal >= 5 && s.bossExamPassed,
    unlockNote: 'ボス試験＋メンタル5問＋バンクロール設定で開放。',
    steps: [
      { mode: 'progress', title: '📊 進捗・スキルツリーで弱点克服' },
    ],
  },
];

export default function MasteryPathScreen({ stats, go }: Props) {
  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <div className="text-center mb-6">
        <h1 className="text-3xl font-black">
          🗺️ <span className="text-chipGold">プロまでのロードマップ</span>
        </h1>
        <p className="text-xs text-white/60 mt-2">
          トランプ未経験 → ルール → 数学 → レンジ → ボード → サイジング → GTO → メンタル → バンクロール → プロ思考。<br />
          各ステージは下の段階の理解度で自動開放。順番に進めば論理的にレベルが積み上がる。
        </p>
        <p className="text-[11px] text-white/50 mt-2">
          ✓ = 一度でも完了したステップ。▶ = まだ未着手 or 途中。完了するとチェックが付き、自動で次のステップへ進めます。
        </p>
      </div>

      <div className="space-y-4">
        {STAGES.map((st, i) => {
          const unlocked = st.prereq(stats);
          const completed = st.steps.every(s => stats.completedLessons.includes(s.mode));
          return (
            <div
              key={i}
              className={`panel border-2 ${
                completed
                  ? 'border-emerald-400/60 bg-emerald-500/5'
                  : unlocked
                  ? 'border-chipGold/40'
                  : 'border-white/10 opacity-60'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="text-3xl">{st.emoji}</div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="badge bg-chipGold text-feltDark">Lv.{st.level}</span>
                    <span className="font-bold">{st.title}</span>
                    {completed && <span className="badge bg-emerald-400 text-feltDark">✓ 完了</span>}
                    {!unlocked && <span className="badge bg-white/10">🔒 未開放</span>}
                  </div>
                  <p className="text-xs text-white/70 mt-1">{st.desc}</p>
                  {!unlocked && st.unlockNote && (
                    <p className="text-[11px] text-yellow-200 mt-1">🔓 {st.unlockNote}</p>
                  )}
                </div>
              </div>
              {unlocked && (
                <div className="mt-3 grid sm:grid-cols-2 gap-2">
                  {st.steps.map(s => {
                    const done = stats.completedLessons.includes(s.mode);
                    return (
                      <button
                        key={s.mode}
                        className={`opt-btn !p-2 !min-h-0 text-sm ${done ? 'border-emerald-400/40 bg-emerald-500/10' : ''}`}
                        onClick={() => go(s.mode)}
                      >
                        {done ? '✓ ' : '▶ '}{s.title}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-8 text-center">
        <button className="btn-secondary" onClick={() => go('home')}>
          ホームへ
        </button>
      </div>

      <div className="mt-4 text-[11px] text-white/40 text-center">
        ※ 「最強」とは「論理的にプラスEVな判断を継続できる状態」のことです。<br />
        ポーカーは長期ゲーム。短期的に負けても、+EVを積み重ねれば長期で勝てます。
      </div>
    </div>
  );
}
