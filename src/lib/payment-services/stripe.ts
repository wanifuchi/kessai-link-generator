import Stripe from 'stripe';
import { BasePaymentService } from './base';
import { PaymentCredentials, PaymentRequest, PaymentLinkResponse, StripeCredentials } from '@/types/payment';

export class StripePaymentService extends BasePaymentService {
  private stripe: Stripe | null = null;

  constructor() {
    super('stripe');
  }

  private initializeStripe(credentials: StripeCredentials): void {
    if (!this.isStripeCredentials(credentials)) {
      throw new Error('Invalid Stripe credentials');
    }

    this.stripe = new Stripe(credentials.secretKey, {
      apiVersion: '2024-06-20',
      typescript: true,
    });
  }

  private isStripeCredentials(credentials: PaymentCredentials): credentials is StripeCredentials {
    const stripeCredentials = credentials as StripeCredentials;
    return !!(
      stripeCredentials.publishableKey &&
      stripeCredentials.secretKey &&
      stripeCredentials.environment &&
      ['test', 'live'].includes(stripeCredentials.environment)
    );
  }

  async validateCredentials(credentials: PaymentCredentials): Promise<boolean> {
    try {
      if (!this.isStripeCredentials(credentials)) {
        return false;
      }

      this.initializeStripe(credentials);

      // Stripe APIの接続テスト - アカウント情報を取得
      const account = await this.stripe!.accounts.retrieve();
      
      // PublicKeyの形式チェック
      const expectedPrefix = credentials.environment === 'test' ? 'pk_test_' : 'pk_live_';
      if (!credentials.publishableKey.startsWith(expectedPrefix)) {
        return false;
      }

      // SecretKeyの形式チェック
      const expectedSecretPrefix = credentials.environment === 'test' ? 'sk_test_' : 'sk_live_';
      if (!credentials.secretKey.startsWith(expectedSecretPrefix)) {
        return false;
      }

      return !!account.id;
    } catch (error: any) {
      console.error('Stripe credentials validation failed:', error);
      return false;
    }
  }

  async createPaymentLink(
    credentials: PaymentCredentials,
    paymentData: PaymentRequest
  ): Promise<PaymentLinkResponse> {
    try {
      // 事前チェック
      const validationError = this.validatePaymentRequest(paymentData);
      if (validationError) {
        return this.handleError(validationError, 'createPaymentLink');
      }

      if (!this.isStripeCredentials(credentials)) {
        return this.handleError('Invalid Stripe credentials', 'createPaymentLink');
      }

      // レート制限チェック
      if (!this.checkRateLimit()) {
        return this.handleError('Rate limit exceeded', 'createPaymentLink');
      }

      this.initializeStripe(credentials);

      // Stripe Product を作成
      const product = await this.stripe!.products.create({
        name: paymentData.productName,
        description: paymentData.description || undefined,
        metadata: paymentData.metadata || {},
      });

      // Stripe Price を作成
      const price = await this.stripe!.prices.create({
        product: product.id,
        currency: paymentData.currency.toLowerCase(),
        unit_amount: this.convertAmountForStripe(paymentData.amount, paymentData.currency),
        metadata: paymentData.metadata || {},
      });

      // Payment Link を作成
      const paymentLinkData: Stripe.PaymentLinkCreateParams = {
        line_items: [
          {
            price: price.id,
            quantity: paymentData.quantity || 1,
          },
        ],
        metadata: {
          ...paymentData.metadata,
          productName: paymentData.productName,
          originalAmount: paymentData.amount.toString(),
          currency: paymentData.currency,
          createdBy: 'kessai-link-generator',
        },
      };

      // オプション項目の追加
      if (paymentData.customerEmail) {
        paymentLinkData.customer_creation = 'always';
        paymentLinkData.collect_shipping_address = false;
      }

      if (paymentData.successUrl) {
        paymentLinkData.after_completion = {
          type: 'redirect',
          redirect: {
            url: paymentData.successUrl,
          },
        };
      }

      // 有効期限の設定
      if (paymentData.expiresAt) {
        const expirationDate = new Date(paymentData.expiresAt);
        if (this.validateExpiresAt(paymentData.expiresAt)) {
          paymentLinkData.restrictions = {
            completed_sessions: {
              limit: 1,
            },
          };
          // Stripe Payment Linksは直接的な有効期限設定がないため、メタデータに記録
          paymentLinkData.metadata!.expiresAt = paymentData.expiresAt;
        }
      }

      const paymentLink = await this.stripe!.paymentLinks.create(paymentLinkData);

      // 生成されたリンクの検証
      if (!this.validateGeneratedLink(paymentLink.url)) {
        return this.handleError('Generated link validation failed', 'createPaymentLink');
      }

      return {
        success: true,
        url: paymentLink.url,
        linkId: paymentLink.id,
        expiresAt: paymentData.expiresAt,
      };

    } catch (error: any) {
      return this.handleError(error, 'createPaymentLink');
    }
  }

  /**
   * Stripeの金額形式に変換（最小通貨単位）
   */
  private convertAmountForStripe(amount: number, currency: string): number {
    const zeroDecimalCurrencies = ['JPY', 'KRW', 'VND', 'CLP'];
    
    if (zeroDecimalCurrencies.includes(currency.toUpperCase())) {
      return Math.round(amount);
    }
    
    // その他の通貨は100倍（セント単位）
    return Math.round(amount * 100);
  }

  /**
   * Stripe固有の金額検証
   */
  protected validateAmount(amount: number, currency: string): boolean {
    if (!super.validateAmount(amount, currency)) {
      return false;
    }

    // Stripe固有の制限
    const currencyLimits: Record<string, { min: number; max: number }> = {
      'JPY': { min: 50, max: 9999999 },
      'USD': { min: 0.50, max: 99999.99 },
      'EUR': { min: 0.50, max: 99999.99 },
      'GBP': { min: 0.30, max: 99999.99 },
    };

    const limits = currencyLimits[currency.toUpperCase()];
    if (limits) {
      return amount >= limits.min && amount <= limits.max;
    }

    return true;
  }

  /**
   * Webhook署名の検証（将来の拡張用）
   */
  validateWebhookSignature(payload: string, signature: string, secret: string): boolean {
    try {
      if (!this.stripe) return false;
      
      const event = this.stripe.webhooks.constructEvent(payload, signature, secret);
      return !!event;
    } catch {
      return false;
    }
  }
}