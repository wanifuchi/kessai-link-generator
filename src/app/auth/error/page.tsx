'use client'

import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

function ErrorContent() {
  const searchParams = useSearchParams()
  const error = searchParams.get('error')
  const errorDescription = searchParams.get('error_description')

  const getErrorMessage = (error: string | null) => {
    switch (error) {
      case 'Configuration':
        return 'NextAuth.js設定に問題があります'
      case 'AccessDenied':
        return 'アクセスが拒否されました'
      case 'Verification':
        return 'メール認証に失敗しました'
      case 'OAuthSignin':
        return 'OAuth認証の開始に失敗しました'
      case 'OAuthCallback':
        return 'OAuth認証のコールバックに失敗しました'
      case 'OAuthCreateAccount':
        return 'OAuthアカウントの作成に失敗しました'
      case 'EmailCreateAccount':
        return 'メールアカウントの作成に失敗しました'
      case 'Callback':
        return 'コールバック処理に失敗しました'
      case 'OAuthAccountNotLinked':
        return 'OAuthアカウントがリンクされていません。同じメールアドレスで既存のアカウントがある可能性があります。'
      case 'EmailSignin':
        return 'メール認証に失敗しました'
      case 'CredentialsSignin':
        return '認証情報が正しくありません'
      case 'SessionRequired':
        return 'セッションが必要です'
      default:
        return error || '不明なエラーが発生しました'
    }
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
                d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>

          {/* エラーメッセージ */}
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            認証エラー
          </h1>
          <p className="text-gray-600 mb-6">
            {getErrorMessage(error)}
          </p>

          {/* 詳細情報 */}
          {(error || errorDescription) && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6 text-left">
              <h3 className="text-sm font-medium text-gray-800 mb-2">詳細情報</h3>
              {error && (
                <div className="mb-2">
                  <span className="text-xs text-gray-500">エラーコード:</span>
                  <p className="text-sm text-gray-700 font-mono">{error}</p>
                </div>
              )}
              {errorDescription && (
                <div>
                  <span className="text-xs text-gray-500">詳細:</span>
                  <p className="text-sm text-gray-700">{errorDescription}</p>
                </div>
              )}
            </div>
          )}

          {/* デバッグ情報 */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 text-left">
            <h3 className="text-sm font-medium text-blue-800 mb-2">デバッグ情報</h3>
            <div className="text-xs text-blue-700 space-y-1">
              <div>URL: {typeof window !== 'undefined' ? window.location.href : 'N/A'}</div>
              <div>Timestamp: {new Date().toISOString()}</div>
              <div>User Agent: {typeof window !== 'undefined' ? navigator.userAgent.substring(0, 50) + '...' : 'N/A'}</div>
            </div>
          </div>

          {/* アクションボタン */}
          <div className="space-y-3">
            <button
              onClick={() => window.location.href = '/auth/signin'}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-md font-medium hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              再度ログインを試行
            </button>

            <button
              onClick={() => window.location.href = '/'}
              className="w-full bg-gray-100 text-gray-700 py-3 px-4 rounded-md font-medium hover:bg-gray-200 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
            >
              ホームに戻る
            </button>
          </div>

          {/* サポート情報 */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <p className="text-xs text-gray-500">
              問題が解決しない場合は、この画面のスクリーンショットと共に<br />
              サポートまでお問い合わせください。
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function AuthErrorPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ErrorContent />
    </Suspense>
  )
}