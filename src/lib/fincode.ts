import crypto from 'crypto';

export interface FincodePaymentRequest {
  amount: number;
  currency: string;
  orderId: string;
  description?: string;
  paymentMethod?: 'card' | 'konbini' | 'bank_transfer' | 'virtual_account';
  metadata?: Record<string, string>;
}

export interface FincodePaymentResponse {
  success: boolean;
  paymentUrl?: string;
  paymentId?: string;
  orderId?: string;
  paymentMethod?: string;
  error?: string;
}

export class FincodeService {
  private shopId: string;
  private secretKey: string;
  private publicKey: string;
  private environment: 'test' | 'live';

  constructor() {
    this.shopId = process.env.FINCODE_SHOP_ID || '';
    this.secretKey = process.env.FINCODE_SECRET_KEY || '';
    this.publicKey = process.env.FINCODE_PUBLIC_KEY || '';
    this.environment = process.env.FINCODE_ENVIRONMENT === 'live' ? 'live' : 'test';

    if (!this.shopId || !this.secretKey) {
      throw new Error('Fincode APIキーが設定されていません');
    }
  }

  private getBaseUrl(): string {
    return this.environment === 'live'
      ? 'https://api.fincode.jp'
      : 'https://api.test.fincode.jp';
  }

  private generateSignature(body: string, timestamp: string): string {
    const payload = `${timestamp}${body}`;
    return crypto
      .createHmac('sha256', this.secretKey)
      .update(payload)
      .digest('hex');
  }

  private getAuthHeaders(body: string = '') {
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const signature = this.generateSignature(body, timestamp);

    return {
      'Authorization': `Bearer ${this.secretKey}`,
      'Content-Type': 'application/json',
      'X-Fincode-Timestamp': timestamp,
      'X-Fincode-Signature': signature,
    };
  }

