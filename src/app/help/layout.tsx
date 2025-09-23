import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'ヘルプ・サポート | 決済リンクジェネレーター',
  description: '決済リンク管理システムのヘルプページ。よくある質問、お問い合わせ、サポート情報、技術リソースを提供。',
  keywords: 'ヘルプ, サポート, FAQ, よくある質問, お問い合わせ, トラブルシューティング',
  openGraph: {
    title: 'ヘルプ・サポート | 決済リンクジェネレーター',
    description: 'ヘルプページ - FAQ、お問い合わせ、サポート情報を提供',
    type: 'article',
    locale: 'ja_JP',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ヘルプ・サポート | 決済リンクジェネレーター',
    description: 'ヘルプページ - FAQ、お問い合わせ、サポート情報を提供',
  },
  alternates: {
    canonical: '/help',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function HelpLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}