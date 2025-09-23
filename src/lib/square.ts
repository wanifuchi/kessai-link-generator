import crypto from 'crypto';

export interface SquarePaymentRequest {
  amount: number;
  currency: string;
  orderId: string;
  description?: string;
  metadata?: Record<string, string>;
}

export interface SquarePaymentResponse {
  success: boolean;
  paymentUrl?: string;
  paymentId?: string;
  orderId?: string;
  error?: string;
}

export class SquareService {
  private applicationId: string;
  private accessToken: string;
  private environment: 'sandbox' | 'production';
  private locationId: string;

  constructor() {
    this.applicationId = process.env.SQUARE_APPLICATION_ID || '';
    this.accessToken = process.env.SQUARE_ACCESS_TOKEN || '';
    this.environment = process.env.SQUARE_ENVIRONMENT === 'production' ? 'production' : 'sandbox';
    this.locationId = process.env.SQUARE_LOCATION_ID || '';

    if (!this.applicationId || !this.accessToken) {
      throw new Error('Square APIキーが設定されていません');
    }
  }

  private getBaseUrl(): string {
    return this.environment === 'production'
      ? 'https://connect.squareup.com'
      : 'https://connect.squareupsandbox.com';
  }

  private generateIdempotencyKey(): string {
    return crypto.randomUUID();
  }

  async createPayment(request: SquarePaymentRequest): Promise<SquarePaymentResponse> {
    try {
      const baseAmount = Math.round(request.amount * 100); // Squareは最小単位で処理

      const orderRequest = {
        idempotency_key: this.generateIdempotencyKey(),
        order: {
          location_id: this.locationId,
          reference_id: request.orderId,
          line_items: [{
            name: request.description || '決済商品',
            quantity: '1',
            base_price_money: {
              amount: baseAmount,
              currency: request.currency.toUpperCase(),
            },
          }],
        },
      };

      // オーダー作成
      const orderResponse = await fetch(`${this.getBaseUrl()}/v2/orders`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
          'Square-Version': '2023-10-18',
        },
        body: JSON.stringify(orderRequest),
      });

      if (!orderResponse.ok) {
        const errorData = await orderResponse.json();
        throw new Error(`Square Order作成エラー: ${JSON.stringify(errorData.errors)}`);
      }

      const orderData = await orderResponse.json();
      const squareOrderId = orderData.order?.id;

      if (!squareOrderId) {
        throw new Error('Square Order IDの取得に失敗しました');
      }

      // Checkout作成
      const checkoutRequest = {
        idempotency_key: this.generateIdempotencyKey(),
        ask_for_shipping_address: false,
        merchant_support_email: process.env.MERCHANT_EMAIL || 'support@example.com',
        pre_populate_buyer_email: '',
        redirect_url: `${process.env.NEXTAUTH_URL}/payment/success?service=square&order_id=${request.orderId}`,
        order: {
          id: squareOrderId,
        },
        payment_options: {
          autocomplete: true,
        },
      };

      const checkoutResponse = await fetch(`${this.getBaseUrl()}/v2/online-checkout/payment-links`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
          'Square-Version': '2023-10-18',
        },
        body: JSON.stringify(checkoutRequest),
      });

      if (!checkoutResponse.ok) {
        const errorData = await checkoutResponse.json();
        throw new Error(`Square Checkout作成エラー: ${JSON.stringify(errorData.errors)}`);
      }

      const checkoutData = await checkoutResponse.json();
      const paymentLink = checkoutData.payment_link;

      if (!paymentLink?.url) {
        throw new Error('Square決済URLの取得に失敗しました');
      }

      return {
        success: true,
        paymentUrl: paymentLink.url,
        paymentId: paymentLink.id,
        orderId: request.orderId,
      };

    } catch (error) {
      console.error('Square決済作成エラー:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Square決済の作成に失敗しました',
      };
    }
  }

  async verifyWebhook(body: string, signature: string): Promise<boolean> {
    try {
      const webhookSecret = process.env.SQUARE_WEBHOOK_SECRET;
      if (!webhookSecret) {
        console.error('Square Webhook Secretが設定されていません');
        return false;
      }

      // Square Webhookの署名検証
      const hash = crypto
        .createHmac('sha256', webhookSecret)
        .update(body)
        .digest('base64');

      return hash === signature;
    } catch (error) {
      console.error('Square Webhook検証エラー:', error);
      return false;
    }
  }

  async getPaymentStatus(paymentId: string): Promise<{
    status: 'pending' | 'completed' | 'failed' | 'canceled';
    amount?: number;
    currency?: string;
  }> {
    try {
      const response = await fetch(`${this.getBaseUrl()}/v2/payments/${paymentId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
          'Square-Version': '2023-10-18',
        },
      });

      if (!response.ok) {
        throw new Error('Square決済ステータス取得に失敗しました');
      }

      const data = await response.json();
      const payment = data.payment;

      let status: 'pending' | 'completed' | 'failed' | 'canceled' = 'pending';

      switch (payment.status) {
        case 'COMPLETED':
          status = 'completed';
          break;
        case 'FAILED':
          status = 'failed';
          break;
        case 'CANCELED':
          status = 'canceled';
          break;
        default:
          status = 'pending';
      }

      return {
        status,
        amount: payment.amount_money ? payment.amount_money.amount / 100 : undefined,
        currency: payment.amount_money?.currency,
      };

    } catch (error) {
      console.error('Square決済ステータス取得エラー:', error);
      return { status: 'failed' };
    }
  }
}

// シングルトンインスタンス
let squareInstance: SquareService | null = null;

export function getSquareService(): SquareService {
  if (!squareInstance) {
    squareInstance = new SquareService();
  }
  return squareInstance;
}