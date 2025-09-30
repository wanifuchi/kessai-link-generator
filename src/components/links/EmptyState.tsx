import React from 'react';
import { Plus, FileX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface EmptyStateProps {
  onCreateClick: () => void;
}

export function EmptyState({ onCreateClick }: EmptyStateProps) {
  return (
    <Card className="border-dashed border-2">
      <CardContent className="flex flex-col items-center justify-center py-16 px-4">
        <div className="rounded-full bg-gray-100 p-6 mb-4">
          <FileX className="h-12 w-12 text-gray-400" />
        </div>
        
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          決済リンクがありません
        </h3>
        
        <p className="text-sm text-gray-600 text-center mb-6 max-w-md">
          まだ決済リンクが作成されていません。<br />
          新しい決済リンクを作成して、決済の受付を開始しましょう。
        </p>
        
        <Button onClick={onCreateClick} size="lg">
          <Plus className="h-5 w-5 mr-2" />
          決済リンクを作成
        </Button>
      </CardContent>
    </Card>
  );
}
