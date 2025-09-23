import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();

// トランザクション作成のバリデーション
const createTransactionSchema = z.object({
  paymentLinkId: z.string().min(1, '決済リンクIDは必須です'),
  amount: z.number().positive('金額は正の数である必要があります'),
  currency: z.string().min(3).max(3, '通貨コードは3文字である必要があります'),
  service: z.enum(['stripe', 'paypal', 'square', 'paypay', 'fincode']),
  serviceTransactionId: z.string().optional(),
  customerEmail: z.string().email().optional(),
  customerName: z.string().optional(),
  customerPhone: z.string().optional(),
  status: z.enum(['pending', 'completed', 'failed', 'cancelled', 'refunded']).default('pending'),
  paidAt: z.string().datetime().optional(),
  metadata: z.record(z.any()).optional(),
});

// GET - トランザクション一覧取得
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const paymentLinkId = searchParams.get('paymentLinkId');
    const status = searchParams.get('status');
    const service = searchParams.get('service');
    
    const skip = (page - 1) * limit;
    
    const where: any = {};
    if (paymentLinkId) where.paymentLinkId = paymentLinkId;
    if (status) where.status = status.toUpperCase();
    if (service) where.service = service.toUpperCase();
    
    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          paymentLink: {
            select: {
              title: true,
              amount: true,
              currency: true,
            }
          }
        }
      }),
      prisma.transaction.count({ where })
    ]);
    
    return NextResponse.json({
      success: true,
      data: {
        transactions,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        }
      }
    });
    
  } catch (error) {
    console.error('トランザクション取得エラー:', error);
    return NextResponse.json({
      success: false,
      error: 'トランザクションの取得に失敗しました',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// POST - 新しいトランザクション作成（Webhook用）
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = createTransactionSchema.parse(body);
    
    // 決済リンクの存在確認
    const paymentLink = await prisma.paymentLink.findUnique({
      where: { id: validatedData.paymentLinkId }
    });
    
    if (!paymentLink) {
      return NextResponse.json({
        success: false,
        error: '指定された決済リンクが見つかりません'
      }, { status: 404 });
    }
    
    const transaction = await prisma.transaction.create({
      data: {
        ...validatedData,
        paidAt: validatedData.paidAt ? new Date(validatedData.paidAt) : null,
      },
      include: {
        paymentLink: {
          select: {
            title: true,
            amount: true,
            currency: true,
          }
        }
      }
    });
    
    // 決済が完了した場合、決済リンクのステータスを更新
    if (validatedData.status === 'completed') {
      await prisma.paymentLink.update({
        where: { id: validatedData.paymentLinkId },
        data: { status: 'completed' }
      });
    }
    
    return NextResponse.json({
      success: true,
      data: transaction
    }, { status: 201 });
    
  } catch (error) {
    console.error('トランザクション作成エラー:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: 'リクエストデータが無効です',
        details: error.errors
      }, { status: 400 });
    }
    
    return NextResponse.json({
      success: false,
      error: 'トランザクションの作成に失敗しました',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}