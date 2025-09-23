# ユニバーサル決済リンクジェネレーター

複数の決済サービスに対応した決済リンクを簡単に生成できるWebアプリケーション

## 🚀 機能

- **多決済サービス対応**: Stripe, PayPal, Square, PayPay, fincode
- **セキュア**: AES-256暗号化によるAPI認証情報の安全な処理
- **QRコード生成**: 決済リンクの自動QRコード生成
- **レスポンシブUI**: モバイル・デスクトップ対応
- **リアルタイム検証**: API認証情報のリアルタイム検証

## 📋 Phase 1 (MVP) - 実装済み機能

### ✅ 完了機能
- [x] Next.js 14 + TypeScript + Tailwind CSS + shadcn/ui セットアップ
- [x] レスポンシブなメインレイアウト構築
- [x] 決済サービス選択コンポーネント（5サービス対応）
- [x] セキュアなAPI認証情報入力フォーム
- [x] 決済情報入力フォーム（金額・商品情報）
- [x] Stripe SDK統合とPayment Link生成API
- [x] AES-256暗号化システムとセキュリティ機能
- [x] QRコード自動生成機能
- [x] 決済リンク生成結果表示

### 🔧 技術スタック
- **フロントエンド**: Next.js 14, TypeScript, Tailwind CSS, shadcn/ui
- **状態管理**: Zustand
- **フォーム**: React Hook Form + Zod
- **暗号化**: CryptoJS (AES-256)
- **QRコード**: qrcode.js
- **決済**: Stripe SDK
- **デプロイ**: Vercel (予定)

## 🛠️ セットアップ

### 前提条件
- Node.js 18.0.0 以上
- npm または yarn

### インストール

```bash
# リポジトリをクローン
git clone <repository-url>
cd kessai_link

# 依存関係をインストール
npm install

# 環境変数を設定
cp .env.example .env

# 開発サーバーを起動
npm run dev
```

### 環境変数設定

`.env` ファイルを作成し、以下の変数を設定してください：

```env
# 暗号化キー (32文字の安全な文字列を生成してください)
ENCRYPTION_SECRET="your-super-secure-32-character-key"

# セッション設定
SESSION_SECRET="your-session-secret-key"

# データベース (オプション - Phase 2で使用予定)
DATABASE_URL="postgresql://username:password@hostname:port/database"

# Next.js設定
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-nextauth-secret"
```

## 🔐 セキュリティ機能

### API認証情報の保護
- **暗号化**: AES-256-GCM暗号化でAPI認証情報を保護
- **セッション管理**: セッション中のみメモリに保持
- **永続化なし**: サーバーに認証情報を永続的に保存しない
- **マスキング**: UIでのAPIキー表示時のマスキング

### セキュリティヘッダー
- X-Frame-Options: DENY
- X-Content-Type-Options: nosniff
- Referrer-Policy: strict-origin-when-cross-origin

### レート制限
- API呼び出しの制限: 20回/分
- 認証検証の制限: 10回/分

## 🎯 使用方法

### 1. 決済サービスの選択
5つの決済サービスから選択：
- **Stripe**: グローバル対応、高機能
- **PayPal**: 世界的認知度、購入者保護
- **Square**: 小規模事業向け、シンプル
- **PayPay**: 日本国内、QRコード決済
- **fincode by GMO**: 多様な決済方法

### 2. API認証情報の入力
各サービスのダッシュボードから取得した認証情報を入力：

#### Stripe
- Publishable Key (pk_test_... または pk_live_...)
- Secret Key (sk_test_... または sk_live_...)
- Webhook Secret (オプション)

#### その他のサービス
- PayPal: Client ID, Client Secret
- Square: Application ID, Access Token

### 3. 決済情報の設定
- **基本情報**: 商品名、説明、金額、通貨、数量
- **顧客情報**: メールアドレス（オプション）
- **詳細設定**: 有効期限、成功・キャンセル時のリダイレクトURL

### 4. 決済リンクの生成
- 決済リンクの即座生成
- QRコードの自動生成
- クリップボードへの簡単コピー
- SNS・メールでの共有

## 🔧 API エンドポイント

### 認証情報検証
```
POST /api/validate-credentials
```

### 決済リンク生成 (Stripe)
```
POST /api/payment-links/stripe
```

### QRコード生成
```
POST /api/qr-code
GET /api/qr-code?url={url}&size={size}&margin={margin}
```

## 📈 Phase 2 計画 (2-3週間)

- [ ] PayPal SDK統合とPayment Link生成
- [ ] Square SDK統合とPayment Link生成
- [ ] Railway PostgreSQL統合（決済履歴保存）
- [ ] ダッシュボード機能（決済リンク管理）
- [ ] 短縮URL生成機能
- [ ] Webhook処理機能

