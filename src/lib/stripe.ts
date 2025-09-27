import Stripe from 'stripe'
import { decryptData } from './encryption'
import { StripeConfig } from '@/types/paymentConfig'

/**
 * ユーザーのStripe設定を使用してStripeクライアントを初期化
 */
export function createStripeClient(encryptedConfig: string): Stripe {
  try {
    const config = decryptData<StripeConfig>(encryptedConfig)

    return new Stripe(config.secretKey, {
      apiVersion: '2024-06-20',
      typescript: true,
    })
  } catch (error) {
    throw new Error('Stripe設定の復号化に失敗しました')
  }
}

/**
 * Stripeの公開キーを取得
 */
export function getStripePublishableKey(encryptedConfig: string): string {
  try {
    const config = decryptData<StripeConfig>(encryptedConfig)
    return config.publishableKey
  } catch (error) {
    throw new Error('Stripe公開キーの取得に失敗しました')
  }
}

/**
 * Webhookシークレットを取得
 */
export function getWebhookSecret(encryptedConfig: string): string | undefined {
  try {
    const config = decryptData<StripeConfig>(encryptedConfig)
    return config.webhookSecret
  } catch (error) {
    throw new Error('Webhookシークレットの取得に失敗しました')
  }
}

/**
 * べき等キーを生成
 */
export function generateIdempotencyKey(linkId: string): string {
  return `payment_link_${linkId}_${Date.now()}`
}

/**
 * 金額をStripe形式（セント単位）に変換
 */
export function convertToStripeAmount(amount: number, currency: string): number {
  // JPYなどのゼロ小数点通貨はそのまま、USD等は100倍
  const zeroDecimalCurrencies = ['jpy', 'krw', 'vnd', 'clp']

  if (zeroDecimalCurrencies.includes(currency.toLowerCase())) {
    return Math.round(amount)
  }

  return Math.round(amount * 100)
}

/**
 * Stripe形式の金額を通常の金額に変換
 */
export function convertFromStripeAmount(amount: number, currency: string): number {
  const zeroDecimalCurrencies = ['jpy', 'krw', 'vnd', 'clp']

  if (zeroDecimalCurrencies.includes(currency.toLowerCase())) {
    return amount
  }

  return amount / 100
}