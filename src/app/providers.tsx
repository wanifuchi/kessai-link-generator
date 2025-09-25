'use client'

import { useState, useEffect } from 'react'
import { StackProvider } from '@stackframe/stack'
import { getStackClientApp, hasStackEnv } from '@/lib/stack'

// Fetch Interceptor for debugging
function setupFetchInterceptor() {
  if (typeof window !== 'undefined' && !window.fetchIntercepted) {
    const originalFetch = window.fetch;
    window.fetchIntercepted = true;

    window.fetch = async function(input: RequestInfo | URL, init?: RequestInit) {
      console.log('🕵️ Fetch Intercepted:', {
        url: input,
        method: init?.method || 'GET',
        headers: init?.headers || {},
        body: init?.body || null
      });

      try {
        const response = await originalFetch(input, init);
        console.log('✅ Fetch Success:', response.status, response.statusText);
        return response;
      } catch (error) {
        console.error('❌ Fetch Error:', error);
        throw error;
      }
    };
  }
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false)
  const [stackApp, setStackApp] = useState<any>(null)
  const [hasStack, setHasStack] = useState(false)

  useEffect(() => {
    // Fetch interceptor setup
    setupFetchInterceptor();

    // クライアントサイドでのみStack Authを初期化
    try {
      console.log('🔧 Stack Auth完全環境チェック:', {
        projectId: process.env.NEXT_PUBLIC_STACK_PROJECT_ID,
        projectIdLength: process.env.NEXT_PUBLIC_STACK_PROJECT_ID?.length,
        publishableKey: process.env.NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY,
        publishableKeyLength: process.env.NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY?.length,
        hasEnv: hasStackEnv(),
        charCodes: {
          projectId: process.env.NEXT_PUBLIC_STACK_PROJECT_ID ? Array.from(process.env.NEXT_PUBLIC_STACK_PROJECT_ID).slice(0, 5).map(c => c.charCodeAt(0)) : [],
          publishableKey: process.env.NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY ? Array.from(process.env.NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY).slice(0, 5).map(c => c.charCodeAt(0)) : []
        }
      })

      if (hasStackEnv()) {
        console.log('🔧 Stack Appクライアント初期化中（最小設定）...')
        const app = getStackClientApp()
        setStackApp(app)
        setHasStack(true)
        console.log('🔧 Stack Appクライアント初期化成功')
      } else {
        console.warn('🔧 Stack Auth環境変数が不足しています')
      }
    } catch (error) {
      console.error('🔧 Stack Auth設定エラー:', error)
      setHasStack(false)
    }
    setMounted(true)
  }, [])

  // SSR時は基本的な構造のみ表示
  if (!mounted) {
    return <>{children}</>
  }

  // クライアントサイドでStack Auth環境変数がある場合（言語設定削除）
  if (hasStack && stackApp) {
    return (
      <StackProvider app={stackApp}>
        {children}
      </StackProvider>
    )
  }

  // Stack Auth未設定またはエラーの場合は通常通り表示
  return <>{children}</>
}