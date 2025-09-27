'use client'

import { useState, useEffect } from 'react'
import { PaymentService } from '@prisma/client'
import {
  PaymentConfigFormData,
  EncryptedPaymentConfig,
  ConnectionTestResult
} from '@/types/paymentConfig'

export default function PaymentSettingsPage() {
  const [configs, setConfigs] = useState<EncryptedPaymentConfig[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingConfig, setEditingConfig] = useState<string | null>(null)
  const [testResults, setTestResults] = useState<Record<string, ConnectionTestResult>>({})

  // 初期データ読み込み
  useEffect(() => {
    loadConfigs()
  }, [])

  const loadConfigs = async () => {
    try {
      const response = await fetch('/api/payment-configs')
      if (response.ok) {
        const data = await response.json()
        setConfigs(data)
      }
    } catch (error) {
      console.error('設定の読み込みエラー:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddConfig = () => {
    setEditingConfig(null)
    setShowForm(true)
  }

  const handleEditConfig = (configId: string) => {
    setEditingConfig(configId)
    setShowForm(true)
  }

  const handleDeleteConfig = async (configId: string) => {
    if (!confirm('この設定を削除しますか？関連する決済リンクが利用できなくなる可能性があります。')) {
      return
    }

    try {
      const response = await fetch(`/api/payment-configs/${configId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        await loadConfigs()
      } else {
        alert('削除に失敗しました')
      }
    } catch (error) {
      console.error('削除エラー:', error)
      alert('削除中にエラーが発生しました')
    }
  }

  const handleTestConnection = async (configId: string) => {
    try {
      setTestResults(prev => ({
        ...prev,
        [configId]: { success: false, message: '接続テスト中...', testedAt: new Date() }
      }))

      const response = await fetch(`/api/payment-configs/${configId}/test`, {
        method: 'POST'
      })

      const result = await response.json()

      setTestResults(prev => ({
        ...prev,
        [configId]: result
      }))

      if (result.success) {
        await loadConfigs() // 検証日時を更新
      }
    } catch (error) {
      console.error('接続テストエラー:', error)
      setTestResults(prev => ({
        ...prev,
        [configId]: { success: false, message: 'テストに失敗しました', testedAt: new Date() }
      }))
    }
  }

  const getProviderLabel = (provider: PaymentService): string => {
    const labels = {
      [PaymentService.stripe]: 'Stripe',
      [PaymentService.paypal]: 'PayPal',
      [PaymentService.square]: 'Square',
      [PaymentService.paypay]: 'PayPay',
      [PaymentService.fincode]: 'fincode'
    }
    return labels[provider] || provider
  }

  const getProviderIcon = (provider: PaymentService): string => {
    const icons = {
      [PaymentService.stripe]: '💳',
      [PaymentService.paypal]: '🅿️',
      [PaymentService.square]: '⬜',
      [PaymentService.paypay]: '💰',
      [PaymentService.fincode]: '🏦'
    }
    return icons[provider] || '💳'
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">設定を読み込み中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* ヘッダー */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">決済設定管理</h1>
          <p className="mt-2 text-gray-600">
            各決済サービスのAPI情報を安全に管理できます。設定情報は暗号化されて保存されます。
          </p>
        </div>

        {/* アクションボタン */}
        <div className="mb-6">
          <button
            onClick={handleAddConfig}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            + 新しい決済設定を追加
          </button>
        </div>

        {/* 設定一覧 */}
        {configs.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
            <div className="text-gray-400 text-6xl mb-4">💳</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">決済設定がありません</h3>
            <p className="text-gray-600 mb-6">
              決済リンクを作成するには、まず決済サービスの設定を追加してください。
            </p>
            <button
              onClick={handleAddConfig}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              最初の設定を追加
            </button>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {configs.map((config) => {
              const testResult = testResults[config.id]
              const hasTestResult = !!testResult
              const isTestSuccessful = hasTestResult && testResult.success

              return (
                <div key={config.id} className="bg-white rounded-lg border border-gray-200 p-6">
                  {/* プロバイダー情報 */}
                  <div className="flex items-center mb-4">
                    <div className="text-2xl mr-3">
                      {getProviderIcon(config.provider)}
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">{config.displayName}</h3>
                      <p className="text-sm text-gray-600">{getProviderLabel(config.provider)}</p>
                    </div>
                  </div>

                  {/* ステータス表示 */}
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">モード:</span>
                      <span className={`text-sm font-medium ${
                        config.isTestMode ? 'text-yellow-600' : 'text-green-600'
                      }`}>
                        {config.isTestMode ? 'テスト' : '本番'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">状態:</span>
                      <span className={`text-sm font-medium ${
                        config.isActive ? 'text-green-600' : 'text-gray-400'
                      }`}>
                        {config.isActive ? '有効' : '無効'}
                      </span>
                    </div>

                    {config.verifiedAt && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">検証済み:</span>
                        <span className="text-sm text-green-600">
                          {new Date(config.verifiedAt).toLocaleDateString('ja-JP')}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* 接続テスト結果 */}
                  {hasTestResult && (
                    <div className={`p-3 rounded-lg mb-4 ${
                      isTestSuccessful
                        ? 'bg-green-50 border border-green-200'
                        : 'bg-red-50 border border-red-200'
                    }`}>
                      <div className="flex items-center">
                        <span className={`text-sm font-medium ${
                          isTestSuccessful ? 'text-green-700' : 'text-red-700'
                        }`}>
                          {isTestSuccessful ? '✅' : '❌'} {testResult.message}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* アクションボタン */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleTestConnection(config.id)}
                      className="flex-1 bg-gray-100 text-gray-700 px-3 py-2 rounded-md text-sm font-medium hover:bg-gray-200 transition-colors"
                    >
                      接続テスト
                    </button>
                    <button
                      onClick={() => handleEditConfig(config.id)}
                      className="flex-1 bg-blue-100 text-blue-700 px-3 py-2 rounded-md text-sm font-medium hover:bg-blue-200 transition-colors"
                    >
                      編集
                    </button>
                    <button
                      onClick={() => handleDeleteConfig(config.id)}
                      className="bg-red-100 text-red-700 px-3 py-2 rounded-md text-sm font-medium hover:bg-red-200 transition-colors"
                    >
                      削除
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* フォームモーダル */}
        {showForm && (
          <PaymentConfigForm
            configId={editingConfig}
            onClose={() => setShowForm(false)}
            onSave={() => {
              setShowForm(false)
              loadConfigs()
            }}
          />
        )}
      </div>
    </div>
  )
}

// 設定フォームコンポーネント（別ファイルに分離予定）
function PaymentConfigForm({
  configId,
  onClose,
  onSave
}: {
  configId: string | null
  onClose: () => void
  onSave: () => void
}) {
  const [formData, setFormData] = useState<PaymentConfigFormData>({
    displayName: '',
    provider: PaymentService.stripe,
    isTestMode: true,
    isActive: false,
    config: {}
  })
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<string[]>([])

  const isEditing = !!configId

  useEffect(() => {
    if (isEditing) {
      loadConfigData()
    }
  }, [configId])

  const loadConfigData = async () => {
    if (!configId) return

    try {
      const response = await fetch(`/api/payment-configs/${configId}`)
      if (response.ok) {
        const data = await response.json()
        setFormData(data)
      }
    } catch (error) {
      console.error('設定データの読み込みエラー:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setErrors([])

    try {
      const url = isEditing
        ? `/api/payment-configs/${configId}`
        : '/api/payment-configs'

      const response = await fetch(url, {
        method: isEditing ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        onSave()
      } else {
        const error = await response.json()
        setErrors([error.message || '保存に失敗しました'])
      }
    } catch (error) {
      console.error('保存エラー:', error)
      setErrors(['保存中にエラーが発生しました'])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">
              {isEditing ? '決済設定の編集' : '新しい決済設定'}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>

          {errors.length > 0 && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <ul className="text-red-700 text-sm space-y-1">
                {errors.map((error, index) => (
                  <li key={index}>• {error}</li>
                ))}
              </ul>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 基本設定 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                設定名 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.displayName}
                onChange={(e) => setFormData(prev => ({ ...prev, displayName: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="例: メインのStripe設定"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                決済サービス <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.provider}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  provider: e.target.value as PaymentService,
                  config: {} // プロバイダー変更時は設定をリセット
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isEditing} // 編集時はプロバイダー変更不可
              >
                <option value={PaymentService.stripe}>Stripe</option>
                <option value={PaymentService.paypal}>PayPal</option>
                <option value={PaymentService.square}>Square</option>
                <option value={PaymentService.paypay}>PayPay</option>
                <option value={PaymentService.fincode}>fincode</option>
              </select>
            </div>

            <div className="flex gap-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.isTestMode}
                  onChange={(e) => setFormData(prev => ({ ...prev, isTestMode: e.target.checked }))}
                  className="mr-2"
                />
                <span className="text-sm text-gray-700">テストモード</span>
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                  className="mr-2"
                />
                <span className="text-sm text-gray-700">有効にする</span>
              </label>
            </div>

            {/* プロバイダー固有の設定フィールド */}
            <div className="border-t pt-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {formData.provider.toUpperCase()} 設定
              </h3>

              {/* Stripe設定フィールド */}
              {formData.provider === PaymentService.stripe && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Publishable Key <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={(formData.config as any)?.publishableKey || ''}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        config: { ...prev.config as any, publishableKey: e.target.value }
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="pk_test_... または pk_live_..."
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Secret Key <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="password"
                      value={(formData.config as any)?.secretKey || ''}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        config: { ...prev.config as any, secretKey: e.target.value }
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="sk_test_... または sk_live_..."
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Webhook Secret (オプション)
                    </label>
                    <input
                      type="password"
                      value={(formData.config as any)?.webhookSecret || ''}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        config: { ...prev.config as any, webhookSecret: e.target.value }
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="whsec_..."
                    />
                  </div>
                </div>
              )}

              {/* PayPal設定フィールド */}
              {formData.provider === PaymentService.paypal && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Client ID <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={(formData.config as any)?.clientId || ''}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        config: { ...prev.config as any, clientId: e.target.value }
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="PayPal Client ID"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Client Secret <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="password"
                      value={(formData.config as any)?.clientSecret || ''}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        config: { ...prev.config as any, clientSecret: e.target.value }
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="PayPal Client Secret"
                      required
                    />
                  </div>
                </div>
              )}

              {/* Square設定フィールド */}
              {formData.provider === PaymentService.square && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Application ID <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={(formData.config as any)?.applicationId || ''}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        config: { ...prev.config as any, applicationId: e.target.value }
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Square Application ID"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Access Token <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="password"
                      value={(formData.config as any)?.accessToken || ''}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        config: { ...prev.config as any, accessToken: e.target.value }
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Square Access Token"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Location ID (オプション)
                    </label>
                    <input
                      type="text"
                      value={(formData.config as any)?.locationId || ''}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        config: { ...prev.config as any, locationId: e.target.value }
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Square Location ID"
                    />
                  </div>
                </div>
              )}

              {/* PayPay設定フィールド */}
              {formData.provider === PaymentService.paypay && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Merchant ID <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={(formData.config as any)?.merchantId || ''}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        config: { ...prev.config as any, merchantId: e.target.value }
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="PayPay Merchant ID"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      API Key <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="password"
                      value={(formData.config as any)?.apiKey || ''}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        config: { ...prev.config as any, apiKey: e.target.value }
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="PayPay API Key"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      API Secret <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="password"
                      value={(formData.config as any)?.apiSecret || ''}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        config: { ...prev.config as any, apiSecret: e.target.value }
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="PayPay API Secret"
                      required
                    />
                  </div>
                </div>
              )}

              {/* fincode設定フィールド */}
              {formData.provider === PaymentService.fincode && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Shop ID <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={(formData.config as any)?.shopId || ''}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        config: { ...prev.config as any, shopId: e.target.value }
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="fincode Shop ID"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Secret Key <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="password"
                      value={(formData.config as any)?.secretKey || ''}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        config: { ...prev.config as any, secretKey: e.target.value }
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="fincode Secret Key"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Public Key <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={(formData.config as any)?.publicKey || ''}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        config: { ...prev.config as any, publicKey: e.target.value }
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="fincode Public Key"
                      required
                    />
                  </div>
                </div>
              )}
            </div>

            {/* 送信ボタン */}
            <div className="flex gap-3 pt-6 border-t">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                キャンセル
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? '保存中...' : isEditing ? '更新' : '作成'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}