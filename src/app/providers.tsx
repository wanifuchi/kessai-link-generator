'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { SessionProvider, useSession, signOut as nextAuthSignOut } from 'next-auth/react'
import { AuthenticatedUser } from '@/lib/auth'

interface AuthContextType {
  user: AuthenticatedUser | null
  loading: boolean
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signOut: async () => {},
})

function AuthProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession()
  const [jwtUser, setJwtUser] = useState<AuthenticatedUser | null>(null)
  const [jwtLoading, setJwtLoading] = useState(true)

  // JWTトークンユーザーの確認
  useEffect(() => {
    async function checkJwtAuth() {
      try {
        // NextAuth.jsセッションがある場合はJWTチェックをスキップ
        if (session?.user) {
          setJwtUser(null)
          setJwtLoading(false)
          return
        }

        const response = await fetch('/api/auth/me', {
          credentials: 'include'
        })

        if (response.ok) {
          const userData = await response.json()
          setJwtUser(userData.user)
        } else {
          setJwtUser(null)
        }
      } catch (error) {
        console.log('JWT認証チェックエラー:', error)
        setJwtUser(null)
      } finally {
        setJwtLoading(false)
      }
    }

    // NextAuth.jsのロードが完了してからJWTをチェック
    if (status !== 'loading') {
      checkJwtAuth()
    }
  }, [session, status])

  // ユーザー情報の統合
  const user = session?.user ? {
    id: session.user.id as string,
    email: session.user.email as string,
    name: session.user.name as string,
    createdAt: new Date().toISOString(), // 簡易実装
  } : jwtUser

  const loading = status === 'loading' || jwtLoading

  // 統合ログアウト関数
  const signOut = async () => {
    console.log('🚀 統合ログアウト開始')

    try {
      // 1. 手動セッション削除API呼び出し（NextAuth.jsセッション用）
      try {
        console.log('📡 NextAuth.js手動セッション削除API呼び出し中...')
        const clearResponse = await fetch('/api/auth/clear-session', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include'
        })

        if (clearResponse.ok) {
          const clearResult = await clearResponse.json()
          console.log('✅ NextAuth.js手動セッション削除成功:', clearResult)
        } else {
          console.warn('⚠️ NextAuth.js手動セッション削除レスポンス異常:', clearResponse.status)
        }
      } catch (clearError) {
        console.error('❌ NextAuth.js手動セッション削除エラー:', clearError)
      }

      // 2. JWTトークン削除API呼び出し
      try {
        console.log('🔑 JWTトークン削除API呼び出し中...')
        const jwtSignoutResponse = await fetch('/api/auth/signout-jwt', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include'
        })

        if (jwtSignoutResponse.ok) {
          const jwtResult = await jwtSignoutResponse.json()
          console.log('✅ JWTトークン削除成功:', jwtResult)
        } else {
          console.warn('⚠️ JWTトークン削除レスポンス異常:', jwtSignoutResponse.status)
        }
      } catch (jwtError) {
        console.error('❌ JWTトークン削除エラー:', jwtError)
      }

      // 3. NextAuth標準サインアウト
      try {
        console.log('🔐 NextAuth サインアウト実行中...')
        await nextAuthSignOut({ redirect: false })
        console.log('✅ NextAuth サインアウト完了')
      } catch (signOutError) {
        console.error('❌ NextAuth サインアウト失敗:', signOutError)
      }

      // 4. 強制リダイレクト
      console.log('🔄 サインインページにリダイレクト')
      window.location.href = `/auth/signin?t=${Date.now()}`

    } catch (error) {
      console.error('❌ ログアウト処理でエラー:', error)
      // 緊急時の強制リダイレクト
      window.location.href = `/auth/signin?t=${Date.now()}`
    }
  }

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      signOut
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <AuthProvider>
        {children}
      </AuthProvider>
    </SessionProvider>
  )
}

export const useAuth = () => useContext(AuthContext)