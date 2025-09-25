import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // 認証が必要なルート: /dashboard, /create, /settings, /profile
  if (
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/create') ||
    pathname.startsWith('/settings') ||
    pathname.startsWith('/profile')
  ) {
    try {
      // Cookieからトークンを取得
      const token = request.cookies.get('auth-token')?.value

      if (!token) {
        // トークンがない場合はサインインページにリダイレクト
        return NextResponse.redirect(new URL('/auth/signin', request.url))
      }

      // JWTを検証
      const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this'
      const decoded = jwt.verify(token, JWT_SECRET) as any

      if (!decoded || !decoded.id) {
        // 無効なトークンの場合はサインインページにリダイレクト
        return NextResponse.redirect(new URL('/auth/signin', request.url))
      }

      // 有効なトークンの場合は処理を続行
    } catch (error) {
      // JWTの検証に失敗した場合はサインインページにリダイレクト
      console.warn('JWT verification failed:', error)
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