import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { StripePaymentService } from '@/lib/payment-services/stripe';
import { PaymentCredentials, PaymentRequest } from '@/types/payment';

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

    // Stripe決済リンク生成
    const stripeService = new StripePaymentService();
    const result = await stripeService.createPaymentLink(
      credentials as PaymentCredentials,
      cleanedPaymentData
    );

    if (result.success) {
      return NextResponse.json({
        success: true,
        data: result
      });
    } else {
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