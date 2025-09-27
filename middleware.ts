import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import { getToken } from 'next-auth/jwt'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  console.log(`🛡️ Middleware check: ${pathname}`)

  // 認証が必要なルート: /dashboard, /create, /settings, /profile
  if (
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/create') ||
    pathname.startsWith('/settings') ||
    pathname.startsWith('/profile')
  ) {
    try {
      // NextAuth.jsセッションをチェック（キャッシュ無効化）
      const nextAuthToken = await getToken({
        req: request,
        secret: process.env.NEXTAUTH_SECRET,
        // キャッシュを無効化してリアルタイムチェック
        salt: process.env.NODE_ENV === 'development' ? Date.now().toString() : undefined
      })

      console.log('🔍 NextAuth token check:', {
        hasToken: !!nextAuthToken,
        tokenPreview: nextAuthToken ? `${JSON.stringify(nextAuthToken).substring(0, 100)}...` : 'null'
      })

      if (nextAuthToken) {
        // セッションが存在する場合でも、データベース確認を実行
        try {
          const sessionVerifyResponse = await fetch(`${request.nextUrl.origin}/api/auth/session`, {
            headers: {
              'Cookie': request.headers.get('cookie') || '',
            },
          })

          if (sessionVerifyResponse.ok) {
            const sessionData = await sessionVerifyResponse.json()
            if (sessionData && sessionData.user) {
              console.log('✅ セッション有効確認完了')
              return NextResponse.next()
            }
          }

          console.log('❌ セッション確認失敗 - サインインページへリダイレクト')
          return NextResponse.redirect(new URL('/auth/signin', request.url))
        } catch (verifyError) {
          console.warn('セッション確認エラー:', verifyError)
          return NextResponse.redirect(new URL('/auth/signin', request.url))
        }
      }

      // NextAuth.jsセッションがない場合は従来のJWTトークンをチェック
      const jwtToken = request.cookies.get('auth-token')?.value

      if (!jwtToken) {
        console.log('🚫 トークンなし - サインインページへリダイレクト')
        return NextResponse.redirect(new URL('/auth/signin', request.url))
      }

      // JWTを検証
      const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this'
      const decoded = jwt.verify(jwtToken, JWT_SECRET) as any

      if (!decoded || !decoded.id) {
        console.log('🚫 無効なJWTトークン - サインインページへリダイレクト')
        return NextResponse.redirect(new URL('/auth/signin', request.url))
      }

      console.log('✅ JWT認証成功')
      // 有効なトークンの場合は処理を続行
    } catch (error) {
      // 認証の検証に失敗した場合はサインインページにリダイレクト
      console.warn('❌ 認証検証失敗:', error)
      return NextResponse.redirect(new URL('/auth/signin', request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - auth (authentication pages)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|auth).*)',
  ],
}