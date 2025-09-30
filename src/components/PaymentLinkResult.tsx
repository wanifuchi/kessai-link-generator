'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  usePaymentStore,
  useSelectedService,
  useCredentials,
  usePaymentRequest,
  usePaymentActions
} from '@/store/payment-store';
import { copyToClipboard, formatCurrency } from '@/lib/utils';
import { getService } from '@/lib/payment-services';
import { success, error as showError, info } from '@/hooks/use-toast';
import {
  ExternalLink,
  Copy,
  Check,
  QrCode,
  Download,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Share2,
  Eye
} from 'lucide-react';

export default function PaymentLinkResult() {
  const selectedService = useSelectedService();
  const credentials = useCredentials();
  const paymentRequest = usePaymentRequest();
  const { generatedLink, isLoading, error, setGeneratedLink, setLoading, setError } = usePaymentStore();
  const { setGeneratedLink: updateGeneratedLink } = usePaymentActions();
  
  const [copied, setCopied] = useState<string | null>(null);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [isGeneratingQR, setIsGeneratingQR] = useState(false);


  const generateQRCode = useCallback(async (url: string) => {
    if (!url) return;

    setIsGeneratingQR(true);
    try {
      const response = await fetch(`/api/qr-code?url=${encodeURIComponent(url)}`);
      const result = await response.json();

      if (result.success) {
        setQrCode(result.qrCode);
      } else {
        console.error('QR code generation failed:', result.error);
      }
    } catch (error) {
      console.error('QR code generation error:', error);
    } finally {
      setIsGeneratingQR(false);
    }
  }, []);

  const generatePaymentLink = useCallback(async () => {
    if (!selectedService || !credentials || !paymentRequest) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/payment-links/${selectedService}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          credentials,
          paymentData: paymentRequest,
        }),
      });

      const result = await response.json();

      if (result.success) {
        updateGeneratedLink(result.data);
        success(
          '決済リンクが生成されました',
          `${formatCurrency(paymentRequest?.amount || 0, paymentRequest?.currency || 'JPY')}の決済リンクが正常に作成されました`
        );
        // QRコードも同時生成
        if (result.data.url) {
          generateQRCode(result.data.url);
        }
      } else {
        const errorMessage = result.error || '決済リンクの生成に失敗しました';
        setError(errorMessage);
        showError('決済リンク生成エラー', errorMessage);
      }
    } catch (error) {
      console.error('Payment link generation error:', error);
      const errorMessage = 'サーバーとの通信に失敗しました';
      setError(errorMessage);
      showError('通信エラー', errorMessage);
    } finally {
      setLoading(false);
    }
  }, [selectedService, credentials, paymentRequest, setLoading, setError, updateGeneratedLink, generateQRCode]);

  useEffect(() => {
    if (selectedService && credentials && paymentRequest && !generatedLink?.success && !isLoading) {
      generatePaymentLink();
    }
  }, [selectedService, credentials, paymentRequest, generatePaymentLink, generatedLink?.success, isLoading]);


  const handleCopy = async (text: string, type: string) => {
    const copySuccess = await copyToClipboard(text);
    if (copySuccess) {
      setCopied(type);
      setTimeout(() => setCopied(null), 2000);
      info('コピー完了', `${type === 'url' ? '決済リンク' : 'QRコード'}をクリップボードにコピーしました`);
    } else {
      showError('コピー失敗', 'クリップボードへのコピーに失敗しました');
    }
  };

  const downloadQRCode = () => {
    if (!qrCode) return;

    const link = document.createElement('a');
    link.download = `payment-qr-${Date.now()}.png`;
    link.href = qrCode;
    link.click();
    info('ダウンロード開始', 'QRコードのダウンロードを開始しました');
  };

  const shareLink = async () => {
    if (!generatedLink?.url) return;

    if (navigator.share) {
      try {
        await navigator.share({
          title: paymentRequest?.productName || '決済リンク',
          text: `${paymentRequest?.productName} の決済リンクです`,
          url: generatedLink.url,
        });
      } catch (error) {
        // シェアがキャンセルされた場合など
        handleCopy(generatedLink.url, 'url');
      }
    } else {
      handleCopy(generatedLink.url, 'url');
    }
  };

  const serviceInfo = selectedService ? getService(selectedService) : null;

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <div className="space-y-4">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
            <h3 className="text-lg font-semibold">決済リンクを生成中...</h3>
            <p className="text-gray-600">
              {serviceInfo?.displayName} のAPIと連携しています
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="p-6">
          <div className="flex items-start space-x-3">
            <AlertCircle className="w-6 h-6 text-red-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-red-900 mb-2">
                エラーが発生しました
              </h3>
              <p className="text-red-700 mb-4">{error}</p>
              <Button 
                onClick={generatePaymentLink}
                variant="outline"
                className="border-red-300 text-red-700 hover:bg-red-100"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                再試行
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!generatedLink?.success) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Success Message */}
      <Card className="border-green-200 bg-green-50">
        <CardContent className="p-4">
          <div className="flex items-center space-x-3">
            <CheckCircle className="w-6 h-6 text-green-600" />
            <div>
              <h3 className="font-semibold text-green-900">
                決済リンクが正常に生成されました
              </h3>
              <p className="text-sm text-green-700">
                以下のリンクとQRコードをお客様と共有してください
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payment Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Eye className="w-5 h-5 mr-2" />
            決済情報サマリー
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <div className="text-gray-600">商品名</div>
              <div className="font-medium">{paymentRequest?.productName}</div>
            </div>
            <div>
              <div className="text-gray-600">金額</div>
              <div className="font-semibold text-lg">
                {formatCurrency(
                  (paymentRequest?.amount || 0) * (paymentRequest?.quantity || 1),
                  paymentRequest?.currency || 'JPY'
                )}
              </div>
            </div>
            <div>
              <div className="text-gray-600">決済サービス</div>
              <div className="font-medium">{serviceInfo?.displayName}</div>
            </div>
            <div>
              <div className="text-gray-600">数量</div>
              <div className="font-medium">{paymentRequest?.quantity || 1}</div>
            </div>
            {paymentRequest?.expiresAt && (
              <div className="col-span-2">
                <div className="text-gray-600">有効期限</div>
                <div className="font-medium">
                  {new Date(paymentRequest.expiresAt).toLocaleString('ja-JP')}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Payment Link */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <ExternalLink className="w-5 h-5 mr-2" />
            決済リンク
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>決済URL</Label>
            <div className="flex space-x-2">
              <Input
                value={generatedLink.url || ''}
                readOnly
                className="font-mono text-sm"
              />
              <Button
                onClick={() => handleCopy(generatedLink.url || '', 'url')}
                variant="outline"
                size="sm"
                className="px-3"
              >
                {copied === 'url' ? (
                  <Check className="w-4 h-4 text-green-600" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>

          {generatedLink.linkId && (
            <div className="space-y-2">
              <Label>リンクID</Label>
              <div className="flex space-x-2">
                <Input
                  value={generatedLink.linkId}
                  readOnly
                  className="font-mono text-sm"
                />
                <Button
                  onClick={() => handleCopy(generatedLink.linkId || '', 'linkId')}
                  variant="outline"
                  size="sm"
                  className="px-3"
                >
                  {copied === 'linkId' ? (
                    <Check className="w-4 h-4 text-green-600" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>
          )}

          <div className="flex space-x-3 pt-2">
            <Button
              onClick={() => window.open(generatedLink.url, '_blank')}
              className="flex-1"
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              決済ページを開く
            </Button>
            <Button
              onClick={shareLink}
              variant="outline"
              className="px-6"
            >
              <Share2 className="w-4 h-4 mr-2" />
              共有
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* QR Code */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <QrCode className="w-5 h-5 mr-2" />
            QRコード
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row items-center space-y-4 md:space-y-0 md:space-x-6">
            <div className="qr-code-container w-64 h-64 flex-shrink-0">
              {isGeneratingQR ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <div className="w-8 h-8 border-2 border-gray-300 border-t-primary rounded-full animate-spin mx-auto mb-2"></div>
                    <p className="text-sm text-gray-600">QRコード生成中...</p>
                  </div>
                </div>
              ) : qrCode ? (
                <div className="relative w-full h-full">
                  <Image
                    src={qrCode}
                    alt="Payment QR Code"
                    fill
                    className="object-contain"
                    sizes="256px"
                    unoptimized
                  />
                </div>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <Button 
                    onClick={() => generateQRCode(generatedLink.url || '')}
                    variant="outline"
                  >
                    <QrCode className="w-4 h-4 mr-2" />
                    QRコードを生成
                  </Button>
                </div>
              )}
            </div>

            <div className="flex-1 space-y-4">
              <div>
                <h4 className="font-medium text-gray-900 mb-2">QRコードの使用方法</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• スマートフォンのカメラでQRコードを読み取り</li>
                  <li>• 決済ページが自動で開きます</li>
                  <li>• レジやPOPに印刷して使用可能</li>
                  <li>• SNSやメールでの共有にも便利</li>
                </ul>
              </div>

              {qrCode && (
                <div className="flex space-x-3">
                  <Button
                    onClick={downloadQRCode}
                    variant="outline"
                    className="flex-1"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    QRコードをダウンロード
                  </Button>
                  <Button
                    onClick={() => handleCopy(generatedLink.url || '', 'qr')}
                    variant="outline"
                    className="px-6"
                  >
                    {copied === 'qr' ? (
                      <Check className="w-4 h-4" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Next Steps */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-blue-900">次のステップ</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm text-blue-700">
            <div className="flex items-start space-x-2">
              <span className="font-semibold">1.</span>
              <span>決済リンクまたはQRコードをお客様と共有</span>
            </div>
            <div className="flex items-start space-x-2">
              <span className="font-semibold">2.</span>
              <span>お客様が決済ページで支払いを完了</span>
            </div>
            <div className="flex items-start space-x-2">
              <span className="font-semibold">3.</span>
              <span>{serviceInfo?.displayName}のダッシュボードで決済状況を確認</span>
            </div>
            <div className="flex items-start space-x-2">
              <span className="font-semibold">4.</span>
              <span>設定したリダイレクトURLまたはWebhookで結果を受信</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}