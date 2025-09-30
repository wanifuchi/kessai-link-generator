import React from 'react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar, Clock, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';

export type Period = '1' | '7' | '30' | '90' | '365' | 'custom';

interface PeriodFilterProps {
  selectedPeriod: Period;
  onPeriodChange: (period: Period) => void;
  className?: string;
  showQuickFilters?: boolean;
}

const periodOptions = [
  { value: '1', label: '今日', icon: Clock },
  { value: '7', label: '過去7日', icon: Calendar },
  { value: '30', label: '過去30日', icon: Calendar },
  { value: '90', label: '過去90日', icon: TrendingUp },
  { value: '365', label: '過去1年', icon: TrendingUp },
];

export function PeriodFilter({
  selectedPeriod,
  onPeriodChange,
  className,
  showQuickFilters = true
}: PeriodFilterProps) {
  return (
    <div className={cn('flex items-center gap-2', className)}>
      {showQuickFilters && (
        <>
          {/* クイックフィルターボタン */}
          <div className="hidden md:flex items-center gap-1">
            {periodOptions.slice(0, 3).map((option) => {
              const Icon = option.icon;
              return (
                <Button
                  key={option.value}
                  variant={selectedPeriod === option.value ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => onPeriodChange(option.value as Period)}
                  className="min-w-[80px]"
                >
                  <Icon className="h-3 w-3 mr-1" />
                  {option.label}
                </Button>
              );
            })}
          </div>
          <div className="h-6 w-px bg-gray-200 hidden md:block" />
        </>
      )}

      {/* セレクトボックス（すべてのオプション） */}
      <Select value={selectedPeriod} onValueChange={(value) => onPeriodChange(value as Period)}>
        <SelectTrigger className="w-[140px]">
          <SelectValue placeholder="期間を選択" />
        </SelectTrigger>
        <SelectContent>
          {periodOptions.map((option) => {
            const Icon = option.icon;
            return (
              <SelectItem key={option.value} value={option.value}>
                <div className="flex items-center">
                  <Icon className="h-4 w-4 mr-2" />
                  {option.label}
                </div>
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select>
    </div>
  );
}

// 期間選択タブコンポーネント（別スタイル）
export function PeriodTabs({
  selectedPeriod,
  onPeriodChange,
  className
}: PeriodFilterProps) {
  return (
    <div className={cn('inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground', className)}>
      {periodOptions.slice(0, 4).map((option) => (
        <button
          key={option.value}
          onClick={() => onPeriodChange(option.value as Period)}
          className={cn(
            'inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
            selectedPeriod === option.value
              ? 'bg-background text-foreground shadow-sm'
              : 'hover:bg-background/50'
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}