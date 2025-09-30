'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { usePaymentActions, useSelectedService } from '@/store/payment-store';
import { getService } from '@/lib/payment-services';
import { formatCurrency, getCurrencySymbol } from '@/lib/utils';
import { Calculator, ShoppingCart, Mail, Calendar, Globe } from 'lucide-react';
import { useState } from 'react';

const paymentInfoSchema = z.object({
  amount: z.coerce.number()
    .min(0.01, '金額は0.01以上である必要があります')
    .max(9999999, '金額が上限を超えています'),
  currency: z.string().min(1, '通貨を選択してください'),
  productName: z.string()
    .min(1, '商品名は必須です')
    .max(100, '商品名は100文字以内で入力してください'),
  description: z.string()
    .max(500, '説明は500文字以内で入力してください')
    .optional(),
  quantity: z.coerce.number()
    .int('数量は整数で入力してください')
    .min(1, '数量は1以上である必要があります')
    .max(1000, '数量は1000以下である必要があります')
    .optional(),
  customerEmail: z.string()
    .email('有効なメールアドレスを入力してください')
    .optional()
    .or(z.literal('')),
  expiresAt: z.string().optional(),
  successUrl: z.string()
    .url('有効なURLを入力してください')
    .optional()
    .or(z.literal('')),
  cancelUrl: z.string()
    .url('有効なURLを入力してください')
    .optional()
    .or(z.literal('')),
});

type PaymentInfoFormData = z.infer<typeof paymentInfoSchema>;

