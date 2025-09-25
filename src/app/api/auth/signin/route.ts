import { NextRequest, NextResponse } from 'next/server'
import { signIn } from '@/lib/auth'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json(
        { error: 'メールアドレスとパスワードは必須です' },
        { status: 400 }
      )
    }

    const { user, token } = await signIn(email, password)

    // HTTPOnly Cookieにトークンを設定
    cookies().set({
      name: 'auth-token',
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60 // 30日
    })

    return NextResponse.json({
      success: true,
      user
    })

  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'ログインに失敗しました' },
      { status: 400 }
    )
  }
}