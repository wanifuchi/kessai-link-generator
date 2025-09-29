/** @type {import('next').NextConfig} */
const nextConfig = {
  // パフォーマンス最適化設定
  swcMinify: true, // SWCミニファイヤを使用
  compress: true,  // gzip圧縮を有効化
  productionBrowserSourceMaps: false, // 本番環境でのソースマップ無効化

  // バンドル最適化
  modularizeImports: {
    'lucide-react': {
      transform: 'lucide-react/dist/esm/icons/{{member}}',
    },
  },

  experimental: {
    // Next.js 最適化機能
    optimizeCss: true,
    optimizePackageImports: ['lucide-react', '@radix-ui/react-toast'],
  },

  images: {
    domains: ['assets.stripe.com', 'www.paypalobjects.com', 'squareup.com'],
    formats: ['image/webp', 'image/avif'], // 最新の画像フォーマット対応
    minimumCacheTTL: 86400, // 24時間キャッシュ
  },

  env: {
    // 環境変数のカスタム設定
  },
  async headers() {
    return [
      {
        // セキュリティヘッダーの設定
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          }
        ]
      }
    ]
  }
}

module.exports = nextConfig