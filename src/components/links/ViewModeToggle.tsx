import React from 'react';
import { Table, LayoutGrid } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ViewMode } from '@/types/link';

interface ViewModeToggleProps {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
}

export function ViewModeToggle({ viewMode, onViewModeChange }: ViewModeToggleProps) {
  return (
    <div className="flex items-center gap-1 border rounded-lg p-1">
      <Button
        variant={viewMode === 'table' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => onViewModeChange('table')}
        className="h-8 px-3"
      >
        <Table className="h-4 w-4" />
        <span className="ml-2 hidden sm:inline">テーブル</span>
      </Button>
      
      <Button
        variant={viewMode === 'card' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => onViewModeChange('card')}
        className="h-8 px-3"
      >
        <LayoutGrid className="h-4 w-4" />
        <span className="ml-2 hidden sm:inline">カード</span>
      </Button>
    </div>
  );
}
