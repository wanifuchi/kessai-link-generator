import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import { PaymentConfigService } from '@/lib/paymentConfigService'
import { PaymentConfigFormData } from '@/types/paymentConfig'

/**
 * GET /api/payment-configs
 * ユーザーの決済設定一覧を取得
 */
export async function GET(request: NextRequest) {
  try {
    // 認証チェック
    const user = await getAuthUser()
    if (!user) {
      return NextResponse.json(
        { error: '認証が必要です' },
        { status: 401 }
      )
    }

    // 決済設定一覧を取得
    const configs = await PaymentConfigService.getUserConfigs(user.id)

    return NextResponse.json(configs)
  } catch (error) {
    console.error('決済設定一覧取得エラー:', error)
    return NextResponse.json(
      { error: '設定の取得に失敗しました' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/payment-configs
 * 新しい決済設定を作成
 */
export async function POST(request: NextRequest) {
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
    const formData = body as PaymentConfigFormData

    // 入力値検証
    if (!formData.displayName || !formData.provider || !formData.config) {
      return NextResponse.json(
        { error: '必須項目が不足しています' },
        { status: 400 }
      )
    }

    // 設定名の長さ制限
    if (formData.displayName.length > 100) {
      return NextResponse.json(
        { error: '設定名は100文字以内で入力してください' },
        { status: 400 }
      )
    }

    // 決済設定を作成
    const config = await PaymentConfigService.createConfig(user.id, formData)

    return NextResponse.json(config, { status: 201 })
  } catch (error) {
    console.error('決済設定作成エラー:', error)

    // エラーメッセージの適切な処理
    if (error instanceof Error) {
      // 既知のエラー（バリデーションエラーなど）
      if (error.message.includes('既に使用されています') ||
          error.message.includes('設定エラー')) {
        return NextResponse.json(
          { error: error.message },
          { status: 400 }
        )
      }
    }

    return NextResponse.json(
      { error: '設定の作成に失敗しました' },
      { status: 500 }
    )
  }
}