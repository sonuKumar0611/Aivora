'use client';

import { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Eye, Pencil, Trash2, Search } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { clsx } from 'clsx';

export interface DataTableColumn<T> {
  id: string;
  label: string;
  render?: (row: T) => React.ReactNode;
  accessor?: keyof T | ((row: T) => React.ReactNode);
  headerClassName?: string;
  cellClassName?: string;
}

export interface DataTableActionHandlers<T> {
  onView?: (row: T) => void;
  onEdit?: (row: T) => void;
  onDelete?: (row: T) => void;
}

export interface DataTableProps<T> {
  /** Column definitions */
  columns: DataTableColumn<T>[];
  /** Data rows */
  data: T[];
  /** Unique key for each row */
  getRowId: (row: T) => string;
  /** View / Edit / Delete – only show buttons for provided handlers */
  actions?: DataTableActionHandlers<T>;
  /** Page size options */
  pageSizeOptions?: number[];
  /** Show search input; filter runs client-side on this field (or whole row if getSearchableText provided) */
  searchPlaceholder?: string;
  /** Optional: return searchable string for row. If not set, we use column accessors. */
  getSearchableText?: (row: T) => string;
  /** Loading state */
  isLoading?: boolean;
  /** Empty state when no data (after filtering) */
  emptyMessage?: React.ReactNode;
  /** Optional table title (e.g. "Bots" or "Knowledge sources") */
  title?: string;
  /** Optional description below title */
  description?: string;
  /** Optional extra header content (e.g. "Add knowledge" button) */
  headerAction?: React.ReactNode;
  /** Compact rows */
  compact?: boolean;
  /** When true, table fills available height with scrollable body (for dashboard layouts) */
  fillHeight?: boolean;
  className?: string;
}

const DEFAULT_PAGE_SIZES = [10, 20, 50];

