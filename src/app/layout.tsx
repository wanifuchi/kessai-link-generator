import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'ユニバーサル決済リンクジェネレーター',
  description: '複数の決済サービスに対応した決済リンクを簡単に生成できるWebアプリケーション',
  keywords: 'Stripe, PayPal, Square, PayPay, fincode, 決済, リンク生成, ECサイト',
  authors: [{ name: 'Payment Link Generator Team' }],
  viewport: 'width=device-width, initial-scale=1',
  robots: 'index, follow',
  openGraph: {
    title: 'ユニバーサル決済リンクジェネレーター',
    description: '複数の決済サービスに対応した決済リンクを簡単に生成',
    type: 'website',
    locale: 'ja_JP',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ユニバーサル決済リンクジェネレーター',
    description: '複数の決済サービスに対応した決済リンクを簡単に生成',
  }
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ja" suppressHydrationWarning>
      <head>
        <meta charSet="utf-8" />
        <meta name="theme-color" content="#667eea" />
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
      </head>
      <body className={inter.className}>
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
          {/* Header */}
          <header className="bg-white shadow-sm border-b">
            <div className="container mx-auto px-4 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                    <svg 
                      className="w-5 h-5 text-white" 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <div>
                    <h1 className="text-xl font-bold text-gray-900">
                      決済リンクジェネレーター
                    </h1>
                    <p className="text-sm text-gray-600 hidden sm:block">
                      複数の決済サービスに対応
                    </p>
                  </div>
                </div>
                
                {/* Navigation */}
                <nav className="hidden md:flex items-center space-x-6">
                  <a href="/" className="text-gray-700 hover:text-primary transition-colors">
                    ホーム
                  </a>
                  <a href="/dashboard" className="text-gray-700 hover:text-primary transition-colors">
                    履歴
                  </a>
                  <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="text-gray-700 hover:text-primary transition-colors">
                    ヘルプ
                  </a>
                </nav>

                {/* Mobile menu button */}
                <button className="md:hidden p-2 rounded-md hover:bg-gray-100 transition-colors">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>
              </div>
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1">
            {children}
          </main>

          {/* Footer */}
          <footer className="bg-white border-t mt-12">
            <div className="container mx-auto px-4 py-8">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                <div className="col-span-1 md:col-span-2">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-purple-600 rounded"></div>
                    <span className="font-bold text-gray-900">決済リンクジェネレーター</span>
                  </div>
                  <p className="text-gray-600 text-sm mb-4">
                    複数の決済サービスに対応した決済リンクを簡単に生成できるWebアプリケーションです。
                    ECサイト運営者、フリーランス、小規模事業者の皆様をサポートします。
                  </p>
                  <div className="flex space-x-4">
                    <span className="text-xs text-gray-500">© 2024 Payment Link Generator</span>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">対応サービス</h3>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li>Stripe</li>
                    <li>PayPal</li>
                    <li>Square</li>
                    <li>PayPay</li>
                    <li>fincode by GMO</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">サポート</h3>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li>
                      <a href="#" className="hover:text-primary transition-colors">
                        利用ガイド
                      </a>
                    </li>
                    <li>
                      <a href="#" className="hover:text-primary transition-colors">
                        API仕様
                      </a>
                    </li>
                    <li>
                      <a href="#" className="hover:text-primary transition-colors">
                        プライバシーポリシー
                      </a>
                    </li>
                    <li>
                      <a href="#" className="hover:text-primary transition-colors">
                        利用規約
                      </a>
                    </li>
                  </ul>
                </div>
              </div>

              {/* Security Notice */}
              <div className="mt-8 pt-8 border-t border-gray-200">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex">
                    <svg className="flex-shrink-0 w-5 h-5 text-blue-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.314 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                    <div className="ml-3">
                      <p className="text-sm text-blue-700">
                        <strong>セキュリティについて:</strong> このアプリケーションはAPI認証情報を暗号化して安全に処理します。
                        認証情報はセッション中のみ保持され、サーバーに永続的に保存されることはありません。
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </footer>
        </div>
      </body>
    </html>
  )
}