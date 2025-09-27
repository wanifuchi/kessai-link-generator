'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js'
import { PaymentLinkDetails, PaymentPageState } from '@/types/payment'

// Stripe Elements のスタイル設定
const cardElementOptions = {
  style: {
    base: {
      fontSize: '16px',
      color: '#374151',
      '::placeholder': {
        color: '#9CA3AF',
      },
      fontFamily: 'ui-sans-serif, system-ui, sans-serif',
    },
    invalid: {
      color: '#EF4444',
    },
  },
  hidePostalCode: true,
}

function PaymentForm({ paymentLink }: { paymentLink: PaymentLinkDetails }) {
  const stripe = useStripe()
  const elements = useElements()
  const router = useRouter()
  const [state, setState] = useState<PaymentPageState>({
    loading: false,
  })

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()

    if (!stripe || !elements) {
      return
    }

    setState(prev => ({ ...prev, loading: true, error: undefined }))

    try {
      // Payment Intent を作成または取得
      const response = await fetch('/api/payment-intents', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          linkId: paymentLink.id,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Payment Intentの作成に失敗しました')
      }

      const { clientSecret } = await response.json()

      // カード情報を取得
      const cardElement = elements.getElement(CardElement)
      if (!cardElement) {
        throw new Error('カード情報の取得に失敗しました')
      }

      // 決済を実行
      const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: cardElement,
        },
      })

      if (error) {
        setState(prev => ({
          ...prev,
          error: error.message || '決済処理中にエラーが発生しました',
          loading: false,
        }))
      } else if (paymentIntent && paymentIntent.status === 'succeeded') {
        // 決済成功 - 成功ページにリダイレクト
        router.push(`/pay/${paymentLink.id}/success?payment_intent=${paymentIntent.id}`)
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : '決済処理中にエラーが発生しました',
        loading: false,
      }))
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* カード情報入力 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          カード情報
        </label>
        <div className="p-3 border border-gray-300 rounded-md bg-white">
          <CardElement options={cardElementOptions} />
        </div>
      </div>

      {/* エラーメッセージ */}
      {state.error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-red-800 text-sm">{state.error}</p>
        </div>
      )}

      {/* 決済ボタン */}
      <button
        type="submit"
        disabled={!stripe || state.loading}
        className="w-full bg-blue-600 text-white py-3 px-4 rounded-md font-medium hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {state.loading ? '処理中...' : `${paymentLink.amount.toLocaleString()} ${paymentLink.currency.toUpperCase()} を決済`}
      </button>

      {/* セキュリティ情報 */}
      <div className="text-xs text-gray-500 text-center">
        <p>🔒 この決済はSSL暗号化により保護されています</p>
        <p>カード情報は安全に処理され、当サイトには保存されません</p>
      </div>
    </form>
  )
}

export default function PaymentPage() {
  const params = useParams()
  const linkId = params.linkId as string

  const [paymentLink, setPaymentLink] = useState<PaymentLinkDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [stripePromise, setStripePromise] = useState<Promise<any> | null>(null)

  useEffect(() => {
    const fetchPaymentLink = async () => {
      try {
        const response = await fetch(`/api/payment-links/${linkId}`)

        if (!response.ok) {
          if (response.status === 404) {
            setError('決済リンクが見つかりません')
          } else if (response.status === 400) {
            const errorData = await response.json()
            setError(errorData.error || '決済リンクが無効です')
          } else {
            setError('決済リンクの取得に失敗しました')
          }
          return
        }

        const data: PaymentLinkDetails = await response.json()
        setPaymentLink(data)

        // Stripe公開キーを取得してStripeを初期化
        const configResponse = await fetch(`/api/payment-configs/${data.userPaymentConfigId}/public-key`)
        if (configResponse.ok) {
          const { publishableKey } = await configResponse.json()
          setStripePromise(loadStripe(publishableKey))
        } else {
          setError('決済設定の取得に失敗しました')
        }

      } catch (error) {
        console.error('決済リンク取得エラー:', error)
        setError('決済リンクの取得に失敗しました')
      } finally {
        setLoading(false)
      }
    }

    if (linkId) {
      fetchPaymentLink()
    }
  }, [linkId])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">決済情報を読み込み中...</p>
        </div>
      </div>
    )
  }

  if (error || !paymentLink) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="max-w-md mx-auto text-center">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h1 className="text-lg font-semibold text-red-800 mb-2">エラー</h1>
            <p className="text-red-700">{error}</p>
            <button
              onClick={() => window.history.back()}
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
            >
              戻る
            </button>
          </div>
        </div>
      </div>
    )
  }

  // 有効期限チェック
  const isExpired = paymentLink.expiresAt && new Date(paymentLink.expiresAt) < new Date()
  if (isExpired) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="max-w-md mx-auto text-center">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
            <h1 className="text-lg font-semibold text-yellow-800 mb-2">有効期限切れ</h1>
            <p className="text-yellow-700">この決済リンクの有効期限が切れています。</p>
          </div>
        </div>
      </div>
    )
  }

  // 決済済みチェック
  if (paymentLink.status !== 'pending') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="max-w-md mx-auto text-center">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h1 className="text-lg font-semibold text-blue-800 mb-2">決済済み</h1>
            <p className="text-blue-700">この決済は既に処理されています。</p>
          </div>
        </div>
      </div>
    )
  }

  if (!stripePromise) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">決済システムを初期化中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-md mx-auto">
        {/* 決済情報表示 */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">決済情報</h1>

          {paymentLink.description && (
            <p className="text-gray-600 mb-4">{paymentLink.description}</p>
          )}

          <div className="border-t pt-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-gray-600">金額</span>
              <span className="text-2xl font-bold text-gray-900">
                {paymentLink.amount.toLocaleString()} {paymentLink.currency.toUpperCase()}
              </span>
            </div>

            {paymentLink.expiresAt && (
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500">有効期限</span>
                <span className="text-gray-700">
                  {new Date(paymentLink.expiresAt).toLocaleString()}
                </span>
              </div>
            )}
          </div>

          {/* テストモード表示 */}
          {paymentLink.userPaymentConfig.isTestMode && (
            <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-md p-3">
              <p className="text-yellow-800 text-sm font-medium">⚠️ テストモード</p>
              <p className="text-yellow-700 text-xs">実際の決済は行われません</p>
            </div>
          )}
        </div>

        {/* 決済フォーム */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">お支払い方法</h2>

          <Elements stripe={stripePromise}>
            <PaymentForm paymentLink={paymentLink} />
          </Elements>
        </div>
      </div>
    </div>
  )
}