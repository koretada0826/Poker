import { useEffect, useState } from 'react';
import Header from './components/Header';
import Glossary from './components/Glossary';
import HomeScreen from './screens/HomeScreen';
import TutorialScreen from './screens/TutorialScreen';
import HandBookScreen from './screens/HandBookScreen';
import LessonScreen from './screens/LessonScreen';
import PracticeScreen from './screens/PracticeScreen';
import SimulationScreen from './screens/SimulationScreen';
import MultiSimScreen from './screens/MultiSimScreen';
import ExamScreen from './screens/ExamScreen';
import MasteryPathScreen from './screens/MasteryPathScreen';
import MathLabScreen from './screens/MathLabScreen';
import RangeTrainerScreen from './screens/RangeTrainerScreen';
import AdvancedPracticeScreen from './screens/AdvancedPracticeScreen';
import BossExamScreen from './screens/BossExamScreen';
import BankrollScreen from './screens/BankrollScreen';
import MentalScreen from './screens/MentalScreen';
import ProgressScreen from './screens/ProgressScreen';
import { computeTitle, initialStats, loadStats, resetStats, saveStats, tickDaily, markPlayed } from './lib/storage';
import { useTimer } from './lib/useTimer';
import type { Mode, PlayerStats } from './types';

export default function App() {
  const [mode, setMode] = useState<Mode>('home');
  const [stats, setStatsRaw] = useState<PlayerStats>(() => tickDaily(loadStats()));
  const [glossaryOpen, setGlossaryOpen] = useState(false);
  const timer = useTimer();

  const setStats = (s: PlayerStats) => {
    const ticked = tickDaily(s);
    const played = markPlayed(ticked);
    const computed = computeTitle(played);
    const next = { ...played, title: computed };
    setStatsRaw(next);
    saveStats(next);
  };

  useEffect(() => {
    saveStats(stats);
  }, [stats]);

  const onReset = () => {
    if (!confirm('進捗をリセットしますか？')) return;
    resetStats();
    setStatsRaw({ ...initialStats });
  };

  const screen = (() => {
    switch (mode) {
      case 'home':
        return <HomeScreen stats={stats} go={setMode} onReset={onReset} timer={timer} />;
      case 'mastery-path':
        return <MasteryPathScreen stats={stats} go={setMode} />;
      case 'tutorial':
        return <TutorialScreen stats={stats} setStats={setStats} go={setMode} />;
      case 'hand-book':
        return <HandBookScreen go={setMode} />;
      case 'lesson-cards':
        return <LessonScreen lessonId="cards-basics" stats={stats} setStats={setStats} go={setMode} modeId="lesson-cards" />;
      case 'lesson-hands':
        return <LessonScreen lessonId="hand-rankings" stats={stats} setStats={setStats} go={setMode} modeId="lesson-hands" />;
      case 'lesson-flow':
        return <LessonScreen lessonId="holdem-flow" stats={stats} setStats={setStats} go={setMode} modeId="lesson-flow" />;
      case 'lesson-action':
        return <LessonScreen lessonId="actions" stats={stats} setStats={setStats} go={setMode} modeId="lesson-action" />;
      case 'lesson-strategy':
        return <LessonScreen lessonId="strategy" stats={stats} setStats={setStats} go={setMode} modeId="lesson-strategy" />;
      case 'lesson-manners':
        return <LessonScreen lessonId="manners" stats={stats} setStats={setStats} go={setMode} modeId="lesson-manners" />;
      // 上級レッスン
      case 'lesson-math':
        return <LessonScreen lessonId="math-foundations" stats={stats} setStats={setStats} go={setMode} modeId="lesson-math" />;
      case 'lesson-range':
        return <LessonScreen lessonId="range-thinking" stats={stats} setStats={setStats} go={setMode} modeId="lesson-range" />;
      case 'lesson-board':
        return <LessonScreen lessonId="board-reading" stats={stats} setStats={setStats} go={setMode} modeId="lesson-board" />;
      case 'lesson-sizing':
        return <LessonScreen lessonId="bet-sizing" stats={stats} setStats={setStats} go={setMode} modeId="lesson-sizing" />;
      case 'lesson-bluff':
        return <LessonScreen lessonId="bluff-value" stats={stats} setStats={setStats} go={setMode} modeId="lesson-bluff" />;
      case 'lesson-gto':
        return <LessonScreen lessonId="gto-exploit" stats={stats} setStats={setStats} go={setMode} modeId="lesson-gto" />;

      // 初心者向け練習
      case 'practice-hand':
        return <PracticeScreen kind={{ quizType: 'hand-judge', group: 'hand' }} title="役判定トレーニング" count={10} stats={stats} setStats={setStats} go={setMode} />;
      case 'practice-draw':
        return <PracticeScreen kind={{ quizType: 'hand-draw', group: 'hand' }} title="ドロー読み" count={6} stats={stats} setStats={setStats} go={setMode} />;
      case 'practice-best5':
        return <PracticeScreen kind={{ quizType: 'best5', group: 'hand' }} title="最強5枚クイズ" count={5} stats={stats} setStats={setStats} go={setMode} />;
      case 'practice-action':
        return <PracticeScreen kind={{ quizType: 'action', group: 'action' }} title="アクション練習" count={10} stats={stats} setStats={setStats} go={setMode} />;
      case 'practice-preflop':
        return <PracticeScreen kind={{ quizType: 'preflop', group: 'strategy' }} title="プリフロップ練習" count={10} stats={stats} setStats={setStats} go={setMode} />;
      case 'practice-flop':
        return <PracticeScreen kind={{ quizType: 'flop-judge', group: 'strategy' }} title="フロップ後判断練習" count={8} stats={stats} setStats={setStats} go={setMode} />;

      // 上級練習
      case 'math-lab':
        return <MathLabScreen go={setMode} />;
      case 'range-trainer':
        return <RangeTrainerScreen go={setMode} />;
      case 'practice-pot-odds':
        return <AdvancedPracticeScreen quizType="pot-odds" group="math" title="ポットオッズ練習" count={8} stats={stats} setStats={setStats} go={setMode} />;
      case 'practice-outs':
        return <AdvancedPracticeScreen quizType="outs" group="math" title="アウツ→%練習" count={8} stats={stats} setStats={setStats} go={setMode} />;
      case 'practice-ev':
        return <AdvancedPracticeScreen quizType="ev" group="math" title="EV判断練習" count={8} stats={stats} setStats={setStats} go={setMode} />;
      case 'practice-equity':
        return <AdvancedPracticeScreen quizType="equity" group="range" title="マッチアップエクイティ" count={8} stats={stats} setStats={setStats} go={setMode} />;
      case 'practice-range':
        return <AdvancedPracticeScreen quizType="range-position" group="range" title="ポジション別レンジクイズ" count={8} stats={stats} setStats={setStats} go={setMode} />;
      case 'practice-board':
        return <AdvancedPracticeScreen quizType="board-texture" group="board" title="ボードテクスチャ分類" count={8} stats={stats} setStats={setStats} go={setMode} />;
      case 'practice-sizing':
        return <AdvancedPracticeScreen quizType="bet-sizing" group="sizing" title="ベットサイジング判断" count={6} stats={stats} setStats={setStats} go={setMode} />;
      case 'practice-bluff':
        return <AdvancedPracticeScreen quizType="bluff-value" group="bluff" title="ブラフ／バリュー判断" count={6} stats={stats} setStats={setStats} go={setMode} />;
      case 'practice-spr-mdf':
        return <AdvancedPracticeScreen quizType="spr-mdf" group="math" title="SPR/MDF/α 計算" count={8} stats={stats} setStats={setStats} go={setMode} />;

      case 'simulation':
        return <SimulationScreen stats={stats} setStats={setStats} go={setMode} hands={10} />;
      case 'simulation-4max':
        return <MultiSimScreen stats={stats} setStats={setStats} go={setMode} hands={8} />;
      case 'exam':
        return <ExamScreen stats={stats} setStats={setStats} go={setMode} />;
      case 'boss-exam':
        return <BossExamScreen stats={stats} setStats={setStats} go={setMode} />;

      // プロ志望ルート
      case 'bankroll':
        return <BankrollScreen stats={stats} setStats={setStats} go={setMode} />;
      case 'mental':
        return <MentalScreen stats={stats} setStats={setStats} go={setMode} />;
      case 'progress':
        return <ProgressScreen stats={stats} go={setMode} />;

      default:
        return <HomeScreen stats={stats} go={setMode} onReset={onReset} timer={timer} />;
    }
  })();

  return (
    <div className="min-h-screen flex flex-col">
      <Header
        stats={stats}
        onHome={mode !== 'home' ? () => setMode('home') : undefined}
        onOpenGlossary={() => setGlossaryOpen(true)}
        title={mode === 'home' ? undefined : titleFor(mode)}
        timerText={timer.running ? timer.fmt : undefined}
      />
      <main className="flex-1">{screen}</main>
      <footer className="text-center text-[11px] text-white/30 py-3">
        for amusement & study only — not gambling.
      </footer>
      <Glossary open={glossaryOpen} onClose={() => setGlossaryOpen(false)} />
    </div>
  );
}

