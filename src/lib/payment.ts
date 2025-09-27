import { createStripeClient, convertToStripeAmount, generateIdempotencyKey } from './stripe'
import prisma from './prisma'
import { PaymentService } from '@prisma/client'

export interface CreatePaymentIntentRequest {
  linkId: string
  amount: number
  currency: string
  description?: string
  userPaymentConfigId: string
}

export interface PaymentIntentResult {
  clientSecret: string
  paymentIntentId: string
}

/**
 * Payment Intentを作成
 */
export async function createPaymentIntent({
  linkId,
  amount,
  currency,
  description,
  userPaymentConfigId,
}: CreatePaymentIntentRequest): Promise<PaymentIntentResult> {
  // ユーザーの決済設定を取得
  const paymentConfig = await prisma.userPaymentConfig.findUnique({
    where: { id: userPaymentConfigId },
  })

  if (!paymentConfig) {
    throw new Error('決済設定が見つかりません')
  }

  if (!paymentConfig.isActive) {
    throw new Error('決済設定が無効になっています')
  }

  if (paymentConfig.provider !== PaymentService.stripe) {
    throw new Error('Stripe以外の決済プロバイダーには対応していません')
  }

  // Stripeクライアントを初期化
  const stripe = createStripeClient(paymentConfig.encryptedConfig)

  // べき等キーを生成
  const idempotencyKey = generateIdempotencyKey(linkId)

  try {
    // Payment Intentを作成
    const paymentIntent = await stripe.paymentIntents.create(
      {
        amount: convertToStripeAmount(amount, currency),
        currency: currency.toLowerCase(),
        description: description || '決済リンクからの支払い',
        metadata: {
          linkId: linkId,
          userPaymentConfigId: userPaymentConfigId,
        },
        automatic_payment_methods: {
          enabled: true,
        },
      },
      {
        idempotencyKey,
      }
    )

    return {
      clientSecret: paymentIntent.client_secret!,
      paymentIntentId: paymentIntent.id,
    }
  } catch (error) {
    console.error('Payment Intent作成エラー:', error)
    throw new Error('Payment Intentの作成に失敗しました')
  }
}

/**
 * Payment Intentのステータスを確認
 */
export async function getPaymentIntentStatus(
  paymentIntentId: string,
  encryptedConfig: string
): Promise<string> {
  const stripe = createStripeClient(encryptedConfig)

  try {
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId)
    return paymentIntent.status
  } catch (error) {
    console.error('Payment Intent取得エラー:', error)
    throw new Error('Payment Intentの取得に失敗しました')
  }
}

/**
 * Payment Intentをキャンセル
 */
export async function cancelPaymentIntent(
  paymentIntentId: string,
  encryptedConfig: string
): Promise<void> {
  const stripe = createStripeClient(encryptedConfig)

  try {
    await stripe.paymentIntents.cancel(paymentIntentId)
  } catch (error) {
    console.error('Payment Intentキャンセルエラー:', error)
    throw new Error('Payment Intentのキャンセルに失敗しました')
  }
}