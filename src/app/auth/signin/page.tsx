'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/app/providers'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { signIn } from 'next-auth/react'

// SSRを無効化
export const dynamic = 'force-dynamic'

export default function SignInPage() {
  // デバッグのため、シンプルなテストコンポーネントを表示
  return (
    <div className="flex items-start justify-center pt-24 px-4">
      <div className="w-full max-w-sm">
        <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-white/20 shadow-xl px-5 py-4">
          <div className="text-center mb-4">
            <h1 className="text-lg font-medium text-slate-800">
              ログイン（デバッグ中）
            </h1>
            <p className="text-sm text-slate-600 mt-1">
              認証フォームのテスト表示
            </p>
          </div>
          <div className="space-y-3">
            <input
              type="email"
              placeholder="メールアドレス"
              className="w-full px-3 py-2.5 border border-slate-200 rounded-lg"
            />
            <input
              type="password"
              placeholder="パスワード"
              className="w-full px-3 py-2.5 border border-slate-200 rounded-lg"
            />
            <button className="w-full py-2.5 px-4 bg-blue-600 text-white rounded-lg">
              ログイン
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// 元のコンポーネントは一時的にコメントアウト

function SignInForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)

  const { user, loading } = useAuth()
  const router = useRouter()

  // 既にログイン済みの場合はダッシュボードへリダイレクト（デバッグのため一時的に無効化）
  // useEffect(() => {
  //   if (!loading && user) {
  //     router.push('/dashboard')
  //   }
  // }, [user, loading, router])

  // デバッグのためloading状態を一時的にスキップ
  // if (loading) {
  //   return (
  //     <div className="flex items-center justify-center px-4 min-h-96">
  //       <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
  //     </div>
  //   )
  // }

  // if (user) {
  //   return null // リダイレクト中
  // }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      const response = await fetch('/api/auth/signin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email.trim(),
          password: password,
        }),
      })

      const result = await response.json()

      if (response.ok && result.success) {
        // ログイン成功時はページをリロードして認証状態を反映
        window.location.href = '/dashboard'
      } else {
        const errorMessage = result.error || 'ログインに失敗しました'
        if (errorMessage.includes('Invalid credentials') || errorMessage.includes('password')) {
          setError('メールアドレスまたはパスワードが正しくありません')
        } else if (errorMessage.includes('not found') || errorMessage.includes('存在しません')) {
          setError('このメールアドレスは登録されていません')
        } else {
          setError('ログインに失敗しました')
        }
      }
    } catch (err: any) {
      console.error('サインインエラー:', err)
      setError('エラーが発生しました')
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    setError('')
    setIsGoogleLoading(true)

    try {
      const result = await signIn('google', {
        callbackUrl: '/dashboard',
        redirect: false
      })

      if (result?.error) {
        setError('Googleログインに失敗しました')
      } else if (result?.url) {
        window.location.href = result.url
      }
    } catch (err) {
      console.error('Google sign in error:', err)
      setError('Googleログインでエラーが発生しました')
    } finally {
      setIsGoogleLoading(false)
    }
  }

  return (
    <div className="flex items-start justify-center pt-24 px-4">
      <div className="w-full max-w-sm">
        <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-white/20 shadow-xl px-5 py-4">
          <div className="text-center mb-4">
            <h1 className="text-lg font-medium text-slate-800">
              ログイン
            </h1>
            <p className="text-sm text-slate-600 mt-1">
              決済リンクサービスにアクセス
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label htmlFor="email" className="block text-xs font-medium text-slate-600 mb-1.5">
                メールアドレス
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white/50"
                placeholder="email@example.com"
                disabled={isLoading}
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="password" className="block text-xs font-medium text-slate-600">
                  パスワード
                </label>
                <span className="text-xs text-gray-400 cursor-not-allowed">
                  パスワードを忘れた？（準備中）
                </span>
              </div>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white/50"
                placeholder="パスワード"
                disabled={isLoading}
              />
            </div>

            {error && (
              <div className="p-2.5 bg-red-50 text-red-700 border border-red-200 rounded-lg text-xs">
                {error}
                {error.includes('登録されていません') && (
                  <div className="mt-1.5">
                    <Link href="/auth/signup" className="underline font-medium">
                      新規登録ページへ
                    </Link>
                  </div>
                )}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading || isGoogleLoading}
              className="w-full py-2.5 px-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white text-sm font-medium rounded-lg hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm"
            >
              {isLoading ? 'ログイン中...' : 'ログイン'}
            </button>
          </form>

          {/* 区切り線 */}
          <div className="relative mt-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white/80 px-2 text-gray-500">または</span>
            </div>
          </div>

          {/* Googleログインボタン */}
          <button
            onClick={handleGoogleSignIn}
            disabled={isLoading || isGoogleLoading}
            className="mt-3 w-full flex items-center justify-center px-4 py-2.5 border border-gray-200 rounded-lg shadow-sm bg-white hover:bg-gray-50 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
          >
            <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            <span className="text-sm font-medium text-gray-700">
              {isGoogleLoading ? 'Google認証中...' : 'Googleでログイン'}
            </span>
          </button>

          <div className="mt-4 text-center text-xs text-slate-500">
            アカウントをお持ちでない方は{' '}
            <Link href="/auth/signup" className="text-blue-600 hover:text-blue-700 font-medium">
              新規登録
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}