import crypto from 'crypto';

export interface PayPayPaymentRequest {
  amount: number;
  currency: string;
  orderId: string;
  description?: string;
  metadata?: Record<string, string>;
}

export interface PayPayPaymentResponse {
  success: boolean;
  paymentUrl?: string;
  qrCodeData?: string;
  paymentId?: string;
  orderId?: string;
  error?: string;
}

export class PayPayService {
  private merchantId: string;
  private apiKey: string;
  private apiSecret: string;
  private environment: 'sandbox' | 'production';

  constructor() {
    this.merchantId = process.env.PAYPAY_MERCHANT_ID || '';
    this.apiKey = process.env.PAYPAY_API_KEY || '';
    this.apiSecret = process.env.PAYPAY_API_SECRET || '';
    this.environment = process.env.PAYPAY_ENVIRONMENT === 'production' ? 'production' : 'sandbox';

    if (!this.merchantId || !this.apiKey || !this.apiSecret) {
      throw new Error('PayPay APIキーが設定されていません');
    }
  }

  private getBaseUrl(): string {
    return this.environment === 'production'
      ? 'https://api.paypay.ne.jp'
      : 'https://stg-api.sandbox.paypay.ne.jp';
  }

  private generateSignature(method: string, url: string, body: string, timestamp: string, nonce: string): string {
    const payload = `${method}\n${url}\n${body}\n${timestamp}\n${nonce}`;
    return crypto
      .createHmac('sha256', this.apiSecret)
      .update(payload)
      .digest('base64');
  }

  private generateAuthHeaders(method: string, endpoint: string, body: string = '') {
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const nonce = crypto.randomUUID();
    const signature = this.generateSignature(method, endpoint, body, timestamp, nonce);

    return {
      'Authorization': `hmac OPA-Auth:${this.apiKey}:${signature}:${nonce}:${timestamp}:sha256`,
      'X-ASSUME-MERCHANT': this.merchantId,
      'Content-Type': 'application/json',
    };
  }

  async createQRCode(request: PayPayPaymentRequest): Promise<PayPayPaymentResponse> {
    try {
      // PayPay QRコード決済作成
      const qrCodeRequest = {
        merchantPaymentId: request.orderId,
        amount: {
          amount: Math.round(request.amount),
          currency: request.currency.toUpperCase(),
        },
        orderDescription: request.description || '決済',
        orderItems: [{
          name: request.description || '決済商品',
          category: 'general',
          quantity: 1,
          productId: 'product_001',
          unitPrice: {
            amount: Math.round(request.amount),
            currency: request.currency.toUpperCase(),
          },
        }],
        requestedAt: Math.floor(Date.now() / 1000),
        storeInfo: request.metadata?.storeInfo || 'オンラインストア',
        terminalInfo: request.metadata?.terminalInfo || 'web',
        redirectUrl: `${process.env.NEXTAUTH_URL}/payment/success?service=paypay&order_id=${request.orderId}`,
        redirectType: 'WEB_LINK',
        userAgent: 'PayPay Integration/1.0',
      };

      const endpoint = '/v2/codes';
      const body = JSON.stringify(qrCodeRequest);
      const headers = this.generateAuthHeaders('POST', endpoint, body);

      const response = await fetch(`${this.getBaseUrl()}${endpoint}`, {
        method: 'POST',
        headers,
        body,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`PayPay QRコード作成エラー: ${JSON.stringify(errorData)}`);
      }

      const responseData = await response.json();

      if (responseData.resultInfo?.code !== 'SUCCESS') {
        throw new Error(`PayPay API エラー: ${responseData.resultInfo?.message}`);
      }

      const qrData = responseData.data;

      return {
        success: true,
        paymentUrl: qrData.url,
        qrCodeData: qrData.qrCodeImage, // Base64エンコードされたQRコード画像
        paymentId: qrData.codeId,
        orderId: request.orderId,
      };

    } catch (error) {
      console.error('PayPay QRコード作成エラー:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'PayPay QRコードの作成に失敗しました',
      };
    }
  }

  async getPaymentStatus(paymentId: string): Promise<{
    status: 'pending' | 'completed' | 'failed' | 'canceled';
    amount?: number;
    currency?: string;
  }> {
    try {
      const endpoint = `/v2/codes/payments/${paymentId}`;
      const headers = this.generateAuthHeaders('GET', endpoint);

      const response = await fetch(`${this.getBaseUrl()}${endpoint}`, {
        method: 'GET',
        headers,
      });

      if (!response.ok) {
        throw new Error('PayPay決済ステータス取得に失敗しました');
      }

      const data = await response.json();

      if (data.resultInfo?.code !== 'SUCCESS') {
        throw new Error(`PayPay API エラー: ${data.resultInfo?.message}`);
      }

      const payment = data.data;
      let status: 'pending' | 'completed' | 'failed' | 'canceled' = 'pending';

      switch (payment.status) {
        case 'COMPLETED':
          status = 'completed';
          break;
        case 'FAILED':
        case 'EXPIRED':
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
        amount: payment.amount?.amount,
        currency: payment.amount?.currency,
      };

    } catch (error) {
      console.error('PayPay決済ステータス取得エラー:', error);
      return { status: 'failed' };
    }
  }

