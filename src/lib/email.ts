/**
 * メール送信ライブラリ
 *
 * 複数のメールプロバイダーに対応したメール送信機能
 */

interface EmailOptions {
  to: string
  subject: string
  html: string
  text: string
  from?: string
}

interface EmailProvider {
  name: string
  send: (options: EmailOptions) => Promise<void>
}

/**
 * Console メール送信（開発環境用）
 */
class ConsoleEmailProvider implements EmailProvider {
  name = 'console'

  async send(options: EmailOptions): Promise<void> {
    console.log('\n📧 [メール送信シミュレーション]')
    console.log(`📤 To: ${options.to}`)
    console.log(`📝 Subject: ${options.subject}`)
    console.log(`📄 Text Content:`)
    console.log('─'.repeat(50))
    console.log(options.text)
    console.log('─'.repeat(50))
    console.log('✅ メール送信完了（シミュレーション）\n')
  }
}

/**
 * Resend メール送信（本番環境用）
 */
class ResendEmailProvider implements EmailProvider {
  name = 'resend'

  async send(options: EmailOptions): Promise<void> {
    // Resend実装時にここに実装
    // const { Resend } = require('resend')
    // const resend = new Resend(process.env.RESEND_API_KEY)

    // 現在は開発版として console 出力
    console.log('\n📧 [Resend メール送信（開発版）]')
    console.log(`📤 To: ${options.to}`)
    console.log(`📝 Subject: ${options.subject}`)
    console.log('✅ メール送信完了（開発版）\n')

    // TODO: 実際のResend実装
    // await resend.emails.send({
    //   from: options.from || 'noreply@kessailink.com',
    //   to: options.to,
    //   subject: options.subject,
    //   html: options.html
    // })
  }
}

/**
 * Nodemailer メール送信（SMTP用）
 */
class NodemailerEmailProvider implements EmailProvider {
  name = 'nodemailer'

  async send(options: EmailOptions): Promise<void> {
    // Nodemailer実装時にここに実装
    console.log('\n📧 [Nodemailer メール送信（開発版）]')
    console.log(`📤 To: ${options.to}`)
    console.log(`📝 Subject: ${options.subject}`)
    console.log('✅ メール送信完了（開発版）\n')

    // TODO: 実際のNodemailer実装
  }
}

/**
 * メールプロバイダーの選択と送信
 */
function getEmailProvider(): EmailProvider {
  const provider = process.env.EMAIL_PROVIDER || 'console'

  switch (provider.toLowerCase()) {
    case 'resend':
      return new ResendEmailProvider()
    case 'nodemailer':
    case 'smtp':
      return new NodemailerEmailProvider()
    case 'console':
    default:
      return new ConsoleEmailProvider()
  }
}

/**
 * メール送信のメイン関数
 */
export async function sendEmail(options: EmailOptions): Promise<void> {
  // 環境変数の検証
  if (!options.to || !options.subject) {
    throw new Error('必須フィールド（to, subject）が不足しています')
  }

  // メールアドレスの簡易検証
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(options.to)) {
    throw new Error('無効なメールアドレスです')
  }

  const provider = getEmailProvider()

  try {
    console.log(`📧 メール送信開始 (${provider.name}):`, {
      to: options.to,
      subject: options.subject
    })

    await provider.send({
      ...options,
      from: options.from || process.env.EMAIL_FROM || 'noreply@kessailink.com'
    })

    console.log('✅ メール送信成功:', {
      provider: provider.name,
      to: options.to
    })

  } catch (error) {
    console.error('❌ メール送信エラー:', {
      provider: provider.name,
      to: options.to,
      error: error instanceof Error ? error.message : error
    })

    throw new Error(`メール送信に失敗しました (${provider.name}): ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * メール設定のテスト
 */
export async function testEmailConfiguration(): Promise<{
  success: boolean
  provider: string
  error?: string
}> {
  const provider = getEmailProvider()

  try {
    await sendEmail({
      to: 'test@example.com',
      subject: 'メール設定テスト - Kessai Link',
      html: '<p>これはメール設定のテストです。</p>',
      text: 'これはメール設定のテストです。'
    })

    return {
      success: true,
      provider: provider.name
    }

  } catch (error) {
    return {
      success: false,
      provider: provider.name,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * メールテンプレートのユーティリティ
 */
export const emailTemplates = {
  /**
   * 基本的なHTMLテンプレート
   */
  wrapWithLayout: (content: string, title: string) => `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>${title}</title>
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: 'Hiragino Sans', 'ヒラギノ角ゴシック', sans-serif; line-height: 1.6; color: #333; background-color: #f8fafc; margin: 0; padding: 20px;">
      <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
        ${content}
        <div style="background-color: #f8fafc; padding: 20px 30px; text-align: center; border-top: 1px solid #e2e8f0;">
          <p style="margin: 0; font-size: 12px; color: #94a3b8;">
            © 2024 Kessai Link. All rights reserved.
          </p>
        </div>
      </div>
    </body>
    </html>
  `
}