import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { StripePaymentService } from '@/lib/payment-services/stripe';
import { PaymentService, PaymentCredentials } from '@/types/payment';

// リクエストバリデーション
const validateRequestSchema = z.object({
  service: z.enum(['stripe', 'paypal', 'square', 'paypay', 'linepay', 'fincode']),
  credentials: z.record(z.any()), // 各サービス固有の構造のため、詳細なバリデーションはサービスクラス内で実行
});

// レート制限のための簡易的なストレージ（本番環境ではRedisを使用推奨）
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

// レート制限チェック
function checkRateLimit(ip: string, limit: number = 10, windowMs: number = 60000): boolean {
  const now = Date.now();
  const key = `validate_${ip}`;
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
    const validatedData = validateRequestSchema.parse(body);
    const { service, credentials } = validatedData;

    // サービス別の認証情報検証
    const validationResult = await validateServiceCredentials(service, credentials as PaymentCredentials);

    return NextResponse.json({
      success: true,
      data: validationResult
    });

  } catch (error) {
    console.error('Credentials validation error:', error);

    // バリデーションエラー
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: 'Invalid request format',
        details: error.errors
      }, { status: 400 });
    }

    // その他のエラー
    return NextResponse.json({
      success: false,
      error: 'Validation failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

async function validateServiceCredentials(
  service: PaymentService, 
  credentials: PaymentCredentials
): Promise<{
  isValid: boolean;
  service: PaymentService;
  environment?: string;
  error?: string;
  details?: any;
}> {
  
  try {
    switch (service) {
      case 'stripe':
        return await validateStripeCredentials(credentials);
      
      case 'paypal':
        return await validatePayPalCredentials(credentials);
      
      case 'square':
        return await validateSquareCredentials(credentials);
      
      case 'paypay':
        return await validatePayPayCredentials(credentials);
      
      case 'linepay':
        return await validateLinePayCredentials(credentials);
      
      case 'fincode':
        return await validateFincodeCredentials(credentials);
      
      default:
        return {
          isValid: false,
          service,
          error: `Unsupported service: ${service}`
        };
    }
  } catch (error) {
    console.error(`${service} validation error:`, error);
    return {
      isValid: false,
      service,
      error: 'Validation process failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

async function validateStripeCredentials(credentials: PaymentCredentials) {
  const stripeService = new StripePaymentService();
  
  try {
    const isValid = await stripeService.validateCredentials(credentials);
    const stripeCredentials = credentials as any;
    
    return {
      isValid,
      service: 'stripe' as PaymentService,
      environment: stripeCredentials.environment,
      ...(isValid ? {} : { error: 'Invalid Stripe credentials' })
    };
  } catch (error) {
    return {
      isValid: false,
      service: 'stripe' as PaymentService,
      error: 'Stripe validation failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

async function validatePayPalCredentials(credentials: PaymentCredentials) {
  // PayPal認証情報の検証実装
  // 現在はモックとして基本的なフォーマットチェックのみ
  const paypalCredentials = credentials as any;
  
  const isValid = !!(
    paypalCredentials.clientId &&
    paypalCredentials.clientSecret &&
    paypalCredentials.environment &&
    ['sandbox', 'production'].includes(paypalCredentials.environment)
  );

  return {
    isValid,
    service: 'paypal' as PaymentService,
    environment: paypalCredentials.environment,
    ...(isValid ? {} : { error: 'Invalid PayPal credentials format' })
  };
}

async function validateSquareCredentials(credentials: PaymentCredentials) {
  // Square認証情報の検証実装
  // 現在はモックとして基本的なフォーマットチェックのみ
  const squareCredentials = credentials as any;
  
  const isValid = !!(
    squareCredentials.applicationId &&
    squareCredentials.accessToken &&
    squareCredentials.environment &&
    ['sandbox', 'production'].includes(squareCredentials.environment)
  );

  return {
    isValid,
    service: 'square' as PaymentService,
    environment: squareCredentials.environment,
    ...(isValid ? {} : { error: 'Invalid Square credentials format' })
  };
}

async function validatePayPayCredentials(credentials: PaymentCredentials) {
  // PayPay認証情報の検証実装
  // 現在はモックとして基本的なフォーマットチェックのみ
  const paypayCredentials = credentials as any;
  
  const isValid = !!(
    paypayCredentials.merchantId &&
    paypayCredentials.apiKey &&
    paypayCredentials.apiSecret &&
    paypayCredentials.environment &&
    ['test', 'production'].includes(paypayCredentials.environment)
  );

  return {
    isValid,
    service: 'paypay' as PaymentService,
    environment: paypayCredentials.environment,
    ...(isValid ? {} : { error: 'Invalid PayPay credentials format' })
  };
}

async function validateLinePayCredentials(credentials: PaymentCredentials) {
  // LINE Pay認証情報の検証実装
  // 現在はモックとして基本的なフォーマットチェックのみ
  const linepayCredentials = credentials as any;
  
  const isValid = !!(
    linepayCredentials.channelId &&
    linepayCredentials.channelSecret &&
    linepayCredentials.environment &&
    ['beta', 'real'].includes(linepayCredentials.environment)
  );

  return {
    isValid,
    service: 'linepay' as PaymentService,
    environment: linepayCredentials.environment,
    ...(isValid ? {} : { error: 'Invalid LINE Pay credentials format' })
  };
}

async function validateFincodeCredentials(credentials: PaymentCredentials) {
  // fincode認証情報の検証実装
  // 現在はモックとして基本的なフォーマットチェックのみ
  const fincodeCredentials = credentials as any;
  
  const isValid = !!(
    fincodeCredentials.shopId &&
    fincodeCredentials.apiKey &&
    fincodeCredentials.environment &&
    ['test', 'live'].includes(fincodeCredentials.environment)
  );

  return {
    isValid,
    service: 'fincode' as PaymentService,
    environment: fincodeCredentials.environment,
    ...(isValid ? {} : { error: 'Invalid fincode credentials format' })
  };
}

// GET リクエストでヘルスチェック
export async function GET() {
  return NextResponse.json({
    success: true,
    message: 'Credentials validation API is running',
    supportedServices: ['stripe', 'paypal', 'square', 'paypay', 'linepay', 'fincode'],
    timestamp: new Date().toISOString()
  });
}