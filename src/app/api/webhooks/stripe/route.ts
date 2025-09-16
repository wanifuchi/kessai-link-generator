import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import Stripe from 'stripe';

const prisma = new PrismaClient();

// Stripeウェブフックの処理
export async function POST(request: NextRequest) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  
  if (!webhookSecret) {
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
    
    // Stripeインスタンス作成（ダミーキーを使用、ウェブフック検証のみに使用）
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_dummy', {
      apiVersion: '2024-06-20',
    });
    
    let event: Stripe.Event;
    
    try {
      event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
    } catch (err) {
      console.error('Webhook signature verification failed:', err);
      return NextResponse.json({
        success: false,
        error: 'Webhook signature verification failed'
      }, { status: 400 });
    }
    
    // イベントタイプに基づく処理
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        
        // メタデータから決済リンクIDを取得
        const paymentLinkId = session.metadata?.paymentLinkId;
        
        if (!paymentLinkId) {
          console.error('No paymentLinkId found in session metadata');
          break;
        }
        
        // 決済リンクの存在確認
        const paymentLink = await prisma.paymentLink.findUnique({
          where: { id: paymentLinkId }
        });
        
        if (!paymentLink) {
          console.error(`Payment link not found: ${paymentLinkId}`);
          break;
        }
        
        // トランザクション作成
        await prisma.transaction.create({
          data: {
            paymentLinkId: paymentLinkId,
            amount: session.amount_total || 0,
            currency: (session.currency || 'jpy').toUpperCase(),
            service: 'STRIPE',
            serviceTransactionId: session.id,
            customerEmail: session.customer_details?.email || undefined,
            customerName: session.customer_details?.name || undefined,
            customerPhone: session.customer_details?.phone || undefined,
            status: 'COMPLETED',
            paidAt: new Date(),
            metadata: {
              sessionId: session.id,
              paymentIntentId: typeof session.payment_intent === 'string' ? session.payment_intent : session.payment_intent?.id || '',
              customerEmail: session.customer_details?.email || '',
              customerName: session.customer_details?.name || '',
            },
          }
        });
        
        // 決済リンクのステータスを完了に更新
        await prisma.paymentLink.update({
          where: { id: paymentLinkId },
          data: { status: 'COMPLETED' }
        });
        
        console.log(`Transaction completed for payment link: ${paymentLinkId}`);
        break;
      }
      
      case 'checkout.session.expired': {
        const session = event.data.object as Stripe.Checkout.Session;
        const paymentLinkId = session.metadata?.paymentLinkId;
        
        if (paymentLinkId) {
          // 決済リンクのステータスを期限切れに更新
          await prisma.paymentLink.update({
            where: { id: paymentLinkId },
            data: { status: 'EXPIRED' }
          });
          
          console.log(`Payment link expired: ${paymentLinkId}`);
        }
        break;
      }
      
      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        const paymentLinkId = paymentIntent.metadata?.paymentLinkId;
        
        if (paymentLinkId) {
          // 失敗したトランザクションを記録
          await prisma.transaction.create({
            data: {
              paymentLinkId: paymentLinkId,
              amount: paymentIntent.amount,
              currency: paymentIntent.currency.toUpperCase(),
              service: 'STRIPE',
              serviceTransactionId: paymentIntent.id,
              status: 'FAILED',
              metadata: {
                paymentIntentId: paymentIntent.id,
                errorCode: paymentIntent.last_payment_error?.code || '',
                errorMessage: paymentIntent.last_payment_error?.message || '',
              },
            }
          });
          
          console.log(`Payment failed for payment link: ${paymentLinkId}`);
        }
        break;
      }
      
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }
    
    return NextResponse.json({
      success: true,
      received: true
    });
    
  } catch (error) {
    console.error('Webhook processing error:', error);
    return NextResponse.json({
      success: false,
      error: 'Webhook processing failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}