'use client'

import { createContext, useContext, useState, useEffect } from 'react'
import { AuthenticatedUser } from '@/lib/auth'

interface AuthContextType {
  user: AuthenticatedUser | null
  loading: boolean
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signOut: async () => {}
})

export function Providers({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthenticatedUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // クライアント側で認証状態を確認
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/auth/me')
      if (response.ok) {
        const data = await response.json()
        setUser(data.user)
      }
    } catch (error) {
      console.error('認証確認エラー:', error)
    } finally {
      setLoading(false)
    }
  }

  const signOut = async () => {
    try {
      await fetch('/api/auth/signout', { method: 'POST' })
      setUser(null)
      window.location.href = '/'
    } catch (error) {
      console.error('サインアウトエラー:', error)
    }
  }

  return (
    <AuthContext.Provider value={{ user, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)