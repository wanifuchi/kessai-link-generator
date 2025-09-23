'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Shield,
  Lock,
  Eye,
  Database,
  FileText,
  Calendar,
  Mail,
  AlertTriangle,
  CheckCircle,
  Globe,
  Server,
  Users
} from 'lucide-react';

const PrivacyPolicyPage = () => {
  const lastUpdated = '2024年1月15日';

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* ヘッダー */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-3 bg-green-100 rounded-lg">
              <Shield className="h-8 w-8 text-green-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">プライバシーポリシー</h1>
              <p className="text-gray-600 mt-2">
                個人情報の取り扱いについて
              </p>
            </div>
          </div>
          <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
            <Calendar className="h-4 w-4" />
            <span>最終更新: {lastUpdated}</span>
          </div>
        </div>

        <div className="space-y-8">
          {/* 基本方針 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                基本方針
              </CardTitle>
              <CardDescription>
                当社の個人情報保護に対する基本的な考え方
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-700">
                決済リンク管理システム（以下「当サービス」）を運営する当社は、ご利用者様の個人情報の重要性を深く認識し、
                個人情報の保護に関する法律（個人情報保護法）、その他関連法令を遵守し、
                適切な個人情報の取り扱いを行います。
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-lg">
                  <Lock className="h-5 w-5 text-blue-600 mt-1" />
                  <div>
                    <h3 className="font-medium text-blue-900">最高水準のセキュリティ</h3>
                    <p className="text-sm text-blue-800">SSL暗号化、PCI DSS準拠</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-4 bg-green-50 rounded-lg">
                  <Eye className="h-5 w-5 text-green-600 mt-1" />
                  <div>
                    <h3 className="font-medium text-green-900">透明性の確保</h3>
                    <p className="text-sm text-green-800">利用目的の明確化</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-4 bg-purple-50 rounded-lg">
                  <Users className="h-5 w-5 text-purple-600 mt-1" />
                  <div>
                    <h3 className="font-medium text-purple-900">利用者の権利保護</h3>
                    <p className="text-sm text-purple-800">開示・削除請求への対応</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 収集する情報 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5 text-blue-600" />
                収集する個人情報
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">アカウント情報</h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>メールアドレス（ログイン・通知用）</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>氏名（本人確認・請求書発行用）</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>パスワード（暗号化して保存）</span>
                    </li>
                  </ul>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold">決済関連情報</h3>
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-start gap-2 mb-2">
                    <AlertTriangle className="h-4 w-4 text-yellow-600 mt-1" />
                    <span className="text-sm font-medium text-yellow-800">重要</span>
                  </div>
                  <p className="text-sm text-yellow-800 mb-3">
                    クレジットカード情報は当社では一切保存いたしません。
                    すべて各決済サービスプロバイダー（Stripe、PayPal等）のセキュアな環境で処理されます。
                  </p>
                  <ul className="space-y-2 text-sm text-yellow-800">
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>決済履歴・取引記録</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>請求先住所（請求書発行時のみ）</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>API設定情報（暗号化して保存）</span>
                    </li>
                  </ul>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold">技術情報</h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>IPアドレス（セキュリティ目的）</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>ブラウザ情報（サポート目的）</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>ログイン履歴（不正アクセス検知）</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>Cookieによる認証状態管理</span>
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 利用目的 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-purple-600" />
                個人情報の利用目的
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">サービス提供</h3>
                  <ul className="space-y-2 text-sm">
                    <li>✓ 決済リンクの作成・管理</li>
                    <li>✓ 取引履歴の提供</li>
                    <li>✓ API機能の提供</li>
                    <li>✓ アカウント管理</li>
                  </ul>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">サポート・コミュニケーション</h3>
                  <ul className="space-y-2 text-sm">
                    <li>✓ カスタマーサポート</li>
                    <li>✓ 重要なお知らせ</li>
                    <li>✓ サービス改善のためのご連絡</li>
                    <li>✓ セキュリティ通知</li>
                  </ul>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">セキュリティ・コンプライアンス</h3>
                  <ul className="space-y-2 text-sm">
                    <li>✓ 不正利用の検知・防止</li>
                    <li>✓ 本人確認</li>
                    <li>✓ 法的義務の遵守</li>
                    <li>✓ 監査対応</li>
                  </ul>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">サービス改善</h3>
                  <ul className="space-y-2 text-sm">
                    <li>✓ 利用状況の分析（匿名化）</li>
                    <li>✓ 新機能の開発</li>
                    <li>✓ パフォーマンスの最適化</li>
                    <li>✓ ユーザビリティの向上</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 第三者提供 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5 text-orange-600" />
                第三者への提供
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <h3 className="font-medium text-red-900 mb-2">基本原則</h3>
                <p className="text-sm text-red-800">
                  当社は、以下の場合を除き、ご本人の同意なく個人情報を第三者に提供いたしません。
                </p>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold">提供する場合</h3>
                <div className="space-y-3">
                  <div className="border-l-4 border-blue-500 pl-4">
                    <h4 className="font-medium">決済サービスプロバイダー</h4>
                    <p className="text-sm text-gray-600">
                      Stripe、PayPal、Square等への決済処理に必要な情報の提供
                    </p>
                  </div>
                  <div className="border-l-4 border-green-500 pl-4">
                    <h4 className="font-medium">法的要請</h4>
                    <p className="text-sm text-gray-600">
                      法令に基づく開示要求、裁判所命令等による場合
                    </p>
                  </div>
                  <div className="border-l-4 border-yellow-500 pl-4">
                    <h4 className="font-medium">委託業務</h4>
                    <p className="text-sm text-gray-600">
                      サーバー管理、システム保守等の委託先（厳格な秘密保持契約下）
                    </p>
                  </div>
                  <div className="border-l-4 border-purple-500 pl-4">
                    <h4 className="font-medium">事業承継</h4>
                    <p className="text-sm text-gray-600">
                      事業譲渡、合併等により事業が承継される場合
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* データ保存・セキュリティ */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Server className="h-5 w-5 text-indigo-600" />
                データの保存・セキュリティ
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">保存場所</h3>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-center gap-2">
                        <Badge className="bg-green-600">🇯🇵</Badge>
                        <span>日本国内データセンター</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Badge className="bg-blue-600">AWS</Badge>
                        <span>Amazon Web Services（東京リージョン）</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Badge className="bg-purple-600">Backup</Badge>
                        <span>暗号化バックアップ（国内のみ）</span>
                      </li>
                    </ul>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">セキュリティ対策</h3>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-center gap-2">
                        <Lock className="h-4 w-4 text-green-600" />
                        <span>SSL/TLS暗号化通信</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Lock className="h-4 w-4 text-green-600" />
                        <span>データベース暗号化</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Lock className="h-4 w-4 text-green-600" />
                        <span>アクセス制御・ログ監視</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Lock className="h-4 w-4 text-green-600" />
                        <span>定期的なセキュリティ監査</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold">保存期間</h3>
                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span>アカウント情報</span>
                      <span className="font-medium">退会から3年</span>
                    </div>
                    <div className="flex justify-between">
                      <span>取引履歴</span>
                      <span className="font-medium">法定保存期間（7年）</span>
                    </div>
                    <div className="flex justify-between">
                      <span>ログ情報</span>
                      <span className="font-medium">1年</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Cookie</span>
                      <span className="font-medium">最大2年</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 利用者の権利 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-green-600" />
                利用者の権利
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <p className="text-gray-700">
                個人情報保護法に基づき、以下の権利を行使いただけます。
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="border rounded-lg p-4">
                    <h4 className="font-medium flex items-center gap-2 mb-2">
                      <Eye className="h-4 w-4 text-blue-600" />
                      開示請求
                    </h4>
                    <p className="text-sm text-gray-600">
                      保有する個人情報の開示を請求できます
                    </p>
                  </div>

                  <div className="border rounded-lg p-4">
                    <h4 className="font-medium flex items-center gap-2 mb-2">
                      <FileText className="h-4 w-4 text-green-600" />
                      訂正・追加請求
                    </h4>
                    <p className="text-sm text-gray-600">
                      不正確な情報の訂正・追加を請求できます
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="border rounded-lg p-4">
                    <h4 className="font-medium flex items-center gap-2 mb-2">
                      <AlertTriangle className="h-4 w-4 text-red-600" />
                      削除請求
                    </h4>
                    <p className="text-sm text-gray-600">
                      個人情報の削除を請求できます
                    </p>
                  </div>

                  <div className="border rounded-lg p-4">
                    <h4 className="font-medium flex items-center gap-2 mb-2">
                      <Lock className="h-4 w-4 text-purple-600" />
                      利用停止請求
                    </h4>
                    <p className="text-sm text-gray-600">
                      個人情報の利用停止を請求できます
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 mb-2">請求方法</h4>
                <p className="text-sm text-blue-800 mb-3">
                  以下の方法でご請求ください。本人確認のため、身分証明書の提示をお願いする場合があります。
                </p>
                <ul className="space-y-1 text-sm text-blue-800">
                  <li>• メール: privacy@kessai-link.com</li>
                  <li>• 管理画面: アカウント設定 &gt; プライバシー設定</li>
                  <li>• 郵送: 〒100-0001 東京都千代田区千代田1-1-1</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Cookie・トラッキング */}
          <Card>
            <CardHeader>
              <CardTitle>Cookie・トラッキング技術</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">使用目的</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="border rounded-lg p-4">
                    <h4 className="font-medium">必須Cookie</h4>
                    <p className="text-sm text-gray-600 mt-2">
                      ログイン状態の維持、セキュリティ
                    </p>
                    <Badge className="mt-2 bg-red-600">無効化不可</Badge>
                  </div>
                  <div className="border rounded-lg p-4">
                    <h4 className="font-medium">機能Cookie</h4>
                    <p className="text-sm text-gray-600 mt-2">
                      言語設定、ダッシュボード設定
                    </p>
                    <Badge className="mt-2 bg-blue-600">設定可能</Badge>
                  </div>
                  <div className="border rounded-lg p-4">
                    <h4 className="font-medium">分析Cookie</h4>
                    <p className="text-sm text-gray-600 mt-2">
                      利用状況分析（匿名化済み）
                    </p>
                    <Badge className="mt-2 bg-green-600">オプト可能</Badge>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium mb-2">管理方法</h4>
                <p className="text-sm text-gray-600">
                  Cookie設定は、ブラウザの設定から変更いただけます。
                  ただし、必須Cookieを無効にすると、サービスの一部機能が利用できなくなる場合があります。
                </p>
              </div>
            </CardContent>
          </Card>

          {/* お問い合わせ */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5 text-blue-600" />
                お問い合わせ
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-700">
                個人情報の取り扱いに関するご質問・ご意見は、以下までお気軽にお問い合わせください。
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <h4 className="font-medium">一般的なお問い合わせ</h4>
                  <div className="space-y-2 text-sm">
                    <div>📧 privacy@kessai-link.com</div>
                    <div>📞 03-1234-5678</div>
                    <div>⏰ 平日 9:00-18:00</div>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="font-medium">個人情報保護管理者</h4>
                  <div className="space-y-2 text-sm">
                    <div>部署: 法務・コンプライアンス部</div>
                    <div>📧 dpo@kessai-link.com</div>
                    <div>住所: 〒100-0001 東京都千代田区千代田1-1-1</div>
                  </div>
                </div>
              </div>

              <div className="mt-6 text-center">
                <Button asChild>
                  <a href="mailto:privacy@kessai-link.com" className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    プライバシーに関するお問い合わせ
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* 改定について */}
          <Card>
            <CardHeader>
              <CardTitle>プライバシーポリシーの改定</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-700">
                当社は、法令の改正やサービスの変更等に伴い、本プライバシーポリシーを改定することがあります。
              </p>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h4 className="font-medium text-yellow-900 mb-2">改定時の通知</h4>
                <ul className="space-y-1 text-sm text-yellow-800">
                  <li>• 軽微な変更: Webサイト上での告知</li>
                  <li>• 重要な変更: メール通知 + 30日前の事前告知</li>
                  <li>• 継続利用により、改定後のポリシーに同意したものとみなします</li>
                </ul>
              </div>

              <div className="text-center pt-4">
                <p className="text-sm text-gray-500">
                  最終更新日: {lastUpdated}<br />
                  初回制定日: 2020年4月1日
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicyPage;