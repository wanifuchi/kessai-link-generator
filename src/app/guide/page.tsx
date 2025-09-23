'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  BookOpen,
  Settings,
  Plus,
  CreditCard,
  BarChart3,
  AlertCircle,
  CheckCircle,
  ChevronRight,
  ChevronDown,
  ExternalLink,
  Copy,
  Zap,
  Shield,
  Globe,
  Users,
  Search,
  HelpCircle
} from 'lucide-react';

export default function GuidePage() {
  const [activeSection, setActiveSection] = useState<string>('getting-started');
  const [expandedFaq, setExpandedFaq] = useState<string>('');

  const sections = [
    { id: 'getting-started', title: 'はじめに', icon: BookOpen },
    { id: 'api-setup', title: 'API設定', icon: Settings },
    { id: 'create-link', title: '決済リンク作成', icon: Plus },
    { id: 'dashboard', title: 'ダッシュボード', icon: BarChart3 },
    { id: 'troubleshooting', title: 'トラブルシューティング', icon: AlertCircle },
    { id: 'faq', title: 'よくある質問', icon: HelpCircle }
  ];

  const faqs = [
    {
      id: 'security',
      question: 'API キーは安全に保存されますか？',
      answer: 'はい、すべてのAPI キーは暗号化されてデータベースに保存されます。また、通信はSSL/TLSで暗号化されており、セキュリティを最優先に設計されています。'
    },
    {
      id: 'fees',
      question: '手数料はかかりますか？',
      answer: 'このシステム自体に手数料はかかりません。決済サービス（Stripe、PayPalなど）の手数料のみが適用されます。各サービスの手数料については、それぞれの公式サイトをご確認ください。'
    },
    {
      id: 'limits',
      question: '作成できる決済リンクに制限はありますか？',
      answer: '現在、作成できる決済リンクの数に制限はありません。ただし、パフォーマンス維持のため、将来的に制限を設ける可能性があります。'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-7xl">
        {/* ヘッダー */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <BookOpen className="h-8 w-8 text-blue-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">利用ガイド</h1>
              <p className="text-gray-600">決済リンク管理システムの使用方法を詳しく説明します</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* サイドバーナビゲーション */}
          <div className="lg:col-span-1">
            <Card className="sticky top-8">
              <CardHeader>
                <CardTitle className="text-lg">目次</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <nav className="space-y-1">
                  {sections.map((section) => {
                    const IconComponent = section.icon;
                    return (
                      <button
                        key={section.id}
                        onClick={() => setActiveSection(section.id)}
                        className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
                          activeSection === section.id
                            ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-500'
                            : 'text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        <IconComponent className="h-5 w-5" />
                        <span className="font-medium">{section.title}</span>
                      </button>
                    );
                  })}
                </nav>
              </CardContent>
            </Card>
          </div>

          {/* メインコンテンツ */}
          <div className="lg:col-span-3 space-y-8">
            {/* はじめに */}
            {activeSection === 'getting-started' && (
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BookOpen className="h-6 w-6 text-blue-600" />
                      はじめに
                    </CardTitle>
                    <CardDescription>
                      決済リンク管理システムの概要と基本的な流れをご説明します
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold mb-3">このシステムでできること</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex items-start gap-3 p-4 bg-green-50 rounded-lg">
                          <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                          <div>
                            <h4 className="font-medium text-green-800">簡単な決済リンク作成</h4>
                            <p className="text-sm text-green-700">商品情報を入力するだけで、すぐに決済リンクを生成</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-lg">
                          <BarChart3 className="h-5 w-5 text-blue-600 mt-0.5" />
                          <div>
                            <h4 className="font-medium text-blue-800">売上分析</h4>
                            <p className="text-sm text-blue-700">リアルタイムで売上データと統計を確認</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3 p-4 bg-purple-50 rounded-lg">
                          <Globe className="h-5 w-5 text-purple-600 mt-0.5" />
                          <div>
                            <h4 className="font-medium text-purple-800">複数決済サービス対応</h4>
                            <p className="text-sm text-purple-700">Stripe、PayPal、Square、PayPay、fincodeに対応</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3 p-4 bg-orange-50 rounded-lg">
                          <Shield className="h-5 w-5 text-orange-600 mt-0.5" />
                          <div>
                            <h4 className="font-medium text-orange-800">安全性</h4>
                            <p className="text-sm text-orange-700">SSL暗号化・PCI DSS準拠の高いセキュリティ</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold mb-3">基本的な流れ</h3>
                      <div className="space-y-4">
                        <div className="flex items-center gap-4">
                          <div className="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-semibold">
                            1
                          </div>
                          <div>
                            <h4 className="font-medium">API設定</h4>
                            <p className="text-sm text-gray-600">使用したい決済サービスのAPI認証情報を設定</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-semibold">
                            2
                          </div>
                          <div>
                            <h4 className="font-medium">決済リンク作成</h4>
                            <p className="text-sm text-gray-600">商品情報を入力して決済リンクを生成</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-semibold">
                            3
                          </div>
                          <div>
                            <h4 className="font-medium">リンク共有</h4>
                            <p className="text-sm text-gray-600">生成されたリンクを顧客に共有</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-semibold">
                            4
                          </div>
                          <div>
                            <h4 className="font-medium">売上確認</h4>
                            <p className="text-sm text-gray-600">ダッシュボードで決済状況を確認</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* API設定 */}
            {activeSection === 'api-setup' && (
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Settings className="h-6 w-6 text-blue-600" />
                      API設定
                    </CardTitle>
                    <CardDescription>
                      決済サービスのAPI認証情報を設定する方法
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <div className="flex">
                        <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5 mr-3" />
                        <div>
                          <h4 className="font-medium text-yellow-800">重要</h4>
                          <p className="text-sm text-yellow-700 mt-1">
                            API キーは機密情報です。第三者と共有せず、安全に管理してください。
                          </p>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold mb-4">Stripe の設定手順</h3>
                      <div className="space-y-4">
                        <div className="border-l-4 border-blue-500 pl-4">
                          <h4 className="font-medium">1. Stripe ダッシュボードにアクセス</h4>
                          <p className="text-sm text-gray-600">
                            <a href="https://dashboard.stripe.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                              https://dashboard.stripe.com
                            </a> にログインします。
                          </p>
                        </div>
                        <div className="border-l-4 border-blue-500 pl-4">
                          <h4 className="font-medium">2. API キーを取得</h4>
                          <p className="text-sm text-gray-600">
                            「開発者」→「API キー」から、公開可能キーと秘密キーをコピーします。
                          </p>
                        </div>
                        <div className="border-l-4 border-blue-500 pl-4">
                          <h4 className="font-medium">3. システムに設定</h4>
                          <p className="text-sm text-gray-600">
                            <a href="/settings" className="text-blue-600 hover:underline">API設定ページ</a>
                            でStripeを選択し、取得したキーを入力します。
                          </p>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold mb-4">PayPal の設定手順</h3>
                      <div className="space-y-4">
                        <div className="border-l-4 border-[#0070ba] pl-4">
                          <h4 className="font-medium">1. PayPal Developer にアクセス</h4>
                          <p className="text-sm text-gray-600">
                            <a href="https://developer.paypal.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                              https://developer.paypal.com
                            </a> にログインします。
                          </p>
                        </div>
                        <div className="border-l-4 border-[#0070ba] pl-4">
                          <h4 className="font-medium">2. アプリケーションを作成</h4>
                          <p className="text-sm text-gray-600">
                            「My Apps & Credentials」でアプリを作成し、Client ID と Secret を取得します。
                          </p>
                        </div>
                        <div className="border-l-4 border-[#0070ba] pl-4">
                          <h4 className="font-medium">3. システムに設定</h4>
                          <p className="text-sm text-gray-600">
                            API設定ページでPayPalを選択し、取得した認証情報を入力します。
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* 決済リンク作成 */}
            {activeSection === 'create-link' && (
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Plus className="h-6 w-6 text-blue-600" />
                      決済リンク作成
                    </CardTitle>
                    <CardDescription>
                      商品やサービスの決済リンクを作成する方法
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold mb-4">作成手順</h3>
                      <div className="space-y-4">
                        <div className="bg-gray-50 rounded-lg p-4">
                          <h4 className="font-medium mb-2">1. 基本情報の入力</h4>
                          <div className="text-sm text-gray-600 space-y-2">
                            <p><strong>商品・サービス名:</strong> 顧客に表示される名前を入力</p>
                            <p><strong>説明:</strong> 商品の詳細説明（任意）</p>
                            <p><strong>金額:</strong> 決済金額を入力（税込み）</p>
                            <p><strong>通貨:</strong> JPY（日本円）、USD（米ドル）など</p>
                          </div>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-4">
                          <h4 className="font-medium mb-2">2. API設定の選択</h4>
                          <p className="text-sm text-gray-600">
                            事前に設定したAPI設定を選択します。複数の決済サービスを設定している場合は、任意のものを選択できます。
                          </p>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-4">
                          <h4 className="font-medium mb-2">3. プレビューと作成</h4>
                          <p className="text-sm text-gray-600">
                            入力内容をプレビューで確認し、「決済リンクを作成」ボタンをクリックします。
                          </p>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold mb-4">作成後の操作</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="border rounded-lg p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <Copy className="h-4 w-4 text-blue-600" />
                            <h4 className="font-medium">リンクのコピー</h4>
                          </div>
                          <p className="text-sm text-gray-600">
                            生成されたリンクをワンクリックでクリップボードにコピーできます。
                          </p>
                        </div>
                        <div className="border rounded-lg p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <ExternalLink className="h-4 w-4 text-blue-600" />
                            <h4 className="font-medium">リンクの確認</h4>
                          </div>
                          <p className="text-sm text-gray-600">
                            決済ページを実際に開いて、表示内容を確認できます。
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* ダッシュボード */}
            {activeSection === 'dashboard' && (
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="h-6 w-6 text-blue-600" />
                      ダッシュボード
                    </CardTitle>
                    <CardDescription>
                      売上データと統計情報の確認方法
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold mb-4">主要な機能</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="border rounded-lg p-4">
                          <h4 className="font-medium mb-2">📊 売上統計</h4>
                          <p className="text-sm text-gray-600">
                            総売上、取引回数、平均単価などの主要指標をリアルタイムで表示
                          </p>
                        </div>
                        <div className="border rounded-lg p-4">
                          <h4 className="font-medium mb-2">📈 グラフ表示</h4>
                          <p className="text-sm text-gray-600">
                            売上推移、決済サービス別統計をグラフで視覚的に表示
                          </p>
                        </div>
                        <div className="border rounded-lg p-4">
                          <h4 className="font-medium mb-2">📋 決済リンク一覧</h4>
                          <p className="text-sm text-gray-600">
                            作成した決済リンクの状況と取引履歴を一覧で確認
                          </p>
                        </div>
                        <div className="border rounded-lg p-4">
                          <h4 className="font-medium mb-2">🔍 検索・フィルター</h4>
                          <p className="text-sm text-gray-600">
                            期間、決済サービス、ステータスでデータを絞り込み
                          </p>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold mb-4">データの見方</h3>
                      <div className="space-y-4">
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                          <h4 className="font-medium text-blue-800 mb-2">ステータスの意味</h4>
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <Badge className="bg-green-100 text-green-800">アクティブ</Badge>
                              <span className="text-sm">決済リンクが有効で、決済を受け付け中</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge className="bg-blue-100 text-blue-800">完了</Badge>
                              <span className="text-sm">決済が完了済み</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge className="bg-gray-100 text-gray-800">期限切れ</Badge>
                              <span className="text-sm">設定した有効期限が過ぎている</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* トラブルシューティング */}
            {activeSection === 'troubleshooting' && (
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <AlertCircle className="h-6 w-6 text-orange-600" />
                      トラブルシューティング
                    </CardTitle>
                    <CardDescription>
                      よくある問題と解決方法
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold mb-4">決済リンクが作成できない</h3>
                      <div className="space-y-3">
                        <div className="border-l-4 border-red-500 pl-4">
                          <h4 className="font-medium text-red-800">API設定が見つからない</h4>
                          <p className="text-sm text-gray-600">
                            <a href="/settings" className="text-blue-600 hover:underline">API設定ページ</a>
                            で決済サービスの認証情報が正しく設定されているか確認してください。
                          </p>
                        </div>
                        <div className="border-l-4 border-red-500 pl-4">
                          <h4 className="font-medium text-red-800">APIキーが無効</h4>
                          <p className="text-sm text-gray-600">
                            各決済サービスのダッシュボードで、APIキーが正しく、有効であることを確認してください。
                          </p>
                        </div>
                        <div className="border-l-4 border-red-500 pl-4">
                          <h4 className="font-medium text-red-800">金額の形式エラー</h4>
                          <p className="text-sm text-gray-600">
                            金額は正の数値で入力してください。カンマや特殊文字は自動で処理されます。
                          </p>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold mb-4">決済が完了しない</h3>
                      <div className="space-y-3">
                        <div className="border-l-4 border-orange-500 pl-4">
                          <h4 className="font-medium text-orange-800">決済サービス側の問題</h4>
                          <p className="text-sm text-gray-600">
                            Stripe、PayPalなどの決済サービス側で障害が発生している可能性があります。各サービスのステータスページを確認してください。
                          </p>
                        </div>
                        <div className="border-l-4 border-orange-500 pl-4">
                          <h4 className="font-medium text-orange-800">カード情報の問題</h4>
                          <p className="text-sm text-gray-600">
                            顧客のクレジットカード情報が正しくない、または残高不足の可能性があります。
                          </p>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold mb-4">データが表示されない</h3>
                      <div className="space-y-3">
                        <div className="border-l-4 border-blue-500 pl-4">
                          <h4 className="font-medium text-blue-800">データ同期の遅延</h4>
                          <p className="text-sm text-gray-600">
                            決済データの反映には数分かかる場合があります。しばらく待ってからページを再読み込みしてください。
                          </p>
                        </div>
                        <div className="border-l-4 border-blue-500 pl-4">
                          <h4 className="font-medium text-blue-800">期間設定の確認</h4>
                          <p className="text-sm text-gray-600">
                            ダッシュボードの期間設定が適切であることを確認してください。
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* よくある質問 */}
            {activeSection === 'faq' && (
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <HelpCircle className="h-6 w-6 text-blue-600" />
                      よくある質問
                    </CardTitle>
                    <CardDescription>
                      ユーザーからよく寄せられる質問とその回答
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {faqs.map((faq) => (
                      <div key={faq.id} className="border border-gray-200 rounded-lg">
                        <button
                          onClick={() => setExpandedFaq(expandedFaq === faq.id ? '' : faq.id)}
                          className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 transition-colors"
                        >
                          <span className="font-medium">{faq.question}</span>
                          {expandedFaq === faq.id ? (
                            <ChevronDown className="h-5 w-5 text-gray-500" />
                          ) : (
                            <ChevronRight className="h-5 w-5 text-gray-500" />
                          )}
                        </button>
                        {expandedFaq === faq.id && (
                          <div className="px-4 pb-4 text-sm text-gray-600 border-t border-gray-100">
                            <div className="pt-4">{faq.answer}</div>
                          </div>
                        )}
                      </div>
                    ))}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>さらにサポートが必要ですか？</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg">
                        <HelpCircle className="h-8 w-8 text-blue-600" />
                        <div>
                          <h4 className="font-medium">ヘルプページ</h4>
                          <p className="text-sm text-gray-600">より詳しいFAQとサポート情報</p>
                          <a href="/help" className="text-blue-600 hover:underline text-sm">
                            ヘルプページを見る →
                          </a>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 p-4 bg-green-50 rounded-lg">
                        <Users className="h-8 w-8 text-green-600" />
                        <div>
                          <h4 className="font-medium">お問い合わせ</h4>
                          <p className="text-sm text-gray-600">メールでのサポート</p>
                          <a href="mailto:support@kessai-link.com" className="text-green-600 hover:underline text-sm">
                            support@kessai-link.com
                          </a>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}