function titleFor(m: Mode): string {
  return ({
    home: 'ホーム',
    'mastery-path': '🗺️ 最強ルート',
    tutorial: '入門ツアー',
    'hand-book': '役図鑑',
    'lesson-cards': 'トランプ超基礎',
    'lesson-hands': 'ポーカーの役',
    'lesson-flow': 'ホールデムの流れ',
    'lesson-action': 'アクション',
    'lesson-strategy': '初心者戦略',
    'lesson-manners': 'マナー',
    'lesson-math': 'ポーカー数学',
    'lesson-range': 'レンジ思考',
    'lesson-board': 'ボードリーディング',
    'lesson-sizing': 'ベットサイジング',
    'lesson-bluff': 'ブラフ／バリュー',
    'lesson-gto': 'GTO入門',
    'practice-hand': '役判定トレ',
    'practice-draw': 'ドロー読み',
    'practice-best5': '最強5枚',
    'practice-action': 'アクション練習',
    'practice-preflop': 'プリフロップ練習',
    'practice-flop': 'フロップ後判断',
    'math-lab': '数学ラボ',
    'range-trainer': 'レンジトレーナー',
    'practice-pot-odds': 'ポットオッズ練習',
    'practice-outs': 'アウツ練習',
    'practice-ev': 'EV判断',
    'practice-equity': 'エクイティ',
    'practice-range': 'レンジクイズ',
    'practice-board': 'ボードテクスチャ',
    'practice-sizing': 'サイジング',
    'practice-bluff': 'ブラフ/バリュー',
    'practice-spr-mdf': 'SPR/MDF',
    simulation: '実戦シミュレーション',
    'simulation-4max': '🎲 4人卓ポーカー',
    exam: '初心者卒業試験',
    'boss-exam': '🔥 ボス試験',
    bankroll: '💰 バンクロール管理',
    mental: '🧘 ティルト管理',
    progress: '📊 進捗・スキルツリー',
    result: '結果',
    review: '復習',
  } as Record<Mode, string>)[m];
}
