'use client'

import { useSearchParams, useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function AuthError() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const error = searchParams.get('error')

  useEffect(() => {
    // エラーが発生した場合は3秒後にサインインページにリダイレクト
    const timer = setTimeout(() => {
      router.push('/auth/signin')
    }, 3000)

    return () => clearTimeout(timer)
  }, [router])

  const getErrorMessage = (error: string | null) => {
    switch (error) {
      case 'Configuration':
        return 'サーバーの設定に問題があります。'
      case 'AccessDenied':
        return 'アクセスが拒否されました。'
      case 'Verification':
        return 'トークンの検証に失敗しました。'
      case 'Callback':
        return '認証プロバイダーからの応答に問題がありました。'
      default:
        return '認証中にエラーが発生しました。'
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 text-red-600">
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            認証エラー
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            {getErrorMessage(error)}
          </p>
          <p className="mt-4 text-sm text-gray-500">
            3秒後に自動的にサインインページに戻ります...
          </p>
        </div>
        <div className="text-center">
          <button
            onClick={() => router.push('/auth/signin')}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            サインインページに戻る
          </button>
        </div>
      </div>
    </div>
  )
}