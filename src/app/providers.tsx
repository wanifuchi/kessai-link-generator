'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { SessionProvider, useSession } from 'next-auth/react'
import { AuthenticatedUser } from '@/lib/auth'

interface AuthContextType {
  user: AuthenticatedUser | null
  loading: boolean
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
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

  return (
    <AuthContext.Provider value={{
      user,
      loading
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