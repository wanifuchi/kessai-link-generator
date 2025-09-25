import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
  try {
    // Cookieを削除
    cookies().delete('auth-token')

    return NextResponse.json({
      success: true,
      message: 'ログアウトしました'
    })

  } catch (error: any) {
    return NextResponse.json(
      { error: 'ログアウトに失敗しました' },
      { status: 500 }
    )
  }
}