import { NextAuthOptions } from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import { PrismaAdapter } from '@next-auth/prisma-adapter'
import prisma from '@/lib/prisma'

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      return true // シンプルに認証を許可
    },
    async redirect({ url, baseUrl }) {
      console.log('🔀 Redirect callback:', { url, baseUrl })

      // サインアウト後のリダイレクトを優先
      if (url === '/auth/signin' || url.includes('/auth/signin')) {
        console.log('🚪 サインインページにリダイレクト')
        return `${baseUrl}/auth/signin`
      }

      // 相対パスの場合はそのまま使用
      if (url.startsWith('/')) {
        console.log('🔗 相対パスリダイレクト:', url)
        return `${baseUrl}${url}`
      }

      // 同一オリジンの場合はそのまま使用
      if (new URL(url).origin === baseUrl) {
        console.log('🏠 同一オリジンリダイレクト:', url)
        return url
      }

      // 認証成功後のデフォルトはダッシュボード
      console.log('📊 デフォルトダッシュボードリダイレクト')
      return `${baseUrl}/dashboard`
    },
    async session({ session, user }) {
      // データベースセッション使用時はuserオブジェクトが渡される
      if (user) {
        session.user.id = user.id
      }
      return session
    },
  },
  events: {
    async signOut({ token, session }) {
      console.log('SignOut event triggered')
      // 手動でセッション削除を実行（PrismaAdapterが不完全な場合の対策）
      try {
        if (session) {
          console.log('Manually deleting session:', session.sessionToken)
          await prisma.session.deleteMany({
            where: {
              sessionToken: session.sessionToken
            }
          })
        }
      } catch (error) {
        console.error('Manual session deletion error:', error)
      }
    },
  },
  pages: {
    signIn: '/auth/signin',
    signOut: '/auth/signout',
    error: '/auth/error',
  },
  session: {
    strategy: 'database', // PrismaAdapterを使用するため、databaseに変更
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  cookies: {
    sessionToken: {
      name: process.env.NODE_ENV === 'production' ? '__Secure-next-auth.session-token' : 'next-auth.session-token',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
  },
  debug: process.env.NODE_ENV === 'development',
}