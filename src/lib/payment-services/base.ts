import { PaymentService, PaymentCredentials, PaymentRequest, PaymentLinkResponse, Environment } from '@/types/payment';

export abstract class BasePaymentService {
  protected service: PaymentService;
  protected environment: Environment;

  constructor(service: PaymentService, environment: Environment = 'test') {
    this.service = service;
    this.environment = environment;
  }

  /**
   * 認証情報の妥当性をチェックする
   */
  abstract validateCredentials(credentials: PaymentCredentials): Promise<boolean>;

  /**
   * 決済リンクを生成する
   */
  abstract createPaymentLink(
    credentials: PaymentCredentials,
    paymentData: PaymentRequest
  ): Promise<PaymentLinkResponse>;

  /**
   * 共通のエラーハンドリング
   */
  protected handleError(error: any, context: string): PaymentLinkResponse {
    console.error(`[${this.service.toUpperCase()}] Error in ${context}:`, error);
    
    let errorMessage = 'Unknown error occurred';
    
    if (error?.message) {
      errorMessage = error.message;
    } else if (typeof error === 'string') {
      errorMessage = error;
    } else if (error?.error?.message) {
      errorMessage = error.error.message;
    }

    return {
      success: false,
      error: errorMessage,
      errorDetails: {
        service: this.service,
        context,
        originalError: error,
        timestamp: new Date().toISOString(),
      },
    };
  }

  /**
   * URLの妥当性をチェック
   */
  protected validateUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * 金額の妥当性をチェック
   */
  protected validateAmount(amount: number, currency: string): boolean {
    if (amount <= 0) return false;
    
    // 通貨ごとの最小金額チェック
    const minimumAmounts: Record<string, number> = {
      'JPY': 50,   // 50円
      'USD': 0.50, // 50セント
      'EUR': 0.50, // 50セント
      'GBP': 0.30, // 30ペンス
    };

    const minimum = minimumAmounts[currency.toUpperCase()] || 0.50;
    return amount >= minimum;
  }

  /**
   * 通貨コードの妥当性をチェック
   */
  protected validateCurrency(currency: string): boolean {
    const supportedCurrencies = [
      'JPY', 'USD', 'EUR', 'GBP', 'CAD', 'AUD', 'SGD', 'CHF', 'NOK', 'SEK', 'DKK'
    ];
    return supportedCurrencies.includes(currency.toUpperCase());
  }

  /**
   * メールアドレスの妥当性をチェック
   */
  protected validateEmail(email?: string): boolean {
    if (!email) return true; // Optional field
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * 共通の事前チェック
   */
  protected validatePaymentRequest(request: PaymentRequest): string | null {
    if (!this.validateAmount(request.amount, request.currency)) {
      return `Invalid amount: ${request.amount} ${request.currency}`;
    }

    if (!this.validateCurrency(request.currency)) {
      return `Unsupported currency: ${request.currency}`;
    }

    if (!request.productName?.trim()) {
      return 'Product name is required';
    }

    if (request.customerEmail && !this.validateEmail(request.customerEmail)) {
      return 'Invalid email address';
    }

    if (request.successUrl && !this.validateUrl(request.successUrl)) {
      return 'Invalid success URL';
    }

    if (request.cancelUrl && !this.validateUrl(request.cancelUrl)) {
      return 'Invalid cancel URL';
    }

    return null; // No validation errors
  }

  /**
   * 有効期限の妥当性をチェック
   */
  protected validateExpiresAt(expiresAt?: string): boolean {
    if (!expiresAt) return true; // Optional field

    const expiration = new Date(expiresAt);
    const now = new Date();
    
    // 現在時刻より未来で、かつ1年以内であることをチェック
    const oneYearFromNow = new Date();
    oneYearFromNow.setFullYear(now.getFullYear() + 1);
    
    return expiration > now && expiration <= oneYearFromNow;
  }

  /**
   * レート制限をチェック（基本実装）
   */
  protected checkRateLimit(): boolean {
    // TODO: Redis や メモリキャッシュを使った実装
    // 現在は基本実装として true を返す
    return true;
  }

  /**
   * 生成されたリンクの妥当性を検証
   */
  protected validateGeneratedLink(url: string): boolean {
    return this.validateUrl(url) && (
      url.startsWith('https://') || 
      (process.env.NODE_ENV === 'development' && url.startsWith('http://'))
    );
  }
}