'use client';

import { useState, useEffect } from 'react';
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
  AlertCircle
} from 'lucide-react';

interface PaymentLink {
  id: string;
  title: string;
  description?: string;
  amount: number;
  currency: string;
  service: string;
  paymentUrl: string;
  qrCodeUrl?: string;
  status: 'ACTIVE' | 'EXPIRED' | 'DISABLED' | 'COMPLETED';
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

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  const fetchPaymentLinks = async (page: number = 1) => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/payment-links?page=${page}&limit=10`);
      const result = await response.json();
      
      if (result.success) {
        setData(result.data);
      } else {
        setError(result.error || '決済リンクの取得に失敗しました');
      }
    } catch (error) {
      setError('ネットワークエラーが発生しました');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPaymentLinks(currentPage);
  }, [currentPage]);

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      ACTIVE: { variant: 'default' as const, icon: Clock, text: 'アクティブ' },
      COMPLETED: { variant: 'default' as const, icon: CheckCircle, text: '完了' },
      EXPIRED: { variant: 'secondary' as const, icon: XCircle, text: '期限切れ' },
      DISABLED: { variant: 'destructive' as const, icon: AlertCircle, text: '無効' },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.ACTIVE;
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
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
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

  const stats = data?.paymentLinks.reduce((acc, link) => {
    acc.total++;
    if (link.status === 'ACTIVE') acc.active++;
    if (link.status === 'COMPLETED') acc.completed++;
    acc.totalAmount += link.amount;
    return acc;
  }, { total: 0, active: 0, completed: 0, totalAmount: 0 }) || { total: 0, active: 0, completed: 0, totalAmount: 0 };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Header */}
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">決済リンクダッシュボード</h1>
          <p className="text-gray-600">生成した決済リンクの管理と分析</p>
        </div>
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

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">総リンク数</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <BarChart3 className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">アクティブ</p>
                <p className="text-2xl font-bold text-green-600">{stats.active}</p>
              </div>
              <Clock className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">完了</p>
                <p className="text-2xl font-bold text-blue-600">{stats.completed}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">総金額</p>
                <p className="text-2xl font-bold text-purple-600">
                  {formatCurrency(stats.totalAmount, 'jpy')}
                </p>
              </div>
              <DollarSign className="w-8 h-8 text-purple-600" />
            </div>
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