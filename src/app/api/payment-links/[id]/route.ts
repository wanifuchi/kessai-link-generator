import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { requireAuth, verifyOwnership, createOwnershipError } from '@/lib/auth';

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
  status: z.enum(['pending', 'completed', 'failed', 'canceled', 'expired']).optional(),
  metadata: z.record(z.any()).optional(),
});

// GET - 個別の決済リンク取得（所有者確認付き）
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    // 認証確認
    const authResult = await requireAuth(request);
    if ('error' in authResult) {
      return authResult.error;
    }
    const { user } = authResult;

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
        error: '決済リンクが見つかりません',
        code: 'NOT_FOUND'
      }, { status: 404 });
    }

    // 所有者確認
    if (!verifyOwnership(user.stackUserId, paymentLink.userId)) {
      return createOwnershipError();
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

// PUT - 決済リンク更新（所有者確認付き）
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    // 認証確認
    const authResult = await requireAuth(request);
    if ('error' in authResult) {
      return authResult.error;
    }
    const { user } = authResult;

    const body = await request.json();
    console.log('決済リンク更新リクエスト:', { id, ...body });
    const validatedData = updatePaymentLinkSchema.parse(body);

    // 存在と所有者確認
    const existingPaymentLink = await prisma.paymentLink.findUnique({
      where: { id },
      select: { id: true, userId: true, status: true }
    });

    if (!existingPaymentLink) {
      return NextResponse.json({
        success: false,
        error: '決済リンクが見つかりません',
        code: 'NOT_FOUND'
      }, { status: 404 });
    }

    if (!verifyOwnership(user.stackUserId, existingPaymentLink.userId)) {
      return createOwnershipError();
    }

    // 完了済みの決済リンクは更新不可
    if (existingPaymentLink.status === 'completed') {
      return NextResponse.json({
        success: false,
        error: '完了済みの決済リンクは更新できません',
        code: 'CANNOT_UPDATE_COMPLETED'
      }, { status: 400 });
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

// DELETE - 決済リンク削除（所有者確認付き）
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    // 認証確認
    const authResult = await requireAuth(request);
    if ('error' in authResult) {
      return authResult.error;
    }
    const { user } = authResult;

    // 存在と所有者確認
    const existingPaymentLink = await prisma.paymentLink.findUnique({
      where: { id },
      select: {
        id: true,
        userId: true,
        status: true,
        transactions: {
          select: { id: true, status: true }
        }
      }
    });

    if (!existingPaymentLink) {
      return NextResponse.json({
        success: false,
        error: '決済リンクが見つかりません',
        code: 'NOT_FOUND'
      }, { status: 404 });
    }

    if (!verifyOwnership(user.stackUserId, existingPaymentLink.userId)) {
      return createOwnershipError();
    }

    // 完了済みの取引がある場合は削除不可
    const completedTransactions = existingPaymentLink.transactions.filter(
      t => t.status === 'completed'
    );

    if (completedTransactions.length > 0) {
      return NextResponse.json({
        success: false,
        error: '完了済みの取引がある決済リンクは削除できません',
        code: 'CANNOT_DELETE_WITH_COMPLETED_TRANSACTIONS'
      }, { status: 400 });
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