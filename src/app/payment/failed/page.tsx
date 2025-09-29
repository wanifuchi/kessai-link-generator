'use client';

import { useEffect, useState, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { XCircle, Home, RefreshCw, HelpCircle } from 'lucide-react';

interface PaymentLinkDetails {
  id: string;
  title: string;
  amount: number;
  currency: string;
  status: string;
}

function PaymentFailedContent() {
  const searchParams = useSearchParams();
  const paymentLinkId = searchParams.get('payment_link_id');
  const errorCode = searchParams.get('error');
  const [paymentDetails, setPaymentDetails] = useState<PaymentLinkDetails | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (paymentLinkId) {
      fetchPaymentDetails();
    } else {
      setLoading(false);
    }
  }, [paymentLinkId, fetchPaymentDetails]);

  const fetchPaymentDetails = useCallback(async () => {
    try {
      const response = await fetch(`/api/payment-links/${paymentLinkId}`);
      const data = await response.json();

      if (data.success && data.data) {
        setPaymentDetails({
          id: data.data.id,
          title: data.data.title,
          amount: data.data.amount,
          currency: data.data.currency,
          status: data.data.status,
        });
      }
    } catch (error) {
      console.error('決済情報取得エラー:', error);
    } finally {
      setLoading(false);
    }
  }, [paymentLinkId]);

  const formatAmount = (amount: number, currency: string) => {
    return new Intl.NumberFormat('ja-JP', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
    }).format(amount / 100);
  };

  const getErrorMessage = (errorCode: string | null) => {
    switch (errorCode) {
      case 'cancelled':
        return 'お客様による決済がキャンセルされました';
      case 'expired':
        return '決済リンクの有効期限が切れています';
      case 'insufficient_funds':
        return '残高不足のため決済を完了できませんでした';
      case 'card_declined':
        return 'カードが拒否されました';
      case 'payment_failed':
        return '決済処理に失敗しました';
      default:
        return '決済の処理中に問題が発生しました';
    }
  };

  const getRetryUrl = () => {
    if (!paymentLinkId) return '/';
    return `/p/${paymentLinkId}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-6">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
              <p className="mt-2 text-gray-600">読み込み中...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4">
            <XCircle className="h-16 w-16 text-red-500" />
          </div>
          <CardTitle className="text-2xl text-red-600">決済失敗</CardTitle>
          <CardDescription>
            {getErrorMessage(errorCode)}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* 決済情報（利用可能な場合） */}
          {paymentDetails && (
            <div className="bg-gray-50 p-4 rounded-lg space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">商品名</span>
                <span className="font-medium">{paymentDetails.title}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">金額</span>
                <span className="font-bold">
                  {formatAmount(paymentDetails.amount, paymentDetails.currency)}
                </span>
              </div>
            </div>
          )}

          {/* エラー詳細 */}
          <div className="text-sm text-gray-600 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-2">
              <HelpCircle className="h-4 w-4 text-yellow-600" />
              <span className="font-medium text-yellow-800">よくある解決方法</span>
            </div>
            <ul className="list-disc list-inside space-y-1 text-yellow-700">
              <li>カード情報を再度確認してください</li>
              <li>カードの利用限度額をご確認ください</li>
              <li>別の決済方法をお試しください</li>
              <li>しばらく時間をおいてから再度お試しください</li>
            </ul>
          </div>

          {/* アクションボタン */}
          <div className="space-y-3">
            {paymentLinkId && (
              <Button asChild className="w-full">
                <Link href={getRetryUrl()} className="flex items-center gap-2">
                  <RefreshCw className="h-4 w-4" />
                  もう一度試す
                </Link>
              </Button>
            )}

            <Button variant="outline" asChild className="w-full">
              <Link href="/" className="flex items-center gap-2">
                <Home className="h-4 w-4" />
                ホームに戻る
              </Link>
            </Button>
          </div>

          {/* サポート情報 */}
          <div className="text-center text-xs text-gray-500 border-t pt-4">
            <p>問題が解決しない場合は、カスタマーサポートまでお問い合わせください。</p>
            {paymentLinkId && (
              <p className="mt-1">
                参照ID: <span className="font-mono">{paymentLinkId}</span>
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function LoadingFallback() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardContent className="p-6">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
            <p className="mt-2 text-gray-600">読み込み中...</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function PaymentFailedPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <PaymentFailedContent />
    </Suspense>
  );
}