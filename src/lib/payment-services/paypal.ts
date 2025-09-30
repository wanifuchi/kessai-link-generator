import { BasePaymentService } from './base';
import type {
  PaymentCredentials,
  PaymentRequest,
  PaymentLinkResponse,
} from '@/types/payment';

interface PayPalAccessTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

interface PayPalOrderResponse {
  id: string;
  status: string;
  links: Array<{
    href: string;
    rel: string;
    method: string;
  }>;
}

export class PayPalPaymentService extends BasePaymentService {
  private readonly baseUrl = 'https://api-m.paypal.com';
  private readonly sandboxUrl = 'https://api-m.sandbox.paypal.com';

  private getApiUrl(isTestMode: boolean): string {
    return isTestMode ? this.sandboxUrl : this.baseUrl;
  }

  private async getAccessToken(
    credentials: PaymentCredentials
  ): Promise<string> {
    const clientId = credentials.apiKey;
    const clientSecret = credentials.apiSecret;
    const isTestMode = credentials.isTestMode ?? false;

    const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

    const response = await fetch(
      `${this.getApiUrl(isTestMode)}/v1/oauth2/token`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: 'grant_type=client_credentials',
      }
    );

    if (!response.ok) {
      throw new Error('Failed to get PayPal access token');
    }

    const data: PayPalAccessTokenResponse = await response.json();
    return data.access_token;
  }

  async validateCredentials(
    credentials: PaymentCredentials
  ): Promise<boolean> {
    try {
      const accessToken = await this.getAccessToken(credentials);
      return !!accessToken;
    } catch (error) {
      console.error('PayPal credentials validation error:', error);
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

      const accessToken = await this.getAccessToken(credentials);
      const isTestMode = credentials.isTestMode ?? false;

      const orderPayload = {
        intent: 'CAPTURE',
        purchase_units: [
          {
            amount: {
              currency_code: paymentData.currency.toUpperCase(),
              value: paymentData.amount.toFixed(2),
            },
            description: paymentData.description || 'Payment',
          },
        ],
        application_context: {
          return_url: paymentData.successUrl,
          cancel_url: paymentData.cancelUrl,
        },
      };

      const response = await fetch(
        `${this.getApiUrl(isTestMode)}/v2/checkout/orders`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(orderPayload),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        console.error('PayPal order creation failed:', errorData);
        return {
          success: false,
          error: `PayPal決済リンクの生成に失敗しました: ${errorData.message || response.statusText}`,
        };
      }

      const data: PayPalOrderResponse = await response.json();
      const approveLink = data.links.find((link) => link.rel === 'approve');

      if (!approveLink) {
        return {
          success: false,
          error: 'PayPal決済リンクが見つかりませんでした',
        };
      }

      return {
        success: true,
        url: approveLink.href,
        linkId: data.id,
      };
    } catch (error) {
      return this.handleError(error, 'PayPal決済リンク生成');
    }
  }
}