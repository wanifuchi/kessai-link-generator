import prisma from './prisma';
import { PaymentService } from '@prisma/client';
import { StripePaymentService } from './payment-services/stripe';
import { PayPalPaymentService } from './payment-services/paypal';
import { SquarePaymentService } from './payment-services/square';
import { PayPayPaymentService } from './payment-services/paypay';
import { FincodePaymentService } from './payment-services/fincode';
import type {
  PaymentCredentials,
  PaymentRequest,
  PaymentLinkResponse,
} from '@/types/payment';

export interface CreatePaymentIntentRequest {
  linkId: string;
  amount: number;
  currency: string;
  description?: string;
  userPaymentConfigId: string;
}

export interface PaymentIntentResult {
  clientSecret?: string;
  paymentIntentId: string;
  paymentUrl: string;
}

function getPaymentServiceInstance(provider: PaymentService, isTestMode: boolean = false) {
  const environment = isTestMode ? 'test' : 'production';

  switch (provider) {
    case PaymentService.stripe:
      return new StripePaymentService(provider, environment);
    case PaymentService.paypal:
      return new PayPalPaymentService(provider, environment);
    case PaymentService.square:
      return new SquarePaymentService(provider, environment);
    case PaymentService.paypay:
      return new PayPayPaymentService(provider, environment);
    case PaymentService.fincode:
      return new FincodePaymentService(provider, environment);
    default:
      throw new Error(`Unsupported payment service: ${provider}`);
  }
}

function parseEncryptedConfig(encryptedConfig: string): PaymentCredentials {
  try {
    const config = JSON.parse(encryptedConfig);
    return {
      apiKey: config.apiKey || config.secretKey || '',
      apiSecret: config.apiSecret || config.clientSecret || '',
      merchantId: config.merchantId || config.locationId || config.shopId || '',
      isTestMode: config.isTestMode || false,
    };
  } catch (error) {
    throw new Error('決済設定の解析に失敗しました');
  }
}

export async function createPaymentIntent({
  linkId,
  amount,
  currency,
  description,
  userPaymentConfigId,
}: CreatePaymentIntentRequest): Promise<PaymentIntentResult> {
  const paymentConfig = await prisma.userPaymentConfig.findUnique({
    where: { id: userPaymentConfigId },
  });

  if (!paymentConfig) {
    throw new Error('決済設定が見つかりません');
  }

  if (!paymentConfig.isActive) {
    throw new Error('決済設定が無効になっています');
  }

  const credentials = parseEncryptedConfig(paymentConfig.encryptedConfig);

  const paymentService = getPaymentServiceInstance(paymentConfig.provider, paymentConfig.isTestMode);

  const successUrl = `${process.env.NEXTAUTH_URL}/pay/${linkId}/success`;
  const cancelUrl = `${process.env.NEXTAUTH_URL}/pay/${linkId}/cancel`;

  const paymentRequest: PaymentRequest = {
    amount,
    currency: currency.toLowerCase(),
    description: description || '決済リンクからの支払い',
    successUrl,
    cancelUrl,
    metadata: {
      linkId,
      userPaymentConfigId,
    },
  };

  try {
    const result: PaymentLinkResponse = await paymentService.createPaymentLink(
      credentials,
      paymentRequest
    );

    if (!result.success) {
      throw new Error(result.error || '決済リンクの作成に失敗しました');
    }

    return {
      clientSecret: undefined,
      paymentIntentId: result.linkId || linkId,
      paymentUrl: result.url || '',
    };
  } catch (error) {
    console.error('Payment creation error:', error);
    throw new Error('決済の作成に失敗しました');
  }
}

export async function getPaymentIntentStatus(
  paymentIntentId: string,
  encryptedConfig: string
): Promise<string> {
  // TODO: 各サービスのステータス確認実装
  return 'pending';
}

export async function cancelPaymentIntent(
  paymentIntentId: string,
  encryptedConfig: string
): Promise<void> {
  // TODO: 各サービスのキャンセル実装
  console.log('Cancel payment intent:', paymentIntentId);
}