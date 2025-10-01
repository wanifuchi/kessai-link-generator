'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  ArrowLeft,
  CreditCard,
  DollarSign,
  Calendar,
  Settings,
  Loader2,
  Eye,
  FileText,
  Clock,
  Zap,
  Copy,
  CheckCircle,
  AlertCircle,
  Info
} from 'lucide-react';
import { PaymentFormData, CreatePaymentLinkRequest, CreatePaymentLinkResponse } from '@/types/payment';
import QRCodeDisplay from '@/components/QRCodeDisplay';

interface PaymentConfig {
  id: string;
  displayName: string;
  provider: string;
  isTestMode: boolean;
  isActive: boolean;
}

export default function CreatePaymentLinkPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  const [formData, setFormData] = useState({
    amount: '',
    currency: 'jpy',
    description: '',
    expiresInHours: '24',
    userPaymentConfigId: '',
  })

  const [paymentConfigs, setPaymentConfigs] = useState<PaymentConfig[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState<CreatePaymentLinkResponse | null>(null)

  // 認証チェック
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
    }
  }, [status, router])

  // 決済設定を取得
  useEffect(() => {
    const fetchPaymentConfigs = async () => {
      try {
        const response = await fetch('/api/payment-configs')
        if (response.ok) {
          const data = await response.json()
          const activeConfigs = data.filter((config: PaymentConfig) => config.isActive)
          setPaymentConfigs(activeConfigs)

          // デフォルトの設定を選択
          if (activeConfigs.length > 0) {
            setFormData(prev => ({
              ...prev,
              userPaymentConfigId: activeConfigs[0].id,
            }))
          }
        }
      } catch (error) {
        console.error('決済設定の取得に失敗:', error)
      }
    }

    if (session) {
      fetchPaymentConfigs()

      // ページフォーカス時に再取得（別タブで設定変更した場合に対応）
      const handleFocus = () => {
        fetchPaymentConfigs()
      }
      window.addEventListener('focus', handleFocus)

      return () => {
        window.removeEventListener('focus', handleFocus)
      }
    }
  }, [session])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess(null)

    try {
      const expiresAt = new Date(Date.now() + parseInt(formData.expiresInHours) * 60 * 60 * 1000)

      const requestData: CreatePaymentLinkRequest = {
        amount: parseFloat(formData.amount.replace(/,/g, '')) || 0,
        currency: formData.currency,
        description: formData.description || undefined,
        expiresAt: expiresAt,
        userPaymentConfigId: formData.userPaymentConfigId,
      }

      const response = await fetch('/api/payment-links', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || '決済リンクの作成に失敗しました')
      }

      const result: CreatePaymentLinkResponse = await response.json()
      setSuccess(result)

      // フォームをリセット
      setFormData({
        amount: '',
        currency: 'jpy',
        description: '',
        expiresInHours: '24',
        userPaymentConfigId: paymentConfigs[0]?.id || '',
      })

    } catch (error) {
      setError(error instanceof Error ? error.message : '決済リンクの作成に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    alert('クリップボードにコピーしました')
  }

  if (status === 'loading') {
    return <div className="flex justify-center items-center min-h-screen">読み込み中...</div>
  }

  if (!session) {
    return null
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <Link href="/dashboard">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              戻る
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">決済リンク作成</h1>
            <p className="text-muted-foreground">新しい決済リンクを作成してください</p>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* メインフォーム */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  決済情報
                </CardTitle>
                <CardDescription>
                  決済リンクの基本情報を入力してください
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* 決済設定選択 */}
                  <div className="space-y-2">
                    <Label htmlFor="userPaymentConfigId">決済設定 *</Label>
                    <Select
                      value={formData.userPaymentConfigId}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, userPaymentConfigId: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="決済設定を選択してください" />
                      </SelectTrigger>
                      <SelectContent>
                        {paymentConfigs.map((config) => (
                          <SelectItem key={config.id} value={config.id}>
                            <div className="flex items-center gap-2">
                              <span>{config.displayName}</span>
                              <Badge variant={config.isTestMode ? "secondary" : "default"}>
                                {config.provider.toUpperCase()}
                              </Badge>
                              <Badge variant="outline">
                                {config.isTestMode ? 'テスト' : '本番'}
                              </Badge>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* 金額 */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="amount">金額 *</Label>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="amount"
                          type="text"
                          value={formData.amount}
                          onChange={(e) => {
                            const value = e.target.value.replace(/,/g, ''); // カンマを除去
                            if (value === '' || /^\d+$/.test(value)) { // 数字のみ許可
                              setFormData(prev => ({
                                ...prev,
                                amount: value ? parseInt(value).toLocaleString() : '' // 3桁区切りで表示
                              }));
                            }
                          }}
                          required
                          className="pl-10"
                          placeholder="1,000"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="currency">通貨 *</Label>
                      <Select
                        value={formData.currency}
                        onValueChange={(value) => setFormData(prev => ({ ...prev, currency: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="jpy">JPY (日本円)</SelectItem>
                          <SelectItem value="usd">USD (米ドル)</SelectItem>
                          <SelectItem value="eur">EUR (ユーロ)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* 説明 */}
                  <div className="space-y-2">
                    <Label htmlFor="description">説明 (任意)</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      rows={3}
                      placeholder="商品やサービスの説明を入力してください"
                    />
                  </div>

                  {/* 有効期限 */}
                  <div className="space-y-2">
                    <Label htmlFor="expiresInHours">有効期限</Label>
                    <Select
                      value={formData.expiresInHours}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, expiresInHours: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4" />
                            1時間
                          </div>
                        </SelectItem>
                        <SelectItem value="6">
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4" />
                            6時間
                          </div>
                        </SelectItem>
                        <SelectItem value="24">
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4" />
                            24時間
                          </div>
                        </SelectItem>
                        <SelectItem value="72">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            3日
                          </div>
                        </SelectItem>
                        <SelectItem value="168">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            1週間
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* 送信ボタン */}
                  <Button
                    type="submit"
                    disabled={loading || paymentConfigs.length === 0}
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
                        <Zap className="mr-2 h-4 w-4" />
                        決済リンクを作成
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* サイドバー */}
          <div className="space-y-6">
            {/* 成功メッセージ */}
            {success && (
              <Card className="border-green-200 bg-green-50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-green-800">
                    <CheckCircle className="h-5 w-5" />
                    作成完了！
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-green-700">決済リンク URL</Label>
                    <div className="flex mt-1">
                      <Input
                        value={success.linkUrl}
                        readOnly
                        className="rounded-r-none border-green-300 bg-white"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        className="rounded-l-none border-green-300 hover:bg-green-100"
                        onClick={() => copyToClipboard(success.linkUrl)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* QRコード表示 */}
                  <div>
                    <Label className="text-green-700">QRコード</Label>
                    <div className="flex justify-center mt-2">
                      <QRCodeDisplay
                        url={success.linkUrl}
                        autoGenerate={true}
                        options={{
                          size: 128,
                          margin: 2,
                          errorCorrectionLevel: 'M'
                        }}
                        alt="決済リンクQRコード"
                        className="border border-green-300"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-green-700">金額:</span>
                      <span>{success.amount.toLocaleString()} {success.currency.toUpperCase()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-green-700">有効期限:</span>
                      <span>{success.expiresAt ? new Date(success.expiresAt).toLocaleString() : '無期限'}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <Button asChild variant="outline">
                      <Link href={success.linkUrl} target="_blank">
                        <Eye className="mr-2 h-4 w-4" />
                        プレビュー
                      </Link>
                    </Button>
                    <Button asChild variant="outline">
                      <Link href="/dashboard">
                        <FileText className="mr-2 h-4 w-4" />
                        ダッシュボード
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* エラーメッセージ */}
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* 決済設定の確認 */}
            {paymentConfigs.length === 0 && (
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  有効な決済設定がありません。
                  <Link href="/settings/payments" className="underline ml-1">
                    決済設定
                  </Link>
                  から設定を追加してください。
                </AlertDescription>
              </Alert>
            )}

            {/* ヘルプカード */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  使い方ガイド
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="space-y-2">
                  <h4 className="font-medium">決済リンクについて</h4>
                  <p className="text-muted-foreground">
                    作成された決済リンクを顧客に送信することで、簡単に決済を受け付けることができます。
                  </p>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium">有効期限</h4>
                  <p className="text-muted-foreground">
                    設定した有効期限を過ぎると、リンクは自動的に無効になります。
                  </p>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium">決済設定</h4>
                  <p className="text-muted-foreground">
                    事前に決済サービスの設定を完了している必要があります。
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}