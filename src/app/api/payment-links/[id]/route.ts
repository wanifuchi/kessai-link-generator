import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * 決済リンク詳細取得 API（認証不要 - 決済ページ用）
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    if (!id) {
      return NextResponse.json(
        { error: 'リンクIDが必要です' },
        { status: 400 }
      )
    }

    // 決済リンクを取得
    const paymentLink = await prisma.paymentLink.findUnique({
      where: { id },
      include: {
        userPaymentConfig: {
          select: {
            id: true,
            provider: true,
            displayName: true,
            isTestMode: true,
          },
        },
      },
    })

    if (!paymentLink) {
      return NextResponse.json(
        { error: '決済リンクが見つかりません' },
        { status: 404 }
      )
    }

    // 有効期限チェック
    if (paymentLink.expiresAt && paymentLink.expiresAt < new Date()) {
      return NextResponse.json(
        { error: '決済リンクの有効期限が切れています' },
        { status: 400 }
      )
    }

    // 決済状態チェック
    if (paymentLink.status !== 'pending') {
      return NextResponse.json(
        { error: '決済は既に処理されています' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      id: paymentLink.id,
      userId: paymentLink.userId,
      userPaymentConfigId: paymentLink.userPaymentConfigId,
      amount: paymentLink.amount,
      currency: paymentLink.currency,
      description: paymentLink.description,
      status: paymentLink.status,
      stripePaymentIntentId: paymentLink.stripePaymentIntentId,
      linkUrl: paymentLink.linkUrl,
      expiresAt: paymentLink.expiresAt,
      completedAt: paymentLink.completedAt,
      createdAt: paymentLink.createdAt,
      updatedAt: paymentLink.updatedAt,
      userPaymentConfig: paymentLink.userPaymentConfig,
    })

  } catch (error) {
    console.error('決済リンク取得エラー:', error)
    return NextResponse.json(
      { error: '決済リンクの取得に失敗しました' },
      { status: 500 }
    )
  }
}