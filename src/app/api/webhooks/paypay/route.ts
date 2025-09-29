import { NextRequest, NextResponse } from 'next/server';
import { getPayPayService } from '@/lib/paypay';
import prisma from '@/lib/prisma';
import { PaymentService } from '@prisma/client';

export async function POST(request: NextRequest) {
  try {
    // リクエストボディを取得
    const body = await request.text();
    const signature = request.headers.get('x-paypay-signature') || '';

    // Webhook署名を検証
    const paypayService = getPayPayService();
    const isValid = paypayService.verifyWebhook(body, signature);

    if (!isValid) {
      console.error('PayPay Webhook署名検証失敗');
      return NextResponse.json(
        { success: false, error: '署名検証に失敗しました' },
        { status: 401 }
      );
    }

    // Webhookデータを解析
    const webhookData = JSON.parse(body);
    const { eventType, data: eventData } = webhookData;

    console.log('PayPay Webhook受信:', {
      eventType,
      merchantPaymentId: eventData?.merchantPaymentId,
      timestamp: new Date().toISOString(),
    });

    // 決済関連のイベントを処理
    switch (eventType) {
      case 'payment.completed':
        await handlePaymentCompleted(eventData);
        break;
      case 'payment.failed':
        await handlePaymentFailed(eventData);
        break;
      case 'payment.canceled':
        await handlePaymentCanceled(eventData);
        break;
      case 'payment.expired':
        await handlePaymentExpired(eventData);
        break;
      default:
        console.log('未対応のPayPay Webhookイベント:', eventType);
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('PayPay Webhook処理エラー:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Webhook処理に失敗しました'
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

async function handlePaymentCompleted(eventData: any) {
  try {
    const merchantPaymentId = eventData.merchantPaymentId;
    const paymentId = eventData.paymentId;
    const amount = eventData.amount?.amount;
    const currency = eventData.amount?.currency;

    // データベースで決済リンクを検索
    const paymentLink = await prisma.paymentLink.findFirst({
      where: {
        OR: [
          { id: merchantPaymentId },
          { stripePaymentIntentId: paymentId },
        ],
        service: PaymentService.paypay,
      },
    });

    if (!paymentLink) {
      console.warn('PayPay Webhook: 対応する決済リンクが見つかりません', {
        merchantPaymentId,
        paymentId,
      });
      return;
    }

    // 既存のトランザクションをチェック
    const existingTransaction = await prisma.transaction.findFirst({
      where: {
        serviceTransactionId: paymentId,
        paymentLinkId: paymentLink.id,
      }
    });

    if (!existingTransaction) {
      // トランザクション記録を作成
      await prisma.transaction.create({
        data: {
          paymentLinkId: paymentLink.id,
          service: PaymentService.paypay,
          serviceTransactionId: paymentId,
          amount: amount || paymentLink.amount,
          currency: currency || paymentLink.currency,
          status: 'completed',
          paidAt: new Date(),
          metadata: {
            eventType: 'payment.completed',
            paypayPaymentId: paymentId,
            merchantPaymentId: merchantPaymentId,
            originalEventData: eventData,
          },
        },
      });
    }

    // 決済完了状態に更新
    await prisma.paymentLink.update({
      where: { id: paymentLink.id },
      data: {
        status: 'succeeded',
        stripePaymentIntentId: paymentId, // PayPay Payment IDで更新
        completedAt: new Date(),
      },
    });

    console.log('PayPay決済完了処理完了:', {
      paymentLinkId: paymentLink.id,
      paymentId,
      amount,
    });

  } catch (error) {
    console.error('PayPay決済完了イベント処理エラー:', error);
    throw error;
  }
}

async function handlePaymentFailed(eventData: any) {
  try {
    const merchantPaymentId = eventData.merchantPaymentId;
    const paymentId = eventData.paymentId;

    // データベースで決済リンクを検索
    const paymentLink = await prisma.paymentLink.findFirst({
      where: {
        OR: [
          { id: merchantPaymentId },
          { stripePaymentIntentId: paymentId },
        ],
        service: PaymentService.paypay,
      },
    });

    if (!paymentLink) {
      console.warn('PayPay Webhook: 対応する決済リンクが見つかりません', {
        merchantPaymentId,
        paymentId,
      });
      return;
    }

    // 決済失敗状態に更新
    await prisma.paymentLink.update({
      where: { id: paymentLink.id },
      data: {
        status: 'failed',
        stripePaymentIntentId: paymentId,
      },
    });

    console.log('PayPay決済失敗処理完了:', {
      paymentLinkId: paymentLink.id,
      paymentId,
    });

  } catch (error) {
    console.error('PayPay決済失敗イベント処理エラー:', error);
    throw error;
  }
}

async function handlePaymentCanceled(eventData: any) {
  try {
    const merchantPaymentId = eventData.merchantPaymentId;
    const paymentId = eventData.paymentId;

    // データベースで決済リンクを検索
    const paymentLink = await prisma.paymentLink.findFirst({
      where: {
        OR: [
          { id: merchantPaymentId },
          { stripePaymentIntentId: paymentId },
        ],
        service: PaymentService.paypay,
      },
    });

    if (!paymentLink) {
      console.warn('PayPay Webhook: 対応する決済リンクが見つかりません', {
        merchantPaymentId,
        paymentId,
      });
      return;
    }

    // 決済キャンセル状態に更新
    await prisma.paymentLink.update({
      where: { id: paymentLink.id },
      data: {
        status: 'cancelled',
        stripePaymentIntentId: paymentId,
      },
    });

    console.log('PayPay決済キャンセル処理完了:', {
      paymentLinkId: paymentLink.id,
      paymentId,
    });

  } catch (error) {
    console.error('PayPay決済キャンセルイベント処理エラー:', error);
    throw error;
  }
}

async function handlePaymentExpired(eventData: any) {
  try {
    const merchantPaymentId = eventData.merchantPaymentId;
    const codeId = eventData.codeId;

    // データベースで決済リンクを検索
    const paymentLink = await prisma.paymentLink.findFirst({
      where: {
        OR: [
          { id: merchantPaymentId },
          { stripePaymentIntentId: codeId },
        ],
        service: PaymentService.paypay,
      },
    });

    if (!paymentLink) {
      console.warn('PayPay Webhook: 対応する決済リンクが見つかりません', {
        merchantPaymentId,
        codeId,
      });
      return;
    }

    // 決済期限切れ状態に更新
    await prisma.paymentLink.update({
      where: { id: paymentLink.id },
      data: {
        status: 'failed', // 期限切れは失敗として扱う
      },
    });

    console.log('PayPay決済期限切れ処理完了:', {
      paymentLinkId: paymentLink.id,
      codeId,
    });

  } catch (error) {
    console.error('PayPay決済期限切れイベント処理エラー:', error);
    throw error;
  }
}

// GET method for webhook validation (PayPay may require this)
export async function GET() {
  return NextResponse.json({
    message: 'PayPay Webhook endpoint is active',
    timestamp: new Date().toISOString()
  });
}