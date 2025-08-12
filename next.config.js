/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // Next.js 15の新機能対応
  },
  images: {
    domains: ['assets.stripe.com', 'www.paypalobjects.com', 'squareup.com'],
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