'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import StripePaymentForm from '@/components/payment/StripePaymentForm';
import {
  CreditCard,
  QrCode,
  Clock,
  Shield,
  CheckCircle,
  AlertCircle,
  Loader2,
  ExternalLink,
  Copy
} from 'lucide-react';

interface PaymentLinkData {
  id: string;
  linkUrl: string;
  amount: number;
  currency: string;
  description?: string;
  status: string;
  expiresAt?: string;
  userPaymentConfig: {
    displayName: string;
    provider: string;
    isTestMode: boolean;
  };
  qrCode?: {
    dataUrl: string;
    svg: string;
  } | null;
}

export default function PaymentLinkPage() {
  const params = useParams();
  const id = params.id as string;

  const [paymentLink, setPaymentLink] = useState<PaymentLinkData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copying, setCopying] = useState(false);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  useEffect(() => {
    const fetchPaymentLink = async () => {
      try {
        const response = await fetch(`/api/payment-links/${id}?qr=true`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || '決済リンクの取得に失敗しました');
        }

        if (data.success) {
          setPaymentLink(data.data);
        } else {
          throw new Error(data.error || '決済リンクが見つかりません');
        }
      } catch (error) {
        setError(error instanceof Error ? error.message : '決済リンクの取得に失敗しました');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchPaymentLink();
    }
  }, [id]);

  const copyToClipboard = async (text: string) => {
    setCopying(true);
    try {
      await navigator.clipboard.writeText(text);
      // 短時間フィードバック表示
      setTimeout(() => setCopying(false), 1000);
    } catch (error) {
      setCopying(false);
      alert('コピーに失敗しました');
    }
  };

  const formatAmount = (amount: number, currency: string) => {
    return new Intl.NumberFormat('ja-JP', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(amount);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary">支払い待ち</Badge>;
      case 'succeeded':
        return <Badge variant="default">支払い完了</Badge>;
      case 'failed':
        return <Badge variant="destructive">支払い失敗</Badge>;
      case 'expired':
        return <Badge variant="outline">期限切れ</Badge>;
      case 'cancelled':
        return <Badge variant="outline">キャンセル</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const isExpired = (expiresAt?: string) => {
    if (!expiresAt) return false;
    return new Date(expiresAt) < new Date();
  };

  const handlePaymentSuccess = (paymentIntent: any) => {
    setPaymentSuccess(true);
    setShowPaymentForm(false);
    // 決済リンクの状態を更新
    setPaymentLink(prev => prev ? { ...prev, status: 'succeeded' } : null);
  };

  const handlePaymentError = (errorMessage: string) => {
    setError(errorMessage);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">決済リンクを読み込み中...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              エラー
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!paymentLink) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>決済リンクが見つかりません</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              指定された決済リンクは存在しないか、削除されています。
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const expired = isExpired(paymentLink.expiresAt);
  const canPay = paymentLink.status === 'pending' && !expired;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <div className="max-w-2xl mx-auto">
          {/* ヘッダー */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-2">決済リンク</h1>
            <p className="text-muted-foreground">
              以下の内容でお支払いを受け付けています
            </p>
          </div>

          {/* 決済成功アラート */}
          {paymentSuccess && (
            <Alert className="mb-6" variant="default">
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                決済が正常に完了しました。ありがとうございました。
              </AlertDescription>
            </Alert>
          )}

          {/* 期限切れ・エラーアラート */}
          {expired && (
            <Alert className="mb-6" variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                この決済リンクは有効期限が切れています。
              </AlertDescription>
            </Alert>
          )}

          {paymentLink.status !== 'pending' && !paymentSuccess && (
            <Alert className="mb-6">
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                この決済は既に処理されています。
              </AlertDescription>
            </Alert>
          )}

          {/* エラーアラート */}
          {error && (
            <Alert className="mb-6" variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* メイン決済カード */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                お支払い内容
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* 金額表示 */}
              <div className="text-center">
                <div className="text-4xl font-bold text-primary mb-2">
                  {formatAmount(paymentLink.amount, paymentLink.currency)}
                </div>
                {paymentLink.description && (
                  <p className="text-lg text-muted-foreground">
                    {paymentLink.description}
                  </p>
                )}
              </div>

              <Separator />

              {/* 決済情報 */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">決済方法</span>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="font-medium">
                      {paymentLink.userPaymentConfig.displayName}
                    </span>
                    <Badge variant="outline">
                      {paymentLink.userPaymentConfig.provider.toUpperCase()}
                    </Badge>
                    {paymentLink.userPaymentConfig.isTestMode && (
                      <Badge variant="secondary">テスト</Badge>
                    )}
                  </div>
                </div>
                <div>
                  <span className="text-muted-foreground">状態</span>
                  <div className="mt-1">
                    {getStatusBadge(paymentLink.status)}
                  </div>
                </div>
                {paymentLink.expiresAt && (
                  <>
                    <div>
                      <span className="text-muted-foreground">有効期限</span>
                      <div className="mt-1 flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        <span className="text-sm">
                          {new Date(paymentLink.expiresAt).toLocaleString('ja-JP')}
                        </span>
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* 支払いボタン・フォーム */}
              {canPay && !showPaymentForm && !paymentSuccess && (
                <div className="pt-4">
                  {paymentLink.userPaymentConfig.provider === 'stripe' ? (
                    <Button
                      size="lg"
                      className="w-full"
                      onClick={() => setShowPaymentForm(true)}
                    >
                      <CreditCard className="mr-2 h-4 w-4" />
                      カードでお支払い
                    </Button>
                  ) : (
                    <Button size="lg" className="w-full" asChild>
                      <a href="#" onClick={(e) => {
                        e.preventDefault();
                        alert('他の決済プロバイダーの処理を実装予定');
                      }}>
                        <CreditCard className="mr-2 h-4 w-4" />
                        お支払いに進む
                      </a>
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Stripe決済フォーム */}
          {canPay && showPaymentForm && paymentLink.userPaymentConfig.provider === 'stripe' && (
            <div className="mb-6">
              <StripePaymentForm
                paymentLinkId={paymentLink.id}
                amount={paymentLink.amount}
                currency={paymentLink.currency}
                description={paymentLink.description}
                isTestMode={paymentLink.userPaymentConfig.isTestMode}
                onSuccess={handlePaymentSuccess}
                onError={handlePaymentError}
              />
              <div className="mt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowPaymentForm(false);
                    setError(''); // エラーをクリア
                  }}
                  className="w-full"
                >
                  戻る
                </Button>
              </div>
            </div>
          )}

          {/* QRコード */}
          {paymentLink.qrCode && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <QrCode className="h-5 w-5" />
                  QRコード
                </CardTitle>
                <CardDescription>
                  スマートフォンのカメラでスキャンしてください
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex justify-center">
                  <div className="p-4 bg-white rounded-lg border">
                    <Image
                      src={paymentLink.qrCode.dataUrl}
                      alt="決済リンクQRコード"
                      width={200}
                      height={200}
                      className="mx-auto"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* リンク共有 */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ExternalLink className="h-5 w-5" />
                リンクを共有
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={paymentLink.linkUrl}
                  readOnly
                  className="flex-1 p-2 border rounded-md bg-muted text-sm"
                />
                <Button
                  variant="outline"
                  onClick={() => copyToClipboard(paymentLink.linkUrl)}
                  disabled={copying}
                >
                  {copying ? (
                    <CheckCircle className="h-4 w-4" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* セキュリティ情報 */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Shield className="h-4 w-4" />
                <span>
                  このページは安全に暗号化されており、お客様の情報は保護されています。
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}