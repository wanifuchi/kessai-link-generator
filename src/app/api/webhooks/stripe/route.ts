import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import Stripe from 'stripe'
import prisma from '@/lib/prisma'
import { PaymentStatus } from '@prisma/client'

/**
 * Stripe Webhook処理
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const headersList = headers()
    const signature = headersList.get('stripe-signature')

    if (!signature) {
      console.error('Stripe署名がありません')
      return NextResponse.json(
        { error: 'Stripe署名が見つかりません' },
        { status: 400 }
      )
    }

    // 環境変数からWebhookシークレットを取得
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
    if (!webhookSecret) {
      console.error('STRIPE_WEBHOOK_SECRETが設定されていません')
      return NextResponse.json(
        { error: 'Webhook設定エラー' },
        { status: 500 }
      )
    }

    // Stripeイベントを検証
    let event: Stripe.Event
    try {
      // 一時的にStripeインスタンスを作成（署名検証用）
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
        apiVersion: '2024-06-20',
      })

      event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
    } catch (error) {
      console.error('Webhook署名検証エラー:', error)
      return NextResponse.json(
        { error: 'Webhook署名の検証に失敗しました' },
        { status: 400 }
      )
    }

    console.log('Stripeイベント受信:', event.type, event.id)

    // イベントタイプに応じて処理
    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentSucceeded(event.data.object as Stripe.PaymentIntent)
        break

      case 'payment_intent.payment_failed':
        await handlePaymentFailed(event.data.object as Stripe.PaymentIntent)
        break

      case 'payment_intent.canceled':
        await handlePaymentCanceled(event.data.object as Stripe.PaymentIntent)
        break

      default:
        console.log(`未処理のイベントタイプ: ${event.type}`)
    }

    return NextResponse.json({ received: true })

  } catch (error) {
    console.error('Webhook処理エラー:', error)
    return NextResponse.json(
      { error: 'Webhook処理に失敗しました' },
      { status: 500 }
    )
  }
}

/**
 * 決済成功時の処理
 */
async function handlePaymentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  try {
    const linkId = paymentIntent.metadata?.linkId
    if (!linkId) {
      console.error('Payment Intentにリンク情報がありません:', paymentIntent.id)
      return
    }

    // 決済リンクを取得
    const paymentLink = await prisma.paymentLink.findUnique({
      where: { id: linkId },
    })

    if (!paymentLink) {
      console.error('決済リンクが見つかりません:', linkId)
      return
    }

    // 既に処理済みの場合はスキップ
    if (paymentLink.status === 'succeeded') {
      console.log('決済は既に成功として処理済み:', linkId)
      return
    }

    // 決済成功として更新
    await prisma.paymentLink.update({
      where: { id: linkId },
      data: {
        status: 'completed',
        completedAt: new Date(),
        stripePaymentIntentId: paymentIntent.id,
      },
    })

    console.log('決済成功処理完了:', linkId)

  } catch (error) {
    console.error('決済成功処理エラー:', error)
    throw error
  }
}

/**
 * 決済失敗時の処理
 */
async function handlePaymentFailed(paymentIntent: Stripe.PaymentIntent) {
  try {
    const linkId = paymentIntent.metadata?.linkId
    if (!linkId) {
      console.error('Payment Intentにリンク情報がありません:', paymentIntent.id)
      return
    }

    // 決済リンクを取得
    const paymentLink = await prisma.paymentLink.findUnique({
      where: { id: linkId },
    })

    if (!paymentLink) {
      console.error('決済リンクが見つかりません:', linkId)
      return
    }

    // 既に処理済みの場合はスキップ
    if (paymentLink.status === 'failed') {
      console.log('決済は既に失敗として処理済み:', linkId)
      return
    }

    // 決済失敗として更新
    await prisma.paymentLink.update({
      where: { id: linkId },
      data: {
        status: 'failed',
        stripePaymentIntentId: paymentIntent.id,
      },
    })

    console.log('決済失敗処理完了:', linkId)

  } catch (error) {
    console.error('決済失敗処理エラー:', error)
    throw error
  }
}

/**
 * 決済キャンセル時の処理
 */
async function handlePaymentCanceled(paymentIntent: Stripe.PaymentIntent) {
  try {
    const linkId = paymentIntent.metadata?.linkId
    if (!linkId) {
      console.error('Payment Intentにリンク情報がありません:', paymentIntent.id)
      return
    }

    // 決済リンクを取得
    const paymentLink = await prisma.paymentLink.findUnique({
      where: { id: linkId },
    })

    if (!paymentLink) {
      console.error('決済リンクが見つかりません:', linkId)
      return
    }

    // 既に処理済みの場合はスキップ
    if (paymentLink.status === 'cancelled') {
      console.log('決済は既にキャンセルとして処理済み:', linkId)
      return
    }

    // 決済キャンセルとして更新
    await prisma.paymentLink.update({
      where: { id: linkId },
      data: {
        status: 'cancelled',
        stripePaymentIntentId: paymentIntent.id,
      },
    })

    console.log('決済キャンセル処理完了:', linkId)

  } catch (error) {
    console.error('決済キャンセル処理エラー:', error)
    throw error
  }
}