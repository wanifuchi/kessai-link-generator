import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import {
  User,
  Shield,
  Settings,
  Database,
  LogOut
} from 'lucide-react'

export default function ProfileLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-96" />
        </div>

        {/* 階層型Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* 基本情報セクション */}
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
                <Skeleton className="w-16 h-16 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-4 w-24" />
                </div>
              </div>

              {/* メール情報 */}
              <div className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <div className="pl-6 space-y-1">
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-6 w-16" />
                </div>
              </div>

              {/* 登録日時 */}
              <div className="space-y-2">
                <Skeleton className="h-4 w-20" />
                <div className="pl-6">
                  <Skeleton className="h-4 w-40" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* セキュリティセクション */}
          <Card className="h-fit">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                セキュリティ
              </CardTitle>
              <CardDescription>アカウントのセキュリティ状況</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Skeleton className="h-4 w-20" />
                <div className="pl-6">
                  <Skeleton className="h-6 w-16" />
                </div>
              </div>

              <div className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <div className="pl-6">
                  <Skeleton className="h-6 w-24" />
                </div>
              </div>

              <div className="bg-blue-50 p-3 rounded-lg">
                <Skeleton className="h-4 w-32 mb-2" />
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-3/4 mt-1" />
              </div>
            </CardContent>
          </Card>

          {/* アプリケーション設定 */}
          <Card className="h-fit">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                アプリケーション設定
              </CardTitle>
              <CardDescription>決済リンク管理の設定</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Skeleton className="h-9 w-full" />
              <Skeleton className="h-9 w-full" />
              <Skeleton className="h-9 w-full" />
            </CardContent>
          </Card>

          {/* データ管理 */}
          <Card className="h-fit">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="w-5 h-5" />
                データ管理
              </CardTitle>
              <CardDescription>個人データの管理と削除</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Skeleton className="h-9 w-full" />
              <div className="bg-red-50 p-3 rounded-lg">
                <Skeleton className="h-4 w-24 mb-2" />
                <Skeleton className="h-9 w-full" />
              </div>
            </CardContent>
          </Card>

          {/* セッション管理（フル幅） */}
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
                    <Skeleton className="w-3 h-3 rounded-full" />
                    <div className="space-y-1">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-3 w-48" />
                    </div>
                  </div>
                  <Skeleton className="h-9 w-24" />
                </div>
              </CardContent>
            </Card>
          </div>

        </div>
      </div>
    </div>
  )
}