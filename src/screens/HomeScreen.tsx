import { useState } from 'react';
import CheatSheet from '../components/CheatSheet';
import { skillScores, weakAdvice } from '../lib/storage';
import type { Mode, PlayerStats } from '../types';

interface Props {
  stats: PlayerStats;
  go: (m: Mode) => void;
  onReset: () => void;
  timer: {
    fmt: string;
    running: boolean;
    start: () => void;
    pause: () => void;
    reset: () => void;
    remaining: number;
  };
}

interface Mission {
  key: keyof PlayerStats['dailyMissions'];
  title: string;
  goal: number;
  go: Mode;
}

const TODAY_MISSIONS: Mission[] = [
  { key: 'evDone',      title: 'EV判断',         goal: 5, go: 'practice-ev' },
  { key: 'potOddsDone', title: 'ポットオッズ',   goal: 5, go: 'practice-pot-odds' },
  { key: 'preflopDone', title: 'プリフロップ',   goal: 5, go: 'practice-preflop' },
  { key: 'handDone',    title: '役判定',         goal: 5, go: 'practice-hand' },
  { key: 'mentalDone',  title: 'ティルト管理',   goal: 1, go: 'mental' },
];

export default function HomeScreen({ stats, go, onReset, timer }: Props) {
  const [cheatOpen, setCheatOpen] = useState(false);
  const skills = skillScores(stats);
  const advice = weakAdvice(stats);
  const overallLevelAvg =
    Math.round((skills.reduce((a, b) => a + b.level, 0) / skills.length) * 10) / 10;

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <div className="text-center mb-6">
        <h1 className="text-3xl sm:text-4xl font-black tracking-tight">
          Poker <span className="text-chipGold">EV Academy</span>
        </h1>
        <p className="text-white/70 mt-2 text-sm">
          トランプ未経験 → 期待値で判断できるプロ思考プレイヤーへ。
        </p>
        <p className="text-white/40 mt-1 text-[11px]">
          ※ 学習・確率理解・意思決定トレーニング用です。<br />
          リアルマネー賭博を推奨／助長するものではありません。
        </p>
      </div>

      {/* 称号カード */}
      <div className="panel mb-4 border-2 border-chipGold/40 bg-gradient-to-r from-chipGold/10 to-emerald-500/5">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <div className="text-xs text-white/60">あなたのランク</div>
            <div className="text-xl font-black text-chipGold">{stats.title}</div>
          </div>
          <div className="text-right text-xs text-white/80">
            <div>Lv.{stats.level} / {stats.exp} EXP</div>
            <div>総合レベル <span className="text-chipGold font-bold">{overallLevelAvg}</span> / 10</div>
            <div>🔥 継続 {stats.streakDays} 日</div>
          </div>
        </div>
      </div>

      {/* 苦手分野アドバイス */}
      <div className="panel mb-4 border border-yellow-400/30 bg-yellow-500/5">
        <div className="text-xs text-yellow-200">🎯 今日のフォーカス</div>
        <p className="text-sm mt-1">{advice}</p>
      </div>

      {/* デイリーミッション */}
      <div className="panel mb-4">
        <div className="flex items-center justify-between mb-2">
          <div className="text-sm font-bold">📅 今日のミッション</div>
          <div className="text-[11px] text-white/50">{stats.dailyMissions.date || '今日'}</div>
        </div>
        <div className="grid sm:grid-cols-2 gap-2">
          {TODAY_MISSIONS.map(m => {
            const done = stats.dailyMissions[m.key] as number;
            const pct = Math.min(100, Math.round((done / m.goal) * 100));
            const cleared = done >= m.goal;
            return (
              <button
                key={m.key}
                onClick={() => go(m.go)}
                className={`text-left p-2 rounded-lg border transition ${cleared ? 'border-emerald-400/40 bg-emerald-500/10' : 'border-white/15 hover:bg-white/10'}`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm">{cleared && '✅'} {m.title}</span>
                  <span className="text-[11px] text-white/60">{done}/{m.goal}</span>
                </div>
                <div className="h-1.5 bg-white/10 rounded-full mt-1 overflow-hidden">
                  <div className={`h-full ${cleared ? 'bg-emerald-400' : 'bg-chipGold'}`} style={{ width: `${pct}%` }} />
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* スキルゲージ4本 */}
      <div className="panel mb-4">
        <div className="text-sm font-bold mb-2">📈 主要スキル</div>
        <div className="space-y-2">
          {skills.filter(s => ['ev', 'preflop', 'range', 'mental'].includes(s.key)).map(s => (
            <div key={s.key} className="flex items-center gap-3">
              <div className="w-32 text-xs">{s.label}</div>
              <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                <div
                  className={`h-full ${s.pct >= 80 ? 'bg-emerald-400' : s.pct >= 60 ? 'bg-chipGold' : 'bg-orange-400'}`}
                  style={{ width: `${s.pct}%` }}
                />
              </div>
              <div className="w-12 text-right text-xs">Lv.{s.level}</div>
            </div>
          ))}
        </div>
        <button
          className="mt-3 w-full text-xs text-white/60 underline"
          onClick={() => go('progress')}
        >
          全スキルを見る →
        </button>
      </div>

      {/* メインCTA：ロードマップ */}
      <button
        onClick={() => go('mastery-path')}
        className="w-full mb-4 panel border-2 border-chipGold bg-gradient-to-r from-chipGold/20 to-emerald-500/10 hover:bg-chipGold/30 transition text-left"
      >
        <div className="flex items-center gap-3">
          <div className="text-4xl">🗺️</div>
          <div className="flex-1">
            <div className="font-black text-lg">プロまでのロードマップ</div>
            <div className="text-xs text-white/80">
              ルール → 役 → 数学 → レンジ → ボード → サイジング → GTO → メンタル → バンクロール → プロ思考
            </div>
            <div className="text-[11px] text-chipGold mt-1">
              👉 「次に何をやるか」迷ったらココから順番に
            </div>
          </div>
          <div className="text-chipGold text-2xl">›</div>
        </div>
      </button>

      {/* 主要な4ボタン */}
      <div className="grid sm:grid-cols-2 gap-3 mb-4">
        <button onClick={() => go('tutorial')} className="panel hover:bg-white/10 text-left">
          <div className="text-2xl">👋</div>
          <div className="font-bold mt-1">入門ツアー</div>
          <div className="text-xs text-white/60">トランプ完全未経験から始める</div>
        </button>
        <button onClick={() => go('practice-ev')} className="panel hover:bg-white/10 text-left">
          <div className="text-2xl">📐</div>
          <div className="font-bold mt-1">EV計算ドリル</div>
          <div className="text-xs text-white/60">期待値で判断する筋肉を鍛える</div>
        </button>
        <button onClick={() => go('practice-pot-odds')} className="panel hover:bg-white/10 text-left">
          <div className="text-2xl">🪙</div>
          <div className="font-bold mt-1">ポットオッズ</div>
          <div className="text-xs text-white/60">必要勝率を瞬時に出す</div>
        </button>
        <button onClick={() => go('practice-preflop')} className="panel hover:bg-white/10 text-left">
          <div className="text-2xl">🎯</div>
          <div className="font-bold mt-1">プリフロップ判断</div>
          <div className="text-xs text-white/60">ポジション×レンジで参加判断</div>
        </button>
        <button onClick={() => go('range-trainer')} className="panel hover:bg-white/10 text-left">
          <div className="text-2xl">🧠</div>
          <div className="font-bold mt-1">レンジ判断</div>
          <div className="text-xs text-white/60">13×13グリッドで思考訓練</div>
        </button>
        <button onClick={() => go('simulation')} className="panel hover:bg-white/10 text-left">
          <div className="text-2xl">🃎</div>
          <div className="font-bold mt-1">実戦ハンドシミュ</div>
          <div className="text-xs text-white/60">CPUと対戦＋判断レビュー</div>
        </button>
        <button onClick={() => go('mental')} className="panel hover:bg-white/10 text-left">
          <div className="text-2xl">🧘</div>
          <div className="font-bold mt-1">ティルト管理</div>
          <div className="text-xs text-white/60">感情と判断を切り離す訓練</div>
        </button>
        <button onClick={() => go('bankroll')} className="panel hover:bg-white/10 text-left">
          <div className="text-2xl">💰</div>
          <div className="font-bold mt-1">バンクロール管理</div>
          <div className="text-xs text-white/60">破産率＆レート判断</div>
        </button>
      </div>

      {/* タイマー */}
      <div className="panel mb-4">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div>
            <div className="text-xs text-white/60">⏱ 学習タイマー（任意）</div>
            <div className={`text-2xl font-mono font-bold ${timer.remaining === 0 ? 'text-emerald-300' : 'text-chipGold'}`}>
              {timer.fmt}
            </div>
          </div>
          <div className="flex gap-2">
            {!timer.running ? (
              <button className="btn-primary !py-2 !px-3 text-sm" onClick={timer.start}>▶ 開始</button>
            ) : (
              <button className="btn-secondary !py-2 !px-3 text-sm" onClick={timer.pause}>⏸ 一時停止</button>
            )}
            <button className="btn-secondary !py-2 !px-3 text-sm" onClick={timer.reset}>リセット</button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-4">
        <button className="btn-secondary text-sm" onClick={() => setCheatOpen(true)}>🎓 勝つコツ</button>
        <button className="btn-secondary text-sm" onClick={() => go('hand-book')}>📘 役図鑑</button>
        <button className="btn-secondary text-sm" onClick={() => go('progress')}>📊 進捗</button>
        <button className="btn-secondary text-sm" onClick={onReset}>進捗リセット</button>
      </div>

      <CheatSheet open={cheatOpen} onClose={() => setCheatOpen(false)} />

      <div className="mt-8 text-[11px] text-white/40 text-center leading-relaxed">
        ポーカーは「短期の勝ち負け」ではなく「+EVな判断の積み重ね」のゲーム。<br />
        勝ったか負けたかではなく、正しい判断をしたかで自分を評価しよう。
      </div>
    </div>
  );
}
