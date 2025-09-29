import { NextRequest, NextResponse } from 'next/server';
import { getSquareService } from '@/lib/square';
import prisma from '@/lib/prisma';
import {
  createStandardPaymentLink,
  createSuccessResponse,
  createErrorResponse,
  mapToPaymentStatus,
  findPaymentLinkByIdentifier,
  type StandardizedPaymentLinkData
} from '@/lib/payment-utils';
import { PaymentService } from '@prisma/client';

export async function POST(request: NextRequest): Promise<NextResponse> {
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
        createErrorResponse('タイトルと有効な金額が必要です', PaymentService.square),
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
        createErrorResponse(squareResult.error || 'Square決済の作成に失敗しました', PaymentService.square),
        { status: 400 }
      );
    }

    // 標準化されたデータ構造で決済リンクを作成
    const paymentLinkData: StandardizedPaymentLinkData = {
      id: orderId,
      userId: 'temp-user-id', // FIXME: 実際のユーザーIDが必要
      userPaymentConfigId: 'temp-config-id', // FIXME: 実際の設定IDが必要
      amount: Number(amount),
      currency: currency.toUpperCase(),
      description: title,
      status: 'pending',
      linkUrl: squareResult.paymentUrl || '',
      stripePaymentIntentId: squareResult.paymentId || '',
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24時間後
      metadata: metadata ? metadata : undefined
    };

    const paymentLink = await createStandardPaymentLink(paymentLinkData);

    return NextResponse.json(
      createSuccessResponse(paymentLink, PaymentService.square)
    );

  } catch (error) {
    console.error('Square決済リンク作成エラー:', error);
    return NextResponse.json(
      createErrorResponse(
        error instanceof Error ? error.message : 'Square決済リンクの作成に失敗しました',
        PaymentService.square
      ),
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get('orderId');
    const paymentId = searchParams.get('paymentId');

    if (!orderId && !paymentId) {
      return NextResponse.json(
        createErrorResponse('orderIdまたはpaymentIdが必要です', PaymentService.square),
        { status: 400 }
      );
    }

    let paymentLink;

    if (orderId) {
      paymentLink = await prisma.paymentLink.findUnique({
        where: { id: orderId },
      });
    } else if (paymentId) {
      paymentLink = await findPaymentLinkByIdentifier(paymentId, PaymentService.square);
    }

    if (!paymentLink) {
      return NextResponse.json(
        createErrorResponse('決済リンクが見つかりません', PaymentService.square),
        { status: 404 }
      );
    }

    // Square決済の最新ステータスを取得
    if (paymentLink.stripePaymentIntentId && paymentLink.status === 'pending') {
      try {
        const squareService = getSquareService();
        const squareStatus = await squareService.getPaymentStatus(paymentLink.stripePaymentIntentId);

        // ステータスが変更されている場合は更新
        if (squareStatus.status !== 'pending') {
          const newStatus = mapToPaymentStatus(squareStatus.status, PaymentService.square);
          paymentLink = await prisma.paymentLink.update({
            where: { id: paymentLink.id },
            data: { status: newStatus },
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
        title: paymentLink.description,
        amount: paymentLink.amount,
        currency: paymentLink.currency,
        provider: PaymentService.square,
        status: paymentLink.status,
        paymentUrl: paymentLink.linkUrl,
        shareUrl: `${process.env.NEXTAUTH_URL}/p/${paymentLink.id}`,
        qrCodeUrl: `/api/qr-code?url=${encodeURIComponent(paymentLink.linkUrl)}`,
        description: paymentLink.description,
        metadata: paymentLink.metadata,
        createdAt: paymentLink.createdAt,
        expiresAt: paymentLink.expiresAt,
      },
    });

  } catch (error) {
    console.error('Square決済リンク取得エラー:', error);
    return NextResponse.json(
      createErrorResponse(
        error instanceof Error ? error.message : 'Square決済リンクの取得に失敗しました',
        PaymentService.square
      ),
      { status: 500 }
    );
  }
}