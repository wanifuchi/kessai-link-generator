export type PaymentService = 'stripe' | 'paypal' | 'square' | 'paypay' | 'linepay' | 'fincode';

export type Environment = 'test' | 'production' | 'sandbox' | 'live';

export interface PaymentServiceInfo {
  id: PaymentService;
  name: string;
  displayName: string;
  description: string;
  logo: string;
  feeRate: string;
  supportedCurrencies: string[];
  supportedCountries: string[];
  features: string[];
}

export interface StripeCredentials {
  publishableKey: string;
  secretKey: string;
  webhookSecret?: string;
  environment: 'test' | 'live';
}

export interface PayPalCredentials {
  clientId: string;
  clientSecret: string;
  environment: 'sandbox' | 'production';
}

export interface SquareCredentials {
  applicationId: string;
  accessToken: string;
  environment: 'sandbox' | 'production';
}

export interface PayPayCredentials {
  merchantId: string;
  apiKey: string;
  apiSecret: string;
  environment: 'test' | 'production';
}

export interface LinePayCredentials {
  channelId: string;
  channelSecret: string;
  environment: 'beta' | 'real';
}

export interface FincodeCredentials {
  shopId: string;
  apiKey: string;
  environment: 'test' | 'live';
}

export type PaymentCredentials = 
  | StripeCredentials 
  | PayPalCredentials 
  | SquareCredentials 
  | PayPayCredentials 
  | LinePayCredentials 
  | FincodeCredentials;

export interface PaymentRequest {
  amount: number;
  currency: string;
  productName: string;
  description?: string;
  quantity?: number;
  customerEmail?: string;
  expiresAt?: string;
  successUrl?: string;
  cancelUrl?: string;
  metadata?: Record<string, any>;
}

export interface PaymentLinkResponse {
  success: boolean;
  url?: string;
  shortUrl?: string;
  qrCode?: string;
  linkId?: string;
  expiresAt?: string;
  error?: string;
  errorDetails?: any;
}

export interface PaymentLink {
  id: string;
  service: PaymentService;
  url: string;
  shortUrl?: string;
  qrCode?: string;
  amount: number;
  currency: string;
  productName: string;
  description?: string;
  customerEmail?: string;
  expiresAt?: Date;
  createdAt: Date;
  metadata?: Record<string, any>;
}

export interface ApiValidationResponse {
  isValid: boolean;
  service: PaymentService;
  environment: Environment;
  error?: string;
  details?: any;
}

// Zustand Store Types
export interface PaymentStore {
  selectedService: PaymentService | null;
  credentials: PaymentCredentials | null;
  paymentRequest: PaymentRequest | null;
  generatedLink: PaymentLinkResponse | null;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  setSelectedService: (service: PaymentService) => void;
  setCredentials: (credentials: PaymentCredentials) => void;
  setPaymentRequest: (request: PaymentRequest) => void;
  setGeneratedLink: (link: PaymentLinkResponse) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}