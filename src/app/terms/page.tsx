'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Scale,
  AlertTriangle,
  Shield,
  CreditCard,
  Users,
  FileText,
  Calendar,
  Mail,
  CheckCircle,
  XCircle,
  Info,
  Gavel
} from 'lucide-react';

const TermsOfServicePage = () => {
  const lastUpdated = '2024年1月15日';

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* ヘッダー */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Scale className="h-8 w-8 text-blue-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">利用規約</h1>
              <p className="text-gray-600 mt-2">
                決済リンク管理システムの利用条件
              </p>
            </div>
          </div>
          <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
            <Calendar className="h-4 w-4" />
            <span>最終更新: {lastUpdated}</span>
          </div>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">概要</TabsTrigger>
            <TabsTrigger value="usage">利用条件</TabsTrigger>
            <TabsTrigger value="payment">決済・料金</TabsTrigger>
            <TabsTrigger value="responsibilities">責任・免責</TabsTrigger>
            <TabsTrigger value="legal">法的事項</TabsTrigger>
          </TabsList>

          {/* 概要 */}
          <TabsContent value="overview" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Info className="h-5 w-5 text-blue-600" />
                  利用規約について
                </CardTitle>
                <CardDescription>
                  本規約の概要と適用範囲
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="font-medium text-blue-900 mb-2">重要事項</h3>
                  <p className="text-sm text-blue-800">
                    本サービスをご利用いただく前に、必ず本利用規約をお読みいただき、
                    内容に同意の上でサービスをご利用ください。
                    サービスの利用開始により、本規約に同意したものとみなします。
                  </p>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">適用範囲</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="border rounded-lg p-4">
                      <h4 className="font-medium flex items-center gap-2 mb-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        対象者
                      </h4>
                      <ul className="text-sm text-gray-600 space-y-1">
                        <li>• 個人事業主・法人のお客様</li>
                        <li>• 18歳以上の個人</li>
                        <li>• 日本国内在住・所在</li>
                      </ul>
                    </div>

                    <div className="border rounded-lg p-4">
                      <h4 className="font-medium flex items-center gap-2 mb-2">
                        <CreditCard className="h-4 w-4 text-blue-600" />
                        対象サービス
                      </h4>
                      <ul className="text-sm text-gray-600 space-y-1">
                        <li>• 決済リンク作成・管理</li>
                        <li>• 取引履歴・分析</li>
                        <li>• API機能</li>
                        <li>• カスタマーサポート</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">用語の定義</h3>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="space-y-3 text-sm">
                      <div className="grid grid-cols-3 gap-4">
                        <span className="font-medium">「当社」</span>
                        <span className="col-span-2">決済リンク管理システムを運営する事業者</span>
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                        <span className="font-medium">「利用者」</span>
                        <span className="col-span-2">本サービスを利用する個人または法人</span>
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                        <span className="font-medium">「決済リンク」</span>
                        <span className="col-span-2">当サービスで作成された決済用URL</span>
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                        <span className="font-medium">「決済サービス」</span>
                        <span className="col-span-2">Stripe、PayPal等の第三者決済プロバイダー</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 利用条件 */}
          <TabsContent value="usage" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-green-600" />
                  アカウント・利用条件
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">アカウント登録</h3>
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <h4 className="font-medium text-green-900 mb-2">利用条件</h4>
                    <ul className="space-y-2 text-sm text-green-800">
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4" />
                        <span>18歳以上であること</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4" />
                        <span>正確な情報を提供すること</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4" />
                        <span>法人の場合は適切な権限を有すること</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4" />
                        <span>反社会的勢力と関係がないこと</span>
                      </li>
                    </ul>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">利用者の義務</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <h4 className="font-medium">セキュリティ</h4>
                      <ul className="space-y-2 text-sm">
                        <li className="flex items-center gap-2">
                          <Shield className="h-4 w-4 text-blue-600" />
                          <span>パスワードの適切な管理</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <Shield className="h-4 w-4 text-blue-600" />
                          <span>不正アクセスの防止</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <Shield className="h-4 w-4 text-blue-600" />
                          <span>第三者への認証情報提供禁止</span>
                        </li>
                      </ul>
                    </div>

                    <div className="space-y-3">
                      <h4 className="font-medium">適切な利用</h4>
                      <ul className="space-y-2 text-sm">
                        <li className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          <span>合法な商品・サービスのみ</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          <span>正確な商品説明</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          <span>適切な価格設定</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">禁止行為</h3>
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-medium text-red-900 mb-2">違法・有害行為</h4>
                        <ul className="space-y-1 text-sm text-red-800">
                          <li>• 違法商品・サービスの販売</li>
                          <li>• 詐欺・マネーロンダリング</li>
                          <li>• 知的財産権の侵害</li>
                          <li>• 第三者への迷惑行為</li>
                        </ul>
                      </div>
                      <div>
                        <h4 className="font-medium text-red-900 mb-2">技術的侵害</h4>
                        <ul className="space-y-1 text-sm text-red-800">
                          <li>• システムへの不正アクセス</li>
                          <li>• リバースエンジニアリング</li>
                          <li>• 過度なAPI利用</li>
                          <li>• ウイルス・マルウェアの配布</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 決済・料金 */}
          <TabsContent value="payment" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-blue-600" />
                  決済・料金体系
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">手数料体系</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="border rounded-lg p-4">
                      <h4 className="font-medium mb-2">基本料金</h4>
                      <div className="text-2xl font-bold text-green-600 mb-2">無料</div>
                      <p className="text-sm text-gray-600">
                        アカウント作成・基本機能の利用
                      </p>
                    </div>

                    <div className="border rounded-lg p-4">
                      <h4 className="font-medium mb-2">決済手数料</h4>
                      <div className="text-lg font-bold text-blue-600 mb-2">3.6%</div>
                      <p className="text-sm text-gray-600">
                        成功した決済に対してのみ課金
                      </p>
                    </div>

                    <div className="border rounded-lg p-4">
                      <h4 className="font-medium mb-2">返金手数料</h4>
                      <div className="text-lg font-bold text-orange-600 mb-2">100円</div>
                      <p className="text-sm text-gray-600">
                        返金処理1件あたり
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">支払い条件</h3>
                  <div className="bg-blue-50 rounded-lg p-4">
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between">
                        <span className="font-medium">支払いタイミング</span>
                        <span>決済完了時に自動引き落とし</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium">引き落とし方法</span>
                        <span>決済金額から手数料を差し引いて振込</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium">振込サイクル</span>
                        <span>翌営業日（Stripe）/ 翌々営業日（PayPal）</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium">最低振込額</span>
                        <span>1,000円以上</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">チャージバック・返金</h3>
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <h4 className="font-medium text-yellow-900 mb-2">重要事項</h4>
                    <ul className="space-y-2 text-sm text-yellow-800">
                      <li>• チャージバックが発生した場合、該当金額と手数料を利用者に請求</li>
                      <li>• 返金は原則として利用者の責任で処理</li>
                      <li>• 不正利用が疑われる場合、アカウントを一時停止する場合がある</li>
                      <li>• 手数料の返金は原則として行わない</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 責任・免責 */}
          <TabsContent value="responsibilities" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-orange-600" />
                  責任の制限・免責事項
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">当社の責任範囲</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <h4 className="font-medium text-green-900 mb-2 flex items-center gap-2">
                        <CheckCircle className="h-4 w-4" />
                        当社が責任を負う事項
                      </h4>
                      <ul className="space-y-1 text-sm text-green-800">
                        <li>• サービスの提供</li>
                        <li>• システムの維持・管理</li>
                        <li>• 個人情報の適切な管理</li>
                        <li>• 故意・重過失による損害</li>
                      </ul>
                    </div>

                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <h4 className="font-medium text-red-900 mb-2 flex items-center gap-2">
                        <XCircle className="h-4 w-4" />
                        免責事項
                      </h4>
                      <ul className="space-y-1 text-sm text-red-800">
                        <li>• 決済サービスの障害</li>
                        <li>• 利用者間のトラブル</li>
                        <li>• 第三者による不正行為</li>
                        <li>• 利用者の操作ミス</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">サービス保証</h3>
                  <div className="bg-blue-50 rounded-lg p-4">
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between">
                        <span className="font-medium">稼働率保証</span>
                        <span>99.9%（計画メンテナンス除く）</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium">データバックアップ</span>
                        <span>日次バックアップ・7日間保持</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium">障害対応</span>
                        <span>24時間以内の復旧目標</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium">サポート</span>
                        <span>平日9:00-18:00</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">損害賠償の制限</h3>
                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                    <h4 className="font-medium text-orange-900 mb-2">賠償責任の上限</h4>
                    <p className="text-sm text-orange-800 mb-3">
                      当社の責任に起因する損害賠償の上限は、以下のいずれか低い金額とします：
                    </p>
                    <ul className="space-y-1 text-sm text-orange-800">
                      <li>• 利用者が過去12ヶ月間に支払った手数料の総額</li>
                      <li>• 当該損害が発生した月の手数料の12倍</li>
                      <li>• 100万円</li>
                    </ul>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">利用者の責任</h3>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-start gap-2">
                        <AlertTriangle className="h-4 w-4 text-yellow-600 mt-1" />
                        <span>商品・サービスの品質・納期等についてはお客様が責任を負います</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <AlertTriangle className="h-4 w-4 text-yellow-600 mt-1" />
                        <span>法令遵守はお客様の責任です</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <AlertTriangle className="h-4 w-4 text-yellow-600 mt-1" />
                        <span>第三者との紛争解決はお客様にて対応ください</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <AlertTriangle className="h-4 w-4 text-yellow-600 mt-1" />
                        <span>税務申告等の義務はお客様が負担します</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 法的事項 */}
          <TabsContent value="legal" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Gavel className="h-5 w-5 text-purple-600" />
                  法的事項・その他
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">規約の変更</h3>
                  <div className="bg-blue-50 rounded-lg p-4">
                    <h4 className="font-medium text-blue-900 mb-2">変更手続き</h4>
                    <div className="space-y-2 text-sm text-blue-800">
                      <div className="flex items-start gap-2">
                        <Badge className="bg-blue-600 text-xs">軽微な変更</Badge>
                        <span>Webサイト上での告知のみ</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <Badge className="bg-orange-600 text-xs">重要な変更</Badge>
                        <span>30日前の事前通知 + メール通知</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <Badge className="bg-red-600 text-xs">不利益変更</Badge>
                        <span>個別同意取得または合理的期間での解約機会提供</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">アカウント停止・解約</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <h4 className="font-medium">利用者による解約</h4>
                      <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                        <ul className="space-y-1 text-sm text-green-800">
                          <li>• いつでも解約可能</li>
                          <li>• 管理画面から手続き</li>
                          <li>• データは30日間保持</li>
                          <li>• 手数料の返金なし</li>
                        </ul>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <h4 className="font-medium">当社による停止</h4>
                      <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                        <ul className="space-y-1 text-sm text-red-800">
                          <li>• 規約違反時</li>
                          <li>• 不正利用の疑い</li>
                          <li>• 支払い遅延</li>
                          <li>• 事前通知は原則30日</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">知的財産権</h3>
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                    <div className="space-y-3 text-sm text-purple-800">
                      <p>
                        <strong>当社の権利：</strong>
                        サービス名称、ロゴ、システム、ドキュメント等の知的財産権は当社に帰属
                      </p>
                      <p>
                        <strong>利用者の権利：</strong>
                        お客様が作成されたコンテンツの知的財産権はお客様に帰属
                      </p>
                      <p>
                        <strong>利用許諾：</strong>
                        サービス提供に必要な範囲で相互に利用許諾を行う
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">準拠法・管轄裁判所</h3>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="font-medium">準拠法</span>
                        <span>日本国法</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium">管轄裁判所</span>
                        <span>東京地方裁判所を第一審の専属的合意管轄とする</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium">紛争解決</span>
                        <span>まず誠意をもって協議、解決しない場合は裁判所</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">その他</h3>
                  <div className="space-y-3">
                    <div className="border rounded-lg p-4">
                      <h4 className="font-medium mb-2">可分性</h4>
                      <p className="text-sm text-gray-600">
                        本規約の一部が無効となっても、他の条項は有効に存続します。
                      </p>
                    </div>

                    <div className="border rounded-lg p-4">
                      <h4 className="font-medium mb-2">存続条項</h4>
                      <p className="text-sm text-gray-600">
                        契約終了後も、知的財産権、損害賠償、準拠法等の条項は存続します。
                      </p>
                    </div>

                    <div className="border rounded-lg p-4">
                      <h4 className="font-medium mb-2">言語</h4>
                      <p className="text-sm text-gray-600">
                        本規約の正文は日本語版であり、他言語版は参考訳です。
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* お問い合わせ */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-blue-600" />
              規約に関するお問い合わせ
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-700">
              本利用規約に関するご質問・ご不明な点がございましたら、お気軽にお問い合わせください。
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <h4 className="font-medium">一般的なお問い合わせ</h4>
                <div className="space-y-2 text-sm">
                  <div>📧 legal@kessai-link.com</div>
                  <div>📞 03-1234-5678</div>
                  <div>⏰ 平日 9:00-18:00</div>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-medium">事業者情報</h4>
                <div className="space-y-2 text-sm">
                  <div>会社名: 株式会社決済リンク</div>
                  <div>代表者: 代表取締役 田中太郎</div>
                  <div>所在地: 〒100-0001 東京都千代田区千代田1-1-1</div>
                </div>
              </div>
            </div>

            <div className="mt-6 text-center">
              <Button asChild>
                <a href="mailto:legal@kessai-link.com" className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  法務部門へお問い合わせ
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* フッター */}
        <div className="mt-8 text-center">
          <div className="border-t pt-6">
            <p className="text-sm text-gray-500">
              最終更新日: {lastUpdated}<br />
              初回制定日: 2020年4月1日<br />
              施行日: 2020年4月1日
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TermsOfServicePage;