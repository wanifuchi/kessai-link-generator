'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { error as showError } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

interface PayPalButtonProps {
  paymentLinkId: string;
  paymentUrl?: string;
  amount: number;
  currency: string;
  title: string;
  disabled?: boolean;
  onSuccess?: (data: any) => void;
  onError?: (error: any) => void;
}

export default function PayPalButton({
  paymentLinkId,
  paymentUrl,
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
      // 既にpaymentUrlが存在する場合は直接リダイレクト
      if (paymentUrl) {
        window.location.href = paymentUrl;

        if (onSuccess) {
          onSuccess({ paymentUrl });
        }
        return;
      }

      // paymentUrlが無い場合のエラー処理
      throw new Error('PayPal決済URLが見つかりません');

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
    // JPYの場合はそのまま、その他の通貨は100で割る
    const displayAmount = currency.toLowerCase() === 'jpy' ? amount : amount / 100;

    return new Intl.NumberFormat('ja-JP', {
      style: 'currency',
      currency: currency.toUpperCase(),
      minimumFractionDigits: 0,
    }).format(displayAmount);
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