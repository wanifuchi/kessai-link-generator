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
      console.log('🔐 SignIn callback:', {
        userId: user.id,
        userEmail: user.email,
        provider: account?.provider,
        accountType: account?.type
      })

      try {
        // アカウント連携の確認と処理
        if (account?.provider === 'google') {
          console.log('✅ Google認証成功')
          return true
        }

        console.log('✅ 認証許可')
        return true
      } catch (error) {
        console.error('❌ SignIn callback error:', error)
        return false
      }
    },
    async redirect({ url, baseUrl }) {
      console.log('🔀 Redirect callback:', { url, baseUrl })

      // エラーページからのリダイレクト処理
      if (url.includes('error=')) {
        console.log('⚠️ エラーページからのリダイレクト - サインインページへ')
        return `${baseUrl}/auth/signin`
      }

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
      console.log('🔄 Session callback:', {
        hasSession: !!session,
        hasUser: !!user,
        userEmail: user?.email || session?.user?.email
      })

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
        if (token?.sessionToken) {
          console.log('Manually deleting session:', token.sessionToken)
          await prisma.session.deleteMany({
            where: {
              sessionToken: token.sessionToken as string
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