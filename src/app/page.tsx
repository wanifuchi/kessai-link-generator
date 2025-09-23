'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { error as showError, success } from '@/hooks/use-toast';
import { Plus, CreditCard, DollarSign, Eye, Calendar, BarChart3, ExternalLink, Copy, Search, Filter, Loader2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { SkeletonLoader, EnhancedCardSkeleton } from '@/components/loading';

interface PaymentLinkData {
  id: string;
  title: string;
  amount: number;
  currency: string;
  service: string;
  status: string;
  createdAt: string;
  completedAt?: string;
}

export default function HomePage() {
  const [recentLinks, setRecentLinks] = useState<PaymentLinkData[]>([]);
  const [filteredLinks, setFilteredLinks] = useState<PaymentLinkData[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchRecentLinks();
  }, []);

  const fetchRecentLinks = async () => {
    try {
      const response = await fetch('/api/payment-links?limit=10');
      const data = await response.json();

      if (data.success && data.data) {
        setRecentLinks(data.data.paymentLinks);
        setFilteredLinks(data.data.paymentLinks);
      }
    } catch (error) {
      console.error('決済リンク取得エラー:', error);
    } finally {
      setLoading(false);
    }
  };

  // 検索機能
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredLinks(recentLinks);
    } else {
      const filtered = recentLinks.filter(link =>
        link.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        link.service.toLowerCase().includes(searchQuery.toLowerCase()) ||
        link.status.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredLinks(filtered);
    }
  }, [searchQuery, recentLinks]);

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      success('コピー完了', 'リンクをクリップボードにコピーしました');
    } catch (error) {
      showError('エラー', 'クリップボードへのコピーに失敗しました');
    }
  };

  const formatAmount = (amount: number, currency: string) => {
    return new Intl.NumberFormat('ja-JP', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
    }).format(amount / 100);
  };

  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat('ja-JP', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(dateString));
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return <Badge variant="outline" className="text-green-600 border-green-200">アクティブ</Badge>;
      case 'COMPLETED':
        return <Badge variant="outline" className="text-blue-600 border-blue-200">完了</Badge>;
      case 'EXPIRED':
        return <Badge variant="outline" className="text-gray-600 border-gray-200">期限切れ</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getServiceBadge = (service: string) => {
    switch (service.toLowerCase()) {
      case 'stripe':
        return <Badge className="bg-[#635bff] text-white">Stripe</Badge>;
      case 'paypal':
        return <Badge className="bg-[#0070ba] text-white">PayPal</Badge>;
      default:
        return <Badge variant="outline">{service}</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <CreditCard className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">決済リンク管理</h1>
                <p className="text-sm text-gray-600">Stripe・PayPal対応決済システム</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" asChild>
                <Link href="/dashboard" className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" />
                  ダッシュボード
                </Link>
              </Button>
              <Button asChild>
                <Link href="/create" className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  新規作成
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Hero Section - Simplified */}
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            決済リンクを簡単作成
          </h2>
          <p className="text-lg text-gray-600 mb-8">
            StripeとPayPalに対応した安全な決済リンクを数分で作成
          </p>

          <Button size="lg" asChild className="shadow-lg">
            <Link href="/create" className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              新しい決済リンクを作成
            </Link>
          </Button>
        </div>

        {/* Main Content - Recent Payment Links with Search */}
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    決済リンク一覧
                  </CardTitle>
                  <CardDescription>
                    作成した決済リンクの管理・コピー・確認
                  </CardDescription>
                </div>
                <Button variant="outline" size="sm" asChild>
                  <Link href="/dashboard" className="flex items-center gap-2">
                    <BarChart3 className="h-4 w-4" />
                    詳細分析
                  </Link>
                </Button>
              </div>

              {/* Search Bar */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  placeholder="決済リンクを検索（タイトル、サービス、ステータス）..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </CardHeader>
            <CardContent>
                {loading ? (
                  <div className="space-y-6">
                    <div className="flex items-center justify-center py-6">
                      <div className="text-center space-y-4">
                        <div className="relative">
                          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto" />
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-4 h-4 bg-blue-100 rounded-full animate-pulse"></div>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <p className="text-lg font-medium text-gray-800">決済リンクを読み込み中...</p>
                          <p className="text-sm text-gray-500">データベースからデータを取得しています</p>
                        </div>
                        <div className="w-48 h-1 bg-gray-200 rounded-full mx-auto overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-blue-500 to-purple-600 rounded-full animate-pulse"></div>
                        </div>
                      </div>
                    </div>
                    {Array.from({ length: 3 }).map((_, i) => (
                      <div key={i} className="border rounded-lg p-4 enhanced-loading">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <SkeletonLoader width="w-48" height="h-5" shimmer={true} />
                              <SkeletonLoader width="w-16" height="h-5" shimmer={true} />
                              <SkeletonLoader width="w-20" height="h-5" shimmer={true} />
                            </div>
                            <div className="flex items-center gap-4">
                              <SkeletonLoader width="w-24" height="h-4" shimmer={true} />
                              <SkeletonLoader width="w-32" height="h-4" shimmer={true} />
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <SkeletonLoader width="w-10" height="h-8" shimmer={true} />
                            <SkeletonLoader width="w-10" height="h-8" shimmer={true} />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : filteredLinks.length > 0 ? (
                  <div className="space-y-4">
                    {filteredLinks.map((link) => (
                      <div key={link.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-medium text-gray-900 truncate">
                                {link.title}
                              </h3>
                              {getStatusBadge(link.status)}
                              {getServiceBadge(link.service)}
                            </div>
                            <div className="flex items-center gap-4 text-sm text-gray-500">
                              <span className="font-medium">
                                {formatAmount(link.amount, link.currency)}
                              </span>
                              <span>{formatDate(link.createdAt)}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 ml-4">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => copyToClipboard(`${window.location.origin}/p/${link.id}`)}
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                            <Button size="sm" asChild>
                              <Link href={`/p/${link.id}`}>
                                <ExternalLink className="h-4 w-4" />
                              </Link>
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : searchQuery ? (
                  <div className="text-center py-8">
                    <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      検索結果が見つかりません
                    </h3>
                    <p className="text-gray-600 mb-4">
                      「{searchQuery}」に一致する決済リンクはありません
                    </p>
                    <Button
                      variant="outline"
                      onClick={() => setSearchQuery('')}
                      className="mr-2"
                    >
                      検索をクリア
                    </Button>
                    <Button asChild>
                      <Link href="/create">
                        <Plus className="h-4 w-4 mr-2" />
                        新規作成
                      </Link>
                    </Button>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      決済リンクがまだありません
                    </h3>
                    <p className="text-gray-600 mb-4">
                      最初の決済リンクを作成しましょう
                    </p>
                    <Button asChild>
                      <Link href="/create">
                        <Plus className="h-4 w-4 mr-2" />
                        新規作成
                      </Link>
                    </Button>
                  </div>
                )}

                {/* Show More Links Button */}
                {!loading && filteredLinks.length > 0 && searchQuery === '' && (
                  <div className="text-center pt-6 border-t">
                    <p className="text-sm text-gray-500 mb-3">
                      さらに多くの決済リンクと詳細な分析
                    </p>
                    <Button variant="outline" asChild>
                      <Link href="/dashboard" className="flex items-center gap-2">
                        <BarChart3 className="h-4 w-4" />
                        すべての決済リンクを表示
                      </Link>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
        </div>
      </div>
    </div>
  );
}