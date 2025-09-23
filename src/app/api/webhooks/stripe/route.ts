import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { PrismaClient } from '@prisma/client';
import Stripe from 'stripe';

const prisma = new PrismaClient();

// Webhookシークレットとバイトチェック付きで取得
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

if (!endpointSecret) {
  console.error('STRIPE_WEBHOOK_SECRET is not set');
}

if (!stripeSecretKey) {
  console.error('STRIPE_SECRET_KEY is not set');
}

// Stripe インスタンス初期化
const stripe = new Stripe(stripeSecretKey || '', {
  apiVersion: '2024-06-20',
});

// Stripeウェブフックの処理
export async function POST(request: NextRequest) {
  if (!endpointSecret) {
    console.error('Stripe webhook secret is not configured');
    return NextResponse.json({
      success: false,
      error: 'Webhook secret not configured'
    }, { status: 500 });
  }
  
  try {
    const body = await request.text();
    const sig = request.headers.get('stripe-signature');
    
    if (!sig) {
      return NextResponse.json({
        success: false,
        error: 'No signature found'
      }, { status: 400 });
    }
    
    let event: Stripe.Event;

    try {
      // Webhookの署名を検証
      event = stripe.webhooks.constructEvent(body, sig, endpointSecret);
    } catch (err) {
      console.error('Webhook signature verification failed:', err);
      return NextResponse.json({
        success: false,
        error: `Webhook Error: ${err instanceof Error ? err.message : 'Unknown error'}`
      }, { status: 400 });
    }

    console.log('Received Stripe webhook event:', {
      type: event.type,
      id: event.id,
      created: new Date(event.created * 1000).toISOString(),
    });
    
    // イベントタイプに基づく処理
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session);
        break;
      
      case 'checkout.session.expired':
        await handleCheckoutSessionExpired(event.data.object as Stripe.Checkout.Session);
        break;

      case 'payment_intent.succeeded':
        await handlePaymentIntentSucceeded(event.data.object as Stripe.PaymentIntent);
        break;

      case 'payment_intent.payment_failed':
        await handlePaymentIntentFailed(event.data.object as Stripe.PaymentIntent);
        break;

      case 'invoice.payment_succeeded':
        await handleInvoicePaymentSucceeded(event.data.object as Stripe.Invoice);
        break;

      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice);
        break;
      
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }
    
    return NextResponse.json({ received: true });

  } catch (error) {
    console.error('Webhook processing error:', error);
    return NextResponse.json({
      success: false,
      error: 'Webhook processing failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// チェックアウトセッション完了時の処理
async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  try {
    console.log('Processing checkout session completed:', session.id);

    // payment_link_idがmetadataに含まれている場合の処理
    const paymentLinkId = session.metadata?.paymentLinkId || session.metadata?.payment_link_id;
    if (!paymentLinkId) {
      console.warn('No payment_link_id in session metadata:', session.id);
      return;
    }

    // PaymentLinkの存在確認
    const paymentLink = await prisma.paymentLink.findUnique({
      where: { id: paymentLinkId },
    });

    if (!paymentLink) {
      console.error('PaymentLink not found:', paymentLinkId);
      return;
    }

    // 既存のトランザクションを検索
    const existingTransaction = await prisma.transaction.findFirst({
      where: {
        serviceTransactionId: session.id,
      },
    });

    if (existingTransaction) {
      // 既存のトランザクションを更新
      await prisma.transaction.update({
        where: { id: existingTransaction.id },
        data: {
          status: 'completed',
          paidAt: new Date(),
          customerEmail: session.customer_details?.email || undefined,
          customerName: session.customer_details?.name || undefined,
          metadata: {
            stripeSessionId: session.id,
            stripePaymentIntentId: session.payment_intent as string,
            customerDetails: session.customer_details ? JSON.parse(JSON.stringify(session.customer_details)) : null,
          },
        },
      });
    } else {
      // 新規トランザクションを作成
      await prisma.transaction.create({
        data: {
          paymentLinkId,
          status: 'completed',
          amount: session.amount_total || 0,
          currency: (session.currency || 'jpy').toUpperCase(),
          service: 'stripe',
          serviceTransactionId: session.id,
          paidAt: new Date(),
          customerEmail: session.customer_details?.email || undefined,
          customerName: session.customer_details?.name || undefined,
          customerPhone: session.customer_details?.phone || undefined,
          metadata: {
            stripeSessionId: session.id,
            stripePaymentIntentId: session.payment_intent as string,
            customerDetails: session.customer_details ? JSON.parse(JSON.stringify(session.customer_details)) : null,
          },
        },
      });
    }

    // PaymentLinkのステータスを更新（必要に応じて）
    if (paymentLink.status === 'pending') {
      await prisma.paymentLink.update({
        where: { id: paymentLinkId },
        data: {
          status: 'completed',
        },
      });
    }

    console.log('Successfully processed checkout session:', session.id);

  } catch (error) {
    console.error('Error processing checkout session:', error);
    throw error;
  }
}

// チェックアウトセッション期限切れ時の処理
async function handleCheckoutSessionExpired(session: Stripe.Checkout.Session) {
  try {
    console.log('Processing checkout session expired:', session.id);

    const paymentLinkId = session.metadata?.paymentLinkId || session.metadata?.payment_link_id;
    if (!paymentLinkId) {
      console.warn('No payment_link_id in session metadata:', session.id);
      return;
    }

    // PaymentLinkのステータスを期限切れに更新
    await prisma.paymentLink.update({
      where: { id: paymentLinkId },
      data: { status: 'expired' },
    });

    console.log('Successfully processed session expiration:', session.id);

  } catch (error) {
    console.error('Error processing session expiration:', error);
    throw error;
  }
}

// Payment Intent成功時の処理
async function handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  try {
    console.log('Processing payment intent succeeded:', paymentIntent.id);

    // Payment Intentに関連するtransactionを更新
    const transaction = await prisma.transaction.findFirst({
      where: {
        serviceTransactionId: paymentIntent.id,
      },
    });

    if (transaction) {
      await prisma.transaction.update({
        where: { id: transaction.id },
        data: {
          status: 'completed',
          paidAt: new Date(),
          metadata: {
            ...transaction.metadata as object,
            paymentIntentId: paymentIntent.id,
          },
        },
      });
    }

  } catch (error) {
    console.error('Error processing payment intent succeeded:', error);
    throw error;
  }
}

// Payment Intent失敗時の処理
async function handlePaymentIntentFailed(paymentIntent: Stripe.PaymentIntent) {
  try {
    console.log('Processing payment intent failed:', paymentIntent.id);

    const paymentLinkId = paymentIntent.metadata?.paymentLinkId || paymentIntent.metadata?.payment_link_id;

    if (paymentLinkId) {
      // 既存のトランザクションを検索
      const existingTransaction = await prisma.transaction.findFirst({
        where: {
          serviceTransactionId: paymentIntent.id,
        },
      });

      if (existingTransaction) {
        // 既存のトランザクションを更新
        await prisma.transaction.update({
          where: { id: existingTransaction.id },
          data: {
            status: 'failed',
            metadata: {
              paymentIntentId: paymentIntent.id,
              failureReason: paymentIntent.last_payment_error?.message || 'Payment failed',
              failureCode: paymentIntent.last_payment_error?.code || null,
            },
          },
        });
      } else {
        // 新規トランザクションを作成
        await prisma.transaction.create({
          data: {
            paymentLinkId,
            amount: paymentIntent.amount,
            currency: paymentIntent.currency.toUpperCase(),
            service: 'stripe',
            serviceTransactionId: paymentIntent.id,
            status: 'failed',
            metadata: {
              paymentIntentId: paymentIntent.id,
              failureReason: paymentIntent.last_payment_error?.message || 'Payment failed',
              failureCode: paymentIntent.last_payment_error?.code || null,
            },
          },
        });
      }
    }

  } catch (error) {
    console.error('Error processing payment intent failed:', error);
    throw error;
  }
}

// インボイス支払い成功時の処理
async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
  try {
    console.log('Processing invoice payment succeeded:', invoice.id);

    // 継続課金や一回限りの請求書の処理
    // 将来的な機能拡張のための基盤

  } catch (error) {
    console.error('Error processing invoice payment succeeded:', error);
    throw error;
  }
}

// インボイス支払い失敗時の処理
async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  try {
    console.log('Processing invoice payment failed:', invoice.id);

    // 失敗処理の実装
    // 将来的なリトライロジックやアラート処理のための基盤

  } catch (error) {
    console.error('Error processing invoice payment failed:', error);
    throw error;
  }
}

// GETリクエストは許可しない
export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  );
}