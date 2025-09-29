'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/app/providers'

// SSRを無効化
export const dynamic = 'force-dynamic'

export default function ResetPasswordPage() {
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

  return <ResetPasswordForm />
}

function ResetPasswordForm() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [tokenValid, setTokenValid] = useState<boolean | null>(null)

  const searchParams = useSearchParams()
  const router = useRouter()
  const { user, loading } = useAuth()

  const token = searchParams.get('token')

  // 既にログイン済みの場合はダッシュボードへリダイレクト
  useEffect(() => {
    if (!loading && user) {
      router.push('/dashboard')
      return
    }

    // トークンが必要
    if (!token) {
      setError('無効なリセットリンクです')
      setTokenValid(false)
      return
    }

    // トークンの検証
    validateToken()
  }, [user, loading, router, token])

  const validateToken = async () => {
    if (!token) return

    try {
      const response = await fetch('/api/auth/validate-reset-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token })
      })

      const data = await response.json()

      if (data.success) {
        setTokenValid(true)
      } else {
        setTokenValid(false)
        setError(data.error || '無効または期限切れのトークンです')
      }
    } catch (error) {
      console.error('トークン検証エラー:', error)
      setTokenValid(false)
      setError('トークンの検証に失敗しました')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    // バリデーション
    if (password.length < 8) {
      setError('パスワードは8文字以上で入力してください')
      setIsLoading(false)
      return
    }

    if (password !== confirmPassword) {
      setError('パスワードが一致しません')
      setIsLoading(false)
      return
    }

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
          newPassword: password
        })
      })

      const data = await response.json()

      if (data.success) {
        setSuccess(true)
        // 3秒後にログインページへリダイレクト
        setTimeout(() => {
          router.push('/auth/signin?message=password-reset-success')
        }, 3000)
      } else {
        setError(data.error || 'パスワードのリセットに失敗しました')
      }
    } catch (error) {
      console.error('パスワードリセットエラー:', error)
      setError('パスワードのリセットに失敗しました')
    } finally {
      setIsLoading(false)
    }
  }

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

  if (tokenValid === false) {
    return (
      <main className="min-h-screen flex items-start justify-center pt-24 px-4 bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="w-full max-w-sm">
          <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-white/20 shadow-xl px-5 py-4">
            <div className="text-center mb-4">
              <div className="text-red-500 text-4xl mb-3">❌</div>
              <h1 className="text-lg font-medium text-slate-800">
                無効なリンク
              </h1>
              <p className="text-sm text-slate-600 mt-1">
                パスワードリセットリンクが無効または期限切れです
              </p>
            </div>

            {error && (
              <div className="p-2.5 rounded-lg text-xs bg-red-50 text-red-700 border border-red-200 mb-4">
                {error}
              </div>
            )}

            <div className="text-center text-xs text-slate-500 space-y-2">
              <div>
                <Link href="/auth/forgot-password" className="text-blue-600 hover:text-blue-700 font-medium">
                  新しいリセットリンクを送信
                </Link>
              </div>
              <div>
                <Link href="/auth/signin" className="text-blue-600 hover:text-blue-700 font-medium">
                  ログインページに戻る
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>
    )
  }

  if (success) {
    return (
      <main className="min-h-screen flex items-start justify-center pt-24 px-4 bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="w-full max-w-sm">
          <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-white/20 shadow-xl px-5 py-4">
            <div className="text-center mb-4">
              <div className="text-green-500 text-4xl mb-3">✅</div>
              <h1 className="text-lg font-medium text-slate-800">
                パスワードリセット完了
              </h1>
              <p className="text-sm text-slate-600 mt-1">
                新しいパスワードが設定されました
              </p>
            </div>

            <div className="p-2.5 rounded-lg text-xs bg-emerald-50 text-emerald-700 border border-emerald-200 mb-4">
              まもなくログインページにリダイレクトします...
            </div>

            <div className="text-center text-xs text-slate-500">
              <Link href="/auth/signin" className="text-blue-600 hover:text-blue-700 font-medium">
                すぐにログインページへ移動
              </Link>
            </div>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen flex items-start justify-center pt-24 px-4 bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="w-full max-w-sm">
        <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-white/20 shadow-xl px-5 py-4">
          <div className="text-center mb-4">
            <h1 className="text-lg font-medium text-slate-800">
              新しいパスワードを設定
            </h1>
            <p className="text-sm text-slate-600 mt-1">
              新しいパスワードを入力してください
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label htmlFor="password" className="block text-xs font-medium text-slate-600 mb-1.5">
                新しいパスワード
              </label>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white/50"
                placeholder="8文字以上"
                disabled={isLoading}
                minLength={8}
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-xs font-medium text-slate-600 mb-1.5">
                パスワード確認
              </label>
              <input
                id="confirmPassword"
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-3 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white/50"
                placeholder="パスワードを再入力"
                disabled={isLoading}
                minLength={8}
              />
            </div>

            {error && (
              <div className="p-2.5 rounded-lg text-xs bg-red-50 text-red-700 border border-red-200">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading || tokenValid !== true}
              className="w-full py-2.5 px-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white text-sm font-medium rounded-lg hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm"
            >
              {isLoading ? 'パスワード更新中...' : 'パスワードを更新'}
            </button>
          </form>

          <div className="mt-4 text-center text-xs text-slate-500">
            <Link href="/auth/signin" className="text-blue-600 hover:text-blue-700 font-medium">
              ログインページに戻る
            </Link>
          </div>
        </div>
      </div>
    </main>
  )
}