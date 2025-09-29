import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { generateResetToken, sendPasswordResetEmail } from '@/lib/password-reset'
import prisma from '@/lib/prisma'

// Dynamic server usage for secure operations
export const dynamic = 'force-dynamic'

// パスワードリセット要求のバリデーションスキーマ
const forgotPasswordSchema = z.object({
  email: z.string().email('有効なメールアドレスを入力してください')
})

/**
 * POST /api/auth/forgot-password
 * パスワードリセットメールの送信
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log('パスワードリセット要求:', { email: body.email })

    // リクエストデータのバリデーション
    const validatedData = forgotPasswordSchema.parse(body)
    const { email } = validatedData

    // ユーザーの存在確認
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      select: {
        id: true,
        email: true,
        name: true,
        provider: true
      }
    })

    // セキュリティのため、ユーザーが存在しない場合も成功レスポンスを返す
    // （メールアドレスの存在を推測されることを防ぐ）
    if (!user) {
      console.warn('存在しないメールアドレスへのリセット要求:', email)
      return NextResponse.json({
        success: true,
        message: 'メールアドレスが登録されている場合、パスワードリセットメールを送信しました'
      })
    }

    // Google OAuth ユーザーの場合はリセット不可
    if (user.provider === 'google') {
      return NextResponse.json({
        success: false,
        error: 'Googleアカウントでログインしているユーザーはパスワードをリセットできません',
        code: 'GOOGLE_OAUTH_USER'
      }, { status: 400 })
    }

    // リセットトークンの生成と保存
    const { token, expiresAt } = await generateResetToken(user.id)

    // パスワードリセットメールの送信
    try {
      await sendPasswordResetEmail(user.email, user.name || 'ユーザー', token)

      console.log('パスワードリセットメール送信成功:', {
        userId: user.id,
        email: user.email,
        expiresAt
      })

      return NextResponse.json({
        success: true,
        message: 'パスワードリセットメールを送信しました。メールをご確認ください'
      })

    } catch (emailError) {
      console.error('メール送信エラー:', emailError)

      // メール送信失敗時はトークンを削除
      await prisma.passwordResetToken.deleteMany({
        where: { userId: user.id }
      })

      return NextResponse.json({
        success: false,
        error: 'メールの送信に失敗しました。しばらく後に再度お試しください',
        code: 'EMAIL_SEND_FAILED'
      }, { status: 500 })
    }

  } catch (error) {
    console.error('パスワードリセット要求エラー:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: 'リクエストデータが無効です',
        details: error.errors
      }, { status: 400 })
    }

    return NextResponse.json({
      success: false,
      error: 'パスワードリセット要求の処理に失敗しました',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}