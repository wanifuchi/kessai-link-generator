'use client'

import { signOut, useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function SignOut() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [isSigningOut, setIsSigningOut] = useState(false)

  const handleSignOut = async () => {
    setIsSigningOut(true)
    try {
      // まずセッションを手動削除
      try {
        const clearResponse = await fetch('/api/auth/clear-session', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include' // Cookieを確実に送信
        })
        const clearResult = await clearResponse.json()
        console.log('Session clear result:', clearResult)

        // 手動削除が成功したかどうかを確認
        if (clearResult.success && clearResult.deletedCount > 0) {
          console.log('Sessions manually deleted:', clearResult.deletedCount)
        } else {
          console.warn('Manual session deletion may have failed:', clearResult)
        }
      } catch (clearError) {
        console.warn('Manual session clear failed:', clearError)
      }

      // NextAuth の signOut を実行
      await signOut({
        callbackUrl: '/auth/signin',
        redirect: true
      })
    } catch (error) {
      console.error('Sign out error:', error)
      // エラーが発生してもサインインページにリダイレクト
      window.location.href = '/auth/signin'
    }
  }

  // ローディング中
  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">読み込み中...</p>
        </div>
      </div>
    )
  }

  // セッションが無い場合はサインインページへ
  if (!session) {
    router.push('/auth/signin')
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">リダイレクト中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 text-blue-600">
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            ログアウト
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            {session.user?.name || session.user?.email} としてログインしています
          </p>
          <p className="mt-2 text-sm text-gray-500">
            本当にログアウトしますか？
          </p>
        </div>
        <div className="space-y-4">
          <button
            onClick={handleSignOut}
            disabled={isSigningOut}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
          >
            {isSigningOut ? 'ログアウト中...' : 'ログアウト'}
          </button>
          <button
            onClick={() => router.push('/dashboard')}
            className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            ダッシュボードに戻る
          </button>
        </div>
      </div>
    </div>
  )
}