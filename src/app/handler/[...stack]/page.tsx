import { redirect } from 'next/navigation'

export default function Handler() {
  // Stack Authを削除したため、認証関連のハンドラーは不要
  // ホームページにリダイレクト
  redirect('/')
}