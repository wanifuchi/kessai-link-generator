export type PersonaKey =
  | 'primaryCaregiver'
  | 'adultChildRemote'
  | 'soloPlanner'
  | 'earlyPlanner'
  | 'communitySupport';

export type JourneyStageKey =
  | 'sixToThreeMonthsBefore'
  | 'threeToOneMonthsBefore'
  | 'oneMonthToDayZero'
  | 'weekAfter'
  | 'oneToThreeMonthsAfter'
  | 'threeToSixMonthsAfter';

export type IntentCategory =
  | 'cost'
  | 'procedure'
  | 'emotion'
  | 'legal'
  | 'product'
  | 'service'
  | 'digital'
  | 'religion'
  | 'logistics'
  | 'finance';

export interface KeywordCandidate {
  keyword: string;
  tags: IntentCategory[];
  rationale?: string;
  rising?: boolean;
}

export interface StageKeywordSet {
  stage: JourneyStageKey;
  label: string;
  timeframe: string;
  description: string;
  dominantIntents: IntentCategory[];
  primaryQuestions: string[];
  topKeywords: KeywordCandidate[];
  emergingKeywords: KeywordCandidate[];
}

export interface ScenarioBlueprint {
  id: string;
  name: string;
  description: string;
  personas: PersonaKey[];
  defaultStageOrder: JourneyStageKey[];
  stageSets: StageKeywordSet[];
}

export const personaLabels: Record<PersonaKey, string> = {
  primaryCaregiver: '同居家族の喪主候補',
  adultChildRemote: '遠距離に住む子世帯',
  soloPlanner: '単身者の終活',
  earlyPlanner: '50代からの終活準備',
  communitySupport: '地域包括支援・自治体担当',
};

export const stageLabels: Record<JourneyStageKey, string> = {
  sixToThreeMonthsBefore: '起点6〜3か月前',
  threeToOneMonthsBefore: '起点3〜1か月前',
  oneMonthToDayZero: '起点1か月前〜当日',
  weekAfter: '起点直後〜1週間',
  oneToThreeMonthsAfter: '起点1〜3か月後',
  threeToSixMonthsAfter: '起点3〜6か月後',
};

