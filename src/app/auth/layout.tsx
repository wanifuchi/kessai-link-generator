import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'ログイン・登録 - 決済リンク',
  description: '決済リンク生成サービスへのログイン・新規登録'
}

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}