import { BasePaymentService } from './base';
import type {
  PaymentCredentials,
  PaymentRequest,
  PaymentLinkResponse,
} from '@/types/payment';

interface FincodePaymentResponse {
  id: string;
  shop_id: string;
  pay_type: string;
  amount: number;
  status: string;
  access_id: string;
  payment_link_url: string;
}

export class FincodePaymentService extends BasePaymentService {
  private readonly baseUrl = 'https://api.fincode.jp/v1';
  private readonly sandboxUrl = 'https://api.test.fincode.jp/v1';

  private getApiUrl(isTestMode: boolean): string {
    return isTestMode ? this.sandboxUrl : this.baseUrl;
  }

  async validateCredentials(
    credentials: PaymentCredentials
  ): Promise<boolean> {
    try {
      const apiKey = credentials.apiKey;
      const shopId = credentials.merchantId;
      const isTestMode = credentials.isTestMode ?? false;

      if (!apiKey || !shopId) {
        return false;
      }

      const response = await fetch(
        `${this.getApiUrl(isTestMode)}/shops/${shopId}`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      return response.ok;
    } catch (error) {
      console.error('fincode credentials validation error:', error);
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
      const shopId = credentials.merchantId;
      const isTestMode = credentials.isTestMode ?? false;

      if (!apiKey || !shopId) {
        return {
          success: false,
          error: 'fincode API KeyまたはShop IDが設定されていません',
        };
      }

      const amount = Math.round(paymentData.amount);

      const paymentPayload = {
        pay_type: 'Card',
        job_code: 'AUTH',
        amount: amount,
        currency: paymentData.currency.toUpperCase(),
        client_field_1: paymentData.description || 'お支払い',
        redirect_url: paymentData.successUrl,
        redirect_type: 'always',
      };

      const response = await fetch(
        `${this.getApiUrl(isTestMode)}/payments`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(paymentPayload),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        console.error('fincode payment creation failed:', errorData);
        return {
          success: false,
          error: `fincode決済リンクの生成に失敗しました: ${errorData.error?.message || response.statusText}`,
        };
      }

      const data: FincodePaymentResponse = await response.json();

      return {
        success: true,
        paymentUrl: data.payment_link_url,
        externalId: data.id,
        rawResponse: data,
      };
    } catch (error) {
      return this.handleError(error, 'fincode決済リンク生成');
    }
  }
}