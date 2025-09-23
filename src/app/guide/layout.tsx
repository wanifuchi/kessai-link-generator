import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '利用ガイド | 決済リンクジェネレーター',
  description: '決済リンク管理システムの利用方法、API設定手順、トラブルシューティングを詳しく解説。Stripe、PayPal対応の決済リンク作成ガイド。',
  keywords: 'Stripe, PayPal, 決済リンク, 利用ガイド, API設定, トラブルシューティング, 決済システム',
  openGraph: {
    title: '利用ガイド | 決済リンクジェネレーター',
    description: '決済リンク管理システムの利用方法とAPI設定手順を詳しく解説',
    type: 'article',
    locale: 'ja_JP',
  },
  twitter: {
    card: 'summary_large_image',
    title: '利用ガイド | 決済リンクジェネレーター',
    description: '決済リンク管理システムの利用方法とAPI設定手順を詳しく解説',
  },
  alternates: {
    canonical: '/guide',
  },
};

export default function GuideLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}