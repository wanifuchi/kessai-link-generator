import { NextRequest, NextResponse } from 'next/server';
import { getSquareService } from '@/lib/square';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      title,
      amount,
      currency = 'JPY',
      description,
      metadata = {}
    } = body;

    // バリデーション
    if (!title || !amount || amount <= 0) {
      return NextResponse.json(
        { success: false, error: 'タイトルと有効な金額が必要です' },
        { status: 400 }
      );
    }

    // 注文IDを生成
    const orderId = `square_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Square決済を作成
    const squareService = getSquareService();
    const squareResult = await squareService.createPayment({
      amount: Number(amount),
      currency: currency.toUpperCase(),
      orderId,
      description: description || title,
      metadata,
    });

    if (!squareResult.success) {
      return NextResponse.json(
        { success: false, error: squareResult.error },
        { status: 400 }
      );
    }

    // データベースに保存
    const paymentLink = await prisma.paymentLink.create({
      data: {
        id: orderId,
        title,
        amount: Number(amount),
        currency: currency.toUpperCase(),
        service: 'square',
        status: 'pending',
        paymentUrl: squareResult.paymentUrl || '',
        serviceId: squareResult.paymentId || '',
        description,
        metadata: metadata ? JSON.stringify(metadata) : undefined,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24時間後
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        id: paymentLink.id,
        paymentUrl: paymentLink.paymentUrl,
        qrCodeUrl: `/api/qr-code?url=${encodeURIComponent(paymentLink.paymentUrl)}`,
        shareUrl: `${process.env.NEXTAUTH_URL}/p/${paymentLink.id}`,
        service: 'square',
        title: paymentLink.title,
        amount: paymentLink.amount,
        currency: paymentLink.currency,
        status: paymentLink.status,
        expiresAt: paymentLink.expiresAt,
      },
    });

  } catch (error) {
    console.error('Square決済リンク作成エラー:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Square決済リンクの作成に失敗しました'
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get('orderId');
    const paymentId = searchParams.get('paymentId');

    if (!orderId && !paymentId) {
      return NextResponse.json(
        { success: false, error: 'orderIdまたはpaymentIdが必要です' },
        { status: 400 }
      );
    }

    let paymentLink;

    if (orderId) {
      paymentLink = await prisma.paymentLink.findUnique({
        where: { id: orderId },
      });
    } else if (paymentId) {
      paymentLink = await prisma.paymentLink.findFirst({
        where: { serviceId: paymentId },
      });
    }

    if (!paymentLink) {
      return NextResponse.json(
        { success: false, error: '決済リンクが見つかりません' },
        { status: 404 }
      );
    }

    // Square決済の最新ステータスを取得
    if (paymentLink.serviceId && paymentLink.status === 'pending') {
      try {
        const squareService = getSquareService();
        const squareStatus = await squareService.getPaymentStatus(paymentLink.serviceId);

        // ステータスが変更されている場合は更新
        if (squareStatus.status !== 'pending') {
          paymentLink = await prisma.paymentLink.update({
            where: { id: paymentLink.id },
            data: {
              status: squareStatus.status,
            },
          });
        }
      } catch (error) {
        console.error('Square決済ステータス更新エラー:', error);
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        id: paymentLink.id,
        title: paymentLink.title,
        amount: paymentLink.amount,
        currency: paymentLink.currency,
        service: paymentLink.service,
        status: paymentLink.status,
        paymentUrl: paymentLink.paymentUrl,
        shareUrl: `${process.env.NEXTAUTH_URL}/p/${paymentLink.id}`,
        qrCodeUrl: `/api/qr-code?url=${encodeURIComponent(paymentLink.paymentUrl)}`,
        description: paymentLink.description,
        metadata: paymentLink.metadata,
        createdAt: paymentLink.createdAt,
        expiresAt: paymentLink.expiresAt,
      },
    });

  } catch (error) {
    console.error('Square決済リンク取得エラー:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Square決済リンクの取得に失敗しました'
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}