import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import ErrorBoundary from '@/components/error-boundary'
import { Toaster } from '@/components/ui/toaster'
import Footer from '@/components/Footer'
import { Providers } from './providers'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'ユニバーサル決済リンクジェネレーター',
  description: '複数の決済サービスに対応した決済リンクを簡単に生成できるWebアプリケーション',
  keywords: 'Stripe, PayPal, Square, PayPay, fincode, 決済, リンク生成, ECサイト',
  authors: [{ name: 'Payment Link Generator Team' }],
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

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
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
        <Providers>
          <ErrorBoundary>
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

                  {/* Static Navigation - Temporary for build fix */}
                  <nav className="hidden md:flex items-center space-x-6">
                    <a href="/" className="text-gray-700 hover:text-primary transition-colors">
                      ホーム
                    </a>
                    <a href="/dashboard" className="text-gray-700 hover:text-primary transition-colors">
                      履歴
                    </a>
                    <a href="/settings" className="text-gray-700 hover:text-primary transition-colors">
                      API設定
                    </a>
                    <a href="/profile" className="text-gray-700 hover:text-primary transition-colors">
                      プロフィール
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
            <Footer />
          </div>
          <Toaster />
        </ErrorBoundary>
        </Providers>
      </body>
    </html>
  )
}