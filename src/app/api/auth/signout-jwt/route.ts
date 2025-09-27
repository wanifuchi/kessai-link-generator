import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
  try {
    // JWTトークンクッキーを削除
    cookies().delete('auth-token')

    return NextResponse.json({
      success: true,
      message: 'ログアウトしました'
    })

  } catch (error: any) {
    console.error('JWT ログアウトエラー:', error)
    return NextResponse.json(
      { error: 'ログアウト処理に失敗しました' },
      { status: 500 }
    )
  }
}