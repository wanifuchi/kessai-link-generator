import { NextRequest, NextResponse } from 'next/server';
import { getFincodeService } from '@/lib/fincode';
import prisma from '@/lib/prisma';
import { PaymentService } from '@prisma/client';

export async function POST(request: NextRequest) {
  try {
    // リクエストボディを取得
    const body = await request.text();
    const signature = request.headers.get('x-fincode-signature') || '';

    // Webhook署名を検証
    const fincodeService = getFincodeService();
    const isValid = fincodeService.verifyWebhook(body, signature);

    if (!isValid) {
      console.error('Fincode Webhook署名検証失敗');
      return NextResponse.json(
        { success: false, error: '署名検証に失敗しました' },
        { status: 401 }
      );
    }

    // Webhookデータを解析
    const webhookData = JSON.parse(body);
    const { event_type, data: eventData } = webhookData;

    console.log('Fincode Webhook受信:', {
      eventType: event_type,
      paymentId: eventData?.id,
      timestamp: new Date().toISOString(),
    });

    // 決済関連のイベントを処理
    switch (event_type) {
      case 'payment.captured':
        await handlePaymentCaptured(eventData);
        break;
      case 'payment.authorized':
        await handlePaymentAuthorized(eventData);
        break;
      case 'payment.failed':
        await handlePaymentFailed(eventData);
        break;
      case 'payment.canceled':
        await handlePaymentCanceled(eventData);
        break;
      case 'payment.refunded':
        await handlePaymentRefunded(eventData);
        break;
      case 'payment.konbini.pending':
        await handleKonbiniPending(eventData);
        break;
      case 'payment.konbini.completed':
        await handleKonbiniCompleted(eventData);
        break;
      case 'payment.konbini.expired':
        await handleKonbiniExpired(eventData);
        break;
      default:
        console.log('未対応のFincode Webhookイベント:', event_type);
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Fincode Webhook処理エラー:', error);
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

async function handlePaymentCaptured(eventData: any) {
  try {
    const paymentId = eventData.id;
    const orderId = eventData.order_id;
    const amount = eventData.amount;
    const currency = eventData.currency;

    // データベースで決済リンクを検索
    const paymentLink = await prisma.paymentLink.findFirst({
      where: {
        OR: [
          { id: orderId },
          { stripePaymentIntentId: paymentId },
        ],
        userPaymentConfig: {
          provider: PaymentService.fincode,
        },
      },
      include: {
        userPaymentConfig: true,
      },
    });

    if (!paymentLink) {
      console.warn('Fincode Webhook: 対応する決済リンクが見つかりません', {
        paymentId,
        orderId,
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
          service: 'fincode',
          serviceTransactionId: paymentId,
          amount: amount || paymentLink.amount,
          currency: currency || paymentLink.currency,
          status: 'completed',
          paidAt: new Date(),
          metadata: {
            eventType: 'payment.captured',
            fincodePaymentId: paymentId,
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
        stripePaymentIntentId: paymentId,
        completedAt: new Date(),
      },
    });

    console.log('Fincode決済完了処理完了:', {
      paymentLinkId: paymentLink.id,
      paymentId,
      amount,
    });

  } catch (error) {
    console.error('Fincode決済完了イベント処理エラー:', error);
    throw error;
  }
}

async function handlePaymentAuthorized(eventData: any) {
  try {
    const paymentId = eventData.id;
    const orderId = eventData.order_id;

    // データベースで決済リンクを検索
    const paymentLink = await prisma.paymentLink.findFirst({
      where: {
        OR: [
          { id: orderId },
          { stripePaymentIntentId: paymentId },
        ],
        userPaymentConfig: {
          provider: PaymentService.fincode,
        },
      },
      include: {
        userPaymentConfig: true,
      },
    });

    if (!paymentLink) {
      console.warn('Fincode Webhook: 対応する決済リンクが見つかりません', {
        paymentId,
        orderId,
      });
      return;
    }

    // 認証済み状態に更新（まだ売上確定ではない）
    await prisma.paymentLink.update({
      where: { id: paymentLink.id },
      data: {
        status: 'pending', // 認証済みだが完了ではない
        stripePaymentIntentId: paymentId,
      },
    });

    console.log('Fincode決済認証処理完了:', {
      paymentLinkId: paymentLink.id,
      paymentId,
    });

  } catch (error) {
    console.error('Fincode決済認証イベント処理エラー:', error);
    throw error;
  }
}

async function handlePaymentFailed(eventData: any) {
  try {
    const paymentId = eventData.id;
    const orderId = eventData.order_id;

    // データベースで決済リンクを検索
    const paymentLink = await prisma.paymentLink.findFirst({
      where: {
        OR: [
          { id: orderId },
          { stripePaymentIntentId: paymentId },
        ],
        userPaymentConfig: {
          provider: PaymentService.fincode,
        },
      },
      include: {
        userPaymentConfig: true,
      },
    });

    if (!paymentLink) {
      console.warn('Fincode Webhook: 対応する決済リンクが見つかりません', {
        paymentId,
        orderId,
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

    console.log('Fincode決済失敗処理完了:', {
      paymentLinkId: paymentLink.id,
      paymentId,
    });

  } catch (error) {
    console.error('Fincode決済失敗イベント処理エラー:', error);
    throw error;
  }
}

async function handlePaymentCanceled(eventData: any) {
  try {
    const paymentId = eventData.id;
    const orderId = eventData.order_id;

    // データベースで決済リンクを検索
    const paymentLink = await prisma.paymentLink.findFirst({
      where: {
        OR: [
          { id: orderId },
          { stripePaymentIntentId: paymentId },
        ],
        userPaymentConfig: {
          provider: PaymentService.fincode,
        },
      },
      include: {
        userPaymentConfig: true,
      },
    });

    if (!paymentLink) {
      console.warn('Fincode Webhook: 対応する決済リンクが見つかりません', {
        paymentId,
        orderId,
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

    console.log('Fincode決済キャンセル処理完了:', {
      paymentLinkId: paymentLink.id,
      paymentId,
    });

  } catch (error) {
    console.error('Fincode決済キャンセルイベント処理エラー:', error);
    throw error;
  }
}

async function handlePaymentRefunded(eventData: any) {
  try {
    const paymentId = eventData.payment_id;
    const refundId = eventData.id;
    const amount = eventData.amount;

    console.log('Fincode返金処理:', {
      paymentId,
      refundId,
      amount,
    });

    // 返金処理の記録（必要に応じて実装）

  } catch (error) {
    console.error('Fincode返金イベント処理エラー:', error);
    throw error;
  }
}

async function handleKonbiniPending(eventData: any) {
  try {
    const paymentId = eventData.id;
    console.log('Fincodeコンビニ決済待機中:', { paymentId });
    // コンビニ決済の待機状態処理
  } catch (error) {
    console.error('Fincodeコンビニ待機イベント処理エラー:', error);
    throw error;
  }
}

async function handleKonbiniCompleted(eventData: any) {
  try {
    // コンビニ決済完了は payment.captured と同じ処理
    await handlePaymentCaptured(eventData);
  } catch (error) {
    console.error('Fincodeコンビニ完了イベント処理エラー:', error);
    throw error;
  }
}

async function handleKonbiniExpired(eventData: any) {
  try {
    // コンビニ決済期限切れは payment.failed と同じ処理
    await handlePaymentFailed(eventData);
  } catch (error) {
    console.error('Fincodeコンビニ期限切れイベント処理エラー:', error);
    throw error;
  }
}

// GET method for webhook validation (Fincode may require this)
export async function GET() {
  return NextResponse.json({
    message: 'Fincode Webhook endpoint is active',
    timestamp: new Date().toISOString()
  });
}