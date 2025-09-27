import { NextRequest, NextResponse } from 'next/server';
import PayPalService from '@/lib/paypal';
import prisma from '@/lib/prisma';
import { PaymentService } from '@prisma/client';

// PayPal webhook イベント処理
export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const headers = Object.fromEntries(request.headers.entries());

    // PayPal webhook署名の検証
    const paypalService = new PayPalService();
    if (!paypalService.verifyWebhookSignature(body, headers)) {
      console.error('PayPal webhook signature verification failed');
      return NextResponse.json({
        success: false,
        error: 'Invalid signature'
      }, { status: 400 });
    }

    const event = JSON.parse(body);

    console.log('Received PayPal webhook event:', {
      type: event.event_type,
      id: event.id,
      created: event.create_time,
    });

    // イベントタイプに基づく処理
    switch (event.event_type) {
      case 'CHECKOUT.ORDER.APPROVED':
        await handleOrderApproved(event);
        break;

      case 'PAYMENT.CAPTURE.COMPLETED':
        await handlePaymentCaptureCompleted(event);
        break;

      case 'PAYMENT.CAPTURE.DENIED':
        await handlePaymentCaptureDenied(event);
        break;

      case 'PAYMENT.CAPTURE.PENDING':
        await handlePaymentCapturePending(event);
        break;

      case 'PAYMENT.CAPTURE.REFUNDED':
        await handlePaymentCaptureRefunded(event);
        break;

      default:
        console.log(`Unhandled PayPal event type: ${event.event_type}`);
    }

    return NextResponse.json({ received: true });

  } catch (error) {
    console.error('PayPal webhook processing error:', error);
    return NextResponse.json({
      success: false,
      error: 'Webhook processing failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// 注文承認時の処理
async function handleOrderApproved(event: any) {
  try {
    console.log('Processing PayPal order approved:', event.resource.id);

    const orderId = event.resource.id;
    const customId = event.resource.purchase_units[0]?.custom_id;

    if (!customId) {
      console.warn('No custom_id (payment_link_id) in PayPal order:', orderId);
      return;
    }

    // PaymentLinkの存在確認
    const paymentLink = await prisma.paymentLink.findUnique({
      where: { id: customId },
    });

    if (!paymentLink) {
      console.error('PaymentLink not found for PayPal order:', customId);
      return;
    }

    // 既存のトランザクションをチェック
    const existingTransaction = await prisma.transaction.findFirst({
      where: {
        serviceTransactionId: orderId,
        paymentLinkId: customId,
      }
    });

    if (existingTransaction) {
      // 既存のトランザクションを更新
      await prisma.transaction.update({
        where: { id: existingTransaction.id },
        data: {
          status: 'pending',
          metadata: {
            paypalOrderId: orderId,
            orderApprovedAt: new Date().toISOString(),
            payerInfo: event.resource.payer,
          },
        }
      });
    } else {
      // 新規トランザクションを作成
      await prisma.transaction.create({
        data: {
          paymentLinkId: customId,
          amount: parseInt((parseFloat(event.resource.purchase_units[0].amount.value) * 100).toString()),
          currency: event.resource.purchase_units[0].amount.currency_code.toUpperCase(),
          service: PaymentService.paypal,
          serviceTransactionId: orderId,
          status: 'pending',
          metadata: {
            paypalOrderId: orderId,
            orderApprovedAt: new Date().toISOString(),
            payerInfo: event.resource.payer,
          },
        }
      });
    }

    console.log('Successfully processed PayPal order approved:', orderId);

  } catch (error) {
    console.error('Error processing PayPal order approved:', error);
    throw error;
  }
}

// 支払いキャプチャ完了時の処理
async function handlePaymentCaptureCompleted(event: any) {
  try {
    console.log('Processing PayPal payment capture completed:', event.resource.id);

    const captureId = event.resource.id;
    const orderId = event.resource.supplementary_data?.related_ids?.order_id;
    const customId = event.resource.custom_id;

    // トランザクションを完了状態に更新
    const transaction = await prisma.transaction.findFirst({
      where: {
        OR: [
          { serviceTransactionId: orderId },
          { serviceTransactionId: captureId },
        ],
      },
    });

    if (transaction) {
      await prisma.transaction.update({
        where: { id: transaction.id },
        data: {
          status: 'succeeded',
          paidAt: new Date(),
          serviceTransactionId: captureId,
          customerEmail: event.resource.payer?.email_address,
          customerName: `${event.resource.payer?.name?.given_name || ''} ${event.resource.payer?.name?.surname || ''}`.trim(),
          metadata: {
            ...transaction.metadata as object,
            paypalCaptureId: captureId,
            captureCompletedAt: new Date().toISOString(),
            finalAmount: event.resource.amount,
          },
        },
      });

      // PaymentLinkのステータス更新
      await prisma.paymentLink.update({
        where: { id: transaction.paymentLinkId },
        data: {
          status: 'succeeded',
        },
      });
    }

    console.log('Successfully processed PayPal payment capture completed:', captureId);

  } catch (error) {
    console.error('Error processing PayPal payment capture completed:', error);
    throw error;
  }
}

// 支払いキャプチャ拒否時の処理
async function handlePaymentCaptureDenied(event: any) {
  try {
    console.log('Processing PayPal payment capture denied:', event.resource.id);

    const captureId = event.resource.id;
    const orderId = event.resource.supplementary_data?.related_ids?.order_id;

    // トランザクションを失敗状態に更新
    const transaction = await prisma.transaction.findFirst({
      where: {
        OR: [
          { serviceTransactionId: orderId },
          { serviceTransactionId: captureId },
        ],
      },
    });

    if (transaction) {
      await prisma.transaction.update({
        where: { id: transaction.id },
        data: {
          status: 'failed',
          metadata: {
            ...transaction.metadata as object,
            paypalCaptureId: captureId,
            denialReason: event.resource.status_details?.reason,
            deniedAt: new Date().toISOString(),
          },
        },
      });
    }

    console.log('Successfully processed PayPal payment capture denied:', captureId);

  } catch (error) {
    console.error('Error processing PayPal payment capture denied:', error);
    throw error;
  }
}

// 支払いキャプチャ保留時の処理
async function handlePaymentCapturePending(event: any) {
  try {
    console.log('Processing PayPal payment capture pending:', event.resource.id);

    const captureId = event.resource.id;

    // トランザクションを保留状態に更新
    const transaction = await prisma.transaction.findFirst({
      where: {
        serviceTransactionId: captureId,
      },
    });

    if (transaction) {
      await prisma.transaction.update({
        where: { id: transaction.id },
        data: {
          status: 'pending',
          metadata: {
            ...transaction.metadata as object,
            paypalCaptureId: captureId,
            pendingReason: event.resource.status_details?.reason,
            pendingAt: new Date().toISOString(),
          },
        },
      });
    }

    console.log('Successfully processed PayPal payment capture pending:', captureId);

  } catch (error) {
    console.error('Error processing PayPal payment capture pending:', error);
    throw error;
  }
}

// 支払い返金時の処理
async function handlePaymentCaptureRefunded(event: any) {
  try {
    console.log('Processing PayPal payment capture refunded:', event.resource.id);

    const refundId = event.resource.id;
    const captureId = event.resource.links?.find((link: any) => link.rel === 'up')?.href?.split('/').pop();

    // 元のトランザクションを見つけて返金記録を作成
    const originalTransaction = await prisma.transaction.findFirst({
      where: {
        serviceTransactionId: captureId,
      },
    });

    if (originalTransaction) {
      // 返金記録として新しいトランザクションを作成
      await prisma.transaction.create({
        data: {
          paymentLinkId: originalTransaction.paymentLinkId,
          amount: -parseInt((parseFloat(event.resource.amount.value) * 100).toString()), // 負の値で返金を表現
          currency: event.resource.amount.currency_code.toUpperCase(),
          service: PaymentService.paypal,
          serviceTransactionId: refundId,
          status: 'succeeded',
          paidAt: new Date(),
          metadata: {
            refundId: refundId,
            originalCaptureId: captureId,
            refundReason: event.resource.note_to_payer,
            refundedAt: new Date().toISOString(),
            isRefund: true,
          },
        },
      });

      // 元のトランザクションのメタデータを更新
      await prisma.transaction.update({
        where: { id: originalTransaction.id },
        data: {
          metadata: {
            ...originalTransaction.metadata as object,
            refundId: refundId,
            refundedAt: new Date().toISOString(),
            isRefunded: true,
          },
        },
      });
    }

    console.log('Successfully processed PayPal payment capture refunded:', refundId);

  } catch (error) {
    console.error('Error processing PayPal payment capture refunded:', error);
    throw error;
  }
}

// GET, PUT, DELETE メソッドは許可しない
export async function GET() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
}

export async function PUT() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
}

export async function DELETE() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
}