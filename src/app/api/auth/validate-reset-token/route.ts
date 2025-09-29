import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { validateResetToken } from '@/lib/password-reset'

// Dynamic server usage for secure operations
export const dynamic = 'force-dynamic'

// トークン検証のバリデーションスキーマ
const validateTokenSchema = z.object({
  token: z.string().min(1, 'トークンが必要です')
})

/**
 * POST /api/auth/validate-reset-token
 * パスワードリセットトークンの検証
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log('リセットトークン検証要求')

    // リクエストデータのバリデーション
    const validatedData = validateTokenSchema.parse(body)
    const { token } = validatedData

    // トークンの検証
    const resetToken = await validateResetToken(token)

    console.log('リセットトークン検証成功:', {
      userId: resetToken.user.id,
      email: resetToken.user.email,
      expiresAt: resetToken.expiresAt
    })

    return NextResponse.json({
      success: true,
      user: {
        email: resetToken.user.email,
        name: resetToken.user.name
      }
    })

  } catch (error) {
    console.error('リセットトークン検証エラー:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: 'リクエストデータが無効です',
        details: error.errors
      }, { status: 400 })
    }

    // トークン検証エラーは400で返す
    const errorMessage = error instanceof Error ? error.message : 'トークンの検証に失敗しました'

    return NextResponse.json({
      success: false,
      error: errorMessage
    }, { status: 400 })
  }
}