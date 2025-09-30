import { BasePaymentService } from './base';
import type {
  PaymentCredentials,
  PaymentRequest,
  PaymentLinkResponse,
} from '@/types/payment';

interface SquareLocation {
  id: string;
  name: string;
  status: string;
}

interface SquareCheckoutResponse {
  checkout: {
    id: string;
    checkout_page_url: string;
    order_id: string;
  };
}

export class SquarePaymentService extends BasePaymentService {
  private readonly baseUrl = 'https://connect.squareup.com/v2';
  private readonly sandboxUrl = 'https://connect.squareupsandbox.com/v2';

  private getApiUrl(isTestMode: boolean): string {
    return isTestMode ? this.sandboxUrl : this.baseUrl;
  }

  async validateCredentials(
    credentials: PaymentCredentials
  ): Promise<boolean> {
    try {
      const accessToken = credentials.apiKey;
      const isTestMode = credentials.isTestMode ?? false;

      if (!accessToken) {
        return false;
      }

      const response = await fetch(
        `${this.getApiUrl(isTestMode)}/locations`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
            'Square-Version': '2024-01-18',
          },
        }
      );

      if (!response.ok) {
        console.error(
          'Square credentials validation failed:',
          response.status
        );
        return false;
      }

      const data = await response.json();
      const locations = data.locations as SquareLocation[];

      return (
        Array.isArray(locations) &&
        locations.length > 0 &&
        locations.some((loc) => loc.status === 'ACTIVE')
      );
    } catch (error) {
      console.error('Square credentials validation error:', error);
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

      const accessToken = credentials.apiKey;
      const locationId = credentials.merchantId;
      const isTestMode = credentials.isTestMode ?? false;

      if (!accessToken || !locationId) {
        return {
          success: false,
          error: 'Square Access TokenまたはLocation IDが設定されていません',
        };
      }

      const amount = Math.round(paymentData.amount * 100);

      const checkoutPayload = {
        idempotency_key: `checkout_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        checkout: {
          order: {
            location_id: locationId,
            line_items: [
              {
                name: paymentData.description || 'お支払い',
                quantity: '1',
                base_price_money: {
                  amount: amount,
                  currency: paymentData.currency.toUpperCase(),
                },
              },
            ],
          },
          redirect_url: paymentData.successUrl,
          ask_for_shipping_address: false,
        },
      };

      const response = await fetch(
        `${this.getApiUrl(isTestMode)}/online-checkout/checkout`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
            'Square-Version': '2024-01-18',
          },
          body: JSON.stringify(checkoutPayload),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Square checkout creation failed:', errorData);
        return {
          success: false,
          error: `Square決済リンクの生成に失敗しました: ${errorData.errors?.[0]?.detail || response.statusText}`,
        };
      }

      const data: SquareCheckoutResponse = await response.json();

      return {
        success: true,
        paymentUrl: data.checkout.checkout_page_url,
        externalId: data.checkout.order_id,
        rawResponse: data,
      };
    } catch (error) {
      return this.handleError(error, 'Square決済リンク生成');
    }
  }
}