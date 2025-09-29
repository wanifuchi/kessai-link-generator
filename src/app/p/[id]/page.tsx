'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, CreditCard, Clock, Shield, CheckCircle, Lock, User, Calendar, Globe, Copy, ExternalLink } from 'lucide-react';
import PayPalButton from '@/components/payment/PayPalButton';
import { useToast } from '@/hooks/use-toast';
import { error as showError, success } from '@/hooks/use-toast';

interface PaymentLinkData {
  id: string;
  title: string;
  description?: string;
  amount: number;
  currency: string;
  status: string;
  service: string;
  paymentUrl?: string;
  expiresAt?: string;
  createdAt: string;
  metadata?: any;
}

export default function PaymentLinkPage() {
  const params = useParams();
  const paymentLinkId = params.id as string;
  const [paymentLink, setPaymentLink] = useState<PaymentLinkData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processingStripe, setProcessingStripe] = useState(false);
  const { toast } = useToast();

  const fetchPaymentLink = useCallback(async () => {
    try {
      const response = await fetch(`/api/payment-links/${paymentLinkId}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '決済リンクの取得に失敗しました');
      }

      if (data.success && data.data) {
        setPaymentLink(data.data);
      } else {
        throw new Error('決済リンクが見つかりません');
      }
    } catch (error) {
      console.error('決済リンク取得エラー:', error);
      setError(error instanceof Error ? error.message : '決済リンクの取得に失敗しました');
    } finally {
      setLoading(false);
    }
  }, [paymentLinkId]);

  useEffect(() => {
    if (paymentLinkId) {
      fetchPaymentLink();
    }
  }, [paymentLinkId, fetchPaymentLink]);

  const handleStripePayment = async () => {
    setProcessingStripe(true);

    try {
      // 既にpaymentUrlが存在する場合は直接リダイレクト
      if (paymentLink?.paymentUrl) {
        window.location.href = paymentLink.paymentUrl;
        return;
      }

      // paymentUrlが無い場合のエラー処理
      throw new Error('決済URLが見つかりません');

    } catch (error) {
      console.error('Stripe決済エラー:', error);
      showError('Stripe決済エラー', error instanceof Error ? error.message : 'Stripe決済の処理中にエラーが発生しました');
    } finally {
      setProcessingStripe(false);
    }
  };

  const formatAmount = (amount: number, currency: string) => {
    // JPYの場合はそのまま、その他の通貨は100で割る
    const displayAmount = currency.toLowerCase() === 'jpy' ? amount : amount / 100;

    return new Intl.NumberFormat('ja-JP', {
      style: 'currency',
      currency: currency.toUpperCase(),
      minimumFractionDigits: 0,
    }).format(displayAmount);
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

  const isExpired = (expiresAt?: string) => {
    if (!expiresAt) return false;
    return new Date(expiresAt) < new Date();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-lg shadow-xl border-0">
          <CardHeader>
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-4 w-48" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-lg shadow-xl border-0">
          <CardHeader className="text-center">
            <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <CardTitle className="text-2xl text-red-600">エラー</CardTitle>
            <CardDescription className="text-lg">{error}</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (!paymentLink) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-lg shadow-xl border-0">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">決済リンクが見つかりません</CardTitle>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const expired = isExpired(paymentLink.expiresAt);

  if (!['ACTIVE', 'pending'].includes(paymentLink.status) || expired) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-orange-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-lg shadow-xl border-0">
          <CardHeader className="text-center">
            <AlertCircle className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
            <CardTitle className="text-2xl text-yellow-600">
              {expired ? '有効期限切れ' : '利用できません'}
            </CardTitle>
            <CardDescription className="text-lg">
              {expired
                ? 'この決済リンクの有効期限が切れています'
                : 'この決済リンクは現在利用できません'
              }
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const copyLinkToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      success('コピー完了', 'リンクをクリップボードにコピーしました');
    } catch (error) {
      showError('エラー', 'クリップボードへのコピーに失敗しました');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* ヘッダー */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Shield className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900">安全な決済</h1>
                <p className="text-sm text-gray-600">SSL暗号化で保護</p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={copyLinkToClipboard}
              className="flex items-center gap-2"
            >
              <Copy className="h-4 w-4" />
              リンクをコピー
            </Button>
          </div>
        </div>
      </div>

      <div className="py-12">
        <div className="container mx-auto px-4 max-w-2xl">
          <Card className="shadow-xl border-0">
            <CardHeader className="text-center pb-8 pt-8">
              <div className="mb-6">
                <Badge variant="outline" className="text-green-600 border-green-200 mb-4">
                  <Lock className="h-3 w-3 mr-1" />
                  安全な決済
                </Badge>
              </div>
              <CardTitle className="text-3xl font-bold text-gray-900 mb-4">
                {paymentLink.description}
              </CardTitle>
              {paymentLink.description && (
                <CardDescription className="text-lg text-gray-600 mb-6">
                  {paymentLink.description}
                </CardDescription>
              )}

              {/* 価格表示 */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100">
                <div className="text-4xl font-bold text-blue-600 mb-2">
                  {formatAmount(paymentLink.amount, paymentLink.currency)}
                </div>
                <div className="text-sm text-gray-600">
                  税込み価格（消費税込）
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-6">
              {/* 商品情報 */}
              <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                <h3 className="font-medium text-gray-900 mb-3">商品詳細</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-gray-500" />
                    <span className="text-gray-600">商品ID:</span>
                    <span className="font-mono text-xs">{paymentLink.id.substring(0, 8)}...</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    <span className="text-gray-600">作成日:</span>
                    <span>{formatDate(paymentLink.createdAt)}</span>
                  </div>
                  {paymentLink.expiresAt && (
                    <div className="flex items-center gap-2 col-span-2">
                      <Clock className="h-4 w-4 text-gray-500" />
                      <span className="text-gray-600">有効期限:</span>
                      <span>{formatDate(paymentLink.expiresAt)}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* 決済方法 */}
              <div className="space-y-4">
                <h3 className="font-medium text-gray-900 text-center text-xl">お支払いに進む</h3>

                {/* Stripe決済 */}
                {paymentLink.service === 'stripe' && (
                  <div className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-[#635bff] rounded-lg">
                          <CreditCard className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900">クレジットカード決済</h4>
                          <p className="text-sm text-gray-600">Visa、Mastercard、JCB対応</p>
                        </div>
                      </div>
                    </div>
                    <Button
                      onClick={handleStripePayment}
                      disabled={processingStripe}
                      className="w-full bg-[#635bff] hover:bg-[#5a52e8] text-white font-medium py-3 px-6 rounded-lg transition-colors duration-200 flex items-center justify-center gap-3"
                      size="lg"
                    >
                      {processingStripe ? (
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      ) : (
                        <CreditCard className="h-5 w-5" />
                      )}
                      <span>
                        {processingStripe ? '決済ページに移動中...' : 'Stripeで決済する'}
                      </span>
                    </Button>
                  </div>
                )}

                {/* PayPal決済 */}
                {paymentLink.service === 'paypal' && (
                  <div className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-[#0070ba] rounded-lg">
                          <Globe className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900">PayPal決済</h4>
                          <p className="text-sm text-gray-600">PayPalアカウントまたはカード</p>
                        </div>
                      </div>
                    </div>
                    <PayPalButton
                      paymentLinkId={paymentLink.id}
                      paymentUrl={paymentLink.paymentUrl}
                      amount={paymentLink.amount}
                      currency={paymentLink.currency}
                      title={paymentLink.description}
                      onSuccess={(data) => {
                        console.log('PayPal決済成功:', data);
                      }}
                      onError={(error) => {
                        console.error('PayPal決済エラー:', error);
                      }}
                    />
                  </div>
                )}

                {/* 未対応サービスのエラー表示 */}
                {paymentLink.service !== 'stripe' && paymentLink.service !== 'paypal' && (
                  <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                    <div className="flex items-center gap-3">
                      <AlertCircle className="h-5 w-5 text-red-600" />
                      <div>
                        <h4 className="font-medium text-red-800">対応していない決済サービスです</h4>
                        <p className="text-sm text-red-600">
                          この決済リンクは現在対応していないサービス（{paymentLink.service}）で作成されています
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* セキュリティ情報 */}
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <Shield className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <h4 className="font-medium text-green-800">安全な決済環境</h4>
                    <p className="text-sm text-green-700">最高水準のセキュリティで保護</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="flex items-center gap-2 text-green-700">
                    <CheckCircle className="h-4 w-4" />
                    <span>SSL暗号化通信</span>
                  </div>
                  <div className="flex items-center gap-2 text-green-700">
                    <CheckCircle className="h-4 w-4" />
                    <span>PCI DSS準拠</span>
                  </div>
                  <div className="flex items-center gap-2 text-green-700">
                    <CheckCircle className="h-4 w-4" />
                    <span>24時間監視</span>
                  </div>
                  <div className="flex items-center gap-2 text-green-700">
                    <CheckCircle className="h-4 w-4" />
                    <span>不正検知システム</span>
                  </div>
                </div>
              </div>

              {/* サポート情報 */}
              <div className="text-center pt-4 border-t">
                <p className="text-sm text-gray-500 mb-2">
                  決済に関するご質問やお困りの際は
                </p>
                <a
                  href="mailto:support@example.com"
                  className="text-blue-600 hover:underline text-sm font-medium"
                >
                  サポートまでお問い合わせください
                </a>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}