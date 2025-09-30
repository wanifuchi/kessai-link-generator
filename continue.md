# 決済リンク生成サービス - 作業継続ガイド

最終更新: 2025年9月30日 (Square/PayPay/fincode統合完了時点)

## 🎯 プロジェクト概要

**プロジェクト名**: Kessai Link（決済リンク生成サービス）
**アーキテクチャ**: マルチテナント型（ユーザーが独自のAPI認証情報を管理）
**技術スタック**: Next.js 14.2.5, NextAuth.js, Prisma, PostgreSQL (Neon), Vercel, recharts

## 📅 開発履歴

### 2025年9月30日 - Square/PayPay/fincode 決済統合完了
- **Phase 2.5完了**: 残り3決済サービスの完全実装
- **実装内容**:
  - `src/lib/payment-services/square.ts` - Square Online Checkout API統合
  - `src/lib/payment-services/paypay.ts` - PayPay Web Payment API統合
  - `src/lib/payment-services/fincode.ts` - fincode Payment API統合
  - `src/lib/payment.ts` - 全サービス統合レイヤーへの更新
  - 認証情報検証機能の実装（validateCredentials）
  - 決済リンク生成機能の実装（createPaymentLink）
- **成果**: 5つの決済サービス全てで決済リンク生成が可能に

### 2025年9月30日 - Phase 2 ダッシュボード・決済リンク管理完了
- **Phase 2完了**: 決済リンク生成機能と高度なダッシュボード機能
- **完了済み**:
  - ダッシュボード機能の大幅強化（recharts使用）
  - 決済リンク一覧・検索・フィルター機能
  - 決済リンク一括操作機能
  - テーブル/カード表示切り替え
  - Phase 2.1-2.3完了

### 2025年9月27日 - マルチテナント型への大規模リファクタリング
- **変更内容**: システム全体をマルチテナント型に再設計
- **理由**: ユーザーが自分のAPI認証情報を管理する方式に変更
- **主要作業**:
  - UserPaymentConfigモデルの新規作成
  - 暗号化システムの実装（AES暗号化）
  - 決済設定管理UI/APIの完全実装
  - 接続テスト機能の追加

### 2025年9月23日 - 初期5決済サービス実装
- Stripe, PayPal, Square, PayPay, Fincodeの統合
- Enum値の小文字化リファクタリング
- Webhook処理の実装

## ✅ 現在の実装状況

### フェーズ1: 基盤システム（完了）

#### 1. 認証システム ✅
- **実装**: Google OAuth認証（NextAuth.js）
- **状態**: 本番環境で動作確認済み
- **環境変数**: Vercel設定完了
- **問題解決**: 環境変数の改行文字問題を解決済み

#### 2. データベース設計 ✅
```prisma
model UserPaymentConfig {
  id              String        @id @default(cuid())
  userId          String
  provider        PaymentService
  displayName     String        // ユーザー定義の設定名
  encryptedConfig String        @db.Text // 暗号化されたAPI情報
  isTestMode      Boolean       @default(true)
  isActive        Boolean       @default(false)
  verifiedAt      DateTime?     // 接続テスト成功日時
  lastTestedAt    DateTime?
  // ... 関連フィールド
}
```

#### 3. 暗号化システム ✅
- **実装場所**: `/src/lib/encryption.ts`
- **方式**: AES-256-GCM
- **用途**: API認証情報の安全な保存

#### 4. 決済設定管理UI ✅
- **URL**: `/settings/payments`
- **機能一覧**:
  - 設定一覧表示（カード形式）
  - 新規作成・編集・削除
  - プロバイダー別の設定フォーム
  - 接続テスト機能
  - テストモード/本番モード切り替え
  - 有効/無効の切り替え

#### 5. RESTful API ✅
```
GET    /api/payment-configs          # 一覧取得
POST   /api/payment-configs          # 新規作成
GET    /api/payment-configs/[id]     # 個別取得
PUT    /api/payment-configs/[id]     # 更新
DELETE /api/payment-configs/[id]     # 削除
POST   /api/payment-configs/[id]/test # 接続テスト
```

#### 6. 接続テスト実装状況 ✅
- **Stripe**: ✅ アカウント情報取得による検証
- **PayPal**: ✅ OAuth2トークン取得による検証
- **Square**: ✅ Locations API検証実装完了（2025-09-30）
- **PayPay**: ✅ Codes API検証実装完了（2025-09-30）
- **fincode**: ✅ Shops API検証実装完了（2025-09-30）

#### 7. 決済サービス統合実装 ✅ (2025-09-30追加)
- **実装場所**:
  - `/src/lib/payment-services/square.ts` - Square Online Checkout API統合
  - `/src/lib/payment-services/paypay.ts` - PayPay Web Payment API統合
  - `/src/lib/payment-services/fincode.ts` - fincode Payment Links API統合
  - `/src/lib/payment.ts` - 全サービス対応の統合レイヤー

