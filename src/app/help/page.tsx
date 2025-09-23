'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
  HelpCircle,
  Search,
  Mail,
  Phone,
  MessageCircle,
  Clock,
  Users,
  FileText,
  AlertCircle,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  BookOpen,
  Zap,
  Shield,
  CreditCard,
  Settings
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const HelpPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [openFaq, setOpenFaq] = useState<string | null>(null);
  const [contactForm, setContactForm] = useState({
    category: '',
    subject: '',
    message: '',
    email: '',
    priority: 'normal'
  });
  const { toast } = useToast();

  const categories = [
    { id: 'all', name: '全て', icon: HelpCircle },
    { id: 'getting-started', name: '始め方', icon: Zap },
    { id: 'payment', name: '決済・料金', icon: CreditCard },
    { id: 'technical', name: '技術・API', icon: Settings },
    { id: 'security', name: 'セキュリティ', icon: Shield },
    { id: 'account', name: 'アカウント', icon: Users },
    { id: 'troubleshooting', name: 'トラブル', icon: AlertCircle }
  ];

  const faqs = [
    {
      id: '1',
      category: 'getting-started',
      question: 'サービスの利用を開始するには何が必要ですか？',
      answer: 'アカウント登録後、決済サービス（Stripe、PayPal等）のAPI設定を行うだけで利用開始できます。詳細は利用ガイドをご覧ください。',
      tags: ['初期設定', 'API設定']
    },
    {
      id: '2',
      category: 'payment',
      question: '手数料はいくらですか？',
      answer: '成功した決済に対して3.6%の手数料をいただいております。初期費用や月額料金は一切ありません。',
      tags: ['手数料', '料金']
    },
    {
      id: '3',
      category: 'payment',
      question: 'いつ売上金が振り込まれますか？',
      answer: 'Stripeの場合は翌営業日、PayPalの場合は翌々営業日に指定の銀行口座に振り込まれます。',
      tags: ['振込', 'タイミング']
    },
    {
      id: '4',
      category: 'technical',
      question: 'APIの利用制限はありますか？',
      answer: '1分間に100リクエストまでの制限があります。それを超える場合は事前にご相談ください。',
      tags: ['API', '制限']
    },
    {
      id: '5',
      category: 'security',
      question: 'クレジットカード情報は安全ですか？',
      answer: '当社では一切保存せず、PCI DSS準拠の決済プロバイダーで処理されます。SSL暗号化により通信も保護されています。',
      tags: ['セキュリティ', 'カード情報']
    },
    {
      id: '6',
      category: 'account',
      question: 'パスワードを忘れた場合はどうすればよいですか？',
      answer: 'ログイン画面の「パスワードをお忘れの方」からメールアドレスを入力し、送信されたメールの指示に従ってください。',
      tags: ['パスワード', 'リセット']
    },
    {
      id: '7',
      category: 'troubleshooting',
      question: '決済リンクが正しく動作しません',
      answer: 'API設定が正しいか確認し、テストモードで動作確認してください。それでも解決しない場合はサポートまでお問い合わせください。',
      tags: ['エラー', 'デバッグ']
    },
    {
      id: '8',
      category: 'getting-started',
      question: 'テストモードはありますか？',
      answer: 'はい。各決済サービスのテスト環境を利用できます。本番移行前に必ずテストを実行してください。',
      tags: ['テスト', '環境']
    },
    {
      id: '9',
      category: 'payment',
      question: '返金処理はどのように行いますか？',
      answer: 'ダッシュボードから該当の取引を選択し、返金ボタンをクリックします。1件あたり100円の手数料がかかります。',
      tags: ['返金', '処理']
    },
    {
      id: '10',
      category: 'technical',
      question: 'Webhookの設定方法を教えてください',
      answer: 'API設定ページでWebhook URLを登録し、必要なイベントを選択してください。署名検証の実装も推奨します。',
      tags: ['Webhook', '設定']
    }
  ];

  const filteredFaqs = faqs.filter(faq => {
    const matchesCategory = selectedCategory === 'all' || faq.category === selectedCategory;
    const matchesSearch = !searchQuery ||
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesCategory && matchesSearch;
  });

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: 'お問い合わせを送信しました',
      description: '24時間以内にご返答いたします。',
    });
    setContactForm({
      category: '',
      subject: '',
      message: '',
      email: '',
      priority: 'normal'
    });
  };

  const toggleFaq = (faqId: string) => {
    setOpenFaq(openFaq === faqId ? null : faqId);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* ヘッダー */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <HelpCircle className="h-8 w-8 text-blue-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">ヘルプ・サポート</h1>
              <p className="text-gray-600 mt-2">
                お困りのことがございましたらお気軽にお問い合わせください
              </p>
            </div>
          </div>

          {/* クイックアクション */}
          <div className="flex flex-wrap justify-center gap-4 mt-6">
            <Button variant="outline" asChild>
              <a href="/guide" className="flex items-center gap-2">
                <BookOpen className="h-4 w-4" />
                利用ガイド
              </a>
            </Button>
            <Button variant="outline" asChild>
              <a href="/api-docs" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                API仕様
              </a>
            </Button>
            <Button asChild>
              <a href="#contact" className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                お問い合わせ
              </a>
            </Button>
          </div>
        </div>

        <Tabs defaultValue="faq" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="faq">よくある質問</TabsTrigger>
            <TabsTrigger value="contact">お問い合わせ</TabsTrigger>
            <TabsTrigger value="status">サービス状況</TabsTrigger>
            <TabsTrigger value="resources">リソース</TabsTrigger>
          </TabsList>

          {/* FAQ */}
          <TabsContent value="faq" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>よくある質問</CardTitle>
                <CardDescription>
                  お客様からよくいただく質問をまとめました
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* 検索・フィルター */}
                <div className="space-y-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="質問を検索..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {categories.map((category) => {
                      const IconComponent = category.icon;
                      return (
                        <Button
                          key={category.id}
                          variant={selectedCategory === category.id ? "default" : "outline"}
                          size="sm"
                          onClick={() => setSelectedCategory(category.id)}
                          className="flex items-center gap-2"
                        >
                          <IconComponent className="h-4 w-4" />
                          {category.name}
                        </Button>
                      );
                    })}
                  </div>
                </div>

                {/* FAQ一覧 */}
                <div className="space-y-3">
                  {filteredFaqs.length === 0 ? (
                    <div className="text-center py-8">
                      <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600">該当する質問が見つかりませんでした</p>
                    </div>
                  ) : (
                    filteredFaqs.map((faq) => (
                      <Collapsible key={faq.id}>
                        <CollapsibleTrigger asChild>
                          <div
                            className="border rounded-lg p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                            onClick={() => toggleFaq(faq.id)}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <h3 className="font-medium text-left">{faq.question}</h3>
                                <div className="flex gap-2 mt-2">
                                  {faq.tags.map((tag) => (
                                    <Badge key={tag} variant="secondary" className="text-xs">
                                      {tag}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                              {openFaq === faq.id ? (
                                <ChevronUp className="h-5 w-5 text-gray-400" />
                              ) : (
                                <ChevronDown className="h-5 w-5 text-gray-400" />
                              )}
                            </div>
                          </div>
                        </CollapsibleTrigger>
                        <CollapsibleContent className="border-l-2 border-blue-200 ml-4 pl-4 pb-4">
                          <p className="text-gray-700 mt-2">{faq.answer}</p>
                        </CollapsibleContent>
                      </Collapsible>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* お問い合わせ */}
          <TabsContent value="contact" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* お問い合わせフォーム */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Mail className="h-5 w-5" />
                    お問い合わせフォーム
                  </CardTitle>
                  <CardDescription>
                    お問い合わせ内容を詳しくお聞かせください
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleContactSubmit} className="space-y-4" id="contact">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">カテゴリ</label>
                        <select
                          className="w-full p-2 border rounded-md"
                          value={contactForm.category}
                          onChange={(e) => setContactForm({...contactForm, category: e.target.value})}
                          required
                        >
                          <option value="">選択してください</option>
                          <option value="general">一般的な質問</option>
                          <option value="technical">技術的な問題</option>
                          <option value="billing">請求・料金</option>
                          <option value="security">セキュリティ</option>
                          <option value="feature">機能要望</option>
                          <option value="bug">バグ報告</option>
                        </select>
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium">優先度</label>
                        <select
                          className="w-full p-2 border rounded-md"
                          value={contactForm.priority}
                          onChange={(e) => setContactForm({...contactForm, priority: e.target.value})}
                        >
                          <option value="low">低</option>
                          <option value="normal">通常</option>
                          <option value="high">高</option>
                          <option value="urgent">緊急</option>
                        </select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">メールアドレス</label>
                      <Input
                        type="email"
                        placeholder="your@email.com"
                        value={contactForm.email}
                        onChange={(e) => setContactForm({...contactForm, email: e.target.value})}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">件名</label>
                      <Input
                        placeholder="お問い合わせの件名"
                        value={contactForm.subject}
                        onChange={(e) => setContactForm({...contactForm, subject: e.target.value})}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">お問い合わせ内容</label>
                      <Textarea
                        placeholder="詳細をお聞かせください..."
                        rows={6}
                        value={contactForm.message}
                        onChange={(e) => setContactForm({...contactForm, message: e.target.value})}
                        required
                      />
                    </div>

                    <Button type="submit" className="w-full">
                      <Mail className="mr-2 h-4 w-4" />
                      送信
                    </Button>
                  </form>
                </CardContent>
              </Card>

              {/* サポート情報 */}
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Phone className="h-5 w-5" />
                      サポート連絡先
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                        <Mail className="h-5 w-5 text-blue-600" />
                        <div>
                          <div className="font-medium">メールサポート</div>
                          <div className="text-sm text-gray-600">support@kessai-link.com</div>
                          <div className="text-xs text-blue-600">24時間以内に返信</div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                        <Phone className="h-5 w-5 text-green-600" />
                        <div>
                          <div className="font-medium">電話サポート</div>
                          <div className="text-sm text-gray-600">03-1234-5678</div>
                          <div className="text-xs text-green-600">平日 9:00-18:00</div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg">
                        <MessageCircle className="h-5 w-5 text-purple-600" />
                        <div>
                          <div className="font-medium">チャットサポート</div>
                          <div className="text-sm text-gray-600">管理画面右下のチャットボタン</div>
                          <div className="text-xs text-purple-600">平日 9:00-18:00</div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Clock className="h-5 w-5" />
                      対応時間
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between">
                        <span>一般的なお問い合わせ</span>
                        <span className="text-green-600 font-medium">24時間以内</span>
                      </div>
                      <div className="flex justify-between">
                        <span>技術的な問題</span>
                        <span className="text-blue-600 font-medium">12時間以内</span>
                      </div>
                      <div className="flex justify-between">
                        <span>緊急事態</span>
                        <span className="text-red-600 font-medium">1時間以内</span>
                      </div>
                      <div className="flex justify-between">
                        <span>電話対応</span>
                        <span className="text-gray-600 font-medium">平日 9:00-18:00</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>緊急時の対応</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                        <div className="font-medium text-red-900 mb-1">システム障害</div>
                        <div className="text-sm text-red-800">
                          サービスに影響する障害は即座に対応いたします。
                          ステータスページで最新情報をご確認ください。
                        </div>
                      </div>
                      <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                        <div className="font-medium text-orange-900 mb-1">セキュリティ問題</div>
                        <div className="text-sm text-orange-800">
                          セキュリティに関する問題は最優先で対応いたします。
                          security@kessai-link.com まで直接ご連絡ください。
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* サービス状況 */}
          <TabsContent value="status" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  システム稼働状況
                </CardTitle>
                <CardDescription>
                  各サービスのリアルタイム稼働状況
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span className="font-medium">Webアプリケーション</span>
                      </div>
                      <Badge className="bg-green-600">正常</Badge>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span className="font-medium">API</span>
                      </div>
                      <Badge className="bg-green-600">正常</Badge>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span className="font-medium">決済処理</span>
                      </div>
                      <Badge className="bg-green-600">正常</Badge>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span className="font-medium">データベース</span>
                      </div>
                      <Badge className="bg-green-600">正常</Badge>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <div className="flex items-center gap-2">
                        <AlertCircle className="h-4 w-4 text-yellow-600" />
                        <span className="font-medium">メール送信</span>
                      </div>
                      <Badge className="bg-yellow-600">遅延中</Badge>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span className="font-medium">監視システム</span>
                      </div>
                      <Badge className="bg-green-600">正常</Badge>
                    </div>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h3 className="font-medium mb-3">パフォーマンス指標</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">99.9%</div>
                      <div className="text-xs text-gray-600">稼働率</div>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">180ms</div>
                      <div className="text-xs text-gray-600">平均応答時間</div>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <div className="text-2xl font-bold text-purple-600">0</div>
                      <div className="text-xs text-gray-600">進行中の障害</div>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <div className="text-2xl font-bold text-orange-600">24h</div>
                      <div className="text-xs text-gray-600">最終メンテナンス</div>
                    </div>
                  </div>
                </div>

                <div className="text-center">
                  <Button variant="outline" asChild>
                    <a href="https://status.kessai-link.com" target="_blank" className="flex items-center gap-2">
                      <ExternalLink className="h-4 w-4" />
                      詳細なステータスページ
                    </a>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* リソース */}
          <TabsContent value="resources" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="h-5 w-5" />
                    ドキュメント
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button variant="ghost" className="w-full justify-start" asChild>
                    <a href="/guide">
                      <FileText className="mr-2 h-4 w-4" />
                      利用ガイド
                    </a>
                  </Button>
                  <Button variant="ghost" className="w-full justify-start" asChild>
                    <a href="/api-docs">
                      <FileText className="mr-2 h-4 w-4" />
                      API仕様書
                    </a>
                  </Button>
                  <Button variant="ghost" className="w-full justify-start" asChild>
                    <a href="https://blog.kessai-link.com" target="_blank">
                      <ExternalLink className="mr-2 h-4 w-4" />
                      技術ブログ
                    </a>
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    コミュニティ
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button variant="ghost" className="w-full justify-start" asChild>
                    <a href="https://github.com/kessai-link" target="_blank">
                      <ExternalLink className="mr-2 h-4 w-4" />
                      GitHub
                    </a>
                  </Button>
                  <Button variant="ghost" className="w-full justify-start" asChild>
                    <a href="https://discord.gg/kessai-link" target="_blank">
                      <MessageCircle className="mr-2 h-4 w-4" />
                      Discord
                    </a>
                  </Button>
                  <Button variant="ghost" className="w-full justify-start" asChild>
                    <a href="https://twitter.com/kessai_link" target="_blank">
                      <ExternalLink className="mr-2 h-4 w-4" />
                      Twitter
                    </a>
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    ツール・SDK
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button variant="ghost" className="w-full justify-start" asChild>
                    <a href="https://npm.com/package/@kessai-link/js" target="_blank">
                      <ExternalLink className="mr-2 h-4 w-4" />
                      JavaScript SDK
                    </a>
                  </Button>
                  <Button variant="ghost" className="w-full justify-start" asChild>
                    <a href="https://pypi.org/project/kessai-link/" target="_blank">
                      <ExternalLink className="mr-2 h-4 w-4" />
                      Python SDK
                    </a>
                  </Button>
                  <Button variant="ghost" className="w-full justify-start" asChild>
                    <a href="https://packagist.org/packages/kessai-link/php" target="_blank">
                      <ExternalLink className="mr-2 h-4 w-4" />
                      PHP SDK
                    </a>
                  </Button>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>学習リソース</CardTitle>
                <CardDescription>
                  決済システムの理解を深めるための参考資料
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <h4 className="font-medium">初心者向け</h4>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-center gap-2">
                        <ExternalLink className="h-4 w-4 text-blue-600" />
                        <a href="#" className="text-blue-600 hover:underline">決済システムの基礎知識</a>
                      </li>
                      <li className="flex items-center gap-2">
                        <ExternalLink className="h-4 w-4 text-blue-600" />
                        <a href="#" className="text-blue-600 hover:underline">オンライン決済のセキュリティ</a>
                      </li>
                      <li className="flex items-center gap-2">
                        <ExternalLink className="h-4 w-4 text-blue-600" />
                        <a href="#" className="text-blue-600 hover:underline">決済リンクの活用方法</a>
                      </li>
                    </ul>
                  </div>

                  <div className="space-y-3">
                    <h4 className="font-medium">開発者向け</h4>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-center gap-2">
                        <ExternalLink className="h-4 w-4 text-green-600" />
                        <a href="#" className="text-green-600 hover:underline">API統合のベストプラクティス</a>
                      </li>
                      <li className="flex items-center gap-2">
                        <ExternalLink className="h-4 w-4 text-green-600" />
                        <a href="#" className="text-green-600 hover:underline">Webhookの実装ガイド</a>
                      </li>
                      <li className="flex items-center gap-2">
                        <ExternalLink className="h-4 w-4 text-green-600" />
                        <a href="#" className="text-green-600 hover:underline">エラーハンドリング詳解</a>
                      </li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default HelpPage;