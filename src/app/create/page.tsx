'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { CreatePaymentLinkRequest, CreatePaymentLinkResponse } from '@/types/payment'
import { PaymentService } from '@prisma/client'

interface PaymentConfig {
  id: string
  provider: PaymentService
  displayName: string
  isTestMode: boolean
  isActive: boolean
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
        amount: parseFloat(formData.amount),
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
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">決済リンク作成</h1>

        {/* 成功メッセージ */}
        {success && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
            <h2 className="text-lg font-semibold text-green-800 mb-4">
              決済リンクが作成されました！
            </h2>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-green-700 mb-1">
                  決済リンク URL
                </label>
                <div className="flex">
                  <input
                    type="text"
                    value={success.linkUrl}
                    readOnly
                    className="flex-1 p-2 border border-green-300 rounded-l-md bg-white"
                  />
                  <button
                    onClick={() => copyToClipboard(success.linkUrl)}
                    className="px-4 py-2 bg-green-600 text-white rounded-r-md hover:bg-green-700"
                  >
                    コピー
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-green-700">金額:</span> {success.amount.toLocaleString()} {success.currency.toUpperCase()}
                </div>
                <div>
                  <span className="text-green-700">有効期限:</span>{' '}
                  {success.expiresAt ? new Date(success.expiresAt).toLocaleString() : '無期限'}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* エラーメッセージ */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* 決済設定の確認 */}
        {paymentConfigs.length === 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <p className="text-yellow-800">
              有効な決済設定がありません。
              <a href="/settings/payments" className="underline ml-1">
                決済設定
              </a>
              から設定を追加してください。
            </p>
          </div>
        )}

        {/* フォーム */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 決済設定選択 */}
          <div>
            <label htmlFor="userPaymentConfigId" className="block text-sm font-medium text-gray-700 mb-1">
              決済設定 *
            </label>
            <select
              id="userPaymentConfigId"
              value={formData.userPaymentConfigId}
              onChange={(e) => setFormData(prev => ({ ...prev, userPaymentConfigId: e.target.value }))}
              required
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">決済設定を選択してください</option>
              {paymentConfigs.map((config) => (
                <option key={config.id} value={config.id}>
                  {config.displayName} ({config.provider.toUpperCase()})
                  {config.isTestMode ? ' [テストモード]' : ' [本番モード]'}
                </option>
              ))}
            </select>
          </div>

          {/* 金額 */}
          <div>
            <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-1">
              金額 *
            </label>
            <input
              type="number"
              id="amount"
              value={formData.amount}
              onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
              min="1"
              step="1"
              required
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="1000"
            />
          </div>

          {/* 通貨 */}
          <div>
            <label htmlFor="currency" className="block text-sm font-medium text-gray-700 mb-1">
              通貨 *
            </label>
            <select
              id="currency"
              value={formData.currency}
              onChange={(e) => setFormData(prev => ({ ...prev, currency: e.target.value }))}
              required
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="jpy">JPY (日本円)</option>
              <option value="usd">USD (米ドル)</option>
              <option value="eur">EUR (ユーロ)</option>
            </select>
          </div>

          {/* 説明 */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
              説明 (任意)
            </label>
            <textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              rows={3}
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="商品やサービスの説明を入力してください"
            />
          </div>

          {/* 有効期限 */}
          <div>
            <label htmlFor="expiresInHours" className="block text-sm font-medium text-gray-700 mb-1">
              有効期限
            </label>
            <select
              id="expiresInHours"
              value={formData.expiresInHours}
              onChange={(e) => setFormData(prev => ({ ...prev, expiresInHours: e.target.value }))}
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="1">1時間</option>
              <option value="6">6時間</option>
              <option value="24">24時間</option>
              <option value="72">3日</option>
              <option value="168">1週間</option>
            </select>
          </div>

          {/* 送信ボタン */}
          <button
            type="submit"
            disabled={loading || paymentConfigs.length === 0}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-md font-medium hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? '作成中...' : '決済リンクを作成'}
          </button>
        </form>

        {/* ダッシュボードへのリンク */}
        <div className="mt-8 text-center">
          <a
            href="/dashboard"
            className="text-blue-600 hover:text-blue-800 underline"
          >
            作成した決済リンク一覧を見る
          </a>
        </div>
      </div>
    </div>
  )
}