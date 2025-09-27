'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, ExternalLink, Home, Receipt, ArrowRight, Download } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import confetti from 'canvas-confetti';

interface PaymentDetails {
  id: string;
  title: string;
  amount: number;
  currency: string;
  service: string;
  paidAt: string;
  transactionId: string;
}

function PaymentSuccessContent() {
  const searchParams = useSearchParams();
  const paymentLinkId = searchParams.get('payment_link_id');
  const [paymentDetails, setPaymentDetails] = useState<PaymentDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // 成功アニメーション
    const duration = 3 * 1000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

    function randomInRange(min: number, max: number) {
      return Math.random() * (max - min) + min;
    }

    const interval: NodeJS.Timeout = setInterval(function() {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 50 * (timeLeft / duration);
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }
      });
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }
      });
    }, 250);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!paymentLinkId) {
      setError('決済リンクIDが見つかりません');
      setLoading(false);
      return;
    }

    fetchPaymentDetails();
  }, [paymentLinkId]);

  const fetchPaymentDetails = async () => {
    try {
      const response = await fetch(`/api/payment-links/${paymentLinkId}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '決済情報の取得に失敗しました');
      }

      if (data.success && data.data) {
        const paymentLink = data.data;
        const completedTransaction = paymentLink.transactions.find(
          (t: any) => t.status === 'COMPLETED'
        );

        if (completedTransaction) {
          setPaymentDetails({
            id: paymentLink.id,
            title: paymentLink.description,
            amount: completedTransaction.amount,
            currency: completedTransaction.currency,
            service: completedTransaction.service,
            paidAt: completedTransaction.paidAt,
            transactionId: completedTransaction.serviceTransactionId,
          });
        } else {
          setError('完了した決済が見つかりません');
        }
      } else {
        setError('決済情報が見つかりません');
      }
    } catch (error) {
      console.error('決済情報取得エラー:', error);
      setError(error instanceof Error ? error.message : '決済情報の取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const formatAmount = (amount: number, currency: string) => {
    return new Intl.NumberFormat('ja-JP', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
    }).format(amount / 100);
  };

  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(dateString));
  };

  const getServiceDisplayName = (service: string) => {
    switch (service.toLowerCase()) {
      case 'stripe':
        return 'Stripe';
      case 'paypal':
        return 'PayPal';
      default:
        return service;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-xl border-0">
          <CardHeader className="text-center">
            <Skeleton className="h-12 w-12 rounded-full mx-auto mb-4" />
            <Skeleton className="h-6 w-32 mx-auto mb-2" />
            <Skeleton className="h-4 w-48 mx-auto" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-xl border-0">
          <CardHeader className="text-center">
            <CardTitle className="text-red-600">エラー</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <Link href="/">ホームに戻る</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 py-12">
      <div className="container mx-auto px-4 max-w-2xl">
        <Card className="shadow-xl border-0">
          <CardHeader className="text-center pb-8 pt-12">
            <div className="mx-auto mb-6">
              <div className="relative">
                <CheckCircle className="h-24 w-24 text-green-600 animate-[bounce_1s_ease-in-out]" />
                <div className="absolute -inset-4 bg-green-100 rounded-full blur-xl opacity-50 animate-pulse"></div>
              </div>
            </div>
            <CardTitle className="text-3xl font-bold text-gray-900">決済が完了しました！</CardTitle>
            <CardDescription className="text-lg text-gray-600 mt-2">
              ご利用ありがとうございます。以下に決済詳細をご確認いただけます。
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {paymentDetails && (
              <div className="bg-gray-50 rounded-lg p-6 space-y-4">
                <div className="flex justify-between items-center border-b pb-4">
                  <span className="text-sm text-gray-600">商品・サービス</span>
                  <span className="font-medium text-lg">{paymentDetails.title}</span>
                </div>

                <div className="flex justify-between items-center border-b pb-4">
                  <span className="text-sm text-gray-600">決済金額</span>
                  <span className="font-bold text-2xl text-green-600">
                    {formatAmount(paymentDetails.amount, paymentDetails.currency)}
                  </span>
                </div>

                <div className="flex justify-between items-center border-b pb-4">
                  <span className="text-sm text-gray-600">決済サービス</span>
                  <span className="font-medium capitalize">{getServiceDisplayName(paymentDetails.service)}</span>
                </div>

                <div className="flex justify-between items-center border-b pb-4">
                  <span className="text-sm text-gray-600">決済日時</span>
                  <span className="text-sm">{formatDate(paymentDetails.paidAt)}</span>
                </div>

                {paymentDetails.transactionId && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">取引ID</span>
                    <span className="font-mono text-sm bg-white px-3 py-2 rounded border">
                      {paymentDetails.transactionId.substring(0, 20)}...
                    </span>
                  </div>
                )}
              </div>
            )}

            {!paymentDetails && (
              <div className="bg-gray-50 rounded-lg p-6 text-center">
                <p className="text-gray-600">決済が正常に処理されました。</p>
              </div>
            )}

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                <strong>📧 確認メール送信済み</strong><br />
                決済確認メールをお送りしました。メールが届かない場合は、迷惑メールフォルダをご確認ください。
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <Button className="flex-1" variant="outline" asChild>
                <Link href="/" className="flex items-center justify-center gap-2">
                  <Home className="h-4 w-4" />
                  ホームに戻る
                </Link>
              </Button>

              <Button className="flex-1" variant="outline">
                <Receipt className="h-4 w-4 mr-2" />
                領収書をダウンロード
              </Button>
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
          <h2 className="text-lg font-medium text-gray-900 mb-4">次のステップ</h2>
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

            <Link href="/dashboard">
              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="text-left">
                      <h3 className="font-medium">取引履歴</h3>
                      <p className="text-sm text-gray-600">過去の決済を確認</p>
                    </div>
                    <ArrowRight className="h-5 w-5 text-gray-400" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    }>
      <PaymentSuccessContent />
    </Suspense>
  );
}