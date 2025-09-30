'use client';

import React from 'react';
import { format } from 'date-fns';
import { ExternalLink, Edit, Copy, Trash2, Calendar, DollarSign, CheckCircle2, MoreVertical } from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { PaymentLinkWithDetails } from '@/types/link';
import { PaymentStatus } from '@prisma/client';

const statusVariantMap: Record<PaymentStatus, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  succeeded: 'default',
  pending: 'secondary',
  failed: 'destructive',
  cancelled: 'outline',
  expired: 'outline',
};

const statusLabelMap: Record<PaymentStatus, string> = {
  succeeded: '成功',
  pending: '待機中',
  failed: '失敗',
  cancelled: 'キャンセル',
  expired: '期限切れ',
};

interface LinksCardsProps {
  data: PaymentLinkWithDetails[];
  selectedIds: string[];
  onSelectionChange: (ids: string[]) => void;
  onEdit?: (link: PaymentLinkWithDetails) => void;
  onDuplicate?: (link: PaymentLinkWithDetails) => void;
  onDelete?: (link: PaymentLinkWithDetails) => void;
}

export function LinksCards({
  data,
  selectedIds,
  onSelectionChange,
  onEdit,
  onDuplicate,
  onDelete,
}: LinksCardsProps) {
  const toggleSelection = (id: string) => {
    if (selectedIds.includes(id)) {
      onSelectionChange(selectedIds.filter(selectedId => selectedId !== id));
    } else {
      onSelectionChange([...selectedIds, id]);
    }
  };

  const handleCopyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    console.log('URLをコピーしました');
  };

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {data.map((link) => {
        const isSelected = selectedIds.includes(link.id);
        const amount = new Intl.NumberFormat('ja-JP', {
          style: 'currency',
          currency: link.currency.toUpperCase(),
        }).format(link.amount);

        return (
          <Card
            key={link.id}
            className={'relative transition-all hover:shadow-md ' + (isSelected ? 'ring-2 ring-blue-500' : '')}
          >
            <div className="absolute top-4 left-4 z-10">
              <Checkbox
                checked={isSelected}
                onCheckedChange={() => toggleSelection(link.id)}
              />
            </div>

            <CardHeader className="pb-3 pt-12">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-lg truncate mb-1">
                    {link.title || '無題'}
                  </h3>
                  {link.description && (
                    <p className="text-sm text-gray-600 line-clamp-2">
                      {link.description}
                    </p>
                  )}
                </div>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <span className="sr-only">メニューを開く</span>
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>アクション</DropdownMenuLabel>
                    <DropdownMenuItem onClick={() => handleCopyUrl(link.paymentUrl)}>
                      <ExternalLink className="mr-2 h-4 w-4" />
                      URLをコピー
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => onEdit?.(link)}>
                      <Edit className="mr-2 h-4 w-4" />
                      編集
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onDuplicate?.(link)}>
                      <Copy className="mr-2 h-4 w-4" />
                      複製
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => onDelete?.(link)}
                      className="text-red-600"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      削除
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardHeader>

            <CardContent className="pb-3">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-gray-500" />
                  <span className="text-xl font-bold">{amount}</span>
                </div>
                <Badge variant={statusVariantMap[link.status]}>
                  {statusLabelMap[link.status]}
                </Badge>
              </div>

              <div className="flex items-center gap-2 mb-2">
                <Badge variant="outline" className="capitalize">
                  {link.paymentConfig.provider}
                </Badge>
                {link.paymentConfig.isTestMode && (
                  <Badge variant="secondary" className="text-xs">
                    テストモード
                  </Badge>
                )}
              </div>

              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Calendar className="h-4 w-4" />
                <span>{format(new Date(link.createdAt), 'yyyy/MM/dd HH:mm')}</span>
              </div>

              {link.expiresAt && (
                <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                  <span className="text-xs">有効期限:</span>
                  <span>{format(new Date(link.expiresAt), 'yyyy/MM/dd HH:mm')}</span>
                </div>
              )}

              {link.completedAt && (
                <div className="flex items-center gap-2 text-sm text-green-600 mt-1">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>{format(new Date(link.completedAt), 'yyyy/MM/dd HH:mm')}</span>
                </div>
              )}
            </CardContent>

            <CardFooter className="pt-3 border-t">
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => handleCopyUrl(link.paymentUrl)}
              >
                <ExternalLink className="mr-2 h-4 w-4" />
                URLをコピー
              </Button>
            </CardFooter>
          </Card>
        );
      })}
    </div>
  );
}
