'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Plus, CreditCard, DollarSign, AlertCircle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { SkeletonLoader } from '@/components/loading';

interface ApiSetting {
  id: string;
  service: string;
  environment: string;
  isActive: boolean;
}

export default function CreatePaymentLinkPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [apiSettingsLoading, setApiSettingsLoading] = useState(true);

  // デバッグ用の強制的な状態解除（10秒後）
  useEffect(() => {
    const timeout = setTimeout(() => {
      console.log('強制的にローディング状態を解除');
      setApiSettingsLoading(false);
    }, 10000);
    return () => clearTimeout(timeout);
  }, []);
  const [apiSettings, setApiSettings] = useState<ApiSetting[]>([]);
  const [selectedApiSetting, setSelectedApiSetting] = useState<string>('');

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    amount: '',
    currency: 'jpy',
    service: 'stripe' as 'stripe' | 'paypal',
  });

  useEffect(() => {
    loadApiSettings();
  }, []);

  const loadApiSettings = async () => {
    try {
      console.log('API設定を読み込み中...');
      const response = await fetch('/api/settings');
      console.log('API応答:', response.status, response.statusText);

      const data = await response.json();
      console.log('取得したデータ:', data);

      if (data.success) {
        // アクティブな設定のみを表示
        const activeSettings = data.data.filter((setting: ApiSetting) => setting.isActive);
        console.log('アクティブな設定:', activeSettings);
        setApiSettings(activeSettings);
        console.log('API設定の読み込み完了');
      } else {
        console.error('API設定の取得に失敗しました:', data.error);
      }
    } catch (error) {
      console.error('API設定取得エラー:', error);
    } finally {
      console.log('読み込み状態を完了に設定');
      setApiSettingsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const getServiceDisplayName = (service: string) => {
    const serviceNames: { [key: string]: string } = {
      stripe: 'Stripe',
      paypal: 'PayPal',
      square: 'Square',
      paypay: 'PayPay',
      fincode: 'fincode',
    };
    return serviceNames[service.toLowerCase()] || service;
  };

  const formatAmount = (value: string): number => {
    // カンマを除去してから数値に変換
    const cleanValue = value.replace(/,/g, '');
    const numValue = parseFloat(cleanValue);

    // JPYの場合はそのまま、その他は100倍（セント単位に変換）
    if (formData.currency === 'jpy') {
      return Math.round(numValue);
    }
    return Math.round(numValue * 100);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title || !formData.amount) {
      toast({
        title: 'エラー',
        description: 'タイトルと金額は必須です',
        variant: 'destructive',
      });
      return;
    }

    if (!selectedApiSetting) {
      toast({
        title: 'エラー',
        description: 'API設定を選択してください',
        variant: 'destructive',
      });
      return;
    }

    const cleanAmount = formData.amount.replace(/,/g, '');
    const amount = parseFloat(cleanAmount);
    if (isNaN(amount) || amount <= 0) {
      toast({
        title: 'エラー',
        description: '有効な金額を入力してください',
        variant: 'destructive',
      });
      return;
    }

    const stripeAmount = formatAmount(formData.amount);
    if (stripeAmount > 99999999) {
      toast({
        title: 'エラー',
        description: `金額が上限を超えています。99,999,999円以下で入力してください（入力値: ${amount.toLocaleString()}円）`,
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    try {
      // 選択されたAPI設定を取得
      const selectedSetting = apiSettings.find(setting => setting.id === selectedApiSetting);
      if (!selectedSetting) {
        throw new Error('選択されたAPI設定が見つかりません');
      }

      const requestData = {
        title: formData.title,
        description: formData.description || undefined,
        amount: formatAmount(formData.amount),
        currency: formData.currency,
        service: selectedSetting.service.toLowerCase(), // 選択されたAPI設定のサービス
        apiSettingId: selectedApiSetting, // API設定のIDを含める
        environment: selectedSetting.environment, // 環境情報も含める
      };

      console.log('送信データ:', requestData);

      // 選択されたサービスに応じてAPIエンドポイントを選択
      const apiEndpoint = selectedSetting.service === 'stripe'
        ? '/api/payment-links/stripe'
        : selectedSetting.service === 'paypal'
        ? '/api/payment-links/paypal'
        : '/api/payment-links'; // その他のサービス

      console.log('API呼び出し先:', apiEndpoint);

      // 決済リンクを作成
      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '決済リンクの作成に失敗しました');
      }

      if (data.success && data.data) {
        toast({
          title: '成功',
          description: '決済リンクが作成されました',
          variant: 'default',
        });

        // 作成された決済リンクページにリダイレクト
        router.push(`/p/${data.data.id}`);
      } else {
        throw new Error('決済リンクの作成に失敗しました');
      }

    } catch (error) {
      console.error('決済リンク作成エラー:', error);
      toast({
        title: 'エラー',
        description: error instanceof Error ? error.message : '決済リンクの作成に失敗しました',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const isFormValid = formData.title && formData.amount && parseFloat(formData.amount) > 0 && selectedApiSetting;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-2xl">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Plus className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <CardTitle className="text-2xl">決済リンクを作成</CardTitle>
                <CardDescription>
                  商品やサービスの決済リンクを簡単に作成できます
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* タイトル */}
              <div className="space-y-2">
                <Label htmlFor="title">商品・サービス名 *</Label>
                <Input
                  id="title"
                  placeholder="例: プレミアムプラン、コンサルティング料"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  maxLength={100}
                  required
                />
              </div>

              {/* 説明 */}
              <div className="space-y-2">
                <Label htmlFor="description">説明（任意）</Label>
                <Textarea
                  id="description"
                  placeholder="商品やサービスの詳細説明..."
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  maxLength={500}
                  rows={3}
                />
                <p className="text-xs text-gray-500">
                  {formData.description.length}/500文字
                </p>
              </div>

              {/* 金額と通貨 */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="amount">金額 *</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="amount"
                      type="number"
                      placeholder="1000"
                      value={formData.amount}
                      onChange={(e) => handleInputChange('amount', e.target.value)}
                      className="pl-10"
                      min="1"
                      step="0.01"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="currency">通貨</Label>
                  <Select value={formData.currency} onValueChange={(value) => handleInputChange('currency', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="jpy">JPY (日本円)</SelectItem>
                      <SelectItem value="usd">USD (米ドル)</SelectItem>
                      <SelectItem value="eur">EUR (ユーロ)</SelectItem>
                      <SelectItem value="gbp">GBP (英ポンド)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* API設定選択 */}
              <div className="space-y-2">
                <Label htmlFor="apiSetting">API設定を選択 *</Label>
                {apiSettingsLoading ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-blue-600">
                      <div className="relative">
                        <Loader2 className="h-5 w-5 animate-spin" />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-2 h-2 bg-blue-100 rounded-full animate-pulse"></div>
                        </div>
                      </div>
                      <span className="text-sm font-medium">API設定を読み込み中...</span>
                    </div>
                    <SkeletonLoader width="w-full" height="h-10" shimmer={true} />
                  </div>
                ) : apiSettings.length === 0 ? (
                  <div className="border rounded-lg p-4 bg-yellow-50 border-yellow-200">
                    <div className="flex items-center gap-2 text-yellow-800">
                      <AlertCircle className="h-4 w-4" />
                      <p className="text-sm font-medium">利用可能なAPI設定がありません</p>
                    </div>
                    <p className="text-sm text-yellow-700 mt-1">
                      決済リンクを作成するには、まず
                      <a href="/settings" className="underline hover:no-underline font-medium">
                        API設定ページ
                      </a>
                      で決済サービスの認証情報を設定してください。
                    </p>
                  </div>
                ) : (
                  <Select
                    value={selectedApiSetting}
                    onValueChange={setSelectedApiSetting}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="API設定を選択してください" />
                    </SelectTrigger>
                    <SelectContent>
                      {apiSettings.map((setting) => (
                        <SelectItem key={setting.id} value={setting.id}>
                          <div className="flex items-center gap-2">
                            <CreditCard className="h-4 w-4" />
                            <span>
                              {getServiceDisplayName(setting.service)}
                              ({setting.environment === 'sandbox' ? 'サンドボックス' : '本番環境'})
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>

              {/* プレビュー */}
              {formData.title && formData.amount && (
                <div className="border rounded-lg p-4 bg-gray-50">
                  <h3 className="font-medium text-gray-900 mb-2">プレビュー</h3>
                  <div className="space-y-1">
                    <p className="font-medium">{formData.title}</p>
                    {formData.description && (
                      <p className="text-sm text-gray-600">{formData.description}</p>
                    )}
                    <p className="text-lg font-bold text-blue-600">
                      {new Intl.NumberFormat('ja-JP', {
                        style: 'currency',
                        currency: formData.currency,
                        minimumFractionDigits: 0,
                      }).format(parseFloat(formData.amount) || 0)}
                    </p>
                  </div>
                </div>
              )}

              {/* 送信ボタン */}
              <Button
                type="submit"
                disabled={!isFormValid || loading}
                className="w-full"
                size="lg"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    作成中...
                  </>
                ) : (
                  <>
                    <Plus className="mr-2 h-4 w-4" />
                    決済リンクを作成
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}