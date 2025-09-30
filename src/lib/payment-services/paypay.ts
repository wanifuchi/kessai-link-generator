import { BasePaymentService } from './base';
import type {
  PaymentCredentials,
  PaymentRequest,
  PaymentLinkResponse,
} from '@/types/payment';

interface PayPayCreatePaymentResponse {
  resultInfo: {
    code: string;
    message: string;
  };
  data: {
    paymentId: string;
    url: string;
    expiryDate: number;
  };
}

export class PayPayPaymentService extends BasePaymentService {
  private readonly baseUrl = 'https://api.paypay.ne.jp';
  private readonly sandboxUrl = 'https://stg-api.sandbox.paypay.ne.jp';

  private getApiUrl(isTestMode: boolean): string {
    return isTestMode ? this.sandboxUrl : this.baseUrl;
  }

  async validateCredentials(
    credentials: PaymentCredentials
  ): Promise<boolean> {
    try {
      const apiKey = credentials.apiKey;
      const apiSecret = credentials.apiSecret;
      const isTestMode = credentials.isTestMode ?? false;

      if (!apiKey || !apiSecret) {
        return false;
      }

      const response = await fetch(
        `${this.getApiUrl(isTestMode)}/v2/codes`,
        {
          method: 'GET',
          headers: {
            'X-ASSUME-MERCHANT': credentials.merchantId || '',
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      return response.ok;
    } catch (error) {
      console.error('PayPay credentials validation error:', error);
      return false;
    }
  }

  async createPaymentLink(
    credentials: PaymentCredentials,
    paymentData: PaymentRequest
  ): Promise<PaymentLinkResponse> {
    try {
      const validationError = this.validatePaymentRequest(paymentData);
      if (validationError) {
        return {
          success: false,
          error: validationError,
        };
      }

      const apiKey = credentials.apiKey;
      const apiSecret = credentials.apiSecret;
      const merchantId = credentials.merchantId;
      const isTestMode = credentials.isTestMode ?? false;

      if (!apiKey || !apiSecret || !merchantId) {
        return {
          success: false,
          error: 'PayPay API Key、API Secret、またはMerchant IDが設定されていません',
        };
      }

      const amount = {
        amount: paymentData.amount,
        currency: paymentData.currency.toUpperCase(),
      };

      const paymentPayload = {
        merchantPaymentId: `payment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        amount: amount,
        codeType: 'ORDER_QR',
        orderDescription: paymentData.description || 'お支払い',
        redirectUrl: paymentData.successUrl,
        redirectType: 'WEB_LINK',
      };

      const response = await fetch(
        `${this.getApiUrl(isTestMode)}/v2/codes`,
        {
          method: 'POST',
          headers: {
            'X-ASSUME-MERCHANT': merchantId,
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(paymentPayload),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        console.error('PayPay payment creation failed:', errorData);
        return {
          success: false,
          error: `PayPay決済リンクの生成に失敗しました: ${errorData.resultInfo?.message || response.statusText}`,
        };
      }

      const data: PayPayCreatePaymentResponse = await response.json();

      if (data.resultInfo.code !== 'SUCCESS') {
        return {
          success: false,
          error: `PayPay決済リンクの生成に失敗しました: ${data.resultInfo.message}`,
        };
      }

      return {
        success: true,
        paymentUrl: data.data.url,
        externalId: data.data.paymentId,
        rawResponse: data,
      };
    } catch (error) {
      return this.handleError(error, 'PayPay決済リンク生成');
    }
  }
}