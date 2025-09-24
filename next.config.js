/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['assets.stripe.com', 'www.paypalobjects.com', 'squareup.com'],
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