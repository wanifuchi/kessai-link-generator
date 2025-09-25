'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/app/providers'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

// SSRを無効化
export const dynamic = 'force-dynamic'

export default function ForgotPasswordPage() {
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

  return <ForgotPasswordForm />
}

function ForgotPasswordForm() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [info, setInfo] = useState('')

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
      // TODO: パスワードリセット機能の実装
      // 現在は機能を一時無効化
      console.log('🔥 パスワードリセット（準備中）:', { email })

      // 一時的な模擬応答
      setTimeout(() => {
        setInfo('パスワードリセット機能は現在準備中です。しばらく後に再度お試しください。')
        setIsLoading(false)
      }, 1000)

      return
    } catch (err: any) {
      console.error('🔥 パスワードリセット例外:', err)
      setError(`エラーが発生しました: ${err.message || 'Unknown error'}`)
      setIsLoading(false)
    }
  }

  return (
    <main className="min-h-screen flex items-start justify-center pt-24 px-4 bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="w-full max-w-sm">
        <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-white/20 shadow-xl px-5 py-4">
          <div className="text-center mb-4">
            <h1 className="text-lg font-medium text-slate-800">
              パスワードリセット
            </h1>
            <p className="text-sm text-slate-600 mt-1">
              登録したメールアドレスを入力してください
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

            {(error || info) && (
              <div className={`p-2.5 rounded-lg text-xs ${info ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                {error || info}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 px-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white text-sm font-medium rounded-lg hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm"
            >
              {isLoading ? 'メール送信中...' : 'パスワードリセットメールを送信'}
            </button>
          </form>

          <div className="mt-4 text-center text-xs text-slate-500 space-y-2">
            <div>
              <Link href="/auth/signin" className="text-blue-600 hover:text-blue-700 font-medium">
                ログインページに戻る
              </Link>
            </div>
            <div>
              アカウントをお持ちでない方は{' '}
              <Link href="/auth/signup" className="text-blue-600 hover:text-blue-700 font-medium">
                新規登録
              </Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}