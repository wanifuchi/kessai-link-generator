import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import Stripe from 'stripe'
import prisma from '@/lib/prisma'
import { authOptions } from '@/lib/authOptions'

interface CreatePaymentIntentRequest {
  paymentLinkId: string
}

/**
 * Stripe Payment Intent作成API
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json(
        { error: '認証が必要です' },
        { status: 401 }
      )
    }

    const body: CreatePaymentIntentRequest = await request.json()
    const { paymentLinkId } = body

    if (!paymentLinkId) {
      return NextResponse.json(
        { error: '決済リンクIDが必要です' },
        { status: 400 }
      )
    }

    // 決済リンクを取得
    const paymentLink = await prisma.paymentLink.findUnique({
      where: { id: paymentLinkId },
      include: {
        userPaymentConfig: {
          include: {
            user: true,
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
    if (paymentLink.expiresAt && new Date() > paymentLink.expiresAt) {
      return NextResponse.json(
        { error: '決済リンクの有効期限が切れています' },
        { status: 400 }
      )
    }

    // ステータスチェック
    if (paymentLink.status !== 'pending') {
      return NextResponse.json(
        { error: '決済リンクは既に処理済みです' },
        { status: 400 }
      )
    }

    // Stripe設定チェック
    if (paymentLink.userPaymentConfig.provider !== 'stripe') {
      return NextResponse.json(
        { error: 'Stripe以外の決済プロバイダーです' },
        { status: 400 }
      )
    }

    // Stripeクライアント初期化
    const stripeSecretKey = paymentLink.userPaymentConfig.isTestMode
      ? process.env.STRIPE_TEST_SECRET_KEY
      : process.env.STRIPE_SECRET_KEY

    if (!stripeSecretKey) {
      console.error('Stripe秘密鍵が設定されていません')
      return NextResponse.json(
        { error: 'Stripe設定エラー' },
        { status: 500 }
      )
    }

    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2024-06-20',
    })

    // Payment Intent作成
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(paymentLink.amount * 100), // 円を銭に変換
      currency: paymentLink.currency.toLowerCase(),
      metadata: {
        linkId: paymentLink.id,
        userId: paymentLink.userPaymentConfig.userId,
        merchantEmail: paymentLink.userPaymentConfig.user.email || '',
      },
      description: paymentLink.description || `決済リンク: ${paymentLink.id}`,
      receipt_email: session.user?.email || undefined,
    })

    // 決済リンクにPayment Intent IDを保存
    await prisma.paymentLink.update({
      where: { id: paymentLinkId },
      data: {
        stripePaymentIntentId: paymentIntent.id,
        status: 'pending',
      },
    })

    console.log('Payment Intent作成完了:', {
      linkId: paymentLinkId,
      paymentIntentId: paymentIntent.id,
      amount: paymentLink.amount,
      currency: paymentLink.currency,
    })

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      amount: paymentLink.amount,
      currency: paymentLink.currency,
      description: paymentLink.description,
    })

  } catch (error) {
    console.error('Payment Intent作成エラー:', error)

    if (error instanceof Stripe.errors.StripeError) {
      return NextResponse.json(
        { error: `Stripeエラー: ${error.message}` },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Payment Intentの作成に失敗しました' },
      { status: 500 }
    )
  }
}

/**
 * Payment Intent情報取得API
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json(
        { error: '認証が必要です' },
        { status: 401 }
      )
    }

    const url = new URL(request.url)
    const paymentIntentId = url.searchParams.get('payment_intent_id')

    if (!paymentIntentId) {
      return NextResponse.json(
        { error: 'Payment Intent IDが必要です' },
        { status: 400 }
      )
    }

    // Payment Intent IDから決済リンクを検索
    const paymentLink = await prisma.paymentLink.findFirst({
      where: { stripePaymentIntentId: paymentIntentId },
      include: {
        userPaymentConfig: {
          include: {
            user: true,
          },
        },
      },
    })

    if (!paymentLink) {
      return NextResponse.json(
        { error: '決済情報が見つかりません' },
        { status: 404 }
      )
    }

    // Stripeから最新のPayment Intent情報を取得
    const stripeSecretKey = paymentLink.userPaymentConfig.isTestMode
      ? process.env.STRIPE_TEST_SECRET_KEY
      : process.env.STRIPE_SECRET_KEY

    if (!stripeSecretKey) {
      console.error('Stripe秘密鍵が設定されていません')
      return NextResponse.json(
        { error: 'Stripe設定エラー' },
        { status: 500 }
      )
    }

    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2024-06-20',
    })

    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId)

    return NextResponse.json({
      paymentLinkId: paymentLink.id,
      paymentIntentId: paymentIntent.id,
      status: paymentIntent.status,
      amount: paymentIntent.amount / 100, // 銭を円に変換
      currency: paymentIntent.currency.toUpperCase(),
      description: paymentIntent.description,
      clientSecret: paymentIntent.client_secret,
    })

  } catch (error) {
    console.error('Payment Intent取得エラー:', error)

    if (error instanceof Stripe.errors.StripeError) {
      return NextResponse.json(
        { error: `Stripeエラー: ${error.message}` },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Payment Intent情報の取得に失敗しました' },
      { status: 500 }
    )
  }
}