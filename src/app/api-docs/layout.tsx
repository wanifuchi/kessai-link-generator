import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'API仕様書 | 決済リンクジェネレーター',
  description: '決済リンク管理システムのREST API仕様書。認証方法、エンドポイント、レスポンス例、Webhook設定まで詳細に解説。',
  keywords: 'API, REST API, 認証, エンドポイント, Webhook, 決済API, Stripe API, PayPal API',
  openGraph: {
    title: 'API仕様書 | 決済リンクジェネレーター',
    description: 'REST API仕様書 - 認証、エンドポイント、Webhook設定を詳細解説',
    type: 'article',
    locale: 'ja_JP',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'API仕様書 | 決済リンクジェネレーター',
    description: 'REST API仕様書 - 認証、エンドポイント、Webhook設定を詳細解説',
  },
  alternates: {
    canonical: '/api-docs',
  },
};

export default function ApiDocsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}