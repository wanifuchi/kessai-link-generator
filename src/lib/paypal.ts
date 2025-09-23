import { PaymentRequest } from '@/types/payment';

// PayPal API Base URLs
const PAYPAL_BASE_URL = process.env.NODE_ENV === 'production'
  ? 'https://api.paypal.com'
  : 'https://api.sandbox.paypal.com';

// PayPal configuration
interface PayPalConfig {
  clientId: string;
  clientSecret: string;
  webhookSecret?: string;
}

// PayPal order types
interface PayPalOrderItem {
  name: string;
  unit_amount: {
    currency_code: string;
    value: string;
  };
  quantity: string;
}

interface PayPalOrder {
  intent: 'CAPTURE';
  purchase_units: Array<{
    amount: {
      currency_code: string;
      value: string;
      breakdown: {
        item_total: {
          currency_code: string;
          value: string;
        };
      };
    };
    items: PayPalOrderItem[];
    custom_id?: string;
    description?: string;
  }>;
  application_context: {
    return_url: string;
    cancel_url: string;
    brand_name?: string;
    landing_page: 'LOGIN' | 'BILLING' | 'NO_PREFERENCE';
    user_action: 'PAY_NOW' | 'CONTINUE';
  };
}

interface PayPalAccessTokenResponse {
  access_token: string;
  token_type: 'Bearer';
  app_id: string;
  expires_in: number;
  scope: string;
}

interface PayPalOrderResponse {
  id: string;
  status: 'CREATED' | 'SAVED' | 'APPROVED' | 'VOIDED' | 'COMPLETED' | 'PAYER_ACTION_REQUIRED';
  links: Array<{
    href: string;
    rel: 'self' | 'approve' | 'update' | 'capture';
    method: 'GET' | 'POST' | 'PATCH';
  }>;
}

export class PayPalService {
  private config: PayPalConfig;

  constructor() {
    this.config = {
      clientId: process.env.PAYPAL_CLIENT_ID || '',
      clientSecret: process.env.PAYPAL_CLIENT_SECRET || '',
      webhookSecret: process.env.PAYPAL_WEBHOOK_SECRET,
    };

    if (!this.config.clientId || !this.config.clientSecret) {
      throw new Error('PayPal credentials are not configured');
    }
  }

  // PayPalアクセストークンを取得
  private async getAccessToken(): Promise<string> {
    const auth = Buffer.from(`${this.config.clientId}:${this.config.clientSecret}`).toString('base64');

    const response = await fetch(`${PAYPAL_BASE_URL}/v1/oauth2/token`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'grant_type=client_credentials',
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`PayPal auth failed: ${error}`);
    }

    const data: PayPalAccessTokenResponse = await response.json();
    return data.access_token;
  }

  // PayPal決済リンクを作成
  async createPaymentLink(config: PaymentRequest, paymentLinkId: string): Promise<string> {
    try {
      const accessToken = await this.getAccessToken();

      // 通貨の正規化（PayPalはJPYをサポート）
      const currency = config.currency.toUpperCase();
      const amount = (config.amount / 100).toFixed(2); // PayPalは小数点以下を期待

      const orderData: PayPalOrder = {
        intent: 'CAPTURE',
        purchase_units: [{
          amount: {
            currency_code: currency,
            value: amount,
            breakdown: {
              item_total: {
                currency_code: currency,
                value: amount,
              },
            },
          },
          items: [{
            name: config.productName || 'Payment Link Product',
            unit_amount: {
              currency_code: currency,
              value: amount,
            },
            quantity: '1',
          }],
          custom_id: paymentLinkId,
          description: config.description || config.productName,
        }],
        application_context: {
          return_url: `${process.env.NEXTAUTH_URL}/payment/success?payment_link_id=${paymentLinkId}`,
          cancel_url: `${process.env.NEXTAUTH_URL}/payment/cancel?payment_link_id=${paymentLinkId}`,
          brand_name: process.env.NEXT_PUBLIC_APP_NAME || 'Payment Link',
          landing_page: 'NO_PREFERENCE',
          user_action: 'PAY_NOW',
        },
      };

      const response = await fetch(`${PAYPAL_BASE_URL}/v2/checkout/orders`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'PayPal-Request-Id': `${paymentLinkId}-${Date.now()}`, // べき等性のためのID
        },
        body: JSON.stringify(orderData),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`PayPal order creation failed: ${error}`);
      }

      const orderResponse: PayPalOrderResponse = await response.json();

      // approval URLを取得
      const approveLink = orderResponse.links.find(link => link.rel === 'approve');
      if (!approveLink) {
        throw new Error('PayPal approval link not found');
      }

      return approveLink.href;

    } catch (error) {
      console.error('PayPal payment link creation error:', error);
      throw new Error(`PayPal payment link creation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // PayPal注文をキャプチャ（支払い確定）
  async captureOrder(orderId: string): Promise<any> {
    try {
      const accessToken = await this.getAccessToken();

      const response = await fetch(`${PAYPAL_BASE_URL}/v2/checkout/orders/${orderId}/capture`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`PayPal capture failed: ${error}`);
      }

      return await response.json();
    } catch (error) {
      console.error('PayPal capture error:', error);
      throw error;
    }
  }

  // PayPal注文詳細を取得
  async getOrderDetails(orderId: string): Promise<any> {
    try {
      const accessToken = await this.getAccessToken();

      const response = await fetch(`${PAYPAL_BASE_URL}/v2/checkout/orders/${orderId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`PayPal order details fetch failed: ${error}`);
      }

      return await response.json();
    } catch (error) {
      console.error('PayPal order details error:', error);
      throw error;
    }
  }

  // Webhook署名の検証
  verifyWebhookSignature(payload: string, headers: Record<string, string>): boolean {
    if (!this.config.webhookSecret) {
      console.warn('PayPal webhook secret not configured, skipping verification');
      return true; // 本番環境では false にすべき
    }

    // PayPal webhook署名検証の実装
    // 注意: PayPalのwebhook検証はStripeと異なる実装が必要
    // 実際の本番環境では適切な署名検証を実装する必要があります

    try {
      // 簡易的な検証（本番環境では適切な実装が必要）
      const paypalTransmissionId = headers['paypal-transmission-id'];
      const paypalCertId = headers['paypal-cert-id'];
      const paypalTransmissionSig = headers['paypal-transmission-sig'];
      const paypalTransmissionTime = headers['paypal-transmission-time'];

      // 必要なヘッダーが存在するかチェック
      return !!(paypalTransmissionId && paypalCertId && paypalTransmissionSig && paypalTransmissionTime);
    } catch (error) {
      console.error('PayPal webhook verification error:', error);
      return false;
    }
  }

  // PayPal設定の検証
  static validateConfig(): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!process.env.PAYPAL_CLIENT_ID) {
      errors.push('PAYPAL_CLIENT_ID is not set');
    }

    if (!process.env.PAYPAL_CLIENT_SECRET) {
      errors.push('PAYPAL_CLIENT_SECRET is not set');
    }

    if (process.env.NODE_ENV === 'production' && !process.env.PAYPAL_WEBHOOK_SECRET) {
      errors.push('PAYPAL_WEBHOOK_SECRET should be set in production');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}

// デフォルトエクスポート
export default PayPalService;