'use client';

import { useEffect, useState, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, Home, RefreshCw, ArrowLeft, ArrowRight, RotateCcw } from 'lucide-react';

interface PaymentLinkDetails {
  id: string;
  title: string;
  amount: number;
  currency: string;
  status: string;
}

function PaymentCancelContent() {
  const searchParams = useSearchParams();
  const paymentLinkId = searchParams.get('payment_link_id');
  const [paymentDetails, setPaymentDetails] = useState<PaymentLinkDetails | null>(null);
  const [loading, setLoading] = useState(true);

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

  useEffect(() => {
    if (paymentLinkId) {
      fetchPaymentDetails();
    } else {
      setLoading(false);
    }
  }, [paymentLinkId, fetchPaymentDetails]);

  const formatAmount = (amount: number, currency: string) => {
    return new Intl.NumberFormat('ja-JP', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
    }).format(amount / 100);
  };

  const getRetryUrl = () => {
    if (!paymentLinkId) return '/';
    return `/p/${paymentLinkId}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-orange-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-xl border-0">
          <CardContent className="p-6">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">読み込み中...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-orange-50 py-12">
      <div className="container mx-auto px-4 max-w-2xl">
        <Card className="shadow-xl border-0">
          <CardHeader className="text-center pb-8 pt-12">
            <div className="mx-auto mb-6">
              <div className="relative">
                <AlertCircle className="h-24 w-24 text-yellow-600 animate-pulse" />
                <div className="absolute -inset-4 bg-yellow-100 rounded-full blur-xl opacity-50"></div>
              </div>
            </div>
            <CardTitle className="text-3xl font-bold text-gray-900">決済がキャンセルされました</CardTitle>
            <CardDescription className="text-lg text-gray-600 mt-2">
              決済は正常にキャンセルされ、お客様には料金は請求されていません。
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* 決済情報（利用可能な場合） */}
            {paymentDetails && (
              <div className="bg-gray-50 rounded-lg p-6 space-y-4">
                <h3 className="font-medium text-gray-900 mb-3">キャンセルされた決済</h3>
                <div className="flex justify-between items-center border-b pb-4">
                  <span className="text-sm text-gray-600">商品・サービス</span>
                  <span className="font-medium text-lg">{paymentDetails.title}</span>
                </div>
                <div className="flex justify-between items-center border-b pb-4">
                  <span className="text-sm text-gray-600">金額</span>
                  <span className="font-bold text-2xl text-gray-700">
                    {formatAmount(paymentDetails.amount, paymentDetails.currency)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">ステータス</span>
                  <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium">
                    キャンセル済み
                  </span>
                </div>
              </div>
            )}

            {/* 情報メッセージ */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                <strong>💳 決済がキャンセルされました</strong><br />
                お客様に料金は請求されていません。引き続きお買い物をご希望の場合は、下のボタンから再度決済を行ってください。
              </p>
            </div>

            {/* アクションボタン */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              {paymentLinkId && (
                <Button className="flex-1" asChild>
                  <Link href={getRetryUrl()} className="flex items-center justify-center gap-2">
                    <RotateCcw className="h-4 w-4" />
                    再度決済する
                  </Link>
                </Button>
              )}

              <Button variant="outline" className="flex-1" asChild>
                <Link href="/" className="flex items-center justify-center gap-2">
                  <Home className="h-4 w-4" />
                  ホームに戻る
                </Link>
              </Button>
            </div>

            {/* 注意事項 */}
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-600">
                <strong>📋 ご注意</strong><br />
                決済がキャンセルされた場合、クレジットカード等に仮押さえが発生している場合がありますが、数営業日以内に自動的に解除されます。
              </p>
            </div>

            <div className="text-center pt-4">
              <p className="text-sm text-gray-500">
                ご不明な点がございましたら、
                <a href="mailto:support@example.com" className="text-blue-600 hover:underline ml-1">
                  サポート
                </a>
                までお問い合わせください。
              </p>
            </div>
          </CardContent>
        </Card>

        {/* 次のアクション提案 */}
        <div className="mt-8 text-center">
          <h2 className="text-lg font-medium text-gray-900 mb-4">お困りですか？</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Link href="/create">
              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="text-left">
                      <h3 className="font-medium">新しい決済リンク</h3>
                      <p className="text-sm text-gray-600">別の決済を作成</p>
                    </div>
                    <ArrowRight className="h-5 w-5 text-gray-400" />
                  </div>
                </CardContent>
              </Card>
            </Link>

            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="text-left">
                    <h3 className="font-medium">サポートに連絡</h3>
                    <p className="text-sm text-gray-600">お困りの際はこちら</p>
                  </div>
                  <ArrowRight className="h-5 w-5 text-gray-400" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PaymentCancelPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-orange-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-600"></div>
      </div>
    }>
      <PaymentCancelContent />
    </Suspense>
  );
}