'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Code2,
  Key,
  Globe,
  Database,
  Shield,
  Zap,
  Copy,
  Check,
  ArrowRight,
  ExternalLink,
  AlertTriangle,
  BookOpen
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const ApiDocsPage = () => {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const { toast } = useToast();

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(label);
    toast({
      title: 'コピーしました',
      description: `${label}をクリップボードにコピーしました`,
    });
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const CodeBlock = ({ code, language, label }: { code: string; language: string; label: string }) => (
    <div className="relative bg-gray-900 rounded-lg p-4 mt-2">
      <div className="flex justify-between items-center mb-2">
        <Badge variant="outline" className="text-xs">
          {language}
        </Badge>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => copyToClipboard(code, label)}
          className="text-gray-400 hover:text-white"
        >
          {copiedCode === label ? (
            <Check className="h-4 w-4" />
          ) : (
            <Copy className="h-4 w-4" />
          )}
        </Button>
      </div>
      <pre className="text-sm text-gray-300 overflow-x-auto">
        <code>{code}</code>
      </pre>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* ヘッダー */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Code2 className="h-8 w-8 text-blue-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">API仕様書</h1>
              <p className="text-gray-600 mt-2">
                決済リンク管理システムのAPI仕様とサンプルコード
              </p>
            </div>
          </div>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="overview">概要</TabsTrigger>
            <TabsTrigger value="auth">認証</TabsTrigger>
            <TabsTrigger value="endpoints">エンドポイント</TabsTrigger>
            <TabsTrigger value="webhooks">Webhook</TabsTrigger>
            <TabsTrigger value="errors">エラー</TabsTrigger>
            <TabsTrigger value="examples">サンプル</TabsTrigger>
          </TabsList>

          {/* 概要 */}
          <TabsContent value="overview" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5" />
                  API概要
                </CardTitle>
                <CardDescription>
                  決済リンク管理システムのREST API仕様
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">基本情報</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600">ベースURL</span>
                        <code className="bg-gray-100 px-2 py-1 rounded text-sm">
                          https://api.kessai-link.com/v1
                        </code>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">プロトコル</span>
                        <span>HTTPS</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">形式</span>
                        <span>JSON</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">文字エンコード</span>
                        <span>UTF-8</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">対応決済サービス</h3>
                    <div className="space-y-2">
                      <Badge className="bg-[#635bff] hover:bg-[#635bff]/90">Stripe</Badge>
                      <Badge className="bg-[#0070ba] hover:bg-[#0070ba]/90 ml-2">PayPal</Badge>
                      <Badge className="bg-gray-500 hover:bg-gray-500/90 ml-2">Square</Badge>
                      <Badge className="bg-green-600 hover:bg-green-600/90 ml-2">PayPay</Badge>
                      <Badge className="bg-blue-600 hover:bg-blue-600/90 ml-2">fincode</Badge>
                    </div>
                  </div>
                </div>

                <div className="border-t pt-6">
                  <h3 className="text-lg font-semibold mb-4">APIの特徴</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex items-start gap-3">
                      <Shield className="h-5 w-5 text-green-600 mt-1" />
                      <div>
                        <h4 className="font-medium">セキュア</h4>
                        <p className="text-sm text-gray-600">JWT認証とHTTPS通信</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Zap className="h-5 w-5 text-yellow-600 mt-1" />
                      <div>
                        <h4 className="font-medium">高速</h4>
                        <p className="text-sm text-gray-600">平均レスポンス時間200ms以下</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Database className="h-5 w-5 text-blue-600 mt-1" />
                      <div>
                        <h4 className="font-medium">信頼性</h4>
                        <p className="text-sm text-gray-600">99.9%のSLA保証</p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 認証 */}
          <TabsContent value="auth" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Key className="h-5 w-5" />
                  認証方法
                </CardTitle>
                <CardDescription>
                  APIアクセスに必要な認証手順
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">JWT Bearer認証</h3>
                  <p className="text-gray-600">
                    すべてのAPIリクエストには、Authorizationヘッダーに有効なJWTトークンを含める必要があります。
                  </p>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="font-medium text-blue-900 mb-2">認証フロー</h4>
                    <ol className="list-decimal list-inside space-y-2 text-sm text-blue-800">
                      <li>ログインエンドポイントでアクセストークンを取得</li>
                      <li>各APIリクエストのAuthorizationヘッダーにトークンを設定</li>
                      <li>トークンの有効期限は24時間</li>
                      <li>リフレッシュトークンで新しいトークンを取得可能</li>
                    </ol>
                  </div>

                  <h4 className="font-medium">ログイン</h4>
                  <CodeBlock
                    language="bash"
                    label="ログインリクエスト"
                    code={`curl -X POST https://api.kessai-link.com/v1/auth/login \\
  -H "Content-Type: application/json" \\
  -d '{
    "email": "user@example.com",
    "password": "your_password"
  }'`}
                  />

                  <h4 className="font-medium">レスポンス例</h4>
                  <CodeBlock
                    language="json"
                    label="ログインレスポンス"
                    code={`{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "def50200...",
    "expiresIn": 86400,
    "user": {
      "id": "user_123",
      "email": "user@example.com",
      "name": "田中太郎"
    }
  }
}`}
                  />

                  <h4 className="font-medium">認証済みリクエスト</h4>
                  <CodeBlock
                    language="bash"
                    label="認証ヘッダー"
                    code={`curl -X GET https://api.kessai-link.com/v1/payment-links \\
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \\
  -H "Content-Type: application/json"`}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* エンドポイント */}
          <TabsContent value="endpoints" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>決済リンク管理</CardTitle>
                <CardDescription>決済リンクの作成、取得、更新、削除</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* 決済リンク作成 */}
                <div className="border-b pb-6">
                  <div className="flex items-center gap-2 mb-3">
                    <Badge className="bg-green-600">POST</Badge>
                    <code className="text-sm">/payment-links</code>
                  </div>
                  <p className="text-gray-600 mb-4">新しい決済リンクを作成します。</p>

                  <h4 className="font-medium mb-2">リクエストパラメータ</h4>
                  <div className="bg-gray-50 rounded-lg p-4 mb-4">
                    <div className="space-y-2 text-sm">
                      <div className="grid grid-cols-3 gap-4 font-medium">
                        <span>パラメータ</span>
                        <span>型</span>
                        <span>説明</span>
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                        <span className="font-mono">title</span>
                        <span>string</span>
                        <span>商品・サービス名（必須）</span>
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                        <span className="font-mono">description</span>
                        <span>string</span>
                        <span>説明（任意）</span>
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                        <span className="font-mono">amount</span>
                        <span>number</span>
                        <span>金額（必須）</span>
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                        <span className="font-mono">currency</span>
                        <span>string</span>
                        <span>通貨コード（デフォルト: jpy）</span>
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                        <span className="font-mono">service</span>
                        <span>string</span>
                        <span>決済サービス（stripe, paypal等）</span>
                      </div>
                    </div>
                  </div>

                  <CodeBlock
                    language="bash"
                    label="決済リンク作成"
                    code={`curl -X POST https://api.kessai-link.com/v1/payment-links \\
  -H "Authorization: Bearer YOUR_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{
    "title": "プレミアムプラン",
    "description": "月額サブスクリプション",
    "amount": 2980,
    "currency": "jpy",
    "service": "stripe"
  }'`}
                  />
                </div>

                {/* 決済リンク一覧 */}
                <div className="border-b pb-6">
                  <div className="flex items-center gap-2 mb-3">
                    <Badge className="bg-blue-600">GET</Badge>
                    <code className="text-sm">/payment-links</code>
                  </div>
                  <p className="text-gray-600 mb-4">決済リンクの一覧を取得します。</p>

                  <h4 className="font-medium mb-2">クエリパラメータ</h4>
                  <div className="bg-gray-50 rounded-lg p-4 mb-4">
                    <div className="space-y-2 text-sm">
                      <div className="grid grid-cols-3 gap-4">
                        <span className="font-mono">page</span>
                        <span>number</span>
                        <span>ページ番号（デフォルト: 1）</span>
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                        <span className="font-mono">limit</span>
                        <span>number</span>
                        <span>1ページあたりの件数（デフォルト: 20）</span>
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                        <span className="font-mono">status</span>
                        <span>string</span>
                        <span>ステータスフィルタ（active, inactive）</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 決済リンク詳細 */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Badge className="bg-blue-600">GET</Badge>
                    <code className="text-sm">/payment-links/:id</code>
                  </div>
                  <p className="text-gray-600 mb-4">指定したIDの決済リンク詳細を取得します。</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>取引管理</CardTitle>
                <CardDescription>決済取引の確認と管理</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="border-b pb-6">
                  <div className="flex items-center gap-2 mb-3">
                    <Badge className="bg-blue-600">GET</Badge>
                    <code className="text-sm">/transactions</code>
                  </div>
                  <p className="text-gray-600 mb-4">取引履歴を取得します。</p>
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Badge className="bg-blue-600">GET</Badge>
                    <code className="text-sm">/transactions/:id</code>
                  </div>
                  <p className="text-gray-600 mb-4">指定した取引の詳細を取得します。</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Webhook */}
          <TabsContent value="webhooks" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Webhook設定</CardTitle>
                <CardDescription>決済状況の通知を受信</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-medium text-blue-900 mb-2">Webhookとは</h4>
                  <p className="text-sm text-blue-800">
                    決済の完了、失敗、キャンセルなどのイベントが発生した際に、
                    指定したエンドポイントにHTTP POSTリクエストを送信します。
                  </p>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">対応イベント</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="border rounded-lg p-4">
                      <h4 className="font-medium">payment.completed</h4>
                      <p className="text-sm text-gray-600">決済が正常に完了</p>
                    </div>
                    <div className="border rounded-lg p-4">
                      <h4 className="font-medium">payment.failed</h4>
                      <p className="text-sm text-gray-600">決済が失敗</p>
                    </div>
                    <div className="border rounded-lg p-4">
                      <h4 className="font-medium">payment.cancelled</h4>
                      <p className="text-sm text-gray-600">決済がキャンセル</p>
                    </div>
                    <div className="border rounded-lg p-4">
                      <h4 className="font-medium">refund.processed</h4>
                      <p className="text-sm text-gray-600">返金が処理完了</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Webhookペイロード例</h3>
                  <CodeBlock
                    language="json"
                    label="決済完了Webhook"
                    code={`{
  "event": "payment.completed",
  "timestamp": "2024-01-15T10:30:00Z",
  "data": {
    "transactionId": "txn_1234567890",
    "paymentLinkId": "pl_abcdef123456",
    "amount": 2980,
    "currency": "jpy",
    "service": "stripe",
    "customer": {
      "email": "customer@example.com",
      "name": "山田花子"
    },
    "metadata": {
      "orderId": "order_001"
    }
  },
  "signature": "sha256=abc123..."
}`}
                  />
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">署名検証</h3>
                  <p className="text-gray-600">
                    セキュリティのため、Webhookの署名を検証することを強く推奨します。
                  </p>
                  <CodeBlock
                    language="javascript"
                    label="署名検証（Node.js）"
                    code={`const crypto = require('crypto');

function verifyWebhookSignature(payload, signature, secret) {
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload, 'utf8')
    .digest('hex');

  const receivedSignature = signature.replace('sha256=', '');

  return crypto.timingSafeEqual(
    Buffer.from(expectedSignature, 'hex'),
    Buffer.from(receivedSignature, 'hex')
  );
}`}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* エラー */}
          <TabsContent value="errors" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  エラーハンドリング
                </CardTitle>
                <CardDescription>APIエラーの種類と対処法</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">HTTPステータスコード</h3>
                  <div className="space-y-3">
                    <div className="grid grid-cols-3 gap-4 font-medium text-sm">
                      <span>コード</span>
                      <span>意味</span>
                      <span>説明</span>
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <Badge className="bg-green-600 w-fit">200</Badge>
                      <span>成功</span>
                      <span>リクエストが正常に処理された</span>
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <Badge className="bg-green-600 w-fit">201</Badge>
                      <span>作成完了</span>
                      <span>リソースが正常に作成された</span>
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <Badge className="bg-yellow-600 w-fit">400</Badge>
                      <span>不正なリクエスト</span>
                      <span>パラメータが不正または不足</span>
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <Badge className="bg-red-600 w-fit">401</Badge>
                      <span>認証エラー</span>
                      <span>認証情報が無効または不足</span>
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <Badge className="bg-red-600 w-fit">403</Badge>
                      <span>権限不足</span>
                      <span>リソースへのアクセス権限がない</span>
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <Badge className="bg-red-600 w-fit">404</Badge>
                      <span>リソース未存在</span>
                      <span>指定されたリソースが見つからない</span>
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <Badge className="bg-red-600 w-fit">500</Badge>
                      <span>サーバーエラー</span>
                      <span>サーバー内部でエラーが発生</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">エラーレスポンス形式</h3>
                  <CodeBlock
                    language="json"
                    label="エラーレスポンス"
                    code={`{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "入力データが不正です",
    "details": [
      {
        "field": "amount",
        "message": "金額は1円以上である必要があります"
      },
      {
        "field": "email",
        "message": "有効なメールアドレスを入力してください"
      }
    ]
  },
  "timestamp": "2024-01-15T10:30:00Z",
  "requestId": "req_1234567890"
}`}
                  />
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">一般的なエラーコード</h3>
                  <div className="space-y-3">
                    <div className="border rounded-lg p-4">
                      <h4 className="font-medium">VALIDATION_ERROR</h4>
                      <p className="text-sm text-gray-600">入力データのバリデーションエラー</p>
                    </div>
                    <div className="border rounded-lg p-4">
                      <h4 className="font-medium">AUTHENTICATION_FAILED</h4>
                      <p className="text-sm text-gray-600">認証に失敗</p>
                    </div>
                    <div className="border rounded-lg p-4">
                      <h4 className="font-medium">PAYMENT_FAILED</h4>
                      <p className="text-sm text-gray-600">決済処理に失敗</p>
                    </div>
                    <div className="border rounded-lg p-4">
                      <h4 className="font-medium">RATE_LIMIT_EXCEEDED</h4>
                      <p className="text-sm text-gray-600">APIレート制限を超過</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* サンプル */}
          <TabsContent value="examples" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  実装サンプル
                </CardTitle>
                <CardDescription>各言語での実装例</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <Tabs defaultValue="javascript" className="space-y-4">
                  <TabsList>
                    <TabsTrigger value="javascript">JavaScript</TabsTrigger>
                    <TabsTrigger value="python">Python</TabsTrigger>
                    <TabsTrigger value="php">PHP</TabsTrigger>
                    <TabsTrigger value="curl">cURL</TabsTrigger>
                  </TabsList>

                  <TabsContent value="javascript">
                    <div className="space-y-4">
                      <h4 className="font-medium">決済リンク作成（JavaScript）</h4>
                      <CodeBlock
                        language="javascript"
                        label="JavaScript SDK"
                        code={`// npm install @kessai-link/api-client

const KessaiLinkAPI = require('@kessai-link/api-client');

const client = new KessaiLinkAPI({
  apiKey: 'YOUR_API_KEY',
  baseUrl: 'https://api.kessai-link.com/v1'
});

async function createPaymentLink() {
  try {
    const paymentLink = await client.paymentLinks.create({
      title: 'プレミアムプラン',
      description: '月額サブスクリプション',
      amount: 2980,
      currency: 'jpy',
      service: 'stripe'
    });

    console.log('決済リンクが作成されました:', paymentLink.url);
    return paymentLink;
  } catch (error) {
    console.error('エラー:', error.message);
    throw error;
  }
}

// Webhook受信例
const express = require('express');
const app = express();

app.post('/webhook', express.raw({type: 'application/json'}), (req, res) => {
  const signature = req.headers['x-kessai-signature'];

  if (client.webhooks.verify(req.body, signature)) {
    const event = JSON.parse(req.body);

    switch (event.event) {
      case 'payment.completed':
        console.log('決済完了:', event.data);
        // 商品発送などの処理
        break;
      case 'payment.failed':
        console.log('決済失敗:', event.data);
        // エラー処理
        break;
    }
  }

  res.status(200).send('OK');
});`}
                      />
                    </div>
                  </TabsContent>

                  <TabsContent value="python">
                    <div className="space-y-4">
                      <h4 className="font-medium">決済リンク作成（Python）</h4>
                      <CodeBlock
                        language="python"
                        label="Python SDK"
                        code={`# pip install kessai-link

import kessai_link
from kessai_link import PaymentLink, WebhookHandler

# クライアント初期化
client = kessai_link.Client(
    api_key='YOUR_API_KEY',
    base_url='https://api.kessai-link.com/v1'
)

def create_payment_link():
    try:
        payment_link = client.payment_links.create(
            title='プレミアムプラン',
            description='月額サブスクリプション',
            amount=2980,
            currency='jpy',
            service='stripe'
        )

        print(f'決済リンクが作成されました: {payment_link.url}')
        return payment_link
    except kessai_link.KessaiLinkError as e:
        print(f'エラー: {e.message}')
        raise

# Flask Webhook例
from flask import Flask, request
app = Flask(__name__)

@app.route('/webhook', methods=['POST'])
def webhook():
    signature = request.headers.get('X-Kessai-Signature')

    if client.webhooks.verify(request.data, signature):
        event = request.get_json()

        if event['event'] == 'payment.completed':
            print(f"決済完了: {event['data']}")
            # 商品発送などの処理
        elif event['event'] == 'payment.failed':
            print(f"決済失敗: {event['data']}")
            # エラー処理

    return 'OK', 200`}
                      />
                    </div>
                  </TabsContent>

                  <TabsContent value="php">
                    <div className="space-y-4">
                      <h4 className="font-medium">決済リンク作成（PHP）</h4>
                      <CodeBlock
                        language="php"
                        label="PHP SDK"
                        code={`<?php
// composer require kessai-link/api-client

require_once 'vendor/autoload.php';

use KessaiLink\\Client;
use KessaiLink\\Exception\\KessaiLinkException;

$client = new Client([
    'api_key' => 'YOUR_API_KEY',
    'base_url' => 'https://api.kessai-link.com/v1'
]);

function createPaymentLink($client) {
    try {
        $paymentLink = $client->paymentLinks->create([
            'title' => 'プレミアムプラン',
            'description' => '月額サブスクリプション',
            'amount' => 2980,
            'currency' => 'jpy',
            'service' => 'stripe'
        ]);

        echo "決済リンクが作成されました: " . $paymentLink->url . "\\n";
        return $paymentLink;
    } catch (KessaiLinkException $e) {
        echo "エラー: " . $e->getMessage() . "\\n";
        throw $e;
    }
}

// Webhook受信例
$signature = $_SERVER['HTTP_X_KESSAI_SIGNATURE'] ?? '';
$payload = file_get_contents('php://input');

if ($client->webhooks->verify($payload, $signature)) {
    $event = json_decode($payload, true);

    switch ($event['event']) {
        case 'payment.completed':
            echo "決済完了: " . json_encode($event['data']) . "\\n";
            // 商品発送などの処理
            break;
        case 'payment.failed':
            echo "決済失敗: " . json_encode($event['data']) . "\\n";
            // エラー処理
            break;
    }
}

http_response_code(200);
echo 'OK';
?>`}
                      />
                    </div>
                  </TabsContent>

                  <TabsContent value="curl">
                    <div className="space-y-4">
                      <h4 className="font-medium">cURLサンプル</h4>
                      <CodeBlock
                        language="bash"
                        label="cURLコマンド集"
                        code={`# 認証
curl -X POST https://api.kessai-link.com/v1/auth/login \\
  -H "Content-Type: application/json" \\
  -d '{"email":"user@example.com","password":"password"}'

# 決済リンク作成
curl -X POST https://api.kessai-link.com/v1/payment-links \\
  -H "Authorization: Bearer YOUR_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{
    "title": "プレミアムプラン",
    "description": "月額サブスクリプション",
    "amount": 2980,
    "currency": "jpy",
    "service": "stripe"
  }'

# 決済リンク一覧取得
curl -X GET "https://api.kessai-link.com/v1/payment-links?page=1&limit=10" \\
  -H "Authorization: Bearer YOUR_TOKEN"

# 取引履歴取得
curl -X GET https://api.kessai-link.com/v1/transactions \\
  -H "Authorization: Bearer YOUR_TOKEN"

# 決済リンク詳細取得
curl -X GET https://api.kessai-link.com/v1/payment-links/pl_123456 \\
  -H "Authorization: Bearer YOUR_TOKEN"`}
                      />
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* フッター */}
        <div className="mt-12 text-center">
          <div className="border-t pt-8">
            <p className="text-gray-600 mb-4">
              詳細な情報やサポートが必要な場合は、以下のリソースをご利用ください。
            </p>
            <div className="flex justify-center gap-4">
              <Button variant="outline" asChild>
                <a href="/guide" className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4" />
                  利用ガイド
                </a>
              </Button>
              <Button variant="outline" asChild>
                <a href="/help" className="flex items-center gap-2">
                  <ExternalLink className="h-4 w-4" />
                  ヘルプ・FAQ
                </a>
              </Button>
              <Button variant="outline" asChild>
                <a href="mailto:api-support@kessai-link.com" className="flex items-center gap-2">
                  <ArrowRight className="h-4 w-4" />
                  APIサポート
                </a>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApiDocsPage;