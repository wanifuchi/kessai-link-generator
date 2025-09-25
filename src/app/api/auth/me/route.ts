import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser()

    if (!user) {
      return NextResponse.json(
        { error: '未認証です' },
        { status: 401 }
      )
    }

    return NextResponse.json({
      success: true,
      user
    })

  } catch (error: any) {
    return NextResponse.json(
      { error: '認証確認に失敗しました' },
      { status: 500 }
    )
  }
}