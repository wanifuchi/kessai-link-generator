import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'プライバシーポリシー | 決済リンクジェネレーター',
  description: '決済リンク管理システムの個人情報保護方針。個人情報の収集・利用目的、第三者提供、セキュリティ対策について詳しく説明。',
  keywords: 'プライバシーポリシー, 個人情報保護, セキュリティ, GDPR, 個人情報保護法',
  openGraph: {
    title: 'プライバシーポリシー | 決済リンクジェネレーター',
    description: '個人情報保護方針 - 収集・利用目的、セキュリティ対策を詳しく説明',
    type: 'article',
    locale: 'ja_JP',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'プライバシーポリシー | 決済リンクジェネレーター',
    description: '個人情報保護方針 - 収集・利用目的、セキュリティ対策を詳しく説明',
  },
  alternates: {
    canonical: '/privacy',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function PrivacyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}