import { PaymentService } from '@prisma/client'

// 決済リンクの状態
export enum PaymentStatus {
  PENDING = 'pending',
  SUCCEEDED = 'completed',
  FAILED = 'failed',
  EXPIRED = 'expired',
  CANCELLED = 'cancelled',
}

// 決済リンク作成リクエスト
export interface CreatePaymentLinkRequest {
  amount: number
  currency: string
  description?: string
  expiresAt?: Date
  userPaymentConfigId: string
}

// QRコードデータ
export interface QRCodeData {
  dataUrl: string
  svg: string
}

// 決済リンク作成レスポンス
export interface CreatePaymentLinkResponse {
  id: string
  linkUrl: string
  amount: number
  currency: string
  description?: string
  status: PaymentStatus
  expiresAt?: Date
  createdAt: Date
  qrCode?: QRCodeData | null
}

// 決済リンク詳細
export interface PaymentLinkDetails {
  id: string
  userId: string
  userPaymentConfigId: string
  amount: number
  currency: string
  description?: string
  status: PaymentStatus
  stripePaymentIntentId?: string
  linkUrl: string
  expiresAt?: Date
  completedAt?: Date
  createdAt: Date
  updatedAt: Date

  // リレーション
  userPaymentConfig: {
    id: string
    provider: PaymentService
    displayName: string
    isTestMode: boolean
  }
}

// 決済リンク一覧アイテム
export interface PaymentLinkListItem {
  id: string
  amount: number
  currency: string
  description?: string
  status: PaymentStatus
  linkUrl: string
  expiresAt?: Date
  completedAt?: Date
  createdAt: Date

  // 決済設定情報
  paymentConfig: {
    displayName: string
    provider: PaymentService
    isTestMode: boolean
  }
}

// 決済統計情報
export interface PaymentStats {
  totalAmount: number
  totalCount: number
  succeededCount: number
  pendingCount: number
  failedCount: number
  currency: string
}

// Stripe関連の型
export interface StripePaymentResult {
  success: boolean
  paymentIntentId?: string
  error?: string
}

// 決済フォームデータ
export interface PaymentFormData {
  amount: string
  currency: string
  description: string
  expiresInHours: string
  userPaymentConfigId: string
}

// 決済ページの状態
export interface PaymentPageState {
  loading: boolean
  error?: string
  paymentIntent?: {
    id: string
    clientSecret: string
    status: string
  }
}

// Webhook イベント型
export interface WebhookEvent {
  id: string
  type: string
  data: {
    object: any
  }
  created: number
}

// 決済結果通知
export interface PaymentNotification {
  linkId: string
  status: PaymentStatus
  paymentIntentId?: string
  amount: number
  currency: string
  completedAt?: Date
  error?: string
}

// 決済サービス認証情報（汎用型）
export interface PaymentCredentials {
  [key: string]: any
}