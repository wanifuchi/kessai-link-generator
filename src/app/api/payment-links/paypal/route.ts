import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import PayPalService from '@/lib/paypal';
import { checkServiceConfiguration } from '@/lib/env-validation';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    // PayPal設定の確認
    if (!checkServiceConfiguration('paypal')) {
      return NextResponse.json({
        success: false,
        error: 'PayPal is not configured'
      }, { status: 503 });
    }

    const { paymentLinkId } = await request.json();

    if (!paymentLinkId) {
      return NextResponse.json({
        success: false,
        error: 'Payment link ID is required'
      }, { status: 400 });
    }

    // PaymentLinkの存在確認
    const paymentLink = await prisma.paymentLink.findUnique({
      where: { id: paymentLinkId },
    });

    if (!paymentLink) {
      return NextResponse.json({
        success: false,
        error: 'Payment link not found'
      }, { status: 404 });
    }

    if (paymentLink.status !== 'ACTIVE') {
      return NextResponse.json({
        success: false,
        error: 'Payment link is not active'
      }, { status: 400 });
    }

    // PayPal決済リンクを作成
    const paypalService = new PayPalService();
    const paypalUrl = await paypalService.createPaymentLink({
      amount: paymentLink.amount,
      currency: paymentLink.currency,
      productName: paymentLink.title,
      description: paymentLink.description || undefined,
    }, paymentLinkId);

    // PayPal決済リンクの作成をログ記録
    console.log('PayPal payment link created:', {
      paymentLinkId,
      amount: paymentLink.amount,
      currency: paymentLink.currency,
      title: paymentLink.title,
    });

    return NextResponse.json({
      success: true,
      paymentUrl: paypalUrl,
      paymentService: 'paypal',
    });

  } catch (error) {
    console.error('PayPal payment link creation error:', error);

    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'PayPal payment creation failed',
      service: 'paypal'
    }, { status: 500 });
  }
}

// PayPal決済の完了処理
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get('token'); // PayPalのorder ID
    const paymentLinkId = searchParams.get('payment_link_id');

    if (!orderId || !paymentLinkId) {
      return NextResponse.json({
        success: false,
        error: 'Missing required parameters'
      }, { status: 400 });
    }

    const paypalService = new PayPalService();

    // PayPal注文詳細を取得
    const orderDetails = await paypalService.getOrderDetails(orderId);

    if (orderDetails.status === 'APPROVED') {
      // 支払いをキャプチャ
      const captureResult = await paypalService.captureOrder(orderId);

      if (captureResult.status === 'COMPLETED') {
        // データベースの更新
        const capture = captureResult.purchase_units[0].payments.captures[0];

        await prisma.transaction.create({
          data: {
            paymentLinkId,
            amount: parseInt((parseFloat(capture.amount.value) * 100).toString()), // セント単位に変換
            currency: capture.amount.currency_code.toUpperCase(),
            service: 'PAYPAL',
            serviceTransactionId: capture.id,
            status: 'COMPLETED',
            paidAt: new Date(),
            customerEmail: captureResult.payer?.email_address,
            customerName: `${captureResult.payer?.name?.given_name || ''} ${captureResult.payer?.name?.surname || ''}`.trim(),
            metadata: {
              paypalOrderId: orderId,
              paypalCaptureId: capture.id,
              payerInfo: captureResult.payer,
            },
          },
        });

        // PaymentLinkのステータス更新
        await prisma.paymentLink.update({
          where: { id: paymentLinkId },
          data: {
            status: 'COMPLETED',
          },
        });

        // 成功ページにリダイレクト
        return NextResponse.redirect(new URL(`/payment/success?payment_link_id=${paymentLinkId}`, request.url));
      }
    }

    // 失敗の場合
    return NextResponse.redirect(new URL(`/payment/failed?payment_link_id=${paymentLinkId}`, request.url));

  } catch (error) {
    console.error('PayPal payment completion error:', error);

    const paymentLinkId = new URL(request.url).searchParams.get('payment_link_id');
    return NextResponse.redirect(new URL(`/payment/failed?payment_link_id=${paymentLinkId}`, request.url));
  }
}

// PUT, DELETE メソッドは許可しない
export async function PUT() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
}

export async function DELETE() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
}