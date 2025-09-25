import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { requireAuth } from '@/lib/auth';

const prisma = new PrismaClient();

// リクエストバリデーション
const createPaymentLinkSchema = z.object({
  title: z.string().min(1, 'タイトルは必須です'),
  description: z.string().optional(),
  amount: z.number().positive('金額は正の数である必要があります'),
  currency: z.string().default('jpy'),
  quantity: z.number().positive().default(1),
  service: z.enum(['stripe', 'paypal', 'square', 'paypay', 'fincode']),
  serviceId: z.string().min(1, 'サービスIDは必須です'),
  paymentUrl: z.string().url('有効なURLである必要があります'),
  qrCodeUrl: z.string().url().optional(),
  qrCodeData: z.string().optional(),
  customerEmail: z.string().email().optional(),
  successUrl: z.string().url().optional(),
  cancelUrl: z.string().url().optional(),
  expiresAt: z.string().datetime().optional(),
  metadata: z.record(z.any()).optional(),
});

const updatePaymentLinkSchema = createPaymentLinkSchema.partial();

// GET - 決済リンク一覧取得（ユーザー固有）
export async function GET(request: NextRequest) {
  try {
    // 認証確認
    const authResult = await requireAuth(request);
    if ('error' in authResult) {
      return authResult.error;
    }
    const { user } = authResult;

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const service = searchParams.get('service');
    const status = searchParams.get('status');

    const skip = (page - 1) * limit;

    const where: any = {
      userId: user.stackUserId, // ユーザー固有のデータのみ取得
    };
    if (service) where.service = service.toLowerCase();
    if (status) where.status = status.toLowerCase();
    
    const [paymentLinks, total] = await Promise.all([
      prisma.paymentLink.findMany({
        where,
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
      prisma.paymentLink.count({ where })
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
      },
      user: {
        id: user.stackUserId,
        email: user.email
      }
    });
    
  } catch (error) {
    console.error('決済リンク取得エラー:', error);
    return NextResponse.json({
      success: false,
      error: '決済リンクの取得に失敗しました',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// POST - 新しい決済リンク作成（ユーザー固有）
export async function POST(request: NextRequest) {
  try {
    // 認証確認
    const authResult = await requireAuth(request);
    if ('error' in authResult) {
      return authResult.error;
    }
    const { user } = authResult;

    const body = await request.json();
    console.log('決済リンク作成リクエスト:', body);
    const validatedData = createPaymentLinkSchema.parse(body);

    const paymentLink = await prisma.paymentLink.create({
      data: {
        ...validatedData,
        service: validatedData.service as any,
        expiresAt: validatedData.expiresAt ? new Date(validatedData.expiresAt) : null,
        status: 'pending',
        userId: user.stackUserId, // 認証ユーザーIDを設定
      },
    });
    
    return NextResponse.json({
      success: true,
      data: paymentLink
    }, { status: 201 });
    
  } catch (error) {
    console.error('決済リンク作成エラー:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: 'リクエストデータが無効です',
        details: error.errors
      }, { status: 400 });
    }
    
    return NextResponse.json({
      success: false,
      error: '決済リンクの作成に失敗しました',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}