  async createPayment(request: FincodePaymentRequest): Promise<FincodePaymentResponse> {
    try {
      const paymentMethod = request.paymentMethod || 'card';

      // Fincodeは日本円のみ対応
      if (request.currency.toUpperCase() !== 'JPY') {
        throw new Error('Fincodeは日本円（JPY）のみ対応しています');
      }

      // Payment作成リクエスト
      const paymentRequest = {
        pay_type: this.getPayType(paymentMethod),
        shop_id: this.shopId,
        id: request.orderId,
        amount: Math.round(request.amount),
        currency: 'JPY',
        item_name: request.description || '決済商品',
        customer: {
          id: `customer_${Date.now()}`,
          name: 'ゲストユーザー',
          email: 'guest@example.com',
        },
        redirect_url: `${process.env.NEXTAUTH_URL}/payment/success?service=fincode&order_id=${request.orderId}`,
        cancel_url: `${process.env.NEXTAUTH_URL}/payment/cancel?service=fincode&order_id=${request.orderId}`,
        metadata: request.metadata || {},
      };

      const body = JSON.stringify(paymentRequest);
      const headers = this.getAuthHeaders(body);

      const response = await fetch(`${this.getBaseUrl()}/v1/payments`, {
        method: 'POST',
        headers,
        body,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Fincode Payment作成エラー: ${JSON.stringify(errorData)}`);
      }

      const responseData = await response.json();

      if (responseData.status !== 'created' && responseData.status !== 'authorized') {
        throw new Error(`Fincode Payment作成失敗: ${responseData.error_message || '不明なエラー'}`);
      }

      // 決済方法に応じて追加処理
      let paymentUrl = '';

      if (paymentMethod === 'card') {
        // クレジットカード決済用のセッション作成
        paymentUrl = await this.createCardSession(responseData.id);
      } else if (paymentMethod === 'konbini') {
        // コンビニ決済用の情報取得
        paymentUrl = await this.getKonbiniInfo(responseData.id);
      } else if (paymentMethod === 'bank_transfer') {
        // 銀行振込用の情報取得
        paymentUrl = await this.getBankTransferInfo(responseData.id);
      }

      return {
        success: true,
        paymentUrl,
        paymentId: responseData.id,
        orderId: request.orderId,
        paymentMethod,
      };

    } catch (error) {
      console.error('Fincode決済作成エラー:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Fincode決済の作成に失敗しました',
      };
    }
  }

  private getPayType(paymentMethod: string): string {
    switch (paymentMethod) {
      case 'card':
        return 'Card';
      case 'konbini':
        return 'Konbini';
      case 'bank_transfer':
        return 'Directdebit';
      case 'virtual_account':
        return 'Virtualaccount';
      default:
        return 'Card';
    }
  }

  private async createCardSession(paymentId: string): Promise<string> {
    try {
      const sessionRequest = {
        payment_id: paymentId,
        return_url: `${process.env.NEXTAUTH_URL}/payment/success?service=fincode&payment_id=${paymentId}`,
      };

      const body = JSON.stringify(sessionRequest);
      const headers = this.getAuthHeaders(body);

      const response = await fetch(`${this.getBaseUrl()}/v1/secure/sessions`, {
        method: 'POST',
        headers,
        body,
      });

      if (!response.ok) {
        throw new Error('Fincodeカード決済セッション作成エラー');
      }

      const sessionData = await response.json();
      return sessionData.redirect_url || '';

    } catch (error) {
      console.error('Fincodeカードセッション作成エラー:', error);
      return '';
    }
  }

  private async getKonbiniInfo(paymentId: string): Promise<string> {
    try {
      // コンビニ決済の場合は専用の決済ページURLを返す
      return `${process.env.NEXTAUTH_URL}/payment/konbini?payment_id=${paymentId}`;
    } catch (error) {
      console.error('Fincodeコンビニ決済情報取得エラー:', error);
      return '';
    }
  }

  private async getBankTransferInfo(paymentId: string): Promise<string> {
    try {
      // 銀行振込の場合は専用の決済ページURLを返す
      return `${process.env.NEXTAUTH_URL}/payment/bank-transfer?payment_id=${paymentId}`;
    } catch (error) {
      console.error('Fincode銀行振込情報取得エラー:', error);
      return '';
    }
  }

  async getPaymentStatus(paymentId: string): Promise<{
    status: 'pending' | 'completed' | 'failed' | 'canceled' | 'expired';
    amount?: number;
    currency?: string;
    paymentMethod?: string;
  }> {
    try {
      const headers = this.getAuthHeaders();

      const response = await fetch(`${this.getBaseUrl()}/v1/payments/${paymentId}`, {
        method: 'GET',
        headers,
      });

      if (!response.ok) {
        throw new Error('Fincode決済ステータス取得に失敗しました');
      }

      const data = await response.json();
      let status: 'pending' | 'completed' | 'failed' | 'canceled' | 'expired' = 'pending';

      switch (data.status) {
        case 'captured':
        case 'authorized':
          status = 'completed';
          break;
        case 'failed':
        case 'error':
          status = 'failed';
          break;
        case 'canceled':
          status = 'canceled';
          break;
        case 'expired':
          status = 'expired';
          break;
        default:
          status = 'pending';
      }

      return {
        status,
        amount: data.amount,
        currency: data.currency,
        paymentMethod: data.pay_type?.toLowerCase(),
      };

    } catch (error) {
      console.error('Fincode決済ステータス取得エラー:', error);
      return { status: 'failed' };
    }
  }

  verifyWebhook(body: string, signature: string): boolean {
    try {
      const webhookSecret = process.env.FINCODE_WEBHOOK_SECRET;
      if (!webhookSecret) {
        console.error('Fincode Webhook Secretが設定されていません');
        return false;
      }

      // Fincode Webhookの署名検証
      const hash = crypto
        .createHmac('sha256', webhookSecret)
        .update(body)
        .digest('hex');

      return hash === signature;
    } catch (error) {
      console.error('Fincode Webhook検証エラー:', error);
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
        payment_id: paymentId,
        amount: amount, // 部分返金の場合のみ金額指定
      };

      const body = JSON.stringify(refundRequest);
      const headers = this.getAuthHeaders(body);

      const response = await fetch(`${this.getBaseUrl()}/v1/payments/${paymentId}/refund`, {
        method: 'POST',
        headers,
        body,
      });

      if (!response.ok) {
        throw new Error('Fincode返金リクエストに失敗しました');
      }

      const data = await response.json();

      if (data.status !== 'refunded') {
        throw new Error(`Fincode返金エラー: ${data.error_message || '不明なエラー'}`);
      }

      return {
        success: true,
        refundId: data.id,
      };

    } catch (error) {
      console.error('Fincode返金エラー:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Fincode返金処理に失敗しました',
      };
    }
  }

  async cancelPayment(paymentId: string): Promise<boolean> {
    try {
      const headers = this.getAuthHeaders();

      const response = await fetch(`${this.getBaseUrl()}/v1/payments/${paymentId}/cancel`, {
        method: 'POST',
        headers,
      });

      if (!response.ok) {
        return false;
      }

      const data = await response.json();
      return data.status === 'canceled';

    } catch (error) {
      console.error('Fincode決済キャンセルエラー:', error);
      return false;
    }
  }
}

// シングルトンインスタンス
let fincodeInstance: FincodeService | null = null;

export function getFincodeService(): FincodeService {
  if (!fincodeInstance) {
    fincodeInstance = new FincodeService();
  }
  return fincodeInstance;
}