export function DataTable<T>({
  columns,
  data,
  getRowId,
  actions,
  pageSizeOptions = DEFAULT_PAGE_SIZES,
  searchPlaceholder = 'Search...',
  getSearchableText,
  isLoading = false,
  emptyMessage = 'No data',
  title,
  description,
  headerAction,
  compact = false,
  fillHeight = false,
  className,
}: DataTableProps<T>) {
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(pageSizeOptions[0]);
  const [search, setSearch] = useState('');

  const filteredData = useMemo(() => {
    if (!search.trim()) return data;
    const q = search.trim().toLowerCase();
    if (getSearchableText) {
      return data.filter((row) => getSearchableText(row).toLowerCase().includes(q));
    }
    return data.filter((row) => {
      return columns.some((col) => {
        const val = col.accessor
          ? typeof col.accessor === 'function'
            ? (col.accessor as (r: T) => unknown)(row)
            : (row[col.accessor as keyof T] as unknown)
          : null;
        return String(val ?? '').toLowerCase().includes(q);
      });
    });
  }, [data, search, columns, getSearchableText]);

  const totalPages = Math.max(1, Math.ceil(filteredData.length / pageSize));
  const safePage = totalPages > 0 ? Math.min(page, totalPages - 1) : 0;
  const start = safePage * pageSize;
  const pageData = filteredData.slice(start, start + pageSize);

  const hasActions = actions && (actions.onView || actions.onEdit || actions.onDelete);

  return (
    <div
      className={clsx(
        'rounded-xl border border-brand-border bg-brand-bgCard overflow-hidden',
        fillHeight && 'flex flex-col h-full min-h-0',
        className
      )}
    >
      {(title || description || (searchPlaceholder && searchPlaceholder.length > 0) || headerAction) && (
        <div className="p-4 sm:p-5 border-b border-brand-border flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between shrink-0">
          <div>
            {title && <h2 className="text-lg font-semibold text-brand-textHeading">{title}</h2>}
            {description && <p className="text-sm text-brand-textMuted mt-0.5">{description}</p>}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {searchPlaceholder && searchPlaceholder.length > 0 && (
              <div className="relative flex-1 sm:flex-initial min-w-[180px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-textMuted pointer-events-none" />
                <input
                  type="search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={searchPlaceholder}
                  className="w-full pl-9 pr-3 py-2 rounded-lg border border-brand-borderLight bg-brand-sidebar text-brand-text text-sm placeholder-brand-textDisabled focus:ring-2 focus:ring-brand-primary focus:border-transparent"
                />
              </div>
            )}
            {headerAction != null && <div className="shrink-0">{headerAction}</div>}
          </div>
        </div>
      )}

      <div
        className={clsx(
          'overflow-x-auto',
          fillHeight && 'flex-1 min-h-0 overflow-auto'
        )}
      >
        {isLoading ? (
          <div className="p-4 space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-12 w-full rounded-lg" />
            ))}
          </div>
        ) : pageData.length === 0 ? (
          <div className="p-8 flex justify-center">{emptyMessage}</div>
        ) : (
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-brand-border bg-brand-divider/50">
                {columns.map((col) => (
                  <th
                    key={col.id}
                    className={clsx(
                      'text-left font-medium text-brand-textMuted text-xs uppercase tracking-wider',
                      compact ? 'px-3 py-2' : 'px-4 py-3',
                      col.headerClassName
                    )}
                  >
                    {col.label}
                  </th>
                ))}
                {hasActions && (
                  <th
                    className={clsx(
                      'text-right font-medium text-brand-textMuted text-xs uppercase tracking-wider',
                      compact ? 'px-3 py-2' : 'px-4 py-3',
                      'w-[140px]'
                    )}
                  >
                    Actions
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              {pageData.map((row) => (
                <tr
                  key={getRowId(row)}
                  className="border-b border-brand-border last:border-b-0 hover:bg-brand-bgCardHover transition-colors"
                >
                  {columns.map((col) => {
                    let content: React.ReactNode;
                    if (col.render) {
                      content = col.render(row);
                    } else if (col.accessor) {
                      const val =
                        typeof col.accessor === 'function'
                          ? (col.accessor as (r: T) => React.ReactNode)(row)
                          : (row[col.accessor as keyof T] as React.ReactNode);
                      content = val ?? '—';
                    } else {
                      content = '—';
                    }
                    return (
                      <td
                        key={col.id}
                        className={clsx(
                          'text-brand-text text-sm',
                          compact ? 'px-3 py-2' : 'px-4 py-3',
                          col.cellClassName
                        )}
                      >
                        {content}
                      </td>
                    );
                  })}
                  {hasActions && (
                    <td
                      className={clsx(
                        'text-right',
                        compact ? 'px-3 py-2' : 'px-4 py-3'
                      )}
                    >
                      <div className="flex items-center justify-end gap-1">
                        {actions!.onView && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => actions!.onView!(row)}
                            title="View"
                            className="!p-2"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                        )}
                        {actions!.onEdit && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => actions!.onEdit!(row)}
                            title="Edit"
                            className="!p-2"
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                        )}
                        {actions!.onDelete && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => actions!.onDelete!(row)}
                            title="Delete"
                            className="!p-2 text-brand-error hover:bg-brand-error/10 hover:text-brand-error"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {!isLoading && filteredData.length > 0 && (
        <div className="px-4 py-3 border-t border-brand-border flex flex-wrap items-center justify-between gap-2 bg-brand-divider/30 shrink-0">
          <div className="flex items-center gap-2 text-sm text-brand-textMuted">
            <span>
              Showing {filteredData.length === 0 ? 0 : start + 1}–{Math.min(start + pageSize, filteredData.length)} of {filteredData.length}
            </span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setPage(0);
              }}
              className="rounded-md border border-brand-borderLight bg-brand-sidebar px-2 py-1 text-brand-text text-sm focus:ring-2 focus:ring-brand-primary"
            >
              {pageSizeOptions.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
            <span>per page</span>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={safePage === 0}
              className="!p-2"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="px-2 text-sm text-brand-textMuted">
              Page {safePage + 1} of {totalPages}
            </span>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={safePage >= totalPages - 1}
              className="!p-2"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