## 📈 Phase 3 計画 (3-4週間)

- [ ] PayPay API統合
- [ ] fincode by GMO API統合
- [ ] 多言語対応 (i18n)
- [ ] 高度な分析・レポート機能
- [ ] バルク決済リンク生成

## 🚀 デプロイメント

### Vercel デプロイ

```bash
# Vercel CLIをインストール
npm i -g vercel

# プロジェクトをデプロイ
vercel
```

### 必要なAPIキー取得

#### 即座に取得可能（無料）
1. **Stripe**: https://stripe.com (テストキー即時発行)
2. **PayPal**: https://developer.paypal.com (Sandbox即時)
3. **Square**: https://developer.squareup.com (Sandbox即時)

#### 審査・申請が必要
4. **PayPay**: PayPay for Developers (法人審査)
5. **fincode**: GMO申請 (審査期間1週間)

## 📊 パフォーマンス

- **初期ロード**: 1-3秒以内
- **決済リンク生成**: 2-5秒以内
- **QRコード生成**: 1秒以内
- **レスポンシブ**: モバイル・デスクトップ最適化

## 📡 AI投資分析モジュール

本リポジトリには、株式投資判断を補助する **AI Investment Compass** の試験実装が含まれています。`/api/analyze` エンドポイントとダッシュボードの「銘柄の総合分析」パネルから利用できます。

- **外部データソース**: Alpha Vantage（株価・財務）、NewsAPI.org（ニュース＆センチメント）、OpenAI（要約）
- **設定方法**:
  - `ALPHA_VANTAGE_API_KEY` — 株価/テクニカル/財務指標
  - `NEWS_API_KEY` — ニュース取得
  - `OPENAI_API_KEY`（任意）— AIによる解説生成。未設定のときは警告を表示してスキップ
  - `OPENAI_MODEL`（任意）— 既定値は `gpt-4o-mini`
  - `ANALYZE_MOCK=true` を `.env.local` に設定すると、外部APIを呼ばずにモックデータでUIを確認できます
- **キャッシュ**: 分析結果は `AnalysisCache` テーブルに最大3時間保存され、同一銘柄への再リクエストを高速化します
- **プロンプト**: OpenAIへ送信するテンプレートは `docs/prompts/analysis-summary.md` を参照してください
- **テスト手順**: モックモードや本番モードでの確認方法は `docs/testing/ai-investment-compass.md` に記載しています

> ⚠️ Alpha Vantage / NewsAPI は無料枠でもレート制限があります。開発時は `ANALYZE_MOCK=true` で挙動確認し、本番環境のみ外部APIを有効化する運用を推奨します。

## 📋 ウォッチリスト API

ユーザーごとのウォッチリスト管理用エンドポイントを追加しました。Stack Auth で認証された状態で利用してください。

| メソッド | パス | 説明 |
| --- | --- | --- |
| GET | `/api/watchlists` | ログインユーザーのウォッチリストとそのアイテムを取得 |
| POST | `/api/watchlists` | ウォッチリスト作成 `{ name: string }` |
| GET | `/api/watchlists/[watchlistId]/items` | 個別ウォッチリストの詳細を取得 |
| POST | `/api/watchlists/[watchlistId]/items` | アイテム追加 `{ symbol, market?, note? }` |
| DELETE | `/api/watchlists/[watchlistId]/items/[itemId]` | アイテム削除 |

銘柄コードの検証は `lib/analyze/validation.ts` に定義したルールで行われ、4桁数字の場合は `.T` を付与して東京市場として扱います。重複登録時は 409 レスポンスが返ります。

## 🐛 トラブルシューティング

### よくある問題

1. **Stripe認証エラー**
   - APIキーの形式を確認（pk_test_, sk_test_）
   - テスト/本番環境の整合性を確認

2. **QRコード生成失敗**
   - URLの形式を確認
   - サーバーの応答時間を確認

3. **暗号化エラー**
   - ENCRYPTION_SECRET環境変数の設定を確認
   - 32文字以上の安全な文字列を使用

### デバッグモード

```bash
# 詳細なログ出力
NODE_ENV=development npm run dev
```

## 🤝 コントリビューション

1. フォークを作成
2. フィーチャーブランチを作成 (`git checkout -b feature/AmazingFeature`)
3. 変更をコミット (`git commit -m 'Add some AmazingFeature'`)
4. ブランチにプッシュ (`git push origin feature/AmazingFeature`)
5. プルリクエストを作成

## 📄 ライセンス

このプロジェクトは MIT ライセンスの下で公開されています。

## 📞 サポート

問題や質問がある場合は、GitHubのIssuesを使用してください。

---

**⚠️ 注意**: このアプリケーションはAPI認証情報を扱います。本番環境では適切なセキュリティ対策を実装し、信頼できる環境でのみ使用してください。