export const personaStageScenarios: ScenarioBlueprint[] = [
  {
    id: 'family-funeral',
    name: '家族が葬儀を検討するケース',
    description:
      '在宅療養または病院で看取りを迎える家族が、葬儀の意思決定を進める際の情報ニーズを時系列で整理したシナリオ',
    personas: ['primaryCaregiver', 'adultChildRemote'],
    defaultStageOrder: [
      'sixToThreeMonthsBefore',
      'threeToOneMonthsBefore',
      'oneMonthToDayZero',
      'weekAfter',
      'oneToThreeMonthsAfter',
      'threeToSixMonthsAfter',
    ],
    stageSets: [
      {
        stage: 'sixToThreeMonthsBefore',
        label: '介護と終活の並行検討期',
        timeframe: '起点6〜3か月前',
        description:
          '終活情報収集と介護体制の確認を始める段階。費用感や準備物の全体像を掴みたいニーズが強い。',
        dominantIntents: ['cost', 'service', 'product'],
        primaryQuestions: [
          '終活は何から始めるべきか？',
          '家族葬と一般葬の費用差は？',
          '地域で相談できる専門家はいるか？',
        ],
        topKeywords: [
          { keyword: '終活 相談 セミナー', tags: ['service', 'emotion'] },
          { keyword: '家族葬 費用 相場', tags: ['cost'] },
          { keyword: 'エンディングノート 書き方', tags: ['procedure', 'product'] },
          { keyword: '遺影 撮影 スタジオ', tags: ['service', 'product'] },
          { keyword: '介護施設 {地域} 口コミ', tags: ['service'] },
          { keyword: '老人ホーム 入居費', tags: ['cost', 'service'] },
          { keyword: '尊厳死 宣言 方法', tags: ['legal', 'emotion'] },
          { keyword: 'デジタル遺品 整理', tags: ['digital'] },
          { keyword: '終活保険 比較', tags: ['finance'] },
          { keyword: '葬儀 生前契約 メリット', tags: ['finance', 'service'] },
          { keyword: '樹木葬 予約 流れ', tags: ['procedure', 'product'] },
          { keyword: '遺言書 作り方 無料', tags: ['legal'] },
        ],
        emergingKeywords: [
          { keyword: '家系図 アプリ', tags: ['digital', 'emotion'], rising: true },
          { keyword: '終活 30代', tags: ['emotion', 'service'], rising: true },
          { keyword: '生前整理 業者 比較', tags: ['service', 'cost'], rising: true },
        ],
      },
      {
        stage: 'threeToOneMonthsBefore',
        label: '看取り準備フェーズ',
        timeframe: '起点3〜1か月前',
        description:
          '病状悪化や医療判断が迫ることで、実務手順と突発対応の検討が増える。家族の役割分担や情報共有の検索が増加。',
        dominantIntents: ['procedure', 'logistics', 'emotion'],
        primaryQuestions: [
          '危篤時に会社へどう連絡するか？',
          '病院からの搬送手段は？',
          '安置や戒名など直近で準備すべきことは？',
        ],
        topKeywords: [
          { keyword: '危篤 会社 連絡 マナー', tags: ['procedure', 'emotion'] },
          { keyword: '病院 死亡 手続き 流れ', tags: ['procedure', 'legal'] },
          { keyword: '夜間 搬送 葬儀車', tags: ['logistics'] },
          { keyword: '家族葬 安置所 空き', tags: ['logistics', 'service'] },
          { keyword: '直葬 流れ', tags: ['procedure', 'cost'] },
          { keyword: '葬儀社 {地域} 評判', tags: ['service'] },
          { keyword: '喪主 決め方', tags: ['procedure', 'emotion'] },
          { keyword: '訃報 文例 メール', tags: ['procedure'] },
          { keyword: '戒名 早割', tags: ['product', 'finance'] },
          { keyword: '安置室 持ち込み 可', tags: ['logistics'] },
          { keyword: '死亡診断書 費用', tags: ['cost', 'legal'] },
          { keyword: '延命治療 断り方', tags: ['emotion', 'legal'] },
        ],
        emergingKeywords: [
          { keyword: '白装束 手配', tags: ['product', 'religion'], rising: true },
          { keyword: 'オンライン 見守り カメラ', tags: ['digital', 'service'], rising: true },
          { keyword: 'グリーフケア 事前', tags: ['emotion', 'service'], rising: true },
        ],
      },
      {
        stage: 'oneMonthToDayZero',
        label: '直前直後の意思決定',
        timeframe: '起点1か月前〜当日',
        description:
          '臨終前後で葬儀社選定・式次第・役割分担を最優先に行うフェーズ。スピード感のある情報提示が求められる。',
        dominantIntents: ['procedure', 'logistics', 'product'],
        primaryQuestions: [
          '最短で依頼できる葬儀社は？',
          '喪主挨拶や進行はどう準備するか？',
          '宗派に沿った具体的マナーは？',
        ],
        topKeywords: [
          { keyword: '葬儀 会場 選び方', tags: ['service', 'procedure'] },
          { keyword: '枕経 流れ', tags: ['procedure', 'religion'] },
          { keyword: '通夜 服装 女性', tags: ['procedure'] },
          { keyword: '式次第 テンプレ', tags: ['procedure'] },
          { keyword: '通夜振る舞い 料理', tags: ['product'] },
          { keyword: '香典 受付 マニュアル', tags: ['procedure'] },
          { keyword: '会葬礼状 文例', tags: ['procedure'] },
          { keyword: '会計係 役割', tags: ['procedure'] },
          { keyword: '花祭壇 人気 デザイン', tags: ['product', 'emotion'] },
          { keyword: '宗派別 作法', tags: ['religion'] },
          { keyword: 'オンライン葬儀 配信', tags: ['digital', 'service'] },
          { keyword: '司会 進行 台本', tags: ['procedure'] },
        ],
        emergingKeywords: [
          { keyword: '即日 葬儀 相談 チャット', tags: ['digital', 'service'], rising: true },
          { keyword: 'ライブ配信 葬儀 サポート', tags: ['digital', 'service'], rising: true },
          { keyword: '供花 EC 注文', tags: ['product', 'digital'], rising: true },
        ],
      },
      {
        stage: 'weekAfter',
        label: '直後の事務と儀式対応',
        timeframe: '起点直後〜1週間',
        description:
          '通夜・葬儀後の初期手続きが集中。香典返しや法的手続きのチェックリスト需要が高い。',
        dominantIntents: ['procedure', 'finance', 'legal'],
        primaryQuestions: [
          '香典返しはいつ誰に送るべきか？',
          '四十九日の準備項目は？',
          '役所や保険会社への届け出は？',
        ],
        topKeywords: [
          { keyword: '死亡届 提出 期限', tags: ['legal'] },
          { keyword: '年金 停止 手続き', tags: ['finance', 'legal'] },
          { keyword: '香典返し カタログギフト', tags: ['product', 'finance'] },
          { keyword: '四十九日 準備', tags: ['procedure', 'religion'] },
          { keyword: '位牌 選び方', tags: ['product', 'religion'] },
          { keyword: '法要 お布施 相場', tags: ['finance', 'religion'] },
          { keyword: '相続税 申告 必要書類', tags: ['legal', 'finance'] },
          { keyword: '遺品整理 費用', tags: ['service', 'cost'] },
          { keyword: '形見分け ルール', tags: ['procedure', 'emotion'] },
          { keyword: '海洋散骨 申し込み', tags: ['procedure', 'product'] },
          { keyword: 'デジタル遺品 ログイン', tags: ['digital'] },
          { keyword: '納骨堂 空き状況', tags: ['service', 'logistics'] },
        ],
        emergingKeywords: [
          { keyword: 'ペット供養 代行', tags: ['service', 'emotion'], rising: true },
          { keyword: '香典返し EC', tags: ['digital', 'product'], rising: true },
          { keyword: '相続手続き オンライン 代行', tags: ['digital', 'legal'], rising: true },
        ],
      },
      {
        stage: 'oneToThreeMonthsAfter',
        label: '法要と暮らしの再設計',
        timeframe: '起点1〜3か月後',
        description:
          '法要準備に加え、住居や資産整理が本格化する。心理的ケアやライフプラン再設計の検索が増える。',
        dominantIntents: ['procedure', 'emotion', 'finance'],
        primaryQuestions: [
          '法要はどのタイミングで予約すべきか？',
          '遺品整理や住み替えはどう進めるか？',
          'グリーフケアの支援先は？',
        ],
        topKeywords: [
          { keyword: '一周忌 招待状 文例', tags: ['procedure'] },
          { keyword: '永代供養 費用', tags: ['finance', 'religion'] },
          { keyword: '墓じまい 補助金', tags: ['finance', 'legal'] },
          { keyword: '墓石 リフォーム', tags: ['product', 'service'] },
          { keyword: '仏壇 買い替え 注意点', tags: ['product'] },
          { keyword: '相続放棄 期限', tags: ['legal', 'finance'] },
          { keyword: '未支給年金 手続き', tags: ['finance', 'legal'] },
          { keyword: '死後事務委任契約', tags: ['legal', 'service'] },
          { keyword: '自筆証書遺言 保管制度', tags: ['legal'] },
          { keyword: '家系図 作り方', tags: ['emotion', 'digital'] },
          { keyword: '散骨 許可', tags: ['legal', 'procedure'] },
          { keyword: 'グリーフケア カウンセリング', tags: ['emotion', 'service'] },
        ],
        emergingKeywords: [
          { keyword: '供養サブスク', tags: ['digital', 'service'], rising: true },
          { keyword: 'オンライン法要', tags: ['digital', 'religion'], rising: true },
          { keyword: '遺品整理 サブスク', tags: ['service', 'finance'], rising: true },
        ],
      },
      {
        stage: 'threeToSixMonthsAfter',
        label: '生活安定と長期供養計画',
        timeframe: '起点3〜6か月後',
        description:
          '法要の継続や供養方法、暮らしのアップデートがテーマ。新しい供養スタイルの比較検討が増える。',
        dominantIntents: ['emotion', 'religion', 'service'],
        primaryQuestions: [
          '一周忌以降の供養スケジュールは？',
          '墓じまいや改葬の選択肢は？',
          '地域や宗派ごとの習慣は？',
        ],
        topKeywords: [
          { keyword: '三回忌 日程', tags: ['procedure', 'religion'] },
          { keyword: '永代供養 比較', tags: ['service', 'finance'] },
          { keyword: '墓じまい 流れ', tags: ['procedure', 'legal'] },
          { keyword: '改葬 手続き', tags: ['legal', 'procedure'] },
          { keyword: '御朱印 供養寺院', tags: ['religion', 'emotion'] },
          { keyword: '墓参り 代行 料金', tags: ['service', 'finance'] },
          { keyword: '仏壇 処分', tags: ['product', 'service'] },
          { keyword: '供養 旅行 パック', tags: ['service', 'emotion'] },
          { keyword: 'デジタル追悼 サービス', tags: ['digital', 'emotion'] },
          { keyword: '見守り サービス 継続', tags: ['service', 'digital'] },
          { keyword: '後払い 葬儀 精算', tags: ['finance', 'service'] },
          { keyword: '地域 包括 支援センター 相談', tags: ['service', 'emotion'], rationale: '自治体や支援者向けの問い合わせが増える'},
        ],
        emergingKeywords: [
          { keyword: '供養NFT', tags: ['digital', 'product'], rising: true },
          { keyword: 'バーチャル墓参り', tags: ['digital', 'emotion'], rising: true },
          { keyword: 'オンライン追悼 イベント', tags: ['digital', 'emotion'], rising: true },
        ],
      },
    ],
  },
];

export const intentLabels: Record<IntentCategory, string> = {
  cost: '費用・コスト',
  procedure: '手順・マナー',
  emotion: '心情ケア',
  legal: '法務・手続き',
  product: '商品・アイテム',
  service: 'サービス比較',
  digital: 'デジタル活用',
  religion: '宗派・儀式',
  logistics: '段取り・手配',
  finance: '金融・保険',
};

export const intentColorMap: Record<IntentCategory, string> = {
  cost: 'bg-amber-100 text-amber-800 border-amber-200',
  procedure: 'bg-slate-100 text-slate-800 border-slate-200',
  emotion: 'bg-rose-100 text-rose-800 border-rose-200',
  legal: 'bg-indigo-100 text-indigo-800 border-indigo-200',
  product: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  service: 'bg-sky-100 text-sky-800 border-sky-200',
  digital: 'bg-purple-100 text-purple-800 border-purple-200',
  religion: 'bg-amber-50 text-amber-700 border-amber-200',
  logistics: 'bg-blue-50 text-blue-700 border-blue-200',
  finance: 'bg-teal-100 text-teal-800 border-teal-200',
};