  async cancelPayment(paymentId: string): Promise<boolean> {
    try {
      const endpoint = `/v2/codes/${paymentId}`;
      const headers = this.generateAuthHeaders('DELETE', endpoint);

      const response = await fetch(`${this.getBaseUrl()}${endpoint}`, {
        method: 'DELETE',
        headers,
      });

      if (!response.ok) {
        return false;
      }

      const data = await response.json();
      return data.resultInfo?.code === 'SUCCESS';

    } catch (error) {
      console.error('PayPay決済キャンセルエラー:', error);
      return false;
    }
  }

  verifyWebhook(body: string, signature: string): boolean {
    try {
      const webhookSecret = process.env.PAYPAY_WEBHOOK_SECRET;
      if (!webhookSecret) {
        console.error('PayPay Webhook Secretが設定されていません');
        return false;
      }

      // PayPay Webhookの署名検証
      const hash = crypto
        .createHmac('sha256', webhookSecret)
        .update(body)
        .digest('hex');

      return hash === signature;
    } catch (error) {
      console.error('PayPay Webhook検証エラー:', error);
      return false;
    }
  }

  async refundPayment(paymentId: string, amount?: number): Promise<{
    success: boolean;
    refundId?: string;
    error?: string;
  }> {
    try {
      const refundRequest = {
        merchantRefundId: `refund_${paymentId}_${Date.now()}`,
        paymentId: paymentId,
        amount: amount ? {
          amount: Math.round(amount),
          currency: 'JPY',
        } : undefined, // 部分返金の場合のみ金額指定
        requestedAt: Math.floor(Date.now() / 1000),
        reason: 'Customer request',
      };

      const endpoint = '/v2/refunds';
      const body = JSON.stringify(refundRequest);
      const headers = this.generateAuthHeaders('POST', endpoint, body);

      const response = await fetch(`${this.getBaseUrl()}${endpoint}`, {
        method: 'POST',
        headers,
        body,
      });

      if (!response.ok) {
        throw new Error('PayPay返金リクエストに失敗しました');
      }

      const data = await response.json();

      if (data.resultInfo?.code !== 'SUCCESS') {
        throw new Error(`PayPay返金エラー: ${data.resultInfo?.message}`);
      }

      return {
        success: true,
        refundId: data.data?.refundId,
      };

    } catch (error) {
      console.error('PayPay返金エラー:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'PayPay返金処理に失敗しました',
      };
    }
  }

  // 統一インターフェース用（PayPalやSquareと同じ）
  async createPayment(config: {
    amount: number;
    currency: string;
    orderId: string;
    description?: string;
    metadata?: any;
  }): Promise<{ success: boolean; paymentUrl?: string; paymentId?: string; error?: string; qrCodeData?: string }> {
    try {
      // PayPayは日本円のみ対応
      if (config.currency.toUpperCase() !== 'JPY') {
        return {
          success: false,
          error: 'PayPayは日本円（JPY）のみ対応しています'
        };
      }

      const result = await this.createQRCode({
        amount: config.amount,
        currency: 'JPY',
        orderId: config.orderId,
        description: config.description,
        metadata: config.metadata
      });

      return {
        success: result.success,
        paymentUrl: result.paymentUrl,
        paymentId: result.paymentId,
        qrCodeData: result.qrCodeData,
        error: result.error
      };
    } catch (error) {
      console.error('PayPay createPayment error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // 設定の検証
  static validateConfig(): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!process.env.PAYPAY_MERCHANT_ID) {
      errors.push('PAYPAY_MERCHANT_ID is not set');
    }

    if (!process.env.PAYPAY_API_KEY) {
      errors.push('PAYPAY_API_KEY is not set');
    }

    if (!process.env.PAYPAY_API_SECRET) {
      errors.push('PAYPAY_API_SECRET is not set');
    }

    if (process.env.NODE_ENV === 'production' && !process.env.PAYPAY_WEBHOOK_SECRET) {
      errors.push('PAYPAY_WEBHOOK_SECRET should be set in production');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}

// シングルトンインスタンス
let paypayInstance: PayPayService | null = null;

export function getPayPayService(): PayPayService {
  if (!paypayInstance) {
    paypayInstance = new PayPayService();
  }
  return paypayInstance;
}