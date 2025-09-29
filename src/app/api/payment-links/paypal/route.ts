import { NextRequest, NextResponse } from 'next/server';
import PayPalService from '@/lib/paypal';
import { checkServiceConfiguration } from '@/lib/env-validation';
import prisma from '@/lib/prisma';
import {
  createStandardPaymentLink,
  createSuccessResponse,
  createErrorResponse,
  mapToPaymentStatus,
  findPaymentLinkByIdentifier,
  createStandardTransaction,
  type StandardizedPaymentLinkData,
  type StandardizedTransactionData
} from '@/lib/payment-utils';
import { PaymentService } from '@prisma/client';

export async function POST(request: NextRequest) {
  try {
    // TODO: 認証とユーザーPayPal設定確認を実装
    // const session = await getServerSession(authOptions);
    // if (!session?.user) {
    //   return NextResponse.json(
    //     createErrorResponse('認証が必要です', PaymentService.paypal),
    //     { status: 401 }
    //   );
    // }

    // PayPal設定の確認（一時的に環境変数ベース）
    if (!checkServiceConfiguration('paypal')) {
      return NextResponse.json(
        createErrorResponse('PayPalの設定が完了していません', PaymentService.paypal),
        { status: 503 }
      );
    }

    const body = await request.json();
    const {
      title,
      amount,
      currency = 'USD',
      description,
      metadata = {}
    } = body;

    // バリデーション
    if (!title || !amount || amount <= 0) {
      return NextResponse.json(
        createErrorResponse('タイトルと有効な金額が必要です', PaymentService.paypal),
        { status: 400 }
      );
    }

    // 注文IDを生成
    const orderId = `paypal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // PayPal決済を作成
    const paypalService = new PayPalService();
    const paypalResult = await paypalService.createPayment({
      amount: Number(amount),
      currency: currency.toUpperCase(),
      orderId,
      description: description || title,
      metadata,
    });

    if (!paypalResult.success) {
      return NextResponse.json(
        createErrorResponse(paypalResult.error, PaymentService.paypal),
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
      linkUrl: paypalResult.paymentUrl || '',
      stripePaymentIntentId: paypalResult.paymentId || '',
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24時間後
      metadata: metadata ? metadata : undefined
    };

    const paymentLink = await createStandardPaymentLink(paymentLinkData);

    return NextResponse.json(
      createSuccessResponse(paymentLink, PaymentService.paypal)
    );

  } catch (error) {
    console.error('PayPal決済リンク作成エラー:', error);
    return NextResponse.json(
      createErrorResponse(
        error instanceof Error ? error.message : 'PayPal決済リンクの作成に失敗しました',
        PaymentService.paypal
      ),
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get('orderId');
    const paymentId = searchParams.get('paymentId');

    if (!orderId && !paymentId) {
      return NextResponse.json(
        createErrorResponse('orderIdまたはpaymentIdが必要です', PaymentService.paypal),
        { status: 400 }
      );
    }

    let paymentLink;

    if (orderId) {
      paymentLink = await prisma.paymentLink.findUnique({
        where: { id: orderId },
      });
    } else if (paymentId) {
      paymentLink = await findPaymentLinkByIdentifier(paymentId, PaymentService.paypal);
    }

    if (!paymentLink) {
      return NextResponse.json(
        createErrorResponse('決済リンクが見つかりません', PaymentService.paypal),
        { status: 404 }
      );
    }

    // PayPal決済の最新ステータスを取得
    if (paymentLink.stripePaymentIntentId && paymentLink.status === 'pending') {
      try {
        const paypalService = new PayPalService();
        const paypalStatus = await paypalService.getPaymentStatus(paymentLink.stripePaymentIntentId);

        // ステータスが変更されている場合は更新
        if (paypalStatus.status !== 'pending') {
          const newStatus = mapToPaymentStatus(paypalStatus.status, PaymentService.paypal);
          paymentLink = await prisma.paymentLink.update({
            where: { id: paymentLink.id },
            data: { status: newStatus },
          });
        }
      } catch (error) {
        console.error('PayPal決済ステータス更新エラー:', error);
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        id: paymentLink.id,
        title: paymentLink.description,
        amount: paymentLink.amount,
        currency: paymentLink.currency,
        service: PaymentService.paypal,
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
    console.error('PayPal決済リンク取得エラー:', error);
    return NextResponse.json(
      createErrorResponse(
        error instanceof Error ? error.message : 'PayPal決済リンクの取得に失敗しました',
        PaymentService.paypal
      ),
      { status: 500 }
    );
  }
}

// PayPal決済のキャンセル
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get('orderId');
    const paymentId = searchParams.get('paymentId');

    if (!orderId && !paymentId) {
      return NextResponse.json(
        createErrorResponse('orderIdまたはpaymentIdが必要です', PaymentService.paypal),
        { status: 400 }
      );
    }

    let paymentLink;

    if (orderId) {
      paymentLink = await prisma.paymentLink.findUnique({
        where: { id: orderId },
      });
    } else if (paymentId) {
      paymentLink = await findPaymentLinkByIdentifier(paymentId, PaymentService.paypal);
    }

    if (!paymentLink) {
      return NextResponse.json(
        createErrorResponse('決済リンクが見つかりません', PaymentService.paypal),
        { status: 404 }
      );
    }

    if (paymentLink.status === 'succeeded') {
      return NextResponse.json(
        createErrorResponse('完了済みの決済はキャンセルできません', PaymentService.paypal),
        { status: 400 }
      );
    }

    // PayPal決済をキャンセル
    if (paymentLink.stripePaymentIntentId) {
      const paypalService = new PayPalService();
      const cancelResult = await paypalService.cancelPayment(paymentLink.stripePaymentIntentId);

      if (!cancelResult) {
        return NextResponse.json(
          createErrorResponse('PayPal決済のキャンセルに失敗しました', PaymentService.paypal),
          { status: 400 }
        );
      }
    }

    // データベースを更新
    await prisma.paymentLink.update({
      where: { id: paymentLink.id },
      data: { status: 'cancelled' },
    });

    return NextResponse.json({
      success: true,
      message: 'PayPal決済がキャンセルされました',
    });

  } catch (error) {
    console.error('PayPal決済キャンセルエラー:', error);
    return NextResponse.json(
      createErrorResponse(
        error instanceof Error ? error.message : 'PayPal決済のキャンセルに失敗しました',
        PaymentService.paypal
      ),
      { status: 500 }
    );
  }
}