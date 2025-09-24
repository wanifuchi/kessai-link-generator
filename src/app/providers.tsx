'use client'

import { StackProvider } from '@stackframe/stack'
import { getStackClientApp, hasStackEnv } from '@/lib/stack'

export function Providers({ children }: { children: React.ReactNode }) {
  // Stack Auth環境変数がすべて設定されているかチェック
  if (hasStackEnv()) {
    try {
      const app = getStackClientApp()

      return (
        <StackProvider app={app} lang="ja-JP">
          {children}
        </StackProvider>
      )
    } catch (error) {
      // Stack Auth設定エラーの場合は警告を出して通常通り表示
      console.warn('Stack Auth設定エラー:', error)
      return <>{children}</>
    }
  }

  // 環境変数が未設定の場合は通常通り表示
  return <>{children}</>
}