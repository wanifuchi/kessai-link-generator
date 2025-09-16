import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import { StripePaymentService } from '@/lib/payment-services/stripe';
import { PaymentCredentials, PaymentRequest } from '@/types/payment';

const prisma = new PrismaClient();

// リクエストバリデーション
const createPaymentLinkSchema = z.object({
  credentials: z.object({
    publishableKey: z.string().min(1),
    secretKey: z.string().min(1),
    environment: z.enum(['test', 'live']),
    webhookSecret: z.string().optional(),
  }),
  paymentData: z.object({
    amount: z.number().positive('金額は正の数である必要があります'),
    currency: z.string().min(3).max(3, '通貨コードは3文字である必要があります'),
    productName: z.string().min(1, '商品名は必須です').max(100),
    description: z.string().max(500).optional(),
    quantity: z.number().int().positive().max(1000).optional().default(1),
    customerEmail: z.string().email().optional().or(z.literal('')),
    expiresAt: z.string().optional(),
    successUrl: z.string().url().optional().or(z.literal('')),
    cancelUrl: z.string().url().optional().or(z.literal('')),
    metadata: z.record(z.any()).optional(),
  }),
});

// レート制限
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

function checkRateLimit(ip: string, limit: number = 20, windowMs: number = 60000): boolean {
  const now = Date.now();
  const key = `stripe_${ip}`;
  const record = rateLimitStore.get(key);

  if (!record || now > record.resetTime) {
    rateLimitStore.set(key, { count: 1, resetTime: now + windowMs });
    return true;
  }

  if (record.count >= limit) {
    return false;
  }

  record.count++;
  return true;
}

export async function POST(request: NextRequest) {
  try {
    // レート制限チェック
    const ip = request.headers.get('x-forwarded-for') || 
               request.headers.get('x-real-ip') || 
               'unknown';
    
    if (!checkRateLimit(ip)) {
      return NextResponse.json({
        success: false,
        error: 'Rate limit exceeded. Please try again later.',
      }, { status: 429 });
    }

    const body = await request.json();
    
    // リクエストバリデーション
    const validatedData = createPaymentLinkSchema.parse(body);
    const { credentials, paymentData } = validatedData;

    // 空文字列をundefinedに変換
    const cleanedPaymentData: PaymentRequest = {
      ...paymentData,
      customerEmail: paymentData.customerEmail || undefined,
      expiresAt: paymentData.expiresAt || undefined,
      successUrl: paymentData.successUrl || undefined,
      cancelUrl: paymentData.cancelUrl || undefined,
    };

    // まず仮のデータベースレコードを作成
    const tempPaymentLink = await prisma.paymentLink.create({
      data: {
        title: cleanedPaymentData.productName,
        description: cleanedPaymentData.description,
        amount: cleanedPaymentData.amount,
        currency: cleanedPaymentData.currency.toLowerCase(),
        quantity: cleanedPaymentData.quantity || 1,
        service: 'STRIPE',
        serviceId: '', // 後で更新
        paymentUrl: '', // 後で更新
        qrCodeUrl: null,
        qrCodeData: null,
        customerEmail: cleanedPaymentData.customerEmail,
        successUrl: cleanedPaymentData.successUrl,
        cancelUrl: cleanedPaymentData.cancelUrl,
        expiresAt: cleanedPaymentData.expiresAt ? new Date(cleanedPaymentData.expiresAt) : null,
        status: 'ACTIVE',
        metadata: {
          ...cleanedPaymentData.metadata,
          paymentLinkId: '' // 後で自分のIDで更新
        },
      }
    });

    // PaymentLinkIDをメタデータに含めてStripe決済リンクを生成
    const enhancedPaymentData = {
      ...cleanedPaymentData,
      metadata: {
        ...cleanedPaymentData.metadata,
        paymentLinkId: tempPaymentLink.id,
        dbRecordId: tempPaymentLink.id
      }
    };

    const stripeService = new StripePaymentService();
    const result = await stripeService.createPaymentLink(
      credentials as PaymentCredentials,
      enhancedPaymentData
    );

    if (result.success) {
      try {
        // データベースレコードを更新
        const updatedPaymentLink = await prisma.paymentLink.update({
          where: { id: tempPaymentLink.id },
          data: {
            serviceId: result.linkId || '',
            paymentUrl: result.url || '',
            qrCodeUrl: result.qrCode,
            qrCodeData: result.qrCode,
            metadata: {
              ...enhancedPaymentData.metadata,
              stripePaymentLinkId: result.linkId || '',
              stripeUrl: result.url
            }
          }
        });

        return NextResponse.json({
          success: true,
          data: {
            ...result,
            dbRecord: updatedPaymentLink
          }
        });
      } catch (dbError) {
        console.error('Database update error:', dbError);
        // データベース更新に失敗した場合でも、仮レコードは存在するので警告付きで成功レスポンス
        return NextResponse.json({
          success: true,
          data: result,
          warning: 'Payment link created but database update failed',
          dbRecordId: tempPaymentLink.id
        });
      }
    } else {
      // Stripe決済リンク作成に失敗した場合は、作成した仮レコードを削除
      try {
        await prisma.paymentLink.delete({
          where: { id: tempPaymentLink.id }
        });
      } catch (deleteError) {
        console.error('Failed to clean up temporary payment link record:', deleteError);
      }

      return NextResponse.json({
        success: false,
        error: result.error,
        details: result.errorDetails
      }, { status: 400 });
    }

  } catch (error) {
    console.error('Stripe payment link creation error:', error);

    // バリデーションエラー
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: 'Invalid request data',
        details: error.errors.map(err => ({
          path: err.path.join('.'),
          message: err.message
        }))
      }, { status: 400 });
    }

    // Stripeエラー
    if (error && typeof error === 'object' && 'type' in error) {
      const stripeError = error as any;
      
      let userMessage = 'Stripe APIでエラーが発生しました';
      
      switch (stripeError.type) {
        case 'StripeCardError':
          userMessage = 'カード情報に問題があります';
          break;
        case 'StripeInvalidRequestError':
          userMessage = 'リクエストパラメータが無効です';
          break;
        case 'StripeAPIError':
          userMessage = 'Stripe APIに一時的な問題が発生しています';
          break;
        case 'StripeConnectionError':
          userMessage = 'Stripeへの接続に失敗しました';
          break;
        case 'StripeAuthenticationError':
          userMessage = 'Stripe認証情報が無効です';
          break;
        case 'StripeRateLimitError':
          userMessage = 'API呼び出し回数の上限に達しました';
          break;
      }

      return NextResponse.json({
        success: false,
        error: userMessage,
        code: stripeError.code,
        type: stripeError.type
      }, { status: 400 });
    }

    // その他のエラー
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// GET リクエストでヘルスチェック
export async function GET() {
  return NextResponse.json({
    success: true,
    service: 'stripe',
    message: 'Stripe payment link API is running',
    features: [
      'Payment Link creation',
      'Product management',
      'Price configuration',
      'Metadata support',
      'Expiration handling',
      'Redirect URLs'
    ],
    supportedCurrencies: [
      'JPY', 'USD', 'EUR', 'GBP', 'AUD', 'CAD', 'SGD', 'CHF', 
      'NOK', 'SEK', 'DKK', 'HKD', 'MYR'
    ],
    timestamp: new Date().toISOString()
  });
}

// OPTIONS リクエストへの対応（CORS対応）
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}