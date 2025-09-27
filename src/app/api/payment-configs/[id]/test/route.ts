import { NextRequest, NextResponse } from 'next/server'
import { PaymentService } from '@prisma/client'
import { getAuthUser } from '@/lib/auth'
import { PaymentConfigService } from '@/lib/paymentConfigService'
import { ConnectionTestResult } from '@/types/paymentConfig'

/**
 * POST /api/payment-configs/[id]/test
 * 決済プロバイダーとの接続テストを実行
 */
export async function POST(
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

    // プロバイダー別の接続テストを実行
    let testResult: ConnectionTestResult

    switch (config.provider) {
      case PaymentService.stripe:
        testResult = await testStripeConnection(config)
        break
      case PaymentService.paypal:
        testResult = await testPayPalConnection(config)
        break
      case PaymentService.square:
        testResult = await testSquareConnection(config)
        break
      case PaymentService.paypay:
        testResult = await testPayPayConnection(config)
        break
      case PaymentService.fincode:
        testResult = await testFincodeConnection(config)
        break
      default:
        testResult = {
          success: false,
          message: 'サポートされていない決済プロバイダーです',
          testedAt: new Date()
        }
    }

    // テスト結果をデータベースに保存
    await PaymentConfigService.updateTestResult(params.id, user.id, testResult)

    return NextResponse.json(testResult)
  } catch (error) {
    console.error('接続テストエラー:', error)

    const testResult: ConnectionTestResult = {
      success: false,
      message: '接続テストに失敗しました',
      details: error instanceof Error ? error.message : 'Unknown error',
      testedAt: new Date()
    }

    return NextResponse.json(testResult, { status: 500 })
  }
}

/**
 * Stripe接続テスト
 */
async function testStripeConnection(config: any): Promise<ConnectionTestResult> {
  try {
    const stripeConfig = config.config

    // Stripe APIを初期化してアカウント情報を取得
    const response = await fetch('https://api.stripe.com/v1/account', {
      headers: {
        'Authorization': `Bearer ${stripeConfig.secretKey}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    })

    if (!response.ok) {
      const errorData = await response.json()
      return {
        success: false,
        message: `Stripe接続エラー: ${errorData.error?.message || 'API認証に失敗しました'}`,
        details: errorData,
        testedAt: new Date()
      }
    }

    const accountData = await response.json()

    return {
      success: true,
      message: `Stripe接続成功: ${accountData.display_name || accountData.id}`,
      details: {
        accountId: accountData.id,
        email: accountData.email,
        country: accountData.country,
        chargesEnabled: accountData.charges_enabled,
        payoutsEnabled: accountData.payouts_enabled
      },
      testedAt: new Date()
    }
  } catch (error) {
    return {
      success: false,
      message: `Stripe接続テストでエラーが発生しました: ${error instanceof Error ? error.message : 'Unknown error'}`,
      testedAt: new Date()
    }
  }
}

/**
 * PayPal接続テスト
 */
async function testPayPalConnection(config: any): Promise<ConnectionTestResult> {
  try {
    const paypalConfig = config.config
    const baseUrl = config.isTestMode
      ? 'https://api-m.sandbox.paypal.com'
      : 'https://api-m.paypal.com'

    // PayPal OAuth2トークンを取得
    const tokenResponse = await fetch(`${baseUrl}/v1/oauth2/token`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${Buffer.from(`${paypalConfig.clientId}:${paypalConfig.clientSecret}`).toString('base64')}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: 'grant_type=client_credentials'
    })

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.json()
      return {
        success: false,
        message: `PayPal認証エラー: ${errorData.error_description || 'OAuth2認証に失敗しました'}`,
        details: errorData,
        testedAt: new Date()
      }
    }

    const tokenData = await tokenResponse.json()

    // アカウント情報を取得
    const accountResponse = await fetch(`${baseUrl}/v1/identity/oauth2/userinfo?schema=paypalv1.1`, {
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`,
        'Content-Type': 'application/json'
      }
    })

    if (!accountResponse.ok) {
      return {
        success: false,
        message: 'PayPalアカウント情報の取得に失敗しました',
        testedAt: new Date()
      }
    }

    const accountData = await accountResponse.json()

    return {
      success: true,
      message: `PayPal接続成功: ${accountData.email || 'アカウント情報取得完了'}`,
      details: {
        userId: accountData.user_id,
        email: accountData.email,
        verified: accountData.verified_account,
        environment: config.isTestMode ? 'sandbox' : 'live'
      },
      testedAt: new Date()
    }
  } catch (error) {
    return {
      success: false,
      message: `PayPal接続テストでエラーが発生しました: ${error instanceof Error ? error.message : 'Unknown error'}`,
      testedAt: new Date()
    }
  }
}

/**
 * Square接続テスト（基本実装）
 */
async function testSquareConnection(config: any): Promise<ConnectionTestResult> {
  // TODO: Square API実装
  return {
    success: false,
    message: 'Square接続テストは今後実装予定です',
    testedAt: new Date()
  }
}

/**
 * PayPay接続テスト（基本実装）
 */
async function testPayPayConnection(config: any): Promise<ConnectionTestResult> {
  // TODO: PayPay API実装
  return {
    success: false,
    message: 'PayPay接続テストは今後実装予定です',
    testedAt: new Date()
  }
}

/**
 * fincode接続テスト（基本実装）
 */
async function testFincodeConnection(config: any): Promise<ConnectionTestResult> {
  // TODO: fincode API実装
  return {
    success: false,
    message: 'fincode接続テストは今後実装予定です',
    testedAt: new Date()
  }
}