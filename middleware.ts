import { NextRequest, NextResponse } from 'next/server'
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
      // NextAuth.jsセッションをチェック
      const nextAuthToken = await getToken({
        req: request,
        secret: process.env.NEXTAUTH_SECRET
      })

      console.log('🔍 NextAuth token check:', {
        hasToken: !!nextAuthToken,
        userId: nextAuthToken?.sub || 'no-user'
      })

      if (nextAuthToken && nextAuthToken.sub) {
        console.log('✅ 認証成功 - アクセス許可')
        return NextResponse.next()
      }

      console.log('🚫 認証なし - サインインページへリダイレクト')
      return NextResponse.redirect(new URL('/auth/signin', request.url))
    } catch (error) {
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