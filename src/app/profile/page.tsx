'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/app/providers'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  User,
  Shield,
  Settings,
  Database,
  LogOut,
  Mail,
  Calendar,
  CheckCircle,
  XCircle,
  AlertTriangle,
  ExternalLink,
  Trash2,
  Download,
  Key,
  Clock
} from 'lucide-react'

// SSRを無効化
export const dynamic = 'force-dynamic'

export default function ProfilePage() {
  const [mounted, setMounted] = useState(false)

  const router = useRouter()

  // クライアントサイドでのみ実行
  useEffect(() => {
    setMounted(true)
  }, [])

  // SSR時は何も表示しない
  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  return <ProfileContent />
}

function ProfileContent() {
  const { user, loading, signOut } = useAuth()
  const router = useRouter()
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/signin')
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  if (!user) {
    return null // リダイレクト中
  }

  const handleSignOut = async () => {
    setIsLoggingOut(true)
    try {
      await signOut()
    } catch (error) {
      console.error('ログアウトエラー:', error)
      setIsLoggingOut(false)
    }
  }

  const handleDeleteAccount = async () => {
    // TODO: アカウント削除機能の実装
    alert('アカウント削除機能は現在準備中です')
    setShowDeleteConfirm(false)
  }

  const formatDate = (date: string) => {
    return new Intl.DateTimeFormat('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(date))
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">アカウント管理</h1>
          <p className="text-gray-600">個人情報とセキュリティ設定を管理できます</p>
        </div>

        {/* 階層型Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* 👤 基本情報セクション */}
          <Card className="h-fit">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                基本情報
              </CardTitle>
              <CardDescription>アカウントの基本的な情報</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* プロフィール画像 */}
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                  <User className="w-8 h-8 text-white" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">
                    {user.name || 'ユーザー名未設定'}
                  </p>
                  <p className="text-sm text-gray-500">ID: {user.id}</p>
                </div>
              </div>

              {/* メール情報 */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-gray-500" />
                  <span className="text-sm font-medium">メールアドレス</span>
                </div>
                <div className="pl-6 space-y-1">
                  <p className="text-gray-900">{user.email}</p>
                  <Badge variant="default" className="text-xs">
                    <CheckCircle className="w-3 h-3 mr-1" />認証済み
                  </Badge>
                </div>
              </div>

              {/* 登録日時 */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-gray-500" />
                  <span className="text-sm font-medium">登録日時</span>
                </div>
                <p className="pl-6 text-gray-900">{formatDate(user.createdAt)}</p>
              </div>
            </CardContent>
          </Card>

          {/* 🔐 セキュリティセクション */}
          <Card className="h-fit">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                セキュリティ
              </CardTitle>
              <CardDescription>アカウントのセキュリティ状況</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* パスワード設定状況 */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Key className="w-4 h-4 text-gray-500" />
                  <span className="text-sm font-medium">パスワード</span>
                </div>
                <div className="pl-6">
                  <Badge variant="default">
                    <CheckCircle className="w-3 h-3 mr-1" />設定済み
                  </Badge>
                </div>
              </div>

              {/* 認証方法 */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-gray-500" />
                  <span className="text-sm font-medium">認証方法</span>
                </div>
                <div className="pl-6">
                  <Badge variant="outline">
                    メール/パスワード認証
                  </Badge>
                </div>
              </div>

              {/* セキュリティ推奨事項 */}
              <div className="bg-blue-50 p-3 rounded-lg">
                <div className="flex items-start gap-2">
                  <Shield className="w-4 h-4 text-blue-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-blue-900">セキュリティ推奨</p>
                    <p className="text-xs text-blue-700 mt-1">
                      パスワード認証により適切なセキュリティが確保されています
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* ⚙️ アプリケーション設定 */}
          <Card className="h-fit">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                アプリケーション設定
              </CardTitle>
              <CardDescription>決済リンク管理の設定</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => router.push('/dashboard')}
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                決済リンク履歴
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => router.push('/settings')}
              >
                <Settings className="w-4 h-4 mr-2" />
                API設定
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => router.push('/create')}
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                新規決済リンク作成
              </Button>
            </CardContent>
          </Card>

          {/* 📊 データ管理 */}
          <Card className="h-fit">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="w-5 h-5" />
                データ管理
              </CardTitle>
              <CardDescription>個人データの管理と削除</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                variant="outline"
                className="w-full justify-start"
                disabled
              >
                <Download className="w-4 h-4 mr-2" />
                データエクスポート（準備中）
              </Button>

              <div className="bg-red-50 p-3 rounded-lg">
                <div className="flex items-start gap-2 mb-2">
                  <AlertTriangle className="w-4 h-4 text-red-600 mt-0.5" />
                  <p className="text-sm font-medium text-red-900">危険な操作</p>
                </div>
                {showDeleteConfirm ? (
                  <div className="space-y-2">
                    <p className="text-xs text-red-700">
                      この操作は元に戻すことができません。すべてのデータが削除されます。
                    </p>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={handleDeleteAccount}
                      >
                        削除を実行
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setShowDeleteConfirm(false)}
                      >
                        キャンセル
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Button
                    size="sm"
                    variant="destructive"
                    className="w-full justify-start"
                    onClick={() => setShowDeleteConfirm(true)}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    アカウント削除
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* 🚪 セッション管理（フル幅） */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <LogOut className="w-5 h-5" />
                  セッション管理
                </CardTitle>
                <CardDescription>現在のログインセッションを管理</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <div>
                      <p className="font-medium">ログイン中</p>
                      <p className="text-sm text-gray-500">
                        {user.email} としてログインしています
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="destructive"
                    onClick={handleSignOut}
                    disabled={isLoggingOut}
                  >
                    {isLoggingOut ? (
                      <>
                        <Clock className="w-4 h-4 mr-2 animate-spin" />
                        ログアウト中...
                      </>
                    ) : (
                      <>
                        <LogOut className="w-4 h-4 mr-2" />
                        ログアウト
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

        </div>
      </div>
    </div>
  )
}