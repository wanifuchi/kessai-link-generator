import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    // 開発環境でのみ実行可能
    if (process.env.NODE_ENV !== 'development') {
      return NextResponse.json({ error: 'This endpoint is only available in development' }, { status: 403 })
    }

    // すべてのセッションを削除
    const deletedSessions = await prisma.session.deleteMany({})

    console.log('Admin: All sessions deleted:', deletedSessions.count)

    // すべてのアカウントも削除（テスト目的）
    const deletedAccounts = await prisma.account.deleteMany({})
    console.log('Admin: All accounts deleted:', deletedAccounts.count)

    // すべてのユーザーも削除（テスト目的）
    const deletedUsers = await prisma.user.deleteMany({})
    console.log('Admin: All users deleted:', deletedUsers.count)

    return NextResponse.json({
      success: true,
      deletedSessions: deletedSessions.count,
      deletedAccounts: deletedAccounts.count,
      deletedUsers: deletedUsers.count,
      message: 'All data cleared for testing'
    })
  } catch (error) {
    console.error('Error in admin clear:', error)
    const errorMessage = error instanceof Error ? error.message : String(error)
    return NextResponse.json({ success: false, error: errorMessage }, { status: 500 })
  }
}