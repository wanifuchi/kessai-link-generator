import { NextRequest, NextResponse } from 'next/server'
import { getStackServerApp } from '@/lib/stack'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // 認証が必要なルート: /dashboard, /create, /settings
  if (pathname.startsWith('/dashboard') || pathname.startsWith('/create') || pathname.startsWith('/settings')) {
    try {
      const app = getStackServerApp()
      const user = await app.getUser()

      if (!user) {
        // 認証されていない場合は、ログインページにリダイレクト
        return NextResponse.redirect(new URL('/auth/signin', request.url))
      }
    } catch (error) {
      // Stack Auth未設定の場合はスキップ（開発時など）
      console.warn('Stack Auth not configured, skipping auth check:', error)
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