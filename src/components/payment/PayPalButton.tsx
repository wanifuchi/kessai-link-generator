'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { error as showError } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

interface PayPalButtonProps {
  paymentLinkId: string;
  amount: number;
  currency: string;
  title: string;
  disabled?: boolean;
  onSuccess?: (data: any) => void;
  onError?: (error: any) => void;
}

export default function PayPalButton({
  paymentLinkId,
  amount,
  currency,
  title,
  disabled = false,
  onSuccess,
  onError
}: PayPalButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handlePayPalPayment = async () => {
    if (disabled || isLoading) return;

    setIsLoading(true);

    try {
      // PayPal決済リンクを作成
      const response = await fetch('/api/payment-links/paypal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          paymentLinkId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'PayPal決済の作成に失敗しました');
      }

      if (data.success && data.paymentUrl) {
        // PayPal決済ページにリダイレクト
        window.location.href = data.paymentUrl;

        if (onSuccess) {
          onSuccess(data);
        }
      } else {
        throw new Error(data.error || 'PayPal決済URLの取得に失敗しました');
      }

    } catch (error) {
      console.error('PayPal決済エラー:', error);

      const errorMessage = error instanceof Error ? error.message : 'PayPal決済の処理中にエラーが発生しました';

      showError('PayPal決済エラー', errorMessage);

      if (onError) {
        onError(error);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // 金額を表示用にフォーマット
  const formatAmount = (amount: number, currency: string) => {
    return new Intl.NumberFormat('ja-JP', {
      style: 'currency',
      currency: currency.toUpperCase(),
      minimumFractionDigits: 0,
    }).format(amount / 100);
  };

  return (
    <div className="w-full">
      <Button
        onClick={handlePayPalPayment}
        disabled={disabled || isLoading}
        className="w-full bg-[#0070ba] hover:bg-[#005ea6] text-white font-medium py-3 px-6 rounded-lg transition-colors duration-200 flex items-center justify-center gap-3"
        size="lg"
      >
        {isLoading ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : (
          <div className="flex items-center gap-3">
            {/* PayPalロゴ */}
            <div className="flex items-center">
              <span className="text-[#009cde] font-bold text-lg">Pay</span>
              <span className="text-[#012169] font-bold text-lg">Pal</span>
            </div>
          </div>
        )}
        <span className="text-sm">
          {isLoading ? '処理中...' : `${formatAmount(amount, currency)} で支払う`}
        </span>
      </Button>

      {/* PayPal情報テキスト */}
      <div className="mt-2 text-xs text-gray-500 text-center">
        PayPalアカウントまたはクレジットカードで安全にお支払いいただけます
      </div>
    </div>
  );
}