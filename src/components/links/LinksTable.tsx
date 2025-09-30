'use client';

import React, { useState } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
  SortingState,
} from '@tanstack/react-table';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { PaymentLinkWithDetails } from '@/types/link';
import { getColumns } from './columns';

interface LinksTableProps {
  data: PaymentLinkWithDetails[];
  onEdit?: (link: PaymentLinkWithDetails) => void;
  onDuplicate?: (link: PaymentLinkWithDetails) => void;
  onDelete?: (link: PaymentLinkWithDetails) => void;
  onUpdateTitle?: (id: string, newTitle: string) => Promise<void>;
  onSelectionChange?: (selectedIds: string[]) => void;
}

export function LinksTable({
  data,
  onEdit,
  onDuplicate,
  onDelete,
  onUpdateTitle,
  onSelectionChange,
}: LinksTableProps) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [editingRowId, setEditingRowId] = useState<string | null>(null);
  const [rowSelection, setRowSelection] = useState({});

  const columns = getColumns();

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      rowSelection,
    },
    onSortingChange: setSorting,
    onRowSelectionChange: (updater) => {
      setRowSelection(updater);
      
      // 選択変更を親に通知
      if (onSelectionChange) {
        const newSelection = typeof updater === 'function' ? updater(rowSelection) : updater;
        const selectedIds = Object.keys(newSelection).filter(key => newSelection[key]);
        const selectedLinks = data.filter((_, index) => selectedIds.includes(String(index)));
        onSelectionChange(selectedLinks.map(link => link.id));
      }
    },
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    meta: {
      editingRowId,
      setEditingRowId,
      updateTitle: async (id: string, newTitle: string) => {
        if (onUpdateTitle) {
          await onUpdateTitle(id, newTitle);
        }
      },
      onEdit,
      onDuplicate,
      onDelete,
      showToast: (message: string) => {
        // トースト通知（後で実装）
        console.log(message);
      },
    },
  });

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <TableHead key={header.id}>
                  {header.isPlaceholder
                    ? null
                    : flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows?.length ? (
            table.getRowModel().rows.map((row) => (
              <TableRow
                key={row.id}
                data-state={row.getIsSelected() && 'selected'}
                className="hover:bg-gray-50"
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={columns.length} className="h-24 text-center">
                データがありません
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
