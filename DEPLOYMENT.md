# 決済リンクジェネレーター - Vercel デプロイメントガイド

## デプロイメント手順

### 1. 前提条件

- [Vercel アカウント](https://vercel.com/)
- [GitHub リポジトリ](https://github.com/)
- PostgreSQL データベース（[Neon](https://neon.tech/) または [Vercel Postgres](https://vercel.com/storage/postgres) 推奨）
- Google OAuth アプリケーション
- 必要な決済プロバイダーアカウント

### 2. データベースセットアップ

#### Neon PostgreSQL （推奨）

1. [Neon Console](https://console.neon.tech/) でプロジェクトを作成
2. データベース接続文字列を取得
3. Prisma スキーマを適用:

```bash
# 環境変数を設定
export DATABASE_URL="postgresql://..."

# マイグレーション実行
npx prisma migrate deploy
npx prisma generate
```

#### Vercel Postgres （代替）

1. Vercel Dashboard で Postgres を作成
2. 環境変数が自動設定される
3. マイグレーションを実行

### 3. 環境変数設定

Vercel Dashboard で以下の環境変数を設定:

#### 必須環境変数

```bash
# データベース
DATABASE_URL="postgresql://..."

# 認証
NEXTAUTH_URL="https://your-domain.vercel.app"
NEXTAUTH_SECRET="your-nextauth-secret"
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# セキュリティ
ENCRYPTION_SECRET="32-character-secret-key"
SESSION_SECRET="your-session-secret"

# マーチャント
MERCHANT_EMAIL="support@your-domain.com"
```

#### 決済プロバイダー（使用するもののみ）

```bash
# Stripe
STRIPE_SECRET_KEY="sk_live_..."
STRIPE_WEBHOOK_SECRET="whsec_..."

# PayPal
PAYPAL_CLIENT_ID="your-paypal-client-id"
PAYPAL_CLIENT_SECRET="your-paypal-client-secret"
PAYPAL_ENVIRONMENT="live"

# Square
SQUARE_APPLICATION_ID="your-square-app-id"
SQUARE_ACCESS_TOKEN="your-square-access-token"
SQUARE_LOCATION_ID="your-square-location-id"
SQUARE_ENVIRONMENT="production"
SQUARE_WEBHOOK_SECRET="your-square-webhook-secret"

# PayPay
PAYPAY_MERCHANT_ID="your-paypay-merchant-id"
PAYPAY_API_KEY="your-paypay-api-key"
PAYPAY_API_SECRET="your-paypay-api-secret"
PAYPAY_ENVIRONMENT="live"
PAYPAY_WEBHOOK_SECRET="your-paypay-webhook-secret"

# Fincode
FINCODE_SHOP_ID="your-fincode-shop-id"
FINCODE_SECRET_KEY="your-fincode-secret-key"
FINCODE_PUBLIC_KEY="your-fincode-public-key"
FINCODE_ENVIRONMENT="live"
FINCODE_WEBHOOK_SECRET="your-fincode-webhook-secret"
```

### 4. Google OAuth 設定

1. [Google Cloud Console](https://console.cloud.google.com/) でプロジェクトを作成
2. OAuth 2.0 クライアントを作成:
   - アプリケーションの種類: ウェブアプリケーション
   - 承認済みのリダイレクト URI: `https://your-domain.vercel.app/api/auth/callback/google`
3. クライアントIDとシークレットを Vercel に設定

### 5. Vercel デプロイメント

#### CLI を使用

```bash
# Vercel CLI をインストール
npm i -g vercel

# ログイン
vercel login

# デプロイ
vercel --prod
```

#### GitHub 連携

1. GitHub にリポジトリをプッシュ
2. Vercel Dashboard で「New Project」
3. GitHub リポジトリを選択
4. 環境変数を設定
5. 「Deploy」をクリック

### 6. デプロイ後の設定

#### データベースマイグレーション

デプロイ後、Vercel Functions で Prisma マイグレーションを実行:

```bash
# ローカルから実行
DATABASE_URL="your-production-db-url" npx prisma migrate deploy
```

#### Webhook 設定

各決済プロバイダーで Webhook URL を設定:

- Stripe: `https://your-domain.vercel.app/api/webhooks/stripe`
- PayPal: `https://your-domain.vercel.app/api/webhooks/paypal`
- Square: `https://your-domain.vercel.app/api/webhooks/square`
- PayPay: `https://your-domain.vercel.app/api/webhooks/paypay`
- Fincode: `https://your-domain.vercel.app/api/webhooks/fincode`

### 7. 動作確認

1. アプリケーションにアクセス
2. Google でログイン
3. 決済設定を追加
4. 決済リンクを作成・テスト

## 運用上の注意点

### セキュリティ

- すべての環境変数を適切に設定
- HTTPS のみでアクセス可能に設定
- 定期的にシークレットキーを更新

### 監視

- Vercel Analytics を有効化
- エラーログの監視設定
- パフォーマンス指標の確認

### バックアップ

- データベースの定期バックアップ
- 環境変数の安全な保存
- デプロイ設定のバージョン管理

## トラブルシューティング

### よくある問題

1. **認証エラー**
   - NEXTAUTH_URL が正しく設定されているか確認
   - Google OAuth の リダイレクト URI が正しいか確認

2. **データベース接続エラー**
   - DATABASE_URL が正しく設定されているか確認
   - Prisma マイグレーションが実行されているか確認

3. **決済プロバイダーエラー**
   - API キーが本番環境用か確認
   - Webhook URL が正しく設定されているか確認

### ログ確認

```bash
# Vercel ログを確認
vercel logs your-domain.vercel.app
```

## パフォーマンス最適化

1. **画像最適化**: Next.js Image コンポーネントを使用
2. **バンドルサイズ**: 不要な依存関係を削除
3. **キャッシュ戦略**: API レスポンスの適切なキャッシュ
4. **データベース最適化**: インデックスの設定

## スケーリング

- Vercel Pro プランの検討
- データベース接続プールの設定
- CDN の活用
- 監視・アラートの強化