- **主要機能**:
  - 全5サービスの決済リンク生成API実装
  - BasePaymentServiceパターンでの統一化
  - エラーハンドリングとレスポンス標準化
  - 認証情報の暗号化設定からの自動解析

- **API仕様**:
  - **Square**: Online Checkout API (Square-Version: 2024-01-18)
  - **PayPay**: Web Payment API v2 (QRコード決済リンク)
  - **fincode**: Payment Links API v1 (カード決済リンク)

## 🔧 チェックボックスの意味

### テストモード
- **ON（✅）**: テスト環境を使用
  - テスト用APIキー（sk_test_*, pk_test_*）
  - 実際の決済は発生しない
  - テストカード番号で動作確認可能
- **OFF（❌）**: 本番環境を使用
  - 本番用APIキー（sk_live_*, pk_live_*）
  - 実際の決済が発生

### 有効にする
- **ON（✅）**: この設定で決済リンクを作成可能
- **OFF（❌）**: 設定は保存されるが使用されない

## 🚀 Phase 2 の進捗状況（現在実装中）

### ✅ Phase 2: 完了済み
1. **ダッシュボード機能強化**（完了）
   - 統計カード表示機能
   - インタラクティブチャート（収益推移、サービス別、取引別）
   - リアルタイムアクティビティフィード
   - 期間フィルタリング（1日〜1年）
   - CSV エクスポート機能
   - レスポンシブデザイン対応

### 🔄 Phase 2: 中断地点 - 決済リンク管理機能拡張
**次回再開時に即座に継続すべきタスク**:

1. **決済リンク一覧ページの実装** (in_progress)
   - `/src/app/links/page.tsx` - 一覧表示ページ
   - 検索・フィルタリング・ソート機能
   - ペジネーション対応

2. **検索・フィルタリング機能の実装** (pending)
   - タイトル、ステータス、サービス、作成日での絞り込み
   - 高度な検索オプション

3. **一括操作機能の追加** (pending)
   - 複数選択でのステータス変更
   - 一括削除・一括アクティブ化

4. **決済リンク編集機能の実装** (pending)
   - インライン編集または専用編集ページ
   - リアルタイムプレビュー

5. **決済リンク複製機能の実装** (pending)
   - 既存リンクをベースにした新規作成
   - 設定の部分的変更オプション

### 📝 Phase 2: 残りタスク（計画段階）
- 取引履歴詳細表示とエクスポート
- 通知システム（email/SMS、webhook）
- 決済ページカスタマイズ
- セキュリティ強化（2FA、不正検知）

### Phase 3: 未実装
1. **決済リンク作成機能**
   - UI: `/create`ページの作成
   - API: `/api/payment-links`エンドポイント
   - QRコード生成機能

2. **Stripe Payment Intents統合**
3. **PayPal Express Checkout統合**

## 📁 重要ファイル構成

```
kessai_link/
├── .env.local                          # 環境変数
├── prisma/
│   └── schema.prisma                   # DBスキーマ
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── auth/[...nextauth]/    # NextAuth
│   │   │   ├── dashboard/stats/       # ダッシュボード統計API
│   │   │   └── payment-configs/       # 決済設定API
│   │   │       ├── route.ts           # 一覧・作成
│   │   │       └── [id]/
│   │   │           ├── route.ts       # CRUD
│   │   │           └── test/route.ts  # 接続テスト
│   │   ├── dashboard/page.tsx         # 新強化ダッシュボード
│   │   └── settings/
│   │       └── payments/page.tsx      # 決済設定UI
│   ├── components/
│   │   └── dashboard/                 # 新規追加
│   │       ├── StatsCard.tsx          # 統計カード
│   │       ├── Charts.tsx             # チャート表示
│   │       ├── ActivityFeed.tsx       # アクティビティフィード
│   │       └── PeriodFilter.tsx       # 期間フィルター
│   ├── lib/
│   │   ├── auth.ts                    # 認証ユーティリティ
│   │   ├── authOptions.ts             # NextAuth設定
│   │   ├── encryption.ts              # 暗号化処理
│   │   └── paymentConfigService.ts    # ビジネスロジック
│   └── types/
│       └── paymentConfig.ts           # 型定義
├── package.json                       # recharts 追加済み
└── continue.md                        # このファイル
```

## 🔧 開発環境セットアップ

