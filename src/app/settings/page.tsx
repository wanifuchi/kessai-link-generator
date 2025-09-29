'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Plus, Settings, Eye, EyeOff, Trash2, Edit } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { SkeletonLoader } from '@/components/loading';

interface ApiSetting {
  id: string;
  service: string;
  environment: string;
  publishableKey?: string;
  webhookUrl?: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface FormData {
  service: string;
  environment: string;
  publishableKey: string;
  secretKey: string;
  webhookUrl: string;
  description: string;
  isActive?: boolean;
}

export default function SettingsPage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [settings, setSettings] = useState<ApiSetting[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showSecretKeys, setShowSecretKeys] = useState<{ [key: string]: boolean }>({});

  const [formData, setFormData] = useState<FormData>({
    service: '',
    environment: 'sandbox',
    publishableKey: '',
    secretKey: '',
    webhookUrl: '',
    description: '',
    isActive: true,
  });

  const loadSettings = useCallback(async () => {
    try {
      const response = await fetch('/api/settings');
      const data = await response.json();

      if (data.success) {
        setSettings(data.data);
      } else {
        toast({
          title: 'エラー',
          description: 'API設定の取得に失敗しました',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('設定取得エラー:', error);
      toast({
        title: 'エラー',
        description: 'API設定の取得に失敗しました',
        variant: 'destructive',
      });
    } finally {
      setInitialLoading(false);
    }
  }, [toast]);

  const handleInputChange = (field: keyof FormData, value: string) => {
    // リアルタイム汚染チェック
    const suspiciousPatterns = [
      /Script was injected/i,
      /console\./i,
      /DevTools/i,
      /page-[a-f0-9]+\.js/i,
      /Failed to load resource/i,
      /Download the React/i
    ];

    const isContaminated = suspiciousPatterns.some(pattern => pattern.test(value));

    if (isContaminated) {
      toast({
        title: '警告',
        description: `${field}フィールドに異常な文字列が検出されました。フィールドをクリアして正しい値を入力してください。`,
        variant: 'destructive',
      });
      // 汚染された値は設定しない
      return;
    }

    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const resetForm = () => {
    setFormData({
      service: '',
      environment: 'sandbox',
      publishableKey: '',
      secretKey: '',
      webhookUrl: '',
      description: '',
      isActive: true,
    });
    setEditingId(null);
    setShowForm(false);
  };

  // フィールドのサニタイズと検証
  const sanitizeAndValidate = (data: FormData) => {
    const sanitized = { ...data };
    const contaminations: string[] = [];

    // 異常な文字列パターンを検出
    const suspiciousPatterns = [
      /Script was injected/i,
      /console\./i,
      /DevTools/i,
      /page-[a-f0-9]+\.js/i,
      /Failed to load resource/i,
      /Download the React/i
    ];

    // 各フィールドをチェック・サニタイズ
    Object.keys(sanitized).forEach(key => {
      const value = sanitized[key as keyof FormData];
      if (typeof value === 'string') {
        for (const pattern of suspiciousPatterns) {
          if (pattern.test(value)) {
            contaminations.push(`${key}: 異常な文字列を検出`);
            // 汚染された値をクリア
            (sanitized as any)[key] = '';
          }
        }
      }
    });

    return { sanitized, contaminations };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 入力データのサニタイズと検証
    const { sanitized, contaminations } = sanitizeAndValidate(formData);

    if (contaminations.length > 0) {
      toast({
        title: '入力エラー',
        description: `フィールドに異常なデータが検出されました: ${contaminations.join(', ')}。フィールドをクリアして再入力してください。`,
        variant: 'destructive',
      });
      return;
    }

    if (!sanitized.service || !sanitized.secretKey) {
      toast({
        title: 'エラー',
        description: 'サービスと秘密キーは必須です',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    try {
      const url = editingId ? `/api/settings/${editingId}` : '/api/settings';
      const method = editingId ? 'PUT' : 'POST';

      console.log('送信データ:', sanitized);

      // 空文字列のoptionalフィールドをundefinedに変換
      const requestData = {
        ...sanitized,
        publishableKey: sanitized.publishableKey || undefined,
        webhookUrl: sanitized.webhookUrl || undefined,
        description: sanitized.description || undefined,
        isActive: sanitized.isActive ?? true,
      };

      console.log('実際の送信データ:', requestData);

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: '成功',
          description: editingId ? 'API設定を更新しました' : 'API設定を作成しました',
          variant: 'default',
        });
        resetForm();
        loadSettings();
      } else {
        console.error('API詳細エラー:', data);
        throw new Error(data.error || 'API設定の操作に失敗しました');
      }
    } catch (error) {
      console.error('API設定操作エラー:', error);
      toast({
        title: 'エラー',
        description: error instanceof Error ? error.message : 'API設定の操作に失敗しました',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (setting: ApiSetting) => {
    setFormData({
      service: setting.service,
      environment: setting.environment,
      publishableKey: setting.publishableKey || '',
      secretKey: '', // セキュリティのため空にする
      webhookUrl: setting.webhookUrl || '',
      description: setting.description || '',
      isActive: setting.isActive,
    });
    setEditingId(setting.id);
    setShowForm(true);
  };

  const handleDelete = useCallback(async (id: string) => {
    if (!confirm('この設定を削除してもよろしいですか？')) return;

    try {
      const response = await fetch(`/api/settings/${id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: '成功',
          description: 'API設定を削除しました',
          variant: 'default',
        });
        loadSettings();
      } else {
        throw new Error(data.error || 'API設定の削除に失敗しました');
      }
    } catch (error) {
      console.error('API設定削除エラー:', error);
      toast({
        title: 'エラー',
        description: error instanceof Error ? error.message : 'API設定の削除に失敗しました',
        variant: 'destructive',
      });
    }
  }, [toast, loadSettings]);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const toggleSecretKeyVisibility = (settingId: string) => {
    setShowSecretKeys(prev => ({
      ...prev,
      [settingId]: !prev[settingId]
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
    return serviceNames[service] || service;
  };

  const getEnvironmentDisplayName = (environment: string) => {
    return environment === 'sandbox' ? 'サンドボックス' : '本番環境';
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* ヘッダー */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Settings className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">API設定管理</h1>
                <p className="text-gray-600">決済サービスのAPI認証情報を管理します</p>
              </div>
            </div>

            <Button
              onClick={() => setShowForm(true)}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              新しい設定を追加
            </Button>
          </div>
        </div>

        {/* 設定フォーム */}
        {showForm && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>
                {editingId ? 'API設定を編集' : '新しいAPI設定を追加'}
              </CardTitle>
              <CardDescription>
                決済サービスのAPI認証情報を設定してください
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  {/* サービス選択 */}
                  <div className="space-y-2">
                    <Label htmlFor="service">決済サービス *</Label>
                    <Select
                      value={formData.service}
                      onValueChange={(value) => handleInputChange('service', value)}
                      disabled={editingId !== null} // 編集時はサービス変更不可
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="サービスを選択" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="stripe">Stripe</SelectItem>
                        <SelectItem value="paypal">PayPal</SelectItem>
                        <SelectItem value="square">Square</SelectItem>
                        <SelectItem value="paypay">PayPay</SelectItem>
                        <SelectItem value="fincode">fincode</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* 環境選択 */}
                  <div className="space-y-2">
                    <Label htmlFor="environment">環境 *</Label>
                    <Select
                      value={formData.environment}
                      onValueChange={(value) => handleInputChange('environment', value)}
                      disabled={editingId !== null} // 編集時は環境変更不可
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="sandbox">サンドボックス（テスト）</SelectItem>
                        <SelectItem value="production">本番環境</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* 公開キー */}
                <div className="space-y-2">
                  <Label htmlFor="publishableKey">パブリッシャブルキー（任意）</Label>
                  <Input
                    id="publishableKey"
                    type="text"
                    placeholder="公開可能なキーを入力"
                    value={formData.publishableKey}
                    onChange={(e) => handleInputChange('publishableKey', e.target.value)}
                  />
                </div>

                {/* 秘密キー */}
                <div className="space-y-2">
                  <Label htmlFor="secretKey">秘密キー *</Label>
                  <Input
                    id="secretKey"
                    type="password"
                    placeholder="秘密キーを入力"
                    value={formData.secretKey}
                    onChange={(e) => handleInputChange('secretKey', e.target.value)}
                    required
                  />
                </div>

                {/* Webhook URL */}
                <div className="space-y-2">
                  <Label htmlFor="webhookUrl">Webhook URL（任意）</Label>
                  <Input
                    id="webhookUrl"
                    type="url"
                    placeholder="https://example.com/webhook"
                    value={formData.webhookUrl}
                    onChange={(e) => handleInputChange('webhookUrl', e.target.value)}
                  />
                </div>

                {/* 説明 */}
                <div className="space-y-2">
                  <Label htmlFor="description">説明（任意）</Label>
                  <Textarea
                    id="description"
                    placeholder="この設定の説明を入力..."
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    rows={3}
                  />
                </div>

                {/* ボタン */}
                <div className="flex gap-4">
                  <Button type="submit" disabled={loading}>
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {editingId ? '更新中...' : '作成中...'}
                      </>
                    ) : (
                      editingId ? '設定を更新' : '設定を作成'
                    )}
                  </Button>

                  <Button type="button" variant="outline" onClick={resetForm}>
                    キャンセル
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* 設定一覧 */}
        <div className="grid gap-4">
          <h2 className="text-xl font-semibold">登録済みAPI設定</h2>

          {initialLoading ? (
            <div className="space-y-6">
              <div className="flex items-center justify-center py-6">
                <div className="text-center space-y-4">
                  <div className="relative">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-4 h-4 bg-blue-100 rounded-full animate-pulse"></div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <p className="text-lg font-medium text-gray-800">API設定を読み込み中...</p>
                    <p className="text-sm text-gray-500">決済サービスの設定を確認しています</p>
                  </div>
                  <div className="w-48 h-1 bg-gray-200 rounded-full mx-auto overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-blue-500 to-purple-600 rounded-full animate-pulse"></div>
                  </div>
                </div>
              </div>
              {Array.from({ length: 2 }).map((_, i) => (
                <Card key={i} className="enhanced-loading">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-4 mb-2">
                          <SkeletonLoader width="w-24" height="h-6" shimmer={true} />
                          <SkeletonLoader width="w-20" height="h-5" shimmer={true} />
                          <SkeletonLoader width="w-16" height="h-5" shimmer={true} />
                        </div>
                        <div className="space-y-2">
                          <SkeletonLoader width="w-48" height="h-4" shimmer={true} />
                          <SkeletonLoader width="w-64" height="h-4" shimmer={true} />
                          <SkeletonLoader width="w-32" height="h-3" shimmer={true} />
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <SkeletonLoader width="w-10" height="h-8" shimmer={true} />
                        <SkeletonLoader width="w-10" height="h-8" shimmer={true} />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : settings.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-8">
                  <Settings className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">まだAPI設定が登録されていません</p>
                  <p className="text-sm text-gray-400 mt-2">
                    決済サービスを利用するには、API設定を追加してください
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            settings.map((setting) => (
              <Card key={setting.id}>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-4 mb-2">
                        <h3 className="text-lg font-semibold">
                          {getServiceDisplayName(setting.service)}
                        </h3>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          setting.environment === 'production'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {getEnvironmentDisplayName(setting.environment)}
                        </span>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          setting.isActive
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {setting.isActive ? 'アクティブ' : '無効'}
                        </span>
                      </div>

                      <div className="space-y-1 text-sm text-gray-600">
                        {setting.publishableKey && (
                          <p><span className="font-medium">パブリッシャブルキー:</span> {setting.publishableKey}</p>
                        )}
                        {setting.webhookUrl && (
                          <p><span className="font-medium">Webhook URL:</span> {setting.webhookUrl}</p>
                        )}
                        {setting.description && (
                          <p><span className="font-medium">説明:</span> {setting.description}</p>
                        )}
                        <p className="text-xs text-gray-400">
                          作成日: {new Date(setting.createdAt).toLocaleString('ja-JP')}
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(setting)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(setting.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}