'use client';

import { useState, useEffect, useCallback } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  CardElement,
  useStripe,
  useElements
} from '@stripe/react-stripe-js';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CreditCard, CheckCircle, AlertCircle } from 'lucide-react';

// Stripe公開キーの設定（環境に応じて動的に設定）
const getStripePublicKey = (isTestMode: boolean = false) => {
  return isTestMode
    ? process.env.NEXT_PUBLIC_STRIPE_TEST_PUBLISHABLE_KEY
    : process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
};

interface PaymentFormProps {
  paymentLinkId: string;
  amount: number;
  currency: string;
  description?: string;
  isTestMode?: boolean;
  onSuccess?: (paymentIntent: any) => void;
  onError?: (error: string) => void;
}

interface PaymentIntentResponse {
  clientSecret: string;
  paymentIntentId: string;
  amount: number;
  currency: string;
  description?: string;
}

/**
 * Stripe決済フォームコンポーネント
 */
function PaymentForm({ paymentLinkId, amount, currency, description, isTestMode = false, onSuccess, onError }: PaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [clientSecret, setClientSecret] = useState<string>('');
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');

  // Payment Intent作成
  const createPaymentIntent = useCallback(async () => {
    try {
      const response = await fetch('/api/payments/stripe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          paymentLinkId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Payment Intentの作成に失敗しました');
      }

      const data: PaymentIntentResponse = await response.json();
      setClientSecret(data.clientSecret);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Payment Intentの作成に失敗しました';
      setError(errorMessage);
      onError?.(errorMessage);
    }
  }, [paymentLinkId, onError]);

  // コンポーネント初期化時にPayment Intentを作成
  useEffect(() => {
    createPaymentIntent();
  }, [createPaymentIntent]);

  // 決済処理
  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements || !clientSecret) {
      return;
    }

    setIsLoading(true);
    setError('');
    setPaymentStatus('processing');

    const cardElement = elements.getElement(CardElement);

    if (!cardElement) {
      setError('カード要素が見つかりません');
      setIsLoading(false);
      setPaymentStatus('error');
      return;
    }

    // 決済実行
    const { error: paymentError, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
      payment_method: {
        card: cardElement,
      },
    });

    setIsLoading(false);

    if (paymentError) {
      const errorMessage = paymentError.message || '決済に失敗しました';
      setError(errorMessage);
      setPaymentStatus('error');
      onError?.(errorMessage);
    } else if (paymentIntent && paymentIntent.status === 'succeeded') {
      setPaymentStatus('success');
      onSuccess?.(paymentIntent);
    }
  };

  // 成功時の表示
  if (paymentStatus === 'success') {
    return (
      <Card className="border-green-200 bg-green-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-800">
            <CheckCircle className="h-5 w-5" />
            決済が完了しました
          </CardTitle>
          <CardDescription className="text-green-700">
            決済が正常に処理されました。ありがとうございました。
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-green-700">金額:</span>
              <span className="font-medium">{amount.toLocaleString()} {currency.toUpperCase()}</span>
            </div>
            {description && (
              <div className="flex justify-between">
                <span className="text-green-700">内容:</span>
                <span className="font-medium">{description}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          カード決済
        </CardTitle>
        <CardDescription>
          安全なStripe決済システムで処理されます
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* 決済情報表示 */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">お支払い金額:</span>
              <span className="font-semibold text-lg">{amount.toLocaleString()} {currency.toUpperCase()}</span>
            </div>
            {description && (
              <div className="flex justify-between">
                <span className="text-gray-600">内容:</span>
                <span>{description}</span>
              </div>
            )}
          </div>
        </div>

        {/* エラー表示 */}
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* 決済フォーム */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* カード入力フィールド */}
          <div className="space-y-2">
            <label className="text-sm font-medium">カード情報</label>
            <div className="p-3 border border-gray-300 rounded-md bg-white">
              <CardElement
                options={{
                  style: {
                    base: {
                      fontSize: '16px',
                      color: '#424770',
                      '::placeholder': {
                        color: '#aab7c4',
                      },
                    },
                    invalid: {
                      color: '#9e2146',
                    },
                  },
                  hidePostalCode: true,
                }}
              />
            </div>
          </div>

          {/* 決済ボタン */}
          <Button
            type="submit"
            disabled={!stripe || !clientSecret || isLoading || paymentStatus === 'processing'}
            className="w-full"
            size="lg"
          >
            {isLoading || paymentStatus === 'processing' ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                決済処理中...
              </>
            ) : (
              <>
                <CreditCard className="mr-2 h-4 w-4" />
                {amount.toLocaleString()} {currency.toUpperCase()}を支払う
              </>
            )}
          </Button>
        </form>

        {/* セキュリティ情報 */}
        <div className="mt-4 text-xs text-gray-500 text-center">
          <p>🔒 SSL暗号化により安全に保護されています</p>
          <p>Powered by Stripe{isTestMode && ' (テストモード)'}</p>
          {isTestMode && (
            <p className="text-orange-600 font-medium">
              ※ これはテスト環境です。実際の請求は発生しません。
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Stripe Elementsプロバイダー付きの決済フォーム
 */
export default function StripePaymentForm(props: PaymentFormProps) {
  const publicKey = getStripePublicKey(props.isTestMode);
  const stripePromise = publicKey ? loadStripe(publicKey) : null;

  if (!stripePromise) {
    return (
      <Card>
        <CardContent className="pt-6">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Stripe設定が正しくありません。管理者にお問い合わせください。
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Elements stripe={stripePromise}>
      <PaymentForm {...props} />
    </Elements>
  );
}