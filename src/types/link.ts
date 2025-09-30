import { PaymentService, PaymentStatus, TransactionStatus } from '@prisma/client'

// 決済リンク一覧表示用の型
export interface PaymentLinkWithDetails {
  id: string
  title: string
  description: string | null
  amount: number
  currency: string
  service: PaymentService
  paymentUrl: string
  status: PaymentStatus
  expiresAt: Date | null
  completedAt: Date | null
  createdAt: Date
  transactions: Transaction[]
  paymentConfig: {
    displayName: string
    provider: PaymentService
    isTestMode: boolean
  }
}

// トランザクション情報
export interface Transaction {
  id: string
  amount: number
  currency: string
  service: PaymentService
  status: TransactionStatus
  paidAt: Date | null
  createdAt: Date
}

// ページネーション情報
export interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

// 決済リンク一覧APIレスポンス
export interface PaymentLinksResponse {
  success: boolean
  data: {
    paymentLinks: PaymentLinkWithDetails[]
    pagination: Pagination
  }
  error?: string
}

// 表示モード
export type ViewMode = 'table' | 'card'

// ソートオプション
export type SortField = 'createdAt' | 'amount' | 'status' | 'expiresAt'
export type SortOrder = 'asc' | 'desc'

// フィルターオプション
export interface LinkFilters {
  search?: string
  status?: PaymentStatus[]
  service?: PaymentService[]
  dateFrom?: Date
  dateTo?: Date
}

// 一括操作のアクション
export type BulkAction = 'delete' | 'activate' | 'deactivate' | 'cancel'

// 一括操作リクエスト
export interface BulkActionRequest {
  action: BulkAction
  ids: string[]
  status?: PaymentStatus
}

// 一括操作レスポンス
export interface BulkActionResponse {
  success: boolean
  data?: {
    updated: number
    failed: number
  }
  error?: string
}

// 決済リンク編集リクエスト
export interface UpdatePaymentLinkRequest {
  description?: string
  amount?: number
  expiresAt?: Date
}

// 決済リンク複製リクエスト
export interface DuplicatePaymentLinkRequest {
  sourceId: string
  modifications?: {
    description?: string
    amount?: number
    expiresAt?: Date
  }
}

// テーブルカラム定義
export interface TableColumn {
  key: string
  label: string
  sortable: boolean
  width?: string
  align?: 'left' | 'center' | 'right'
}
