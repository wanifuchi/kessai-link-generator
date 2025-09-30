import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LucideIcon, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatsCardProps {
  title: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  icon: LucideIcon;
  iconColor?: string;
  format?: 'currency' | 'number' | 'percentage';
  currency?: string;
  loading?: boolean;
}

export function StatsCard({
  title,
  value,
  change,
  changeLabel,
  icon: Icon,
  iconColor = 'text-blue-600',
  format = 'number',
  currency = '¥',
  loading = false
}: StatsCardProps) {
  const formatValue = () => {
    if (loading) return '---';

    switch (format) {
      case 'currency':
        return `${currency}${typeof value === 'number' ? value.toLocaleString() : value}`;
      case 'percentage':
        return `${value}%`;
      case 'number':
      default:
        return typeof value === 'number' ? value.toLocaleString() : value;
    }
  };

  const getTrendIcon = () => {
    if (change === undefined || change === 0) {
      return <Minus className="h-4 w-4 text-gray-400" />;
    }
    return change > 0 ? (
      <TrendingUp className="h-4 w-4 text-green-500" />
    ) : (
      <TrendingDown className="h-4 w-4 text-red-500" />
    );
  };

  const getTrendColor = () => {
    if (change === undefined || change === 0) return 'text-gray-600';
    return change > 0 ? 'text-green-600' : 'text-red-600';
  };

  return (
    <Card className="relative overflow-hidden hover:shadow-lg transition-shadow">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-gray-600">
            {title}
          </CardTitle>
          <div className={cn('p-2 rounded-lg bg-opacity-10', iconColor.replace('text-', 'bg-'))}>
            <Icon className={cn('h-4 w-4', iconColor)} />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-baseline justify-between">
          <div className="space-y-1">
            <p className={cn(
              'text-2xl font-bold tracking-tight',
              loading && 'animate-pulse'
            )}>
              {formatValue()}
            </p>
            {change !== undefined && changeLabel && (
              <div className="flex items-center gap-1">
                {getTrendIcon()}
                <span className={cn('text-xs', getTrendColor())}>
                  {Math.abs(change)}% {changeLabel}
                </span>
              </div>
            )}
          </div>
        </div>
      </CardContent>

      {/* 装飾的な背景グラデーション */}
      <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-blue-50/20 pointer-events-none" />
    </Card>
  );
}

// 複数の統計カードをグリッド表示するコンポーネント
export function StatsGrid({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {children}
    </div>
  );
}