```bash
# 1. 依存関係インストール
npm install

# 2. 環境変数設定（.env.local）
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=[生成済み]
GOOGLE_CLIENT_ID=[設定済み]
GOOGLE_CLIENT_SECRET=[設定済み]
DATABASE_URL=[Neon PostgreSQL URL]

# 3. データベースセットアップ
npx prisma generate
npx prisma db push

# 4. 開発サーバー起動
npm run dev
```

## 🚨 トラブルシューティング

### 問題1: ファイルシステムエラー（ETIMEDOUT）
**症状**: `.next/server/app`ディレクトリ作成時のタイムアウト

**解決方法**:
```bash
# 1. 全プロセス停止
pkill -f "npm run dev"

# 2. キャッシュクリア
rm -rf .next
rm -rf node_modules/.cache

# 3. サーバー再起動
npm run dev
```

### 問題2: Internal Server Error
**原因**: 複数のnpm devプロセスの競合
**解決**: 上記のクリーンアップ手順を実行

### 問題3: Google OAuth認証エラー
**原因**: 環境変数の改行文字混入
**解決**: Vercel環境変数を`printf`コマンドで再設定

## 📊 現在のシステム状態

| コンポーネント | 状態 | 備考 |
|------------|------|------|
| 認証システム | ✅ 正常 | Google OAuth動作確認済み |
| データベース | ✅ 正常 | Neon PostgreSQL接続確立 |
| API | ✅ 正常 | 全エンドポイント動作確認済み |
| UI | ✅ 正常 | 決済設定管理画面完成 |
| 暗号化 | ✅ 正常 | AES暗号化実装済み |
| 接続テスト | ⚠️ 部分的 | Stripe/PayPalのみ完全実装 |

## 🎯 実装優先順位

### 高優先度
1. Stripe Payment Intents統合
2. 決済リンク作成UI/API
3. QRコード生成

### 中優先度
1. PayPal Express Checkout統合
2. ダッシュボード作成
3. Webhook処理

### 低優先度
1. Square/PayPay/fincode完全実装
2. 高度な分析機能
3. 管理者機能

## 💡 設計思想

1. **セキュリティ第一**: API認証情報は必ず暗号化
2. **ユーザー主権**: 各ユーザーが自分のAPI認証情報を管理
3. **段階的リリース**: テストモード → 本番モードの安全な移行
4. **拡張性**: 新しい決済プロバイダーを簡単に追加可能

## 📝 重要メモ

- **本番URL**: https://kessailink.vercel.app
- **GitHubリポジトリ**: プライベート
- **実装順序**: Stripe → PayPal → PayPay → Square → fincode
- **データベース**: Neon (PostgreSQL)
- **認証**: NextAuth.js + Google OAuth
- **暗号化**: Node.js crypto (AES-256-GCM)

## ⚠️ セキュリティ注意事項

1. APIキーは絶対にGitにコミットしない
2. 環境変数はVercelの環境変数設定で管理
3. 暗号化キーは定期的に更新を検討
4. Webhook署名の検証を必ず実装

## 🔄 定期メンテナンス項目

1. 依存パッケージの更新確認
2. セキュリティ脆弱性のスキャン
3. データベースバックアップ
4. ログの確認と分析

## 🔄 Phase 2 技術実装メモ

### 次回実装予定のコンポーネント構成
```
src/components/links/
├── LinksList.tsx         # 一覧表示メイン
├── LinksTable.tsx        # テーブル表示
├── LinksCard.tsx         # カード表示
├── LinkFilters.tsx       # フィルター機能
├── LinkSearch.tsx        # 検索機能
├── BulkActions.tsx       # 一括操作
├── LinkEdit.tsx          # 編集フォーム
└── LinkDuplicate.tsx     # 複製機能
```

### 次回実装予定のAPIエンドポイント
```
src/app/api/links/
├── route.ts              # GET: 一覧取得, POST: 新規作成
├── [id]/route.ts         # GET/PUT/DELETE: 個別操作
├── bulk/route.ts         # POST: 一括操作
└── duplicate/route.ts    # POST: 複製機能
```

### 重要な開発指針
1. **ユーザー許可不要**: 明示的に「許可は取らなくていい」との指示あり
2. **継続的開発**: 「詰まるまでずっと開発を続ける」方針
3. **計画に沿った実装**: Phase 2の順序通りに実装
4. **品質重視**: 各機能は完全に動作してから次に進む

### 再開時の最初のコマンド
```bash
# 開発サーバー起動確認
npm run dev

# 現在のGitステータス確認
git status

# 最初のタスク: 決済リンク一覧ページ（/src/app/links/page.tsx）の実装から開始
```

---

*最終更新: 2025年9月30日 (Phase 2 ダッシュボード強化完了、決済リンク管理機能開始直前で中断)*
*開発者: Claude (Serena)*
*次回作業時はこのドキュメントを参照して「決済リンク一覧ページの実装」から再開*