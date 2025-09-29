'use client';

import { useState, useEffect, memo } from 'react';
import { Loader2, RefreshCw, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useQRCode, type QRCodeDisplayProps } from '@/hooks/useQRCode';

interface QRCodeDisplayComponentProps {
  url: string;
  options?: {
    size?: number;
    margin?: number;
    color?: {
      dark?: string;
      light?: string;
    };
    errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H';
  };
  autoGenerate?: boolean;
  className?: string;
  alt?: string;
  showControls?: boolean;
}

/**
 * QRコード表示コンポーネント（動的読み込み対応）
 *
 * @example
 * ```tsx
 * <QRCodeDisplay
 *   url="https://example.com"
 *   autoGenerate={true}
 *   showControls={true}
 * />
 * ```
 */
export const QRCodeDisplay = memo<QRCodeDisplayComponentProps>(({
  url,
  options = {},
  autoGenerate = false,
  className = '',
  alt = 'QRコード',
  showControls = false
}) => {
  const { qrCode, isGenerating, error, generateQR, clearQR, preloadLibrary } = useQRCode();
  const [hasAttemptedGeneration, setHasAttemptedGeneration] = useState(false);

  // URLが変更された時にQRコードをクリア
  useEffect(() => {
    clearQR();
    setHasAttemptedGeneration(false);
  }, [url, clearQR]);

  // 自動生成が有効な場合、マウント時にQRコードを生成
  useEffect(() => {
    if (autoGenerate && url && !hasAttemptedGeneration && !isGenerating) {
      setHasAttemptedGeneration(true);
      generateQR(url, options);
    }
  }, [autoGenerate, url, options, hasAttemptedGeneration, isGenerating, generateQR]);

  // QRコード生成ハンドラー
  const handleGenerate = async () => {
    if (!url) return;
    setHasAttemptedGeneration(true);
    await generateQR(url, options);
  };

  // QRコードライブラリのプリロード
  const handlePreload = async () => {
    await preloadLibrary();
  };

  // ローディング状態の表示
  if (isGenerating) {
    return (
      <Card className={`w-fit ${className}`}>
        <CardContent className="p-6">
          <div className="flex flex-col items-center space-y-4">
            <div className="relative">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-4 h-4 bg-blue-100 rounded-full animate-pulse"></div>
              </div>
            </div>
            <p className="text-sm text-gray-600">QRコードを生成中...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // エラー状態の表示
  if (error) {
    return (
      <Card className={`w-fit ${className}`}>
        <CardContent className="p-6">
          <div className="flex flex-col items-center space-y-4">
            <AlertCircle className="h-8 w-8 text-red-500" />
            <div className="text-center">
              <p className="text-sm text-red-600 font-medium">QRコード生成エラー</p>
              <p className="text-xs text-gray-500 mt-1">{error}</p>
            </div>
            {showControls && (
              <Button
                onClick={handleGenerate}
                variant="outline"
                size="sm"
                className="text-red-600 border-red-200 hover:bg-red-50"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                再試行
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  // QRコードが生成されている場合の表示
  if (qrCode) {
    const displaySize = options.size || 256;

    return (
      <Card className={`w-fit ${className}`}>
        <CardContent className="p-4">
          <div className="flex flex-col items-center space-y-4">
            <div className="p-2 bg-white rounded border border-gray-200">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={qrCode.dataUrl}
                alt={alt}
                className="block"
                style={{
                  width: Math.min(displaySize, 256),
                  height: Math.min(displaySize, 256)
                }}
                loading="lazy"
              />
            </div>
            {showControls && (
              <div className="flex gap-2">
                <Button
                  onClick={handleGenerate}
                  variant="outline"
                  size="sm"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  再生成
                </Button>
                <Button
                  onClick={clearQR}
                  variant="outline"
                  size="sm"
                >
                  クリア
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  // 初期状態（QRコードが生成されていない）
  return (
    <Card className={`w-fit ${className}`}>
      <CardContent className="p-6">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-16 h-16 bg-gray-100 rounded border-2 border-dashed border-gray-300 flex items-center justify-center">
            <div className="w-8 h-8 bg-gray-300 rounded-sm"></div>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-600">QRコード未生成</p>
            <p className="text-xs text-gray-400 mt-1">ボタンをクリックして生成してください</p>
          </div>
          {showControls && (
            <div className="flex gap-2">
              <Button
                onClick={handleGenerate}
                disabled={!url}
                size="sm"
              >
                QRコード生成
              </Button>
              <Button
                onClick={handlePreload}
                variant="outline"
                size="sm"
              >
                ライブラリプリロード
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
});

QRCodeDisplay.displayName = 'QRCodeDisplay';

export default QRCodeDisplay;