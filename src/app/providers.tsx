'use client'

import { useState, useEffect } from 'react'
import { StackProvider } from '@stackframe/stack'
import { getStackClientApp, hasStackEnv } from '@/lib/stack'

export function Providers({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false)
  const [stackApp, setStackApp] = useState<any>(null)
  const [hasStack, setHasStack] = useState(false)

  useEffect(() => {
    // クライアントサイドでのみStack Authを初期化
    try {
      if (hasStackEnv()) {
        const app = getStackClientApp()
        setStackApp(app)
        setHasStack(true)
      }
    } catch (error) {
      console.warn('Stack Auth設定エラー:', error)
      setHasStack(false)
    }
    setMounted(true)
  }, [])

  // SSR時は基本的な構造のみ表示
  if (!mounted) {
    return <>{children}</>
  }

  // クライアントサイドでStack Auth環境変数がある場合
  if (hasStack && stackApp) {
    return (
      <StackProvider app={stackApp} lang="ja-JP">
        {children}
      </StackProvider>
    )
  }

  // Stack Auth未設定またはエラーの場合は通常通り表示
  return <>{children}</>
}