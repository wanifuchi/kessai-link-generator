'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/app/providers'
import Link from 'next/link'
import { User, LogOut, Menu, X } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function ClientNavigation() {
  const [mounted, setMounted] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { user, signOut } = useAuth()

  // クライアントサイドでのみ実行
  useEffect(() => {
    setMounted(true)
  }, [])

  // SSR時は基本的なナビゲーションのみ表示
  if (!mounted) {
    return (
      <>
        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-6">
        <Link href="/" className="text-gray-700 hover:text-primary transition-colors">
          ホーム
        </Link>
        <Link href="/insights" className="text-gray-700 hover:text-primary transition-colors">
          インサイト
        </Link>
        <Link href="/dashboard" className="text-gray-700 hover:text-primary transition-colors">
          履歴
        </Link>
          <Link href="/settings" className="text-gray-700 hover:text-primary transition-colors">
            API設定
          </Link>
          <Link href="/help" className="text-gray-700 hover:text-primary transition-colors">
            ヘルプ
          </Link>
        </nav>

        {/* Mobile menu button */}
        <button className="md:hidden p-2 rounded-md hover:bg-gray-100 transition-colors">
          <Menu className="w-6 h-6" />
        </button>
      </>
    )
  }

  const handleSignOut = async () => {
    try {
      await signOut()
    } catch (error) {
      console.error('ログアウトエラー:', error)
    }
  }

  return (
    <>
      {/* Desktop Navigation */}
      <nav className="hidden md:flex items-center space-x-6">
        <Link href="/" className="text-gray-700 hover:text-primary transition-colors">
          ホーム
        </Link>
        <Link href="/insights" className="text-gray-700 hover:text-primary transition-colors">
          インサイト
        </Link>
        {user && (
          <>
            <Link href="/dashboard" className="text-gray-700 hover:text-primary transition-colors">
              履歴
            </Link>
            <Link href="/settings" className="text-gray-700 hover:text-primary transition-colors">
              API設定
            </Link>
            <Link href="/create" className="text-gray-700 hover:text-primary transition-colors">
              作成
            </Link>
          </>
        )}
        <Link href="/help" className="text-gray-700 hover:text-primary transition-colors">
          ヘルプ
        </Link>
      </nav>

      {/* User Menu */}
      <div className="hidden md:flex items-center space-x-4">
        {user ? (
          <>
            {/* User Profile Button */}
            <Link
              href="/profile"
              className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                <User className="w-4 h-4 text-white" />
              </div>
              <span className="text-sm font-medium text-gray-700">
                {user.name || 'ユーザー'}
              </span>
            </Link>

            {/* Logout Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSignOut}
              className="flex items-center gap-1"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden lg:inline">ログアウト</span>
            </Button>
          </>
        ) : (
          <>
            <Link href="/auth/signin">
              <Button variant="ghost" size="sm">
                ログイン
              </Button>
            </Link>
            <Link href="/auth/signup">
              <Button size="sm">
                新規登録
              </Button>
            </Link>
          </>
        )}
      </div>

      {/* Mobile menu button */}
      <button
        className="md:hidden p-2 rounded-md hover:bg-gray-100 transition-colors"
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
      >
        {mobileMenuOpen ? (
          <X className="w-6 h-6" />
        ) : (
          <Menu className="w-6 h-6" />
        )}
      </button>

      {/* Mobile Navigation Menu */}
      {mobileMenuOpen && (
        <div className="absolute top-full left-0 right-0 bg-white shadow-lg border-t md:hidden">
          <div className="container mx-auto px-4 py-4">
            <nav className="space-y-4">
              <Link
                href="/"
              className="block text-gray-700 hover:text-primary transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              ホーム
            </Link>
            <Link
              href="/insights"
              className="block text-gray-700 hover:text-primary transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              インサイト
            </Link>
            {user && (
                <>
                  <Link
                    href="/dashboard"
                    className="block text-gray-700 hover:text-primary transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    履歴
                  </Link>
                  <Link
                    href="/settings"
                    className="block text-gray-700 hover:text-primary transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    API設定
                  </Link>
                  <Link
                    href="/create"
                    className="block text-gray-700 hover:text-primary transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    作成
                  </Link>
                  <Link
                    href="/profile"
                    className="block text-gray-700 hover:text-primary transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    プロフィール
                  </Link>
                </>
              )}
              <Link
                href="/help"
                className="block text-gray-700 hover:text-primary transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                ヘルプ
              </Link>

              {/* Mobile User Actions */}
              <div className="border-t pt-4 mt-4">
                {user ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                        <User className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">
                          {user.name || 'ユーザー'}
                        </p>
                        <p className="text-sm text-gray-500">{user.email}</p>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => {
                        handleSignOut()
                        setMobileMenuOpen(false)
                      }}
                      className="w-full justify-start"
                    >
                      <LogOut className="w-4 h-4 mr-2" />
                      ログアウト
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Link href="/auth/signin" onClick={() => setMobileMenuOpen(false)}>
                      <Button variant="ghost" className="w-full justify-start">
                        ログイン
                      </Button>
                    </Link>
                    <Link href="/auth/signup" onClick={() => setMobileMenuOpen(false)}>
                      <Button className="w-full justify-start">
                        新規登録
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
            </nav>
          </div>
        </div>
      )}
    </>
  )
}
