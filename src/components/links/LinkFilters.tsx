'use client';

import React from 'react';
import { Filter, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { LinkFilters as LinkFiltersType } from '@/types/link';
import { PaymentStatus, PaymentService } from '@prisma/client';

const statusLabels: Record<PaymentStatus, string> = {
  succeeded: '成功',
  pending: '待機中',
  failed: '失敗',
  cancelled: 'キャンセル',
  expired: '期限切れ',
};

const serviceLabels: Record<PaymentService, string> = {
  stripe: 'Stripe',
  paypal: 'PayPal',
  square: 'Square',
  paypay: 'PayPay',
  fincode: 'fincode',
};

interface LinkFiltersProps {
  filters: LinkFiltersType;
  onFiltersChange: (filters: LinkFiltersType) => void;
}

export function LinkFilters({ filters, onFiltersChange }: LinkFiltersProps) {
  const toggleStatus = (status: PaymentStatus) => {
    const currentStatuses = filters.status || [];
    const newStatuses = currentStatuses.includes(status)
      ? currentStatuses.filter((s) => s !== status)
      : [...currentStatuses, status];
    
    onFiltersChange({ ...filters, status: newStatuses.length > 0 ? newStatuses : undefined });
  };

  const toggleService = (service: PaymentService) => {
    const currentServices = filters.service || [];
    const newServices = currentServices.includes(service)
      ? currentServices.filter((s) => s !== service)
      : [...currentServices, service];
    
    onFiltersChange({ ...filters, service: newServices.length > 0 ? newServices : undefined });
  };

  const clearAllFilters = () => {
    onFiltersChange({});
  };

  const activeFilterCount = 
    (filters.status?.length || 0) + 
    (filters.service?.length || 0);

  return (
    <div className="flex items-center gap-2">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4 mr-2" />
            フィルター
            {activeFilterCount > 0 && (
              <Badge variant="secondary" className="ml-2 h-5 w-5 p-0 flex items-center justify-center">
                {activeFilterCount}
              </Badge>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>ステータス</DropdownMenuLabel>
          {Object.entries(statusLabels).map(([status, label]) => (
            <DropdownMenuCheckboxItem
              key={status}
              checked={filters.status?.includes(status as PaymentStatus)}
              onCheckedChange={() => toggleStatus(status as PaymentStatus)}
            >
              {label}
            </DropdownMenuCheckboxItem>
          ))}

          <DropdownMenuSeparator />

          <DropdownMenuLabel>決済サービス</DropdownMenuLabel>
          {Object.entries(serviceLabels).map(([service, label]) => (
            <DropdownMenuCheckboxItem
              key={service}
              checked={filters.service?.includes(service as PaymentService)}
              onCheckedChange={() => toggleService(service as PaymentService)}
            >
              {label}
            </DropdownMenuCheckboxItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {activeFilterCount > 0 && (
        <Button
          variant="ghost"
          size="sm"
          onClick={clearAllFilters}
          className="h-8"
        >
          <X className="h-4 w-4 mr-1" />
          クリア
        </Button>
      )}
    </div>
  );
}
