'use client'

import { useState, useEffect } from 'react'
import { useStackApp, useUser } from '@stackframe/stack'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

// SSRを無効化
export const dynamic = 'force-dynamic'

export default function SignUpPage() {
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

  return <SignUpForm />
}

function SignUpForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [info, setInfo] = useState('')

  const app = useStackApp()
  const user = useUser()
  const router = useRouter()

  // 既にログイン済みの場合はダッシュボードへリダイレクト
  if (user) {
    router.push('/dashboard')
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (password.length < 8) {
      setError('パスワードは8文字以上で設定してください')
      return
    }

    setIsLoading(true)

    try {
      const origin = typeof window !== 'undefined' ? window.location.origin : ''
      console.log('🔥 サインアップ開始:', { email, origin })

      // より基本的なサインアップ設定に変更
      const result = await app.signUpWithCredential({
        email,
        password,
      })

      console.log('🔥 サインアップ結果:', result)

      if (result.status === 'ok') {
        setInfo('確認メールを送信しました。メール内のリンクをクリックして認証を完了してください。')
      } else {
        console.error('🔥 サインアップエラー:', result.error)
        const errorMessage = result.error?.message || '登録に失敗しました'
        console.log('🔥 エラーメッセージ:', errorMessage)

        if (errorMessage.includes('already exists') || errorMessage.includes('存在')) {
          setError('このメールアドレスは既に登録されています')
        } else if (errorMessage.includes('invalid') || errorMessage.includes('email')) {
          setError('有効なメールアドレスを入力してください')
        } else {
          setError(`登録に失敗しました: ${errorMessage}`)
        }
      }
    } catch (err: any) {
      console.error('🔥 サインアップ例外:', err)
      setError(`エラーが発生しました: ${err.message || 'Unknown error'}`)
    } finally {
      setIsLoading(false)
    }
  }

  const handleOAuthSignUp = async () => {
    setError('')
    setIsLoading(true)

    try {
      await app.signInWithOAuth('google')
    } catch (err: any) {
      setIsLoading(false)
      setError('Googleログインに失敗しました')
    }
  }

  return (
    <main className="min-h-screen flex items-start justify-center pt-24 px-4 bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="w-full max-w-sm">
        <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-white/20 shadow-xl px-5 py-4">
          <div className="text-center mb-4">
            <h1 className="text-lg font-medium text-slate-800">
              アカウント作成
            </h1>
            <p className="text-sm text-slate-600 mt-1">
              決済リンクサービスを始める
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
              <label htmlFor="password" className="block text-xs font-medium text-slate-600 mb-1.5">
                パスワード
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
              />
            </div>

            {(error || info) && (
              <div className={`p-2.5 rounded-lg text-xs ${info ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                {error || info}
                {error.includes('既に登録されています') && (
                  <div className="mt-1.5">
                    <Link href="/auth/signin" className="underline font-medium">
                      ログインページへ
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
              {isLoading ? '登録中...' : 'アカウント作成'}
            </button>
          </form>

          <div className="mt-4">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200"></div>
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="px-2 bg-white text-slate-400">または</span>
              </div>
            </div>

            <button
              onClick={handleOAuthSignUp}
              disabled={isLoading}
              className="w-full mt-3 py-2.5 px-4 border border-slate-200 rounded-lg bg-white/70 text-slate-700 text-sm font-medium hover:bg-white hover:border-slate-300 disabled:opacity-50 transition-all duration-200 shadow-sm"
            >
              Googleで登録
            </button>
          </div>

          <div className="mt-4 text-center text-xs text-slate-500">
            既にアカウントをお持ちの方は{' '}
            <Link href="/auth/signin" className="text-blue-600 hover:text-blue-700 font-medium">
              ログイン
            </Link>
          </div>
        </div>
      </div>
    </main>
  )
}