# Poker EV Academy — Session State

最終更新: 2026-04-28

## 起動
```
cd /Users/koretada/Desktop/ポーカー
npm run dev    # 開発
npm run build  # 型チェック＋ビルド (検証用)
```

## 現状
- Vite + React 18 + TS + Tailwind の SPA、`Mode` union を state でルーティング。
- ホーム → 🗺️ ロードマップ（Stage 1〜12）→ 各画面、の構成。
- localStorage キー: `poker-3h-stats-v2`（v1から自動引き継ぎ）。
- 学習進捗・称号・スキルレベル・デイリーミッション・継続日数・メンタル履歴・バンクロール設定をすべて保存。

## 主要画面
- `screens/HomeScreen.tsx` — ランク・継続・デイリーミッション・主要スキル・ロードマップCTA
- `screens/MasteryPathScreen.tsx` — Stage 1〜12（最後はメンタル→バンクロール→プロ思考完成）
- `screens/BankrollScreen.tsx` — 破産率近似・推奨レート・専業可否
- `screens/MentalScreen.tsx` — ティルト管理シナリオ5問
- `screens/ProgressScreen.tsx` — 11カテゴリのスキルツリー＋苦手分析

## 称号（13段階）
Poker Baby → Rule Learner → Hand Reader → Action Trainee → Preflop Apprentice → EV Beginner → Odds Student → Range Trainee → EV Hunter → Solid Grinder → Semi-Pro Mind → Pro Candidate → 👑 Pro Mindset

## 次にやる候補
1. 問題データの追加（EV/PotOdds/Outs/Preflop/Hand 各30問〜100問）
2. 実戦ハンドシミュレーターのスコアを「EV/レンジ/ポジション/サイジング/メンタル」軸で多次元化
3. 苦手分野自動出題（ProgressScreen から1クリックで該当練習へ）
4. レベルアップ演出・カードアニメ
5. レンジトレーナーの13×13グリッド表示強化

## 教育方針（変えない）
- 結果ではなく「判断の質」を評価する
- +EVな判断の積み重ねが長期で勝つ
- 破産率は近似モデル、利益は保証しない
- リアルマネー賭博を扱わず、学習・確率理解・意思決定トレーニング目的
