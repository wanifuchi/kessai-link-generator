'use client';

import { useState, useEffect } from 'react';
import { error as showError, success, info } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ExternalLink,
  Calendar,
  DollarSign,
  BarChart3,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  Activity,
  Users,
  Percent,
  RefreshCw,
  Filter,
  Target,
  Zap,
  PieChart,
  Globe,
  CreditCard
} from 'lucide-react';
import { CardLoading, SkeletonLoader, DashboardLoadingOverlay } from '@/components/loading';

interface PaymentLink {
  id: string;
  title: string;
  description?: string;
  amount: number;
  currency: string;
  service: string;
  paymentUrl: string;
  qrCodeUrl?: string;
  status: 'pending' | 'succeeded' | 'failed' | 'cancelled' | 'expired';
  createdAt: string;
  expiresAt?: string;
  transactions: {
    id: string;
    status: string;
    amount: number;
    paidAt?: string;
  }[];
}

interface DashboardData {
  paymentLinks: PaymentLink[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

interface DashboardStats {
  totalLinks: number;
  totalRevenue: number;
  totalTransactions: number;
  conversionRate: number;
  successRate: number;
  averageTransactionValue: number;
  growth: {
    revenueGrowth: number;
    transactionGrowth: number;
    linkGrowth: number;
  };
  revenueByMonth: Array<{
    month: string;
    revenue: number;
    transactions: number;
  }>;
  linksByStatus: Array<{
    status: string;
    count: number;
    percentage: number;
  }>;
  serviceStats: Array<{
    service: string;
    count: number;
    revenue: number;
    percentage: number;
  }>;
  currencyStats: Array<{
    currency: string;
    count: number;
    revenue: number;
  }>;
  topPerformingLinks: Array<{
    id: string;
    title: string;
    revenue: number;
    transactions: number;
    conversionRate: number;
  }>;
  recentActivity: Array<{
    type: 'link_created' | 'payment_completed' | 'payment_failed';
    timestamp: string;
    data: any;
  }>;
  dailyStats: Array<{
    date: string;
    revenue: number;
    transactions: number;
  }>;
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isStatsLoading, setIsStatsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loadingTimeout, setLoadingTimeout] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [dateRange, setDateRange] = useState('30');

  const fetchPaymentLinks = async (page: number = 1) => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/payment-links?page=${page}&limit=10`);
      const result = await response.json();

      if (result.success) {
        setData(result.data);
        setError(null);
      } else {
        const errorMessage = result.error || '決済リンクの取得に失敗しました';
        setError(errorMessage);
        showError('データ取得エラー', errorMessage);
      }
    } catch (err) {
      const errorMessage = 'ネットワークエラーが発生しました';
      setError(errorMessage);
      showError('通信エラー', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchDashboardStats = async () => {
    try {
      setIsStatsLoading(true);
      const response = await fetch(`/api/dashboard/stats?range=${dateRange}`);
      const result = await response.json();

      if (result.success) {
        setStats(result.data);
      } else {
        console.error('統計データの取得に失敗:', result.error);
      }
    } catch (error) {
      console.error('統計データのネットワークエラー:', error);
    } finally {
      setIsStatsLoading(false);
    }
  };

  useEffect(() => {
    fetchPaymentLinks(currentPage);
  }, [currentPage]);

  useEffect(() => {
    fetchDashboardStats();
  }, [dateRange]);

  const refreshData = async () => {
    info('データ更新中', 'ダッシュボードデータを更新しています...');
    await Promise.all([
      fetchPaymentLinks(currentPage),
      fetchDashboardStats()
    ]);
    success('更新完了', 'ダッシュボードデータが更新されました');
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { variant: 'default' as const, icon: Clock, text: '処理中' },
      succeeded: { variant: 'default' as const, icon: CheckCircle, text: '完了' },
      failed: { variant: 'destructive' as const, icon: XCircle, text: '失敗' },
      cancelled: { variant: 'secondary' as const, icon: AlertCircle, text: 'キャンセル' },
      expired: { variant: 'secondary' as const, icon: XCircle, text: '期限切れ' },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="w-3 h-3" />
        {config.text}
      </Badge>
    );
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('ja-JP', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(amount / 100); // 金額はセント単位で保存されている
  };

  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat('ja-JP', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(dateString));
  };

  if (isLoading) {
    return (
      <DashboardLoadingOverlay
        stage={isStatsLoading ? "統計データを計算中..." : "決済リンクを取得中..."}
        onTimeout={() => {
          setLoadingTimeout(true);
          setError('データの読み込みがタイムアウトしました。ページを再読み込みしてください。');
          setIsLoading(false);
        }}
      />
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-6">
            <div className="flex items-center text-red-600">
              <AlertCircle className="w-5 h-5 mr-2" />
              {error}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'link_created':
        return <BarChart3 className="w-4 h-4 text-blue-500" />;
      case 'payment_completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'payment_failed':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Activity className="w-4 h-4 text-gray-500" />;
    }
  };

  const getActivityText = (activity: any) => {
    switch (activity.type) {
      case 'link_created':
        return `新しい決済リンク "${activity.data.title}" を作成`;
      case 'payment_completed':
        return `${formatCurrency(activity.data.amount, activity.data.currency)} の決済が完了`;
      case 'payment_failed':
        return `決済が失敗: ${activity.data.reason || '不明なエラー'}`;
      default:
        return 'アクティビティ';
    }
  };

  const formatChangePercent = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? '+100%' : '0%';
    const change = ((current - previous) / previous) * 100;
    return `${change >= 0 ? '+' : ''}${change.toFixed(1)}%`;
  };

  const getGrowthIcon = (growth: number) => {
    if (growth > 0) return <TrendingUp className="w-4 h-4 text-green-500" />;
    if (growth < 0) return <TrendingDown className="w-4 h-4 text-red-500" />;
    return <Activity className="w-4 h-4 text-gray-500" />;
  };

  const getGrowthColor = (growth: number) => {
    if (growth > 0) return 'text-green-600';
    if (growth < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Header */}
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">決済リンクダッシュボード</h1>
          <p className="text-gray-600">生成した決済リンクの管理と分析</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-1 text-sm"
            >
              <option value="7">過去7日</option>
              <option value="30">過去30日</option>
              <option value="90">過去90日</option>
              <option value="365">過去1年</option>
            </select>
          </div>
          <Button
            onClick={refreshData}
            variant="outline"
            size="sm"
            disabled={isLoading || isStatsLoading}
          >
            <RefreshCw className={`w-4 h-4 mr-1 ${(isLoading || isStatsLoading) ? 'animate-spin' : ''}`} />
            更新
          </Button>
          <Button
            onClick={() => window.location.href = '/'}
            className="flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            新しい決済リンクを作成
          </Button>
        </div>
      </div>

      {/* Enhanced Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">総決済リンク数</p>
                <p className="text-2xl font-bold text-gray-900">
                  {isStatsLoading ? '-' : stats?.totalLinks || 0}
                </p>
                {!isStatsLoading && stats?.growth && (
                  <div className="flex items-center gap-1 mt-1">
                    {getGrowthIcon(stats.growth.linkGrowth)}
                    <span className={`text-xs font-medium ${getGrowthColor(stats.growth.linkGrowth)}`}>
                      {stats.growth.linkGrowth > 0 ? '+' : ''}{stats.growth.linkGrowth.toFixed(1)}%
                    </span>
                  </div>
                )}
              </div>
              <BarChart3 className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">総収益</p>
                <p className="text-2xl font-bold text-green-600">
                  {isStatsLoading ? '-' : formatCurrency(stats?.totalRevenue || 0, 'jpy')}
                </p>
                {!isStatsLoading && stats?.growth && (
                  <div className="flex items-center gap-1 mt-1">
                    {getGrowthIcon(stats.growth.revenueGrowth)}
                    <span className={`text-xs font-medium ${getGrowthColor(stats.growth.revenueGrowth)}`}>
                      {stats.growth.revenueGrowth > 0 ? '+' : ''}{stats.growth.revenueGrowth.toFixed(1)}%
                    </span>
                  </div>
                )}
              </div>
              <DollarSign className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">完了取引数</p>
                <p className="text-2xl font-bold text-blue-600">
                  {isStatsLoading ? '-' : stats?.totalTransactions || 0}
                </p>
                {!isStatsLoading && stats?.growth && (
                  <div className="flex items-center gap-1 mt-1">
                    {getGrowthIcon(stats.growth.transactionGrowth)}
                    <span className={`text-xs font-medium ${getGrowthColor(stats.growth.transactionGrowth)}`}>
                      {stats.growth.transactionGrowth > 0 ? '+' : ''}{stats.growth.transactionGrowth.toFixed(1)}%
                    </span>
                  </div>
                )}
              </div>
              <CheckCircle className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">コンバージョン率</p>
                <p className="text-2xl font-bold text-purple-600">
                  {isStatsLoading ? '-' : `${stats?.conversionRate || 0}%`}
                </p>
                <p className="text-xs text-gray-500 mt-1">決済完了率</p>
              </div>
              <Percent className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Additional Performance Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">決済成功率</p>
                <p className="text-2xl font-bold text-emerald-600">
                  {isStatsLoading ? '-' : `${stats?.successRate || 0}%`}
                </p>
                <p className="text-xs text-gray-500 mt-1">全取引に対する成功率</p>
              </div>
              <Target className="w-8 h-8 text-emerald-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">平均取引額</p>
                <p className="text-2xl font-bold text-orange-600">
                  {isStatsLoading ? '-' : formatCurrency(stats?.averageTransactionValue || 0, 'jpy')}
                </p>
                <p className="text-xs text-gray-500 mt-1">1件あたりの平均額</p>
              </div>
              <Zap className="w-8 h-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Top Performing Links */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              トップパフォーマンス
            </CardTitle>
            <CardDescription>収益の高い決済リンク</CardDescription>
          </CardHeader>
          <CardContent>
            {isStatsLoading ? (
              <CardLoading text="統計データを読み込み中..." />
            ) : (
              <div className="space-y-3">
                {stats?.topPerformingLinks && stats.topPerformingLinks.length > 0 ? (
                  stats.topPerformingLinks.map((link, index) => (
                    <div key={link.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="bg-blue-100 text-blue-600 text-sm font-bold w-6 h-6 rounded-full flex items-center justify-center">
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-medium text-sm">{link.title}</p>
                          <p className="text-xs text-gray-500">
                            {link.transactions}件の取引 • {link.conversionRate}% CV率
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-green-600">
                          {formatCurrency(link.revenue, 'jpy')}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-center py-4">データがありません</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5" />
              最近のアクティビティ
            </CardTitle>
            <CardDescription>リアルタイムの活動状況</CardDescription>
          </CardHeader>
          <CardContent>
            {isStatsLoading ? (
              <CardLoading text="統計データを読み込み中..." />
            ) : (
              <div className="space-y-3">
                {stats?.recentActivity && stats.recentActivity.length > 0 ? (
                  stats.recentActivity.map((activity, index) => (
                    <div key={index} className="flex items-start gap-3 p-3 border-l-2 border-gray-200">
                      {getActivityIcon(activity.type)}
                      <div className="flex-1">
                        <p className="text-sm font-medium">
                          {getActivityText(activity)}
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatDate(activity.timestamp)}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-center py-4">最近のアクティビティはありません</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Enhanced Analytics - Service & Currency Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Service Statistics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              サービス別統計
            </CardTitle>
            <CardDescription>決済サービス毎の収益と取引数</CardDescription>
          </CardHeader>
          <CardContent>
            {isStatsLoading ? (
              <CardLoading text="統計データを読み込み中..." />
            ) : (
              <div className="space-y-3">
                {stats?.serviceStats && stats.serviceStats.length > 0 ? (
                  stats.serviceStats.map((service) => (
                    <div key={service.service} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${
                          service.service.toLowerCase() === 'stripe' ? 'bg-[#635bff] text-white' :
                          service.service.toLowerCase() === 'paypal' ? 'bg-[#0070ba] text-white' :
                          'bg-gray-100 text-gray-600'
                        }`}>
                          <CreditCard className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="font-medium text-sm">{service.service}</p>
                          <p className="text-xs text-gray-500">
                            {service.count}件の取引 • {service.percentage.toFixed(1)}%
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-green-600">
                          {formatCurrency(service.revenue, 'jpy')}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-center py-4">データがありません</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Currency Statistics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="w-5 h-5" />
              通貨別統計
            </CardTitle>
            <CardDescription>通貨毎の取引数と収益</CardDescription>
          </CardHeader>
          <CardContent>
            {isStatsLoading ? (
              <CardLoading text="統計データを読み込み中..." />
            ) : (
              <div className="space-y-3">
                {stats?.currencyStats && stats.currencyStats.length > 0 ? (
                  stats.currencyStats.map((currency) => (
                    <div key={currency.currency} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="bg-blue-100 text-blue-600 p-2 rounded-lg">
                          <Globe className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="font-medium text-sm">{currency.currency.toUpperCase()}</p>
                          <p className="text-xs text-gray-500">
                            {currency.count}件の取引
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-green-600">
                          {formatCurrency(currency.revenue, currency.currency)}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-center py-4">データがありません</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Status Distribution & Daily Trends */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="w-5 h-5" />
              リンク状態別分布
            </CardTitle>
            <CardDescription>決済リンクのステータス内訳</CardDescription>
          </CardHeader>
          <CardContent>
            {isStatsLoading ? (
              <CardLoading text="統計データを読み込み中..." />
            ) : (
              <div className="space-y-3">
                {stats?.linksByStatus && stats.linksByStatus.length > 0 ? (
                  stats.linksByStatus.map((item) => {
                    const statusConfig = {
                      pending: { color: 'bg-yellow-500', label: '処理中' },
                      succeeded: { color: 'bg-green-500', label: '完了' },
                      failed: { color: 'bg-red-500', label: '失敗' },
                      cancelled: { color: 'bg-gray-500', label: 'キャンセル' },
                      expired: { color: 'bg-gray-500', label: '期限切れ' },
                    };
                    const config = statusConfig[item.status as keyof typeof statusConfig] || { color: 'bg-gray-500', label: item.status };

                    return (
                      <div key={item.status} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className={`w-3 h-3 rounded-full ${config.color}`}></div>
                          <span className="text-sm font-medium">{config.label}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-sm font-bold">{item.count}件</span>
                          <p className="text-xs text-gray-500">{item.percentage.toFixed(1)}%</p>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-gray-500 text-center py-4">データがありません</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Daily Trends */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              日別推移
            </CardTitle>
            <CardDescription>最近の収益と取引数トレンド</CardDescription>
          </CardHeader>
          <CardContent>
            {isStatsLoading ? (
              <CardLoading text="統計データを読み込み中..." />
            ) : (
              <div className="space-y-3">
                {stats?.dailyStats && stats.dailyStats.length > 0 ? (
                  stats.dailyStats.slice(-7).map((day) => (
                    <div key={day.date} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium text-sm">
                          {new Intl.DateTimeFormat('ja-JP', {
                            month: 'short',
                            day: 'numeric',
                            weekday: 'short'
                          }).format(new Date(day.date))}
                        </p>
                        <p className="text-xs text-gray-500">{day.transactions}件の取引</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-green-600">
                          {formatCurrency(day.revenue, 'jpy')}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-center py-4">データがありません</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Monthly Revenue Trends */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              月別収益推移
            </CardTitle>
            <CardDescription>過去6ヶ月の収益とトランザクション推移</CardDescription>
          </CardHeader>
          <CardContent>
            {isStatsLoading ? (
              <CardLoading text="統計データを読み込み中..." />
            ) : (
              <div className="space-y-3">
                {stats?.revenueByMonth && stats.revenueByMonth.length > 0 ? (
                  stats.revenueByMonth.map((item) => (
                    <div key={item.month} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium text-sm">
                          {new Intl.DateTimeFormat('ja-JP', {
                            year: 'numeric',
                            month: 'long'
                          }).format(new Date(item.month + '-01'))}
                        </p>
                        <p className="text-xs text-gray-500">{item.transactions}件の取引</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-green-600">
                          {formatCurrency(item.revenue, 'jpy')}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-center py-4">データがありません</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Payment Links Table */}
      <Card>
        <CardHeader>
          <CardTitle>決済リンク一覧</CardTitle>
          <CardDescription>
            最近作成された決済リンクと取引状況
          </CardDescription>
        </CardHeader>
        <CardContent>
          {data?.paymentLinks.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              まだ決済リンクが作成されていません。
            </div>
          ) : (
            <div className="space-y-4">
              {data?.paymentLinks.map((link) => (
                <Card key={link.id} className="border border-gray-200">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold text-lg">{link.title}</h3>
                          {getStatusBadge(link.status)}
                          <Badge variant="outline">
                            {link.service}
                          </Badge>
                        </div>
                        
                        {link.description && (
                          <p className="text-gray-600 text-sm mb-2">{link.description}</p>
                        )}
                        
                        <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
                          <div className="flex items-center gap-1">
                            <DollarSign className="w-4 h-4" />
                            {formatCurrency(link.amount, link.currency)}
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {formatDate(link.createdAt)}
                          </div>
                          {link.expiresAt && (
                            <div className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              期限: {formatDate(link.expiresAt)}
                            </div>
                          )}
                        </div>
                        
                        {link.transactions.length > 0 && (
                          <div className="text-sm">
                            <p className="text-gray-600">
                              取引履歴: {link.transactions.length}件
                            </p>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => window.open(link.paymentUrl, '_blank')}
                        >
                          <ExternalLink className="w-4 h-4 mr-1" />
                          リンクを開く
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
          
          {/* Pagination */}
          {data && data.pagination.totalPages > 1 && (
            <div className="flex items-center justify-between mt-6">
              <div className="text-sm text-gray-500">
                {data.pagination.total}件中 {((data.pagination.page - 1) * data.pagination.limit) + 1}-{Math.min(data.pagination.page * data.pagination.limit, data.pagination.total)}件を表示
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(currentPage - 1)}
                >
                  前へ
                </Button>
                <span className="text-sm">
                  {currentPage} / {data.pagination.totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage === data.pagination.totalPages}
                  onClick={() => setCurrentPage(currentPage + 1)}
                >
                  次へ
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}