export default function PaymentInfoForm() {
  const selectedService = useSelectedService();
  const { setPaymentRequest } = usePaymentActions();
  const [previewAmount, setPreviewAmount] = useState<string>('');

  // React Hooksは条件分岐の前に呼び出す必要がある
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
    setValue,
  } = useForm<PaymentInfoFormData>({
    resolver: zodResolver(paymentInfoSchema),
    defaultValues: {
      currency: 'JPY',
      quantity: 1,
    },
    mode: 'onChange',
  });

  if (!selectedService) return null;

  const serviceInfo = getService(selectedService);
  if (!serviceInfo) return null;

  // サービスでサポートされている通貨を取得
  const supportedCurrencies = serviceInfo.supportedCurrencies.map((code: string) => ({
    code,
    name: code,
    symbol: getCurrencySymbol(code)
  }));

  const watchedAmount = watch('amount');
  const watchedCurrency = watch('currency');
  const watchedQuantity = watch('quantity') || 1;

  // 金額プレビューの計算
  const calculateTotalAmount = () => {
    const amount = Number(watchedAmount) || 0;
    const quantity = Number(watchedQuantity) || 1;
    return amount * quantity;
  };

  // 手数料計算（概算）
  const calculateFee = () => {
    const totalAmount = calculateTotalAmount();
    if (!totalAmount) return 0;

    // 簡易的な手数料計算
    const feeRate = serviceInfo.feeRate;
    const rate = parseFloat(feeRate.replace('%', '')) / 100;
    
    // 固定手数料が含まれている場合の処理
    if (feeRate.includes('+')) {
      const fixedFee = selectedService === 'paypal' ? 40 : 0; // PayPalの場合は40円
      return (totalAmount * rate) + fixedFee;
    }
    
    return totalAmount * rate;
  };

  const onSubmit = (data: PaymentInfoFormData) => {
    // 空文字列をundefinedに変換、expiresAtをDate型に変換
    const cleanedData = {
      ...data,
      description: data.description || undefined,
      customerEmail: data.customerEmail || undefined,
      expiresAt: data.expiresAt ? new Date(data.expiresAt) : undefined,
      successUrl: data.successUrl || undefined,
      cancelUrl: data.cancelUrl || undefined,
    };

    setPaymentRequest(cleanedData);
  };

  // 有効期限の最小値（現在時刻から1時間後）
  const getMinExpirationDate = () => {
    const now = new Date();
    now.setHours(now.getHours() + 1);
    return now.toISOString().slice(0, 16); // YYYY-MM-DDTHH:MM format
  };

  return (
    <div className="space-y-6">
      {/* Service Info */}
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="text-2xl">
                {selectedService === 'stripe' ? '🔷' : 
                 selectedService === 'paypal' ? '💙' : 
                 selectedService === 'square' ? '⬜' : '💳'}
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">{serviceInfo.displayName}</h3>
                <p className="text-sm text-gray-600">手数料: {serviceInfo.feeRate}</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-600">対応通貨</div>
              <div className="flex flex-wrap gap-1">
                {serviceInfo.supportedCurrencies.slice(0, 4).map((currency: string) => (
                  <span key={currency} className="text-xs bg-blue-100 px-2 py-1 rounded">
                    {currency}
                  </span>
                ))}
                {serviceInfo.supportedCurrencies.length > 4 && (
                  <span className="text-xs text-gray-500">+{serviceInfo.supportedCurrencies.length - 4}</span>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <ShoppingCart className="w-5 h-5 mr-2" />
              基本情報
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Product Name */}
            <div className="space-y-2">
              <Label htmlFor="productName">商品・サービス名 *</Label>
              <Input
                id="productName"
                {...register('productName')}
                placeholder="例: プレミアムプラン（月額）"
                className={errors.productName ? 'border-red-500' : ''}
              />
              {errors.productName && (
                <p className="text-sm text-red-600">{errors.productName.message}</p>
              )}
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">商品説明 (オプション)</Label>
              <textarea
                id="description"
                {...register('description')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                rows={3}
                placeholder="商品やサービスの詳細説明"
              />
              {errors.description && (
                <p className="text-sm text-red-600">{errors.description.message}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Pricing Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Calculator className="w-5 h-5 mr-2" />
              価格設定
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Currency */}
              <div className="space-y-2">
                <Label htmlFor="currency">通貨 *</Label>
                <Select
                  value={watchedCurrency}
                  onValueChange={(value) => setValue('currency', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="通貨を選択" />
                  </SelectTrigger>
                  <SelectContent>
                    {supportedCurrencies.map((currency: {code: string; name: string; symbol: string}) => (
                      <SelectItem key={currency.code} value={currency.code}>
                        <div className="flex items-center space-x-2">
                          <span>{currency.symbol}</span>
                          <span>{currency.code}</span>
                          <span className="text-gray-500">({currency.name})</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.currency && (
                  <p className="text-sm text-red-600">{errors.currency.message}</p>
                )}
              </div>

              {/* Amount */}
              <div className="space-y-2">
                <Label htmlFor="amount">単価 *</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                    {getCurrencySymbol(watchedCurrency || 'JPY')}
                  </span>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    min="0.01"
                    {...register('amount')}
                    className={`pl-8 ${errors.amount ? 'border-red-500' : ''}`}
                    placeholder="1000"
                  />
                </div>
                {errors.amount && (
                  <p className="text-sm text-red-600">{errors.amount.message}</p>
                )}
              </div>

              {/* Quantity */}
              <div className="space-y-2">
                <Label htmlFor="quantity">数量</Label>
                <Input
                  id="quantity"
                  type="number"
                  min="1"
                  max="1000"
                  {...register('quantity')}
                  className={errors.quantity ? 'border-red-500' : ''}
                  placeholder="1"
                />
                {errors.quantity && (
                  <p className="text-sm text-red-600">{errors.quantity.message}</p>
                )}
              </div>
            </div>

            {/* Amount Preview */}
            {watchedAmount && watchedCurrency && (
              <Card className="bg-gray-50 border-gray-200">
                <CardContent className="p-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <div className="text-gray-600">合計金額</div>
                      <div className="font-semibold text-lg">
                        {formatCurrency(calculateTotalAmount(), watchedCurrency)}
                      </div>
                    </div>
                    <div>
                      <div className="text-gray-600">手数料 (概算)</div>
                      <div className="font-medium text-orange-600">
                        {formatCurrency(calculateFee(), watchedCurrency)}
                      </div>
                    </div>
                    <div>
                      <div className="text-gray-600">受取予定金額</div>
                      <div className="font-semibold text-green-600">
                        {formatCurrency(calculateTotalAmount() - calculateFee(), watchedCurrency)}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </CardContent>
        </Card>

        {/* Customer Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Mail className="w-5 h-5 mr-2" />
              顧客情報 (オプション)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="customerEmail">顧客メールアドレス</Label>
              <Input
                id="customerEmail"
                type="email"
                {...register('customerEmail')}
                placeholder="customer@example.com"
                className={errors.customerEmail ? 'border-red-500' : ''}
              />
              {errors.customerEmail && (
                <p className="text-sm text-red-600">{errors.customerEmail.message}</p>
              )}
              <p className="text-xs text-gray-500">
                入力すると、決済後に顧客にメールが送信されます
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Advanced Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Calendar className="w-5 h-5 mr-2" />
              詳細設定 (オプション)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Expiration */}
            <div className="space-y-2">
              <Label htmlFor="expiresAt">有効期限</Label>
              <Input
                id="expiresAt"
                type="datetime-local"
                {...register('expiresAt')}
                min={getMinExpirationDate()}
                className={errors.expiresAt ? 'border-red-500' : ''}
              />
              {errors.expiresAt && (
                <p className="text-sm text-red-600">{errors.expiresAt.message}</p>
              )}
              <p className="text-xs text-gray-500">
                設定しない場合、リンクは無期限で有効です
              </p>
            </div>

            {/* Success URL */}
            <div className="space-y-2">
              <Label htmlFor="successUrl">決済成功時のリダイレクト URL</Label>
              <Input
                id="successUrl"
                type="url"
                {...register('successUrl')}
                placeholder="https://example.com/success"
                className={errors.successUrl ? 'border-red-500' : ''}
              />
              {errors.successUrl && (
                <p className="text-sm text-red-600">{errors.successUrl.message}</p>
              )}
            </div>

            {/* Cancel URL */}
            <div className="space-y-2">
              <Label htmlFor="cancelUrl">決済キャンセル時のリダイレクト URL</Label>
              <Input
                id="cancelUrl"
                type="url"
                {...register('cancelUrl')}
                placeholder="https://example.com/cancel"
                className={errors.cancelUrl ? 'border-red-500' : ''}
              />
              {errors.cancelUrl && (
                <p className="text-sm text-red-600">{errors.cancelUrl.message}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Submit Button */}
        <div className="flex justify-end space-x-3">
          <Button
            type="submit"
            disabled={isSubmitting}
            className="min-w-[150px]"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                生成中...
              </>
            ) : (
              <>
                <Globe className="w-4 h-4 mr-2" />
                決済リンクを生成
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}