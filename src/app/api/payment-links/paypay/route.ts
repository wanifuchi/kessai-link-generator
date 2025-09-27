import { NextRequest, NextResponse } from 'next/server';
import { getPayPayService } from '@/lib/paypay';
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

    // PayPayは日本円のみ対応
    if (currency.toUpperCase() !== 'JPY') {
      return NextResponse.json(
        { success: false, error: 'PayPayは日本円（JPY）のみ対応しています' },
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
        { success: false, error: paypayResult.error },
        { status: 400 }
      );
    }

    // データベースに保存
    const paymentLink = await prisma.paymentLink.create({
      data: {
        id: orderId,
        userId: 'temp-user-id', // FIXME: 実際のユーザーIDが必要
        userPaymentConfigId: 'temp-config-id', // FIXME: 実際の設定IDが必要
        description: title,
        amount: Number(amount),
        currency: 'JPY',
        status: 'pending',
        linkUrl: paypayResult.paymentUrl || '',
        stripePaymentIntentId: paypayResult.paymentId || '',
        metadata: metadata ? JSON.stringify({
          ...metadata,
          qrCodeData: paypayResult.qrCodeData, // QRコード画像データを保存
        }) : JSON.stringify({
          qrCodeData: paypayResult.qrCodeData,
        }),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24時間後
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        id: paymentLink.id,
        paymentUrl: paymentLink.paymentUrl,
        qrCodeUrl: `/api/qr-code?url=${encodeURIComponent(paymentLink.paymentUrl)}`,
        qrCodeData: paypayResult.qrCodeData, // PayPay独自のQRコード画像
        shareUrl: `${process.env.NEXTAUTH_URL}/p/${paymentLink.id}`,
        service: 'paypay',
        title: paymentLink.description,
        amount: paymentLink.amount,
        currency: paymentLink.currency,
        status: paymentLink.status,
        expiresAt: paymentLink.expiresAt,
        paymentType: 'qr_code', // PayPay特有の決済タイプ
      },
    });

  } catch (error) {
    console.error('PayPay決済リンク作成エラー:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'PayPay決済リンクの作成に失敗しました'
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

    // PayPay決済の最新ステータスを取得
    if (paymentLink.serviceId && paymentLink.status === 'pending') {
      try {
        const paypayService = getPayPayService();
        const paypayStatus = await paypayService.getPaymentStatus(paymentLink.serviceId);

        // ステータスが変更されている場合は更新
        if (paypayStatus.status !== 'pending') {
          paymentLink = await prisma.paymentLink.update({
            where: { id: paymentLink.id },
            data: {
              status: paypayStatus.status,
            },
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
        service: paymentLink.service,
        status: paymentLink.status,
        paymentUrl: paymentLink.paymentUrl,
        shareUrl: `${process.env.NEXTAUTH_URL}/p/${paymentLink.id}`,
        qrCodeUrl: `/api/qr-code?url=${encodeURIComponent(paymentLink.paymentUrl)}`,
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
      {
        success: false,
        error: error instanceof Error ? error.message : 'PayPay決済リンクの取得に失敗しました'
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
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

    if (paymentLink.status === 'completed') {
      return NextResponse.json(
        { success: false, error: '完了済みの決済はキャンセルできません' },
        { status: 400 }
      );
    }

    // PayPay決済をキャンセル
    if (paymentLink.serviceId) {
      const paypayService = getPayPayService();
      const cancelResult = await paypayService.cancelPayment(paymentLink.serviceId);

      if (!cancelResult) {
        return NextResponse.json(
          { success: false, error: 'PayPay決済のキャンセルに失敗しました' },
          { status: 400 }
        );
      }
    }

    // データベースを更新
    await prisma.paymentLink.update({
      where: { id: paymentLink.id },
      data: {
        status: 'canceled',
      },
    });

    return NextResponse.json({
      success: true,
      message: 'PayPay決済がキャンセルされました',
    });

  } catch (error) {
    console.error('PayPay決済キャンセルエラー:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'PayPay決済のキャンセルに失敗しました'
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}