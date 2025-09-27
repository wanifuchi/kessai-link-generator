import { NextRequest, NextResponse } from 'next/server';
import { getSquareService } from '@/lib/square';
import prisma from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    // リクエストボディを取得
    const body = await request.text();
    const signature = request.headers.get('x-square-signature') || '';

    // Webhook署名を検証
    const squareService = getSquareService();
    const isValid = await squareService.verifyWebhook(body, signature);

    if (!isValid) {
      console.error('Square Webhook署名検証失敗');
      return NextResponse.json(
        { success: false, error: '署名検証に失敗しました' },
        { status: 401 }
      );
    }

    // Webhookデータを解析
    const webhookData = JSON.parse(body);
    const { type, data: eventData } = webhookData;

    console.log('Square Webhook受信:', {
      type,
      eventId: eventData?.id,
      timestamp: new Date().toISOString(),
    });

    // 決済関連のイベントのみ処理
    if (type.startsWith('payment.')) {
      await handlePaymentEvent(type, eventData);
    } else if (type.startsWith('order.')) {
      await handleOrderEvent(type, eventData);
    } else {
      console.log('未対応のSquare Webhookイベント:', type);
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Square Webhook処理エラー:', error);
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

async function handlePaymentEvent(eventType: string, eventData: any) {
  try {
    const payment = eventData?.object?.payment;
    if (!payment) {
      console.error('Square Webhook: 決済データが見つかりません');
      return;
    }

    const paymentId = payment.id;
    const orderId = payment.order_id;
    const status = payment.status;
    const amount = payment.amount_money?.amount;
    const currency = payment.amount_money?.currency;

    // データベースで決済リンクを検索
    let paymentLink = await prisma.paymentLink.findFirst({
      where: {
        OR: [
          { stripePaymentIntentId: paymentId },
          { stripePaymentIntentId: orderId },
        ],
        service: 'square',
      },
    });

    if (!paymentLink) {
      console.warn('Square Webhook: 対応する決済リンクが見つかりません', {
        paymentId,
        orderId,
      });
      return;
    }

    // ステータスを更新
    let newStatus: string;
    let completedAt: Date | null = null;

    switch (status) {
      case 'COMPLETED':
        newStatus = 'succeeded';
        completedAt = new Date();
        break;
      case 'FAILED':
        newStatus = 'failed';
        break;
      case 'CANCELED':
        newStatus = 'cancelled';
        break;
      case 'PENDING':
      default:
        newStatus = 'pending';
        break;
    }

    // データベース更新
    await prisma.paymentLink.update({
      where: { id: paymentLink.id },
      data: {
        status: newStatus as 'pending' | 'succeeded' | 'failed' | 'cancelled' | 'expired',
        stripePaymentIntentId: paymentId, // 最新のPayment IDで更新
      },
    });

    // トランザクション記録を作成（完了時のみ）
    if (newStatus === 'succeeded' && amount) {
      await prisma.transaction.create({
        data: {
          id: `square_tx_${paymentId}`,
          paymentLinkId: paymentLink.id,
          service: 'square',
          serviceTransactionId: paymentId,
          amount: amount / 100, // Squareは最小単位なので100で割る
          currency: currency || paymentLink.currency,
          status: 'completed',
          paidAt: new Date(),
          metadata: JSON.stringify({
            eventType,
            squarePaymentId: paymentId,
            squareOrderId: orderId,
          }),
        },
      });
    }

    console.log('Square決済ステータス更新完了:', {
      paymentLinkId: paymentLink.id,
      newStatus,
      paymentId,
      amount: amount ? amount / 100 : undefined,
    });

  } catch (error) {
    console.error('Square決済イベント処理エラー:', error);
    throw error;
  }
}

async function handleOrderEvent(eventType: string, eventData: any) {
  try {
    const order = eventData?.object?.order;
    if (!order) {
      console.error('Square Webhook: オーダーデータが見つかりません');
      return;
    }

    const orderId = order.id;
    const referenceId = order.reference_id;
    const state = order.state;

    console.log('Square Orderイベント処理:', {
      eventType,
      orderId,
      referenceId,
      state,
    });

    // 必要に応じてオーダー関連の処理を追加
    // 現在は決済完了処理はPaymentイベントで行うため、ログのみ

  } catch (error) {
    console.error('Square オーダーイベント処理エラー:', error);
    throw error;
  }
}

// GET method for webhook validation (Square requires this)
export async function GET() {
  return NextResponse.json({
    message: 'Square Webhook endpoint is active',
    timestamp: new Date().toISOString()
  });
}