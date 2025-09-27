'use client'

import { useState, useEffect } from 'react'
import { useParams, useSearchParams, useRouter } from 'next/navigation'
import { PaymentLinkDetails } from '@/types/payment'

export default function PaymentFailedPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const router = useRouter()
  const linkId = params.linkId as string
  const errorMessage = searchParams.get('error')

  const [paymentLink, setPaymentLink] = useState<PaymentLinkDetails | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchPaymentInfo = async () => {
      try {
        const response = await fetch(`/api/payment-links/${linkId}`)
        if (response.ok) {
          const data: PaymentLinkDetails = await response.json()
          setPaymentLink(data)
        }
      } catch (error) {
        console.error('決済情報取得エラー:', error)
      } finally {
        setLoading(false)
      }
    }

    if (linkId) {
      fetchPaymentInfo()
    }
  }, [linkId])

  const handleRetryPayment = () => {
    router.push(`/pay/${linkId}`)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-gray-600">決済情報を確認中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-red-50 flex items-center justify-center py-8">
      <div className="max-w-md mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          {/* エラーアイコン */}
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg
              className="w-8 h-8 text-red-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </div>

          {/* エラーメッセージ */}
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            決済に失敗しました
          </h1>
          <p className="text-gray-600 mb-8">
            申し訳ございません。決済処理中にエラーが発生しました。
          </p>

          {/* エラー詳細 */}
          {errorMessage && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <h3 className="text-sm font-medium text-red-800 mb-1">エラー詳細</h3>
              <p className="text-sm text-red-700">{errorMessage}</p>
            </div>
          )}

          {/* 決済情報 */}
          {paymentLink && (
            <div className="bg-gray-50 rounded-lg p-6 mb-6 text-left">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">決済情報</h2>

              {paymentLink.description && (
                <div className="mb-3">
                  <span className="text-sm text-gray-500">内容</span>
                  <p className="text-gray-900">{paymentLink.description}</p>
                </div>
              )}

              <div className="mb-3">
                <span className="text-sm text-gray-500">金額</span>
                <p className="text-xl font-bold text-gray-900">
                  {paymentLink.amount.toLocaleString()} {paymentLink.currency.toUpperCase()}
                </p>
              </div>

              {paymentLink.expiresAt && (
                <div className="mb-3">
                  <span className="text-sm text-gray-500">有効期限</span>
                  <p className="text-gray-900">
                    {new Date(paymentLink.expiresAt).toLocaleString()}
                  </p>
                </div>
              )}

              {/* テストモード表示 */}
              {paymentLink.userPaymentConfig.isTestMode && (
                <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-md p-3">
                  <p className="text-yellow-800 text-sm font-medium">⚠️ テストモード</p>
                  <p className="text-yellow-700 text-xs">この決済はテストです。</p>
                </div>
              )}
            </div>
          )}

          {/* よくある原因 */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 text-left">
            <h3 className="text-sm font-medium text-blue-800 mb-2">よくある失敗の原因</h3>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• カード番号、有効期限、セキュリティコードの入力ミス</li>
              <li>• カードの利用限度額超過</li>
              <li>• カードの有効期限切れ</li>
              <li>• 国際決済が無効になっている</li>
              <li>• ネットワーク接続の問題</li>
            </ul>
          </div>

          {/* アクションボタン */}
          <div className="space-y-3">
            {paymentLink && paymentLink.status === 'pending' && (
              <button
                onClick={handleRetryPayment}
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-md font-medium hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                もう一度決済する
              </button>
            )}

            <button
              onClick={() => window.close()}
              className="w-full bg-gray-100 text-gray-700 py-3 px-4 rounded-md font-medium hover:bg-gray-200 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
            >
              閉じる
            </button>
          </div>

          {/* サポート情報 */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <p className="text-xs text-gray-500">
              問題が解決しない場合は、<br />
              お気軽にお問い合わせください。
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}