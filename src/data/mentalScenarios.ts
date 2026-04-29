export interface MentalScenario {
  id: string;
  category: 'badbeat' | 'revenge' | 'overbet' | 'session-end' | 'streak';
  situation: string;
  question: string;
  options: { text: string; correct: boolean; reason: string }[];
  explanation: string;
}

export const MENTAL_SCENARIOS: MentalScenario[] = [
  {
    id: 'm1',
    category: 'badbeat',
    situation: 'あなたはAAでオールイン。相手は72oでコール。リバーで7が落ちて2ペアを作られ、あなたは負けました。',
    question: '次のハンドであなたはK9oを持っています。前にレイズが入りました。どうしますか？',
    options: [
      { text: 'ムカつくので即オールイン', correct: false, reason: '感情でEVを無視。典型的なティルト。' },
      { text: '取り返したいのでとりあえずコール', correct: false, reason: '前のハンドの結果と次のEVは無関係。' },
      { text: '一度深呼吸し、ハンドとポジションだけで判断する', correct: true, reason: '正しい判断は過去の結果に依存しない。EV基準で考える。' },
      { text: '相手が運だけだから何でも参加する', correct: false, reason: '相手のスキル評価と自分の手のEVは別問題。' },
    ],
    explanation: 'AAで負けたことと、次のK9oの期待値は完全に独立です。過去の結果で判断が歪む状態を「ティルト」と呼びます。専業を目指すなら、感情ではなくEVで判断する筋肉を作りましょう。',
  },
  {
    id: 'm2',
    category: 'revenge',
    situation: 'あなたは1時間で5万円負けています。バンクロールはまだ十分。',
    question: 'どうしますか？',
    options: [
      { text: 'レートを上げて一気に取り返す', correct: false, reason: '取り返し思考は破産の典型ルート。' },
      { text: 'プレイ条件（疲労・集中力・判断）を見直し、必要なら席を立つ', correct: true, reason: '判断の質が落ちている可能性を疑うのが正解。' },
      { text: 'もっと攻撃的に打って流れを変える', correct: false, reason: '「流れ」は錯覚。ベースは独立試行。' },
      { text: '相手にイラついて煽り返す', correct: false, reason: 'メンタル管理失敗。即離席。' },
    ],
    explanation: 'プロは負けている時こそ「自分の判断の質」をモニタリングします。1セッションの結果は短期的な揺らぎ。判断が荒れているサインを見つけたら席を立つのが最もEVが高い行動です。',
  },
  {
    id: 'm3',
    category: 'overbet',
    situation: 'ボードはA♣ K♥ Q♣ J♦ T♠ で誰でもストレート完成。相手がポットの2倍オーバーベットしてきました。あなたはセット（KKK）。',
    question: 'どうしますか？',
    options: [
      { text: 'セットなので強気にコール', correct: false, reason: 'チョップ確定の場面でオーバーベットは普通エースを示唆。負け濃厚。' },
      { text: '相手のレンジを考えて、フォールドを真剣に検討する', correct: true, reason: '強い役を持っていても「相手のレンジに勝てるか」で判断するのが正しい。' },
      { text: '感情的に「役があるからコール」', correct: false, reason: '結果論的思考。期待値ではなくエゴで判断している。' },
      { text: '逆にレイズして強さを見せる', correct: false, reason: 'A入りに対して致命的。' },
    ],
    explanation: '強い役を「持っている」だけでは正解になりません。相手のレンジに対し、自分の役が勝てる比率と、コールに必要な勝率（ポットオッズ）を比べるのが正しい思考です。大きすぎるベットは「ナッツに近いか純ブラフか」の二極化が普通。',
  },
  {
    id: 'm4',
    category: 'session-end',
    situation: 'あなたは今日、目標利益+50000円を達成しました。集中力もまだあります。',
    question: 'どうしますか？',
    options: [
      { text: 'もっと勝つために続ける', correct: false, reason: '目標を超えたら「勝ち逃げ」が一般論ではあるが、本質は集中力。' },
      { text: '事前に決めたセッションルール（時間／利益／集中力）に従って判断する', correct: true, reason: 'ルールベースで動くのがプロ思考。気分で続行/終了しない。' },
      { text: '気分が良いので2倍のレートに移動', correct: false, reason: '勝った気分で上のレートに行くのは典型的な破産パターン。' },
      { text: '負けている人を見つけて煽る', correct: false, reason: '論外。' },
    ],
    explanation: '「結果が良かったから続ける」「結果が悪かったから取り返す」はどちらも結果ドリブンで-EVです。プロはセッション開始前に「終了条件」を決めておき、そのルールで機械的に動きます。',
  },
  {
    id: 'm5',
    category: 'streak',
    situation: '5連敗中。判断は正しかったと思っているが、結果が出ない。',
    question: 'どうしますか？',
    options: [
      { text: '判断を変えて、もっと無難に降りる方向にする', correct: false, reason: '結果に合わせて判断を曲げると長期EVが下がる。' },
      { text: '結果ではなく「判断の質」を1ハンドずつ振り返る', correct: true, reason: '結果と判断を分離して見るのがプロ思考。' },
      { text: '上手い人だけ呼んで対戦する', correct: false, reason: 'スキルアップは別の場でやる。今のセッションのEVは下がる。' },
      { text: '神社にお参り', correct: false, reason: '気分転換は良いが、判断改善にはならない。' },
    ],
    explanation: '短期では運の振れ幅で良い判断でも負けが続きます。プロは結果ではなく「判断の質」を評価指標にします。レビュー（ハンドリビュー）を行い、判断ミスがなければ続行、あれば修正、それだけです。',
  },
  {
    id: 'm6',
    category: 'badbeat',
    situation: '相手がプリフロップで3ベットしてきた。あなたはJJ。４ベットで返したらコールされ、フロップA高で相手が大きくチェックレイズ。',
    question: 'どうしますか？',
    options: [
      { text: 'JJは強いので押し切る', correct: false, reason: 'A高ボードで相手のレンジは強い側に偏りがち。' },
      { text: '相手のレンジ（4ベットコール+CR）を冷静に推定し、勝てなさそうならフォールド', correct: true, reason: 'レンジ思考＋ポジション＋ボード読みの統合判断。' },
      { text: 'チェックバックされたらコール、レイズされたらコール', correct: false, reason: '受け身すぎ。レイズ後はレンジが強い側に大きく寄る。' },
      { text: 'Aがバレてないかもしれないので強気にレイズ', correct: false, reason: '希望的観測ベースは-EV。' },
    ],
    explanation: '「強いハンドを持っている＝降りない」ではありません。強いハンドでも、相手の*レンジ*に対して負けているなら降りるのがEV最大化です。これがレンジ思考の核心。',
  },
  {
    id: 'm7',
    category: 'session-end',
    situation: '寝不足で集中力が落ちているのに気づいた。',
    question: 'どうしますか？',
    options: [
      { text: '気合で乗り切る', correct: false, reason: '集中力低下は判断ミス率を直接押し上げる。' },
      { text: 'すぐ席を立って休む', correct: true, reason: '集中力なしのプレイは長期EVを大きく下げる。' },
      { text: 'コーヒーを飲んで続ける', correct: false, reason: '一時的にはマシでも、判断の質は戻らない。' },
      { text: 'レートを下げてダラダラ続ける', correct: false, reason: '時給が悪化するだけ。専業思考なら時間も資源。' },
    ],
    explanation: '専業＝判断の職人。集中力の質が落ちる状態でプレイすることは、自分の最大の武器（判断）を捨てることです。「席を立つ」は最もEVが高い行動の一つ。',
  },
  {
    id: 'm8',
    category: 'revenge',
    situation: 'あなたはブラフで負けました。次のハンドも強気で行きたい衝動があります。',
    question: '正しい思考は？',
    options: [
      { text: '次のハンドはハンドとボードだけで判断し、衝動を切る', correct: true, reason: '感情と判断を切り離す訓練そのもの。' },
      { text: '同じ相手に同じブラフを返す', correct: false, reason: 'パターン化したブラフはエクスプロイトされる。' },
      { text: '降りすぎて控えめに打つ', correct: false, reason: 'こちらも結果ドリブンで-EV。' },
      { text: '退席して頭を冷やす', correct: false, reason: '集中力があれば必ずしも退席は不要。衝動を切る訓練が先。' },
    ],
    explanation: 'ブラフは「成功率 × 取れるポット」と「失敗時のロス」のEVで決めるもの。1回失敗しても、次のハンドのEV計算には何の影響もありません。衝動を切る訓練を積みましょう。',
  },
];
