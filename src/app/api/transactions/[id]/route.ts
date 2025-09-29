import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();

const updateTransactionSchema = z.object({
  amount: z.number().positive().optional(),
  currency: z.string().min(3).max(3).optional(),
  serviceTransactionId: z.string().optional(),
  customerEmail: z.string().email().optional(),
  customerName: z.string().optional(),
  customerPhone: z.string().optional(),
  status: z.enum(['pending', 'completed', 'failed', 'cancelled', 'refunded']).optional(),
  paidAt: z.string().datetime().optional(),
  metadata: z.record(z.any()).optional(),
});

// GET - 個別のトランザクション取得
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const transaction = await prisma.transaction.findUnique({
      where: { id },
      include: {
        paymentLink: {
          select: {
            id: true,
            description: true,
            amount: true,
            currency: true,
            linkUrl: true,
            status: true,
            createdAt: true,
          }
        }
      }
    });
    
    if (!transaction) {
      return NextResponse.json({
        success: false,
        error: 'トランザクションが見つかりません'
      }, { status: 404 });
    }
    
    return NextResponse.json({
      success: true,
      data: transaction
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

// PUT - トランザクション更新
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const body = await request.json();
    const validatedData = updateTransactionSchema.parse(body);
    
    // 存在確認
    const existingTransaction = await prisma.transaction.findUnique({
      where: { id },
      include: { paymentLink: true }
    });
    
    if (!existingTransaction) {
      return NextResponse.json({
        success: false,
        error: 'トランザクションが見つかりません'
      }, { status: 404 });
    }
    
    const updatedTransaction = await prisma.transaction.update({
      where: { id },
      data: {
        ...validatedData,
        paidAt: validatedData.paidAt ? new Date(validatedData.paidAt) : undefined,
        updatedAt: new Date(),
      },
      include: {
        paymentLink: {
          select: {
            id: true,
            amount: true,
            currency: true,
          }
        }
      }
    });
    
    // ステータスがcompletedに変更された場合、決済リンクのステータスも更新
    if (validatedData.status === 'completed' && existingTransaction.status !== 'completed') {
      await prisma.paymentLink.update({
        where: { id: existingTransaction.paymentLinkId },
        data: { status: 'succeeded' }
      });
    }
    
    return NextResponse.json({
      success: true,
      data: updatedTransaction
    });
    
  } catch (error) {
    console.error('トランザクション更新エラー:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: 'リクエストデータが無効です',
        details: error.errors
      }, { status: 400 });
    }
    
    return NextResponse.json({
      success: false,
      error: 'トランザクションの更新に失敗しました',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// DELETE - トランザクション削除
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    // 存在確認
    const existingTransaction = await prisma.transaction.findUnique({
      where: { id }
    });
    
    if (!existingTransaction) {
      return NextResponse.json({
        success: false,
        error: 'トランザクションが見つかりません'
      }, { status: 404 });
    }
    
    await prisma.transaction.delete({
      where: { id }
    });
    
    return NextResponse.json({
      success: true,
      message: 'トランザクションを削除しました'
    });
    
  } catch (error) {
    console.error('トランザクション削除エラー:', error);
    return NextResponse.json({
      success: false,
      error: 'トランザクションの削除に失敗しました',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}