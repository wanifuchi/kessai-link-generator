import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    // リクエストからCookieを取得
    const cookieHeader = request.headers.get('cookie')
    console.log('Cookie header:', cookieHeader)

    if (!cookieHeader) {
      return NextResponse.json({ success: false, message: 'No cookies found' }, { status: 401 })
    }

    // セッショントークンを抽出 - より多くのパターンに対応
    const sessionTokenMatch = cookieHeader.match(/next-auth\.session-token=([^;]+)/) ||
                             cookieHeader.match(/__Secure-next-auth\.session-token=([^;]+)/) ||
                             cookieHeader.match(/authjs\.session-token=([^;]+)/)

    if (!sessionTokenMatch) {
      console.log('Available cookies:', cookieHeader.split(';').map(c => c.trim()))
      return NextResponse.json({ success: false, message: 'No session token found in cookies' }, { status: 401 })
    }

    const sessionToken = sessionTokenMatch[1]
    console.log('Found session token:', sessionToken.substring(0, 20) + '...')

    // セッショントークンを使って直接削除
    const deletedSessions = await prisma.session.deleteMany({
      where: {
        sessionToken: sessionToken
      }
    })

    console.log('Manual session deletion - deleted sessions:', deletedSessions.count)

    // 関連するユーザーのすべてのセッションも削除（より確実にするため）
    if (deletedSessions.count === 0) {
      // セッショントークンでセッションが見つからない場合、データベース内のすべてのセッションを確認
      const allSessions = await prisma.session.findMany({
        select: { sessionToken: true, id: true }
      })
      console.log('All sessions in database:', allSessions.map(s => s.sessionToken.substring(0, 20) + '...'))

      // 強制的にすべてのセッションを削除（開発環境のみ）
      if (process.env.NODE_ENV === 'development') {
        const forceDeletedSessions = await prisma.session.deleteMany({})
        console.log('Force deleted all sessions:', forceDeletedSessions.count)
        return NextResponse.json({
          success: true,
          deletedCount: forceDeletedSessions.count,
          message: 'Force deleted all sessions in development mode'
        })
      }
    }

    return NextResponse.json({
      success: true,
      deletedCount: deletedSessions.count,
      sessionToken: sessionToken.substring(0, 20) + '...'
    })
  } catch (error) {
    console.error('Error in clear-session API:', error)
    const errorMessage = error instanceof Error ? error.message : String(error)
    return NextResponse.json({ success: false, error: errorMessage }, { status: 500 })
  }
}