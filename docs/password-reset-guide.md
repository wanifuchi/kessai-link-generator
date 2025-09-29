# パスワードリセット機能ガイド

## 概要

Kessai Linkでは、メールアドレスでログインするユーザー向けに安全なパスワードリセット機能を提供しています。この機能により、ユーザーは忘れてしまったパスワードを簡単かつ安全にリセットできます。

## 機能の特徴

### セキュリティ機能

- **安全なトークン生成**: 256ビットランダムトークンをSHA-256でハッシュ化
- **有効期限制御**: トークンは1時間で自動期限切れ
- **ワンタイム使用**: トークンは一度のみ使用可能
- **ユーザー情報保護**: 存在しないメールアドレスでも同じレスポンスを返す
- **OAuth制限**: Googleアカウントユーザーはリセット不可

### ユーザビリティ

- **分かりやすいUI**: 直感的な操作フロー
- **リアルタイム検証**: フロントエンドでの入力検証
- **適切なフィードバック**: 成功・エラー状態の明確な表示
- **自動リダイレクト**: 完了後のスムーズな画面遷移

## 使用方法

### 1. パスワードリセット要求

1. ログインページで「パスワードを忘れた方」をクリック
2. 登録済みメールアドレスを入力
3. 「パスワードリセットメールを送信」ボタンをクリック
4. メール送信完了メッセージを確認

### 2. メール確認とリセット

1. 受信したメールを開く
2. 「パスワードをリセット」ボタンをクリック
3. 新しいパスワードを入力（8文字以上）
4. パスワード確認欄に同じパスワードを入力
5. 「パスワードを更新」ボタンをクリック

### 3. リセット完了

1. 成功メッセージを確認
2. 自動的にログインページへリダイレクト
3. 新しいパスワードでログイン

## API エンドポイント

### パスワードリセット要求

```
POST /api/auth/forgot-password
```

**リクエストボディ:**
```json
{
  "email": "user@example.com"
}
```

**レスポンス（成功）:**
```json
{
  "success": true,
  "message": "パスワードリセットメールを送信しました。メールをご確認ください"
}
```

### トークン検証

```
POST /api/auth/validate-reset-token
```

**リクエストボディ:**
```json
{
  "token": "64文字のランダムトークン"
}
```

**レスポンス（成功）:**
```json
{
  "success": true,
  "user": {
    "email": "user@example.com",
    "name": "ユーザー名"
  }
}
```

### パスワードリセット実行

```
POST /api/auth/reset-password
```

**リクエストボディ:**
```json
{
  "token": "64文字のランダムトークン",
  "newPassword": "新しいパスワード"
}
```

**レスポンス（成功）:**
```json
{
  "success": true,
  "message": "パスワードが正常に更新されました"
}
```

## データベース設計

### PasswordResetToken テーブル

```sql
CREATE TABLE password_reset_tokens (
  id         VARCHAR(30) PRIMARY KEY,
  user_id    VARCHAR(30) NOT NULL,
  token      VARCHAR(64) NOT NULL UNIQUE, -- SHA-256ハッシュ
  expires_at TIMESTAMP   NOT NULL,
  created_at TIMESTAMP   DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- インデックス
CREATE INDEX idx_password_reset_tokens_user_id ON password_reset_tokens(user_id);
CREATE INDEX idx_password_reset_tokens_token ON password_reset_tokens(token);
CREATE INDEX idx_password_reset_tokens_expires_at ON password_reset_tokens(expires_at);
```

## メール送信設定

### 環境変数

```bash
# メールプロバイダー選択（console | resend | nodemailer）
EMAIL_PROVIDER=console

# 送信者メールアドレス
EMAIL_FROM=noreply@kessailink.com

# アプリケーションURL（リセットリンク生成用）
NEXTAUTH_URL=http://localhost:3000

# Resend使用時
RESEND_API_KEY=your_resend_api_key

# Nodemailer/SMTP使用時
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=username
SMTP_PASS=password
```

### メールテンプレート

メールには以下が含まれます：

- **HTML版**: スタイル付きのリッチなメール
- **テキスト版**: プレーンテキストのフォールバック
- **セキュリティ情報**: 有効期限やワンタイム使用の説明
- **手動リンク**: ボタンが機能しない場合の代替手段
- **サポート情報**: お問い合わせ先

## セキュリティ考慮事項

### トークン管理

1. **ランダム性**: 32バイト（256ビット）の暗号学的に安全な乱数
2. **ハッシュ化**: データベースには平文トークンを保存しない
3. **有効期限**: 1時間の短い有効期限で攻撃時間を制限
4. **ワンタイム**: 使用後または新規発行時に既存トークンを削除

### メール送信セキュリティ

1. **情報漏洩防止**: 存在しないアドレスでも同じレスポンス
2. **レート制限**: 同一IPからの大量要求を制限（推奨）
3. **ログ保護**: トークンやパスワードをログに出力しない

### フロントエンド保護

1. **CSRF対策**: Next.jsの標準的なCSRF保護
2. **入力検証**: クライアント・サーバー双方での検証
3. **エラーハンドリング**: 適切なエラーメッセージ表示

## 運用・保守

### 定期クリーンアップ

期限切れトークンの自動削除:

```bash
# 手動実行
npm run cleanup:expired-tokens

# cron設定例（毎時実行）
0 * * * * cd /path/to/project && npm run cleanup:expired-tokens >> /var/log/token-cleanup.log 2>&1
```

### 監視・ログ

重要なイベントは以下のように記録されます：

```javascript
// パスワードリセット要求
console.log('パスワードリセット要求:', { email, timestamp })

// トークン生成
console.log('リセットトークン生成:', { userId, expiresAt })

// メール送信
console.log('リセットメール送信成功:', { email, timestamp })

// パスワード更新
console.log('パスワードリセット完了:', { userId, email, timestamp })
```

### エラー対応

よくあるエラーとその対応：

1. **メール送信失敗**
   - メールプロバイダー設定確認
   - 環境変数の値確認
   - ネットワーク接続確認

2. **トークン生成エラー**
   - データベース接続確認
   - ユーザー存在確認
   - 権限設定確認

3. **無効トークンエラー**
   - トークン有効期限確認
   - URL完全性確認
   - データベース状態確認

## トラブルシューティング

### 開発環境でのテスト

```bash
# API直接テスト
curl -X POST http://localhost:3000/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com"}'

# トークンクリーンアップテスト
npm run cleanup:expired-tokens

# データベース状態確認
npx prisma studio
```

### よくある問題

1. **メールが届かない**
   - 迷惑メールフォルダを確認
   - EMAIL_PROVIDER設定確認
   - 開発環境ではconsoleメールを使用

2. **リセットリンクが無効**
   - トークンの有効期限確認
   - NEXTAUTH_URL設定確認
   - データベース接続確認

3. **パスワード更新できない**
   - 新しいパスワードの要件確認
   - トークンの使用状況確認
   - データベースのトランザクション確認

## 今後の拡張計画

### 予定されている改善

1. **高度なセキュリティ**
   - レート制限の実装
   - 地理的位置情報の確認
   - 異常なアクセス検知

2. **ユーザビリティ向上**
   - 多言語対応
   - カスタマイズ可能なメールテンプレート
   - モバイルアプリ対応

3. **運用機能**
   - 管理者ダッシュボード
   - 詳細なログ分析
   - アラート機能

---

**重要**: 本番環境では適切なメールプロバイダー（Resend、SendGrid等）を設定し、セキュリティ設定を強化してください。