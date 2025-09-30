'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, RefreshCw } from 'lucide-react';
import { useAuth } from '@/app/providers';
import { Button } from '@/components/ui/button';
import { error as showError, success } from '@/hooks/use-toast';
import { LinksTable } from '@/components/links/LinksTable';
import { LinksCards } from '@/components/links/LinksCards';
import { EmptyState } from '@/components/links/EmptyState';
import { ViewModeToggle } from '@/components/links/ViewModeToggle';
import { LinkSearch } from '@/components/links/LinkSearch';
import { LinkFilters } from '@/components/links/LinkFilters';
import { BulkActions } from '@/components/links/BulkActions';
import { DashboardLoadingOverlay } from '@/components/loading';
import { PaymentLinkWithDetails, ViewMode, LinkFilters as LinkFiltersType, BulkAction } from '@/types/link';
import { useDebounce } from '@/hooks/useDebounce';

export default function LinksPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [links, setLinks] = useState<PaymentLinkWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('table');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<LinkFiltersType>({});

  const debouncedSearch = useDebounce(searchQuery, 500);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/signin');
    }
  }, [user, authLoading, router]);

  const fetchLinks = useCallback(async (showLoadingState = true) => {
    if (showLoadingState) {
      setLoading(true);
    } else {
      setRefreshing(true);
    }

    try {
      const params = new URLSearchParams({
        page: '1',
        limit: '100',
      });

      if (debouncedSearch) {
        params.append('search', debouncedSearch);
      }

      if (filters.status && filters.status.length > 0) {
        params.append('status', filters.status.join(','));
      }

      if (filters.service && filters.service.length > 0) {
        params.append('service', filters.service.join(','));
      }

      const response = await fetch(`/api/payment-links?${params.toString()}`, {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('決済リンクの取得に失敗しました');
      }

      const data = await response.json();

      if (data.success && data.data) {
        setLinks(data.data.paymentLinks);
      } else {
        throw new Error(data.error || '決済リンクの取得に失敗しました');
      }
    } catch (error: any) {
      console.error('Links fetch error:', error);
      showError(error.message || '決済リンクの取得に失敗しました');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [debouncedSearch, filters]);

  useEffect(() => {
    if (!authLoading && user) {
      fetchLinks(false);
    }
  }, [authLoading, user, debouncedSearch, filters, fetchLinks]);

  const handleRefresh = () => {
    fetchLinks(false);
  };

  const handleCreate = () => {
    router.push('/create');
  };

  const handleEdit = (link: PaymentLinkWithDetails) => {
    console.log('Edit link:', link.id);
  };

  const handleDuplicate = (link: PaymentLinkWithDetails) => {
    console.log('Duplicate link:', link.id);
  };

  const handleDelete = (link: PaymentLinkWithDetails) => {
    console.log('Delete link:', link.id);
  };

  const handleUpdateTitle = async (id: string, newTitle: string) => {
    try {
      const response = await fetch(`/api/payment-links/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ description: newTitle }),
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('タイトルの更新に失敗しました');
      }

      success('タイトルを更新しました');
      fetchLinks(false);
    } catch (error: any) {
      showError(error.message || 'タイトルの更新に失敗しました');
    }
  };

  const handleBulkAction = async (action: BulkAction) => {
    try {
      const response = await fetch('/api/payment-links/bulk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action,
          ids: selectedIds,
        }),
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('一括操作に失敗しました');
      }

      const data = await response.json();

      if (data.success) {
        success(`${data.data.updated}件の操作が完了しました`);
        setSelectedIds([]);
        fetchLinks(false);
      } else {
        throw new Error(data.error || '一括操作に失敗しました');
      }
    } catch (error: any) {
      showError(error.message || '一括操作に失敗しました');
    }
  };

  if (authLoading || loading) {
    return <DashboardLoadingOverlay />;
  }

  if (!user) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-8">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">決済リンク管理</h1>
              <p className="text-gray-600 mt-1">
                {links.length}件の決済リンク
              </p>
            </div>

            <div className="flex items-center gap-2">
              <ViewModeToggle
                viewMode={viewMode}
                onViewModeChange={setViewMode}
              />

              <Button
                onClick={handleRefresh}
                variant="outline"
                size="sm"
                disabled={refreshing}
              >
                <RefreshCw className={'h-4 w-4 mr-1 ' + (refreshing ? 'animate-spin' : '')} />
                更新
              </Button>

              <Button onClick={handleCreate} size="sm">
                <Plus className="h-4 w-4 mr-1" />
                新規作成
              </Button>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            <LinkSearch
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="タイトルやURLで検索..."
            />
            <LinkFilters
              filters={filters}
              onFiltersChange={setFilters}
            />
          </div>
        </div>
      </div>

      {selectedIds.length > 0 && (
        <BulkActions
          selectedCount={selectedIds.length}
          onBulkAction={handleBulkAction}
        />
      )}

      {links.length === 0 ? (
        <EmptyState onCreateClick={handleCreate} />
      ) : viewMode === 'table' ? (
        <LinksTable
          data={links}
          onEdit={handleEdit}
          onDuplicate={handleDuplicate}
          onDelete={handleDelete}
          onUpdateTitle={handleUpdateTitle}
          onSelectionChange={setSelectedIds}
        />
      ) : (
        <LinksCards
          data={links}
          selectedIds={selectedIds}
          onSelectionChange={setSelectedIds}
          onEdit={handleEdit}
          onDuplicate={handleDuplicate}
          onDelete={handleDelete}
        />
      )}
    </div>
  );
}
