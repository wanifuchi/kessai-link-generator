import prisma from '@/lib/prisma';
import { PaymentStatus, TransactionStatus, PaymentService } from '@prisma/client';

/**
 * 決済リンク検索の統一化
 */
export async function findPaymentLinkByIdentifier(
  identifier: string,
  service: PaymentService
) {
  return await prisma.paymentLink.findFirst({
    where: {
      OR: [
        { id: identifier },
        { stripePaymentIntentId: identifier }
      ],
      // サービスフィルターは後で追加（現在はserviceフィールドが存在しない）
    },
    include: {
      transactions: true
    }
  });
}

/**
 * サービス固有のステータスをPaymentStatusに変換
 */
export function mapToPaymentStatus(serviceStatus: string, service: PaymentService): PaymentStatus {
  const normalizedStatus = serviceStatus.toLowerCase();

  switch (normalizedStatus) {
    case 'completed':
    case 'captured':
    case 'approved':
    case 'success':
      return 'succeeded';
    case 'canceled':
    case 'cancelled':
      return 'cancelled';
    case 'failed':
    case 'error':
    case 'declined':
      return 'failed';
    case 'expired':
      return 'expired';
    case 'pending':
    case 'processing':
    case 'authorized':
    default:
      return 'pending';
  }
}

/**
 * サービス固有のステータスをTransactionStatusに変換
 */
export function mapToTransactionStatus(serviceStatus: string, service: PaymentService): TransactionStatus {
  const normalizedStatus = serviceStatus.toLowerCase();

  switch (normalizedStatus) {
    case 'completed':
    case 'captured':
    case 'approved':
    case 'success':
      return 'completed';
    case 'canceled':
    case 'cancelled':
      return 'cancelled';
    case 'failed':
    case 'error':
    case 'declined':
      return 'failed';
    case 'refunded':
    case 'refund':
      return 'refunded';
    case 'pending':
    case 'processing':
    case 'authorized':
    default:
      return 'pending';
  }
}

/**
 * 決済リンクデータの標準化
 */
export interface StandardizedPaymentLinkData {
  id: string;
  userId: string;
  userPaymentConfigId: string;
  amount: number;
  currency: string;
  description: string;
  status: PaymentStatus;
  stripePaymentIntentId?: string;
  linkUrl: string;
  qrCodeUrl?: string;
  expiresAt?: Date;
  metadata?: any;
}

/**
 * トランザクションデータの標準化
 */
export interface StandardizedTransactionData {
  id: string;
  paymentLinkId: string;
  amount: number;
  currency: string;
  service: PaymentService;
  serviceTransactionId?: string;
  customerEmail?: string;
  customerName?: string;
  customerPhone?: string;
  status: TransactionStatus;
  paidAt?: Date;
  metadata?: any;
}

/**
 * 統一されたエラーレスポンス
 */
export interface PaymentErrorResponse {
  success: false;
  error: string;
  service?: PaymentService;
  details?: any;
}

/**
 * 統一された成功レスポンス
 */
export interface PaymentSuccessResponse {
  success: true;
  data: {
    id: string;
    paymentUrl: string;
    qrCodeUrl?: string;
    shareUrl: string;
    service: PaymentService;
    title: string;
    amount: number;
    currency: string;
    status: PaymentStatus;
    expiresAt?: Date;
    paymentType?: string;
    [key: string]: any;
  };
}

/**
 * 統一されたエラーハンドリング
 */
export function createErrorResponse(
  error: string,
  service?: PaymentService,
  details?: any
): PaymentErrorResponse {
  return {
    success: false,
    error,
    service,
    details
  };
}

/**
 * 統一された成功レスポンス作成
 */
export function createSuccessResponse(
  paymentLink: any,
  service: PaymentService,
  additionalData?: any
): PaymentSuccessResponse {
  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';

  return {
    success: true,
    data: {
      id: paymentLink.id,
      paymentUrl: paymentLink.linkUrl,
      qrCodeUrl: `/api/qr-code?url=${encodeURIComponent(paymentLink.linkUrl)}`,
      shareUrl: `${baseUrl}/p/${paymentLink.id}`,
      service,
      title: paymentLink.description || 'Payment',
      amount: paymentLink.amount,
      currency: paymentLink.currency,
      status: paymentLink.status,
      expiresAt: paymentLink.expiresAt,
      ...additionalData
    }
  };
}

/**
 * 決済リンク作成の共通処理
 */
export async function createStandardPaymentLink(
  data: StandardizedPaymentLinkData
) {
  return await prisma.paymentLink.create({
    data: {
      id: data.id,
      userId: data.userId,
      userPaymentConfigId: data.userPaymentConfigId,
      amount: data.amount,
      currency: data.currency,
      description: data.description,
      status: data.status,
      stripePaymentIntentId: data.stripePaymentIntentId,
      linkUrl: data.linkUrl,
      qrCodeUrl: data.qrCodeUrl,
      expiresAt: data.expiresAt,
      metadata: data.metadata
    }
  });
}

/**
 * トランザクション作成の共通処理
 */
export async function createStandardTransaction(
  data: StandardizedTransactionData
) {
  return await prisma.transaction.create({
    data: {
      id: data.id,
      paymentLinkId: data.paymentLinkId,
      amount: data.amount,
      currency: data.currency,
      service: data.service,
      serviceTransactionId: data.serviceTransactionId,
      customerEmail: data.customerEmail,
      customerName: data.customerName,
      customerPhone: data.customerPhone,
      status: data.status,
      paidAt: data.paidAt,
      metadata: data.metadata
    }
  });
}