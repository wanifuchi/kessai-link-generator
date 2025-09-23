'use client';

import Link from 'next/link';
import { Card } from '@/components/ui/card';
import {
  BookOpen,
  Code2,
  Shield,
  FileText,
  HelpCircle,
  Github,
  Mail,
  ExternalLink,
  CreditCard,
  Heart
} from 'lucide-react';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-50 border-t border-gray-200 mt-16">
      <div className="container mx-auto px-4 py-12 max-w-6xl">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* サービス情報 */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <CreditCard className="h-6 w-6 text-blue-600" />
              <h3 className="text-lg font-semibold text-gray-900">決済リンク管理</h3>
            </div>
            <p className="text-sm text-gray-600">
              Stripe・PayPal対応の安全で簡単な決済リンク作成・管理システム
            </p>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Heart className="h-4 w-4 text-red-500" />
              <span>日本のビジネスのために作られました</span>
            </div>
          </div>

          {/* サポート */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">サポート</h3>
            <nav className="space-y-2">
              <Link
                href="/guide"
                className="flex items-center gap-2 text-sm text-gray-600 hover:text-blue-600 hover:underline transition-colors"
              >
                <BookOpen className="h-4 w-4" />
                利用ガイド
              </Link>
              <Link
                href="/help"
                className="flex items-center gap-2 text-sm text-gray-600 hover:text-blue-600 hover:underline transition-colors"
              >
                <HelpCircle className="h-4 w-4" />
                ヘルプ・FAQ
              </Link>
              <Link
                href="/api-docs"
                className="flex items-center gap-2 text-sm text-gray-600 hover:text-blue-600 hover:underline transition-colors"
              >
                <Code2 className="h-4 w-4" />
                API仕様
              </Link>
              <Link
                href="mailto:support@kessai-link.com"
                className="flex items-center gap-2 text-sm text-gray-600 hover:text-blue-600 hover:underline transition-colors"
              >
                <Mail className="h-4 w-4" />
                お問い合わせ
              </Link>
            </nav>
          </div>

          {/* 法的情報 */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">法的情報</h3>
            <nav className="space-y-2">
              <Link
                href="/terms"
                className="flex items-center gap-2 text-sm text-gray-600 hover:text-blue-600 hover:underline transition-colors"
              >
                <FileText className="h-4 w-4" />
                利用規約
              </Link>
              <Link
                href="/privacy"
                className="flex items-center gap-2 text-sm text-gray-600 hover:text-blue-600 hover:underline transition-colors"
              >
                <Shield className="h-4 w-4" />
                プライバシーポリシー
              </Link>
            </nav>
          </div>

          {/* 技術情報 */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">技術情報</h3>
            <div className="space-y-2">
              <div className="text-sm text-gray-600">
                <strong>対応決済サービス:</strong>
              </div>
              <div className="flex flex-wrap gap-2">
                <span className="inline-flex items-center px-2 py-1 rounded text-xs bg-[#635bff] text-white">
                  Stripe
                </span>
                <span className="inline-flex items-center px-2 py-1 rounded text-xs bg-[#0070ba] text-white">
                  PayPal
                </span>
                <span className="inline-flex items-center px-2 py-1 rounded text-xs bg-gray-500 text-white">
                  Square
                </span>
                <span className="inline-flex items-center px-2 py-1 rounded text-xs bg-green-600 text-white">
                  PayPay
                </span>
                <span className="inline-flex items-center px-2 py-1 rounded text-xs bg-blue-600 text-white">
                  fincode
                </span>
              </div>
              <div className="text-xs text-gray-500 mt-2">
                <strong>セキュリティ:</strong> PCI DSS準拠・SSL暗号化
              </div>
            </div>
          </div>
        </div>

        {/* 下部セクション */}
        <div className="border-t border-gray-200 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center">
          <div className="text-sm text-gray-500 mb-4 md:mb-0">
            © {currentYear} 決済リンク管理システム. All rights reserved.
          </div>

          <div className="flex items-center gap-4">
            <div className="text-xs text-gray-400">
              Built with Next.js & TypeScript
            </div>
            <div className="text-xs text-gray-400">
              Version 1.0.0
            </div>
          </div>
        </div>

        {/* セキュリティ・コンプライアンス情報 */}
        <div className="mt-6 pt-6 border-t border-gray-100">
          <div className="text-center">
            <p className="text-xs text-gray-400 mb-2">
              このサービスは個人情報保護法・決済業務法に準拠して運営されています
            </p>
            <div className="flex justify-center items-center gap-4 text-xs text-gray-400">
              <span>🔒 SSL暗号化</span>
              <span>🛡️ PCI DSS準拠</span>
              <span>🇯🇵 日本国内サーバー</span>
              <span>📊 定期セキュリティ監査</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}