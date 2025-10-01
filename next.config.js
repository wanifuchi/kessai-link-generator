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
    // optimizeCss: true, // 一時的に無効化（crittersエラー対応）
    optimizePackageImports: ['lucide-react', '@radix-ui/react-toast'],
    serverComponentsExternalPackages: [], // Vercel向けサーバーコンポーネント最適化
  },

  // Vercel デプロイメント最適化
  output: 'standalone',

  // Webpack 最適化
  webpack: (config, { dev, isServer }) => {
    // 本番環境でのバンドル最適化
    if (!dev && !isServer) {
      config.optimization.splitChunks = {
        chunks: 'all',
        cacheGroups: {
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            chunks: 'all',
          },
        },
      };
    }
    return config;
  },

  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'assets.stripe.com',
      },
      {
        protocol: 'https',
        hostname: 'www.paypalobjects.com',
      },
      {
        protocol: 'https',
        hostname: 'squareup.com',
      },
    ],
    formats: ['image/webp', 'image/avif'], // 最新の画像フォーマット対応
    minimumCacheTTL: 86400, // 24時間キャッシュ
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
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
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()'
          },
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline' js.stripe.com; style-src 'self' 'unsafe-inline' fonts.googleapis.com; img-src 'self' data: assets.stripe.com *.paypalobjects.com *.squareup.com; font-src 'self' fonts.gstatic.com; connect-src 'self' api.stripe.com *.paypal.com *.squareup.com;"
          }
        ]
      }
    ]
  }
}

module.exports = nextConfig