import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import Stripe from 'stripe';
import { z } from 'zod';

const prisma = new PrismaClient();

// リクエストバリデーション
const createStripePaymentLinkSchema = z.object({
  title: z.string().min(1, 'タイトルは必須です'),
  description: z.string().optional(),
  amount: z.number().positive('金額は正の数である必要があります'),
  currency: z.string().default('jpy'),
  apiSettingId: z.string().min(1, 'API設定IDは必須です'),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('Stripe決済リンク作成リクエスト:', body);

    const validatedData = createStripePaymentLinkSchema.parse(body);

    // API設定を取得
    const apiSetting = await prisma.apiSettings.findUnique({
      where: { id: validatedData.apiSettingId }
    });

    if (!apiSetting || apiSetting.service !== 'stripe' || !apiSetting.isActive) {
      return NextResponse.json({
        success: false,
        error: '有効なStripe API設定が見つかりません'
      }, { status: 400 });
    }

    // TODO: 実際の復号化実装（現在は平文で保存）
    const secretKey = apiSetting.secretKey;

    // Stripeクライアントを初期化
    const stripe = new Stripe(secretKey, {
      apiVersion: '2024-06-20',
    });

    try {
      // Stripeで商品を作成
      const product = await stripe.products.create({
        name: validatedData.title,
        description: validatedData.description,
      });

      // 価格を作成
      const price = await stripe.prices.create({
        product: product.id,
        unit_amount: validatedData.amount,
        currency: validatedData.currency,
      });

      // 決済リンクを作成
      const paymentLink = await stripe.paymentLinks.create({
        line_items: [
          {
            price: price.id,
            quantity: 1,
          },
        ],
        allow_promotion_codes: true,
        automatic_tax: { enabled: false },
      });

      console.log('Stripe決済リンク作成成功:', paymentLink);

      // データベースに保存
      const savedPaymentLink = await prisma.paymentLink.create({
        data: {
          title: validatedData.title,
          description: validatedData.description,
          amount: validatedData.amount,
          currency: validatedData.currency,
          quantity: 1,
          service: 'stripe',
          serviceId: paymentLink.id, // StripeのPayment Link ID
          paymentUrl: paymentLink.url, // Stripeの決済URL
          status: 'pending',
          // メタデータに詳細情報を保存
          metadata: {
            stripeProductId: product.id,
            stripePriceId: price.id,
            environment: apiSetting.environment,
            apiSettingId: validatedData.apiSettingId,
          }
        },
      });

      return NextResponse.json({
        success: true,
        data: savedPaymentLink
      }, { status: 201 });

    } catch (stripeError: any) {
      console.error('Stripe API エラー:', stripeError);

      // Stripeエラーの詳細を返す
      return NextResponse.json({
        success: false,
        error: 'Stripe決済リンクの作成に失敗しました',
        details: stripeError.message || 'Unknown Stripe error',
        stripeError: {
          type: stripeError.type,
          code: stripeError.code,
          message: stripeError.message,
        }
      }, { status: 400 });
    }

  } catch (error) {
    console.error('Stripe決済リンク作成エラー:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: 'リクエストデータが無効です',
        details: error.errors
      }, { status: 400 });
    }

    return NextResponse.json({
      success: false,
      error: 'Stripe決済リンクの作成に失敗しました',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// GET - Stripe決済リンク一覧取得
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;

    const [paymentLinks, total] = await Promise.all([
      prisma.paymentLink.findMany({
        where: { service: 'stripe' },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          transactions: {
            select: {
              id: true,
              status: true,
              amount: true,
              paidAt: true,
            }
          }
        }
      }),
      prisma.paymentLink.count({ where: { service: 'stripe' } })
    ]);

    return NextResponse.json({
      success: true,
      data: {
        paymentLinks,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        }
      }
    });

  } catch (error) {
    console.error('Stripe決済リンク取得エラー:', error);
    return NextResponse.json({
      success: false,
      error: 'Stripe決済リンクの取得に失敗しました',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
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