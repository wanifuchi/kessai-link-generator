import '/Users/noriaki/.claude/browser-echo/client-snippet.js';
import { PaymentServiceInfo } from '@/types/payment';

export const PAYMENT_SERVICES: Record<string, PaymentServiceInfo> = {
  stripe: {
    id: 'stripe',
    name: 'stripe',
    displayName: 'Stripe',
    description: '世界中で利用される決済プラットフォーム。豊富な機能と優れたデベロッパー体験。',
    logo: '/service-logos/stripe.svg',
    feeRate: '3.6%',
    supportedCurrencies: ['JPY', 'USD', 'EUR', 'GBP', 'AUD', 'CAD', 'SGD'],
    supportedCountries: ['JP', 'US', 'GB', 'AU', 'CA', 'SG', 'HK', 'MY'],
    features: [
      'クレジットカード決済',
      'デジタルウォレット (Apple Pay, Google Pay)',
      'SEPA口座振替',
      'リカーリング決済',
      'マルチパーティ決済',
      'リアルタイム決済'
    ],
  },
  paypal: {
    id: 'paypal',
    name: 'paypal',
    displayName: 'PayPal',
    description: '世界最大のオンライン決済サービス。PayPalアカウントまたはクレジットカードで決済可能。',
    logo: '/service-logos/paypal.svg',
    feeRate: '3.6% + 40円',
    supportedCurrencies: ['JPY', 'USD', 'EUR', 'GBP', 'AUD', 'CAD'],
    supportedCountries: ['JP', 'US', 'GB', 'AU', 'CA', 'DE', 'FR'],
    features: [
      'PayPalアカウント決済',
      'クレジットカード決済',
      'PayPal Credit',
      '購入者保護制度',
      '分割払い (Pay in 4)',
      'QRコード決済'
    ],
  },
  square: {
    id: 'square',
    name: 'square',
    displayName: 'Square',
    description: '小規模事業者向けの包括的な決済ソリューション。シンプルな料金体系が魅力。',
    logo: '/service-logos/square.svg',
    feeRate: '3.6%',
    supportedCurrencies: ['JPY', 'USD', 'CAD', 'AUD', 'GBP'],
    supportedCountries: ['JP', 'US', 'CA', 'AU', 'GB'],
    features: [
      'クレジットカード決済',
      'デビットカード決済',
      'デジタルウォレット',
      'ギフトカード',
      '在庫管理連携',
      'オムニチャネル決済'
    ],
  },
  paypay: {
    id: 'paypay',
    name: 'paypay',
    displayName: 'PayPay',
    description: '日本国内で急成長中のスマートフォン決済サービス。QRコード決済の代表格。',
    logo: '/service-logos/paypay.svg',
    feeRate: '3.45%',
    supportedCurrencies: ['JPY'],
    supportedCountries: ['JP'],
    features: [
      'QRコード決済',
      'PayPay残高決済',
      'PayPayボーナス連携',
      'オンライン決済',
      'リカーリング決済',
      'ミニアプリ決済'
    ],
  },
  fincode: {
    id: 'fincode',
    name: 'fincode',
    displayName: 'fincode by GMO',
    description: 'GMOが提供する包括的な決済プラットフォーム。多様な決済方法に対応。',
    logo: '/service-logos/fincode.svg',
    feeRate: '3.24%〜',
    supportedCurrencies: ['JPY'],
    supportedCountries: ['JP'],
    features: [
      'クレジットカード決済',
      'コンビニ決済',
      '銀行振込',
      'PayPay決済',
      'Apple Pay決済'
    ],
  },
};

export const SUPPORTED_CURRENCIES = [
  { code: 'JPY', name: '日本円', symbol: '¥' },
  { code: 'USD', name: '米ドル', symbol: '$' },
  { code: 'EUR', name: 'ユーロ', symbol: '€' },
  { code: 'GBP', name: '英ポンド', symbol: '£' },
  { code: 'AUD', name: '豪ドル', symbol: 'A$' },
  { code: 'CAD', name: 'カナダドル', symbol: 'C$' },
  { code: 'SGD', name: 'シンガポールドル', symbol: 'S$' },
];

// サービス別の推奨利用ケース
export const SERVICE_USE_CASES = {
  stripe: {
    bestFor: ['国際展開', 'サブスクリプション', '技術重視'],
    pros: ['豊富な機能', '優れたAPI', '詳細なドキュメント', 'グローバル対応'],
    cons: ['日本語サポート限定', '高度すぎる場合も'],
  },
  paypal: {
    bestFor: ['グローバル展開', 'C2C決済', 'マーケットプレイス'],
    pros: ['世界的認知度', '購入者保護', '多通貨対応'],
    cons: ['手数料が高め', 'アカウント凍結リスク'],
  },
  square: {
    bestFor: ['小規模事業', '実店舗連携', 'シンプル決済'],
    pros: ['シンプルな料金', '統合POS', '使いやすい'],
    cons: ['機能が限定的', '日本でのサポート限定'],
  },
  paypay: {
    bestFor: ['日本国内', 'モバイル重視', 'QRコード決済'],
    pros: ['国内シェア高', '手数料競争力', 'QRコード決済'],
    cons: ['日本限定', '機能が限定的'],
  },
  fincode: {
    bestFor: ['日本国内', '多様な決済方法', 'コンビニ決済'],
    pros: ['多様な決済方法', 'コンビニ対応', '日本語サポート'],
    cons: ['国際展開に不向き', '複雑な設定'],
  },
};

export function getServiceInfo(serviceId: string): PaymentServiceInfo | undefined {
  return PAYMENT_SERVICES[serviceId];
}

export function getAllServices(): PaymentServiceInfo[] {
  return Object.values(PAYMENT_SERVICES);
}

export function getServicesForCurrency(currency: string): PaymentServiceInfo[] {
  return getAllServices().filter(service => 
    service.supportedCurrencies.includes(currency.toUpperCase())
  );
}

export function getServicesForCountry(country: string): PaymentServiceInfo[] {
  return getAllServices().filter(service => 
    service.supportedCountries.includes(country.toUpperCase())
  );
}