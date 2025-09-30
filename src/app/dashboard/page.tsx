'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/providers';
import { error as showError, success, info } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DollarSign,
  Activity,
  CreditCard,
  TrendingUp,
  RefreshCw,
  Plus,
  Download,
  Search,
  Filter as FilterIcon,
  BarChart3
} from 'lucide-react';

// 新しいダッシュボードコンポーネント
import { StatsCard, StatsGrid } from '@/components/dashboard/StatsCard';
import { RevenueLineChart, ServicePieChart, TransactionBarChart } from '@/components/dashboard/Charts';
import { ActivityFeed } from '@/components/dashboard/ActivityFeed';
import { PeriodFilter, Period } from '@/components/dashboard/PeriodFilter';

// 既存のローディングコンポーネント
import { DashboardLoadingOverlay } from '@/components/loading';

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
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<Period>('30');

  // 認証チェック
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/signin');
    }
  }, [user, authLoading, router]);

  // 統計データの取得
  const fetchStats = useCallback(async (showLoadingState = true) => {
    if (showLoadingState) {
      setLoading(true);
    } else {
      setRefreshing(true);
    }

    try {
      const response = await fetch(`/api/dashboard/stats?range=${selectedPeriod}`, {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('統計データの取得に失敗しました');
      }

      const data = await response.json();

      if (data.success && data.data) {
        setStats(data.data);
      } else {
        throw new Error(data.error || '統計データの取得に失敗しました');
      }
    } catch (error: any) {
      console.error('Dashboard stats error:', error);
      showError(error.message || '統計データの取得に失敗しました');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedPeriod]);

  // 初回読み込みと期間変更時の再取得
  useEffect(() => {
    if (!authLoading && user) {
      fetchStats(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, user, selectedPeriod]);

  // リフレッシュハンドラー
  const handleRefresh = () => {
    fetchStats(false);
    info('データを更新しています...');
  };

  // CSVエクスポート機能
  const handleExportCSV = () => {
    if (!stats) return;

    // CSVデータの作成
    const csvData = [
      ['指標', '値'],
      ['総売上', stats.totalRevenue],
      ['総取引数', stats.totalTransactions],
      ['決済リンク数', stats.totalLinks],
      ['成功率', stats.successRate + '%'],
      ['コンバージョン率', stats.conversionRate + '%'],
      ['平均取引額', stats.averageTransactionValue]
    ];

    // CSV文字列の生成
    const csvContent = csvData.map(row => row.join(',')).join('\n');
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    // ダウンロード
    const link = document.createElement('a');
    link.href = url;
    link.download = `dashboard-stats-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    success('CSVファイルをダウンロードしました');
  };

  if (authLoading || loading) {
    return <DashboardLoadingOverlay />;
  }

  if (!user) {
    return null;
  }

  // グラフ用データの準備
  const revenueChartData = stats?.dailyStats.map(stat => ({
    name: new Date(stat.date).toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' }),
    revenue: stat.revenue,
    transactions: stat.transactions
  })) || [];

  const serviceChartData = stats?.serviceStats.map(stat => ({
    name: stat.service.charAt(0).toUpperCase() + stat.service.slice(1),
    value: stat.revenue
  })) || [];

  const transactionChartData = stats?.dailyStats.slice(-7).map(stat => ({
    name: new Date(stat.date).toLocaleDateString('ja-JP', { weekday: 'short' }),
    completed: stat.transactions,
    revenue: stat.revenue / 1000 // K単位で表示
  })) || [];

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* ヘッダー */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">ダッシュボード</h1>
            <p className="text-gray-600 mt-1">
              {user.email} の決済分析
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* 期間フィルター */}
            <PeriodFilter
              selectedPeriod={selectedPeriod}
              onPeriodChange={setSelectedPeriod}
            />

            {/* アクションボタン */}
            <Button
              onClick={handleRefresh}
              variant="outline"
              size="sm"
              disabled={refreshing}
            >
              <RefreshCw className={`h-4 w-4 mr-1 ${refreshing ? 'animate-spin' : ''}`} />
              更新
            </Button>

            <Button
              onClick={handleExportCSV}
              variant="outline"
              size="sm"
            >
              <Download className="h-4 w-4 mr-1" />
              CSV
            </Button>

            <Button
              onClick={() => router.push('/create')}
              size="sm"
            >
              <Plus className="h-4 w-4 mr-1" />
              新規作成
            </Button>
          </div>
        </div>
      </div>

      {/* 統計カード */}
      <StatsGrid>
        <StatsCard
          title="総売上"
          value={stats?.totalRevenue || 0}
          change={stats?.growth.revenueGrowth}
          changeLabel="前期比"
          icon={DollarSign}
          iconColor="text-green-600"
          format="currency"
          loading={refreshing}
        />
        <StatsCard
          title="総取引数"
          value={stats?.totalTransactions || 0}
          change={stats?.growth.transactionGrowth}
          changeLabel="前期比"
          icon={Activity}
          iconColor="text-blue-600"
          format="number"
          loading={refreshing}
        />
        <StatsCard
          title="成功率"
          value={stats?.successRate || 0}
          icon={TrendingUp}
          iconColor="text-purple-600"
          format="percentage"
          loading={refreshing}
        />
        <StatsCard
          title="平均取引額"
          value={stats?.averageTransactionValue || 0}
          icon={CreditCard}
          iconColor="text-orange-600"
          format="currency"
          loading={refreshing}
        />
      </StatsGrid>

      {/* チャートセクション */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        {/* 収益推移チャート（大） */}
        <div className="lg:col-span-2">
          <RevenueLineChart
            data={revenueChartData}
            dataKey="revenue"
            title="収益推移"
            description={`過去${selectedPeriod}日間の収益トレンド`}
            loading={refreshing}
          />
        </div>

        {/* サービス別円グラフ */}
        <div className="lg:col-span-1">
          <ServicePieChart
            data={serviceChartData}
            title="決済サービス別収益"
            description="プロバイダー別の収益分布"
            loading={refreshing}
          />
        </div>
      </div>

      {/* 下部セクション */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        {/* 日別取引グラフ */}
        <div className="lg:col-span-2">
          <TransactionBarChart
            data={transactionChartData}
            dataKeys={[
              { key: 'completed', color: '#3b82f6', name: '取引数' },
              { key: 'revenue', color: '#10b981', name: '収益(K)' }
            ]}
            title="日別取引パフォーマンス"
            description="過去7日間の取引と収益"
            loading={refreshing}
          />
        </div>

        {/* アクティビティフィード */}
        <div className="lg:col-span-1">
          <ActivityFeed
            activities={stats?.recentActivity || []}
            loading={refreshing}
          />
        </div>
      </div>

      {/* トップパフォーマンスリンク */}
      {stats?.topPerformingLinks && stats.topPerformingLinks.length > 0 && (
        <div className="mt-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold flex items-center">
                <BarChart3 className="h-5 w-5 mr-2 text-blue-600" />
                トップパフォーマンス決済リンク
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      リンク名
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      収益
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      取引数
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      成約率
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {stats.topPerformingLinks.map((link) => (
                    <tr key={link.id} className="hover:bg-gray-50 cursor-pointer">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {link.title || '無題'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                        ¥{link.revenue.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-600">
                        {link.transactions}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                        <Badge variant="outline" className="font-mono">
                          {link.conversionRate}%
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}