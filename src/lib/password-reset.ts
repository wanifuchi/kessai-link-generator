import { randomBytes, createHash } from 'crypto'
import prisma from '@/lib/prisma'
import { sendEmail } from '@/lib/email'

// リセットトークンの有効期限（1時間）
const RESET_TOKEN_EXPIRY_HOURS = 1

/**
 * パスワードリセット用のトークンを生成して保存
 */
export async function generateResetToken(userId: string) {
  // 既存のトークンを削除
  await prisma.passwordResetToken.deleteMany({
    where: { userId }
  })

  // 安全なランダムトークンを生成（32バイト = 256ビット）
  const rawToken = randomBytes(32).toString('hex')

  // トークンをハッシュ化して保存（DB内では平文保存しない）
  const hashedToken = createHash('sha256').update(rawToken).digest('hex')

  // 有効期限を設定
  const expiresAt = new Date()
  expiresAt.setHours(expiresAt.getHours() + RESET_TOKEN_EXPIRY_HOURS)

  // データベースに保存
  await prisma.passwordResetToken.create({
    data: {
      userId,
      token: hashedToken,
      expiresAt
    }
  })

  console.log('パスワードリセットトークン生成:', {
    userId,
    expiresAt,
    tokenLength: rawToken.length
  })

  return {
    token: rawToken, // 平文トークンをメールで送信
    expiresAt
  }
}

/**
 * トークンの検証と取得
 */
export async function validateResetToken(token: string) {
  if (!token) {
    throw new Error('トークンが提供されていません')
  }

  // トークンをハッシュ化して検索
  const hashedToken = createHash('sha256').update(token).digest('hex')

  const resetToken = await prisma.passwordResetToken.findFirst({
    where: {
      token: hashedToken,
      expiresAt: {
        gt: new Date() // 有効期限内
      }
    },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          name: true
        }
      }
    }
  })

  if (!resetToken) {
    throw new Error('無効または期限切れのトークンです')
  }

  return resetToken
}

/**
 * パスワードリセット完了時にトークンを削除
 */
export async function consumeResetToken(userId: string) {
  const deleteResult = await prisma.passwordResetToken.deleteMany({
    where: { userId }
  })

  console.log('パスワードリセットトークン削除:', {
    userId,
    deletedCount: deleteResult.count
  })

  return deleteResult.count > 0
}

/**
 * 期限切れトークンのクリーンアップ
 */
export async function cleanupExpiredTokens() {
  const deleteResult = await prisma.passwordResetToken.deleteMany({
    where: {
      expiresAt: {
        lt: new Date()
      }
    }
  })

  console.log('期限切れトークンクリーンアップ:', {
    deletedCount: deleteResult.count
  })

  return deleteResult.count
}

/**
 * パスワードリセットメールの送信
 */
export async function sendPasswordResetEmail(
  email: string,
  name: string,
  token: string
) {
  const resetUrl = `${process.env.NEXTAUTH_URL}/auth/reset-password?token=${token}`

  const subject = 'パスワードリセットのご案内 - Kessai Link'

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>パスワードリセット</title>
    </head>
    <body style="font-family: 'Hiragino Sans', 'ヒラギノ角ゴシック', sans-serif; line-height: 1.6; color: #333; background-color: #f8fafc;">
      <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">

        <!-- ヘッダー -->
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 24px; font-weight: 600;">
            🔐 パスワードリセット
          </h1>
          <p style="color: rgba(255, 255, 255, 0.9); margin: 8px 0 0 0; font-size: 14px;">
            Kessai Link
          </p>
        </div>

        <!-- メイン内容 -->
        <div style="padding: 40px 30px;">
          <p style="margin: 0 0 20px 0; font-size: 16px;">
            ${name} 様
          </p>

          <p style="margin: 0 0 20px 0; font-size: 14px; line-height: 1.7;">
            Kessai Link アカウントのパスワードリセットをご要請いただきました。<br>
            下記のボタンをクリックして、新しいパスワードを設定してください。
          </p>

          <!-- リセットボタン -->
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; padding: 14px 32px; border-radius: 6px; font-weight: 600; font-size: 14px; transition: all 0.3s ease;">
              パスワードをリセット
            </a>
          </div>

          <!-- セキュリティ情報 -->
          <div style="background-color: #f1f5f9; border-left: 4px solid #3b82f6; padding: 16px; margin: 30px 0; border-radius: 4px;">
            <h3 style="margin: 0 0 8px 0; font-size: 14px; font-weight: 600; color: #1e40af;">
              🛡️ セキュリティ情報
            </h3>
            <ul style="margin: 0; padding-left: 16px; font-size: 13px; color: #475569;">
              <li>このリンクの有効期限は <strong>1時間</strong> です</li>
              <li>リンクは一度のみ使用可能です</li>
              <li>覚えのない要求の場合は、このメールを無視してください</li>
            </ul>
          </div>

          <!-- 手動リンク -->
          <div style="margin: 30px 0; padding: 16px; background-color: #f8fafc; border-radius: 4px;">
            <p style="margin: 0 0 8px 0; font-size: 13px; color: #64748b;">
              ボタンが機能しない場合は、以下のURLをコピーしてブラウザのアドレスバーに貼り付けてください：
            </p>
            <p style="margin: 0; font-size: 12px; word-break: break-all; color: #3b82f6; background-color: white; padding: 8px; border-radius: 4px; border: 1px solid #e2e8f0;">
              ${resetUrl}
            </p>
          </div>

          <!-- お問い合わせ -->
          <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
            <p style="margin: 0; font-size: 13px; color: #64748b; text-align: center;">
              ご不明な点がございましたら、
              <a href="mailto:support@kessailink.com" style="color: #3b82f6; text-decoration: none;">
                support@kessailink.com
              </a>
              までお問い合わせください
            </p>
          </div>
        </div>

        <!-- フッター -->
        <div style="background-color: #f8fafc; padding: 20px 30px; text-align: center; border-top: 1px solid #e2e8f0;">
          <p style="margin: 0; font-size: 12px; color: #94a3b8;">
            © 2024 Kessai Link. All rights reserved.
          </p>
        </div>

      </div>
    </body>
    </html>
  `

  const text = `
パスワードリセットのご案内 - Kessai Link

${name} 様

Kessai Link アカウントのパスワードリセットをご要請いただきました。
下記のURLにアクセスして、新しいパスワードを設定してください。

${resetUrl}

【重要】
・このリンクの有効期限は1時間です
・リンクは一度のみ使用可能です
・覚えのない要求の場合は、このメールを無視してください

ご不明な点がございましたら、support@kessailink.com までお問い合わせください。

Kessai Link チーム
`

  try {
    await sendEmail({
      to: email,
      subject,
      html,
      text
    })

    console.log('パスワードリセットメール送信成功:', {
      email,
      name,
      resetUrlLength: resetUrl.length
    })

  } catch (error) {
    console.error('パスワードリセットメール送信エラー:', error)
    throw new Error('メールの送信に失敗しました')
  }
}