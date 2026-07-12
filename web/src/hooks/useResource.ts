'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { useDebounce } from './useDebounce';
import type { Paginated } from '@/types';

// The data engine for list pages, built on TanStack Query. Manages search
// (debounced), sort, filters, and pagination, and exposes save/remove mutations
// that invalidate the cache automatically.
export function useResource<T extends { id: string }>(path: string, opts?: { initialSort?: string; limit?: number }) {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);
  const [sort, setSort] = useState(opts?.initialSort ?? '-createdAt');
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [page, setPage] = useState(1);

  // A board/Kanban view needs the whole set at once, not one page — callers pass
  // a larger limit for that. Defaults to the API's own page size when unset.
  const params = clean({ q: debouncedSearch, sort, page, limit: opts?.limit, ...filters });

  const query = useQuery({
    queryKey: [path, params],
    queryFn: () => api.get<Paginated<T>>(path, params),
    placeholderData: keepPreviousData,
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: [path] });
  const createM = useMutation({ mutationFn: (data: Partial<T>) => api.post<T>(path, data), onSuccess: invalidate });
  const updateM = useMutation({ mutationFn: (v: { id: string; data: Partial<T> }) => api.patch<T>(`${path}/${v.id}`, v.data), onSuccess: invalidate });
  const removeM = useMutation({ mutationFn: (id: string) => api.del(`${path}/${id}`), onSuccess: invalidate });

  const resetPage = () => setPage(1);

  return {
    rows: query.data?.data ?? [],
    total: query.data?.total ?? 0,
    page: query.data?.page ?? page,
    pages: query.data?.pages ?? 1,
    loading: query.isLoading,
    error: (query.error as { message: string } | null) ?? null,
    refresh: () => void query.refetch(),

    search,
    setSearch: (v: string) => {
      resetPage();
      setSearch(v);
    },
    sort,
    toggleSort: (key: string) => {
      resetPage();
      setSort((s) => (s === key ? `-${key}` : key));
    },
    filters,
    setFilter: (key: string, value: string) => {
      resetPage();
      setFilters((f) => ({ ...f, [key]: value }));
    },
    setPage,

    save: (data: Partial<T>, editing?: { id?: string } | null) =>
      editing?.id ? updateM.mutateAsync({ id: editing.id, data }) : createM.mutateAsync(data),
    remove: (row: T) => removeM.mutateAsync(row.id),
  };
}

function clean(obj: Record<string, unknown>): Record<string, string | number> {
  return Object.fromEntries(
    Object.entries(obj).filter(([, v]) => v !== undefined && v !== null && v !== '')
  ) as Record<string, string | number>;
}
