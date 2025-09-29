import { NextRequest, NextResponse } from 'next/server';
import { getPayPayService } from '@/lib/paypay';
import prisma, { withSession } from '@/lib/prisma';
import {
  createStandardPaymentLink,
  createSuccessResponse,
  createErrorResponse,
  mapToPaymentStatus,
  findPaymentLinkByIdentifier,
  type StandardizedPaymentLinkData
} from '@/lib/payment-utils';
import { PaymentService } from '@prisma/client';

export async function POST(request: NextRequest) {
  return withSession(request, async (req, session) => {
    if (!session?.user?.id) {
      return NextResponse.json(
        createErrorResponse('認証が必要です', PaymentService.paypay),
        { status: 401 }
      );
    }

    try {
      const body = await req.json();
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
          createErrorResponse('タイトルと有効な金額が必要です', PaymentService.paypay),
          { status: 400 }
        );
      }

      // PayPayは日本円のみ対応
      if (currency.toUpperCase() !== 'JPY') {
        return NextResponse.json(
          createErrorResponse('PayPayは日本円（JPY）のみ対応しています', PaymentService.paypay),
          { status: 400 }
        );
      }

      // PayPay設定を取得
      const paypayConfig = await prisma.userPaymentConfig.findFirst({
        where: {
          userId: session.user.id,
          service: PaymentService.paypay,
          isActive: true,
        },
      });

      if (!paypayConfig) {
        return NextResponse.json(
          createErrorResponse('PayPay設定が見つかりません', PaymentService.paypay),
          { status: 400 }
        );
      }

      // 注文IDを生成
      const orderId = `paypay_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // PayPay QRコード決済を作成
      const paypayService = getPayPayService();
      const paypayResult = await paypayService.createQRCode({
        amount: Number(amount),
        currency: 'JPY',
        orderId,
        description: description || title,
        metadata: {
          ...metadata,
          storeInfo: metadata.storeInfo || 'オンラインストア',
          terminalInfo: metadata.terminalInfo || 'web',
        },
      });

      if (!paypayResult.success) {
        return NextResponse.json(
          createErrorResponse(paypayResult.error, PaymentService.paypay),
          { status: 400 }
        );
      }

      // 標準化されたデータ構造で決済リンクを作成
      const paymentLinkData: StandardizedPaymentLinkData = {
        id: orderId,
        userId: session.user.id,
        userPaymentConfigId: paypayConfig.id,
        amount: Number(amount),
        currency: 'JPY',
        description: title,
        status: 'pending',
        linkUrl: paypayResult.paymentUrl || '',
        stripePaymentIntentId: paypayResult.paymentId || '',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24時間後
        metadata: metadata ? {
          ...metadata,
          qrCodeData: paypayResult.qrCodeData, // QRコード画像データを保存
        } : {
          qrCodeData: paypayResult.qrCodeData,
        }
      };

      const paymentLink = await createStandardPaymentLink(paymentLinkData);

      return NextResponse.json(
        createSuccessResponse(paymentLink, PaymentService.paypay, {
          qrCodeData: paypayResult.qrCodeData, // PayPay独自のQRコード画像
          paymentType: 'qr_code', // PayPay特有の決済タイプ
        })
      );

    } catch (error) {
      console.error('PayPay決済リンク作成エラー:', error);
      return NextResponse.json(
        createErrorResponse(
          error instanceof Error ? error.message : 'PayPay決済リンクの作成に失敗しました',
          PaymentService.paypay
        ),
        { status: 500 }
      );
    }
  });
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get('orderId');
    const paymentId = searchParams.get('paymentId');

    if (!orderId && !paymentId) {
      return NextResponse.json(
        createErrorResponse('orderIdまたはpaymentIdが必要です', PaymentService.paypay),
        { status: 400 }
      );
    }

    let paymentLink;

    if (orderId) {
      paymentLink = await prisma.paymentLink.findUnique({
        where: { id: orderId },
      });
    } else if (paymentId) {
      paymentLink = await findPaymentLinkByIdentifier(paymentId, PaymentService.paypay);
    }

    if (!paymentLink) {
      return NextResponse.json(
        createErrorResponse('決済リンクが見つかりません', PaymentService.paypay),
        { status: 404 }
      );
    }

    // PayPay決済の最新ステータスを取得
    if (paymentLink.stripePaymentIntentId && paymentLink.status === 'pending') {
      try {
        const paypayService = getPayPayService();
        const paypayStatus = await paypayService.getPaymentStatus(paymentLink.stripePaymentIntentId);

        // ステータスが変更されている場合は更新
        if (paypayStatus.status !== 'pending') {
          const newStatus = mapToPaymentStatus(paypayStatus.status, PaymentService.paypay);
          paymentLink = await prisma.paymentLink.update({
            where: { id: paymentLink.id },
            data: { status: newStatus },
          });
        }
      } catch (error) {
        console.error('PayPay決済ステータス更新エラー:', error);
      }
    }

    // メタデータからQRコードデータを取得
    const metadata = paymentLink.metadata as any;
    const qrCodeData = metadata?.qrCodeData;

    return NextResponse.json({
      success: true,
      data: {
        id: paymentLink.id,
        title: paymentLink.description,
        amount: paymentLink.amount,
        currency: paymentLink.currency,
        service: PaymentService.paypay,
        status: paymentLink.status,
        paymentUrl: paymentLink.linkUrl,
        shareUrl: `${process.env.NEXTAUTH_URL}/p/${paymentLink.id}`,
        qrCodeUrl: `/api/qr-code?url=${encodeURIComponent(paymentLink.linkUrl)}`,
        qrCodeData, // PayPay独自のQRコード画像
        description: paymentLink.description,
        metadata: paymentLink.metadata,
        createdAt: paymentLink.createdAt,
        expiresAt: paymentLink.expiresAt,
        paymentType: 'qr_code',
      },
    });

  } catch (error) {
    console.error('PayPay決済リンク取得エラー:', error);
    return NextResponse.json(
      createErrorResponse(
        error instanceof Error ? error.message : 'PayPay決済リンクの取得に失敗しました',
        PaymentService.paypay
      ),
      { status: 500 }
    );
  }
}

// PayPay決済のキャンセル
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get('orderId');
    const paymentId = searchParams.get('paymentId');

    if (!orderId && !paymentId) {
      return NextResponse.json(
        createErrorResponse('orderIdまたはpaymentIdが必要です', PaymentService.paypay),
        { status: 400 }
      );
    }

    let paymentLink;

    if (orderId) {
      paymentLink = await prisma.paymentLink.findUnique({
        where: { id: orderId },
      });
    } else if (paymentId) {
      paymentLink = await findPaymentLinkByIdentifier(paymentId, PaymentService.paypay);
    }

    if (!paymentLink) {
      return NextResponse.json(
        createErrorResponse('決済リンクが見つかりません', PaymentService.paypay),
        { status: 404 }
      );
    }

    if (paymentLink.status === 'succeeded') {
      return NextResponse.json(
        createErrorResponse('完了済みの決済はキャンセルできません', PaymentService.paypay),
        { status: 400 }
      );
    }

    // PayPay決済をキャンセル
    if (paymentLink.stripePaymentIntentId) {
      const paypayService = getPayPayService();
      const cancelResult = await paypayService.cancelPayment(paymentLink.stripePaymentIntentId);

      if (!cancelResult) {
        return NextResponse.json(
          createErrorResponse('PayPay決済のキャンセルに失敗しました', PaymentService.paypay),
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
      message: 'PayPay決済がキャンセルされました',
    });

  } catch (error) {
    console.error('PayPay決済キャンセルエラー:', error);
    return NextResponse.json(
      createErrorResponse(
        error instanceof Error ? error.message : 'PayPay決済のキャンセルに失敗しました',
        PaymentService.paypay
      ),
      { status: 500 }
    );
  }
}