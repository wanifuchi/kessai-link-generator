'use client'

import { useState, useEffect } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import { PaymentLinkDetails } from '@/types/payment'

export default function PaymentSuccessPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const linkId = params.linkId as string
  const paymentIntentId = searchParams.get('payment_intent')

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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">決済情報を確認中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-green-50 flex items-center justify-center py-8">
      <div className="max-w-md mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          {/* 成功アイコン */}
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg
              className="w-8 h-8 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>

          {/* 成功メッセージ */}
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            決済が完了しました！
          </h1>
          <p className="text-gray-600 mb-8">
            お支払いありがとうございます。決済が正常に処理されました。
          </p>

          {/* 決済詳細 */}
          {paymentLink && (
            <div className="bg-gray-50 rounded-lg p-6 mb-6 text-left">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">決済詳細</h2>

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

              <div className="mb-3">
                <span className="text-sm text-gray-500">決済日時</span>
                <p className="text-gray-900">
                  {paymentLink.completedAt
                    ? new Date(paymentLink.completedAt).toLocaleString()
                    : new Date().toLocaleString()
                  }
                </p>
              </div>

              {paymentIntentId && (
                <div className="mb-3">
                  <span className="text-sm text-gray-500">取引ID</span>
                  <p className="text-xs text-gray-700 font-mono break-all">
                    {paymentIntentId}
                  </p>
                </div>
              )}

              {/* テストモード表示 */}
              {paymentLink.userPaymentConfig.isTestMode && (
                <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-md p-3">
                  <p className="text-yellow-800 text-sm font-medium">⚠️ テストモード</p>
                  <p className="text-yellow-700 text-xs">この決済はテストです。実際の請求は発生しません。</p>
                </div>
              )}
            </div>
          )}

          {/* アクションボタン */}
          <div className="space-y-3">
            <button
              onClick={() => window.print()}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-md font-medium hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              領収書を印刷
            </button>

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
              ご質問やお困りのことがございましたら、<br />
              お気軽にお問い合わせください。
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}