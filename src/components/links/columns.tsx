'use client';

import { ColumnDef } from '@tanstack/react-table';
import { format } from 'date-fns';
import { MoreHorizontal, Edit, Copy, Trash2, ExternalLink } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { PaymentLinkWithDetails } from '@/types/link';
import { PaymentStatus } from '@prisma/client';

// ステータスバッジのvariantマッピング
const statusVariantMap: Record<PaymentStatus, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  succeeded: 'default',
  pending: 'secondary',
  failed: 'destructive',
  cancelled: 'outline',
  expired: 'outline',
};

// ステータスラベルの日本語マッピング
const statusLabelMap: Record<PaymentStatus, string> = {
  succeeded: '成功',
  pending: '待機中',
  failed: '失敗',
  cancelled: 'キャンセル',
  expired: '期限切れ',
};

export function getColumns(): ColumnDef<PaymentLinkWithDetails>[] {
  return [
    // 選択列
    {
      id: 'select',
      header: ({ table }) => (
        <Checkbox
          checked={table.getIsAllPageRowsSelected()}
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="すべて選択"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="行を選択"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },

    // タイトル列（インライン編集対応）
    {
      accessorKey: 'title',
      header: 'タイトル',
      cell: ({ row, table }) => {
        const meta = table.options.meta as any;
        const isEditing = meta?.editingRowId === row.original.id;

        if (isEditing) {
          return (
            <Input
              defaultValue={row.getValue('title')}
              onBlur={(e) => {
                meta?.updateTitle(row.original.id, e.target.value);
                meta?.setEditingRowId(null);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  meta?.updateTitle(row.original.id, e.currentTarget.value);
                  meta?.setEditingRowId(null);
                } else if (e.key === 'Escape') {
                  meta?.setEditingRowId(null);
                }
              }}
              autoFocus
              className="h-8"
            />
          );
        }

        return (
          <div
            onClick={() => meta?.setEditingRowId(row.original.id)}
            className="cursor-pointer hover:text-blue-600 transition-colors max-w-xs truncate"
            title={row.getValue('title')}
          >
            {row.getValue('title') || '無題'}
          </div>
        );
      },
    },

    // 金額列
    {
      accessorKey: 'amount',
      header: () => <div className="text-right">金額</div>,
      cell: ({ row }) => {
        const amount = parseFloat(row.getValue('amount'));
        const currency = row.original.currency.toUpperCase();
        const formatted = new Intl.NumberFormat('ja-JP', {
          style: 'currency',
          currency: currency,
        }).format(amount);

        return <div className="text-right font-medium">{formatted}</div>;
      },
    },

    // ステータス列
    {
      accessorKey: 'status',
      header: () => <div className="hidden md:table-cell">ステータス</div>,
      cell: ({ row }) => {
        const status = row.getValue('status') as PaymentStatus;
        return (
          <div className="hidden md:table-cell">
            <Badge variant={statusVariantMap[status]}>
              {statusLabelMap[status]}
            </Badge>
          </div>
        );
      },
    },

    // サービス列
    {
      accessorKey: 'service',
      header: () => <div className="hidden lg:table-cell">サービス</div>,
      cell: ({ row }) => {
        const service = row.original.paymentConfig.provider;
        return (
          <div className="hidden lg:table-cell">
            <Badge variant="outline" className="capitalize">
              {service}
            </Badge>
          </div>
        );
      },
    },

    // 作成日列
    {
      accessorKey: 'createdAt',
      header: () => <div className="hidden lg:table-cell">作成日</div>,
      cell: ({ row }) => {
        const date = row.getValue('createdAt') as Date;
        return (
          <div className="hidden lg:table-cell text-sm text-gray-600">
            {format(new Date(date), 'yyyy/MM/dd HH:mm')}
          </div>
        );
      },
    },

    // アクション列
    {
      id: 'actions',
      cell: ({ row }) => {
        const link = row.original;
        const meta = table.options.meta as any;

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">メニューを開く</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>アクション</DropdownMenuLabel>
              
              <DropdownMenuItem
                onClick={() => {
                  navigator.clipboard.writeText(link.paymentUrl);
                  meta?.showToast?.('URLをコピーしました');
                }}
              >
                <ExternalLink className="mr-2 h-4 w-4" />
                URLをコピー
              </DropdownMenuItem>

              <DropdownMenuSeparator />

              <DropdownMenuItem onClick={() => meta?.onEdit?.(link)}>
                <Edit className="mr-2 h-4 w-4" />
                編集
              </DropdownMenuItem>

              <DropdownMenuItem onClick={() => meta?.onDuplicate?.(link)}>
                <Copy className="mr-2 h-4 w-4" />
                複製
              </DropdownMenuItem>

              <DropdownMenuSeparator />

              <DropdownMenuItem
                onClick={() => meta?.onDelete?.(link)}
                className="text-red-600"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                削除
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];
}
