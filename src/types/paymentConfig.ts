import { PaymentService } from '@prisma/client'

// 決済プロバイダー別の設定データ型
export interface StripeConfig {
  publishableKey: string
  secretKey: string
  webhookSecret?: string
}

export interface PayPalConfig {
  clientId: string
  clientSecret: string
}

export interface SquareConfig {
  applicationId: string
  accessToken: string
  locationId?: string
}

export interface PayPayConfig {
  merchantId: string
  apiKey: string
  apiSecret: string
}

export interface FincodeConfig {
  shopId: string
  secretKey: string
  publicKey: string
}

// 統一された決済設定データ型
export type PaymentConfigData = {
  [PaymentService.stripe]?: StripeConfig
  [PaymentService.paypal]?: PayPalConfig
  [PaymentService.square]?: SquareConfig
  [PaymentService.paypay]?: PayPayConfig
  [PaymentService.fincode]?: FincodeConfig
}

// UI用の決済設定フォームデータ
export interface PaymentConfigFormData {
  displayName: string
  provider: PaymentService
  isTestMode: boolean
  isActive: boolean
  config: PaymentConfigData[PaymentService]
}

// 決済設定の検証結果
export interface ConfigValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
}

// 接続テスト結果
export interface ConnectionTestResult {
  success: boolean
  message: string
  details?: any
  testedAt: Date
}

// データベース保存用の暗号化設定
export interface EncryptedPaymentConfig {
  id: string
  userId: string
  provider: PaymentService
  displayName: string
  encryptedConfig: string
  isTestMode: boolean
  isActive: boolean
  verifiedAt?: Date
  lastTestedAt?: Date
  createdAt: Date
  updatedAt: Date
}