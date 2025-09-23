# Webhook設定ガイド

## Stripe Webhook設定

### 1. Stripe Dashboard設定

1. **Stripe Dashboardにログイン**
   - [Stripe Dashboard](https://dashboard.stripe.com/) にアクセス
   - 開発者 → Webhooks セクションに移動

2. **新しいWebhookエンドポイントを作成**
   ```
   エンドポイントURL: https://your-domain.vercel.app/api/webhooks/stripe
   ```

3. **監視するイベントを選択**
   以下のイベントを追加してください：
   ```
   checkout.session.completed
   checkout.session.expired
   payment_intent.succeeded
   payment_intent.payment_failed
   invoice.payment_succeeded
   invoice.payment_failed
   ```

4. **Webhook署名シークレットを取得**
   - Webhookエンドポイント作成後、「署名シークレット」をコピー
   - これをVercel環境変数として設定します

### 2. Vercel環境変数設定

以下の環境変数をVercel環境設定に追加してください：

#### 必須環境変数

```bash
# データベース接続
DATABASE_URL="postgresql://postgres:password@host:port/database"

# 暗号化キー (32文字の安全な文字列)
ENCRYPTION_SECRET="your-32-character-encryption-key"

# セッション設定
SESSION_SECRET="your-session-secret-key"
NEXTAUTH_SECRET="your-nextauth-secret-key"

# Stripe設定
STRIPE_SECRET_KEY="sk_test_... または sk_live_..."
STRIPE_WEBHOOK_SECRET="whsec_..."

# Next.js設定
NEXTAUTH_URL="https://your-domain.vercel.app"
NODE_ENV="production"
```

#### Vercel環境変数設定手順

1. **Vercel Dashboard**
   - プロジェクトページに移動
   - Settings → Environment Variables

2. **各環境変数を追加**
   ```
   Name: DATABASE_URL
   Value: postgresql://postgres:yTKGZBNgHtMqjHpxiLJGTPSmZeXTXGxl@caboose.proxy.rlwy.net:47317/railway
   Environment: Production, Preview, Development

   Name: ENCRYPTION_SECRET
   Value: dev-secure-32-character-key-12345
   Environment: Production, Preview, Development

   Name: SESSION_SECRET
   Value: dev-session-secret-key-123456789
   Environment: Production, Preview, Development

   Name: NEXTAUTH_SECRET
   Value: dev-nextauth-secret-key-123456789
   Environment: Production, Preview, Development

   Name: NEXTAUTH_URL
   Value: https://your-domain.vercel.app
   Environment: Production, Preview

   Name: STRIPE_SECRET_KEY
   Value: [Stripe Dashboard から取得]
   Environment: Production, Preview, Development

   Name: STRIPE_WEBHOOK_SECRET
   Value: [Stripe Webhook設定から取得]
   Environment: Production, Preview, Development

   Name: NODE_ENV
   Value: production
   Environment: Production
   ```

### 3. Webhook動作確認

#### テスト手順

1. **決済リンクを生成**
   - アプリケーションで決済リンクを作成
   - Stripe決済ページで決済を完了

2. **Webhook受信確認**
   - Vercelの関数ログを確認
   - Stripe DashboardのWebhookログを確認

3. **データベース更新確認**
   - Prisma Studioまたはダッシュボードで取引状況を確認
   - トランザクションステータスが適切に更新されることを確認

#### ログ確認方法

**Vercel関数ログ**
```bash
# Vercel CLIを使用
vercel logs --app=your-app-name

# またはVercel Dashboardから
# Functions → View Function Logs
```

**Stripe Webhookログ**
```
Stripe Dashboard → 開発者 → Webhooks → エンドポイントを選択 → 詳細
```

### 4. セキュリティ考慮事項

#### Webhook署名検証
```typescript
// 既に実装済み
event = stripe.webhooks.constructEvent(body, sig, endpointSecret);
```

#### IPアドレス制限（オプション）
Vercelの場合、StripeのWebhook IPアドレスからのアクセスを許可：
```
54.187.174.169
54.187.205.235
54.187.216.72
# 他のStripe Webhook IPアドレス
```

#### レート制限
現在の実装では自動的にレート制限が適用されています。

### 5. トラブルシューティング

#### よくある問題

1. **Webhook署名エラー**
   ```
   エラー: Webhook signature verification failed
   解決: STRIPE_WEBHOOK_SECRETが正しく設定されているか確認
   ```

2. **エンドポイント到達不可**
   ```
   エラー: Webhook endpoint timeout
   解決: Vercelデプロイメントの状態とURL設定を確認
   ```

3. **データベース接続エラー**
   ```
   エラー: Database connection failed
   解決: DATABASE_URLが正しく設定されているか確認
   ```

#### デバッグ手順

1. **ログの確認**
   ```bash
   # Webhookが受信されているか
   grep "Received Stripe webhook event" logs

   # エラーが発生していないか
   grep "ERROR" logs
   ```

2. **Stripe Dashboard確認**
   - Webhookの送信状況
   - レスポンスコード（200 OK が期待される）

3. **データベース状態確認**
   - PaymentLinkとTransactionのレコード状態
   - メタデータの整合性

### 6. 本番環境への移行

#### チェックリスト

- [ ] 本番用Stripe APIキーの設定
- [ ] 本番用Webhook エンドポイントの作成
- [ ] 本番用DATABASE_URLの設定
- [ ] セキュリティキーの更新（ENCRYPTION_SECRET等）
- [ ] NEXTAUTH_URLの本番ドメインへの更新
- [ ] Webhook動作テストの実施
- [ ] エラーログ監視の設定

#### 監視設定

本番環境では以下の監視を推奨：

1. **Webhook失敗アラート**
2. **データベース接続監視**
3. **決済処理成功率の監視**
4. **レスポンス時間の監視**

---

## PayPal Webhook設定

### 1. PayPal Developer Dashboard設定

1. **PayPal Developer Console にログイン**
   - [PayPal Developer](https://developer.paypal.com/) にアクセス
   - My Apps & Credentials セクションに移動

2. **アプリケーションの作成/編集**
   ```
   App Name: Kessai Link Payment System
   Features: Accept payments
   Environment: Sandbox (開発) / Live (本番)
   ```

3. **Webhook エンドポイントの追加**
   ```
   エンドポイントURL: https://your-domain.vercel.app/api/webhooks/paypal
   ```

4. **監視するイベントを選択**
   以下のイベントを追加してください：
   ```
   CHECKOUT.ORDER.APPROVED
   PAYMENT.CAPTURE.COMPLETED
   PAYMENT.CAPTURE.DENIED
   PAYMENT.CAPTURE.PENDING
   PAYMENT.CAPTURE.REFUNDED
   ```

5. **Webhook 詳細の取得**
   - Webhook ID とWebhook Secret をメモ
   - これらをVercel環境変数として設定します

### 2. PayPal環境変数設定

以下の環境変数をVercel環境設定に追加してください：

#### PayPal環境変数

```bash
# PayPal設定
PAYPAL_CLIENT_ID="your-paypal-client-id"
PAYPAL_CLIENT_SECRET="your-paypal-client-secret"
PAYPAL_WEBHOOK_SECRET="your-webhook-secret"
```

#### 開発環境と本番環境の切り替え

**Sandbox（開発環境）**:
- PayPal Developer Console の Sandbox アプリから取得
- テスト用アカウントでの決済が可能

**Live（本番環境）**:
- PayPal Developer Console の Live アプリから取得
- 実際の決済処理

### 3. PayPal Webhook動作確認

#### テスト手順

1. **決済フローのテスト**
   - アプリケーションで決済リンクを作成
   - PayPal決済を選択
   - PayPal決済ページで決済を完了

2. **Webhook受信確認**
   - Vercelの関数ログを確認
   - PayPal Developer Dashboard のWebhookログを確認

3. **データベース更新確認**
   - トランザクションステータスが適切に更新されることを確認
   - PayPal特有のメタデータが正しく保存されることを確認

#### ログ確認方法

**Vercel関数ログ**
```bash
# Vercel CLIを使用
vercel logs --app=your-app-name

# または Vercel Dashboard から
# Functions → View Function Logs
```

**PayPal Webhookログ**
```
PayPal Developer Console → My Apps & Credentials → アプリを選択 → Webhooks → 詳細
```

### 4. PayPal設定のトラブルシューティング

#### よくある問題

1. **Webhook署名エラー**
   ```
   エラー: PayPal webhook signature verification failed
   解決: PAYPAL_WEBHOOK_SECRET が正しく設定されているか確認
   ```

2. **Client ID/Secret エラー**
   ```
   エラー: PayPal authentication failed
   解決: PAYPAL_CLIENT_ID と PAYPAL_CLIENT_SECRET の設定を確認
   ```

3. **環境設定エラー**
   ```
   エラー: Sandbox/Live environment mismatch
   解決: 開発環境と本番環境のAPIキーの整合性を確認
   ```

### 5. セキュリティ考慮事項

#### Webhook署名検証
PayPal Webhookでは署名検証が重要です：
```typescript
// 実装済み
paypalService.verifyWebhookSignature(body, headers);
```

#### 環境の分離
- **Sandbox環境**: テスト用PayPalアカウントでの決済
- **Live環境**: 実際の決済処理

### 6. 本番環境への移行チェックリスト

- [ ] 本番用PayPal APIキーの設定
- [ ] 本番用Webhook エンドポイントの作成
- [ ] PAYPAL_WEBHOOK_SECRET の本番環境での設定
- [ ] PayPal決済テストの実施
- [ ] Webhook動作確認
- [ ] エラーログ監視の設定

### 7. 監視とアラート

本番環境では以下の監視を推奨：

1. **PayPal Webhook失敗アラート**
2. **PayPal API接続監視**
3. **決済処理成功率の監視**
4. **PayPal特有のエラーパターンの監視**

---

*この設定により、決済の自動処理とリアルタイム状態更新が可能になります。*