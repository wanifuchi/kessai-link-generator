import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import prisma from '@/lib/prisma'
import { createPaymentIntent } from '@/lib/payment'

/**
 * Payment Intent作成専用 API
 * 決済ページから直接呼び出される
 */
export async function POST(request: NextRequest) {
  try {
    const { linkId } = await request.json()

    if (!linkId) {
      return NextResponse.json(
        { error: 'リンクIDが必要です' },
        { status: 400 }
      )
    }

    // 決済リンクを取得
    const paymentLink = await prisma.paymentLink.findUnique({
      where: { id: linkId },
      include: {
        userPaymentConfig: true,
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

    // 既にPayment Intentが作成済みの場合はそれを返す
    if (paymentLink.stripePaymentIntentId) {
      const stripe = require('stripe')(
        JSON.parse(require('@/lib/encryption').decrypt(paymentLink.userPaymentConfig.encryptedConfig)).secretKey
      )

      const existingIntent = await stripe.paymentIntents.retrieve(
        paymentLink.stripePaymentIntentId
      )

      return NextResponse.json({
        clientSecret: existingIntent.client_secret,
        paymentIntentId: existingIntent.id,
      })
    }

    // 新しいPayment Intentを作成
    const paymentIntentResult = await createPaymentIntent({
      linkId: paymentLink.id,
      amount: paymentLink.amount,
      currency: paymentLink.currency,
      description: paymentLink.description || undefined,
      userPaymentConfigId: paymentLink.userPaymentConfigId,
    })

    // Payment Intent IDをデータベースに保存
    await prisma.paymentLink.update({
      where: { id: linkId },
      data: {
        stripePaymentIntentId: paymentIntentResult.paymentIntentId,
      },
    })

    return NextResponse.json(paymentIntentResult)

  } catch (error) {
    console.error('Payment Intent作成エラー:', error)
    return NextResponse.json(
      { error: 'Payment Intentの作成に失敗しました' },
      { status: 500 }
    )
  }
}