'use client'

import Link from 'next/link'
import { CheckCircle } from 'lucide-react'

// SSRを無効化
export const dynamic = 'force-dynamic'

export default function EmailVerifiedPage() {
  return (
    <main className="min-h-screen flex items-start justify-center pt-24 px-4 bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="w-full max-w-sm">
        <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-white/20 shadow-xl px-5 py-6">
          <div className="text-center">
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-emerald-100 rounded-full">
                <CheckCircle className="h-8 w-8 text-emerald-600" />
              </div>
            </div>

            <h1 className="text-lg font-medium text-slate-800 mb-2">
              メール認証完了
            </h1>

            <p className="text-sm text-slate-600 mb-6">
              アカウントの作成が完了しました。<br />
              決済リンクサービスをご利用いただけます。
            </p>

            <Link
              href="/dashboard"
              className="inline-block w-full py-2.5 px-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white text-sm font-medium rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-sm text-center"
            >
              ダッシュボードへ
            </Link>

            <div className="mt-4 text-center text-xs text-slate-500">
              <Link href="/" className="text-blue-600 hover:text-blue-700 font-medium">
                ホームページに戻る
              </Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}