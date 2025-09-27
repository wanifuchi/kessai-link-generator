# 決済リンク生成サービス - 作業継続ガイド

最終更新: 2025年9月27日 13:05

## 🎯 プロジェクト概要

**プロジェクト名**: Kessai Link（決済リンク生成サービス）
**アーキテクチャ**: マルチテナント型（ユーザーが独自のAPI認証情報を管理）
**技術スタック**: Next.js 14.2.5, NextAuth.js, Prisma, PostgreSQL (Neon), Vercel

## 📅 開発履歴

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
- **Square**: 🚧 基本構造のみ（API実装待ち）
- **PayPay**: 🚧 基本構造のみ（API実装待ち）
- **fincode**: 🚧 基本構造のみ（API実装待ち）

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

## 🚀 次のフェーズ（未実装）

### フェーズ2: 決済リンク生成システム
1. **決済リンク作成機能**
   - UI: `/create`ページの作成
   - API: `/api/payment-links`エンドポイント
   - QRコード生成機能

2. **Stripe Payment Intents統合**
3. **PayPal Express Checkout統合**
4. **決済リンク管理ダッシュボード**

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
│   │   │   └── payment-configs/       # 決済設定API
│   │   │       ├── route.ts           # 一覧・作成
│   │   │       └── [id]/
│   │   │           ├── route.ts       # CRUD
│   │   │           └── test/route.ts  # 接続テスト
│   │   └── settings/
│   │       └── payments/page.tsx      # 決済設定UI
│   ├── lib/
│   │   ├── auth.ts                    # 認証ユーティリティ
│   │   ├── authOptions.ts             # NextAuth設定
│   │   ├── encryption.ts              # 暗号化処理
│   │   └── paymentConfigService.ts    # ビジネスロジック
│   └── types/
│       └── paymentConfig.ts           # 型定義
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

---

*最終更新: 2025年9月27日 13:05*
*開発者: Claude (Serena)*
*次回作業時はこのドキュメントを参照して速やかに再開可能*