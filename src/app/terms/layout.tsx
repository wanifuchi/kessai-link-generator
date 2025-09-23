import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '利用規約 | 決済リンクジェネレーター',
  description: '決済リンク管理システムの利用規約。サービス利用条件、禁止行為、責任制限、免責事項について詳しく説明。',
  keywords: '利用規約, 利用条件, 免責事項, 責任制限, サービス規約',
  openGraph: {
    title: '利用規約 | 決済リンクジェネレーター',
    description: 'サービス利用規約 - 利用条件、禁止行為、責任制限について詳しく説明',
    type: 'article',
    locale: 'ja_JP',
  },
  twitter: {
    card: 'summary_large_image',
    title: '利用規約 | 決済リンクジェネレーター',
    description: 'サービス利用規約 - 利用条件、禁止行為、責任制限について詳しく説明',
  },
  alternates: {
    canonical: '/terms',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function TermsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}