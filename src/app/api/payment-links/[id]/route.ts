import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();

const updatePaymentLinkSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  amount: z.number().positive().optional(),
  currency: z.string().optional(),
  quantity: z.number().positive().optional(),
  customerEmail: z.string().email().optional(),
  successUrl: z.string().url().optional(),
  cancelUrl: z.string().url().optional(),
  expiresAt: z.string().datetime().optional(),
  status: z.enum(['ACTIVE', 'EXPIRED', 'DISABLED', 'COMPLETED']).optional(),
  metadata: z.record(z.any()).optional(),
});

// GET - 個別の決済リンク取得
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const paymentLink = await prisma.paymentLink.findUnique({
      where: { id },
      include: {
        transactions: {
          orderBy: { createdAt: 'desc' }
        }
      }
    });
    
    if (!paymentLink) {
      return NextResponse.json({
        success: false,
        error: '決済リンクが見つかりません'
      }, { status: 404 });
    }
    
    return NextResponse.json({
      success: true,
      data: paymentLink
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

// PUT - 決済リンク更新
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const body = await request.json();
    const validatedData = updatePaymentLinkSchema.parse(body);
    
    // 存在確認
    const existingPaymentLink = await prisma.paymentLink.findUnique({
      where: { id }
    });
    
    if (!existingPaymentLink) {
      return NextResponse.json({
        success: false,
        error: '決済リンクが見つかりません'
      }, { status: 404 });
    }
    
    const updatedPaymentLink = await prisma.paymentLink.update({
      where: { id },
      data: {
        ...validatedData,
        expiresAt: validatedData.expiresAt ? new Date(validatedData.expiresAt) : undefined,
        updatedAt: new Date(),
      },
    });
    
    return NextResponse.json({
      success: true,
      data: updatedPaymentLink
    });
    
  } catch (error) {
    console.error('決済リンク更新エラー:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: 'リクエストデータが無効です',
        details: error.errors
      }, { status: 400 });
    }
    
    return NextResponse.json({
      success: false,
      error: '決済リンクの更新に失敗しました',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// DELETE - 決済リンク削除
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    // 存在確認
    const existingPaymentLink = await prisma.paymentLink.findUnique({
      where: { id }
    });
    
    if (!existingPaymentLink) {
      return NextResponse.json({
        success: false,
        error: '決済リンクが見つかりません'
      }, { status: 404 });
    }
    
    // 関連するトランザクションも削除
    await prisma.$transaction([
      prisma.transaction.deleteMany({
        where: { paymentLinkId: id }
      }),
      prisma.paymentLink.delete({
        where: { id }
      })
    ]);
    
    return NextResponse.json({
      success: true,
      message: '決済リンクを削除しました'
    });
    
  } catch (error) {
    console.error('決済リンク削除エラー:', error);
    return NextResponse.json({
      success: false,
      error: '決済リンクの削除に失敗しました',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}