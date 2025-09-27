import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { cookies } from 'next/headers'

export async function DELETE(request: NextRequest) {
  try {
    // 認証確認
    const user = await getAuthUser()

    if (!user) {
      return NextResponse.json(
        { error: '認証が必要です' },
        { status: 401 }
      )
    }

    console.log(`🗑️ アカウント削除開始: ユーザーID ${user.id}`)

    // Prismaトランザクションで関連データを安全に削除
    await prisma.$transaction(async (tx) => {
      // 1. 決済リンクを削除
      const deletedPaymentLinks = await tx.paymentLink.deleteMany({
        where: { userId: user.id }
      })
      console.log(`📦 削除された決済リンク数: ${deletedPaymentLinks.count}`)

      // 2. API設定を削除
      const deletedApiSettings = await tx.apiSettings.deleteMany({
        where: { userId: user.id }
      })
      console.log(`⚙️ 削除されたAPI設定数: ${deletedApiSettings.count}`)

      // 3. サブスクリプションを削除
      const deletedSubscription = await tx.subscription.deleteMany({
        where: { userId: user.id }
      })
      console.log(`💳 削除されたサブスクリプション数: ${deletedSubscription.count}`)

      // 4. NextAuth.jsセッションを削除
      const deletedSessions = await tx.session.deleteMany({
        where: { userId: user.id }
      })
      console.log(`🔐 削除されたセッション数: ${deletedSessions.count}`)

      // 5. NextAuth.jsアカウントを削除
      const deletedAccounts = await tx.account.deleteMany({
        where: { userId: user.id }
      })
      console.log(`👤 削除されたアカウント数: ${deletedAccounts.count}`)

      // 6. 最後にユーザー本体を削除
      const deletedUser = await tx.user.delete({
        where: { id: user.id }
      })
      console.log(`🗑️ ユーザー削除完了: ${deletedUser.email}`)
    })

    // JWTトークンクッキーを削除
    cookies().delete('auth-token')
    console.log('🍪 JWTトークンクッキー削除完了')

    return NextResponse.json({
      success: true,
      message: 'アカウントが正常に削除されました'
    })

  } catch (error: any) {
    console.error('❌ アカウント削除エラー:', error)

    // 詳細なエラー情報をログに記録
    if (error.code) {
      console.error('エラーコード:', error.code)
    }
    if (error.meta) {
      console.error('エラーメタ:', error.meta)
    }

    return NextResponse.json(
      {
        error: 'アカウント削除に失敗しました',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    )
  }
}