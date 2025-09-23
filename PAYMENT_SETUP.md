# 決済サービス設定ガイド

このドキュメントでは、各決済サービスの設定方法を説明します。

## 🏃‍♂️ クイックスタート

以下の決済サービスから1つ以上を選んで設定してください：

- **Stripe**: 世界中で利用可能、最も簡単に開始
- **PayPal**: グローバル対応、アカウント決済
- **Square**: シンプルな設定、日本でも利用可能
- **PayPay**: 日本特化、QRコード決済、低手数料
- **Fincode**: 日本特化、コンビニ決済対応

## 📋 決済サービス比較

| サービス | 手数料 | 対応通貨 | 特徴 | 設定難易度 |
|---------|--------|----------|------|-----------|
| Stripe | 3.6% | 多通貨 | 世界標準、高機能 | ⭐⭐ |
| PayPal | 3.6% + 40円 | 多通貨 | アカウント決済 | ⭐⭐ |
| Square | 3.25% | 多通貨 | シンプル設計 | ⭐⭐ |
| PayPay | 1.98% | JPYのみ | QRコード決済 | ⭐⭐⭐ |
| Fincode | 3.25% | JPYのみ | コンビニ決済 | ⭐⭐⭐ |

## 🔷 Stripe 設定

### 1. アカウント作成
1. [Stripe Dashboard](https://dashboard.stripe.com/register) でアカウント作成
2. 本人確認書類を提出（本番環境で必要）

### 2. APIキー取得
1. Dashboard → 開発者 → APIキー
2. **公開可能キー** と **シークレットキー** をコピー
3. Webhookエンドポイント作成: `https://yourdomain.com/api/webhooks/stripe`
4. イベント選択: `payment_intent.succeeded`, `payment_intent.payment_failed`

### 3. 環境変数設定
```bash
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
```

---

## 💙 PayPal 設定

### 1. アプリケーション作成
1. [PayPal Developer Console](https://developer.paypal.com/developer/applications/) にログイン
2. 「Create App」をクリック
3. App Type: **Merchant** を選択
4. Features: **Payment** をチェック

### 2. 認証情報取得
1. Client ID と Client Secret をコピー
2. Webhookエンドポイント設定: `https://yourdomain.com/api/webhooks/paypal`
3. イベント選択: `PAYMENT.CAPTURE.COMPLETED`, `PAYMENT.CAPTURE.DENIED`

### 3. 環境変数設定
```bash
PAYPAL_CLIENT_ID="AX..."
PAYPAL_CLIENT_SECRET="EL..."
PAYPAL_ENVIRONMENT="sandbox"  # 本番時は "production"
```

---

## ⬜ Square 設定

### 1. アプリケーション作成
1. [Square Developer Dashboard](https://developer.squareup.com/apps) でアプリ作成
2. OAuth → Redirect URL設定（不要な場合はスキップ）

### 2. 認証情報取得
1. **Application ID** をコピー
2. **Access Token** をコピー
3. **Location ID** をコピー（Store Locations画面から）
4. Webhook Endpoints → 新規作成
5. URL: `https://yourdomain.com/api/webhooks/square`
6. Events: `payment.updated`, `order.updated`

### 3. 環境変数設定
```bash
SQUARE_APPLICATION_ID="sq0idb-..."
SQUARE_ACCESS_TOKEN="EAAA..."
SQUARE_LOCATION_ID="L8..."
SQUARE_ENVIRONMENT="sandbox"  # 本番時は "production"
SQUARE_WEBHOOK_SECRET="..."
```

---

## 📱 PayPay 設定

### 1. パートナー登録
1. [PayPay for Developers](https://developer.paypay.ne.jp/) で登録申請
2. 審査完了後、管理画面にアクセス可能

### 2. API設定
1. 管理画面でアプリケーション作成
2. **Merchant ID**, **API Key**, **API Secret** を取得
3. Webhook URL設定: `https://yourdomain.com/api/webhooks/paypay`

### 3. 環境変数設定
```bash
PAYPAY_MERCHANT_ID="..."
PAYPAY_API_KEY="..."
PAYPAY_API_SECRET="..."
PAYPAY_ENVIRONMENT="sandbox"  # 本番時は "production"
PAYPAY_WEBHOOK_SECRET="..."
```

### 注意事項
- PayPayは法人のみ利用可能
- 審査に時間がかかる場合があります（通常1-2週間）
- 日本円（JPY）のみ対応

---

## 🏦 Fincode 設定

### 1. アカウント開設
1. [Fincode](https://www.fincode.jp/) で法人アカウント開設
2. 必要書類の提出と審査

### 2. API設定
1. 管理画面でショップ作成
2. **Shop ID**, **Secret Key**, **Public Key** を取得
3. Webhook設定: `https://yourdomain.com/api/webhooks/fincode`

### 3. 環境変数設定
```bash
FINCODE_SHOP_ID="s_..."
FINCODE_SECRET_KEY="sk_..."
FINCODE_PUBLIC_KEY="pk_..."
FINCODE_ENVIRONMENT="test"  # 本番時は "live"
FINCODE_WEBHOOK_SECRET="..."
```

### 決済方法
- **card**: クレジットカード決済
- **konbini**: コンビニ決済
- **bank_transfer**: 銀行振込
- **virtual_account**: バーチャル口座

---

## 🚀 デプロイ設定

### 1. 本番環境変数
```bash
# 本番用URL
NEXTAUTH_URL="https://yourdomain.com"

# 各サービスを本番モードに
PAYPAL_ENVIRONMENT="production"
SQUARE_ENVIRONMENT="production"
PAYPAY_ENVIRONMENT="production"
FINCODE_ENVIRONMENT="live"
```

### 2. Webhook URL設定
各サービスで以下のWebhook URLを設定：

- Stripe: `https://yourdomain.com/api/webhooks/stripe`
- PayPal: `https://yourdomain.com/api/webhooks/paypal`
- Square: `https://yourdomain.com/api/webhooks/square`
- PayPay: `https://yourdomain.com/api/webhooks/paypay`
- Fincode: `https://yourdomain.com/api/webhooks/fincode`

### 3. セキュリティ設定
- 全ての秘密鍵は環境変数で管理
- HTTPS必須（本番環境）
- Webhook署名検証を有効にする

---

## 🧪 テスト方法

### 1. ローカルテスト
```bash
# 開発サーバー起動
npm run dev

# ブラウザで確認
http://localhost:3000
```

### 2. Webhook テスト
```bash
# ngrokでローカル環境を公開
npx ngrok http 3000

# 取得したURLをWebhook URLに設定
https://abc123.ngrok.io/api/webhooks/stripe
```

### 3. 決済テスト
各サービスのテストカード/アカウントを使用：

- **Stripe**: `4242 4242 4242 4242`
- **PayPal**: Sandboxアカウント
- **Square**: テストカード番号
- **PayPay**: Sandboxアプリ
- **Fincode**: テスト環境

---

## ❓ よくある問題

### Q: Webhookが動作しない
A: 以下を確認してください：
- Webhook URLが正しく設定されている
- HTTPSを使用している（本番時）
- 署名検証が正しく実装されている

### Q: 決済が完了しない
A: 以下を確認してください：
- APIキーが正しく設定されている
- 環境（sandbox/production）が一致している
- 決済金額の制限を確認

### Q: 日本以外での利用
A: 以下のサービスがグローバル対応：
- Stripe（推奨）
- PayPal
- Square

---

## 📞 サポート

技術的な問題が発生した場合：

1. まずエラーログを確認
2. 各サービスのドキュメントを参照
3. 開発者コミュニティで質問

各サービスの公式ドキュメント：
- [Stripe Docs](https://stripe.com/docs)
- [PayPal Developer](https://developer.paypal.com/)
- [Square Developer](https://developer.squareup.com/)
- [PayPay for Developers](https://developer.paypay.ne.jp/)
- [Fincode API](https://docs.fincode.jp/)