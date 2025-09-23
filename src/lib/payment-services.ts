import { PaymentService, PaymentServiceInfo } from '@/types/payment';

// 利用可能な決済サービス一覧
export const PAYMENT_SERVICES: Record<PaymentService, PaymentServiceInfo> = {
  stripe: {
    id: 'stripe',
    name: 'Stripe',
    displayName: 'Stripe',
    description: '世界中で利用されている信頼性の高い決済サービス',
    logo: '/logos/stripe.svg',
    feeRate: '3.6%',
    supportedCurrencies: ['JPY', 'USD', 'EUR', 'GBP', 'AUD', 'CAD'],
    supportedCountries: ['JP', 'US', 'GB', 'CA', 'AU', 'SG'],
    features: [
      'クレジットカード決済',
      '即座の決済完了',
      '詳細な決済データ',
      'セキュリティ対策',
    ],
  },
  paypal: {
    id: 'paypal',
    name: 'PayPal',
    displayName: 'PayPal',
    description: '世界最大のオンライン決済サービス',
    logo: '/logos/paypal.svg',
    feeRate: '3.6% + 40円',
    supportedCurrencies: ['JPY', 'USD', 'EUR', 'GBP', 'AUD', 'CAD'],
    supportedCountries: ['JP', 'US', 'GB', 'CA', 'AU', 'DE', 'FR'],
    features: [
      'PayPalアカウント決済',
      'クレジットカード決済',
      '買い手保護制度',
      '多通貨対応',
    ],
  },
  square: {
    id: 'square',
    name: 'Square',
    displayName: 'Square',
    description: 'シンプルで使いやすい決済ソリューション',
    logo: '/logos/square.svg',
    feeRate: '3.25%',
    supportedCurrencies: ['JPY', 'USD', 'CAD', 'GBP', 'AUD'],
    supportedCountries: ['JP', 'US', 'CA', 'GB', 'AU'],
    features: [
      'クレジットカード決済',
      'オンライン決済',
      '在庫管理',
      '売上分析',
    ],
  },
  paypay: {
    id: 'paypay',
    name: 'PayPay',
    displayName: 'PayPay',
    description: '日本で人気のQRコード決済サービス',
    logo: '/logos/paypay.svg',
    feeRate: '1.98%',
    supportedCurrencies: ['JPY'],
    supportedCountries: ['JP'],
    features: [
      'QRコード決済',
      'PayPay残高決済',
      '即座の決済完了',
      '日本特化',
    ],
  },
  fincode: {
    id: 'fincode',
    name: 'Fincode',
    displayName: 'Fincode',
    description: '日本発の総合決済プラットフォーム',
    logo: '/logos/fincode.svg',
    feeRate: '3.25%',
    supportedCurrencies: ['JPY'],
    supportedCountries: ['JP'],
    features: [
      'クレジットカード決済',
      'コンビニ決済',
      '銀行振込',
      '分割決済',
    ],
  },
};

// 決済サービスの使用用途別おすすめ
export const SERVICE_USE_CASES = {
  international: ['stripe', 'paypal'] as PaymentService[],
  domestic: ['paypay', 'fincode'] as PaymentService[],
  lowFee: ['paypay', 'square'] as PaymentService[],
  enterprise: ['stripe', 'fincode'] as PaymentService[],
  quickStart: ['stripe', 'paypal'] as PaymentService[],
};

// 全サービス取得
export function getAllServices(): PaymentServiceInfo[] {
  return Object.values(PAYMENT_SERVICES);
}

// 特定のサービス取得
export function getService(serviceId: PaymentService): PaymentServiceInfo | undefined {
  return PAYMENT_SERVICES[serviceId];
}

// 使用用途別のサービス取得
export function getServicesByUseCase(useCase: keyof typeof SERVICE_USE_CASES): PaymentServiceInfo[] {
  const serviceIds = SERVICE_USE_CASES[useCase];
  return serviceIds.map(id => PAYMENT_SERVICES[id]).filter(Boolean);
}

// サービスの利用可能性チェック
export function isServiceAvailable(serviceId: PaymentService): boolean {
  // 環境変数に基づいてサービスの利用可能性をチェック
  switch (serviceId) {
    case 'stripe':
      return !!(process.env.STRIPE_SECRET_KEY && process.env.STRIPE_WEBHOOK_SECRET);
    case 'paypal':
      return !!(process.env.PAYPAL_CLIENT_ID && process.env.PAYPAL_CLIENT_SECRET);
    case 'square':
      return !!(process.env.SQUARE_APPLICATION_ID && process.env.SQUARE_ACCESS_TOKEN);
    case 'paypay':
      return !!(process.env.PAYPAY_MERCHANT_ID && process.env.PAYPAY_API_KEY);
    case 'fincode':
      return !!(process.env.FINCODE_SHOP_ID && process.env.FINCODE_API_KEY);
    default:
      return false;
  }
}

// 利用可能なサービスのみ取得
export function getAvailableServices(): PaymentServiceInfo[] {
  return getAllServices().filter(service => isServiceAvailable(service.id));
}

// 通貨をサポートするサービス取得
export function getServicesByCurrency(currency: string): PaymentServiceInfo[] {
  return getAllServices().filter(service =>
    service.supportedCurrencies.includes(currency.toUpperCase())
  );
}

// 国をサポートするサービス取得
export function getServicesByCountry(countryCode: string): PaymentServiceInfo[] {
  return getAllServices().filter(service =>
    service.supportedCountries.includes(countryCode.toUpperCase())
  );
}

// 手数料の比較
export function compareServiceFees(): Array<{
  service: PaymentServiceInfo;
  estimatedFee: number;
  description: string;
}> {
  const baseAmount = 10000; // 10,000円での比較

  return getAllServices().map(service => {
    let estimatedFee = 0;
    let description = service.feeRate;

    // 簡易的な手数料計算（実際の計算はより複雑）
    if (service.id === 'stripe') {
      estimatedFee = baseAmount * 0.036;
    } else if (service.id === 'paypal') {
      estimatedFee = baseAmount * 0.036 + 40;
    } else if (service.id === 'square') {
      estimatedFee = baseAmount * 0.0325;
    } else if (service.id === 'paypay') {
      estimatedFee = baseAmount * 0.0198;
    } else if (service.id === 'fincode') {
      estimatedFee = baseAmount * 0.0325;
    }

    return {
      service,
      estimatedFee,
      description,
    };
  }).sort((a, b) => a.estimatedFee - b.estimatedFee);
}