import { skillScores, weakCategories, weakAdvice } from '../lib/storage';
import type { Mode, PlayerStats } from '../types';

interface Props {
  stats: PlayerStats;
  go: (m: Mode) => void;
}

const SKILL_TO_MODE: Record<string, Mode> = {
  rule: 'practice-action',
  hand: 'practice-hand',
  preflop: 'practice-preflop',
  ev: 'practice-ev',
  range: 'practice-range',
  board: 'practice-board',
  sizing: 'practice-sizing',
  bluff: 'practice-bluff',
  manners: 'lesson-manners',
  mental: 'mental',
  bankroll: 'bankroll',
};

export default function ProgressScreen({ stats, go }: Props) {
  const skills = skillScores(stats);
  const weak = weakCategories(stats);
  const advice = weakAdvice(stats);

  const totalAnswered =
    stats.handQuizTotal + stats.actionTotal + stats.strategyTotal +
    stats.mannersTotal + stats.mathTotal + stats.rangeTotal +
    stats.boardTotal + stats.sizingTotal + stats.bluffTotal +
    stats.mentalTotal;

  const totalCorrect =
    stats.handQuizCorrect + stats.actionCorrect + stats.strategyCorrect +
    stats.mannersCorrect + stats.mathCorrect + stats.rangeCorrect +
    stats.boardCorrect + stats.sizingCorrect + stats.bluffCorrect +
    stats.mentalCorrect;

  const overall = totalAnswered === 0 ? 0 : Math.round((totalCorrect / totalAnswered) * 100);

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <div className="text-center mb-6">
        <h1 className="text-2xl font-black">📊 学習進捗・スキルツリー</h1>
        <p className="text-xs text-white/60 mt-1">あなたの「判断力」を分野ごとに見える化。</p>
      </div>

      <div className="panel mb-4">
        <div className="grid sm:grid-cols-3 gap-3">
          <div>
            <div className="text-xs text-white/60">称号</div>
            <div className="text-lg font-bold text-chipGold">{stats.title}</div>
          </div>
          <div>
            <div className="text-xs text-white/60">レベル / 経験値</div>
            <div className="text-lg font-bold">Lv.{stats.level} / {stats.exp} EXP</div>
          </div>
          <div>
            <div className="text-xs text-white/60">継続日数</div>
            <div className="text-lg font-bold">🔥 {stats.streakDays} 日</div>
          </div>
        </div>
        <div className="mt-3">
          <div className="text-xs text-white/60">総合正答率</div>
          <div className="flex items-center gap-3 mt-1">
            <div className="flex-1 h-3 bg-white/10 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-chipGold to-emerald-400" style={{ width: `${overall}%` }} />
            </div>
            <div className="text-sm font-bold w-14 text-right">{overall}%</div>
          </div>
          <div className="text-[11px] text-white/50 mt-1">
            総回答 {totalAnswered} 問（うち正解 {totalCorrect}）
          </div>
        </div>
      </div>

      <div className="panel mb-4">
        <div className="text-sm font-bold mb-3">🌳 スキルツリー</div>
        <div className="space-y-2">
          {skills.map(sk => (
            <button
              key={sk.key}
              onClick={() => SKILL_TO_MODE[sk.key] && go(SKILL_TO_MODE[sk.key])}
              className="w-full text-left p-2 rounded-lg hover:bg-white/5 transition"
            >
              <div className="flex items-center gap-3">
                <div className="w-32 text-sm">{sk.label}</div>
                <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${sk.pct >= 80 ? 'bg-emerald-400' : sk.pct >= 60 ? 'bg-chipGold' : sk.pct >= 30 ? 'bg-orange-400' : 'bg-red-400/70'}`}
                    style={{ width: `${sk.pct}%` }}
                  />
                </div>
                <div className="text-xs w-20 text-right">
                  Lv.{sk.level} <span className="text-white/40">({sk.done}/{sk.total})</span>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="panel mb-4 border-2 border-yellow-400/40 bg-yellow-500/5">
        <div className="text-sm font-bold mb-2">🎯 苦手分野ピックアップ</div>
        <p className="text-sm text-yellow-200">{advice}</p>
        {weak.length > 0 && (
          <div className="mt-3 grid sm:grid-cols-3 gap-2">
            {weak.map(w => (
              <button
                key={w.key}
                className="opt-btn !p-2 !min-h-0 text-sm"
                onClick={() => SKILL_TO_MODE[w.key] && go(SKILL_TO_MODE[w.key])}
              >
                ▶ {w.label}を練習（{w.pct}%）
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="panel mb-4">
        <div className="text-sm font-bold mb-2">🧘 メンタル履歴</div>
        {stats.mentalLog.length === 0 ? (
          <p className="text-xs text-white/60">まだ記録なし。「ティルト管理トレーニング」を試してみよう。</p>
        ) : (
          <div className="text-xs space-y-1 max-h-40 overflow-auto">
            {stats.mentalLog.slice(-12).reverse().map((e, i) => (
              <div key={i} className="flex justify-between gap-2">
                <span className="text-white/60">{e.date}</span>
                <span>{e.scenarioId}</span>
                <span className={e.correct ? 'text-emerald-300' : 'text-red-300'}>
                  {e.correct ? '✅ 正解' : '❌ 改善余地'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <button className="btn-secondary" onClick={() => go('mastery-path')}>🗺️ ロードマップ</button>
        <button className="btn-primary" onClick={() => go('home')}>ホーム</button>
      </div>

      <div className="mt-6 text-[11px] text-white/40 text-center leading-relaxed">
        ポーカーは「1回の結果」ではなく、「正しい判断の積み重ね」で強くなります。<br />
        弱点が見えるのは成長のサイン。ひとつずつ潰していきましょう。
      </div>
    </div>
  );
}
