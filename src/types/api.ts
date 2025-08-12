import { PaymentService, PaymentCredentials, PaymentRequest, Environment } from './payment';

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface CreatePaymentLinkRequest {
  service: PaymentService;
  credentials: PaymentCredentials;
  paymentData: PaymentRequest;
}

export interface ValidateCredentialsRequest {
  service: PaymentService;
  credentials: PaymentCredentials;
}

export interface GenerateQRRequest {
  url: string;
  size?: number;
  margin?: number;
}

export interface DatabasePaymentLink {
  id: string;
  sessionId: string;
  service: PaymentService;
  amount: number;
  currency: string;
  productName: string;
  description?: string;
  linkUrl: string;
  qrCode?: string;
  shortUrl?: string;
  expiresAt?: Date;
  createdAt: Date;
  metadata?: any;
}

export interface DatabaseUserSettings {
  id: string;
  sessionId: string;
  serviceName: PaymentService;
  credentialsEncrypted: string;
  environment: Environment;
  createdAt: Date;
  updatedAt: Date;
}