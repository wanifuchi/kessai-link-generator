import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  CheckCircle,
  XCircle,
  Plus,
  Clock,
  TrendingUp,
  AlertCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ActivityItem {
  type: 'link_created' | 'payment_completed' | 'payment_failed' | 'payment_pending';
  timestamp: string;
  data: {
    linkId?: string;
    title?: string;
    linkTitle?: string;
    transactionId?: string;
    amount?: number;
    currency?: string;
    reason?: string;
    customerEmail?: string;
  };
}

interface ActivityFeedProps {
  activities: ActivityItem[];
  loading?: boolean;
  className?: string;
}

export function ActivityFeed({ activities, loading = false, className }: ActivityFeedProps) {
  const getActivityIcon = (type: ActivityItem['type']) => {
    switch (type) {
      case 'link_created':
        return <Plus className="h-4 w-4 text-blue-500" />;
      case 'payment_completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'payment_failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'payment_pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getActivityTitle = (activity: ActivityItem) => {
    switch (activity.type) {
      case 'link_created':
        return `決済リンクを作成: ${activity.data.title || '無題'}`;
      case 'payment_completed':
        return `決済完了: ${formatCurrency(activity.data.amount || 0, activity.data.currency || 'JPY')}`;
      case 'payment_failed':
        return `決済失敗: ${activity.data.reason || '理由不明'}`;
      case 'payment_pending':
        return '決済処理中';
      default:
        return 'アクティビティ';
    }
  };

  const getActivityDescription = (activity: ActivityItem) => {
    switch (activity.type) {
      case 'link_created':
        return `金額: ${formatCurrency(activity.data.amount || 0, activity.data.currency || 'JPY')}`;
      case 'payment_completed':
        return `リンク: ${activity.data.linkTitle || 'Unknown'}`;
      case 'payment_failed':
        return `金額: ${formatCurrency(activity.data.amount || 0, activity.data.currency || 'JPY')}`;
      default:
        return '';
    }
  };

  const getActivityBadge = (type: ActivityItem['type']) => {
    switch (type) {
      case 'link_created':
        return <Badge variant="secondary" className="text-xs">新規</Badge>;
      case 'payment_completed':
        return <Badge variant="default" className="text-xs bg-green-100 text-green-800">完了</Badge>;
      case 'payment_failed':
        return <Badge variant="destructive" className="text-xs">失敗</Badge>;
      case 'payment_pending':
        return <Badge variant="outline" className="text-xs">処理中</Badge>;
      default:
        return null;
    }
  };

  const formatCurrency = (amount: number, currency: string) => {
    const symbol = currency === 'JPY' ? '¥' : currency === 'USD' ? '$' : currency;
    return `${symbol}${amount.toLocaleString()}`;
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'たった今';
    if (diffMins < 60) return `${diffMins}分前`;
    if (diffHours < 24) return `${diffHours}時間前`;
    if (diffDays < 7) return `${diffDays}日前`;

    return date.toLocaleDateString('ja-JP');
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>最近のアクティビティ</CardTitle>
          <CardDescription>リアルタイムの決済活動</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center space-x-4 animate-pulse">
                <div className="h-10 w-10 bg-gray-200 rounded-full" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4" />
                  <div className="h-3 bg-gray-200 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!activities || activities.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>最近のアクティビティ</CardTitle>
          <CardDescription>リアルタイムの決済活動</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            まだアクティビティがありません
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          最近のアクティビティ
          <Badge variant="secondary" className="ml-2">
            <TrendingUp className="h-3 w-3 mr-1" />
            {activities.length}件
          </Badge>
        </CardTitle>
        <CardDescription>リアルタイムの決済活動</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4 max-h-[400px] overflow-y-auto">
          {activities.map((activity, index) => (
            <div
              key={`${activity.type}-${activity.timestamp}-${index}`}
              className={cn(
                'flex items-start space-x-4 p-3 rounded-lg transition-colors',
                'hover:bg-gray-50 cursor-pointer'
              )}
            >
              <div className="flex-shrink-0 mt-1">
                <div className="p-2 bg-white rounded-full shadow-sm">
                  {getActivityIcon(activity.type)}
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {getActivityTitle(activity)}
                  </p>
                  {getActivityBadge(activity.type)}
                </div>
                {getActivityDescription(activity) && (
                  <p className="text-xs text-gray-500 mt-1">
                    {getActivityDescription(activity)}
                  </p>
                )}
                <p className="text-xs text-gray-400 mt-1">
                  {formatTimestamp(activity.timestamp)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}