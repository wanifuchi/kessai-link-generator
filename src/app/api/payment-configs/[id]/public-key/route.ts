import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getStripePublishableKey } from '@/lib/stripe'

/**
 * Stripe公開キー取得 API（決済ページ用）
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    if (!id) {
      return NextResponse.json(
        { error: '設定IDが必要です' },
        { status: 400 }
      )
    }

    // 決済設定を取得
    const paymentConfig = await prisma.userPaymentConfig.findUnique({
      where: { id },
      select: {
        id: true,
        provider: true,
        encryptedConfig: true,
        isActive: true,
      },
    })

    if (!paymentConfig) {
      return NextResponse.json(
        { error: '決済設定が見つかりません' },
        { status: 404 }
      )
    }

    if (!paymentConfig.isActive) {
      return NextResponse.json(
        { error: '決済設定が無効になっています' },
        { status: 400 }
      )
    }

    if (paymentConfig.provider !== 'stripe') {
      return NextResponse.json(
        { error: 'Stripe以外の決済プロバイダーには対応していません' },
        { status: 400 }
      )
    }

    // Stripe公開キーを取得
    try {
      const publishableKey = getStripePublishableKey(paymentConfig.encryptedConfig)

      return NextResponse.json({
        publishableKey,
      })
    } catch (error) {
      console.error('公開キー取得エラー:', error)
      return NextResponse.json(
        { error: '公開キーの取得に失敗しました' },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('決済設定取得エラー:', error)
    return NextResponse.json(
      { error: '決済設定の取得に失敗しました' },
      { status: 500 }
    )
  }
}