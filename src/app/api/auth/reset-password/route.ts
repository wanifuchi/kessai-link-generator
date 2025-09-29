import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { hash } from 'bcryptjs'
import { validateResetToken, consumeResetToken } from '@/lib/password-reset'
import prisma from '@/lib/prisma'

// Dynamic server usage for secure operations
export const dynamic = 'force-dynamic'

// パスワードリセットのバリデーションスキーマ
const resetPasswordSchema = z.object({
  token: z.string().min(1, 'トークンが必要です'),
  newPassword: z.string().min(8, 'パスワードは8文字以上で入力してください')
})

/**
 * POST /api/auth/reset-password
 * パスワードリセットの実行
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log('パスワードリセット実行要求')

    // リクエストデータのバリデーション
    const validatedData = resetPasswordSchema.parse(body)
    const { token, newPassword } = validatedData

    // トークンの検証
    const resetToken = await validateResetToken(token)
    const userId = resetToken.user.id

    // パスワードのハッシュ化
    const hashedPassword = await hash(newPassword, 12)

    // トランザクションでパスワード更新とトークン削除を実行
    await prisma.$transaction(async (tx) => {
      // パスワードを更新
      await tx.user.update({
        where: { id: userId },
        data: {
          password: hashedPassword,
          updatedAt: new Date()
        }
      })

      // 使用済みトークンを削除
      await tx.passwordResetToken.deleteMany({
        where: { userId }
      })
    })

    console.log('パスワードリセット完了:', {
      userId,
      email: resetToken.user.email
    })

    return NextResponse.json({
      success: true,
      message: 'パスワードが正常に更新されました'
    })

  } catch (error) {
    console.error('パスワードリセットエラー:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: 'リクエストデータが無効です',
        details: error.errors
      }, { status: 400 })
    }

    // トークン検証エラーは400で返す
    if (error instanceof Error && error.message.includes('トークン')) {
      return NextResponse.json({
        success: false,
        error: error.message
      }, { status: 400 })
    }

    return NextResponse.json({
      success: false,
      error: 'パスワードのリセットに失敗しました',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}