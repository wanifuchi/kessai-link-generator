import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import { PaymentConfigService } from '@/lib/paymentConfigService'
import { PaymentConfigFormData } from '@/types/paymentConfig'

/**
 * GET /api/payment-configs/[id]
 * 個別の決済設定を取得（復号化済み）
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 認証チェック
    const user = await getAuthUser()
    if (!user) {
      return NextResponse.json(
        { error: '認証が必要です' },
        { status: 401 }
      )
    }

    // 設定を取得
    const config = await PaymentConfigService.getConfig(params.id, user.id)
    if (!config) {
      return NextResponse.json(
        { error: '設定が見つかりません' },
        { status: 404 }
      )
    }

    return NextResponse.json(config)
  } catch (error) {
    console.error('決済設定取得エラー:', error)
    return NextResponse.json(
      { error: '設定の取得に失敗しました' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/payment-configs/[id]
 * 決済設定を更新
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 認証チェック
    const user = await getAuthUser()
    if (!user) {
      return NextResponse.json(
        { error: '認証が必要です' },
        { status: 401 }
      )
    }

    // リクエストボディの解析
    const body = await request.json()
    const formData = body as Partial<PaymentConfigFormData>

    // 基本的な入力値検証
    if (formData.displayName && formData.displayName.length > 100) {
      return NextResponse.json(
        { error: '設定名は100文字以内で入力してください' },
        { status: 400 }
      )
    }

    // 決済設定を更新
    const config = await PaymentConfigService.updateConfig(
      params.id,
      user.id,
      formData
    )

    return NextResponse.json(config)
  } catch (error) {
    console.error('決済設定更新エラー:', error)

    // エラーメッセージの適切な処理
    if (error instanceof Error) {
      // 既知のエラー（バリデーションエラーなど）
      if (error.message.includes('見つからない') ||
          error.message.includes('アクセス権限') ||
          error.message.includes('設定エラー')) {
        return NextResponse.json(
          { error: error.message },
          { status: 400 }
        )
      }
    }

    return NextResponse.json(
      { error: '設定の更新に失敗しました' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/payment-configs/[id]
 * 決済設定を削除
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 認証チェック
    const user = await getAuthUser()
    if (!user) {
      return NextResponse.json(
        { error: '認証が必要です' },
        { status: 401 }
      )
    }

    // 決済設定を削除
    await PaymentConfigService.deleteConfig(params.id, user.id)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('決済設定削除エラー:', error)

    // エラーメッセージの適切な処理
    if (error instanceof Error) {
      if (error.message.includes('見つからない') ||
          error.message.includes('アクセス権限')) {
        return NextResponse.json(
          { error: error.message },
          { status: 404 }
        )
      }
    }

    return NextResponse.json(
      { error: '設定の削除に失敗しました' },
      { status: 500 }
    )
  }
}