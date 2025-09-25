'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/app/providers'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

// SSRを無効化
export const dynamic = 'force-dynamic'

export default function SignInPage() {
  const [mounted, setMounted] = useState(false)

  // クライアントサイドでのみ実行
  useEffect(() => {
    setMounted(true)
  }, [])

  // SSR時は何も表示しない
  if (!mounted) {
    return (
      <main className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </main>
    )
  }

  return <SignInForm />
}

function SignInForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const { user, loading } = useAuth()
  const router = useRouter()

  // 既にログイン済みの場合はダッシュボードへリダイレクト
  useEffect(() => {
    if (!loading && user) {
      router.push('/dashboard')
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </main>
    )
  }

  if (user) {
    return null // リダイレクト中
  }

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

  return (
    <main className="min-h-screen flex items-start justify-center pt-24 px-4 bg-gradient-to-br from-slate-50 to-blue-50">
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
              disabled={isLoading}
              className="w-full py-2.5 px-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white text-sm font-medium rounded-lg hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm"
            >
              {isLoading ? 'ログイン中...' : 'ログイン'}
            </button>
          </form>

          <div className="mt-4 text-center text-xs text-slate-500">
            アカウントをお持ちでない方は{' '}
            <Link href="/auth/signup" className="text-blue-600 hover:text-blue-700 font-medium">
              新規登録
            </Link>
          </div>
        </div>
      </div>
    </main>
  )
}